# CloudKit同期実装設計書

## 設計の狙い

### 目標
Safari拡張機能で追加・編集した語彙データを、iPhone、iPad、Mac間で自動的に同期し、どのデバイスからでもシームレスに学習できるようにする。

### 実装方針
Issue #50の最終コメントに基づき、**SwiftData + CloudKit**（iOS 17+/macOS 14+）を使用した実装を採用。これにより：
- コードの簡潔性を保ちながら確実な同期を実現
- Apple標準技術のみを使用し、外部サービス依存を排除
- iCloudアカウントによる自動認証と同期

## 概要

VocabDictは、SwiftDataとCloudKitを使用してiOS/macOSデバイス間で語彙データを同期します。

### 想定される正しいアーキテクチャ図（設計意図）

```
┌─────────────────────────────────────────────────────────────┐
│                CloudKit Private Database                     │
│               (iCloud.com.vocabdict.sync)                    │
│                    自動同期（SwiftData）                      │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
    ┌─────────────▼──────────┐ ┌─────────▼───────────────────┐
    │      iOS/iPadOS        │ │        macOS                │
    │  ┌──────────────────┐  │ │  ┌──────────────────┐       │
    │  │  Native App      │  │ │  │  Native App      │       │
    │  │ (DataController) │  │ │  │ (DataController) │       │
    │  └────────┬─────────┘  │ │  └────────┬─────────┘       │
    │           │             │ │           │                 │
    │     App Group           │ │     App Group               │
    │  (group.com.vocabdict)  │ │  (group.com.vocabdict)      │
    │           │             │ │           │                 │
    │  ┌────────▼─────────┐  │ │  ┌────────▼─────────┐       │
    │  │Safari Extension  │  │ │  │Safari Extension  │       │
    │  │    Handler       │  │ │  │    Handler       │       │
    │  └────────┬─────────┘  │ │  └────────┬─────────┘       │
    └───────────┼─────────────┘ └───────────┼─────────────────┘
                │                            │
         Native Messaging              Native Messaging
         (設計意図通り)                (設計意図通り)
                │                            │
    ┌───────────▼─────────────┐ ┌───────────▼─────────────────┐
    │     JavaScript          │ │     JavaScript              │
    │  StorageManager が      │ │  StorageManager が          │
    │  sendNativeMessage      │ │  sendNativeMessage          │
    │  でHandlerと通信        │ │  でHandlerと通信            │
    └─────────────────────────┘ └─────────────────────────────┘
```

### 現在の実装状況

```
                    実装完了状態 (2025年1月)
┌─────────────────────────────────────────────────────────────┐
│                        CloudKit                              │
│                  (スキーマは作成済み✅)                        │
│                  (データ同期動作中✅)                         │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
                  │ 同期成功✅             │ 同期成功✅
                  │                       │
┌─────────────────▼──────────┐ ┌─────────▼───────────────────┐
│    Native App (iOS/macOS)  │ │    Native App (iOS/macOS)   │
│  DataController.shared ✅   │ │  DataController.shared ✅    │
│  → CloudKit同期動作中      │ │  → CloudKit同期動作中       │
└────────────────────────────┘ └─────────────────────────────┘
                  
                  ✅ 修正済み (nativeMessagingパーミッション追加)
┌─────────────────────────────────────────────────────────────┐
│                   Safari Extension                           │
│  ┌──────────────────────────────────────────────────┐       │
│  │  JavaScript: StorageManager                      │       │
│  │  sendNativeMessage() → ✅ 動作中                 │       │
│  └──────────────┬───────────────────────────────────┘       │
│                 │                                            │
│                 ↓ Native通信で直接送信                       │
│  ┌──────────────────────────────────────────────────┐       │
│  │  SafariWebExtensionHandler ✅                    │       │
│  │  → DataController.shared経由でCloudKit同期       │       │
│  │  → メッセージ受信・処理動作中✅                  │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 詳細設計

### 1. SwiftDataモデル層

#### 1.1 モデルクラス構成
`Shared (App)/Models/`ディレクトリに配置：

##### VocabularyList.swift
```swift
@Model
final class VocabularyList {
    var id: UUID = UUID()
    var name: String = ""
    var created: Date = Date()
    var isDefault: Bool = false
    var lastModified: Date = Date()
    
