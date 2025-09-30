![GitHub last commit](https://img.shields.io/github/last-commit/is0692vs/otodoki2) ![GitHub issues](https://img.shields.io/github/issues/is0692vs/otodoki2) ![GitHub pull requests](https://img.shields.io/github/issues-pr/is0692vs/otodoki2)

## otodoki2 について

otodoki2 は、マッチングアプリのようなスワイプ UI で楽曲を評価・収集できる Web アプリケーションです。FastAPI + SQLModel で構成されたバックエンド API と Next.js (App Router) のフロントエンド、そして React Native によるモバイルアプリにより、リアルタイムでキューを補充しながら新しい楽曲に出会えます。2025 年 2 月より、PostgreSQL を利用した永続化とユーザー認証 (メール + パスワード, JWT) をサポートしました。

📖 **[ビジュアルガイド](./docs/VISUAL_GUIDE.md)**: スクリーンショットと動画で機能を確認できます。

## 主な機能

- **ユーザー登録 / ログイン**: `/register` と `/login` ページからユーザーを作成し、アクセストークン + リフレッシュトークンでセッション管理します。
- **スワイプ式推薦**: `/swipe` でキューから音楽を取得し、Like / Skip を直感的に操作します。
- **楽曲ライブラリ**: `/library` はログイン済みユーザー専用で、バックエンド API を使用して評価済みの楽曲を一覧表示します。
- **評価・再生履歴の永続化**: スワイプ結果は `/api/v1/evaluations` に保存され、再生開始時には `/api/v1/history/played` を呼び出してユーザー別の履歴を記録します。
- **バックグラウンド補充ワーカー**: iTunes API を活用し、PostgreSQL にキャッシュしながらキューを自動で補充します。
- **API ドキュメント**: [http://localhost:8000/docs](http://localhost:8000/docs) にて FastAPI の OpenAPI スキーマを確認できます。

## リポジトリ構成

```
otodoki2/
├── backend/           # FastAPI アプリケーションとテストコード
├── frontend/          # Next.js フロントエンド (App Router)
├── mobile/            # React Native モバイルアプリ (Expo)
├── docs/              # 設計ドキュメント
├── scripts/           # 開発・検証スクリプト
├── docker-compose.yml # コンテナオーケストレーション
└── Makefile           # 開発用ショートカットコマンド
```

## 開発環境の起動

初回は `.env.example` をコピーして必要な値を調整してください。

```bash
cp .env.example .env
```

その後、Dev Containers で開くと必要な依存関係が揃った状態で作業を開始できます。

```bash
make up
# もしくは
docker compose up -d --build
```

起動後は以下からアクセスできます。

- フロントエンド: [http://localhost:3000](http://localhost:3000)
- バックエンド API: [http://localhost:8000](http://localhost:8000)
- モバイル開発環境: [http://localhost:19000](http://localhost:19000)

API コンテナ起動時に Alembic を使用したデータベースマイグレーションが自動実行されます。手動でマイグレーションを実行する必要はありません。

停止は `docker compose down` または `make down` を利用してください。

## バックエンド環境変数

| 変数名                             | 説明                                                                                                                                                   | デフォルト         |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------- |
| `DATABASE_URL`                     | PostgreSQL 接続文字列。Docker Compose では `.env` の値 (デフォルト: `postgresql+asyncpg://otodoki:otodoki-password@db:5432/otodoki2`) が使用されます。 | `.env` 参照        |
| `POSTGRES_DB`                      | PostgreSQL データベース名。Docker Compose の db サービスで使用されます。                                                                               | `otodoki2`         |
| `POSTGRES_USER`                    | PostgreSQL ユーザー名。Docker Compose の db サービスで使用されます。                                                                                   | `otodoki`          |
| `POSTGRES_PASSWORD`                | PostgreSQL パスワード。Docker Compose の db サービスで使用されます。                                                                                   | `otodoki-password` |
| `JWT_SECRET_KEY`                   | アクセストークン署名用のシークレットキー。                                                                                                             | (必須)             |
| `JWT_REFRESH_SECRET_KEY`           | リフレッシュトークン署名用シークレット。                                                                                                               | (必須)             |
| `JWT_ALGORITHM`                    | トークン署名アルゴリズム。                                                                                                                             | `HS256`            |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`  | アクセストークンの有効期限 (分)。                                                                                                                      | `30`               |
| `JWT_REFRESH_TOKEN_EXPIRE_MINUTES` | リフレッシュトークンの有効期限 (分)。                                                                                                                  | `4320`             |
| `GEMINI_API_KEY`                   | Gemini を利用したキーワード生成に使用します。開発時はダミー値でも可。                                                                                  | `changeme`         |
| `OTODOKI_*`                        | iTunes 検索戦略やワーカーの閾値を調整する環境変数群。詳細は `backend/app/core/config.py` を参照してください。                                          | -                  |

`.env` に値を記載すると、Docker Compose およびローカル実行で自動的に読み込まれます。

## フロントエンド環境変数

- `NEXT_PUBLIC_API_URL`: バックエンド API のベース URL。未設定の場合は `http://localhost:8000` が使用されます。

## ユーザー認証フロー概要

1. `/register` でメールアドレスとパスワードを送信すると、ユーザーを作成しアクセストークン & リフレッシュトークンを返します。
2. `/login` は既存ユーザーの認証を行い、同様にトークンを受け取ります。
3. フロントエンドの `AuthContext` がトークンを `localStorage` に保持し、定期的に `/auth/refresh` を呼び出してセッションを延長します。
4. `RequireAuth` コンポーネントが `/library` などの保護ページで未ログインユーザーを `/login` にリダイレクトします。

## 開発ワークフロー

- **テスト**: Docker 上の PostgreSQL と連携したまま実行するには以下を推奨します。
  ```bash
  docker compose up -d db
  DATABASE_URL=postgresql+asyncpg://otodoki:otodoki-password@localhost:5432/otodoki2 \
  GEMINI_API_KEY=dummy \
  PYTHONPATH=./backend pytest backend/tests/
  ```
  すべてのテストは 2025-02 時点で 61 件成功しています。
- **マイグレーション**: Alembic を使用します。新しいモデルを追加したら `alembic revision --autogenerate -m "message"` を実行し、`alembic upgrade head` で反映します。
- **ログ確認**: `docker compose logs --tail=200 api` や `docker compose logs -f worker` でバックエンドとキュー補充ワーカーの状態を追跡できます。

## モバイル開発

React Native + Expo を使用したモバイルアプリケーションが `mobile/` ディレクトリに含まれています。

### モバイルアプリの特徴
- **クロスプラットフォーム**: iOS と Android 両対応
- **共通 API**: Web フロントエンドと同じバックエンド API を使用
- **オフライン対応**: AsyncStorage による認証情報の永続化
- **ネイティブ UI**: プラットフォームに最適化されたユーザーインターフェース

### モバイル開発環境の構築

```bash
# Docker を使用する場合
docker compose up mobile

# ローカル開発の場合
cd mobile
npm install
npm start
```

### モバイルアプリのテスト

1. **Expo Go アプリ** (iOS/Android)
   - App Store/Google Play から Expo Go をインストール
   - QR コードをスキャンして接続

2. **iOS シミュレーター** (macOS のみ)
   - Xcode をインストール
   - `npm run ios` で起動

3. **Android エミュレーター**
   - Android Studio をインストール
   - `npm run android` で起動

4. **Web プレビュー**
   - `npm run web` でブラウザでプレビュー

## よくあるトラブル

- **トークンが保持されない**: ブラウザの `localStorage` がブロックされていないか、`NEXT_PUBLIC_API_URL` が正しく設定されているか確認してください。
- **pytest が失敗する**: `DATABASE_URL` が PostgreSQL を指しているか、`pip install -r backend/requirements.txt` が完了しているかを確認してください。
- **フロントとバックを別々に起動する場合**: バックエンドを `uvicorn backend.app.main:app --reload` で起動し、フロントエンドを `npm run dev` で起動します。この場合でも `.env` の `NEXT_PUBLIC_API_URL` がバックエンドを指している必要があります。

## ドキュメント

詳細なドキュメントは [docs/](./docs/) ディレクトリにあります：

- 📖 [ビジュアルガイド](./docs/VISUAL_GUIDE.md) - スクリーンショットと動画で機能を確認
- 📝 [ドキュメント貢献ガイド](./docs/CONTRIBUTING_DOCS.md) - ドキュメントへの貢献方法
- 🔧 [ワーカードキュメント](./docs/WORKER_README.md) - バックグラウンドワーカーの詳細
- 🚀 [デプロイメントガイド](./docs/DEPLOYMENT.md) - 本番環境へのデプロイ方法
- 📱 [モバイル実装](./docs/mobile-implementation.md) - モバイルアプリの実装詳細
- 🎵 [オーディオプレビュー実装](./docs/AUDIO_PREVIEW_IMPLEMENTATION.md) - 音声機能の実装

## ライセンス

本プロジェクトは作者個人の学習目的で公開されています。詳細なライセンス宣言は未定ですが、コントリビュートする際は Issue で相談してください。
