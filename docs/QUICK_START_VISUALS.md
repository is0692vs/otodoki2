# ビジュアルコンテンツ追加クイックスタート

このガイドでは、otodoki2 のドキュメントにスクリーンショットや動画を追加する手順を5ステップで説明します。

## 📋 必要なもの

- [ ] 動作している otodoki2 アプリケーション
- [ ] スクリーンショットツール（OS標準のものでOK）
- [ ] 画像編集ソフト（オプション）
- [ ] Git の基本知識

## 🚀 5ステップガイド

### ステップ 1: アプリケーションを起動

```bash
# リポジトリのルートで実行
make up
# または
docker compose up -d --build
```

アプリケーションが起動したら、ブラウザで確認：
- フロントエンド: http://localhost:3000
- API ドキュメント: http://localhost:8000/docs

### ステップ 2: スクリーンショットを撮影

#### macOS
```bash
# 範囲選択して撮影
Cmd + Shift + 4
```

#### Windows
```bash
# Snipping Tool を起動
Win + Shift + S
```

#### Linux
```bash
# gnome-screenshot を使用
gnome-screenshot -a
```

**撮影のポイント:**
- ブラウザのズームを 100% に設定
- デベロッパーツールは閉じる
- テスト用のダミーデータを使用

### ステップ 3: ファイルを配置

```bash
# スクリーンショットの場合
cp ~/Downloads/screenshot.png docs/screenshots/swipe-screen.png

# 動画/GIF の場合
cp ~/Downloads/demo.gif docs/videos/swipe-demo.gif

# 図の場合
cp ~/Downloads/diagram.svg docs/images/system-flow.svg
```

**ファイル命名規則:**
- 小文字とハイフン区切り: `feature-name.png`
- 内容が分かりやすい名前: `swipe-screen.png` ✅ `image1.png` ❌

### ステップ 4: ドキュメントを更新

`docs/VISUAL_GUIDE.md` を開いて、対応するセクションを更新：

```markdown
### スワイプ機能

![スワイプ画面](./screenshots/swipe-screen.png)

*図1: スワイプ機能のメイン画面*

**デモ動画**

![スワイプデモ](./videos/swipe-demo.gif)
```

### ステップ 5: コミット & プッシュ

```bash
# 変更を確認
git status

# ファイルを追加
git add docs/screenshots/swipe-screen.png
git add docs/VISUAL_GUIDE.md

# コミット
git commit -m "docs: スワイプ画面のスクリーンショットを追加"

# プッシュ（ブランチを作成している場合）
git push origin your-branch-name
```

## 💡 よくある質問

### Q: ファイルサイズが大きすぎる場合は？

**A:** 以下の方法で最適化できます：

```bash
# ImageMagick で圧縮
convert original.png -quality 85 -resize 1920x1080\> optimized.png

# または TinyPNG でオンライン圧縮
# https://tinypng.com/
```

### Q: 動画を GIF に変換するには？

**A:** FFmpeg を使用：

```bash
ffmpeg -i input.mp4 -vf "fps=15,scale=800:-1:flags=lanczos" output.gif

# または ezgif.com でオンライン変換
# https://ezgif.com/video-to-gif
```

### Q: 個人情報が写ってしまった場合は？

**A:** 
1. テスト用のダミーデータで撮り直す
2. 画像編集ソフトでモザイク/ぼかしを入れる
3. 該当部分をクロップする

### Q: どの画面を撮影すればいい？

**A:** 優先度の高い順：
1. スワイプ画面（メイン機能）
2. ライブラリ画面
3. ログイン/登録画面
4. オーディオプレイヤー
5. モバイルアプリ画面
6. API ドキュメント (Swagger UI)

## 📊 サイズガイドライン

| ファイルタイプ | 最大サイズ | 推奨解像度 |
|---------------|-----------|-----------|
| スクリーンショット | 500KB | 1920x1080 |
| 動画 (MP4) | 10MB | 1280x720 |
| GIF | 5MB | 800x600 |
| SVG | 制限なし | - |

## 🎯 チェックリスト

コミット前に以下を確認：

- [ ] ファイル名が命名規則に従っている
- [ ] ファイルサイズが推奨範囲内
- [ ] 個人情報が含まれていない
- [ ] ドキュメント (VISUAL_GUIDE.md) を更新した
- [ ] 画像が鮮明で見やすい
- [ ] ブラウザのデベロッパーツールが写っていない

## 📚 詳細ドキュメント

さらに詳しい情報は以下を参照：

- [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - ビジュアルガイドの全体
- [MEDIA_GUIDE.md](./MEDIA_GUIDE.md) - メディアファイル追加の詳細
- [SCREENSHOT_TEMPLATE.md](./SCREENSHOT_TEMPLATE.md) - 撮影ガイドライン
- [CONTRIBUTING_DOCS.md](./CONTRIBUTING_DOCS.md) - ドキュメント貢献の詳細

## 🤝 サポート

質問や問題がある場合は、GitHub Issue で相談してください！

---

**🎉 貢献ありがとうございます！** あなたの追加したビジュアルコンテンツが、他の開発者の理解を助けます。
