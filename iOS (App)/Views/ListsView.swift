//
//  ListsView.swift
//  vocabDict (macOS)
//
//  Vocabulary lists management view
//

import SwiftUI
import SwiftData

struct ListsView: View {
    @Query(sort: \VocabularyList.created, order: .reverse)
    private var vocabularyLists: [VocabularyList]
    
    @State private var showNewListDialog = false
    @State private var newListName = ""
    @State private var selectedList: VocabularyList?
    @State private var sortOption = "recent"
    @State private var filterOption = "all"
    
    @Environment(\.modelContext) private var modelContext
    
    var body: some View {
        VStack(spacing: 0) {
            // Header with New List button
            HStack {
                Button(action: {
                    showNewListDialog = true
                }) {
                    Label("New List", systemImage: "plus")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .frame(width: 150)
                
                Spacer()
            }
            .padding()
            
            // Lists Container
            ScrollView {
                VStack(spacing: 12) {
                    if vocabularyLists.isEmpty {
                        EmptyListsView()
                            .frame(maxHeight: .infinity)
                            .padding(.top, 100)
                    } else {
                        ForEach(sortedAndFilteredLists) { list in
                            VocabularyListCard(
                                list: list,
                                isSelected: selectedList?.id == list.id,
                                onSelect: {
                                    withAnimation {
                                        selectedList = list
                                    }
                                }
                            )
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            // Sort and Filter Controls
            HStack(spacing: 20) {
                HStack {
                    Text("Sort by:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Picker("Sort", selection: $sortOption) {
                        Text("Most Recent").tag("recent")
                        Text("Alphabetical").tag("alphabetical")
                        Text("Date Added").tag("dateAdded")
                        Text("Last Reviewed").tag("lastReviewed")
                    }
                    .pickerStyle(.menu)
                    .frame(width: 150)
                }
                
                HStack {
                    Text("Filter:")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Picker("Filter", selection: $filterOption) {
                        Text("All Difficulties").tag("all")
                        Text("Easy").tag("easy")
                        Text("Medium").tag("medium")
                        Text("Hard").tag("hard")
                    }
                    .pickerStyle(.menu)
                    .frame(width: 150)
                }
                
                Spacer()
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            
            // Selected List Words
            if let list = selectedList {
                Divider()
                SelectedListWordsView(list: list)
                    .frame(height: 250)
            }
        }
        .sheet(isPresented: $showNewListDialog) {
            NewListDialog(
                listName: $newListName,
                onCancel: {
                    showNewListDialog = false
                    newListName = ""
                },
                onCreate: {
                    createNewList()
                }
            )
        }
    }
    
    private var sortedAndFilteredLists: [VocabularyList] {
        var lists = vocabularyLists
        
        // Apply sorting
        switch sortOption {
        case "alphabetical":
            lists.sort { $0.name < $1.name }
        case "dateAdded":
            lists.sort { $0.created > $1.created }
        default: // "recent"
            break // Already sorted by query
        }
        
        return lists
    }
    
    private func createNewList() {
        let newList = VocabularyList(
            name: newListName.isEmpty ? "Vocabulary List" : newListName,
            created: Date()
        )
        modelContext.insert(newList)
        
        showNewListDialog = false
        newListName = ""
        selectedList = newList
    }
}

struct VocabularyListCard: View {
    let list: VocabularyList
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack {
                Image(systemName: "folder")
                    .font(.title2)
                    .foregroundColor(.accentColor)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(list.name)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text("Last updated: \(formatDate(list.created))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text("\(list.words.count) words")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(Color.accentColor.opacity(0.1))
                    .cornerRadius(12)
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.accentColor : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

struct SelectedListWordsView: View {
    let list: VocabularyList
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Words in \"\(list.name)\"")
                    .font(.headline)
                
                Spacer()
                
                Button(action: {}) {
                    Image(systemName: "plus.circle")
                        .foregroundColor(.accentColor)
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal)
            .padding(.top)
            
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(Array(list.words.keys.sorted()), id: \.self) { word in
                        WordItemRow(word: word, data: list.words[word])
                    }
                }
                .padding(.horizontal)
            }
        }
        .background(Color(UIColor.systemBackground))
    }
}

struct WordItemRow: View {
    let word: String
    let data: UserSpecificData?
    
    var body: some View {
        HStack {
            Circle()
                .fill(difficultyColor)
                .frame(width: 8, height: 8)
            
            Text(word)
                .foregroundColor(.primary)
            
            Spacer()
            
            if let data = data {
                Text("Added: \(formatDate(data.dateAdded))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Button(action: {}) {
                Image(systemName: "square.and.pencil")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 12)
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(6)
    }
    
    private var difficultyColor: Color {
        guard let difficulty = data?.difficulty else { return .gray }
        switch difficulty {
        case "easy":
            return .green
        case "hard":
            return .red
        default:
            return .orange
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

struct EmptyListsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "folder.badge.plus")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No vocabulary lists yet")
                .font(.title3)
                .foregroundColor(.primary)
            
            Text("Create your first list to start organizing your vocabulary")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

struct NewListDialog: View {
    @Binding var listName: String
    let onCancel: () -> Void
    let onCreate: () -> Void
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Create New List")
                .font(.headline)
            
            TextField("Enter list name...", text: $listName)
                .textFieldStyle(.roundedBorder)
                .onSubmit {
                    onCreate()
                }
            
            HStack(spacing: 12) {
                Button("Cancel", action: onCancel)
                    .buttonStyle(SecondaryButtonStyle())
                
                Button("Create", action: onCreate)
                    .buttonStyle(PrimaryButtonStyle())
                    .keyboardShortcut(.return)
            }
        }
        .padding()
        .frame(width: 300)
    }
}

// Button Styles
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(
                LinearGradient(
                    colors: [Color.accentColor, Color.accentColor.opacity(0.8)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .foregroundColor(.white)
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color(UIColor.secondarySystemBackground))
            .foregroundColor(.primary)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
    }
}

#Preview {
    ListsView()
        .frame(width: 600, height: 700)
}