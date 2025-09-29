# Scripts Directory

このディレクトリには、開発・テスト・デバッグ用のスクリプトが含まれています。

## スクリプト一覧

### iTunes API テスト関連

- **`itunes_test.py`** - iTunes Search API の基本的な動作テスト
- **`itunes_param_test.py`** - iTunes API のパラメータ最適化テスト

### ワーカーテスト関連

- **`test_queue_worker.py`** - キュー補充ワーカーの動作テスト

## 実行方法

### 前提条件

- Python の依存関係がインストールされている必要があります
- backend ディレクトリ内でパッケージが利用可能である必要があります

### 実行コマンド

```bash
# プロジェクトルートから実行
cd /workspaces/otodoki2

# iTunes API基本テスト
python scripts/itunes_test.py

# iTunes APIパラメータ最適化テスト
python scripts/itunes_param_test.py

# キューワーカーテスト
python scripts/test_queue_worker.py
```

## 注意事項

- これらのスクリプトは開発・テスト用です
- 本番環境では使用しないでください
- iTunes API を呼び出すスクリプトは、レート制限に注意してください
