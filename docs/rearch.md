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

- 単一の型をprotocol buffersで生成して、それらからJS, Swiftのコードを生成する。それを以下の全てで使うようにしたい。
  - JSのUIとbackの通信: popup.js, content.js <--> background.js
  - JSとSwiftのの通信: background.js <--> SafariWebExtensionHandler.swift
  - SafariWebExtensionHandlerとCommandパターンのやり取り: SafariWebExtensionHandler.swift <--> SomeCommand.swift
  - SwiftUIとCommandパターンのやり取り: SwiftUIView.swift <--> SomeCommand.swift
- 型をprotocol buffersで生成してパターンのコマンドごとにrequest, responseを定義する。
- コマンドパターンのコマンドクラスは通常のinitの他にfrom_protoのようなメソッドを持ち、型をprotocol buffersで生成してトからインスタンスを生成できるようにする。

- 全てのJS UI - JS background.js - SwiftWebExtensionHandlerの通信は全て型をprotocol buffersで生成しては転送するだけにする。
- 基本コマンドパターンの実行以上の複雑なことをしない。つまりSwiftWebExtensionHandlerではSomeCommand.from_proto(request, ctx) -> execute()を呼び出すだけにするし、UI側でも同様にSomeCommandのインスタンスを作成後、execute()するだけにする。

## 相談
- この解決方法についてあなたはどう考えますか？批判的に考えて、指摘してください。
- 特に全体像としてはどう思いますか？
- 細かい点でimproveさせられる点はありますか？

