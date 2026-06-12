from typing import Any, Optional

import httpx
from fastapi import APIRouter, Header, HTTPException, Query, status

from app.config import SUPABASE_ANON_KEY, SUPABASE_URL
from app.supabase_auth import get_user as supabase_get_user

router = APIRouter(prefix="/posts", tags=["posts"])


def _headers(access_token: Optional[str] = None) -> dict[str, str]:
    h = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if access_token:
        h["Authorization"] = f"Bearer {access_token}"
    return h


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


@router.get("")
async def list_posts(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    authorization: Optional[str] = Header(default=None),
) -> list[dict[str, Any]]:
    """List posts with all metadata columns."""
    access_token = _extract_bearer_token(authorization) if authorization else None
    headers = _headers(access_token)

    select_fields = (
        "id,creator_name,image_url,description,tags,style_category,"
        "style_tags,fit_tags,gender_style,occasion_tags,size_range,height_range,"
        "body_friendly_label,match_label_primary,match_label_secondary,"
        "view_count,save_count,share_count,created_at"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/posts",
                headers=headers,
                params={
                    "select": select_fields,
                    "order": "created_at.desc",
                    "limit": str(limit),
                    "offset": str(offset),
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


@router.get("/trending")
async def trending_posts(
    limit: int = Query(default=20, ge=1, le=100),
) -> list[dict[str, Any]]:
    """Get globally trending posts ranked by engagement. No auth required."""
    headers = _headers()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/posts",
                headers=headers,
                params={
                    "select": (
                        "id,creator_name,image_url,description,tags,style_category,"
                        "style_tags,fit_tags,gender_style,occasion_tags,size_range,height_range,"
                        "body_friendly_label,match_label_primary,match_label_secondary,"
                        "view_count,save_count,share_count,created_at"
                    ),
                    "order": "save_count.desc,view_count.desc,created_at.desc",
                    "limit": str(limit),
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