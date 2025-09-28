"""Integration tests for authentication and evaluation CRUD endpoints."""
from __future__ import annotations

import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlmodel import SQLModel

from app.api.deps import get_session
from app.db import models  # noqa: F401 - ensure models are registered
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="module", autouse=True)
def configure_auth_env() -> None:
    os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
    os.environ.setdefault("JWT_REFRESH_SECRET_KEY", "test-refresh-secret-key")
    os.environ.setdefault("JWT_ALGORITHM", "HS256")


@pytest_asyncio.fixture(scope="module")
async def test_client() -> AsyncGenerator[AsyncClient, None]:
    test_engine = create_async_engine(TEST_DATABASE_URL, future=True)
    async_session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        async with async_session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://testserver",
    ) as client:
        yield client

    app.dependency_overrides.clear()
    await test_engine.dispose()


@pytest.mark.asyncio
async def test_auth_and_evaluation_crud_flow(test_client: AsyncClient) -> None:
    register_payload = {
        "email": "user@example.com",
        "password": "secure-pass",
        "display_name": "Test User",
    }
    register_response = await test_client.post(
        "/api/v1/auth/register",
        json=register_payload,
    )
    assert register_response.status_code == 201
    register_data = register_response.json()
    assert "access_token" in register_data
    assert "refresh_token" in register_data

    login_payload = {
        "email": "user@example.com",
        "password": "secure-pass",
    }
    login_response = await test_client.post(
        "/api/v1/auth/login",
        json=login_payload,
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["user"]["email"] == "user@example.com"

    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]
    auth_header = {"Authorization": f"Bearer {access_token}"}

    evaluation_payload = {
        "track": {
            "external_id": "track-123",
            "source": "itunes",
            "title": "Song Title",
            "artist": "Artist",
        },
        "status": "like",
        "note": "Great track",
        "source": "swipe",
    }
    create_response = await test_client.post(
        "/api/v1/evaluations",
        json=evaluation_payload,
        headers=auth_header,
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["external_track_id"] == "track-123"
    assert created["status"] == "like"

    list_response = await test_client.get(
        "/api/v1/evaluations",
        headers=auth_header,
    )
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed["total"] == 1
    assert listed["items"][0]["external_track_id"] == "track-123"

    playback_response = await test_client.get(
        "/api/v1/settings/playback",
        headers=auth_header,
    )
    assert playback_response.status_code == 200
    playback_data = playback_response.json()
    assert playback_data["playback_rate"] == 1.0
    assert playback_data["muted"] is False

    update_playback_payload = {
        "playback_rate": 1.5,
        "muted": True,
    }
    update_playback_response = await test_client.put(
        "/api/v1/settings/playback",
        json=update_playback_payload,
        headers=auth_header,
    )
    assert update_playback_response.status_code == 200
    updated_playback = update_playback_response.json()
    assert updated_playback["playback_rate"] == 1.5
    assert updated_playback["muted"] is True

    delete_response = await test_client.delete(
        "/api/v1/evaluations/track-123",
        headers=auth_header,
    )
    assert delete_response.status_code == 204

    verify_empty_response = await test_client.get(
        "/api/v1/evaluations",
        headers=auth_header,
    )
    assert verify_empty_response.status_code == 200
    assert verify_empty_response.json()["total"] == 0

    refresh_response = await test_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_response.status_code == 200
    new_tokens = refresh_response.json()
    assert new_tokens["access_token"] != access_token
    assert new_tokens["refresh_token"] != refresh_token


@pytest.mark.asyncio
async def test_record_playback_history(test_client: AsyncClient) -> None:
    register_payload = {
        "email": "history-user@example.com",
        "password": "history-pass",
        "display_name": "History User",
    }
    register_response = await test_client.post(
        "/api/v1/auth/register",
        json=register_payload,
    )
    assert register_response.status_code == 201

    login_response = await test_client.post(
        "/api/v1/auth/login",
        json={
            "email": register_payload["email"],
            "password": register_payload["password"],
        },
    )
    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]
    auth_header = {"Authorization": f"Bearer {access_token}"}

    playback_payload = {
        "track": {
            "external_id": "track-456",
            "title": "History Song",
            "artist": "History Artist",
            "album": "History Album",
            "preview_url": "https://example.com/preview.mp3",
        },
        "source": "player",
        "played_at": "2025-01-01T00:00:00Z",
    }
    record_response = await test_client.post(
        "/api/v1/history/played",
        json=playback_payload,
        headers=auth_header,
    )
    assert record_response.status_code == 201
    recorded = record_response.json()
    assert recorded["external_track_id"] == "track-456"
    assert recorded["source"] == "player"
    assert recorded["track"]["title"] == "History Song"


@pytest.mark.asyncio
async def test_create_evaluation_with_uppercase_status(test_client: AsyncClient) -> None:
    # Register and login a user
    register_payload = {
        "email": "uppercase-test@example.com",
        "password": "uppercase-pass",
        "display_name": "Uppercase Test User",
    }
    register_response = await test_client.post(
        "/api/v1/auth/register",
        json=register_payload,
    )
    assert register_response.status_code == 201

    login_payload = {
        "email": register_payload["email"],
        "password": register_payload["password"],
    }
    login_response = await test_client.post(
        "/api/v1/auth/login",
        json=login_payload,
    )
    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]
    auth_header = {"Authorization": f"Bearer {access_token}"}

    # Create evaluation with uppercase status "LIKE"
    evaluation_payload = {
        "track": {
            "external_id": "track-uppercase-123",
            "source": "itunes",
            "title": "Uppercase Test Song",
            "artist": "Test Artist",
        },
        "status": "LIKE",  # Intentional uppercase
        "note": "This should work",
        "source": "test",
    }
    create_response = await test_client.post(
        "/api/v1/evaluations",
        json=evaluation_payload,
        headers=auth_header,
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["external_track_id"] == "track-uppercase-123"
    assert created["status"] == "like"  # Should be stored as lowercase
