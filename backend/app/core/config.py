"""Application configuration for the AKademyOS backend.

Loads settings from environment variables (and the local ``backend/.env`` file
in development) via pydantic-settings, and fails fast with a clear, actionable
error if a required value is missing or blank.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ — config.py lives at backend/app/core/config.py, so parents[2] == backend/
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Supabase (required) ---
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str

    # --- Tutor microservice (optional until wired up) ---
    TUTOR_URL: str | None = None
    TUTOR_API_KEY: str | None = None

    @field_validator("SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_JWT_SECRET")
    @classmethod
    def _not_blank(cls, value: str, info) -> str:
        # Treat an empty/whitespace value (e.g. an unfilled placeholder) the
        # same as missing, so a half-filled .env fails fast too.
        if value is None or not value.strip():
            raise ValueError("must not be empty")
        return value

    @field_validator("TUTOR_URL", "TUTOR_API_KEY")
    @classmethod
    def _blank_to_none(cls, value: str | None) -> str | None:
        # An unfilled placeholder (TUTOR_URL=) reads as "" — treat it as unset.
        if value is None or not value.strip():
            return None
        return value


@lru_cache
def get_settings() -> Settings:
    """Return the cached Settings instance, or raise a clear error if invalid."""
    try:
        return Settings()  # type: ignore[call-arg]  # values come from env/.env
    except ValidationError as exc:
        missing = [str(err["loc"][0]) for err in exc.errors()]
        raise RuntimeError(
            "Backend configuration is invalid. The following required "
            f"environment variable(s) are missing or empty: {', '.join(missing)}.\n"
            f"Set them in {BASE_DIR / '.env'} (see .env.example) or in the "
            "process environment, then restart."
        ) from exc


settings = get_settings()
