from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseSearchStrategy(ABC):
    """
    検索パラメータ生成戦略の基底クラス
    """

    @abstractmethod
    async def generate_params(self) -> Dict[str, Any]:
        """
        iTunes APIの検索パラメータを生成する

        Returns:
            Dict[str, Any]: APIリクエストに使用するパラメータの辞書
        """
        pass
