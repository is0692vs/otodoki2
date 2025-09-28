import random
from typing import Dict, Any, List

from .base import BaseSearchStrategy
from ...core.config import WorkerConfig

class ArtistSearchStrategy(BaseSearchStrategy):
    """
    設定ファイルからアーティスト名をランダムに選び、そのアーティストの楽曲を検索する戦略
    """

    def __init__(self):
        """
        設定からアーティストリストを読み込む
        """
        self.artists: List[str] = WorkerConfig.get_itunes_terms()

    def generate_params(self) -> Dict[str, Any]:
        """
        アーティスト名で楽曲(musicTrack)を検索するパラメータを生成する

        Returns:
            Dict[str, Any]: パラメータ辞書。アーティストリストが空の場合は
                           フォールバックとして空の辞書を返す。
        """
        if not self.artists:
            # 設定にアーティストが一人もいない場合、フォールバック
            return {"term": "J-POP"}

        artist = random.choice(self.artists)
        return {
            "term": artist,
            "entity": "musicTrack"
        }
