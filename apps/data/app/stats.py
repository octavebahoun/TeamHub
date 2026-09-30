from datetime import date, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session


def overview(session: Session, organization_id: int) -> dict:
    active_projects = session.execute(
        text(
            "SELECT COUNT(*) FROM projects "
            "WHERE organization_id = :org AND archived_at IS NULL "
            "AND status IN ('upcoming','in_progress')"
        ),
        {"org": organization_id},
    ).scalar_one()

    overdue_tasks = session.execute(
        text(
            "SELECT COUNT(*) FROM tasks "
            "WHERE organization_id = :org AND status != 'done' "
            "AND due_date IS NOT NULL AND due_date < :today"
        ),
        {"org": organization_id, "today": date.today().isoformat()},
    ).scalar_one()

    workload = session.execute(
        text(
            "SELECT u.id AS user_id, u.name, COUNT(t.id) AS open_tasks "
            "FROM users u "
            "JOIN memberships m ON m.user_id = u.id AND m.organization_id = :org "
            "LEFT JOIN tasks t ON t.assignee_id = u.id "
            "  AND t.organization_id = :org AND t.status != 'done' "
            "GROUP BY u.id, u.name "
            "ORDER BY open_tasks DESC"
        ),
        {"org": organization_id},
    ).mappings().all()

    return {
        "active_projects": active_projects,
        "overdue_tasks": overdue_tasks,
        "workload": [dict(row) for row in workload],
    }


def pipeline(session: Session, organization_id: int) -> dict:
    rows = session.execute(
        text(
            "SELECT stage, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount "
            "FROM opportunities WHERE organization_id = :org "
            "GROUP BY stage"
        ),
        {"org": organization_id},
    ).mappings().all()

    return {
        "by_stage": [
            {"stage": r["stage"], "count": r["count"], "amount": float(r["amount"])}
            for r in rows
        ],
    }


def activity(session: Session, organization_id: int, days: int = 30) -> dict:
    since = (date.today() - timedelta(days=days)).isoformat()

    rows = session.execute(
        text(
            "SELECT DATE(created_at) AS day, action, COUNT(*) AS count "
            "FROM activities "
            "WHERE organization_id = :org AND created_at >= :since "
            "GROUP BY DATE(created_at), action "
            "ORDER BY day"
        ),
        {"org": organization_id, "since": since},
    ).mappings().all()

    return {"days": days, "events": [dict(r) for r in rows]}
