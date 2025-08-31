# iTunes API 非同期補充ワーカー

Issue #6の実装です。キューサイズが閾値未満になった際に、非同期でiTunes Search APIを呼び出して楽曲データを補充するワーカーシステム。

## 🚀 機能概要

- **自動監視**: 1.5秒間隔でキューサイズを監視
- **閾値ベース補充**: サイズが30未満になると自動的にiTunes APIを呼び出し
- **スマート検索**: ランダムキーワード選択とクールダウン機能
- **重複排除**: trackId基づく重複除去
- **リトライ機能**: 指数バックオフ付きエラーハンドリング
- **手動トリガー**: APIエンドポイント経由での即座補充
- **並行制御**: asyncio.Lockによる単一インスタンス保証

## 📋 環境変数設定

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `OTODOKI_ITUNES_TERMS` | `"rock,pop,jazz"` | iTunes検索キーワード（CSV形式） |
| `OTODOKI_COUNTRY` | `"JP"` | iTunes API対象国 |
| `OTODOKI_MIN_THRESHOLD` | `30` | キュー補充トリガー閾値 |
| `OTODOKI_BATCH_SIZE` | `30` | 1回の補充単位 |
| `OTODOKI_MAX_CAP` | `300` | キュー容量上限 |
| `OTODOKI_POLL_INTERVAL_MS` | `1500` | ポーリング間隔（ミリ秒） |
| `OTODOKI_HTTP_TIMEOUT_S` | `5.0` | HTTPタイムアウト（秒） |
| `OTODOKI_RETRY_MAX` | `3` | 最大リトライ回数 |

## 🔗 API エンドポイント

### ワーカー統計情報
```bash
GET /worker/stats
```
```json
{
  "running": true,
  "consecutive_failures": 0,
  "max_failures": 5,
  "refill_in_progress": false,
  "poll_interval_ms": 1500,
  "min_threshold": 30,
  "batch_size": 30,
  "max_cap": 300
}
```

### 手動補充トリガー
```bash
POST /worker/trigger-refill
```
```json
{
  "success": true,
  "message": "Refill completed"
}
```

### キュー健全性チェック
```bash
GET /queue/health
```
```json
{
  "status": "healthy",
  "size": 150,
  "capacity": 1000,
  "utilization_percent": 15.0,
  "is_low_watermark": false
}
```

## 🏗️ アーキテクチャ

```
FastAPI App
    ↓ lifespan
QueueReplenishmentWorker
    ↓ monitors
QueueManager ← → iTunes API Client
    ↓ stores           ↓ fetches
Track Objects     iTunes Search API
```

## ⚙️ 動作フロー

1. **起動時**: FastAPIライフサイクルでワーカー開始
2. **監視ループ**: 1.5秒毎にキューサイズチェック
3. **補充判定**: サイズ < 30 の場合、補充処理開始
4. **API呼び出し**: ランダムキーワードでiTunes検索
5. **データ整形**: 必須フィールドチェック、重複排除、URL最適化
6. **キュー投入**: 整形済みトラックをバルク追加
7. **エラー処理**: 失敗時は指数バックオフでリトライ
8. **停止時**: gracefulにワーカー終了

## 🛡️ エラーハンドリング

- **4xxエラー**: リトライせずスキップ
- **5xxエラー**: 最大3回まで指数バックオフリトライ
- **タイムアウト**: 段階的待機時間でリトライ
- **連続失敗**: サーキットブレーカー機能で一時停止
- **ネットワークエラー**: ログ出力後、次サイクルで継続

## 📊 ログレベル

- **INFO**: 起動/停止、補充開始/完了、取得件数
- **WARNING**: 欠損フィールド、重複スキップ、API 4xx
- **ERROR**: API失敗、リトライ上限到達
- **DEBUG**: キーワード選択、詳細統計

## 🧪 テスト

```bash
# 全テスト実行
pytest tests/ -v

# 特定モジュールのテスト
pytest tests/test_worker_integration.py -v
pytest tests/test_itunes_api.py -v
pytest tests/test_config.py::TestWorkerConfig -v
```

## 🚦 動作確認

```bash
# サーバー起動
uvicorn app.main:app --reload

# ワーカー状態確認
curl http://localhost:8000/worker/stats

# 手動補充実行
curl -X POST http://localhost:8000/worker/trigger-refill

# キュー状態確認
curl http://localhost:8000/queue/health
```

## 🔧 カスタマイズ例

```bash
# 検索キーワードを変更
export OTODOKI_ITUNES_TERMS="blues,jazz,funk,soul"

# 補充を積極的に
export OTODOKI_MIN_THRESHOLD=50
export OTODOKI_BATCH_SIZE=50

# ポーリング間隔を短縮
export OTODOKI_POLL_INTERVAL_MS=1000
```

## 📈 監視・メトリクス

将来実装予定のメトリクス:
- `queue_size_gauge`: 現在のキューサイズ
- `refill_attempts_counter`: 補充試行回数
- `refill_success_counter`: 補充成功回数
- `fetch_latency_ms`: API呼び出し遅延
- `dropped_records_counter`: 除外レコード数