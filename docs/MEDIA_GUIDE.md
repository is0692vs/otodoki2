# メディアファイル追加クイックガイド

このガイドでは、ドキュメントにスクリーンショットや動画を追加する手順を簡潔に説明します。

## 📸 スクリーンショットの追加

### 1. スクリーンショットを撮影

```bash
# macOS
Cmd + Shift + 4 で範囲選択

# Windows
Win + Shift + S で Snipping Tool

# Linux
gnome-screenshot -a
```

### 2. ファイルを配置

```bash
# ファイルを適切な場所にコピー
cp ~/Downloads/screenshot.png docs/screenshots/feature-name.png
```

### 3. ドキュメントに埋め込み

```markdown
![機能の説明](./screenshots/feature-name.png)
```

## 🎥 動画の追加

### 1. 画面を録画

**推奨ツール:**
- macOS: QuickTime Player
- Windows: Xbox Game Bar
- クロスプラットフォーム: [OBS Studio](https://obsproject.com/)

### 2. GIF に変換（オプション）

```bash
# FFmpeg を使用
ffmpeg -i input.mp4 -vf "fps=15,scale=800:-1:flags=lanczos" output.gif

# またはオンラインツール
# https://ezgif.com/video-to-gif
```

### 3. ファイルを配置

```bash
cp ~/Downloads/demo.gif docs/videos/feature-demo.gif
```

### 4. ドキュメントに埋め込み

```markdown
![機能デモ](./videos/feature-demo.gif)
```

## 📊 図・ダイアグラムの追加

### Mermaid を使用（推奨）

```markdown
```mermaid
graph LR
    A[開始] --> B[処理]
    B --> C[終了]
```
```

### 画像として追加

```bash
# ファイルを配置
cp ~/Downloads/diagram.svg docs/images/diagram-name.svg
```

```markdown
![図の説明](./images/diagram-name.svg)
```

## ✅ チェックリスト

- [ ] ファイル名は小文字とハイフンで命名
- [ ] 画像サイズは 500KB 以下
- [ ] 動画サイズは 10MB 以下（GIF は 5MB 以下）
- [ ] 個人情報は含まれていない
- [ ] ドキュメントに説明文を追加

## 📏 サイズガイドライン

| ファイルタイプ | 最大サイズ | 推奨解像度 |
| ------------- | --------- | --------- |
| スクリーンショット (PNG) | 500KB | 1920x1080 |
| 動画 (MP4) | 10MB | 1280x720 |
| GIF | 5MB | 800x600 |
| 図 (SVG) | 制限なし | - |

## 🔗 詳細ガイド

より詳細な情報は以下のドキュメントを参照してください：

- [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - ビジュアルガイドの全体像
- [CONTRIBUTING_DOCS.md](./CONTRIBUTING_DOCS.md) - ドキュメント貢献の詳細手順

## ヘルプ

質問や問題がある場合は、GitHub Issue で相談してください。
