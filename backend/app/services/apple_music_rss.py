from __future__ import annotations

from typing import Any, Dict, Optional

import httpx


class AppleMusicRSSClientError(RuntimeError):
    """Raised when the Apple Music RSS client fails to fetch data."""


class AppleMusicRSSClient:
    """Client for interacting with the Apple Music RSS feeds."""

    BASE_URL = "https://rss.applemarketingtools.com/api/v2"

    def __init__(
        self,
        timeout: float = 10.0,
        transport: Optional[httpx.AsyncBaseTransport] = None,
    ) -> None:
        self._timeout = timeout
        self._transport = transport

    async def get_top_songs(
        self, country: str = "jp", limit: int = 100
    ) -> Dict[str, Any]:
        """Fetch the most played songs from the Apple Music RSS feed."""
        url = f"{self.BASE_URL}/{country}/music/most-played/{limit}/songs.json"

        try:
            async with httpx.AsyncClient(
                timeout=self._timeout,
                follow_redirects=True,
                transport=self._transport,
            ) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            raise AppleMusicRSSClientError(
                "Failed to fetch Apple Music RSS feed"
            ) from exc