    @Relationship(deleteRule: .cascade)
    var words: [Word]? = []
    
    init(name: String, isDefault: Bool = false) {
        self.name = name
        self.isDefault = isDefault
    }
}
```

##### Word.swift
```swift
@Model
final class Word {
    var id: UUID = UUID()
    var word: String = ""
    var normalizedWord: String = ""
    var difficulty: String = "medium"
    var customNotes: String = ""
    var dateAdded: Date = Date()
    var lastReviewed: Date?
    var nextReview: Date?
    var reviewCount: Int = 0
    
    @Relationship(deleteRule: .nullify)
    var list: VocabularyList?
    
    @Relationship(deleteRule: .cascade)
    var reviewHistory: [ReviewHistory]? = []
    
    @Relationship
    var reviewSessions: [ReviewSession]? = []
    
    init(word: String, normalizedWord: String? = nil) {
        self.word = word
        self.normalizedWord = normalizedWord ?? word.lowercased()
    }
}
```

##### ReviewSession.swift
```swift
@Model
final class ReviewSession {
    var id: UUID = UUID()
    var date: Date = Date()
    var totalWords: Int = 0
    var correctCount: Int = 0
    var duration: TimeInterval = 0
    
    @Relationship(inverse: \Word.reviewSessions)
    var sessionWords: [Word]? = []
}
```

##### Settings.swift
```swift
@Model
final class Settings {
    static let singletonID = UUID(uuidString: "00000000-0000-0000-0000-000000000001")!
    
    var id: UUID = Settings.singletonID
    var theme: String = "light"
    var autoPlayPronunciation: Bool = false
    var showExampleSentences: Bool = true
    var textSelectionMode: String = "double-click"
    var dailyReviewGoal: Int = 10
    var reviewNotificationTime: Date?
    var lastModified: Date = Date()
}
```

#### 1.2 CloudKit要件
- すべてのモデルに`@Model`属性を付与
- リレーションシップには逆参照を設定（CloudKit必須）
- `@Relationship`で削除ルールを明示的に指定

### 2. DataController実装

#### 2.1 基本構成
```swift
class DataController {
    static let shared = DataController()
    
    let modelContainer: ModelContainer
    let modelContext: ModelContext
    
