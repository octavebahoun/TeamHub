import pytest
from fastapi import HTTPException

from app.config import config
from app.security import require_internal_secret


def test_accepts_matching_secret(monkeypatch):
    monkeypatch.setattr(config, "internal_secret", "s3cret")
    assert require_internal_secret("s3cret") is None


def test_rejects_missing_or_wrong_secret(monkeypatch):
    monkeypatch.setattr(config, "internal_secret", "s3cret")
    with pytest.raises(HTTPException) as missing:
        require_internal_secret(None)
    assert missing.value.status_code == 401

    with pytest.raises(HTTPException) as wrong:
        require_internal_secret("nope")
    assert wrong.value.status_code == 401
