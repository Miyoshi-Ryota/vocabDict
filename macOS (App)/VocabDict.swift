//
//  VocabDict.swift
//  vocabDict (macOS)
//
//  Created by Ryota Miyoshi on 2025/8/24.
//

import SwiftUI

@main
struct VocabDict: App {
    var body: some Scene {
        WindowGroup {
            VocabDictView()
        }
    }
}

struct VocabDictView: View {
    var body: some View {
        Text(/*@START_MENU_TOKEN@*/"Hello, World!"/*@END_MENU_TOKEN@*/)
    }
}

#Preview {
    VocabDictView()
}
