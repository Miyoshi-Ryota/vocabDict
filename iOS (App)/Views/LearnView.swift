//
//  LearnView.swift
//  vocabDict (macOS)
//
//  Learning and review session view with flashcards
//

import SwiftUI
import SwiftData

struct LearnView: View {
    @Query private var vocabularyLists: [VocabularyList]
    @State private var isReviewActive = false
    @State private var currentCardIndex = 0
    @State private var showDefinition = false
    @State private var reviewWords: [ReviewWord] = []
    
    var wordsDue: Int {
        // Calculate words due for review
        var dueCount = 0
        for list in vocabularyLists {
            for (_, data) in list.words {
                if data.nextReview <= Date() {
                    dueCount += 1
                }
            }
        }
        return min(dueCount, 4) // Limit to 4 for demo
    }
    
    var body: some View {
        if isReviewActive && !reviewWords.isEmpty {
            ReviewSessionView(
                words: reviewWords,
                currentIndex: $currentCardIndex,
                showDefinition: $showDefinition,
                onComplete: {
                    isReviewActive = false
                    currentCardIndex = 0
                    showDefinition = false
                }
            )
        } else {
            ReadyToLearnView(
                wordsDue: wordsDue,
                onStartReview: startReviewSession
            )
        }
    }
    
    private func startReviewSession() {
        // Prepare review words
        reviewWords = []
        for list in vocabularyLists {
            for (word, data) in list.words {
                if data.nextReview <= Date() && reviewWords.count < 4 {
                    reviewWords.append(ReviewWord(
                        word: word,
                        data: data,
                        definition: "定義がここに表示されます",
                        examples: ["例文1", "例文2"]
                    ))
                }
            }
        }
        
        if reviewWords.isEmpty {
            // Add sample words for demo
            reviewWords = [
                ReviewWord(
                    word: "weed",
                    data: UserSpecificData(word: "weed"),
                    definition: "庭や畑に生える役に立たない植物、雑草",
                    examples: [
                        "Remove the weeds from the garden.",
                        "These weeds are choking out the flowers."
                    ]
                )
            ]
        }
        
        isReviewActive = true
    }
}

struct ReadyToLearnView: View {
    let wordsDue: Int
    let onStartReview: () -> Void
    
    var body: some View {
        VStack(spacing: 30) {
            Spacer()
            
            // Icon
            Image(systemName: "graduationcap.fill")
                .font(.system(size: 80))
                .foregroundColor(.orange)
            
            // Title
            Text("Ready to Learn")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Let's review your vocabulary words")
                .font(.subheadline)
                .foregroundColor(.secondary)
            
            // Words Due Card
            VStack(spacing: 8) {
                Text("\(wordsDue)")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundColor(.accentColor)
                
                Text("WORDS DUE")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
            }
            .frame(width: 180, height: 120)
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.accentColor.opacity(0.3), lineWidth: 1)
            )
            
            // Start Button
            Button(action: onStartReview) {
                HStack {
                    Image(systemName: "rocket.fill")
                    Text("Start Review Session")
                }
                .font(.headline)
                .frame(width: 250)
            }
            .buttonStyle(GradientButtonStyle())
            .disabled(wordsDue == 0)
            
            // Review Tips
            ReviewTipsView()
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
    }
}

struct ReviewSessionView: View {
    let words: [ReviewWord]
    @Binding var currentIndex: Int
    @Binding var showDefinition: Bool
    let onComplete: () -> Void
    
    var currentWord: ReviewWord? {
        guard currentIndex < words.count else { return nil }
        return words[currentIndex]
    }
    
