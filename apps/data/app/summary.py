"""Bilan hebdomadaire : agrégats Postgres (+ Mongo si dispo) puis récit Gemini."""

from datetime import date, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session

from . import gemini, mongo, stats


def iso_week_bounds(today: date | None = None) -> tuple[date, date]:
    today = today or date.today()
    start = today - timedelta(days=today.weekday())
    return start, start + timedelta(days=6)


def build(session: Session, organization_id: int, owner_id: int | None = None) -> dict:
    start, end = iso_week_bounds()
    overview = stats.overview(session, organization_id, owner_id)
    week = _week_kpis(session, organization_id, owner_id, start, end)
    chat = mongo.chat_activity(organization_id, start, end)

    kpis = {
        "active_projects": overview["active_projects"],
        "overdue_tasks": overview["overdue_tasks"],
        "completed_tasks_week": week["completed_tasks"],
        "new_opportunities": week["new_opportunities"],
        "won_count": week["won_count"],
        "won_amount": week["won_amount"],
        "open_amount": overview["profitability"]["open_amount"],
        "win_rate": overview["profitability"]["win_rate"],
        "messages": chat["messages"],
        "active_channels": chat["active_channels"],
    }
    generated = gemini.complete_json(_prompt(kpis, overview["workload"], start, end))
    narrative = _narrative(generated, kpis, start, end)

    return {
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "source": "gemini" if generated else "fallback",
        "kpis": kpis,
        "workload": overview["workload"],
        "profitability": overview["profitability"],
        "chat": chat,
        "headline": narrative["headline"],
        "narrative": narrative["narrative"],
        "priorities": narrative["priorities"],
    }


def _week_kpis(
    session: Session,
    organization_id: int,
    owner_id: int | None,
    start: date,
    end: date,
) -> dict:
    task_scope = "AND project_id IN (SELECT id FROM projects WHERE owner_id = :owner)" if owner_id else ""
    opp_scope = "AND owner_id = :owner" if owner_id else ""
    params: dict = {
        "org": organization_id,
        "start": start.isoformat(),
        "end": end.isoformat(),
    }
    if owner_id:
        params["owner"] = owner_id

    completed = session.execute(
        text(
            f"SELECT COUNT(*) FROM tasks "
            f"WHERE organization_id = :org AND status = 'done' "
            f"AND completed_at IS NOT NULL "
            f"AND DATE(completed_at) BETWEEN :start AND :end {task_scope}"
        ),
        params,
    ).scalar_one()

    new_opps = session.execute(
        text(
            f"SELECT COUNT(*) FROM opportunities "
            f"WHERE organization_id = :org "
            f"AND DATE(created_at) BETWEEN :start AND :end {opp_scope}"
        ),
        params,
    ).scalar_one()

    won = session.execute(
        text(
            f"SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount "
            f"FROM opportunities "
            f"WHERE organization_id = :org AND stage = 'won' "
            f"AND closed_at IS NOT NULL "
            f"AND DATE(closed_at) BETWEEN :start AND :end {opp_scope}"
        ),
        params,
    ).mappings().one()

    return {
        "completed_tasks": int(completed),
        "new_opportunities": int(new_opps),
        "won_count": int(won["count"]),
        "won_amount": float(won["amount"]),
    }


def _prompt(kpis: dict, workload: list[dict], start: date, end: date) -> str:
    top = ", ".join(f"{w['name']} ({w['open_tasks']})" for w in workload[:5]) or "personne"
    return (
        "Tu es l'analyste interne de WINE, une plateforme de gestion pour petites équipes "
        "francophones. Rédige le bilan de la semaine en français, ton professionnel et concret.\n"
        f"Période : {start.isoformat()} → {end.isoformat()}\n"
        f"Indicateurs : {kpis}\n"
        f"Charge (tâches ouvertes) : {top}\n"
        "Réponds uniquement par un JSON : "
        '{"headline": "phrase courte", "narrative": "2 ou 3 phrases", '
        '"priorities": ["action 1", "action 2", "action 3"]}'
    )


def _narrative(generated: dict | None, kpis: dict, start: date, end: date) -> dict:
    if generated:
        headline = str(generated.get("headline") or "").strip()
        text = str(generated.get("narrative") or "").strip()
        raw_priorities = generated.get("priorities") or []
        priorities = [str(item).strip() for item in raw_priorities if str(item).strip()][:5]
        if headline and text:
            return {"headline": headline, "narrative": text, "priorities": priorities or _fallback_priorities(kpis)}

    return {
        "headline": _fallback_headline(kpis),
        "narrative": (
            f"Semaine du {start.isoformat()} au {end.isoformat()} : "
            f"{kpis['completed_tasks_week']} tâche(s) terminée(s), "
            f"{kpis['overdue_tasks']} en retard, "
            f"{kpis['won_count']} opportunité(s) gagnée(s) "
            f"({int(kpis['won_amount'])} FCFA). "
            f"Pipeline ouvert : {int(kpis['open_amount'])} FCFA."
        ),
        "priorities": _fallback_priorities(kpis),
    }


def _fallback_headline(kpis: dict) -> str:
    if kpis["overdue_tasks"] > 0:
        return f"{kpis['overdue_tasks']} tâche(s) en retard à traiter"
    if kpis["won_count"] > 0:
        return f"{kpis['won_count']} affaire(s) gagnée(s) cette semaine"
    if kpis["completed_tasks_week"] > 0:
        return f"{kpis['completed_tasks_week']} tâche(s) bouclée(s) cette semaine"
    return "Semaine calme — peu d'activité mesurée"


def _fallback_priorities(kpis: dict) -> list[str]:
    items: list[str] = []
    if kpis["overdue_tasks"] > 0:
        items.append("Réassigner ou clôturer les tâches en retard")
    if kpis["open_amount"] > 0:
        items.append("Relancer les opportunités ouvertes du pipeline")
    if kpis["completed_tasks_week"] == 0:
        items.append("Débloquer au moins une tâche cette semaine")
    if not items:
        items.append("Maintenir le rythme et préparer la semaine suivante")
    return items[:3]
