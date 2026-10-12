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


config = Config()
