# `mobile/src/` ディレクトリの AGENT ルール

このディレクトリには、React Native + Expo を使用したモバイルアプリケーションの主要なソースコードが含まれています。

## 構造と役割

- `components/`: 再利用可能な UI コンポーネント。TrackCard などの楽曲表示コンポーネントが含まれます。
- `contexts/`: React Context プロバイダー。AuthContext が認証状態を管理します。
- `hooks/`: カスタム React Hooks。useAudioPlayer などのオーディオ再生フックが含まれます。
- `navigation/`: React Navigation の設定。アプリのナビゲーション構造を定義します。
- `screens/`: 画面コンポーネント。LoginScreen, SwipeScreen, LibraryScreen などの主要画面が含まれます。
- `services/`: API クライアント。バックエンド API との通信を行うコードが含まれます。
- `types/`: TypeScript 型定義。API レスポンスなどの型が定義されます。

## 主要なコンポーネント

- `components/TrackCard.tsx`: 楽曲情報を表示するカードコンポーネント。
- `contexts/AuthContext.tsx`: JWT ベースの認証状態管理。
- `hooks/useAudioPlayer.ts`: Expo AV を使用したオーディオプレーヤー。
- `navigation/Navigation.tsx`: アプリのナビゲーション設定。
- `screens/SwipeScreen.tsx`: スワイプ式楽曲評価画面。
- `services/api-client.ts`: バックエンド API との通信クライアント。
- `types/api.ts`: API 関連の TypeScript 型定義。

## AI エージェントへの指示

- 新しい画面を追加する場合は、`screens/` ディレクトリに新しいコンポーネントを作成してください。
- UI コンポーネントを再利用可能にする場合は、`components/` に配置してください。
- 認証やグローバル状態を扱う場合は、`contexts/` を利用してください。
- カスタムロジックをフック化する場合は、`hooks/` を使用してください。
- API 通信を拡張する場合は、`services/` を更新してください。
- 型定義を追加する場合は、`types/` を使用してください。
