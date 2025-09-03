# `backend/app/services/` ディレクトリのAGENTルール

このディレクトリには、ビジネスロジックや外部サービスとの連携を行うサービス層のコードが含まれます。

## 構造と役割

- `__init__.py`: Pythonパッケージとして認識させるためのファイル。
- `itunes_api.py`: iTunes Search API との連携を担当します。楽曲の検索、取得、整形機能を提供します。
- `suggestions.py`: 楽曲提供APIのロジックが含まれます。
- `worker.py`: バックグラウンドで動作し、iTunes API から楽曲データを取得し、キューを補充するワーカーロジックが含まれます。
- `search_strategies/`: 楽曲検索戦略を定義するモジュール群が含まれます。

## 主要なコンポーネント

- `iTunesApiClient`: iTunes Search API との通信を管理し、楽曲データを取得します。
- `SuggestionsService`: 楽曲提供APIのビジネスロジックを実装します。
- `QueueReplenishmentWorker`: 楽曲キューの補充プロセスを管理します。

## AIエージェントへの指示

- 新しい外部サービスとの連携が必要な場合は、ここに新しいサービスモジュールを作成してください。
- 既存のサービスロジックを変更する場合は、該当するサービスファイル (`itunes_api.py`, `suggestions.py`, `worker.py`) を修正してください。
- 楽曲検索の戦略を追加または変更する場合は、`search_strategies/` ディレクトリを参照してください。