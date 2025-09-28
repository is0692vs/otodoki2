"""Create initial tables"""

revision = "8e18039f8d4a"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """No-op: schema already captured in 0001."""


def downgrade() -> None:
    """No-op: schema already captured in 0001."""
