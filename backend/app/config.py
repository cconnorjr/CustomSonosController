from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    poll_interval_seconds: float = 2.0
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    discovery_timeout: float = 5.0
    max_workers: int = 10

    model_config = {"env_file": ".env"}


settings = Settings()
