from __future__ import annotations

import httpx
import pytest
import respx  # type: ignore[import]
from httpx import Response

from app.services.apple_music_rss import AppleMusicRSSClient
from app.services.search_strategies.chart_keyword import (
    ChartKeywordSearchStrategy,
)


@pytest.mark.asyncio
@respx.mock(assert_all_called=True)
async def test_chart_keyword_strategy_returns_keywords(
    respx_mock: respx.Router,
) -> None:
    transport = httpx.MockTransport(respx_mock.handler)
    client = AppleMusicRSSClient(transport=transport)
    strategy = ChartKeywordSearchStrategy(
        country="jp", limit=3, client=client
    )

    sample_payload = {
        "feed": {
            "results": [
                {"artistName": "Artist One", "name": "Song Alpha"},
                {"artistName": "Artist Two", "name": "Song Beta"},
                {"artistName": "Artist Three", "name": "Song Gamma"},
            ]
        }
    }

    expected_terms = [
        "Artist One",
        "Song Alpha",
        "Artist Two",
        "Song Beta",
        "Artist Three",
        "Song Gamma",
    ]

    rss_url = (
        "https://rss.applemarketingtools.com/api/v2/"
        "jp/music/most-played/3/songs.json"
    )

    respx_mock.route(method="GET", url=rss_url).mock(
        return_value=Response(200, json=sample_payload)
    )
    assert respx_mock.routes, "respx route registration failed"
    params = await strategy.generate_params()

    assert "terms" in params
    assert params["terms"] == expected_terms


@pytest.mark.asyncio
@respx.mock(assert_all_called=True)
async def test_chart_keyword_strategy_handles_failure(
    respx_mock: respx.Router,
) -> None:
    transport = httpx.MockTransport(respx_mock.handler)
    client = AppleMusicRSSClient(transport=transport)
    strategy = ChartKeywordSearchStrategy(
        country="jp", limit=3, client=client
    )

    rss_url = (
        "https://rss.applemarketingtools.com/api/v2/"
        "jp/music/most-played/3/songs.json"
    )

    respx_mock.route(method="GET", url=rss_url).mock(
        return_value=Response(500)
    )
    assert respx_mock.routes, "respx route registration failed"
    with pytest.raises(ValueError):
        await strategy.generate_params()
