# otodoki2web

このプロジェクトは、フロントエンドとバックエンドで構成される Web アプリケーションで、Docker でコンテナ化されています。

## アーキテクチャ

- **フロントエンド:** Next.js アプリケーション (ポート 3000 で動作)
- **バックエンド:** FastAPI アプリケーション (ポート 8000 で動作)
- **コンテナ化:** Docker と Docker Compose を使用してサービスを構築・実行

## CI/CD

このプロジェクトには、継続的インテグレーションのための GitHub Actions ワークフローが含まれています。

### CI パイプライン

CI パイプライン (`ci.yml`) は以下のチェックを実行します。

1.  **個別のコンテナビルド**: 各サービス（フロントエンドとバックエンド）は、個別にビルドされ、単独でビルド可能であることを確認します。

2.  **Docker Compose 統合**: docker-compose を使用してサービスをビルドし、起動して統合をテストします。

3.  **ヘルスチェック**:
    - バックエンド ヘルスエンドポイント: `http://localhost:8000/health`
    - バックエンド ルートエンドポイント: `http://localhost:8000/`
    - フロントエンド アクセシビリティ: `http://localhost:3000`
    - フロントエンド ヘルス API: `http://localhost:3000/api/health`
    - フロントエンド ライブラリページ: `http://localhost:3000/library`

### トリガー

- `main` または `develop` ブランチへのプッシュ
- `main` ブランチへのプルリクエスト

### ヘルスエンドポイント

- **バックエンド ヘルス**: `GET /health`

  ```json
  {
    "status": "ok",
    "timestamp": "2025-09-01T12:00:00.000Z",
    "uptime_seconds": 120.45,
    "service": "otodoki2-api"
  }
  ```

- **フロントエンド ヘルス**: `GET /api/health`
  ```json
  {
    "status": "ok",
    "timestamp": "2025-09-01T12:00:00.000Z",
    "service": "otodoki2-frontend",
    "version": "1.0.0"
  }
  ```

## セットアップと起動

1.  **前提条件:**

    - Docker
    - Docker Compose

2.  **サービスのビルドと起動:**

    ```bash
    docker-compose up --build -d
    ```

    または、Makefile を使用:

    ```bash
    make up
    ```

3.  **サービスの停止:**

    ```bash
    docker-compose down
    ```

    または:

    ```bash
    make down
    ```

## 検証方法

1.  **フロントエンドの確認:**
    ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。Next.js のスタートページが表示されるはずです。

2.  **バックエンドのヘルスの確認:**
    ターミナルで以下のコマンドを実行してください:

    ```bash
    curl http://localhost:8000/health
    ```

    以下のレスポンスが表示されるはずです:

    ```json
    { "status": "ok" }
    ```

3.  **API ドキュメントの確認:**

    - [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
    - [http://localhost:8000/redoc](http://localhost:8000/redoc) (ReDoc)

4.  **CORS 機能のテスト:**
    - ブラウザの開発者ツール (F12) を開きます。
    - [http://localhost:3000](http://localhost:3000) にアクセスします。
      ```javascript
      fetch("http://localhost:8000/health")
        .then((response) => response.json())
        .then((data) => console.log("API Response:", data))
        .catch((error) => console.error("CORS Error:", error));
      ```
    - CORS エラーなしにヘルスレスポンスが表示されるはずです。
    - ネットワークタブでプリフライト `OPTIONS` リクエスト（複雑なリクエストの場合）を確認します。

## 重要な注意事項

- **CORS 設定:** CORS は開発用途に `http://localhost:3000` を許可オリジンとして設定されています。これにより、フロントエンドは CORS エラーなしにバックエンドへ API コールを行うことができます。

  - **現在の設定:**
    - 許可オリジン: `http://localhost:3000` (`ORIGINS` 環境変数で設定可能)
    - 許可メソッド: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
    - 許可ヘッダー: `Authorization`, `Content-Type`, およびすべてのヘッダー (`*`)
    - 認証情報: 無効 (クッキーなし)
  - **オリジンの追加:** オリジンを追加するには、`docker-compose.yml` の `ORIGINS` 環境変数を更新します（カンマ区切りリスト）。
  - **本番環境での考慮事項:**
    - 必要なドメインのみにオリジンを制限する
    - 許可されるヘッダーとメソッドを最小限にする
    - 必要な場合のみ認証情報を有効にすることを検討する
    - CORS ポリシーを定期的に見直し、更新する

- **依存関係の追加:**
  - **フロントエンド:** `frontend/package.json` に依存関係を追加し、`web` サービスを再ビルドします: `docker-compose up --build -d web`。
  - **バックエンド:** `backend/requirements.txt` に依存関係を追加し、`api` サービスを再ビルドします: `docker-compose up --build -d api`。

## ディレクトリ構造

```
.
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .dockerignore
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── ... (Next.js files)
├── docker-compose.yml
├── Makefile
└── README.md
```
