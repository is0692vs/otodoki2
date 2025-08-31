# otodoki2web# otodoki2web# otodoki2web



楽曲推薦・配信システム。フロントエンドとバックエンドで構成されるWebアプリケーションで、Dockerでコンテナ化されています。



## プロジェクト構造楽曲推薦・配信システム。フロントエンドとバックエンドで構成されるWebアプリケーションで、Dockerでコンテナ化されています。楽曲推薦・配信システム。フロントエンドとバックエンドで構成される Web アプリケーションで、Docker でコンテナ化されています。



```text

otodoki2web/

├── backend/           # バックエンドAPI (FastAPI + Python)## プロジェクト構造## プロジェクト構造

│   ├── app/          # アプリケーションコード

│   ├── tests/        # ユニットテスト

│   └── requirements.txt

├── frontend/          # フロントエンド (Next.js + TypeScript)```text```text

│   ├── src/          # ソースコード

│   ├── public/       # 静的ファイルotodoki2web/otodoki2web/

│   └── package.json

├── scripts/           # 開発・テスト用スクリプト├── backend/           # バックエンドAPI (FastAPI + Python)├── backend/           # バックエンドAPI (FastAPI + Python)

│   ├── itunes_test.py

│   ├── itunes_param_test.py│   ├── app/          # アプリケーションコード│   ├── app/          # アプリケーションコード

│   └── test_queue_worker.py

├── docs/              # ドキュメント│   ├── tests/        # ユニットテスト│   ├── tests/        # ユニットテスト

│   ├── README.md

│   └── WORKER_README.md│   └── requirements.txt│   └── requirements.txt

├── .devcontainer/     # VS Code Dev Container設定

├── .github/           # GitHub Actions設定├── frontend/          # フロントエンド (Next.js + TypeScript)├── frontend/          # フロントエンド (Next.js + TypeScript)

├── docker-compose.yml # Docker Compose設定

└── Makefile          # 開発用コマンド│   ├── src/          # ソースコード│   ├── src/          # ソースコード

```

│   ├── public/       # 静的ファイル│   ├── public/       # 静的ファイル

## アーキテクチャ

│   └── package.json│   └── package.json

- **フロントエンド:** Next.js アプリケーション (ポート 3000 で動作)

- **バックエンド:** FastAPI アプリケーション (ポート 8000 で動作)├── scripts/           # 開発・テスト用スクリプト├── scripts/           # 開発・テスト用スクリプト

- **コンテナ化:** Docker と Docker Compose を使用してサービスを構築・実行

│   ├── itunes_test.py│   ├── itunes_test.py

## 開発環境セットアップ

│   ├── itunes_param_test.py│   ├── itunes_param_test.py

### 前提条件

│   └── test_queue_worker.py│   └── test_queue_worker.py

- Docker と Docker Compose がインストールされている

- VS Code（推奨）├── docs/              # ドキュメント├── docs/              # ドキュメント



### クイックスタート│   ├── README.md│   ├── README.md



```bash│   └── WORKER_README.md│   └── WORKER_README.md

# プロジェクトをクローン

git clone <repository-url>├── .devcontainer/     # VS Code Dev Container設定├── .devcontainer/     # VS Code Dev Container設定

cd otodoki2web

├── .github/           # GitHub Actions設定├── .github/           # GitHub Actions設定

# Docker Composeでサービスを起動

make up├── docker-compose.yml # Docker Compose設定├── docker-compose.yml # Docker Compose設定



# または直接└── Makefile          # 開発用コマンド└── Makefile          # 開発用コマンド

docker-compose up --build

`````````



サービスが起動後：



- フロントエンド: <http://localhost:3000>## アーキテクチャ## アーキテクチャ

- バックエンドAPI: <http://localhost:8000>

- API仕様: <http://localhost:8000/docs>



### 開発用コマンド- **フロントエンド:** Next.js アプリケーション (ポート 3000 で動作)- **フロントエンド:** Next.js アプリケーション (ポート 3000 で動作)



```bash- **バックエンド:** FastAPI アプリケーション (ポート 8000 で動作)- **バックエンド:** FastAPI アプリケーション (ポート 8000 で動作)

# サービス起動

make up- **コンテナ化:** Docker と Docker Compose を使用してサービスを構築・実行- **コンテナ化:** Docker と Docker Compose を使用してサービスを構築・実行



# ログ確認

make logs          # バックエンドログ

make logs-web      # フロントエンドログ## 開発環境セットアップ## 開発環境セットアップ



# ヘルスチェック

make health

### 前提条件### 前提条件

# テストスクリプト実行

make test-itunes      # iTunes API基本テスト

make test-itunes-params # iTunes APIパラメータテスト

make test-worker      # キューワーカーテスト- Docker と Docker Compose がインストールされている- Docker と Docker Compose がインストールされている



# クリーンアップ- VS Code（推奨）- VS Code（推奨）

make clean        # キャッシュファイル削除

make down         # サービス停止

```

