import importlib
import pkgutil
import inspect
from typing import Type

from .base import BaseSearchStrategy

def get_strategy(strategy_name: str) -> BaseSearchStrategy:
    """
    指定された戦略名に基づいて戦略クラスのインスタンスを取得する。
    動的にモジュールをインポートし、BaseSearchStrategyを継承したクラスを探す。

    Args:
        strategy_name: 使用する戦略名 (モジュール名と一致)

    Returns:
        BaseSearchStrategy: 戦略クラスのインスタンス

    Raises:
        ImportError: 指定された戦略が見つからない場合に発生
    """
    try:
        # モジュールを動的にインポート
        # e.g., "random_keyword" -> "backend.app.services.search_strategies.random_keyword"
        module_path = f"backend.app.services.search_strategies.{strategy_name}"
        strategy_module = importlib.import_module(module_path)

        # モジュール内でBaseSearchStrategyを継承したクラスを探索
        for name, obj in inspect.getmembers(strategy_module, inspect.isclass):
            if issubclass(obj, BaseSearchStrategy) and obj is not BaseSearchStrategy:
                # 戦略クラスのインスタンスを生成して返す
                return obj()

        raise ImportError(f"No class inheriting from BaseSearchStrategy found in module: {strategy_name}")

    except (ImportError, AttributeError) as e:
        raise ImportError(f"Could not load search strategy '{strategy_name}'. Ensure the file 'backend/app/services/search_strategies/{strategy_name}.py' exists and contains a valid strategy class. Error: {e}")

def list_strategies() -> list[str]:
    """
    利用可能なすべての戦略名（モジュール名）のリストを返す

    Returns:
        list[str]: 利用可能な戦略名のリスト
    """
    package_path = "backend.app.services.search_strategies"
    package = importlib.import_module(package_path)

    available_strategies = []
    for _, name, is_pkg in pkgutil.iter_modules(package.__path__):
        if not is_pkg and name != 'base':
            available_strategies.append(name)

    return available_strategies
