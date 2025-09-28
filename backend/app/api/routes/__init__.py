"""FastAPI route modules."""

from .auth import router as auth_router
from .evaluations import router as evaluations_router
from .history import router as history_router
from .playback import router as playback_router

__all__ = [
    "auth_router",
    "evaluations_router",
    "history_router",
    "playback_router",
]
