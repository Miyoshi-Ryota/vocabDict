//
//  SearchView.swift
//  vocabDict (macOS)
//
//  Search tab with word lookup functionality
//

import SwiftUI
import SwiftData

struct SearchView: View {
    @Query(sort: \RecentSearchHistory.searchedAt, order: .reverse) 
    private var recentSearches: [RecentSearchHistory]
    
    @State private var searchText = ""
    @State private var searchResult: WordDefinition?
    @State private var isSearching = false
    @Environment(\.modelContext) private var modelContext
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Search Bar
                SearchBarView(searchText: $searchText, onSearch: performSearch)
                    .padding(.horizontal)
                    .padding(.top)
                
                // Search Result or Recent Searches
                if let result = searchResult {
                    WordDefinitionCard(definition: result)
                        .padding(.horizontal)
                } else {
                    RecentSearchesView(
                        searches: Array(recentSearches.prefix(5)),
                        onSelect: { word in
                            searchText = word
                            performSearch()
                        }
                    )
                    .padding(.horizontal)
                }
                
                Spacer()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
    }
    
    private func performSearch() {
        guard !searchText.isEmpty else { return }
        
        // Add to recent searches
        let search = RecentSearchHistory(word: searchText, searchedAt: Date())
        modelContext.insert(search)
        
        // Mock search result for now
        searchResult = WordDefinition(
            word: searchText,
            pronunciation: "/\(searchText.lowercased())/",
            meanings: [
                WordMeaning(
                    partOfSpeech: "名詞",
                    definition: "定義がここに表示されます",
                    examples: ["例文1", "例文2"]
                )
            ],
            synonyms: []
        )
    }
}

struct SearchBarView: View {
    @Binding var searchText: String
    let onSearch: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("Search for a word...", text: $searchText)
                .textFieldStyle(.plain)
                .onSubmit {
                    onSearch()
                }
            
            if !searchText.isEmpty {
                Button(action: {
                    searchText = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12)
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(8)
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(Color.accentColor.opacity(0.3), lineWidth: 1)
        )
    }
}

struct RecentSearchesView: View {
    let searches: [RecentSearchHistory]
    let onSelect: (String) -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Searches")
                .font(.headline)
                .foregroundColor(.primary)
            
            if searches.isEmpty {
                Text("No recent searches")
                    .foregroundColor(.secondary)
                    .padding(.vertical, 20)
            } else {
                ForEach(searches, id: \.id) { search in
                    Button(action: {
                        onSelect(search.word)
                    }) {
                        HStack {
                            Text(search.word)
                                .foregroundColor(.primary)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 12)
                        .background(Color(UIColor.secondarySystemBackground))
                        .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

struct WordDefinitionCard: View {
    let definition: WordDefinition
    @State private var selectedDifficulty: String?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Word and pronunciation
            VStack(alignment: .leading, spacing: 4) {
                Text(definition.word)
                    .font(.title)
                    .fontWeight(.bold)
                
                Text(definition.pronunciation)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .italic()
            }
            
            Divider()
            
            // Meanings
            ForEach(definition.meanings, id: \.self) { meaning in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(meaning.partOfSpeech)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.accentColor.opacity(0.2))
                            .cornerRadius(4)
                            .foregroundColor(.accentColor)
                        
                        Spacer()
                    }
                    
                    Text(meaning.definition)
                        .foregroundColor(.primary)
                    
                    ForEach(meaning.examples, id: \.self) { example in
                        Text("• \(example)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .italic()
                            .padding(.leading, 8)
                    }
                }
                .padding()
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(8)
            }
            
            // Synonyms
            if !definition.synonyms.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Synonyms:")
                        .font(.caption)
                        .fontWeight(.medium)
                    
                    Text(definition.synonyms.joined(separator: ", "))
                        .foregroundColor(.secondary)
                }
            }
            
            // Difficulty buttons
            HStack(spacing: 12) {
                DifficultyButton(
                    icon: "checkmark",
                    label: "Know",
                    color: .green,
                    isSelected: selectedDifficulty == "know",
                    action: { selectedDifficulty = "know" }
                )
                
                DifficultyButton(
                    icon: "xmark",
                    label: "Learning",
                    color: .red,
                    isSelected: selectedDifficulty == "learning",
                    action: { selectedDifficulty = "learning" }
                )
                
                DifficultyButton(
                    icon: "forward.fill",
                    label: "Skip",
                    color: .blue,
                    action: { selectedDifficulty = "skip" }
                )
                
                DifficultyButton(
                    icon: "star.fill",
                    label: "Mastered",
                    color: .orange,
                    isSelected: selectedDifficulty == "mastered",
                    action: { selectedDifficulty = "mastered" }
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground).opacity(0.5))
        .cornerRadius(12)
    }
}

struct DifficultyButton: View {
    let icon: String
    let label: String
    let color: Color
    var isSelected: Bool = false
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.title2)
                
                Text(label)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isSelected ? color.opacity(0.2) : Color(UIColor.secondarySystemBackground))
            .foregroundColor(isSelected ? color : .secondary)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? color : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
    }
}

// Data Models for Search
struct WordDefinition: Hashable {
    let word: String
    let pronunciation: String
    let meanings: [WordMeaning]
    let synonyms: [String]
}

struct WordMeaning: Hashable {
    let partOfSpeech: String
    let definition: String
    let examples: [String]
}

#Preview {
    SearchView()
        .frame(width: 600, height: 700)
}