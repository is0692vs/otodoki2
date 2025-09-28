![GitHub last commit](https://img.shields.io/github/last-commit/is0692vs/otodoki2web) ![GitHub issues](https://img.shields.io/github/issues/is0692vs/otodoki2web) ![GitHub pull requests](https://img.shields.io/github/issues-pr/is0692vs/otodoki2web)

## otodoki2web について

otodoki2web は、マッチングアプリのようなスワイプ UI で楽曲を評価・収集できる Web アプリケーション及びモバイルアプリケーションです。FastAPI + SQLModel で構成されたバックエンド API と Next.js (App Router) の Web フロントエンド、React Native のモバイルアプリにより、リアルタイムでキューを補充しながら新しい楽曲に出会えます。2025 年 2 月より、PostgreSQL を利用した永続化とユーザー認証 (メール + パスワード, JWT) をサポートしました。

## 主な機能

- **ユーザー登録 / ログイン**: `/register` と `/login` ページからユーザーを作成し、アクセストークン + リフレッシュトークンでセッション管理します。
- **スワイプ式推薦**: `/swipe` でキューから音楽を取得し、Like / Skip を直感的に操作します。
- **楽曲ライブラリ**: `/library` はログイン済みユーザー専用で、バックエンド API を使用して評価済みの楽曲を一覧表示します。
- **評価・再生履歴の永続化**: スワイプ結果は `/api/v1/evaluations` に保存され、再生開始時には `/api/v1/history/played` を呼び出してユーザー別の履歴を記録します。
- **バックグラウンド補充ワーカー**: iTunes API を活用し、PostgreSQL にキャッシュしながらキューを自動で補充します。
- **API ドキュメント**: [http://localhost:8000/docs](http://localhost:8000/docs) にて FastAPI の OpenAPI スキーマを確認できます。

## リポジトリ構成

```
otodoki2web/
├── backend/           # FastAPI アプリケーションとテストコード
├── frontend-web/      # Next.js Web フロントエンド (App Router)
├── frontend-mobile/   # React Native モバイルアプリ
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

- Web フロントエンド: [http://localhost:3000](http://localhost:3000)
- バックエンド API: [http://localhost:8000](http://localhost:8000)

API コンテナ起動時に Alembic を使用したデータベースマイグレーションが自動実行されます。手動でマイグレーションを実行する必要はありません。

### モバイルアプリの起動

React Native モバイルアプリを起動するには:

```bash
cd frontend-mobile
npm install

# iOS の場合
cd ios && pod install && cd ..
npm run ios

# Android の場合
npm run android
```

**注意**: モバイルアプリ開発には React Native の開発環境（Xcode または Android Studio）が必要です。

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

### Web版
- `NEXT_PUBLIC_API_URL`: バックエンド API のベース URL。未設定の場合は `http://localhost:8000` が使用されます。

### モバイル版
モバイルアプリのAPI接続先は `frontend-mobile/src/services/api-client.ts` で設定できます。開発時のデフォルトは `http://localhost:8000` です。

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

## よくあるトラブル

- **トークンが保持されない**: ブラウザの `localStorage` がブロックされていないか、`NEXT_PUBLIC_API_URL` が正しく設定されているか確認してください。
- **pytest が失敗する**: `DATABASE_URL` が PostgreSQL を指しているか、`pip install -r backend/requirements.txt` が完了しているかを確認してください。
- **フロントとバックを別々に起動する場合**: バックエンドを `uvicorn backend.app.main:app --reload` で起動し、フロントエンドを `npm run dev` で起動します。この場合でも `.env` の `NEXT_PUBLIC_API_URL` がバックエンドを指している必要があります。

## ライセンス

本プロジェクトは作者個人の学習目的で公開されています。詳細なライセンス宣言は未定ですが、コントリビュートする際は Issue で相談してください。
