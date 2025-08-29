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
    @State private var selectedTab = 0
    @AppStorage("theme") private var theme = "dark"
    
    var body: some View {
        MainTabView(selectedTab: $selectedTab)
            .frame(minWidth: 600, minHeight: 700)
            .preferredColorScheme(theme == "dark" ? .dark : .light)
    }
}

#Preview {
    VocabDictView()
}
