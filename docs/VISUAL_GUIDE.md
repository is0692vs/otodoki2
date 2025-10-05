# otodoki2 ビジュアルガイド

このドキュメントでは、otodoki2 の主要な機能を視覚的に説明します。

## 目次

- [はじめに](#はじめに)
- [アプリケーション概要](#アプリケーション概要)
- [主要機能のデモ](#主要機能のデモ)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [メディアファイルの追加方法](#メディアファイルの追加方法)

## はじめに

otodoki2 は、マッチングアプリのようなスワイプ UI で楽曲を評価・収集できる Web アプリケーションです。このガイドでは、スクリーンショットや動画を使用して主要な機能を説明します。

## アプリケーション概要

### システムアーキテクチャ

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL  │
│  (Next.js)   │◀────│   (FastAPI)  │◀────│   Database   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ iTunes API   │
                     │   Worker     │
                     └──────────────┘
```

### 主要コンポーネント

- **フロントエンド**: Next.js (App Router) を使用した React ベースの Web UI
- **モバイル**: React Native + Expo によるクロスプラットフォームアプリ
- **バックエンド**: FastAPI による RESTful API
- **データベース**: PostgreSQL による永続化
- **ワーカー**: iTunes API を使用したバックグラウンド楽曲補充

## 主要機能のデモ

### 1. ユーザー登録とログイン

ユーザーはメールアドレスとパスワードで登録・ログインできます。

**登録画面**

![登録画面](./screenshots/register-screen.png)

> **メディアファイル追加予定**: 登録フローのスクリーンショットをここに追加してください

**ログイン画面**

![ログイン画面](./screenshots/login-screen.png)

> **メディアファイル追加予定**: ログイン画面のスクリーンショットをここに追加してください

**デモ動画**

> **動画追加予定**: 登録からログインまでのフローを示す動画をここに追加してください
> 推奨ファイル名: `videos/auth-flow-demo.mp4` または `videos/auth-flow-demo.gif`

### 2. スワイプ機能

メイン機能であるスワイプ UI で楽曲を評価します。

**スワイプ画面**

![スワイプ画面](./screenshots/swipe-screen.png)

> **メディアファイル追加予定**: スワイプ画面のスクリーンショットをここに追加してください

**操作方法**

- **右スワイプ / ハートボタン**: 楽曲を「いいね」として保存
- **左スワイプ / スキップボタン**: 楽曲をスキップ
- **再生ボタン**: 楽曲のプレビューを再生

**デモ動画**

> **動画追加予定**: スワイプ操作のデモ動画をここに追加してください
> 推奨ファイル名: `videos/swipe-demo.mp4` または `videos/swipe-demo.gif`

### 3. 楽曲ライブラリ

評価した楽曲を一覧で確認できます。

**ライブラリ画面**

![ライブラリ画面](./screenshots/library-screen.png)

> **メディアファイル追加予定**: ライブラリ画面のスクリーンショットをここに追加してください

**機能**

- **お気に入り楽曲**: いいねした楽曲の一覧表示
- **スキップした楽曲**: スキップした楽曲の一覧表示
- **再評価**: 評価を変更する機能
- **再生**: ライブラリから直接楽曲を再生

**デモ動画**

> **動画追加予定**: ライブラリ機能のデモ動画をここに追加してください
> 推奨ファイル名: `videos/library-demo.mp4` または `videos/library-demo.gif`

### 4. オーディオプレビュー機能

楽曲のプレビューを再生して試聴できます。

**プレイヤー UI**

![オーディオプレイヤー](./screenshots/audio-player.png)

> **メディアファイル追加予定**: オーディオプレイヤー UI のスクリーンショットをここに追加してください

**機能**

- 30 秒プレビューの再生
- 再生/一時停止コントロール
- シークバー
- 再生履歴の自動記録

**デモ動画**

> **動画追加予定**: オーディオプレビュー機能のデモ動画をここに追加してください
> 推奨ファイル名: `videos/audio-preview-demo.mp4` または `videos/audio-preview-demo.gif`

### 5. モバイルアプリ

iOS と Android で動作するネイティブアプリケーション。

**モバイル - ホーム画面**

![モバイルホーム](./screenshots/mobile-home.png)

> **メディアファイル追加予定**: モバイルアプリのホーム画面スクリーンショットをここに追加してください

**モバイル - スワイプ画面**

![モバイルスワイプ](./screenshots/mobile-swipe.png)

> **メディアファイル追加予定**: モバイルアプリのスワイプ画面スクリーンショットをここに追加してください

**デモ動画**

> **動画追加予定**: モバイルアプリのデモ動画をここに追加してください
> 推奨ファイル名: `videos/mobile-app-demo.mp4` または `videos/mobile-app-demo.gif`

## 開発環境のセットアップ

### Docker Compose によるセットアップ

![セットアップフロー](./images/setup-flow.png)

> **メディアファイル追加予定**: セットアップフローの図をここに追加してください

**ターミナル出力例**

```bash
$ make up
# または
$ docker compose up -d --build
```

> **メディアファイル追加予定**: セットアップ成功時のターミナル出力スクリーンショットをここに追加してください
> 推奨ファイル名: `screenshots/setup-terminal.png`

**セットアップデモ動画**

> **動画追加予定**: 初回セットアップから起動までのデモ動画をここに追加してください
> 推奨ファイル名: `videos/setup-demo.mp4` または `videos/setup-demo.gif`

### API ドキュメント (Swagger UI)

FastAPI の自動生成 API ドキュメントにアクセスできます。

![Swagger UI](./screenshots/swagger-ui.png)

> **メディアファイル追加予定**: Swagger UI のスクリーンショットをここに追加してください

**アクセス URL**: [http://localhost:8000/docs](http://localhost:8000/docs)

### データベース構造

![ER図](./images/er-diagram.png)

> **メディアファイル追加予定**: データベースの ER 図をここに追加してください

## メディアファイルの追加方法

このドキュメントにスクリーンショットや動画を追加する際は、以下のガイドラインに従ってください。

### ディレクトリ構造

```
docs/
├── images/          # 図やイラストなど
├── screenshots/     # アプリケーションのスクリーンショット
└── videos/          # デモ動画やアニメーション GIF
```

### ファイル命名規則

- **スクリーンショット**: `機能名-画面名.png`
  - 例: `swipe-screen.png`, `library-screen.png`
- **動画**: `機能名-demo.mp4` または `機能名-demo.gif`
  - 例: `swipe-demo.gif`, `auth-flow-demo.mp4`
- **図**: `説明内容.png` または `説明内容.svg`
  - 例: `er-diagram.svg`, `setup-flow.png`

### 推奨ツール

#### スクリーンショット作成

- **macOS**: `Cmd + Shift + 4` (範囲指定)
- **Windows**: `Win + Shift + S` (Snipping Tool)
- **Linux**: `gnome-screenshot` または `flameshot`
- **ブラウザ拡張**: [Awesome Screenshot](https://www.awesomescreenshot.com/)

#### 動画・GIF 作成

- **画面録画**:
  - macOS: QuickTime Player, Screen Studio
  - Windows: Xbox Game Bar, OBS Studio
  - Linux: SimpleScreenRecorder, OBS Studio
  - クロスプラットフォーム: [Loom](https://www.loom.com/)

- **GIF 変換**:
  - [ezgif.com](https://ezgif.com/) (オンライン)
  - [FFmpeg](https://ffmpeg.org/) (コマンドライン)
  - [ScreenToGif](https://www.screentogif.com/) (Windows)

#### 図の作成

- **フローチャート・ダイアグラム**:
  - [draw.io](https://draw.io/) / [diagrams.net](https://diagrams.net/)
  - [Mermaid](https://mermaid.js.org/) (Markdown 内で記述可能)
  - [Excalidraw](https://excalidraw.com/)

- **ER 図**:
  - [dbdiagram.io](https://dbdiagram.io/)
  - [DBeaver](https://dbeaver.io/) (データベースから自動生成)

### ファイルサイズの最適化

- **画像**:
  - PNG: 圧縮ツール ([TinyPNG](https://tinypng.com/))
  - 推奨最大サイズ: 500KB
  - 推奨解像度: 1920x1080 以下

- **動画**:
  - MP4 (H.264 コーデック推奨)
  - 推奨最大サイズ: 10MB
  - 代わりに GIF を使用する場合: 5MB 以下
  - 推奨解像度: 1280x720 以下
  - フレームレート: 15-30 fps

### Markdown への埋め込み方法

#### 画像の埋め込み

```markdown
![代替テキスト](./screenshots/ファイル名.png)
```

#### 動画の埋め込み (GitHub)

GitHub では直接動画を埋め込めます:

```markdown
https://user-images.githubusercontent.com/ユーザーID/動画ID/ファイル名.mp4
```

または、GIF として埋め込み:

```markdown
![デモ](./videos/demo.gif)
```

#### キャプション付き

```markdown
<figure>
  <img src="./screenshots/example.png" alt="例">
  <figcaption>図1: 例のスクリーンショット</figcaption>
</figure>
```

### コントリビューションの手順

1. メディアファイルを適切なディレクトリに配置
2. このドキュメント (`VISUAL_GUIDE.md`) の該当セクションを更新
3. ファイル名が命名規則に従っているか確認
4. ファイルサイズが推奨範囲内か確認
5. Pull Request を作成

## 参考リンク

- [メインドキュメント (README.md)](../README.md)
- [API ドキュメント (API.md)](./API.md)
- [ワーカードキュメント (WORKER_README.md)](./WORKER_README.md)
- [デプロイメントガイド (DEPLOYMENT.md)](./DEPLOYMENT.md)
- [モバイル実装ドキュメント (mobile-implementation.md)](./mobile-implementation.md)
- [オーディオプレビュー実装 (AUDIO_PREVIEW_IMPLEMENTATION.md)](./AUDIO_PREVIEW_IMPLEMENTATION.md)

## フィードバック

このドキュメントに関するフィードバックや改善提案は、GitHub Issue でお知らせください。
