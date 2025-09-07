![GitHub last commit](https://img.shields.io/github/last-commit/is0692vs/otodoki2web) ![GitHub issues](https://img.shields.io/github/issues/is0692vs/otodoki2web) ![GitHub pull requests](https://img.shields.io/github/issues-pr/is0692vs/otodoki2web)

# 未完成

# otodoki2web

otodoki2web は、マッチングアプリのようなスワイプ式のインターフェースで手軽に新しい楽曲に出会える Web アプリケーションです。FastAPI を用いたバックエンド API と Next.js を用いたフロントエンドで構成されており、全体が Docker コンテナとして動作します。

## 注意

- 本当は Flutter や React Native でモバイルアプリを作りたかったのですが、いち早くアイデアを形にするために Web アプリとして実装しました。
- このプロジェクトは作者の個人学習とストレス解消を目的としており、Issue や Pull Request の形式が書きたい放題になっています。
- 作者がストレスのままに作成しているため、コードの品質やドキュメントの整備が不十分な場合があります。ご了承ください。

## プロジェクト構造

```
otodoki2web/
├── backend/           # バックエンドAPI (FastAPI + Python)
│   ├── app/          # アプリケーションコード
│   ├── tests/        # ユニットテスト
│   └── requirements.txt
├── frontend/          # フロントエンド (Next.js + TypeScript)
│   ├── src/          # ソースコード
│   ├── public/       # 静的ファイル
│   └── package.json
├── scripts/           # 開発・テスト用スクリプト
├── docs/              # ドキュメント
├── .devcontainer/     # VS Code Dev Container設定
├── .github/           # GitHub Actions設定
├── docker-compose.yml # Docker Compose設定
└── Makefile          # 開発用コマンド
```

## 開発環境のスタートアップ

このプロジェクトは、VS Code Dev Containers を利用することで、簡単に開発環境をセットアップできます。

### Dev Containers を利用する場合 (推奨)

1.  **VS Code を開く:** プロジェクトのルートディレクトリを VS Code で開きます。
2.  **Dev Container を再開/開く:** VS Code が自動的に Dev Container の利用を提案します。「Reopen in Container」または「Open in Container」をクリックしてください。
3.  **サービスを起動:** Dev Container が起動し、ターミナルが開かれたら、以下のコマンドを実行してアプリケーションサービスを起動します。
    ```bash
    make up
    # または直接: docker-compose up --build -d
    ```

### Docker Compose を直接利用する場合

Dev Containers を利用しない場合は、Docker と Docker Compose がインストールされていることを確認し、以下の手順でサービスを起動できます。

1.  **プロジェクトをクローン:**
    ```bash
    git clone https://github.com/is0692vs/otodoki2web.git
    cd otodoki2web
    ```
2.  **Docker Compose でサービスを起動:**
    ```bash
    make up
    # または直接: docker-compose up --build -d
    ```

サービスが起動後：

- フロントエンド: [http://localhost:3000](http://localhost:3000)
- バックエンド API: [http://localhost:8000](http://localhost:8000)
- API 仕様: [http://localhost:8000/docs](http://localhost:8000/docs)

## 環境変数 (バックエンド)

バックエンドの挙動は、以下の環境変数でカスタマイズできます。

| 環境変数名                 | 説明                                                                                                                                                                                                                                              | デフォルト値                                           |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------- |
| `OTODOKI_ITUNES_TERMS`     | iTunes API で楽曲を検索する際のキーワード (カンマ区切り)                                                                                                                                                                                          | `さくら,YOASOBI,米津玄師,あいみょん,Official髭男dism`  |
| `OTODOKI_COUNTRY`          | iTunes API 検索の対象国コード (例: JP, US)                                                                                                                                                                                                        | `JP`                                                   |
| `OTODOKI_MIN_THRESHOLD`    | キューに保持する楽曲の最小数。この値を下回ると補充が開始される                                                                                                                                                                                    | `30`                                                   |
| `OTODOKI_BATCH_SIZE`       | 一度の補充でキューに追加を試みる楽曲の数                                                                                                                                                                                                          | `30`                                                   |
| `OTODOKI_MAX_CAP`          | キューの最大容量                                                                                                                                                                                                                                  | `300`                                                  |
| `OTODOKI_POLL_INTERVAL_MS` | キューの監視間隔 (ミリ秒)                                                                                                                                                                                                                         | `1500`                                                 |
| `OTODOKI_HTTP_TIMEOUT_S`   | iTunes API への HTTP リクエストのタイムアウト時間 (秒)                                                                                                                                                                                            | `5.0`                                                  |
| `OTODOKI_RETRY_MAX`        | iTunes API リクエストの最大リトライ回数                                                                                                                                                                                                           | `3`                                                    |
| `OTODOKI_SEARCH_STRATEGY`  | 楽曲検索に利用する戦略。以下のいずれかを指定: <br> `random_keyword`: 定義済みキーワードからランダムに検索 <br> `genre_search`: 指定ジャンルで検索 <br> `release_year_search`: 指定リリース年で検索 <br> `artist_search`: 指定アーティスト名で検索 | `random_keyword`                                       |
| `OTODOKI_SEARCH_GENRES`    | `genre_search` 戦略で利用するジャンル (カンマ区切り)                                                                                                                                                                                              | `J-POP,Rock,Anime,Jazz,Classic,Pop,Electronic,Hip-Hop` |
| `OTODOKI_SEARCH_YEARS`     | `release_year_search` 戦略で利用するリリース年 (カンマ区切り)                                                                                                                                                                                     | `2020,2021,2022,2023,2024`                             |
