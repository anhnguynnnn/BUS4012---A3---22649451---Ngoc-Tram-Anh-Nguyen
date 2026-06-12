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


def _auth_headers(access_token: str) -> dict[str, str]:
    """Headers for Supabase Auth endpoints that require a user access token."""
    headers = _headers()
    headers["Authorization"] = f"Bearer {access_token}"
    return headers


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
        # Supabase Auth REST API expects custom metadata under "data", not "user_metadata".
        payload["data"] = {"full_name": full_name}

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


async def logout(access_token: str) -> dict[str, str]:
    """Invalidate a Supabase Auth session using the current user's access token."""
    _ensure_supabase_configured()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/logout",
                headers=_auth_headers(access_token),
            )
    except httpx.HTTPError as exc:
        _raise_connection_error(exc)

    if response.is_error:
        _raise_supabase_error(response)

    return {"message": "Logged out successfully."}


async def get_user(access_token: str) -> dict[str, Any]:
    """Retrieve the authenticated Supabase user for a bearer access token."""
    _ensure_supabase_configured()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers=_auth_headers(access_token),
            )
    except httpx.HTTPError as exc:
        _raise_connection_error(exc)

    if response.is_error:
        _raise_supabase_error(response)

    return response.json()


async def get_profile(access_token: str, user_id: str) -> dict[str, Any]:
    """Retrieve the user's profile from the profiles table via PostgREST."""
    _ensure_supabase_configured()

    headers = _auth_headers(access_token)
    headers["Accept"] = "application/json"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/profiles",
                headers=headers,
                params={"id": f"eq.{user_id}", "select": "*"},
            )
    except httpx.HTTPError as exc:
        _raise_connection_error(exc)

    if response.is_error:
        _raise_supabase_error(response)

    rows = response.json()
    if not rows:
        return {}

    return rows[0]


async def update_profile(access_token: str, user_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    """Update the user's profile in the profiles table via PostgREST PATCH."""
    _ensure_supabase_configured()

    headers = _auth_headers(access_token)
    headers["Accept"] = "application/json"
    headers["Prefer"] = "return=representation"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/profiles",
                headers=headers,
                json=updates,
                params={"id": f"eq.{user_id}"},
            )
    except httpx.HTTPError as exc:
        _raise_connection_error(exc)

    if response.is_error:
        _raise_supabase_error(response)

    rows = response.json()
    if not rows:
        return {}

    return rows[0]
