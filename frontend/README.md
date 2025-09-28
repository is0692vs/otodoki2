## Otodoki2Web Frontend

楽曲推薦システムのフロントエンド。Next.js (App Router) + TypeScript で構築され、FastAPI バックエンドの認証付き API と連携します。

## 主な画面

- **/register**: メールアドレスとパスワードで新規ユーザーを作成。
- **/login**: 認証後に `AuthContext` がアクセストークンとリフレッシュトークンを保存します。
- **/swipe**: スワイプ式で楽曲を評価するメイン画面。楽曲プレビューの再生と Like / Skip をサポート。
- **/library**: 認証済みユーザー向けに評価済み楽曲を一覧表示。`RequireAuth` で未ログイン時は `/login` へリダイレクトします。
- **/api-demo**: バックエンド API のレスポンスをブラウザで確認できる開発用ページ。

## 技術スタック

- Next.js 14 (App Router)
- React 19 + TypeScript
- Tailwind CSS / shadcn/ui コンポーネント
- Framer Motion (スワイプアニメーション)
- React Context + Hooks (`AuthContext`, `useAudioPlayer` など)

## セットアップ

1. ルートで `.env.example` を `.env` にコピーし、バックエンドと同じ値を設定します。特に `NEXT_PUBLIC_API_URL` が FastAPI の URL を指していることを確認してください。
2. Docker Compose を利用する場合は、リポジトリルートで `make up` または `docker compose up -d --build` を実行すると、バックエンド・フロントエンド・PostgreSQL が同時に起動します。
3. フロントエンドのみをローカル実行したい場合は、依存関係をインストールして開発サーバーを起動します。

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスするとアプリが表示されます。

## 認証フロー概要

1. `/register` または `/login` ページでフォーム送信。
2. バックエンドから受け取ったトークンを `AuthContext` が `localStorage` に保存。
3. 保護ページは `RequireAuth` コンポーネントを通過し、未ログインの場合は自動的に `/login` に移動。
4. トークンの有効期限が近づくと `/auth/refresh` を呼び出して更新します。

## 開発時のヒント

- `src/contexts/AuthContext.tsx` がアプリ全体の認証状態を提供します。フロントエンドでログイン状態に依存する場合はこのコンテキストを利用してください。
- `src/services/api-client.ts` にバックエンド API との通信ロジックがまとまっています。新しいエンドポイントを追加する場合はここを拡張します。
- UI の追加は再利用性を意識し `src/components/` に配置し、画面単位の処理は `src/app/` 配下で行います。
- `npm run lint` で静的解析、`npm run build` で本番ビルドを確認できます。
