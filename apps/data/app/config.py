import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

_ROOT = Path(__file__).resolve().parents[3]
_SQLITE = _ROOT / "apps" / "api" / "database" / "database.sqlite"
_API_ENV = _ROOT / "apps" / "api" / ".env"


def _api_secret() -> str:
    if not _API_ENV.is_file():
        return ""
    for line in _API_ENV.read_text().splitlines():
        if line.startswith("INTERNAL_SECRET="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


class Config:
    port: int = int(os.getenv("PORT", "8001"))
    internal_secret: str = os.getenv("INTERNAL_SECRET") or _api_secret()
    database_url: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{_SQLITE}",
    )
    mongo_url: str = os.getenv("MONGO_URL", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    gemini_timeout: float = float(os.getenv("GEMINI_TIMEOUT", "12"))


config = Config()
