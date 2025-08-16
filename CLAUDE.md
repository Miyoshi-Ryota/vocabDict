# CLAUDE.md - VocabDict開発で守るべきこと

## 必ず守るべき原則

### 1. テスト駆動開発（TDD）
- **新たに実装するときは必ずテストを先に書く**
- テストが失敗することを確認してから実装
- 実装後に全テストケースが成功することを確認

### 2. デトロイト派TDDアプローチ
- **モックを避け、実際の実装を使用**
- ブラウザAPIのみモック化を許可
- 実装の詳細ではなく振る舞いを、つまりユーザーの操作とソフトウェアの応答に焦点を当てること

### 3. テストの書き方 - ユーザー視点の振る舞いテスト

#### ✅ 良いテスト例（ユーザー視点の振る舞い）
```javascript
// ユーザーがボタンをクリックしたら、画面に結果が表示される
test('should display word definition when user clicks lookup button', async () => {
  // ユーザーが単語を選択
  const selection = selectText('hello');
  
  // 検索ボタンが表示される
  const button = await waitForElement('.lookup-button');
  
  // ユーザーがボタンをクリック
  button.click();
  
  // 定義が画面に表示される（ユーザーが見える結果）
  const overlay = await waitForElement('.word-overlay');
  expect(overlay.textContent).toContain('挨拶');
});
```

#### ❌ 悪いテスト例（実装の詳細）
```javascript
// ソフトウェアの内部動作をテストしている
test('should call sendMessage when button clicked', async () => {
  button.click();
  
  // 実装の詳細：特定の関数が呼ばれたか
  expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
    type: 'LOOKUP_WORD',
    word: 'hello'
  });
  
  // 実装の詳細：内部の状態変更
  expect(internalState.lastLookup).toBe('hello');
});
```

#### テストの原則
1. **ユーザーが何をするか** → **何が見えるか/起きるか**を検証
2. 関数が呼ばれたか、メッセージが送られたか、は実装の詳細
3. DOM要素の表示/非表示、テキスト内容、ユーザーへのフィードバックを検証

#### 例外：実装詳細の確認が必要な場合
ブラウザ環境の制約で直接確認できない場合のみ、コメント付きで許可：
```javascript
// 注：Popupウィンドウが実際に開くことは、ブラウザ環境でないと確認できないため、
// メッセージが正しく送信されたことを確認する（実装の詳細だが、他に方法がない）
expect(browser.runtime.sendMessage).toHaveBeenCalledWith(
  expect.objectContaining({ type: 'open_popup_with_word' })
);
```

### 4. その他テストについて
- `waitFor`ヘルパーで非同期処理を扱い、固定タイムアウトを避ける
- テスト間の独立性を保つ（各テストは他のテストに依存しない）
- afterEachで適切にクリーンアップする

### 5. コミット単位
- **小さくアトミックなコミット**
- 意味のある単位で分割
- フィーチャーブランチを使用

## 技術的制約

### Safari Extension の制限
- **ES6モジュール非対応** - webpackバンドル必須
- `browser.*` API使用（`chrome.*`ではない）
- manifest v3形式
- テーマ自動検出不可（手動選択のみ）

## プロジェクト構造

詳細は以下のドキュメントを参照：
- アーキテクチャ: `docs/architecture.md`
- テスト戦略: `docs/testing.md`
- 開発ガイド: `docs/development.md`

## 重要なフィードバック履歴
- 「不必要なモックを避けなければならない。デトロイト派のテストを好む」
- 「SpacedRepetitionはサービスであるべき。データではないから」
- 「モックより実際の実装を使用することを好む」

## リンクとコマンド

### よく使うコマンド
```bash
npm test              # テスト実行
npm run lint
npm run build:dev     # 開発ビルド
npm run build:macos   # macOSアプリビルド
```

### リポジトリ
- GitHub: https://github.com/Miyoshi-Ryota/vocabDict