    var body: some View {
        VStack(spacing: 20) {
            // Progress Indicator
            HStack {
                Spacer()
                Text("\(currentIndex + 1)/\(words.count)")
                    .font(.headline)
                    .padding(8)
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(8)
            }
            .padding()
            
            if let word = currentWord {
                if showDefinition {
                    // Definition Card (Back)
                    DefinitionCardView(word: word)
                        .transition(.asymmetric(
                            insertion: .move(edge: .trailing).combined(with: .opacity),
                            removal: .move(edge: .leading).combined(with: .opacity)
                        ))
                } else {
                    // Word Card (Front)
                    WordCardView(word: word)
                        .transition(.asymmetric(
                            insertion: .move(edge: .leading).combined(with: .opacity),
                            removal: .move(edge: .trailing).combined(with: .opacity)
                        ))
                        .onTapGesture {
                            withAnimation(.easeInOut(duration: 0.3)) {
                                showDefinition = true
                            }
                        }
                }
                
                // Action Buttons (only show when definition is visible)
                if showDefinition {
                    HStack(spacing: 12) {
                        ReviewActionButton(
                            icon: "checkmark",
                            label: "Know",
                            number: "1",
                            color: .green,
                            action: { handleReviewAction("know") }
                        )
                        
                        ReviewActionButton(
                            icon: "xmark",
                            label: "Learning",
                            number: "2",
                            color: .red,
                            action: { handleReviewAction("learning") }
                        )
                        
                        ReviewActionButton(
                            icon: "forward.fill",
                            label: "Skip",
                            number: "3",
                            color: .blue,
                            action: { handleReviewAction("skip") }
                        )
                        
                        ReviewActionButton(
                            icon: "star.fill",
                            label: "Mastered",
                            number: "4",
                            color: .orange,
                            action: { handleReviewAction("mastered") }
                        )
                    }
                    .padding(.horizontal)
                }
            }
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.systemBackground))
    }
    
    private func handleReviewAction(_ action: String) {
        // Move to next card
        withAnimation {
            if currentIndex < words.count - 1 {
                currentIndex += 1
                showDefinition = false
            } else {
                onComplete()
            }
        }
    }
}

struct WordCardView: View {
    let word: ReviewWord
    
    var body: some View {
        VStack(spacing: 20) {
            // Card number indicator
            HStack {
                Circle()
                    .fill(Color.accentColor)
                    .frame(width: 40, height: 40)
                    .overlay(
                        Text("1")
                            .font(.headline)
                            .foregroundColor(.white)
                    )
                Spacer()
            }
            
            Spacer()
            
            // Word
            Text(word.word)
                .font(.system(size: 48, weight: .bold))
            
            Text("/\(word.word.lowercased())/")
                .font(.title3)
                .foregroundColor(.secondary)
                .italic()
            
            Spacer()
            
            // Click hint
            HStack {
                Image(systemName: "hand.point.up")
                    .font(.title2)
                    .foregroundColor(.orange)
                
                Text("Click to reveal definition")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(40)
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(20)
        .shadow(radius: 10)
    }
}

struct DefinitionCardView: View {
    let word: ReviewWord
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Word header
                HStack {
                    Text(word.word)
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("/\(word.word.lowercased())/")
                        .font(.title3)
                        .foregroundColor(.secondary)
                        .italic()
                    
                    Spacer()
                }
                
                Divider()
                
                // Definition sections
                VStack(alignment: .leading, spacing: 16) {
                    // Part of speech and definition
                    HStack {
                        Text("名詞")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 2)
                            .background(Color.accentColor.opacity(0.2))
                            .cornerRadius(4)
                            .foregroundColor(.accentColor)
                        
                        Spacer()
                    }
                    
                    Text(word.definition)
                        .font(.title3)
                    
                    // Examples
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(word.examples, id: \.self) { example in
                            Text("• \"\(example)\"")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .italic()
                        }
                    }
                    .padding(.leading)
                }
                
                // Synonyms
                if !word.synonyms.isEmpty {
                    Divider()
                    HStack {
                        Text("Synonyms:")
                            .font(.headline)
                        Text(word.synonyms.joined(separator: ", "))
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(20)
        .shadow(radius: 10)
    }
}

struct ReviewActionButton: View {
    let icon: String
    let label: String
    let number: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title)
                    .foregroundColor(.white)
                
                Text(label)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Text(number)
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.8))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(color)
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
    }
}

struct ReviewTipsView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "lightbulb")
                    .foregroundColor(.orange)
                Text("Review Tips")
                    .font(.headline)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                tipRow("Click the card or press Space to flip")
                tipRow("Use number keys 1-4 for quick actions")
                tipRow("Be honest with your self-assessment for better learning")
                tipRow("Regular practice leads to better retention")
            }
        }
        .padding()
        .frame(maxWidth: 500)
        .background(Color(UIColor.secondarySystemBackground).opacity(0.5))
        .cornerRadius(12)
    }
    
    private func tipRow(_ text: String) -> some View {
        HStack(alignment: .top) {
            Text("•")
                .foregroundColor(.secondary)
            Text(text)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct GradientButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(
                LinearGradient(
                    colors: [Color.accentColor, Color.blue],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .foregroundColor(.white)
            .cornerRadius(25)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

// Data model for review
struct ReviewWord {
    let word: String
    let data: UserSpecificData
    let definition: String
    let examples: [String]
    var synonyms: [String] = []
}

#Preview {
    LearnView()
        .frame(width: 600, height: 700)
}
