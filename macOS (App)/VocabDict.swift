//
//  VocabDict.swift
//  vocabDict (macOS)
//
//  Created by Ryota Miyoshi on 2025/8/24.
//

import SwiftUI
import SwiftData

@main
struct VocabDict: App {
    
    var body: some Scene {
        WindowGroup {
            VocabDictView()
        }
        .modelContainer(CloudKitStore.shared.modelContainer)
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