    private init() {
        // シングルトンパターンで初期化
    }
}
```

#### 2.2 初期化プロセス

1. **App Groupコンテナの取得**
   ```swift
   guard let appGroupURL = FileManager.default.containerURL(
       forSecurityApplicationGroupIdentifier: "group.com.vocabdict.shared"
   ) else {
       fatalError("App Group container URL not found")
   }
   ```

2. **ストアURLの設定**
   ```swift
   let storeURL = appGroupURL.appendingPathComponent("VocabDict.store")
   ```

3. **スキーマの定義**
   ```swift
   let schema = Schema([
       VocabularyList.self,
       Word.self,
       ReviewHistory.self,
       Settings.self,
       ReviewSession.self
   ])
   ```

4. **ModelConfigurationの作成**
   ```swift
   let modelConfiguration = ModelConfiguration(
       schema: schema,
       url: storeURL,
       cloudKitDatabase: .automatic  // CloudKit自動同期を有効化
   )
   ```

5. **ModelContainerとModelContextの初期化**
   ```swift
   modelContainer = try ModelContainer(
       for: schema,
       configurations: [modelConfiguration]
   )
   modelContext = ModelContext(modelContainer)
   modelContext.autosaveEnabled = true  // 自動保存を有効化
   ```

#### 2.3 保存メソッド
```swift
func save() {
    do {
        if modelContext.hasChanges {
            try modelContext.save()
        }
    } catch {
        print("Failed to save context: \(error)")
    }
}
```

### 3. Safari Extension Handler実装

#### 3.1 基本構成
```swift
class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    var modelContainer: ModelContainer {
        return DataController.shared.modelContainer
    }
    
    func beginRequest(with context: NSExtensionContext) {
        // メッセージ処理
    }
}
```

#### 3.2 メッセージ処理フロー

1. **メッセージの受信**
   - `NSExtensionContext`からメッセージを取得
   - iOS 15.0/macOS 11.0以降: `SFExtensionMessageKey`
   - それ以前: `"message"`キー

2. **アクション別処理**
   ```swift
   switch action {
   case "getVocabularyLists":
       await fetchVocabularyLists(modelContext: modelContext, context: context)
   case "addWord":
       await addWord(message: messageDict, modelContext: modelContext, context: context)
   case "getSettings":
       await fetchSettings(modelContext: modelContext, context: context)
   case "updateSettings":
       await updateSettings(message: messageDict, modelContext: modelContext, context: context)
   case "syncData":
       triggerSync(context: context)
   }
   ```

#### 3.3 単語追加処理（addWord）

1. **単語データの受信**
   ```swift
   guard let wordText = message["word"] as? String else {
       sendError(/* エラー */, to: context)
       return
   }
   ```

2. **Wordオブジェクトの作成**
   ```swift
   let word = Word(word: wordText)
   ```

3. **リストの関連付け**
   - 指定されたリストIDがある場合: そのリストを検索して関連付け
   - ない場合: デフォルトリストを検索または作成

4. **保存とCloudKit同期**
   ```swift
   modelContext.insert(word)
   try modelContext.save()
   DataController.shared.save()  // CloudKit同期をトリガー
   ```

### 4. JavaScript層の実装

#### 4.1 StorageManager (`src/services/storage.js`)

##### 初期化プロセス
```javascript
static async initialize() {
    try {
        this._useNativeSync = await this.isNativeMessagingAvailable();
        if (this._useNativeSync) {
            console.log('Native CloudKit sync enabled');
            await this.syncFromNative();
        } else {
            console.log('Using local storage only');
        }
    } catch (error) {
        console.error('Failed to initialize StorageManager:', error);
        this._useNativeSync = false;
    }
}
```

##### ネイティブメッセージング確認
```javascript
static async isNativeMessagingAvailable() {
    try {
        const response = await browser.runtime.sendNativeMessage({
            action: 'syncData'
        });
        return response && response.success;
    } catch (error) {
        console.log('Native messaging not available:', error);
        return false;  // Safariでは常にfalse
    }
}
```

#### 4.2 メッセージフロー

1. **Content Script/Popup → Background Script**
   ```javascript
   browser.runtime.sendMessage({
       type: 'add_to_list',
       word: wordData.word,
       listId: selectedListId
   })
   ```

2. **Background Script (message-handler.js)**
   ```javascript
   case MessageTypes.ADD_TO_LIST: {
       // browser.storage.localに保存
       const lists = await storage.get('vocab_lists') || [];
       // ... リスト操作 ...
       await storage.set('vocab_lists', lists);
   }
   ```

3. **問題点**: `browser.storage.local`からSwiftData/CloudKitへの橋渡しが未実装

### 5. CloudKit設定

#### 5.1 コンテナ設定
- **Container ID**: `iCloud.com.vocabdict.sync`
- **Database Type**: Private Database（ユーザーデータのみ）
- **Environment**: Development（開発中）/ Production（リリース時）

#### 5.2 必要なEntitlements

すべてのターゲット（App、Extension）で必要：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- CloudKitコンテナ -->
    <key>com.apple.developer.icloud-container-identifiers</key>
    <array>
        <string>iCloud.com.vocabdict.sync</string>
    </array>
    
    <!-- CloudKitサービス -->
    <key>com.apple.developer.icloud-services</key>
    <array>
        <string>CloudKit</string>
    </array>
    
    <!-- App Group（データ共有用） -->
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.vocabdict.shared</string>
    </array>
    
    <!-- その他必要な権限 -->
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
</dict>
</plist>
```

