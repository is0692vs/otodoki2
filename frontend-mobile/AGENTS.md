# frontend-mobile Directory - React Native Mobile App

このディレクトリには、otodoki2 の React Native モバイルアプリケーションが含まれています。Web版（Next.js）と同じ機能とUIを持つクロスプラットフォームモバイルアプリとして実装されています。

## アーキテクチャ概要

React Native + TypeScript + React Navigation の構成で、Web版のAPIと認証システムを共有しています。

### 主要な構成要素

- **src/types/**: TypeScript型定義（Web版から移植・拡張）
- **src/services/**: APIクライアント（Web版から移植、React Native対応）
- **src/contexts/**: AuthContext（AsyncStorageベース）
- **src/navigation/**: React Navigation による画面遷移管理
- **src/screens/**: 主要な画面コンポーネント
- **src/components/**: 再利用可能なUIコンポーネント

## 画面構成

### 認証フロー
- **LoginScreen**: ログイン画面
- **RegisterScreen**: ユーザー登録画面

### メインアプリ（タブナビゲーション）
- **HomeScreen**: ホーム画面（おすすめ楽曲、ナビゲーション）
- **SwipeScreen**: スワイプ式楽曲評価画面（react-native-deck-swiper使用）
- **LibraryScreen**: 個人ライブラリ（いいね/スキップした楽曲管理）

## 技術スタック

- **React Native 0.73+**: モバイルアプリフレームワーク
- **TypeScript**: 型安全性
- **React Navigation 6**: 画面遷移とナビゲーション
- **AsyncStorage**: ローカルデータ永続化（認証トークンなど）
- **react-native-deck-swiper**: スワイプカード機能
- **React Context**: グローバル状態管理（認証状態）

## 主要な機能

### 認証システム
- AsyncStorageによる認証トークンの永続化
- JWT アクセストークンとリフレッシュトークンの管理
- 自動ログイン・ログアウト機能
- Web版と同じ認証エンドポイントを利用

### 楽曲発見機能
- カードベースのスワイプインターフェース
- 楽曲の評価（いいね・スキップ）
- バックグラウンドでの楽曲補充
- Web版と同じAPIエンドポイントを利用

### ライブラリ機能
- 評価済み楽曲の一覧表示
- いいね・スキップの切り替え表示
- 評価の削除機能

## AIエージェントへの指示

### 開発時の注意点

1. **React Nativeの制約**: 
   - Web APIとの違いを考慮（localStorage → AsyncStorage）
   - プラットフォーム固有のスタイリング
   - React Native特有のコンポーネント使用

2. **状態管理**:
   - AuthContextはasync/awaitベースで実装
   - エラーハンドリングはアラート表示を活用
   - ローディング状態の適切な表示

3. **ナビゲーション**:
   - React Navigation v6の型安全なナビゲーション
   - 認証状態に基づく画面切り替え
   - スタック・タブナビゲーションの適切な使い分け

4. **APIクライアント**:
   - Web版と同じインターフェースを維持
   - React Native環境での fetch API使用
   - エラーハンドリングとタイムアウト設定

5. **スタイリング**:
   - React NativeのStyleSheet使用
   - ダークテーマ基調のデザイン
   - レスポンシブ対応（異なる画面サイズ）

### テストとデバッグ

- Metro bundlerでの開発
- iOS Simulator / Android Emulatorでのテスト
- React Native Debuggerの活用
- ネットワークリクエストの監視

### デプロイメント考慮事項

- iOS App Store / Google Play Store向けのビルド設定
- 本番APIエンドポイントの設定
- アプリアイコンとスプラッシュスクリーンの設定
- プラットフォーム固有の権限設定