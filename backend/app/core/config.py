"""
アプリケーション設定管理モジュール
キューの設定値を環境変数から読み込み、適切なデフォルト値を提供する
"""

import os
from typing import List


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


class WorkerConfig:
    """iTunes APIワーカーに関する設定値を管理するクラス"""
    
    @staticmethod
    def get_itunes_terms() -> List[str]:
        """iTunes検索キーワードリストを取得
        
        Returns:
            List[str]: 検索キーワードリスト（デフォルト: 具体的なアーティスト名）
        """
        value = os.getenv("OTODOKI_ITUNES_TERMS", "さくら,YOASOBI,米津玄師,あいみょん,Official髭男dism")
        try:
            terms = [term.strip() for term in value.split(",") if term.strip()]
            return terms if terms else ["さくら", "YOASOBI", "米津玄師", "あいみょん", "Official髭男dism"]
        except Exception:
            return ["さくら", "YOASOBI", "米津玄師", "あいみょん", "Official髭男dism"]
    
    @staticmethod
    def get_country() -> str:
        """iTunes検索の対象国を取得
        
        Returns:
            str: 国コード（デフォルト: "JP"）
        """
        return os.getenv("OTODOKI_COUNTRY", "JP")
    
    @staticmethod
    def get_min_threshold() -> int:
        """キューの最小閾値を取得
        
        Returns:
            int: 最小閾値（デフォルト: 30）
        """
        value = os.getenv("OTODOKI_MIN_THRESHOLD", "30")
        try:
            return max(1, int(value))
        except ValueError:
            return 30
    
    @staticmethod
    def get_batch_size() -> int:
        """1回の補充単位を取得
        
        Returns:
            int: バッチサイズ（デフォルト: 30）
        """
        value = os.getenv("OTODOKI_BATCH_SIZE", "30")
        try:
            return max(1, int(value))
        except ValueError:
            return 30
    
    @staticmethod
    def get_max_cap() -> int:
        """キューの最大容量上限を取得
        
        Returns:
            int: 最大容量上限（デフォルト: 300）
        """
        value = os.getenv("OTODOKI_MAX_CAP", "300")
        try:
            return max(1, int(value))
        except ValueError:
            return 300
    
    @staticmethod
    def get_poll_interval_ms() -> int:
        """ポーリング間隔（ミリ秒）を取得
        
        Returns:
            int: ポーリング間隔（デフォルト: 1500ms）
        """
        value = os.getenv("OTODOKI_POLL_INTERVAL_MS", "1500")
        try:
            return max(100, int(value))  # 最小100ms
        except ValueError:
            return 1500
    
    @staticmethod
    def get_http_timeout_s() -> float:
        """HTTPタイムアウト（秒）を取得
        
        Returns:
            float: タイムアウト秒数（デフォルト: 5.0）
        """
        value = os.getenv("OTODOKI_HTTP_TIMEOUT_S", "5.0")
        try:
            return max(1.0, float(value))
        except ValueError:
            return 5.0
    
    @staticmethod
    def get_retry_max() -> int:
        """最大リトライ回数を取得
        
        Returns:
            int: 最大リトライ回数（デフォルト: 3）
        """
        value = os.getenv("OTODOKI_RETRY_MAX", "3")
        try:
            return max(0, int(value))
        except ValueError:
            return 3
    
    @staticmethod
    def get_all_settings() -> dict:
        """すべての設定値を辞書で取得
        
        Returns:
            dict: 設定値の辞書
        """
        return {
            "itunes_terms": WorkerConfig.get_itunes_terms(),
            "country": WorkerConfig.get_country(),
            "min_threshold": WorkerConfig.get_min_threshold(),
            "batch_size": WorkerConfig.get_batch_size(),
            "max_cap": WorkerConfig.get_max_cap(),
            "poll_interval_ms": WorkerConfig.get_poll_interval_ms(),
            "http_timeout_s": WorkerConfig.get_http_timeout_s(),
            "retry_max": WorkerConfig.get_retry_max(),
        }
