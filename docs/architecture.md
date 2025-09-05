# vocabDict アーキテクチャ概要

このドキュメントは「長寿命で陳腐化しにくい観点」に絞って、vocabDict の全体アーキテクチャを説明します。個別機能や実装詳細（具体的なコマンド名の列挙など）は意図的に含めません。

## 全体像

vocabDict は Safari Web Extension とネイティブ App（iOS/macOS 共通）で構成されます。ネイティブ側のデータは SwiftData をベースに CloudKit でミラーリングされます。UI は JS 側（content/popup）と SwiftUI 側の双方が存在し、どちらからでも同じ「コマンド」層を呼び出してロジックを実行します。

```
+-------------------------+                 +------------------------------+
|  JS (content/popup)     |  sendMessage    |  JS background               |
|  - UI / 交互            +---------------->+  - ルーティング/送受信       |
|                         |                 |  - sendNativeMessage         |
+-------------------------+                 +--------------+---------------+
                                                            |
                                                            | Native Messaging
                                                            v
                                           +----------------+----------------+
                                           | SafariWebExtensionHandler.swift |
                                           |  - runCommand(Request)          |
                                           |  - JSON (Codable) 検証/整形      |
                                           +----------------+----------------+
                                                            |
                                                            | Command.fromProto(req, ctx)
                                                            v
                                      +---------------------+----------------------+
                                      |        Commands 層（ドメインロジック）       |
                                      |  - SwiftData(ModelContext) を受け取って実行   |
                                      |  - execute() -> Response (Codable)         |
                                      +---------------------+----------------------+
                                                            |
                                                            | SwiftData / CloudKit Mirror
                                                            v
                                      +---------------------+----------------------+
                                      |   データ層（SwiftData + CloudKitStore 最小化） |
                                      |  - モデル定義（VocabularyList 等）            |
                                      |  - App Group 上に永続化                      |
                                      +---------------------------------------------+
```

ポイント:
- Safari 側ハンドラは「薄い」レイヤです。受信 JSON を生成型（Codable）で復元し、コマンドに委譲して結果をそのまま返すだけです。
- コマンド層にドメインロジックを集約。SwiftUI/App からも同じコマンドを直接呼び出せます。
- SwiftData/CloudKit は「保管/同期の基盤」。CloudKitStore はコンテキスト生成や開発ユーティリティ中心に薄く保ちます。

## 型の一元化（SSOT: Single Source of Truth）

UI-Extension-ネイティブ間の境界を跨ぐデータは JSON Schema を起点にコード生成された「プロト型（Proto）」で統一します。

```
 JSON Schema  --->  JS: バリデータ/デコーダ
                  \->  Swift: Codable 型（Proto*）

  利用原則:
   - 送受信は常に Proto 型（Codable）をデコード/エンコード
   - SafariWebExtensionHandler では round-trip 検証（decode -> encode）で不正形を排除
   - JS でも validator を通して型の整合性を担保
```

これにより、
- 「境界の多重定義（Dictionary や ad-hoc JSON 乱立）」を回避
- 実装差分やパラメータ名のブレを機械的に抑止

## コマンドパターン

全てのユースケースは「コマンド」として表現されます。コマンドは以下の共通インターフェイスに従います。

```
protocol AppCommand {
  associatedtype Request: Codable
  associatedtype Response: Codable
  static func fromProto(_ request: Request, context: ModelContext) -> Self
  func execute() throws -> Response
}
```

特徴:
- Request/Response は Proto（生成型）を使用し、境界面の契約を強制。
- SwiftData の `ModelContext` を DI で受け取り、テスタブル（インメモリ）に。
- SafariWebExtensionHandler からも SwiftUI からも「同一のコマンド」を呼び出すため、重複実装を排除。

### 実行フロー（ハンドラ側）

