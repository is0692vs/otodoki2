import random
from typing import Dict, Any, List

from .base import BaseSearchStrategy
from ...core.config import WorkerConfig

class GenreSearchStrategy(BaseSearchStrategy):
    """
    設定ファイルからジャンルをランダムに選び、そのジャンルの楽曲を検索する戦略
    """

    def __init__(self):
        """
        設定からジャンルリストを読み込む
        """
        self.genres: List[str] = WorkerConfig.get_search_genres()

    def generate_params(self) -> Dict[str, Any]:
        """
        ジャンル(genreIndex)で楽曲(song)を検索するパラメータを生成する

        Returns:
            Dict[str, Any]: パラメータ辞書。ジャンルリストが空の場合は
                           フォールバックとして空の辞書を返す。
        """
        if not self.genres:
            return {"term": "J-POP"}

        genre = random.choice(self.genres)
        return {
            "term": genre,
            "entity": "song",
            "attribute": "genreIndex"
        }