#### 5.3 CloudKitスキーマ

自動生成されるレコードタイプ：
- `CD_VocabularyList`
- `CD_Word`
- `CD_ReviewSession`
- `CD_ReviewHistory`
- `CD_Settings`

各レコードにはSwiftDataが自動的に以下のフィールドを追加：
- `CD_entityName`: エンティティ名
- `CD_id`: UUID
- 各プロパティに対応するフィールド
- リレーションシップ用の参照フィールド

### 6. データ同期の仕組み

#### 6.1 自動同期（SwiftData → CloudKit）

1. **データ変更の検知**
   - `modelContext.save()`が呼ばれると自動的にCloudKitへ同期
   - `autosaveEnabled = true`の場合、変更が自動保存される

2. **同期タイミング**
   - 即座にローカルデータベースに保存
   - バックグラウンドでCloudKitへアップロード
   - ネットワーク接続時に自動再試行

3. **競合解決**
   - SwiftDataが自動的にLast-Writer-Winsポリシーで解決
   - カスタム競合解決は現在未実装

#### 6.2 デバイス間同期

1. **プッシュ通知**
   - CloudKitが変更をプッシュ通知で配信
   - アプリがバックグラウンドでも受信可能

2. **データ取得**
   - 通知受信後、SwiftDataが自動的にデータをフェッチ
   - ローカルデータベースを更新

### 7. Safari Native Messaging の実装

#### 7.1 Safari Extension の Native Messaging サポート

**重要な発見（2025年1月）**:
Safari は `browser.runtime.sendNativeMessage` を**サポートしている**が、manifest.jsonに`nativeMessaging`パーミッションが必要。

**正しい実装方法**:
```javascript
// StorageManager.js の動作
browser.runtime.sendNativeMessage({action: 'addWord', word: 'hello'})
    ↓
SafariWebExtensionHandler.swift が受信
    ↓
DataController.shared 経由で SwiftData/CloudKit に保存
```

**必要な設定**:
```json
// manifest.json
{
    "permissions": [
        "storage",
        "contextMenus",
        "nativeMessaging"  // これが必須！
    ]
}
```

#### 7.2 実装上の注意点

**パーミッション設定**:
- `nativeMessaging`パーミッションがないと`sendNativeMessage`は未定義
- manifest.jsonへの追加が必須

**データフロー**:
- JavaScript → Native: `browser.runtime.sendNativeMessage`
- Native → CloudKit: SwiftData自動同期
- CloudKit → 他デバイス: iCloud経由で自動配信

### 8. 実装の詳細

#### 8.1 Safari Native Messaging の正しい使用方法

**2025年1月時点の実装**:
Safariは`browser.runtime.sendNativeMessage`を完全にサポートしています。

```javascript
// ✅ 正しい実装（StorageManager.js）
static async isNativeMessagingAvailable() {
    try {
        const response = await browser.runtime.sendNativeMessage({
            action: 'syncData'
        });
        return response && response.success;
    } catch (error) {
        console.log('Native messaging not available:', error);
        return false;
    }
}
```

**必須要件**:
1. manifest.jsonに`nativeMessaging`パーミッション
2. SafariWebExtensionHandlerでメッセージ処理
3. 適切なエラーハンドリング

#### 8.2 メッセージフローの実装

**JavaScript側（StorageManager）**:
```javascript
// 単語を追加
static async syncVocabularyListsToNative(lists) {
    const response = await browser.runtime.sendNativeMessage({
        action: 'addWord',
        word: wordData.word,
        listId: list.id,
        metadata: {
            difficulty: wordData.difficulty,
            customNotes: wordData.customNotes,
            // ...その他のメタデータ
        }
    });
    return response;
}
```

