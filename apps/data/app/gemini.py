"""Client Gemini (REST) — renvoie None si la clé manque ou si l'appel échoue."""

import json
import logging
import re

import httpx

from .config import config

logger = logging.getLogger(__name__)

_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def complete_json(prompt: str) -> dict | None:
    """Demande un objet JSON à Gemini. None = pas de clé, timeout, ou réponse illisible."""
    if not config.gemini_api_key:
        return None

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{config.gemini_model}:generateContent"
    )
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": "application/json",
        },
    }

    try:
        response = httpx.post(
            url,
            params={"key": config.gemini_api_key},
            json=payload,
            timeout=config.gemini_timeout,
        )
        response.raise_for_status()
        text = (
            response.json()
            .get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        return _parse_json(text)
    except Exception as exc:
        logger.warning("Gemini indisponible: %s", exc)
        return None


def _parse_json(text: str) -> dict | None:
    if not text or not text.strip():
        return None
    cleaned = _FENCE.sub("", text.strip())
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None
