import os
import re
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv


# This backend is intentionally simple for learning purposes.
# Environment variables keep Supabase credentials out of source code.
BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

SUPABASE_URL_PATTERN = re.compile(r"^https://[a-zA-Z0-9-]+\.supabase\.co$")


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


def _is_placeholder(value: str) -> bool:
    """Return True when an env value still contains example placeholder text."""
    normalized = value.strip().lower()
    placeholder_fragments = (
        "your-project",
        "your_supabase",
        "your-supabase",
        "your-anon-key",
        "your_anon_key",
        "anon-key-here",
        "example",
        "placeholder",
    )
    return any(fragment in normalized for fragment in placeholder_fragments)


def validate_settings() -> None:
    """Raise a clear error if required Supabase settings are missing or invalid."""
    errors = get_settings_errors()

    if errors:
        formatted_errors = "\n- ".join(errors)
        raise RuntimeError(f"Invalid Supabase configuration:\n- {formatted_errors}")


def get_settings_errors() -> list[str]:
    """Return human-readable Supabase configuration errors."""
    missing_vars = []

    if not SUPABASE_URL:
        missing_vars.append("SUPABASE_URL")

    if not SUPABASE_ANON_KEY:
        missing_vars.append("SUPABASE_ANON_KEY")

    if missing_vars:
        joined_vars = ", ".join(missing_vars)
        return [f"Missing required environment variables: {joined_vars}"]

    invalid_vars = []

    if _is_placeholder(SUPABASE_URL):
        invalid_vars.append(
            "SUPABASE_URL still uses a placeholder value. Replace it with your real Supabase project URL."
        )

    if _is_placeholder(SUPABASE_ANON_KEY):
        invalid_vars.append(
            "SUPABASE_ANON_KEY still uses a placeholder value. Replace it with your real Supabase anon key."
        )

    if not SUPABASE_URL_PATTERN.fullmatch(SUPABASE_URL):
        invalid_vars.append(
            "SUPABASE_URL must be in the format https://xxxx.supabase.co with no trailing path."
        )

    return invalid_vars


def get_settings_error_message() -> Optional[str]:
    """Return a single formatted settings error message, or None if valid."""
    errors = get_settings_errors()

    if not errors:
        return None

    formatted_errors = "\n- ".join(errors)
    return f"Invalid Supabase configuration:\n- {formatted_errors}"


def print_settings_summary() -> None:
    """Print safe startup diagnostics without exposing secrets."""
    settings_error = get_settings_error_message()
    masked_key = (
        f"{SUPABASE_ANON_KEY[:8]}...{SUPABASE_ANON_KEY[-6:]}"
        if len(SUPABASE_ANON_KEY) > 14
        else "not configured"
    )

    print("[MUSÉ Backend] Starting FastAPI application")
    print(f"[MUSÉ Backend] .env loaded from: {ENV_PATH}")
    print(f"[MUSÉ Backend] Supabase URL: {SUPABASE_URL or 'not configured'}")
    print(f"[MUSÉ Backend] Supabase anon key: {masked_key}")
    print(f"[MUSÉ Backend] Frontend origin: {FRONTEND_ORIGIN}")

    if settings_error:
        print(f"[MUSÉ Backend] WARNING: {settings_error}")
        print("[MUSÉ Backend] Server will start, but /auth/signup and /auth/login require valid Supabase env vars.")
    else:
        print("[MUSÉ Backend] Supabase configuration validated successfully")