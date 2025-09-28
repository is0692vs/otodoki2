# Deployment Guide

このドキュメントでは、otodoki2web のデプロイメント手順と設定について説明します。

## Docker Compose 設定

プロジェクトは Docker Compose を使用してバックエンド、フロントエンド、PostgreSQL を一括管理します。

### 環境変数

`.env` ファイルに以下の変数を設定してください：

- `POSTGRES_DB`: PostgreSQL データベース名 (デフォルト: `otodoki2`)
- `POSTGRES_USER`: PostgreSQL ユーザー名 (デフォルト: `otodoki`)
- `POSTGRES_PASSWORD`: PostgreSQL パスワード (デフォルト: `otodoki-password`)
- `DATABASE_URL`: バックエンドが使用する接続文字列 (例: `postgresql+asyncpg://otodoki:otodoki-password@db:5432/otodoki2`)
- `JWT_SECRET_KEY`: JWT 署名用シークレット
- `JWT_REFRESH_SECRET_KEY`: リフレッシュトークン用シークレット
- `GEMINI_API_KEY`: Gemini API キー (開発時はダミー値可)

### 自動マイグレーション

API コンテナ起動時に `backend/start.sh` が実行され、Alembic を使用したデータベースマイグレーションが自動的に行われます。

### ビルドと起動

```bash
docker compose up -d --build
```

これにより、PostgreSQL のマイグレーションが完了した後に FastAPI が起動します。

## トラブルシューティング

- マイグレーションエラーが発生した場合: `docker compose exec api alembic upgrade head` を手動実行
- DB 接続エラー: POSTGRES\_\* 変数が正しく設定されているか確認
