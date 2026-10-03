"""Lecture optionnelle de MongoDB (messages du chat) pour le bilan hebdomadaire."""

from datetime import date, datetime, time

from .config import config

_client = None
_failed = False


def get_client():
    global _client, _failed
    if _client is not None or _failed or not config.mongo_url:
        return _client
    try:
        from pymongo import MongoClient

        client = MongoClient(config.mongo_url, serverSelectionTimeoutMS=1500)
        client.admin.command("ping")
        _client = client
        return _client
    except Exception:
        _failed = True
        return None


def chat_activity(organization_id: int, start: date, end: date) -> dict:
    """Messages et canaux actifs sur [start, end]. `available=False` si Mongo est injoignable."""
    empty = {"messages": 0, "active_channels": 0, "available": False}
    client = get_client()
    if client is None:
        return empty

    db = client.get_default_database()
    if db is None:
        return empty

    window = {
        "organization_id": organization_id,
        "created_at": {
            "$gte": datetime.combine(start, time.min),
            "$lte": datetime.combine(end, time.max),
        },
    }
    messages = db.messages.count_documents(window)
    active = len(db.messages.distinct("channel_id", window))
    return {"messages": int(messages), "active_channels": int(active), "available": True}
