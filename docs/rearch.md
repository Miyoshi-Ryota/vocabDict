# アーキテクチャ変更依頼。


## 背景・課題

- iOS, macOS両方対応しています。
- Safari Web Extensionです。つまり構成として、以下のようになっています。
  - Extension
    - JavaScript部分
      - content.js
      - popup.js
      - background.js
    - SafariWebExtensionHandler（Nativeとの接続部分）
  - Native部分
  
図にすると以下のような感じです。

JSのUI(content.js / popup.js)
|
| sendMessage
|
JSのbackground(background.js)
|
| sendNativeMessage
|
SafariWebExtensionHandler.swift
|
-------------------------------------------------- ExtensionとAppの壁
|
CloudKitStore.swift -- AppのView
|
|
Models.swift

現状の課題として、以下の三つがあります。
- Messagingの場所が以下のようにありますが、それぞれでrequest, responseを定義しないといけないので、煩雑です。かつ生成AIが作成しているので微妙にパラメータが統一できなかったりします。特にほとんどが型がないJSONやらDictionary型なので無駄に煩雑です。機械的に統一できる方法が欲しいです。
JSのUI <----> JSのbackground,
JSのbackground <----> SwiftのSafariWebExtensionHandler
- App側にもJSのpopup.htmlと同様のUIを作成するつもりです。JSとApp側の両方に同じようなUI、同じような機能を実装するつもりです。そうなったときにApp側とJS側で二重に同じようなことを実装しなければなりません。UIは二重に実装するのを避けられないと思いますが、例えばCloudKitStoreの使い方について、SwiftWebExtensionHandler.swiftから使うのと、Appから使うのとで同じような使うコードを書かなければなりませんが、それが統一できていてJS, Appで同じく実装できてることが保証するすべはないです。
- CloudKitStore.swiftがほとんどのロジックを持ってしまっています。


## 解決案
と言うことで、以下のようにしたいと思っています。

- CloudKitStoreは解体する。単にCloudKitのcontainer, contextを作成する関数を用意するだけにする。
- 加えて、各種操作はコマンドパターンで実現する。
  - 例えばAddWordCommand, FetchVocabularyCommand, SubmitReviewなどのコマンドを用意する。
  - 各コマンドはcloudkitのcontainerなりcontextなりを受け取り、execute()メソッドを持つ。
  - コマンドパターンのコマンドはSwiftUIからも、SwiftWebExtensionHandlerからも使えるようにする。

- 単一の型を JSONSchemaから生成して、それらからJS, Swiftのコードを生成する。それを以下の全てで使うようにしたい。
  - JSのUIとbackの通信: popup.js, content.js <--> background.js
  - JSとSwiftのの通信: background.js <--> SafariWebExtensionHandler.swift
  - SafariWebExtensionHandlerとCommandパターンのやり取り: SafariWebExtensionHandler.swift <--> SomeCommand.swift
  - SwiftUIとCommandパターンのやり取り: SwiftUIView.swift <--> SomeCommand.swift
- 型を JSONSchemaから生成してパターンのコマンドごとにrequest, responseを定義する。
- コマンドパターンのコマンドクラスは通常のinitの他にfrom_protoのようなメソッドを持ち、型を JSONSchemaから生成してトからインスタンスを生成できるようにする。

- 全てのJS UI - JS background.js - SwiftWebExtensionHandlerの通信は全て型を JSONSchemaから生成しては転送するだけにする。
- 基本コマンドパターンの実行以上の複雑なことをしない。つまりSwiftWebExtensionHandlerではSomeCommand.from_proto(request, ctx) -> execute()を呼び出すだけにするし、UI側でも同様にSomeCommandのインスタンスを作成後、execute()するだけにする。
  - ただしSwiftUIからはSwiftDataの読み込みについてあれこれコードを書かずに@queryなどとアノテーとするだけでできるので、その場合はコマンドを使わずに独自に読み込んでも良いです。JSのUIからはそのようなことはできないので、全てコマンドパターンを使うことになります。

## 依頼の背景
以下のJSON Schemaをschemas/内に生成AIに作成してもらいました。

