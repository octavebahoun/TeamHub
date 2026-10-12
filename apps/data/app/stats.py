from datetime import date, datetime, timedelta

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

    workload_task_scope = (
        "AND t.project_id IN (SELECT id FROM projects WHERE owner_id = :owner)" if owner_id else ""
    )
    workload = session.execute(
        text(
            f"SELECT u.id AS user_id, u.name, COUNT(t.id) AS open_tasks "
            f"FROM users u "
            f"JOIN memberships m ON m.user_id = u.id AND m.organization_id = :org "
            f"LEFT JOIN tasks t ON t.assignee_id = u.id "
            f"  AND t.organization_id = :org AND t.status != 'done' "
            f"  {workload_task_scope} "
            f"GROUP BY u.id, u.name "
            f"ORDER BY open_tasks DESC"
        ),
        params,
    ).mappings().all()

    today = date.today()
    completed_tasks = session.execute(
        text(
            f"SELECT COUNT(*) FROM tasks "
            f"WHERE organization_id = :org AND status = 'done' "
            f"AND completed_at IS NOT NULL AND completed_at >= :since {task_scope}"
        ),
        {**params, "since": (today - timedelta(days=30)).isoformat()},
    ).scalar_one()

    late_scope = "AND p.owner_id = :owner" if owner_id else ""
    late_projects = session.execute(
        text(
            f"SELECT p.id, p.name, COUNT(t.id) AS overdue "
            f"FROM projects p "
            f"JOIN tasks t ON t.project_id = p.id "
            f"WHERE p.organization_id = :org AND p.archived_at IS NULL "
            f"AND t.status != 'done' AND t.due_date IS NOT NULL AND t.due_date < :today "
            f"{late_scope} "
            f"GROUP BY p.id, p.name "
            f"ORDER BY overdue DESC, p.name"
        ),
        {**params, "today": today.isoformat()},
    ).mappings().all()

    return {
        "active_projects": active_projects,
        "overdue_tasks": overdue_tasks,
        "workload": [dict(row) for row in workload],
        "completed_tasks": completed_tasks,
        "completed_per_week": completed_per_week(session, params, task_scope, today),
        "late_projects": [dict(row) for row in late_projects],
        "profitability": profitability(session, organization_id, owner_id),
    }


def _as_date(value) -> date:
    # SQLite renvoie des chaînes, Postgres des date/datetime.
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value)[:10])


def completed_per_week(
    session: Session, params: dict, task_scope: str, today: date, weeks: int = 5
) -> list[dict]:
    """Tâches terminées par semaine ISO sur les `weeks` dernières semaines (courante incluse).

    Libellé « S » + numéro de semaine ISO (ex. « S36 »). Agrégation par jour en SQL
    (portable SQLite/Postgres), regroupement par semaine en Python.
    """
    first_monday = today - timedelta(days=today.weekday()) - timedelta(weeks=weeks - 1)

    rows = session.execute(
        text(
            f"SELECT DATE(completed_at) AS day, COUNT(*) AS count "
            f"FROM tasks "
            f"WHERE organization_id = :org AND status = 'done' "
            f"AND completed_at IS NOT NULL AND completed_at >= :since {task_scope} "
            f"GROUP BY DATE(completed_at)"
        ),
        {**params, "since": first_monday.isoformat()},
    ).mappings().all()

    buckets: dict[tuple[int, int], int] = {}
    for row in rows:
        year, week, _ = _as_date(row["day"]).isocalendar()
        buckets[(year, week)] = buckets.get((year, week), 0) + row["count"]

    result = []
    for i in range(weeks):
        year, week, _ = (first_monday + timedelta(weeks=i)).isocalendar()
        result.append({"week": f"S{week}", "count": buckets.get((year, week), 0)})
    return result


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


def profitability(session: Session, organization_id: int, owner_id: int | None = None) -> dict:
    """Montants gagnés / perdus / ouverts et taux de conversion du pipeline CRM."""
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

    by_stage = {row["stage"]: row for row in rows}

    def bucket(stage: str) -> tuple[int, float]:
        row = by_stage.get(stage)
        if not row:
            return 0, 0.0
        return int(row["count"]), float(row["amount"])

    won_count, won_amount = bucket("won")
    lost_count, lost_amount = bucket("lost")
    open_count = 0
    open_amount = 0.0
    for stage in ("prospect", "contacted", "proposal"):
        count, amount = bucket(stage)
        open_count += count
        open_amount += amount

    closed = won_count + lost_count
    won_amount_30d = session.execute(
        text(
            f"SELECT COALESCE(SUM(amount), 0) FROM opportunities "
            f"WHERE organization_id = :org AND stage = 'won' "
            f"AND closed_at IS NOT NULL AND closed_at >= :since {scope}"
        ),
        {**params, "since": (date.today() - timedelta(days=30)).isoformat()},
    ).scalar_one()

    return {
        "won_amount": won_amount,
        "lost_amount": lost_amount,
        "open_amount": open_amount,
        "won_count": won_count,
        "lost_count": lost_count,
        "open_count": open_count,
        "win_rate": round(won_count / closed, 4) if closed else 0.0,
        "won_amount_30d": float(won_amount_30d or 0),
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
