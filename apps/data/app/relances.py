"""Suggestions de relances CRM, personnalisées par Gemini à partir de l'historique."""

from datetime import date, datetime, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session

from . import gemini

STAGE_LABELS = {
    "prospect": "prospect",
    "contacted": "contacté",
    "proposal": "proposition",
}


def suggest(
    session: Session,
    organization_id: int,
    owner_id: int | None = None,
    limit: int = 8,
) -> dict:
    today = date.today()
    rows = _candidates(session, organization_id, owner_id, today)
    suggestions = [_serialize(session, row, today) for row in rows[: max(1, min(limit, 20))]]
    generated = gemini.complete_json(_prompt(suggestions, today)) if suggestions else None
    if generated:
        _apply_gemini(suggestions, generated)

    return {
        "as_of": today.isoformat(),
        "source": "gemini" if generated else "fallback",
        "count": len(suggestions),
        "suggestions": suggestions,
    }


def _candidates(session: Session, organization_id: int, owner_id: int | None, today: date):
    scope = "AND o.owner_id = :owner" if owner_id else ""
    params: dict = {
        "org": organization_id,
        "horizon": (today + timedelta(days=3)).isoformat(),
    }
    if owner_id:
        params["owner"] = owner_id

    return session.execute(
        text(
            f"SELECT o.id AS opportunity_id, o.organization_id, o.title, o.stage, o.amount, "
            f"o.next_follow_up, o.notes AS opportunity_notes, o.owner_id, "
            f"c.id AS client_id, c.name AS client_name, c.company, c.email, "
            f"c.phone, c.notes AS client_notes, "
            f"(SELECT MAX(a.created_at) FROM activities a "
            f" WHERE a.organization_id = o.organization_id "
            f"   AND ((a.subject_type LIKE '%Client' AND a.subject_id = c.id) "
            f"     OR (a.subject_type LIKE '%Opportunity' AND a.subject_id = o.id))) "
            f"AS last_activity_at "
            f"FROM opportunities o "
            f"JOIN clients c ON c.id = o.client_id "
            f"WHERE o.organization_id = :org "
            f"AND o.stage IN ('prospect','contacted','proposal') "
            f"{scope} "
            f"ORDER BY "
            f"  CASE WHEN o.next_follow_up IS NULL THEN 1 ELSE 0 END, "
            f"  o.next_follow_up ASC, "
            f"  o.amount DESC"
        ),
        params,
    ).mappings().all()


def _serialize(session: Session, row, today: date) -> dict:
    follow = _as_date(row["next_follow_up"]) if row["next_follow_up"] else None
    last = _as_date(row["last_activity_at"]) if row["last_activity_at"] else None
    overdue_days = (today - follow).days if follow and follow < today else 0
    silent_days = (today - last).days if last else None
    priority, reason = _priority(follow, overdue_days, silent_days, row["stage"], today)
    history = _history(session, row["organization_id"], row)

    return {
        "client_id": row["client_id"],
        "client_name": row["client_name"],
        "company": row["company"],
        "email": row["email"],
        "opportunity_id": row["opportunity_id"],
        "opportunity_title": row["title"],
        "stage": row["stage"],
        "amount": float(row["amount"] or 0),
        "next_follow_up": follow.isoformat() if follow else None,
        "overdue_days": overdue_days,
        "last_activity_at": last.isoformat() if last else None,
        "priority": priority,
        "reason": reason,
        "channel": _channel(row["email"], row["stage"], overdue_days),
        "suggested_message": _fallback_message(row, follow, overdue_days),
        "history": history,
    }


def _history(session: Session, organization_id: int, row) -> list[dict]:
    items = session.execute(
        text(
            "SELECT action, kind, body, created_at FROM activities "
            "WHERE organization_id = :org "
            "AND ((subject_type LIKE '%Client' AND subject_id = :client_id) "
            "  OR (subject_type LIKE '%Opportunity' AND subject_id = :opportunity_id)) "
            "ORDER BY created_at DESC LIMIT 5"
        ),
        {
            "org": organization_id,
            "client_id": row["client_id"],
            "opportunity_id": row["opportunity_id"],
        },
    ).mappings().all()
    return [
        {
            "action": item["action"],
            "kind": item["kind"],
            "body": item["body"],
            "created_at": str(item["created_at"])[:10] if item["created_at"] else None,
        }
        for item in items
    ]


def _priority(follow: date | None, overdue_days: int, silent_days: int | None, stage: str, today: date):
    if follow and follow < today:
        return "high", f"Relance en retard de {overdue_days} jour(s)"
    if follow == today:
        return "high", "Relance prévue aujourd'hui"
    if follow and follow <= today + timedelta(days=3):
        return "medium", f"Relance prévue le {follow.isoformat()}"
    if silent_days is not None and silent_days >= 7:
        return "medium", f"Aucun échange depuis {silent_days} jours"
    if follow is None:
        return "medium", "Aucune relance planifiée"
    if stage == "proposal":
        return "medium", "Proposition en cours — à relancer"
    return "low", "Suivi de routine"


def _channel(email: str | None, stage: str, overdue_days: int) -> str:
    if overdue_days >= 7 or stage == "proposal":
        return "call"
    if email:
        return "email"
    return "note"


def _fallback_message(row, follow: date | None, overdue_days: int) -> str:
    name = row["client_name"].split()[0]
    title = row["title"]
    stage = STAGE_LABELS.get(row["stage"], row["stage"])
    if overdue_days > 0:
        return (
            f"Bonjour {name}, je reviens vers vous au sujet de « {title} » "
            f"(étape {stage}). Pouvons-nous caler un point cette semaine ?"
        )
    if follow:
        return (
            f"Bonjour {name}, comme convenu je fais le point sur « {title} ». "
            f"Avez-vous eu le temps d'y réfléchir ?"
        )
    return (
        f"Bonjour {name}, je souhaitais prendre des nouvelles de « {title} ». "
        f"Êtes-vous disponible pour un échange rapide ?"
    )


def _prompt(suggestions: list[dict], today: date) -> str:
    compact = [
        {
            "opportunity_id": item["opportunity_id"],
            "client_name": item["client_name"],
            "title": item["opportunity_title"],
            "stage": item["stage"],
            "reason": item["reason"],
            "history": item["history"],
        }
        for item in suggestions
    ]
    return (
        "Tu es un commercial francophone. Pour chaque opportunité, propose un message "
        f"de relance court (2 phrases max), tutoiement interdit, date du jour {today.isoformat()}.\n"
        f"Données : {compact}\n"
        "Réponds uniquement par un JSON : "
        '{"messages": [{"opportunity_id": 1, "channel": "email|call|note", "message": "..."}]}'
    )


def _apply_gemini(suggestions: list[dict], generated: dict) -> None:
    by_id = {item["opportunity_id"]: item for item in suggestions}
    for entry in generated.get("messages") or []:
        if not isinstance(entry, dict):
            continue
        target = by_id.get(entry.get("opportunity_id"))
        if not target:
            continue
        message = str(entry.get("message") or "").strip()
        channel = str(entry.get("channel") or "").strip()
        if message:
            target["suggested_message"] = message
        if channel in {"email", "call", "note", "meeting"}:
            target["channel"] = channel


def _as_date(value) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text_value = str(value)
    try:
        return date.fromisoformat(text_value[:10])
    except ValueError:
        return None
