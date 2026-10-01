from datetime import date, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session


def overview(session: Session, organization_id: int, owner_id: int | None = None) -> dict:
    project_scope = "AND owner_id = :owner" if owner_id else ""
    task_scope = "AND project_id IN (SELECT id FROM projects WHERE owner_id = :owner)" if owner_id else ""
    params: dict = {"org": organization_id}
    if owner_id:
        params["owner"] = owner_id

    active_projects = session.execute(
        text(
            f"SELECT COUNT(*) FROM projects "
            f"WHERE organization_id = :org AND archived_at IS NULL "
            f"AND status IN ('upcoming','in_progress') {project_scope}"
        ),
        params,
    ).scalar_one()

    overdue_tasks = session.execute(
        text(
            f"SELECT COUNT(*) FROM tasks "
            f"WHERE organization_id = :org AND status != 'done' "
            f"AND due_date IS NOT NULL AND due_date < :today {task_scope}"
        ),
        {**params, "today": date.today().isoformat()},
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


def pipeline(session: Session, organization_id: int, owner_id: int | None = None) -> dict:
    scope = "AND owner_id = :owner" if owner_id else ""
    params: dict = {"org": organization_id}
    if owner_id:
        params["owner"] = owner_id

    rows = session.execute(
        text(
            f"SELECT stage, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount "
            f"FROM opportunities WHERE organization_id = :org {scope} "
            f"GROUP BY stage"
        ),
        params,
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
