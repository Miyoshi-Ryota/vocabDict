# VocabDict テスト戦略

## テスト哲学

**デトロイト派TDD** - モックを最小限に抑え、実際の実装を使用してテストする

### 基本原則
1. **実装の詳細ではなく振る舞いをテスト**
2. **モックは必要最小限（ブラウザAPIのみ）**
3. **ユーザーの操作とソフトウェアの応答に焦点**

## 重要な指摘事項

### モックを避ける
```javascript
// ❌ 避ける
const mockDictionary = jest.fn();

// ✅ 推奨
const dictionary = new DictionaryService(realData);
```

### 非同期処理の適切なテスト
```javascript
// waitForヘルパーを使用（固定タイムアウトを避ける）
await waitFor(() => {
  return document.querySelector('.word-card');
});
```

## テスト構成

```
tests/
├── setup.js          # ブラウザAPIモック設定
├── helpers/          # waitForヘルパー関数
├── unit/            # 単体テスト
└── integration/     # 統合テスト
```

## 実行コマンド

```bash
npm test              # 全テスト実行
npm run test:watch    # ウォッチモード
npm run test:coverage # カバレッジレポート
```

## Safariでの実機テスト

### macOSでのテスト方法
1. Safari → 設定 → 詳細 → 「Web開発者向けの機能を表示」を有効化
2. Xcodeでビルド (⌘R)
3. Safari → 設定 → 拡張機能 → VocabDictを有効化
4. デバッグ: 開発メニュー → Web Extension Background Content

### iOSでのテスト方法
1. Xcodeでターゲットを「vocabDict (iOS)」に設定
2. デバイスまたはシミュレータを選択
3. ビルド実行 (⌘R)
4. iOS設定アプリ → Safari → 拡張機能 → VocabDictを有効化
5. Safariでテキスト選択してポップアップボタンを確認

### デバッグツール
- **macOS**: 開発メニューから各コンポーネントを調査
- **iOS**: Mac上のSafariの開発メニューから接続デバイスを選択してデバッグ

## 今後必ず守るべきこと

1. **新たに実装するときは必ずテストを先に書き、実装前ではテストが失敗することを確認し、実装後に全テストケースが成功することを確認する**
2. **モックではなく実装を使う**
3. **ユーザーフローを統合テストで検証**
4. **waitForヘルパーで非同期処理を扱う**
