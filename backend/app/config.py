from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "JOBDETECT"
    DEBUG: bool = False
    VERSION: str = "2.0.0"

    # JWT Security
    SECRET_KEY: str = "change-this-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./jobdetect.db"

    # Model
    MODEL_PATH: str = str(BASE_DIR / "saved_models" / "job_classifier.pkl")

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 30
    CLASSIFY_RATE_LIMIT: int = 10

    # Input Validation
    MAX_TEXT_LENGTH: int = 10000
    MAX_TITLE_LENGTH: int = 200
    MIN_DESCRIPTION_LENGTH: int = 10

    # Confidence
    CONFIDENCE_THRESHOLD: float = 0.65

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
