# VocabDict 開発ガイド

## セットアップ

### 必要環境
- macOS with Safari 18.0+
- Xcode 15+
- Node.js 18+
- npm

### 初期設定

```bash
# リポジトリをクローン
git clone https://github.com/Miyoshi-Ryota/vocabDict.git
cd vocabDict

# 依存関係をインストール
npm install
```

## ビルド方法

### Webリソースのビルド
resourcesディレクトリにバンドルしたファイルを設置する

```bash
# 開発ビルド（ソースマップ付き）
npm run build:dev

# 本番ビルド
npm run build

# ウォッチモード（ファイル変更を監視）
npm run watch
```

### アプリのビルド
Webリソースのビルド後に、実際にappまで作成する。

```bash
# macOSアプリ
npm run build:macos

# iOSアプリ  
npm run build:ios

# 両プラットフォーム
npm run build:all
```

### テスト方法は
docs/testing.mdを参照ください

### デバッグ方法
- **Popup**: 拡張機能アイコンを右クリック → 「要素を調査」
- **Background**: 開発メニュー → Web Extension Background Content → VocabDict
- **Content Script**: 開発メニュー → [現在のページ] → JavaScriptコンソール


## プロジェクト構造
docs/architecture.mdを参照してください。
