"""
データベース設定モジュール
PostgreSQL接続設定とパラメータ管理
"""

import os


class DatabaseConfig:
    """データベースに関する設定値を管理するクラス"""

    @staticmethod
    def get_database_url() -> str:
        """データベースURLを取得

        Returns:
            str: データベース接続URL
        """
        host = os.getenv("DB_HOST", "db")
        port = os.getenv("DB_PORT", "5432")
        user = os.getenv("DB_USER", "user")
        password = os.getenv("DB_PASSWORD", "password")
        database = os.getenv("DB_NAME", "otodoki2")

        return f"postgresql://{user}:{password}@{host}:{port}/{database}"

    @staticmethod
    def get_pool_size() -> int:
        """接続プールサイズを取得

        Returns:
            int: プールサイズ（デフォルト: 10）
        """
        value = os.getenv("DB_POOL_SIZE", "10")
        try:
            return max(1, int(value))
        except ValueError:
            return 10

    @staticmethod
    def get_max_overflow() -> int:
        """最大オーバーフロー接続数を取得

        Returns:
            int: 最大オーバーフロー（デフォルト: 20）
        """
        value = os.getenv("DB_MAX_OVERFLOW", "20")
        try:
            return max(0, int(value))
        except ValueError:
            return 20

    @staticmethod
    def get_pool_recycle() -> int:
        """プール再利用時間（秒）を取得

        Returns:
            int: 再利用時間（デフォルト: 3600秒）
        """
        value = os.getenv("DB_POOL_RECYCLE", "3600")
        try:
            return max(0, int(value))
        except ValueError:
            return 3600

    @staticmethod
    def get_echo() -> bool:
        """SQLログ出力設定を取得

        Returns:
            bool: SQLログ出力（デフォルト: False）
        """
        return os.getenv("DB_ECHO", "false").lower() == "true"

    @staticmethod
    def get_all_settings() -> dict:
        """すべての設定値を辞書で取得

        Returns:
            dict: 設定値の辞書
        """
        return {
            "database_url": DatabaseConfig.get_database_url(),
            "pool_size": DatabaseConfig.get_pool_size(),
            "max_overflow": DatabaseConfig.get_max_overflow(),
            "pool_recycle": DatabaseConfig.get_pool_recycle(),
            "echo": DatabaseConfig.get_echo(),
        }
