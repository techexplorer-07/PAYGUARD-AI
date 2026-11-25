"""Application configuration management using Pydantic Settings."""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings."""

    PROJECT_NAME: str = "PAYGUARD AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # CORS configuration for frontend communication
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Deployment: extra allowed origins as a comma-separated list
    # (e.g. "https://payguard-ai.vercel.app,https://payguard.tech"), appended to CORS_ORIGINS.
    CORS_EXTRA_ORIGINS: str = ""
    # Deployment: optional regex for additional origins, e.g. Vercel preview deployments
    # r"https://payguard-ai(-[a-z0-9-]+)?\.vercel\.app".
    CORS_ORIGIN_REGEX: Optional[str] = None

    @property
    def allowed_origins(self) -> List[str]:
        extra = [origin.strip().rstrip("/") for origin in self.CORS_EXTRA_ORIGINS.split(",") if origin.strip()]
        return [*self.CORS_ORIGINS, *(origin for origin in extra if origin not in self.CORS_ORIGINS)]

    # Server settings
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Demo deployments: build the synthetic sample SPEG evidence graph at startup
    # (see app/services/demo_graph_seed.py). Off by default.
    SEED_DEMO_GRAPH: bool = False

    # PaySim Supervised Model settings
    PAYSIM_MODEL_ENABLED: bool = True
    PAYSIM_MODEL_PATH: str = "backend/models/paysim_behavior_model.joblib"
    PAYSIM_MODEL_THRESHOLD: float = 0.5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