```
message(JSON)              // JS -> background -> native
  -> decode to Request     // Codable + ISO8601 date
  -> Command.fromProto(req, ctx)
  -> execute() -> Response
  -> encode JSON + validate round-trip
  -> send back to JS
```

エラー処理:
- デコード失敗は `"Invalid request format: ..."` として即時応答。
- 実行時例外は `"Command execution failed: ..."` として応答。

## データ層（SwiftData + CloudKit）

SwiftData の `ModelContainer/ModelContext` を中心に構成し、App Group のストア上に永続化します。CloudKit はミラーリングで外部同期を担い、**コマンドはストアの存在を抽象化した `ModelContext` のみ**に依存します。

```
+----------------------+     +-------------------+
| ModelContainer       |<--->| CloudKit Mirror   |
+----------+-----------+     +-------------------+
           |
           v
   +-------+--------+
   | ModelContext   |
   +-------+--------+
           |
           v
   +-------+---------------+
   | SwiftData Models      |  // VocabularyList / UserSettings / ...
   +-----------------------+
```

CloudKitStore は「コンテナ/コンテキストの初期化」と「開発ユーティリティ（データリセット等）」に役割を限定し、ロジックはコマンドへ集約します。

## テスト戦略

テストは次の2層で構成します。

1) コマンド単体テスト（Swift）
- `ModelContext(inMemory)` を注入し、各コマンドが Request -> Response を正しく処理することを検証。
- 副作用（保存・整列・フィルタ・集計）の期待値を最小ケースで担保。

2) ハンドラ統合テスト（Swift）
- `SafariWebExtensionHandler` に対し「JSON メッセージ」を渡して応答 JSON を検証。
- 生成型での decode/encode 成功と、エラーメッセージの整合性を確認。

この分離により、境界（JSON）とドメイン（SwiftData）の双方を壊しにくくします。

## 新しいユースケースを追加する手順（高レベル）

1. JSON Schema を更新（Request/Response を追加）
2. 生成スクリプトで Swift/JS の Proto 型を再生成
3. `Shared (App)/Commands/` にコマンドを追加（fromProto/execute を実装）
4. `SafariWebExtensionHandler` の `switch action` に `runCommand(...) { Command.fromProto(...).execute() }` を1行追加
5. コマンド単体テストを追加し、必要に応じてハンドラ統合テストも更新

上記により、**境界契約（型）→ コマンド実装 → ハンドラ配線 → テスト**の最短経路を保ちます。

## 依存・責務の分離

- JS と Swift の「UI レイヤ」は自由に進化可能。ユースケースの契約は Proto 型で固定。
- ハンドラは「変換と委譲」に限定。
- コマンドがビジネスルールを持ち、SwiftData で永続化。
- データストアの作法（App Group, CloudKit）変更は CloudKitStore/初期化コードへ限定的に波及。

## バージョニングと互換性

- Proto 型（Schema）を変更する際は「後方互換」を基本とし、optional フィールド追加を優先。
- 破壊的変更が必要な場合、`action` の新設や `version` フィールド導入で段階的移行を可能にします。

## 図: メッセージ流路（要約）

```
JS UI                background            Handler                 Command                Data
-----                ----------            -------                 -------                ----
sendMessage  --->    route/action  --->    decode(Request)  --->   execute(ctx)  --->     SwiftData
                                 <---      encode(Response)  <---  return         <---    (CloudKit mirror)
```

## 図: レイヤの責務

```
Presentation  : JS(content/popup), SwiftUI
Boundary      : SafariWebExtensionHandler (decode/encode/dispatch)
Domain        : Commands (fromProto/execute), Mapping
Persistence   : SwiftData (ModelContext), CloudKit mirror
Infra         : CloudKitStore(初期化/開発ユーティリティ), App Group
```

---

この構成により、境界の型安全性とロジックの単一実装（コマンド集約）を両立し、JS と App の二重実装負債を最小化しながら、テスト容易性と段階的な機能拡張を可能にします。

