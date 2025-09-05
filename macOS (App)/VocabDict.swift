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
    @Environment(\.modelContext) private var modelContext
    @State private var status: String = ""
    @State private var lastSummary: String = UserDefaults.standard.string(forKey: "DevResetLastSummary") ?? ""

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Reset & Status (Dev)").font(.headline)

            HStack(spacing: 12) {
                Button("Run Full Reset (Same as Handler)") {
                    let summary = DataResetter.runFullReset(containers: nil)
                    if let data = try? JSONSerialization.data(withJSONObject: summary, options: [.prettyPrinted]),
                       let str = String(data: data, encoding: .utf8) {
                        lastSummary = str
                    }
                    refreshStatus()
                }
                Button("Refresh Status") {
                    refreshStatus()
                }
            }

            if !status.isEmpty {
                Text("Current Status:").font(.subheadline)
                ScrollView { Text(status).font(.system(.body, design: .monospaced)) }.frame(minHeight: 120)
            }

            if !lastSummary.isEmpty {
                Text("Last Reset Summary:").font(.subheadline)
                ScrollView { Text(lastSummary).font(.system(.body, design: .monospaced)) }.frame(minHeight: 160)
            }

            Spacer()
        }
        .padding()
        .onAppear { refreshStatus() }
    }

    private func refreshStatus() {
        var lines: [String] = []
        // 1) App Group store files
        if let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.vocabdict.shared") {
            let base = appGroupURL.appendingPathComponent("VocabDict.store")
            let candidates = [base, URL(fileURLWithPath: base.path + "-wal"), URL(fileURLWithPath: base.path + "-shm")]
            for url in candidates {
                let exists = FileManager.default.fileExists(atPath: url.path)
                let statusLine = "file \(url.lastPathComponent): " + (exists ? "exists" : "missing")
                lines.append(statusLine)
            }
        } else {
            lines.append("app group: not found")
        }

        // 2) SwiftData counts
        do {
            let lists = try modelContext.fetch(FetchDescriptor<VocabularyList>())
            let searches = try modelContext.fetch(FetchDescriptor<RecentSearchHistory>())
            let settings = try modelContext.fetch(FetchDescriptor<UserSettings>())
            let stats = try modelContext.fetch(FetchDescriptor<DictionaryLookupStats>())
            lines.append("counts: VocabularyList=\(lists.count), RecentSearchHistory=\(searches.count), UserSettings=\(settings.count), LookupStats=\(stats.count)")
        } catch {
            lines.append("counts: error \(error.localizedDescription)")
        }

        status = lines.joined(separator: "\n")
        lastSummary = UserDefaults.standard.string(forKey: "DevResetLastSummary") ?? lastSummary
    }
}

#Preview {
    VocabDictView()
}

// (Optional) Previously auto-run reset removed; now manual from UI
