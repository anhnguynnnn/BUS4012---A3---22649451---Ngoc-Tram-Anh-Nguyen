from typing import Any, Optional

import httpx
from fastapi import HTTPException, status

from app.config import SUPABASE_ANON_KEY, SUPABASE_URL, get_settings_error_message


def _headers() -> dict[str, str]:
    """Headers required by the Supabase Auth REST API."""
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }


def _ensure_supabase_configured() -> None:
    """Stop auth requests early when Supabase env vars are missing or invalid."""
    settings_error = get_settings_error_message()

    if settings_error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                f"{settings_error}\n"
                "Set SUPABASE_URL to https://xxxx.supabase.co and SUPABASE_ANON_KEY to your Supabase anon key."
            ),
        )


def _raise_supabase_error(response: httpx.Response) -> None:
    """Convert Supabase REST errors into FastAPI HTTP errors."""
    try:
        detail: Any = response.json()
    except ValueError:
        detail = response.text or "Supabase authentication request failed."

    raise HTTPException(status_code=response.status_code, detail=detail)


def _raise_connection_error(exc: httpx.HTTPError) -> None:
    """Convert Supabase connection failures into clear API errors."""
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=(
            "Could not connect to Supabase. Check that SUPABASE_URL is a valid "
            "https://xxxx.supabase.co URL, SUPABASE_ANON_KEY is correct, and your network is available. "
            f"Original error: {exc}"
        ),
    ) from exc


async def signup(email: str, password: str, full_name: Optional[str] = None) -> dict[str, Any]:
    """Create a user with Supabase Auth using the REST API.

    This is simplified for learning purposes: the backend only passes the
    signup request through to Supabase Auth and does not create app tables yet.
    """
    payload: dict[str, Any] = {
        "email": email,
        "password": password,
    }
    _ensure_supabase_configured()

    if full_name:
        payload["user_metadata"] = {"full_name": full_name}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/signup",
                headers=_headers(),
                json=payload,
            )
    except httpx.HTTPError as exc:
        _raise_connection_error(exc)

    if response.is_error:
        _raise_supabase_error(response)

    return response.json()


async def login(email: str, password: str) -> dict[str, Any]:
    """Log a user in with Supabase Auth using the password grant REST API."""
    _ensure_supabase_configured()

    payload = {
        "email": email,
        "password": password,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                headers=_headers(),
                json=payload,
            )
    except httpx.HTTPError as exc:
        _raise_connection_error(exc)

    if response.is_error:
        _raise_supabase_error(response)

    data = response.json()

    required_keys = ["access_token", "refresh_token", "user"]
    if any(key not in data for key in required_keys):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Supabase login response did not include the expected auth fields.",
        )

    return data