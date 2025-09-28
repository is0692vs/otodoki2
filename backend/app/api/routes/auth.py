"""Authentication API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_auth_service
from app.schemas import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenBundleResponse,
)
from app.services.auth import AuthService, AuthServiceError

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=TokenBundleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(
    payload: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenBundleResponse:
    try:
        user, bundle = await auth_service.register_user(
            email=payload.email,
            password=payload.password,
            display_name=payload.display_name,
        )
    except AuthServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
        ) from exc
    return bundle.to_response(user)


@router.post(
    "/login",
    response_model=TokenBundleResponse,
)
async def login_user(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenBundleResponse:
    try:
        user, bundle = await auth_service.authenticate_user(
            email=payload.email,
            password=payload.password,
        )
    except AuthServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
        ) from exc
    return bundle.to_response(user)


@router.post(
    "/refresh",
    response_model=TokenBundleResponse,
)
async def refresh_tokens(
    payload: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenBundleResponse:
    try:
        user, bundle = await auth_service.refresh_tokens(payload.refresh_token)
    except AuthServiceError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
        ) from exc
    return bundle.to_response(user)


__all__ = ["router"]
