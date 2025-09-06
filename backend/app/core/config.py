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


class GeminiConfig:
    """Gemini APIに関する設定値を管理するクラス"""

    @staticmethod
    def get_api_key() -> str:
        """Gemini APIキーを取得

        Returns:
            str: Gemini APIキー
        """
        value = os.getenv("GEMINI_API_KEY")
        if not value:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")
        return value

    @staticmethod
    def get_model_name() -> str:
        """Geminiモデル名を取得

        Returns:
            str: モデル名（デフォルト: "gemini-1.5-flash"）
        """
        return os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

    @staticmethod
    def get_prompt() -> str:
        """キーワード生成用のプロンプトを取得

        Returns:
            str: プロンプト文
        """
        default_prompt = """多様な音楽検索キーワードを生成してください。具体的なアーティスト名、曲名、ジャンル、年代などのキーワードを含めてください。日本国内の人気音楽を中心に考えてください。

例: 米津玄師, YOASOBI, さくら, J-POP, 2023, ロック, Official髭男dism

カンマ区切りで10個程度のキーワードを生成してください。"""
        return os.getenv("GEMINI_PROMPT", default_prompt)

    @staticmethod
    def get_generation_config() -> dict:
        """Gemini生成設定を取得

        Returns:
            dict: 生成設定
        """
        return {
            "temperature": float(os.getenv("GEMINI_TEMPERATURE", "0.7")),
            "top_p": float(os.getenv("GEMINI_TOP_P", "1")),
            "top_k": int(os.getenv("GEMINI_TOP_K", "40")),
            "max_output_tokens": int(os.getenv("GEMINI_MAX_TOKENS", "1024")),
        }

    @staticmethod
    def get_all_settings() -> dict:
        """すべての設定値を辞書で取得

        Returns:
            dict: 設定値の辞書
        """
        return {
            "api_key": GeminiConfig.get_api_key(),
            "model_name": GeminiConfig.get_model_name(),
            "prompt": GeminiConfig.get_prompt(),
            "generation_config": GeminiConfig.get_generation_config(),
        }


class WorkerConfig:
    """iTunes APIワーカーに関する設定値を管理するクラス"""

    @staticmethod
    def get_itunes_terms() -> List[str]:
        """iTunes検索キーワードリストを取得

        Returns:
            List[str]: 検索キーワードリスト（デフォルト: 具体的なアーティスト名）
        """
        value = os.getenv("OTODOKI_ITUNES_TERMS",
                          "さくら,YOASOBI,米津玄師,あいみょん,Official髭男dism")
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
    def get_search_strategy() -> str:
        """検索戦略を取得

        Returns:
            str: 検索戦略名（デフォルト: "gemini_keyword"）
        """
        # README.md に記載のデフォルト値 'gemini_keyword' を使用し、環境変数から読み込むように修正
        return os.getenv("OTODOKI_SEARCH_STRATEGY", "gemini_keyword")

    @staticmethod
    def get_search_genres() -> List[str]:
        """ジャンル検索で利用するジャンルリストを取得

        Returns:
            List[str]: ジャンル名のリスト
        """
        default_genres = "J-POP,Rock,Anime,Jazz,Classic,Pop,Electronic,Hip-Hop"
        value = os.getenv("OTODOKI_SEARCH_GENRES", default_genres)
        try:
            genres = [genre.strip()
                      for genre in value.split(",") if genre.strip()]
            return genres if genres else default_genres.split(",")
        except Exception:
            return default_genres.split(",")

    @staticmethod
    def get_search_years() -> List[str]:
        """年別検索で利用する年のリストを取得

        Returns:
            List[str]: 年のリスト
        """
        default_years = "2020,2021,2022,2023,2024"
        value = os.getenv("OTODOKI_SEARCH_YEARS", default_years)
        try:
            years = [year.strip() for year in value.split(",") if year.strip()]
            return years if years else default_years.split(",")
        except Exception:
            return default_years.split(",")

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
            "search_strategy": WorkerConfig.get_search_strategy(),
            "search_genres": WorkerConfig.get_search_genres(),
            "search_years": WorkerConfig.get_search_years(),
        }

    @staticmethod
    def get_available_search_strategies() -> List[str]:
        """利用可能な検索戦略のリストを取得

        Returns:
            List[str]: 利用可能な検索戦略名のリスト
        """
        # ここに利用可能なすべての戦略名を追加
        return ["gemini_keyword", "random_keyword", "artist_search", "genre_search", "release_year_search"]


class SuggestionsConfig:
    """楽曲提供API設定値を管理するクラス"""

    @staticmethod
    def get_default_limit() -> int:
        """デフォルトのlimit値を取得

        Returns:
            int: デフォルトlimit（デフォルト: 10）
        """
        value = os.getenv("OTODOKI_SUGGESTIONS_DEFAULT_LIMIT", "10")
        try:
            return max(1, int(value))
        except ValueError:
            return 10

    @staticmethod
    def get_max_limit() -> int:
        """最大のlimit値を取得

        Returns:
            int: 最大limit（デフォルト: 50）
        """
        value = os.getenv("OTODOKI_SUGGESTIONS_MAX_LIMIT", "50")
        try:
            return max(1, int(value))
        except ValueError:
            return 50

    @staticmethod
    def get_rate_limit_per_sec() -> int:
        """1秒あたりのレート制限を取得

        Returns:
            int: 1秒あたりの最大リクエスト数（デフォルト: 20）
        """
        value = os.getenv("OTODOKI_RATE_LIMIT_PER_SEC", "20")
        try:
            return max(1, int(value))
        except ValueError:
            return 20

    @staticmethod
    def get_all_settings() -> dict:
        """すべての設定値を辞書で取得

        Returns:
            dict: 設定値の辞書
        """
        return {
            "default_limit": SuggestionsConfig.get_default_limit(),
            "max_limit": SuggestionsConfig.get_max_limit(),
            "rate_limit_per_sec": SuggestionsConfig.get_rate_limit_per_sec(),
        }
