from datetime import date, timedelta

from sqlalchemy import text

from app import relances
from tests.conftest import seed_org


def test_relances_fallback_message(session, monkeypatch):
    seed_org(session)
    monkeypatch.setattr(relances.gemini, "complete_json", lambda _prompt: None)

    result = relances.suggest(session, 1)
    assert result["source"] == "fallback"
    assert result["count"] >= 1
    first = result["suggestions"][0]
    assert first["opportunity_id"] == 70
    assert first["priority"] == "high"
    assert "Hôtel" in first["client_name"] or "Palmiers" in first["client_name"]
    assert first["suggested_message"]
    assert first["history"]


def test_relances_apply_gemini_copy(session, monkeypatch):
    seed_org(session)
    monkeypatch.setattr(
        relances.gemini,
        "complete_json",
        lambda _prompt: {
            "messages": [
                {"opportunity_id": 70, "channel": "call", "message": "Je vous appelle demain matin."}
            ]
        },
    )

    result = relances.suggest(session, 1)
    assert result["source"] == "gemini"
    assert result["suggestions"][0]["suggested_message"] == "Je vous appelle demain matin."
    assert result["suggestions"][0]["channel"] == "call"


def test_overdue_follow_up_is_high_priority(session, monkeypatch):
    seed_org(session)
    session.execute(
        text("UPDATE opportunities SET next_follow_up = :d WHERE id = 70"),
        {"d": (date.today() - timedelta(days=4)).isoformat()},
    )
    session.commit()
    monkeypatch.setattr(relances.gemini, "complete_json", lambda _prompt: None)

    first = relances.suggest(session, 1)["suggestions"][0]
    assert first["priority"] == "high"
    assert first["overdue_days"] == 4
