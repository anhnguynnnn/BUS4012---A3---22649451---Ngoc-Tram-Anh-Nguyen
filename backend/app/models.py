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