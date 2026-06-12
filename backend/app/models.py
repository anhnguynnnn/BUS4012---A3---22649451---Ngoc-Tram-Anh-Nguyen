from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class HealthResponse(BaseModel):
    status: str


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def allow_gmail_addresses(cls, value: EmailStr) -> EmailStr:
        # For this learning backend, we only enforce a valid email format.
        # Addresses like user@gmail.com are accepted by EmailStr validation.
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: Optional[int] = None
    token_type: Optional[str] = None
    user: dict[str, Any]


class LogoutResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    created_at: Optional[str] = None
    user_metadata: dict[str, Any] = {}


class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str] = None
    onboarding_completed: bool = False
    style_attraction: list[str] = []
    size_range: list[str] = []
    height_range: Optional[str] = None
    fit_preferences: list[str] = []
    styling_direction: list[str] = []
    updated_at: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    onboarding_completed: Optional[bool] = None
    style_attraction: Optional[list[str]] = None
    size_range: Optional[list[str]] = None
    height_range: Optional[str] = None
    fit_preferences: Optional[list[str]] = None
    styling_direction: Optional[list[str]] = None


# ---- Phase 6: Recommendation Engine ----


class InteractionRequest(BaseModel):
    post_id: str
    interaction_type: str  # view, save, share, album_add


class InteractionResponse(BaseModel):
    id: str
    user_id: str
    post_id: str
    interaction_type: str
    interaction_score: int
    created_at: str


class PostResponse(BaseModel):
    id: str
    creator_name: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    style_category: Optional[str] = None
    style_tags: list[str] = []
    fit_tags: list[str] = []
    gender_style: list[str] = []
    occasion_tags: list[str] = []
    size_range: list[str] = []
    height_range: Optional[str] = None
    body_friendly_label: Optional[str] = None
    match_label_primary: Optional[str] = None
    match_label_secondary: Optional[str] = None
    view_count: int = 0
    save_count: int = 0
    share_count: int = 0
    created_at: Optional[str] = None


class RecommendationItem(BaseModel):
    post: PostResponse
    match_percentage: int
    match_reason: Optional[str] = None
    match_reason_secondary: Optional[str] = None
    onboarding_score: int = 0
    behaviour_score: int = 0
    final_score: float = 0.0
