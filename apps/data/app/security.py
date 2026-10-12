import hmac

from fastapi import Header, HTTPException, status

from .config import config


def require_internal_secret(x_internal_secret: str | None = Header(default=None)):
    if not config.internal_secret or not x_internal_secret:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing internal secret")
    if not hmac.compare_digest(config.internal_secret, x_internal_secret):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Bad internal secret")
