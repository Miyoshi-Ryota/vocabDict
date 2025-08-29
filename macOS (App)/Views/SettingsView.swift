//
//  SettingsView.swift
//  vocabDict (macOS)
//
//  Settings and preferences view
//

import SwiftUI
import SwiftData

struct SettingsView: View {
    @AppStorage("theme") private var theme = "dark"
    @AppStorage("autoAddLookups") private var autoAddLookups = true
    @AppStorage("textSelectionMode") private var textSelectionMode = "popup"
    @AppStorage("dailyReviewLimit") private var dailyReviewLimit = 30
    
    @Query private var userSettings: [UserSettings]
    @Environment(\.modelContext) private var modelContext
    
    @State private var showExportAlert = false
    @State private var showImportAlert = false
    @State private var exportedData = ""
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text("Settings")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.bottom)
                
                // Theme Section
                SettingSection(title: "Appearance") {
                    HStack {
                        Text("Theme")
                            .frame(width: 150, alignment: .leading)
                        
                        Picker("Theme", selection: $theme) {
                            Text("Light").tag("light")
                            Text("Dark").tag("dark")
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 200)
                        .onChange(of: theme) { _, newValue in
                            updateUserSettings()
                        }
                        
                        Spacer()
                    }
                }
                
                // Behavior Section
                SettingSection(title: "Behavior") {
                    VStack(alignment: .leading, spacing: 16) {
                        Toggle(isOn: $autoAddLookups) {
                            Text("Automatically add looked up words")
                        }
                        .onChange(of: autoAddLookups) { _, _ in
                            updateUserSettings()
                        }
                        
                        Divider()
                        
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Text Selection Lookup Mode")
                                .font(.headline)
                            
                            RadioButton(
                                title: "Inline overlay",
                                subtitle: "Shows definition on the page",
                                isSelected: textSelectionMode == "inline",
                                action: {
                                    textSelectionMode = "inline"
                                    updateUserSettings()
                                }
                            )
                            
                            RadioButton(
                                title: "Extension popup",
                                subtitle: "Opens this window",
                                isSelected: textSelectionMode == "popup",
                                action: {
                                    textSelectionMode = "popup"
                                    updateUserSettings()
                                }
                            )
                        }
                    }
                }
                
                // Learning Section
                SettingSection(title: "Learning") {
                    HStack {
                        Text("Daily review limit")
                            .frame(width: 150, alignment: .leading)
                        
                        TextField("", value: $dailyReviewLimit, format: .number)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 80)
                            .onChange(of: dailyReviewLimit) { _, _ in
                                updateUserSettings()
                            }
                        
                        Stepper("", value: $dailyReviewLimit, in: 5...100, step: 5)
                        
                        Text("words")
                            .foregroundColor(.secondary)
                        
                        Spacer()
                    }
                }
                
                // Data Management Section
                SettingSection(title: "Data Management") {
                    HStack(spacing: 16) {
                        Button(action: exportData) {
                            Label("Export Data", systemImage: "square.and.arrow.up")
                                .frame(width: 150)
                        }
                        .buttonStyle(SecondaryButtonStyle())
                        
                        Button(action: importData) {
                            Label("Import Data", systemImage: "square.and.arrow.down")
                                .frame(width: 150)
                        }
                        .buttonStyle(SecondaryButtonStyle())
                        
                        Spacer()
                    }
                }
                
                // About Section
                SettingSection(title: "About") {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Version")
                                .foregroundColor(.secondary)
                            Spacer()
                            Text("1.0.0")
                        }
                        
                        Divider()
                        
                        HStack {
                            Text("Extension Status")
                                .foregroundColor(.secondary)
                            Spacer()
                            HStack(spacing: 4) {
                                Circle()
                                    .fill(Color.green)
                                    .frame(width: 8, height: 8)
                                Text("Connected")
                                    .font(.caption)
                            }
                        }
                        
                        Divider()
                        
                        HStack {
                            Text("Storage Used")
                                .foregroundColor(.secondary)
                            Spacer()
                            Text("2.3 MB")
                                .font(.caption)
                        }
                    }
                }
                
                Spacer()
            }
            .padding()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(NSColor.windowBackgroundColor))
        .alert("Export Complete", isPresented: $showExportAlert) {
            Button("Copy to Clipboard") {
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(exportedData, forType: .string)
            }
            Button("OK") {}
        } message: {
            Text("Your vocabulary data has been exported successfully.")
        }
        .alert("Import Data", isPresented: $showImportAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Import") {
                // Handle import
            }
        } message: {
            Text("Paste your exported data to import.")
        }
        .onAppear {
            loadUserSettings()
        }
    }
    
    private func loadUserSettings() {
        if let settings = userSettings.first {
            theme = settings.theme
            autoAddLookups = settings.autoAddLookups
            textSelectionMode = settings.textSelectionMode
        }
    }
    
    private func updateUserSettings() {
        if let settings = userSettings.first {
            settings.theme = theme
            settings.autoAddLookups = autoAddLookups
            settings.textSelectionMode = textSelectionMode
        } else {
            let newSettings = UserSettings(
                theme: theme,
                textSelectionMode: textSelectionMode,
                autoAddLookups: autoAddLookups
            )
            modelContext.insert(newSettings)
        }
    }
    
    private func exportData() {
        // Collect all data
        var exportDict: [String: Any] = [:]
        
        // Add settings
        if let settings = userSettings.first {
            exportDict["settings"] = settings.toDictionary()
        }
        
        // Add vocabulary lists
        let lists = try? modelContext.fetch(FetchDescriptor<VocabularyList>())
        if let lists = lists {
            exportDict["lists"] = lists.map { $0.toDictionary() }
        }
        
        // Convert to JSON
        if let jsonData = try? JSONSerialization.data(withJSONObject: exportDict, options: .prettyPrinted),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            exportedData = jsonString
            showExportAlert = true
        }
    }
    
    private func importData() {
        showImportAlert = true
    }
}

struct SettingSection<Content: View>: View {
    let title: String
    let content: Content
    
    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
            
            VStack(alignment: .leading, spacing: 12) {
                content
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(8)
        }
    }
}

struct RadioButton: View {
    let title: String
    let subtitle: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: isSelected ? "largecircle.fill.circle" : "circle")
                    .foregroundColor(isSelected ? .accentColor : .secondary)
                    .font(.title3)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .foregroundColor(.primary)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    SettingsView()
        .frame(width: 600, height: 700)
}