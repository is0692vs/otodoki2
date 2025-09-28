"""Security helpers for password hashing and JWT management."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
import uuid
from enum import Enum
from typing import Any, Dict, Tuple

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import AuthConfig


pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


class TokenError(Exception):
    """Raised when a token cannot be decoded or is invalid."""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _create_token(
    payload: Dict[str, Any],
    *,
    expires_delta: timedelta,
    secret: str,
    algorithm: str,
) -> Tuple[str, datetime]:
    to_encode = payload.copy()
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    to_encode.update({
        "exp": expire,
        "iat": now,
        "jti": uuid.uuid4().hex,
    })
    token = jwt.encode(to_encode, secret, algorithm=algorithm)
    return token, expire


def create_access_token(user_id: str) -> Tuple[str, datetime]:
    config = AuthConfig
    return _create_token(
        {"sub": user_id, "type": TokenType.ACCESS.value},
        expires_delta=timedelta(
            minutes=config.get_access_token_expire_minutes()
        ),
        secret=config.get_secret_key(),
        algorithm=config.get_algorithm(),
    )


def create_refresh_token(user_id: str) -> Tuple[str, datetime]:
    config = AuthConfig
    return _create_token(
        {"sub": user_id, "type": TokenType.REFRESH.value},
        expires_delta=timedelta(
            minutes=config.get_refresh_token_expire_minutes()
        ),
        secret=config.get_refresh_secret_key(),
        algorithm=config.get_algorithm(),
    )


def _decode_token(
    token: str,
    *,
    secret: str,
    algorithm: str,
) -> Dict[str, Any]:
    try:
        return jwt.decode(token, secret, algorithms=[algorithm])
    except JWTError as exc:  # pragma: no cover - handled via API response
        raise TokenError(str(exc)) from exc


def decode_access_token(token: str) -> Dict[str, Any]:
    config = AuthConfig
    payload = _decode_token(
        token,
        secret=config.get_secret_key(),
        algorithm=config.get_algorithm(),
    )
    if payload.get("type") != TokenType.ACCESS.value:
        raise TokenError("Invalid token type")
    return payload


def decode_refresh_token(token: str) -> Dict[str, Any]:
    config = AuthConfig
    payload = _decode_token(
        token,
        secret=config.get_refresh_secret_key(),
        algorithm=config.get_algorithm(),
    )
    if payload.get("type") != TokenType.REFRESH.value:
        raise TokenError("Invalid token type")
    return payload


__all__ = [
    "TokenError",
    "TokenType",
    "create_access_token",
    "create_refresh_token",
    "decode_access_token",
    "decode_refresh_token",
    "get_password_hash",
    "verify_password",
]
