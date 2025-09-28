from __future__ import annotations

from typing import Any, Dict, List, Optional

from .base import BaseSearchStrategy
from ..apple_music_rss import AppleMusicRSSClient, AppleMusicRSSClientError


class ChartKeywordSearchStrategy(BaseSearchStrategy):
    """Generate search keywords from the Apple Music charts."""

    def __init__(
        self,
        country: str = "jp",
        limit: int = 100,
        client: Optional[AppleMusicRSSClient] = None,
    ) -> None:
        self._country = country
        self._limit = limit
        self._client = client or AppleMusicRSSClient()

    async def generate_params(self) -> Dict[str, Any]:
        keywords = await self._generate_keywords()

        if not keywords:
            raise ValueError("No keywords could be generated from RSS feed")

        return {"terms": keywords}

    async def _generate_keywords(self) -> List[str]:
        try:
            payload = await self._client.get_top_songs(
                country=self._country, limit=self._limit
            )
        except AppleMusicRSSClientError as exc:
            raise ValueError("Failed to fetch Apple Music RSS feed") from exc

        feed = payload.get("feed", {}) if isinstance(payload, dict) else {}
        results = feed.get("results", []) if isinstance(feed, dict) else []

        collected: List[str] = []
        for entry in results:
            if not isinstance(entry, dict):
                continue

            artist = entry.get("artistName")
            title = entry.get("name")

            if isinstance(artist, str):
                normalized = artist.strip()
                if normalized:
                    collected.append(normalized)

            if isinstance(title, str):
                normalized = title.strip()
                if normalized:
                    collected.append(normalized)

        # Preserve order while removing duplicates
        unique_keywords = list(dict.fromkeys(collected))
        return unique_keywords
