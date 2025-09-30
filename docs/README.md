# otodoki2 Documentation

このディレクトリには、otodoki2 プロジェクトのドキュメントが含まれています。

## ドキュメント一覧

### 📘 主要ドキュメント

- [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - **ビジュアルガイド** (スクリーンショット・動画付き)
- [MEDIA_GUIDE.md](./MEDIA_GUIDE.md) - **メディアファイル追加クイックガイド**
- [CONTRIBUTING_DOCS.md](./CONTRIBUTING_DOCS.md) - **ドキュメント貢献ガイド**

### 🔧 技術ドキュメント

- [WORKER_README.md](./WORKER_README.md) - iTunes API 非同期補充ワーカーのドキュメント
- [API.md](./API.md) - API 仕様ドキュメント（予定）
- [AUDIO_PREVIEW_IMPLEMENTATION.md](./AUDIO_PREVIEW_IMPLEMENTATION.md) - オーディオプレビュー実装ドキュメント
- [mobile-implementation.md](./mobile-implementation.md) - モバイルアプリ実装ドキュメント

### 🚀 運用ドキュメント

- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイメントガイド

### 📁 メディアファイル

- [images/](./images/) - 図・ダイアグラム
- [screenshots/](./screenshots/) - スクリーンショット
- [videos/](./videos/) - デモ動画・GIF

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
