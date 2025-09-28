"""Pydantic schemas for authentication endpoints."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field

from .user import UserResponse


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=10)


class TokenBundleResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_in: int
    user: UserResponse

    model_config = {
        "arbitrary_types_allowed": True,
        "from_attributes": True,
    }
