from typing import Any, Optional

import httpx
from fastapi import APIRouter, Header, HTTPException, Query, status

from app.config import SUPABASE_ANON_KEY, SUPABASE_URL
from app.supabase_auth import get_user as supabase_get_user

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

INTERACTION_SCORES = {
    "view": 1,
    "save": 9,
    "share": 7,
    "album_add": 6,
}


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


def _normalise(value: str) -> str:
    return value.lower().replace("\u2013", "-").replace("\u2014", "-").strip()


def _as_array(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(v) for v in value if isinstance(v, str)]
    return []


def _has_overlap(a: list[str], b: list[str]) -> bool:
    set_b = {_normalise(v) for v in b}
    return any(_normalise(v) in set_b for v in a)


def _calculate_onboarding_score(
    post: dict[str, Any],
    profile: dict[str, Any],
) -> tuple[int, list[str]]:
    """Calculate onboarding match score (0-100) and reasons."""
    score = 15
    reasons: list[str] = []

    style_prefs = _as_array(profile.get("style_attraction"))
    fit_prefs = _as_array(profile.get("fit_preferences"))
    direction_prefs = _as_array(profile.get("styling_direction"))
    size_prefs = _as_array(profile.get("size_range"))
    height_pref = profile.get("height_range") or ""

    post_style = _as_array(post.get("style_tags"))
    post_fit = _as_array(post.get("fit_tags"))
    post_direction = _as_array(post.get("gender_style"))
    post_size = _as_array(post.get("size_range"))
    post_height = post.get("height_range") or ""

    # Style match (+20)
    if _has_overlap(style_prefs, post_style):
        score += 20
        match_tag = next((t for t in post_style if _normalise(t) in {_normalise(s) for s in style_prefs}), None)
        reasons.append(f"Similar to your {match_tag or 'style'} preference")

    # Size match (+25)
    if _has_overlap(size_prefs, post_size):
        score += 25
        reasons.append("Includes a similar fit reference range")

    # Height match (+20)
    if height_pref and _normalise(height_pref) == _normalise(post_height):
        score += 20
        reasons.append(f"{post_height} fit reference")

    # Fit match (+20)
    if _has_overlap(fit_prefs, post_fit):
        score += 20
        match_tag = next((t for t in post_fit if _normalise(t) in {_normalise(s) for s in fit_prefs}), None)
        reasons.append(f"Matches your {match_tag or 'fit'} preference")

    # Direction match (+10)
    if _has_overlap(direction_prefs, post_direction):
        score += 10
        reasons.append("Aligned with your styling direction")

    return (min(score, 100), reasons)


def _calculate_behaviour_score(
    post_id: str,
    interactions: list[dict[str, Any]],
) -> int:
    """Calculate behaviour score based on interaction history for this post."""
    total = sum(
        i.get("interaction_score", 0)
        for i in interactions
        if i.get("post_id") == post_id
    )
    # Normalise: 9 (single save) = ~30, 27 (3 saves) = ~60, 45+ = ~100
    return min(int((total / 45) * 100), 100)


def _trending_score(post: dict[str, Any]) -> int:
    """Simple engagement-based trending score for users with no history."""
    saves = post.get("save_count", 0) or 0
    shares = post.get("share_count", 0) or 0
    views = post.get("view_count", 0) or 0
    raw = (saves * 9) + (shares * 7) + (views * 1)
    # Normalise: 9 (1 save) = ~30, 27 = ~60, 45+ = ~100
    return min(int((raw / 45) * 100), 100)


def _build_recommendation(
    post: dict[str, Any],
    onboarding_score: int,
    onboarding_reasons: list[str],
    behaviour_score: int,
    has_interactions: bool,
) -> dict[str, Any]:
    """Combine scores with 70/30 weighting."""
    if has_interactions:
        final_score = (behaviour_score * 0.7) + (onboarding_score * 0.3)
    else:
        # No behaviour history — use trending as proxy
        final_score = (behaviour_score * 0.5) + (onboarding_score * 0.5)

    match_pct = max(35, min(int(final_score), 100))

    # Prefer DB match labels over generated reasons
    reason = post.get("match_label_primary") or (onboarding_reasons[0] if onboarding_reasons else post.get("body_friendly_label"))
    reason_secondary = post.get("match_label_secondary") or (onboarding_reasons[1] if len(onboarding_reasons) > 1 else None)

    return {
        "post": post,
        "match_percentage": match_pct,
        "match_reason": reason,
        "match_reason_secondary": reason_secondary,
        "onboarding_score": onboarding_score,
        "behaviour_score": behaviour_score,
        "final_score": round(final_score, 1),
    }


@router.get("")
async def get_recommendations(
    authorization: Optional[str] = Header(default=None),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[dict[str, Any]]:
    """Get personalised post recommendations for the authenticated user."""
    access_token = _extract_bearer_token(authorization)
    user = await supabase_get_user(access_token)
    user_id = user.get("id", "")
    headers = _headers(access_token)

    select_fields = (
        "id,creator_name,image_url,description,tags,style_category,"
        "style_tags,fit_tags,gender_style,occasion_tags,size_range,height_range,"
        "body_friendly_label,match_label_primary,match_label_secondary,"
        "view_count,save_count,share_count,created_at"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch profile, posts, and interactions in parallel would be ideal,
            # but httpx async context makes sequential simpler here.
            profile_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/profiles",
                headers=headers,
                params={"id": f"eq.{user_id}", "select": "*"},
            )
            posts_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/posts",
                headers=headers,
                params={"select": select_fields, "limit": str(limit)},
            )
            interactions_resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/post_interactions",
                headers=headers,
                params={"user_id": f"eq.{user_id}", "select": "*"},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not connect to Supabase: {exc}",
        )

    if profile_resp.is_error:
        profile: dict[str, Any] = {}
    else:
        rows = profile_resp.json()
        profile = rows[0] if rows else {}

    if posts_resp.is_error:
        raise HTTPException(status_code=posts_resp.status_code, detail=posts_resp.text)
    posts = posts_resp.json()

    if interactions_resp.is_error:
        interactions: list[dict[str, Any]] = []
    else:
        interactions = interactions_resp.json()

    has_interactions = len(interactions) > 0

    recommendations = []
    for post in posts:
        ob_score, ob_reasons = _calculate_onboarding_score(post, profile)

        if has_interactions:
            beh_score = _calculate_behaviour_score(post["id"], interactions)
        else:
            beh_score = _trending_score(post)

        rec = _build_recommendation(post, ob_score, ob_reasons, beh_score, has_interactions)
        recommendations.append(rec)

    # Sort by final_score descending
    recommendations.sort(key=lambda r: r["final_score"], reverse=True)

    return recommendations