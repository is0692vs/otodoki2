import random
from typing import Dict, Any, List

from .base import BaseSearchStrategy
from ...core.config import WorkerConfig

class ReleaseYearSearchStrategy(BaseSearchStrategy):
    """
    設定ファイルから年をランダムに選び、その年にリリースされた楽曲を検索する戦略
    """

    def __init__(self):
        """
        設定から年リストを読み込む
        """
        self.years: List[str] = WorkerConfig.get_search_years()

    def generate_params(self) -> Dict[str, Any]:
        """
        リリース年(releaseYearTerm)で楽曲(song)を検索するパラメータを生成する

        Returns:
            Dict[str, Any]: パラメータ辞書。年リストが空の場合は
                           フォールバックとして空の辞書を返す。
        """
        if not self.years:
            return {"term": "J-POP"}

        year = random.choice(self.years)
        return {
            "term": year,
            "entity": "song",
            "attribute": "releaseYearTerm"
        }
