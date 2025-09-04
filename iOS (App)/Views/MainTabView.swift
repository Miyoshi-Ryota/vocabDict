//
//  MainTabView.swift
//  vocabDict (macOS)
//
//  Main tab navigation view matching the popup.html design
//

import SwiftUI

struct MainTabView: View {
    @Binding var selectedTab: Int
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HeaderView()
                .background(Color(UIColor.secondarySystemBackground))
                .overlay(
                    Rectangle()
                        .frame(height: 1)
                        .foregroundColor(Color.gray.opacity(0.2)),
                    alignment: .bottom
                )
            
            // Tab Bar
            HStack(spacing: 0) {
                TabButton(
                    icon: "magnifyingglass",
                    label: "Search",
                    isSelected: selectedTab == 0,
                    action: { selectedTab = 0 }
                )
                
                TabButton(
                    icon: "books.vertical",
                    label: "Lists",
                    isSelected: selectedTab == 1,
                    action: { selectedTab = 1 }
                )
                
                TabButton(
                    icon: "graduationcap",
                    label: "Learn",
                    isSelected: selectedTab == 2,
                    action: { selectedTab = 2 }
                )
                
                TabButton(
                    icon: "gearshape",
                    label: "Settings",
                    isSelected: selectedTab == 3,
                    action: { selectedTab = 3 }
                )
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
            .background(Color(UIColor.secondarySystemBackground))
            
            // Tab Content
            TabView(selection: $selectedTab) {
                SearchView()
                    .tag(0)
                
                ListsView()
                    .tag(1)
                
                LearnView()
                    .tag(2)
                
                SettingsView()
                    .tag(3)
            }
            .tabViewStyle(.automatic)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Color(UIColor.systemBackground))
    }
}

struct HeaderView: View {
    var body: some View {
        HStack {
            Text("VocabDict")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.accentColor)
            
            Spacer()
            
            Button(action: {
                // Settings action handled by tab
            }) {
                Image(systemName: "gearshape")
                    .font(.system(size: 18))
                    .foregroundColor(.secondary)
            }
            .buttonStyle(.plain)
        }
        .padding()
    }
}

struct TabButton: View {
    let icon: String
    let label: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                
                Text(label)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .foregroundColor(isSelected ? .accentColor : .secondary)
            .overlay(
                Rectangle()
                    .frame(height: 3)
                    .foregroundColor(.accentColor)
                    .opacity(isSelected ? 1 : 0),
                alignment: .bottom
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    MainTabView(selectedTab: .constant(0))
        .frame(width: 600, height: 700)
}