**Swift側（SafariWebExtensionHandler）**:
```swift
func beginRequest(with context: NSExtensionContext) {
    // メッセージを受信
    guard let messageDict = message as? [String: Any],
          let action = messageDict["action"] as? String else {
        // エラー処理
        return
    }
    
    // アクションに応じて処理
    switch action {
    case "addWord":
        await addWord(message: messageDict, modelContext: modelContext, context: context)
    // ... その他のアクション
    }
}
```

#### 8.3 トラブルシューティング

**よくある問題と解決策**:

1. **`sendNativeMessage is not a function`エラー**
   - 原因：`nativeMessaging`パーミッションの欠如
   - 解決：manifest.jsonに追加

2. **メッセージが届かない**
   - 原因：SafariWebExtensionHandlerの実装ミス
   - 解決：メッセージフォーマットを確認

3. **CloudKitに同期されない**
   - 原因：DataController.save()の呼び出し忘れ
   - 解決：保存後に明示的にsave()を呼ぶ

### 9. テスト方法

#### 9.1 CloudKit同期の確認

1. **CloudKit Dashboardでの確認**
   ```
   1. https://icloud.developer.apple.com にアクセス
   2. "CloudKit Database"を選択
   3. コンテナ "iCloud.com.vocabdict.sync" を選択
   4. "Development"環境を選択
   5. "Records"タブでデータを確認
   ```

2. **クエリ実行**
   ```
   Record Type: CD_VocabularyList
   Fields: All
   ```

#### 9.2 デバイス間同期テスト

1. **準備**
   - 2台のデバイス（iOS/macOS）を用意
   - 同じApple IDでサインイン
   - 両方でアプリをインストール

2. **テスト手順**
   ```
   1. デバイスAでデータを追加
   2. CloudKit Dashboardで確認
   3. デバイスBでアプリを起動
   4. データが同期されているか確認
   ```

#### 9.3 ログの確認

**Xcodeコンソール**:
- DataController初期化ログ
- CloudKit同期エラー
- ネットワークエラー

**Safari Web Inspector**:
- JavaScriptコンソールログ
- ネットワークエラー
- Storage API呼び出し

### 10. 実装状況のまとめ（2025年1月更新）

#### 完成している部分 ✅
1. **SwiftData モデル定義** - 全モデルクラス実装済み
2. **DataController** - SwiftData/CloudKit統合実装済み
3. **CloudKit スキーマ** - Development環境で作成済み
4. **App Groups 設定** - group.com.vocabdict.shared 設定済み
5. **Native App からの同期** - 正常に動作中
6. **SafariWebExtensionHandler** - DataController.shared 使用済み
7. **JavaScript → Swift 通信** - nativeMessagingパーミッション追加で解決
8. **Extension データの CloudKit 同期** - 動作確認済み

#### 既知の問題
- 一部のエッジケースでバグが残っている可能性
- パフォーマンスの最適化が必要な場合がある

#### 重要な学び
1. **Safari は `browser.runtime.sendNativeMessage` をサポートしている**
   - ただし、manifest.jsonに`nativeMessaging`パーミッションが必須
2. **ドキュメントの情報が古い場合がある**
   - 実際にテストして確認することが重要
3. **シンプルな解決策が最良**
   - 複雑な回避策を実装する前に、基本的な設定を確認

### 11. 今後の開発計画

#### Phase 1: 基本同期の実装（✅ 完了）
- ✅ SwiftDataモデルの作成
- ✅ CloudKit設定
- ✅ DataControllerの実装
- ✅ JavaScript-Swift通信の確立
- ✅ nativeMessagingパーミッションの追加

#### Phase 2: 安定化とバグ修正（現在）
- エッジケースのバグ修正
- パフォーマンスの最適化
- エラーハンドリングの改善
- 同期の信頼性向上

#### Phase 3: 高度な機能
- オフライン対応の強化
- 競合解決のカスタマイズ
- 同期状態のUI表示
- リアルタイム同期の最適化
- browser.storage.localとの完全な統合