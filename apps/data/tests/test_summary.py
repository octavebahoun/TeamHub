from app import summary
from tests.conftest import seed_org


def test_weekly_summary_fallback_without_gemini(session, monkeypatch):
    seed_org(session)
    monkeypatch.setattr(summary.gemini, "complete_json", lambda _prompt: None)
    monkeypatch.setattr(summary.mongo, "chat_activity", lambda *_args: {"messages": 4, "active_channels": 2, "available": True})

    result = summary.build(session, 1)

    assert result["source"] == "fallback"
    assert result["kpis"]["completed_tasks_week"] == 1
    assert result["kpis"]["won_count"] == 1
    assert result["kpis"]["messages"] == 4
    assert result["headline"]
    assert result["narrative"]
    assert result["priorities"]


def test_weekly_summary_uses_gemini_when_available(session, monkeypatch):
    seed_org(session)
    monkeypatch.setattr(
        summary.gemini,
        "complete_json",
        lambda _prompt: {
            "headline": "Belle semaine",
            "narrative": "Deux affaires ont avancé.",
            "priorities": ["Relancer l'hôtel"],
        },
    )
    monkeypatch.setattr(summary.mongo, "chat_activity", lambda *_args: {"messages": 0, "active_channels": 0, "available": False})

    result = summary.build(session, 1)
    assert result["source"] == "gemini"
    assert result["headline"] == "Belle semaine"
    assert result["priorities"] == ["Relancer l'hôtel"]
