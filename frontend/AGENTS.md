# `frontend/` ディレクトリの AGENT ルール

このディレクトリには、Next.js を用いた Web アプリケーションのフロントエンドコードが含まれています。

## 構造と役割

- `src/`: Next.js アプリケーションの主要なソースコード。ページ、コンポーネント、フック、ユーティリティなどが含まれます。
- `public/`: 静的ファイル（画像、フォントなど）が配置されます。
- `components.json`: shadcn/ui のコンポーネント設定ファイル。
- `Dockerfile`: フロントエンドアプリケーションを Docker コンテナとしてビルドするための定義ファイル。
- `package.json`: フロントエンドの依存関係とスクリプトが定義されています。

## 主要なコンポーネント

- `src/app/page.tsx`: アプリケーションのメインページ。
- `src/components/`: 再利用可能な UI コンポーネントが含まれます。
- `src/hooks/`: カスタム React フックが含まれます。
- `src/lib/`: ユーティリティ関数や設定ファイルなどが含まれます。
- `src/services/`: バックエンド API との連携を行うクライアントコードが含まれます。

## テストと検証のポイント

- フロントエンドの動作確認はバックエンドと同時に `make up` または `docker compose up -d --build` で起動し、`docker compose logs --tail=200 web` で Next.js のビルド状況を確認する。
- Swipe ページなどバックエンド依存機能を触る前に、API が正常に動いているか `curl http://localhost:8000/api/v1/tracks/suggestions?limit=5` でサンプルレスポンスを確認する。
- UI 変更時は `npm run lint` / `npm run build` で静的解析を行い、必要に応じて E2E 動作をブラウザで確認する。
- 検証完了後は `docker compose down` で全サービスを停止してから作業を終了する。

## AI エージェントへの指示

- 新しいページやルートを追加する場合は、`src/app/` ディレクトリ内に新しいディレクトリと `page.tsx` ファイルを作成してください。
- UI コンポーネントを作成または変更する場合は、`src/components/` ディレクトリ内の適切なファイルを使用してください。
- カスタムフックを実装する場合は、`src/hooks/` ディレクトリを使用してください。
- ユーティリティ関数や共有ロジックを追加する場合は、`src/lib/` ディレクトリを使用してください。
- バックエンド API との連携を変更する場合は、`src/services/` ディレクトリ内のファイルを更新してください。
- 依存関係を追加する場合は、`package.json` を更新し、`npm install` または `yarn install` を実行してください。
