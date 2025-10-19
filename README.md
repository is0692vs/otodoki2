![GitHub last commit](https://img.shields.io/github/last-commit/is0692vs/otodoki2) ![GitHub issues](https://img.shields.io/github/issues/is0692vs/otodoki2) ![GitHub pull requests](https://img.shields.io/github/issues-pr/is0692vs/otodoki2)

## otodoki2 について

otodoki2 は、スワイプ UI で新しい楽曲に出会えるリアルタイム音楽評価・収集アプリケーションです。FastAPI バックエンド、Next.js (App Router) フロントエンド、React Native モバイルアプリで構成されています。

📖 **[クイックスタート](./docs/QUICK_START_VISUALS.md)**: スクリーンショットで主要機能の概要を確認できます。

## 主な機能

- **ユーザー認証**: メールアドレスとパスワードによる登録・ログイン機能 (JWT ベース)。
- **スワイプ式推薦**: `/swipe` でキューから楽曲を取得し、直感的に評価 (Like / Skip)。
- **楽曲ライブラリ**: `/library` で評価済み楽曲を一覧表示 (ログインユーザー限定)。
- **履歴の永続化**: 楽曲の評価と再生履歴を PostgreSQL に保存。
- **バックグラウンド補充**: iTunes API を利用して、バックグラウンドで再生キューを自動補充。
- **API ドキュメント**: `http://localhost:8000/docs` で OpenAPI スキーマを対話的に確認可能。

## リポジトリ構成

```
otodoki2/
├── backend/           # FastAPI バックエンド (API, Worker)
├── frontend/          # Next.js フロントエンド
├── mobile/            # React Native モバイルアプリ (Expo)
├── docs/              # 設計・仕様ドキュメント
├── scripts/           # 開発・検証用スクリプト
├── docker-compose.yml # コンテナオーケストレーション定義
└── Makefile           # 開発用コマンドショートカット
```

## 開発環境の起動

初回のみ、`.env.example` をコピーして `.env` ファイルを作成してください。

```bash
cp .env.example .env
```

その後、Dev Containers で開くか、以下のコマンドを実行すると、必要なサービスがすべて起動します。

```bash
# おすすめ: Makefile を使用した起動
make up

# もしくは直接 docker compose を使用
docker compose up -d --build
```

各サービスへは以下からアクセスできます。

- **フロントエンド**: [http://localhost:3000](http://localhost:3000)
- **バックエンド API**: [http://localhost:8000](http://localhost:8000)
- **モバイル開発ツール (Expo)**: [http://localhost:19000](http://localhost:19000)

コンテナ起動時に、Alembic によるデータベースマイグレーションが自動で実行されます。

サービスを停止するには `make down` または `docker compose down` を使用します。

## バックエンド環境変数

| 変数名                             | 説明                                                                     | デフォルト         |
| :--------------------------------- | :----------------------------------------------------------------------- | :----------------- |
| `DATABASE_URL`                     | PostgreSQL 接続文字列。Docker Compose 環境では `.env` の値が使用されます。 | `.env` 参照        |
| `POSTGRES_DB`                      | PostgreSQL データベース名。                                              | `otodoki2`         |
| `POSTGRES_USER`                    | PostgreSQL ユーザー名。                                                  | `otodoki`          |
| `POSTGRES_PASSWORD`                | PostgreSQL パスワード。                                                  | `otodoki-password` |
| `JWT_SECRET_KEY`                   | アクセストークン署名用のシークレットキー。                               | (必須)             |
| `JWT_REFRESH_SECRET_KEY`           | リフレッシュトークン署名用シークレット。                                 | (必須)             |
| `GEMINI_API_KEY`                   | Gemini を利用したキーワード生成に使用します。                            | `changeme`         |

その他の変数の詳細は `backend/app/core/config.py` を参照してください。

## フロントエンド環境変数

- `NEXT_PUBLIC_API_URL`: バックエンド API のベース URL。未設定の場合は `http://localhost:8000` が使用されます。

## 開発ワークフロー

### テスト
バックエンドのテストは、データベースコンテナを起動した状態で実行します。

```bash
# データベースコンテナを起動
docker compose up -d db

# テストを実行 (ホストの 5433 ポートに注意)
DATABASE_URL=postgresql+asyncpg://otodoki:otodoki-password@localhost:5433/otodoki2 \
GEMINI_API_KEY=dummy \
PYTHONPATH=./backend pytest backend/tests/
```

### マイグレーション
モデルの変更後にマイグレーションファイルを生成・適用します。

```bash
# 新しいリビジョンファイルを生成
alembic revision --autogenerate -m "リビジョンメッセージ"

# データベースに適用 (コンテナ起動時に自動実行)
alembic upgrade head
```

### ログ確認
`docker compose logs -f <service_name>` で各サービスのログをリアルタイムで確認できます (例: `api`, `web`, `mobile`)。

## モバイル開発

`mobile/` ディレクトリで React Native + Expo を使用したモバイルアプリを開発します。

### 開発環境の構築

```bash
# 依存関係をインストール
cd mobile
npm install

# Expo 開発サーバーを起動
npm start
```

### モバイルアプリのテスト

- **Expo Go アプリ**: QR コードをスキャンして実機でテスト。
- **iOS シミュレーター**: `npm run ios` (macOS のみ)
- **Android エミュレーター**: `npm run android`
- **Web プレビュー**: `npm run web`

## ドキュメント

プロジェクトに関する詳細なドキュメントは [`docs/`](./docs/) ディレクトリにあります。

- 📖 **[クイックスタート](./docs/QUICK_START_VISUALS.md)** - スクリーンショットによる機能紹介
- 🏗️ **[システムアーキテクチャ](./docs/ARCHITECTURE.md)** - 全体構成図
- 🔧 **[ワーカー仕様](./docs/WORKER_README.md)** - バックグラウンドワーカーの詳細
- 🚀 **[デプロイガイド](./docs/DEPLOYMENT.md)** - 本番環境へのデプロイ手順
- 📱 **[モバイル実装](./docs/mobile-implementation.md)** - モバイルアプリの実装詳細

## ライセンス

本プロジェクトは学習目的で公開されています。ライセンスは未定です。