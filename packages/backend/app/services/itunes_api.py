"""
iTunes Search API統合モジュール
楽曲データの検索と取得機能を提供する
"""

import asyncio
import logging
import random
from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timedelta

import httpx

from ..models.track import Track
from ..core.config import WorkerConfig

logger = logging.getLogger(__name__)


class iTunesApiClient:
    """iTunes Search APIクライアント

    楽曲データの検索、取得、整形機能を提供する
    """

    def __init__(self):
        """クライアントを初期化"""
        self.config = WorkerConfig()
        self.base_url = "https://itunes.apple.com/search"
        self.timeout = httpx.Timeout(
            connect=2.0,
            read=self.config.get_http_timeout_s(),
            write=5.0,
            pool=5.0
        )

        # 重複排除用のIDセット（最近取得したトラックID）
        self._recent_track_ids: Set[str] = set()
        self._track_id_cleanup_interval = timedelta(minutes=1) # 1分間に変更
        self._last_cleanup = datetime.now()

        logger.info("iTunes API client initialized")

    def pick_search_term(self) -> str:
        """iTunes API検索キーワードをランダムに選択（クールダウン考慮なし）
        
        検索戦略によってキーワードが提供されるため、このメソッドはiTunes APIのテスト用途でのみ使用される。
        
        Returns:
            str: 選択された検索キーワード
        """
        terms = self.config.get_itunes_terms()
        # 複数戦略が導入されたため、ここではランダムキーワード戦略のデフォルトキーワードを使用
        # TODO: 検索戦略に応じたキーワード選択ロジックをここに統合するか、別の場所に移管する
        # 現状はテスト用途のため、シンプルにデフォルトのキーワードリストから選択
        default_terms = ["さくら", "YOASOBI", "米津玄師", "あいみょん", "Official髭男dism"]
        
        if not terms:
            terms = default_terms
            
        return random.choice(terms)

    async def search_tracks(self, custom_params: Dict[str, Any], limit: int = 200) -> List[Dict[str, Any]]:
        """iTunes Search APIで楽曲を検索

        Args:
            custom_params: 検索戦略によって生成されたカスタムパラメータ
            limit: 取得件数上限

        Returns:
            List[Dict[str, Any]]: 楽曲データのリスト

        Raises:
            httpx.HTTPError: API呼び出しエラー
        """
        # デフォルトパラメータで基本設定
        params = {
            "media": "music",
            "limit": min(limit, 200),
            "lang": "ja_jp",
            "country": self.config.get_country().lower()
        }
        # カスタムパラメータで上書き・追加
        params.update(custom_params)

        # 安全策：termが未指定または空の場合はデフォルト値設定
        if "term" not in params or not params.get("term"):
            params["term"] = "J-POP"

        term_for_log = params.get("term", "[no term]")

        # リトライロジック付きでAPIコール
        retry_count = 0
        max_retries = self.config.get_retry_max()

        while retry_count <= max_retries:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    logger.debug(f"Searching iTunes API with params: {params}")
                    response = await client.get(self.base_url, params=params)

                    # 4xxエラーはリトライしない
                    if 400 <= response.status_code < 500:
                        logger.warning(f"iTunes API 4xx error: {response.status_code} for term '{term_for_log}'")
                        return []

                    response.raise_for_status()
                    data = response.json()

                    results = data.get("results", [])
                    logger.info(f"iTunes API success: term='{term_for_log}', found {len(results)} tracks")
                    return results

            except httpx.TimeoutException as e:
                retry_count += 1
                logger.warning(f"iTunes API timeout (attempt {retry_count}/{max_retries + 1}): {e}")
                if retry_count <= max_retries:
                    wait_time = (2 ** retry_count) * 0.5  # 指数バックオフ
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"iTunes API timeout after {max_retries + 1} attempts")
                    raise

            except httpx.HTTPStatusError as e:
                retry_count += 1
                if e.response.status_code >= 500:  # 5xxのみリトライ
                    logger.warning(f"iTunes API 5xx error (attempt {retry_count}/{max_retries + 1}): {e}")
                    if retry_count <= max_retries:
                        wait_time = (2 ** retry_count) * 0.5
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(f"iTunes API 5xx error after {max_retries + 1} attempts")
                        raise
                else:
                    logger.warning(f"iTunes API non-retryable error: {e}")
                    return []

            except Exception as e:
                retry_count += 1
                logger.warning(f"iTunes API unexpected error (attempt {retry_count}/{max_retries + 1}): {e}")
                if retry_count <= max_retries:
                    wait_time = (2 ** retry_count) * 0.5
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"iTunes API error after {max_retries + 1} attempts: {e}")
                    raise

        return []

    def clean_and_filter_tracks(self, raw_tracks: List[Dict[str, Any]]) -> List[Track]:
        """iTunes APIの生データを整形し、重複排除とフィルタリングを行う

        Args:
            raw_tracks: iTunes APIからの生データ

        Returns:
            List[Track]: 整形済みTrackオブジェクトのリスト
        """
        cleaned_tracks = []
        skipped_count = 0
        duplicate_count = 0

        for raw_track in raw_tracks:
            try:
                # 必須フィールドのチェック
                track_id: Optional[Any] = raw_track.get("trackId")
                track_name: Optional[str] = raw_track.get("trackName")
                artist_name: Optional[str] = raw_track.get("artistName")
                preview_url: Optional[str] = raw_track.get("previewUrl")
                artwork_url: Optional[str] = raw_track.get("artworkUrl100")

                if not all([track_id, track_name, artist_name, preview_url, artwork_url]):
                    skipped_count += 1
                    continue

                # 重複チェック
                track_id_str = str(track_id)
                if track_id_str in self._recent_track_ids:
                    duplicate_count += 1
                    continue

                # アートワークURLの高解像度化
                optimized_artwork_url = self._optimize_artwork_url(artwork_url if artwork_url else "")

                # Trackオブジェクト作成
                track = Track(
                    id=track_id_str,
                    title=track_name if track_name else "",
                    artist=artist_name if artist_name else "",
                    artwork_url=optimized_artwork_url,
                    preview_url=preview_url,
                    album=raw_track.get("collectionName"),
                    duration_ms=raw_track.get("trackTimeMillis"),
                    genre=raw_track.get("primaryGenreName")
                )

                cleaned_tracks.append(track)
                self._recent_track_ids.add(track_id_str)

            except Exception as e:
                logger.warning(f"Failed to process track data: {e}")
                skipped_count += 1
                continue

        # ログ出力
        if skipped_count > 0:
            logger.warning(f"Skipped {skipped_count} tracks due to missing fields")
        if duplicate_count > 0:
            logger.info(f"Skipped {duplicate_count} duplicate tracks")

        logger.info(f"Processed {len(cleaned_tracks)} valid tracks from {len(raw_tracks)} raw records")

        # 定期的なクリーンアップ
        self._cleanup_track_ids()

        return cleaned_tracks

    def _optimize_artwork_url(self, artwork_url: Optional[str]) -> str:
        """アートワークURLを高解像度に最適化

        Args:
            artwork_url: 元のアートワークURL

        Returns:
            str: 最適化されたURL
        """
        if artwork_url and "100x100" in artwork_url:
            # 100x100を600x600に変更
            return artwork_url.replace("100x100", "600x600")
        return artwork_url if artwork_url else ""

    def _cleanup_track_ids(self) -> None:
        """古いトラックIDをクリーンアップ"""
        current_time = datetime.now()
        if (current_time - self._last_cleanup) >= self._track_id_cleanup_interval:
            # 簡単な実装：一定時間後に全てクリア
            old_count = len(self._recent_track_ids)
            self._recent_track_ids.clear()
            self._last_cleanup = current_time
            if old_count > 0:
                logger.debug(f"Cleaned up {old_count} track IDs from memory")
