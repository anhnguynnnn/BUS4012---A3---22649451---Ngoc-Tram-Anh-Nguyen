from typing import Optional

from fastapi import APIRouter, Header, HTTPException, status

from app.models import AuthResponse, LoginRequest, LogoutResponse, ProfileResponse, ProfileUpdateRequest, SignUpRequest, UserResponse
from app.supabase_auth import get_profile as supabase_get_profile
from app.supabase_auth import get_user as supabase_get_user
from app.supabase_auth import login as supabase_login
from app.supabase_auth import logout as supabase_logout
from app.supabase_auth import signup as supabase_signup
from app.supabase_auth import update_profile as supabase_update_profile


router = APIRouter(prefix="/auth", tags=["auth"])


def _extract_bearer_token(authorization: Optional[str]) -> str:
    """Return the access token from an Authorization: Bearer header."""
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


@router.post("/signup")
async def signup(request: SignUpRequest) -> dict:
    """Sign up a MUSÉ user through Supabase Auth via the backend proxy."""
    return await supabase_signup(
        email=str(request.email),
        password=request.password,
        full_name=request.full_name,
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest) -> dict:
    """Log in and return Supabase Auth tokens plus the authenticated user."""
    return await supabase_login(email=str(request.email), password=request.password)


@router.post("/logout", response_model=LogoutResponse)
async def logout(authorization: Optional[str] = Header(default=None)) -> dict[str, str]:
    """Log out the current user by invalidating their Supabase access token."""
    access_token = _extract_bearer_token(authorization)
    return await supabase_logout(access_token)


@router.get("/me", response_model=UserResponse)
async def me(authorization: Optional[str] = Header(default=None)) -> dict:
    """Return the current Supabase user after validating the bearer token."""
    access_token = _extract_bearer_token(authorization)
    user = await supabase_get_user(access_token)
    metadata = user.get("user_metadata") or {}

    return {
        "id": user.get("id", ""),
        "email": user.get("email"),
        "full_name": metadata.get("full_name"),
        "created_at": user.get("created_at"),
        "user_metadata": metadata,
    }


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(authorization: Optional[str] = Header(default=None)) -> dict:
    """Return the user's profile from the profiles table."""
    access_token = _extract_bearer_token(authorization)
    user = await supabase_get_user(access_token)
    user_id = user.get("id", "")

    profile = await supabase_get_profile(access_token, user_id)

    if not profile:
        # Profile row may not exist yet (e.g., pre-migration users). Return defaults.
        metadata = user.get("user_metadata") or {}
        return {
            "id": user_id,
            "full_name": metadata.get("full_name"),
            "onboarding_completed": False,
            "style_attraction": [],
            "size_range": [],
            "height_range": None,
            "fit_preferences": [],
            "styling_direction": [],
        }

    return {
        "id": profile.get("id", user_id),
        "full_name": profile.get("full_name"),
        "onboarding_completed": profile.get("onboarding_completed", False),
        "style_attraction": profile.get("style_attraction") or [],
        "size_range": profile.get("size_range") or [],
        "height_range": profile.get("height_range"),
        "fit_preferences": profile.get("fit_preferences") or [],
        "styling_direction": profile.get("styling_direction") or [],
        "updated_at": profile.get("updated_at"),
    }


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    authorization: Optional[str] = Header(default=None),
) -> dict:
    """Update the user's profile (onboarding answers, preferences)."""
    access_token = _extract_bearer_token(authorization)
    user = await supabase_get_user(access_token)
    user_id = user.get("id", "")

    # Only include fields that were explicitly provided.
    updates = {k: v for k, v in request.model_dump(exclude_none=True).items()}

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update.",
        )

    profile = await supabase_update_profile(access_token, user_id, updates)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Ensure the migration has been applied.",
        )

    return {
        "id": profile.get("id", user_id),
        "full_name": profile.get("full_name"),
        "onboarding_completed": profile.get("onboarding_completed", False),
        "style_attraction": profile.get("style_attraction") or [],
        "size_range": profile.get("size_range") or [],
        "height_range": profile.get("height_range"),
        "fit_preferences": profile.get("fit_preferences") or [],
        "styling_direction": profile.get("styling_direction") or [],
        "updated_at": profile.get("updated_at"),
    }
