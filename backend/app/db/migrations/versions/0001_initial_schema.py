"""Initial database schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2025-09-27 00:00:00
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


EVALUATION_STATUS_NAME = "evaluationstatus"


def upgrade() -> None:  # noqa: D401
    """Create initial tables."""
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            server_onupdate=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "track_cache",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("external_id", sa.String(length=100), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("artist", sa.String(length=255), nullable=True),
        sa.Column("album", sa.String(length=255), nullable=True),
        sa.Column("artwork_url", sa.String(length=500), nullable=True),
        sa.Column("preview_url", sa.String(length=500), nullable=True),
        sa.Column("primary_genre", sa.String(length=150), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            server_onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "external_id",
            name="uq_track_cache_external_id",
        ),
    )
    op.create_index(
        op.f("ix_track_cache_external_id"),
        "track_cache",
        ["external_id"],
        unique=False,
    )

    op.create_table(
        "evaluations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "track_id",
            sa.Integer(),
            sa.ForeignKey("track_cache.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("external_track_id", sa.String(length=100), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "like",
                "dislike",
                "skip",
                name=EVALUATION_STATUS_NAME,
            ),
            nullable=False,
        ),
        sa.Column("note", sa.String(length=500), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            server_onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "user_id",
            "external_track_id",
            name="uq_user_track_latest",
        ),
    )
    op.create_index(
        op.f("ix_evaluations_external_track_id"),
        "evaluations",
        ["external_track_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_evaluations_status"),
        "evaluations",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_evaluations_user_id"),
        "evaluations",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "playback_settings",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "playback_rate",
            sa.Float(),
            nullable=False,
            server_default="1",
        ),
        sa.Column(
            "muted",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            server_onupdate=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:  # noqa: D401
    """Drop all tables in reverse order."""
    op.drop_table("playback_settings")
    op.drop_table("evaluations")
    op.drop_table("track_cache")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.execute(sa.text(f"DROP TYPE IF EXISTS {EVALUATION_STATUS_NAME}"))
