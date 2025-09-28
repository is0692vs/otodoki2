# `backend/tests/` ディレクトリの AGENT ルール

このディレクトリには、バックエンドアプリケーションのユニットテストおよび統合テストが含まれます。

## 構造と役割

- `test_config.py`: アプリケーション設定モジュール (`app.core.config`) のテスト。
- `test_itunes_api.py`: iTunes API クライアント (`app.services.itunes_api`) のテスト。
- `test_queue.py`: キュー管理モジュール (`app.core.queue`) のテスト。
- `test_suggestions.py`: 楽曲提供サービス (`app.services.suggestions`) のテスト。
- `test_track.py`: 楽曲モデル (`app.models.track`) のテスト。
- `test_auth_evaluations_api.py`: 認証フローと評価 API のエンドツーエンド統合テスト。
- `test_worker_integration.py`: キュー補充ワーカー (`app.services.worker`) の統合テスト。

## 主要なコンポーネント

- 各 `test_*.py` ファイルは、対応するアプリケーションモジュールの機能が期待通りに動作するかを検証します。
- `pytest` フレームワークを使用してテストが実行されます。

## AI エージェントへの指示

- 新しい機能を追加または既存の機能を変更する際は、必ず関連するテストを記述または更新してください。
- テストは、機能の正確性、エッジケース、エラーハンドリングをカバーするように設計してください。
- 統合テストでは PostgreSQL を利用するため、`DATABASE_URL` が有効なデータベースを指していることを確認してください。Docker を使用する場合は `docker compose up -d db` でデータベースを起動してから `PYTHONPATH=./backend pytest backend/tests/` を実行してください。
