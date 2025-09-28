# `frontend/` ディレクトリの AGENT ルール

このディレクトリには、Next.js を用いた Web アプリケーションのフロントエンドコードが含まれています。

## 構造と役割

- `src/`: Next.js アプリケーションの主要なソースコード。ページ、コンポーネント、フック、ユーティリティ、React Context が含まれます。
- `public/`: 静的ファイル（画像、フォントなど）が配置されます。
- `components.json`: shadcn/ui のコンポーネント設定ファイル。
- `Dockerfile`: フロントエンドアプリケーションを Docker コンテナとしてビルドするための定義ファイル。
- `package.json`: フロントエンドの依存関係とスクリプトが定義されています。

## 主要なコンポーネント

- `src/app/page.tsx`: アプリケーションのメインページ。
- `src/components/`: 再利用可能な UI コンポーネント。`RequireAuth` などの保護ラッパーもここにあります。
- `src/contexts/`: グローバルな状態管理。`AuthContext` が JWT を介したログイン状態を提供します。
- `src/hooks/`: カスタム React フック。
- `src/lib/`: ユーティリティ関数や設定ファイル。
- `src/services/`: バックエンド API との連携を行うクライアントコード。

## テストと検証のポイント

- フロントエンドの動作確認はバックエンドと同時に `make up` または `docker compose up -d --build` で起動し、`docker compose logs --tail=200 web` で Next.js のビルド状況を確認する。
- Swipe ページなどバックエンド依存機能を触る前に、API が正常に動いているか `curl http://localhost:8000/api/v1/tracks/suggestions?limit=5` でサンプルレスポンスを確認する。
- UI 変更時は `npm run lint` / `npm run build` で静的解析を行い、必要に応じて E2E 動作をブラウザで確認する。
- 検証完了後は `docker compose down` で全サービスを停止してから作業を終了する。

## AI エージェントへの指示

- 新しいページやルートを追加する場合は、`src/app/` ディレクトリ内に新しいディレクトリと `page.tsx` ファイルを作成してください。
- 認証が必要なページでは `RequireAuth` を利用し、リダイレクトやローディング状態を適切に扱ってください。
- ログイン状態やトークン操作は `AuthContext` / `useAuth` を通じて行い、独自に `localStorage` を操作しないことを推奨します。`/library` ページではバックエンド API を使用して評価データを取得します。
- バックエンド API と通信する際は `src/services/api-client.ts` を拡張し、`NEXT_PUBLIC_API_URL` を基準にエンドポイントを構築してください。
- 依存関係を追加する場合は、`package.json` を更新し、`npm install` または `yarn install` を実行してください。