- JS UI -> message-handler.js宛のsendMessageで送るrequest, response
- message-handler.jsからSwiftWebExtensionHandler.swift宛のsendNativeMessageで送るrequest, response
  - 現状のJSから送っている実際のrequestのactionはやや省略された形になっていますが、例えばAddWordToVocabularyListのように完全な形にしてもらいました。


## 依頼
既存のsendMessage, sendNativeMessageを読んで、実際に今送っている内容と、今回作っていただいたJSON Schemaの内容が合っているかを確認してもらえますか？注意深く複数回確認してください。

## スキーマとコード生成の運用

- 変更手順
  - `schemas/*.json` を編集して契約（request/response）を更新します。
  - `npm run generate:types` で以下を自動生成します。
    - Swift Codable 型: `Shared (App)/Generated/AllTypes.swift`
    - JS バリデータ/型: `src/generated/*.js`
    - バリデータ・インデックス: `src/generated/validators.js`（schemas から自動生成）
  - 生成物は手動編集しないでください。`.ts` 生成物は廃止し、`.gitignore` で無視しています。

- 検証方針
  - JS の UI→background、background→native の両方で、`validators.validateRequest/validateResponse` を適用します。
  - Swift 側は `SafariWebExtensionHandler` が `Codable` でデコードし、エラー時は `{ success:false, error:... }` で返します。

- CI/フック
  - `pretest:js` と `prebuild` で `generate:types` を実行します。スキーマ変更の取りこぼしを防ぎます。

- 命名・語彙の統一
  - action 名は camelCase。
  - reviewResult は `{ known, unknown, mastered, skipped }` に統一。
  - difficulty は数値（頻度）で保持。UI の表示は必要に応じてバケット化（easy/medium/hard）。

ただし、Actionの名前は現状少し異なっているのは許容しているので良いです。例えばAddWordToVocabularyListが、現状ではadd_wordになっているのはすでにわかっています。


## すでにわかっていること
- sendMessage時点ではtype: xxx, JSON Schemaではaction: xxxになっているのはコード側をactionに変えることで修正してください。

- sendMessage, sendNativeMessageのactionのValueはキャメルケースにしてください。JSON SchemaもJSのコードも、Swiftのコードも全て修正する必要があるかと思います。（sendNativeMessage時点ではキャメルケースではあるけど若干名前が異なるので）

- Submit ReviewのresultはreviewResultに統一してください。JSON Schemaだけの変更だとは思ってます。

- metadata.difficultyはint型にしてください。JSON Schema, 実装の両方を変更する必要があると思います。

- IncrementLookupCount（Swift側にはincrementLookupCountとして存在するが、JS側から呼ばれていない）はJS側からもよんでます。dictionary-service.jsから呼んでます。よく調べてみてください。将来的にはdictionaryもswiftに移しますが現状では残しておいてください。dictionary-service.jsからのsendNativeMessageの呼び出しの内容を調べてSchemaとズレがないか確認してください。

- FetchLookupCount（Swift側にはgetLookupCountとして存在、JS側ではdictionary.getLookupCount()を直接使用）は現状、dictionary-service.jsから呼んでます。なので現状では残しておいてください。dictionary-service.jsからのsendNativeMessageの呼び出しの内容を調べてSchemaとズレがないか確認してください。

- FetchLookupStats（Swift側にはgetLookupStatsとして存在するが、JS側から呼ばれていない）は将来的に使うので残しておいてください。コメントか何かで使ってないことは残しておいてください。


- 成功レスポンス
  - 現状のJS: { success: true, data: {...} }
  - JSON Schemaにはsuccessフィールドなし
- エラーレスポンス
  - 現状: { success: false, error: "..." } または { error: "..." }
  - JSON Schemaにはエラー構造の定義なし
-> これらはJSON Schema側を修正して、コードに合わせてください。
エラーレスポンスについて、success: falseがコード側にないところがあるのならば、コード側もsuccess: falseを追加してください。

- listId
  - JSON Schema: format: "uuid"として定義
  - 現状: 文字列として扱い、Swift側でUUID変換
-> コード側も可能であるならばUUIDにしてください。JSなので無理なら今のままでも良いと思っています。JSON Schemaもstringであるが、formatがuuidであるということなので別に型の不一致ではないでしょう。
