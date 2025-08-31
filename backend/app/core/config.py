"""
アプリケーション設定管理モジュール
キューの設定値を環境変数から読み込み、適切なデフォルト値を提供する
"""

import os


class QueueConfig:
    """キューに関する設定値を管理するクラス"""
    
    @staticmethod
    def get_max_capacity() -> int:
        """キューの最大容量を取得
        
        Returns:
            int: キューの最大容量（デフォルト: 1000）
        """
        value = os.getenv("QUEUE_MAX_CAPACITY", "1000")
        try:
            return max(1, int(value))  # 最小値は1
        except ValueError:
            return 1000
    
    @staticmethod
    def get_dequeue_default_n() -> int:
        """dequeueのデフォルト取得件数を取得
        
        Returns:
            int: デフォルト取得件数（デフォルト: 10）
        """
        value = os.getenv("QUEUE_DEQUEUE_DEFAULT_N", "10")
        try:
            return max(1, int(value))  # 最小値は1
        except ValueError:
            return 10
    
    @staticmethod
    def get_low_watermark() -> int:
        """キューの補充トリガ閾値を取得
        
        Returns:
            int: 低水位マーク（デフォルト: 100）
        """
        value = os.getenv("QUEUE_LOW_WATERMARK", "100")
        try:
            return max(0, int(value))  # 最小値は0
        except ValueError:
            return 100
    
    @staticmethod
    def get_all_settings() -> dict:
        """すべての設定値を辞書で取得
        
        Returns:
            dict: 設定値の辞書
        """
        return {
            "max_capacity": QueueConfig.get_max_capacity(),
            "dequeue_default_n": QueueConfig.get_dequeue_default_n(),
            "low_watermark": QueueConfig.get_low_watermark(),
        }
