# otodoki2web

FastAPI を Docker 化した API サーバーです。

## セットアップ

### 起動

```bash
docker-compose up --build -d
```

または、Makefile を使用：

```bash
make up
```

### 停止

```bash
docker-compose down
```

または：

```bash
make down
```

## 動作確認

### ヘルスチェック

```bash
curl http://localhost:8000/health
```

レスポンス例：

```json
{ "status": "ok" }
```

### API ドキュメント

ブラウザで以下にアクセスして OpenAPI UI を確認：

- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

### ログ確認

```bash
docker-compose logs -f api
```

または：

```bash
make logs
```

## よくあるエラー

### ポート競合

ポート 8000 が既に使用されている場合：

1. 使用中のプロセスを確認：

   ```bash
   lsof -i :8000
   ```

2. プロセスを停止するか、docker-compose.yml のポートを変更：
   ```yaml
   ports:
     - "8001:8000" # ホストポートを8001に変更
   ```

### curl が無い環境

curl の代わりに wget を使用：

```bash
wget -qO- http://localhost:8000/health
```

## ディレクトリ構成

```
.
├── app/
│   ├── __init__.py
│   └── main.py          # FastAPI アプリケーション
├── docker-compose.yml   # Docker Compose 設定
├── Dockerfile          # Docker イメージビルド設定
├── Makefile           # よく使うコマンドのショートカット
├── requirements.txt    # Python依存関係
├── .dockerignore      # Docker ビルド時の除外ファイル
└── README.md          # このファイル
```

## API エンドポイント

- `GET /` - 簡易メッセージを返す
- `GET /health` - ヘルスチェック (`{"status":"ok"}` を返す)
- `GET /docs` - Swagger UI (API ドキュメント)
- `GET /redoc` - ReDoc (API ドキュメント)
