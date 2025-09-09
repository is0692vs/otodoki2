"""
データベース接続管理
SQLAlchemyエンジンとセッションの管理
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator

from .config import DatabaseConfig


class DatabaseConnection:
    """データベース接続管理クラス"""

    def __init__(self, config: DatabaseConfig):
        self.config = config
        self._engine = None
        self._session_factory = None

    @property
    def engine(self):
        """SQLAlchemyエンジン"""
        if self._engine is None:
            self._engine = create_engine(
                self.config.get_database_url(),
                poolclass=QueuePool,
                pool_size=self.config.get_pool_size(),
                max_overflow=self.config.get_max_overflow(),
                pool_pre_ping=True,  # 接続の健全性を確認
                echo=self.config.get_echo(),  # SQLログ出力
            )
        return self._engine

    @property
    def session_factory(self):
        """セッションファクトリ"""
        if self._session_factory is None:
            self._session_factory = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
        return self._session_factory

    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """セッションを取得するコンテキストマネージャー"""
        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def create_tables(self):
        """テーブルを作成"""
        from .models import Base
        Base.metadata.create_all(bind=self.engine)

    def drop_tables(self):
        """テーブルを削除"""
        from .models import Base
        Base.metadata.drop_all(bind=self.engine)


# グローバル接続インスタンス
_db_connection: DatabaseConnection | None = None


def get_database_connection() -> DatabaseConnection:
    """データベース接続インスタンスを取得"""
    global _db_connection
    if _db_connection is None:
        config = DatabaseConfig()
        _db_connection = DatabaseConnection(config)
    return _db_connection


def get_session() -> Generator[Session, None, None]:
    """セッションを取得する便利関数"""
    connection = get_database_connection()
    with connection.get_session() as session:
        yield session
