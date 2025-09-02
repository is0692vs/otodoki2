# 未完成

# otodoki2web

otodoki2web は、マッチングアプリのようなスワイプ式のインターフェースを手軽に新しい楽曲に出会える Web アプリケーションです。FastAPI を用いたバックエンド API と Next.js を用いたフロントエンドで構成されており、全体が Docker コンテナとして動作します。

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
    git clone <repository-url>
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
