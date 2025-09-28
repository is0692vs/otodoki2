"""Add play history table."""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "202503050001"
down_revision: str | None = "8e18039f8d4a"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "play_history",
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
            "played_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("source", sa.String(length=50), nullable=True),
    )
    op.create_index(
        op.f("ix_play_history_id"),
        "play_history",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_play_history_user_id"),
        "play_history",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_play_history_external_track_id"),
        "play_history",
        ["external_track_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_play_history_track_id"),
        "play_history",
        ["track_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_play_history_track_id"), table_name="play_history")
    op.drop_index(
        op.f("ix_play_history_external_track_id"),
        table_name="play_history",
    )
    op.drop_index(op.f("ix_play_history_user_id"), table_name="play_history")
    op.drop_index(op.f("ix_play_history_id"), table_name="play_history")
    op.drop_table("play_history")
