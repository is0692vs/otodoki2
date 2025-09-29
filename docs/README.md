# otodoki2 Documentation

このディレクトリには、otodoki2 プロジェクトのドキュメントが含まれています。

## ドキュメント一覧

- [WORKER_README.md](./WORKER_README.md) - iTunes API 非同期補充ワーカーのドキュメント
- [API.md](./API.md) - API 仕様ドキュメント（予定）
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイメントガイド
- [AUDIO_PREVIEW_IMPLEMENTATION.md](./AUDIO_PREVIEW_IMPLEMENTATION.md) - オーディオプレビュー実装ドキュメント
- [mobile-implementation.md](./mobile-implementation.md) - モバイルアプリ実装ドキュメント

## プロジェクト構造

```
otodoki2/
├── backend/           # バックエンドAPI (FastAPI + Python)
├── frontend/          # フロントエンド (Next.js + TypeScript)
├── mobile/            # モバイルアプリ (React Native + Expo)
├── scripts/           # 開発・テスト用スクリプト
├── docs/              # ドキュメント
├── .devcontainer/     # 開発コンテナ設定
├── .github/           # GitHub Actions設定
└── .vscode/           # VS Code設定
```

## 開発環境

このプロジェクトは、VS Code Dev Container を使用した開発環境で構築されています。
