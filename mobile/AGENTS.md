# Mobile Frontend (React Native + Expo) - AGENTS.md

このディレクトリには、React Native と Expo を使用したモバイルフロントエンドが含まれています。

## アーキテクチャ概要

- **React Native + Expo**: クロスプラットフォーム対応のモバイルアプリケーション
- **TypeScript**: 型安全性の確保
- **React Navigation**: ナビゲーション管理
- **AsyncStorage**: ローカルデータストレージ
- **Expo AV**: オーディオ再生機能
- **Context API**: 認証状態とアプリケーション状態の管理

## ディレクトリ構成

```
mobile/
├── src/
│   ├── components/     # 再利用可能なUIコンポーネント
│   │   └── TrackCard.tsx
│   ├── contexts/       # React Context プロバイダー
│   │   └── AuthContext.tsx
│   ├── hooks/          # カスタムフック
│   │   └── useAudioPlayer.ts
│   ├── navigation/     # ナビゲーション設定
│   │   └── Navigation.tsx
│   ├── screens/        # 画面コンポーネント
│   │   ├── LoadingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── SwipeScreen.tsx
│   │   └── LibraryScreen.tsx
│   ├── services/       # API クライアント
│   │   └── api-client.ts
│   └── types/          # TypeScript 型定義
│       └── api.ts
├── assets/             # 画像とアイコン
├── App.tsx             # アプリケーションエントリーポイント
├── app.json            # Expo 設定
└── package.json        # 依存関係とスクリプト
```

## 主要な機能

### 認証システム
- **AuthContext**: JWT ベースの認証状態管理
- **AsyncStorage**: アクセストークンとリフレッシュトークンの永続化
- **自動リフレッシュ**: トークンの自動更新

### 楽曲評価機能
- **SwipeScreen**: カードベースのスワイプインターフェース
- **PanResponder**: ジェスチャーハンドリング
- **Animated API**: スムーズなアニメーション効果

### オーディオ再生
- **useAudioPlayer**: Expo AV を使用したオーディオプレーヤー
- **プレビュー再生**: 楽曲の30秒プレビュー
- **再生速度調整**: 0.5x ~ 2.0x の再生速度制御

### ライブラリ管理
- **LibraryScreen**: お気に入りとスキップした楽曲の表示
- **タブナビゲーション**: Like/Dislike の切り替え
- **プルトゥリフレッシュ**: データの再取得

## API 連携

- **バックエンド API**: 既存の FastAPI バックエンドと完全に互換
- **HTTP クライアント**: fetch API を使用したリクエスト処理
- **エラーハンドリング**: 統一されたエラーレスポンス処理
- **タイムアウト設定**: 30秒のリクエストタイムアウト

## 開発環境

### Docker での開発
```bash
# 全サービス起動（API、Web、Mobile）
docker compose up -d --build

# モバイルサービスのみ起動
docker compose up mobile

# ログ確認
docker compose logs -f mobile
```

### ローカル開発
```bash
cd mobile
npm install
npm start  # Expo 開発サーバー起動
```

### アクセスポート
- **Expo Dev Tools**: http://localhost:19000
- **Metro Bundler**: http://localhost:8081
- **API Backend**: http://localhost:8000

## AI エージェント向けの注意点

1. **React Native 特有の制約**
   - Web の DOM API は使用不可
   - プラットフォーム固有の実装が必要な場合がある
   - Expo の制限内での開発

2. **パフォーマンス考慮**
   - FlatList を使用した仮想化リスト
   - 画像の遅延読み込み
   - アニメーションの最適化

3. **プラットフォーム対応**
   - iOS/Android 両対応
   - SafeAreaView の使用
   - プラットフォーム固有のスタイリング

4. **状態管理**
   - Context API による状態管理
   - useCallback/useMemo による最適化
   - メモリリークの防止

5. **テスト**
   - Expo の制約により、実機またはシミュレーターでのテストが必要
   - Web での動作確認も可能（`npm run web`）

## トラブルシューティング

- **Metro bundler エラー**: キャッシュクリア（`npx expo start --clear`）
- **オーディオ再生問題**: 実機での確認が必要
- **ナビゲーション問題**: React Navigation のバージョン互換性確認
- **ビルドエラー**: Expo CLI の最新版使用