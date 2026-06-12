from typing import Any, Optional

import httpx
from fastapi import APIRouter, Header, HTTPException, status

from app.config import SUPABASE_ANON_KEY, SUPABASE_URL
from app.models import InteractionRequest, InteractionResponse
from app.supabase_auth import get_user as supabase_get_user

router = APIRouter(prefix="/interactions", tags=["interactions"])

INTERACTION_SCORES = {
    "view": 1,
    "save": 9,
    "share": 7,
    "album_add": 6,
}


def _auth_headers(access_token: str) -> dict[str, str]:
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization bearer token.",
        )
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization bearer token.",
        )
    return token


@router.post("", response_model=InteractionResponse)
async def track_interaction(
    request: InteractionRequest,
    authorization: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    """Record a user interaction with a post."""
    access_token = _extract_bearer_token(authorization)
    user = await supabase_get_user(access_token)
    user_id = user.get("id", "")

    if request.interaction_type not in INTERACTION_SCORES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid interaction type. Must be one of: {', '.join(INTERACTION_SCORES.keys())}",
        )

    score = INTERACTION_SCORES[request.interaction_type]

    payload = {
        "user_id": user_id,
        "post_id": request.post_id,
        "interaction_type": request.interaction_type,
        "interaction_score": score,
    }

    headers = _auth_headers(access_token)
    headers["Prefer"] = "return=representation"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/post_interactions",
                headers=headers,
                json=payload,
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not connect to Supabase: {exc}",
        )

    if response.is_error:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    rows = response.json()
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to create interaction.")

    return rows[0]


@router.get("")
async def get_interactions(
    authorization: Optional[str] = Header(default=None),
) -> list[dict[str, Any]]:
    """Get the current user's interaction history."""
    access_token = _extract_bearer_token(authorization)
    user = await supabase_get_user(access_token)
    user_id = user.get("id", "")

    headers = _auth_headers(access_token)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/post_interactions",
                headers=headers,
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "*",
                    "order": "created_at.desc",
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not connect to Supabase: {exc}",
        )

    if response.is_error:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()