### クイックスタート### クイックスタート

## API仕様



詳細なAPI仕様については、バックエンドサービス起動後に以下を参照してください：

```bash```bash

- Swagger UI: <http://localhost:8000/docs>

- ReDoc: <http://localhost:8000/redoc># プロジェクトをクローン# プロジェクトをクローン



## 開発git clone <repository-url>git clone <repository-url>



詳細な開発情報については以下を参照してください：cd otodoki2webcd otodoki2web



- [ワーカー仕様書](docs/WORKER_README.md)

- [開発用スクリプト](scripts/README.md)

# Docker Composeでサービスを起動# Docker Composeでサービスを起動

## ライセンス

make upmake up

このプロジェクトは MIT ライセンスの下でライセンスされています。


# または直接# または直接

docker-compose up --builddocker-compose up --build

``````



サービスが起動後：サービスが起動後：



- フロントエンド: <http://localhost:3000>- フロントエンド: <http://localhost:3000>

- バックエンドAPI: <http://localhost:8000>- バックエンド API: <http://localhost:8000>

- API仕様: <http://localhost:8000/docs>- API 仕様: <http://localhost:8000/docs>



### 開発用コマンド### 開発用コマンド



```bash```bash

# サービス起動# サービス起動

make upmake up



# ログ確認# ログ確認

make logs          # バックエンドログmake logs          # バックエンドログ

make logs-web      # フロントエンドログmake logs-web      # フロントエンドログ



# ヘルスチェック# ヘルスチェック

make healthmake health



# テストスクリプト実行# テストスクリプト実行

make test-itunes      # iTunes API基本テストmake test-itunes      # iTunes API基本テスト

make test-itunes-params # iTunes APIパラメータテストmake test-itunes-params # iTunes APIパラメータテスト

make test-worker      # キューワーカーテストmake test-worker      # キューワーカーテスト



# クリーンアップ# クリーンアップ

make clean        # キャッシュファイル削除make clean        # キャッシュファイル削除

make down         # サービス停止make down         # サービス停止

``````



## API仕様## API 仕様



詳細なAPI仕様については、バックエンドサービス起動後に以下を参照してください：詳細な API 仕様については、バックエンドサービス起動後に以下を参照してください：



- Swagger UI: <http://localhost:8000/docs>- Swagger UI: <http://localhost:8000/docs>

- ReDoc: <http://localhost:8000/redoc>- ReDoc: <http://localhost:8000/redoc>



## 開発## 開発



詳細な開発情報については以下を参照してください：詳細な開発情報については以下を参照してください：



- [ワーカー仕様書](docs/WORKER.md)- [ワーカー仕様書](docs/WORKER_README.md)

- [開発用スクリプト](scripts/README.md)- [開発用スクリプト](scripts/README.md)



## ライセンス## ライセンス



このプロジェクトは MIT ライセンスの下でライセンスされています。このプロジェクトは MIT ライセンスの下でライセンスされています。

## アーキテクチャ

- **フロントエンド:** Next.js アプリケーション (ポート 3000 で動作)
- **バックエンド:** FastAPI アプリケーション (ポート 8000 で動作)
- **コンテナ化:** Docker と Docker Compose を使用してサービスを構築・実行

## 開発環境セットアップ

### 前提条件

- Docker と Docker Compose がインストールされている
- VS Code（推奨）

### クイックスタート

```bash
# プロジェクトをクローン
git clone <repository-url>
cd otodoki2web

# Docker Composeでサービスを起動
make up

# または直接
docker-compose up --build
```

サービスが起動後：

- フロントエンド: http://localhost:3000
- バックエンド API: http://localhost:8000
- API 仕様: http://localhost:8000/docs

### 開発用コマンド

```bash
# サービス起動
make up

# ログ確認
make logs          # バックエンドログ
make logs-web      # フロントエンドログ

# ヘルスチェック
make health

# テストスクリプト実行
make test-itunes      # iTunes API基本テスト
make test-itunes-params # iTunes APIパラメータテスト
make test-worker      # キューワーカーテスト

# クリーンアップ
make clean        # キャッシュファイル削除
make down         # サービス停止
```

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
