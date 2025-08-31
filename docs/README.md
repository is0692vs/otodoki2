# otodoki2web Documentation

このディレクトリには、otodoki2web プロジェクトのドキュメントが含まれています。

## ドキュメント一覧

- [WORKER_README.md](./WORKER_README.md) - iTunes API 非同期補充ワーカーのドキュメント
- [API.md](./API.md) - API 仕様ドキュメント（予定）
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイメントガイド（予定）

## プロジェクト構造

```
otodoki2web/
├── backend/           # バックエンドAPI (FastAPI + Python)
├── frontend/          # フロントエンド (Next.js + TypeScript)
├── scripts/           # 開発・テスト用スクリプト
├── docs/              # ドキュメント
├── .devcontainer/     # 開発コンテナ設定
├── .github/           # GitHub Actions設定
└── .vscode/           # VS Code設定
```

## 開発環境

このプロジェクトは、VS Code Dev Container を使用した開発環境で構築されています。
