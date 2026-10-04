import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    port: int = int(os.getenv("PORT", "8001"))
    internal_secret: str = os.getenv("INTERNAL_SECRET", "")
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:////home/user/TeamHub/apps/api/database/database.sqlite",
    )
    mongo_url: str = os.getenv("MONGO_URL", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    gemini_timeout: float = float(os.getenv("GEMINI_TIMEOUT", "12"))


config = Config()
