#!/bin/bash

# Build script for VocabDict Safari Extension

echo "🏗️  Building VocabDict Safari Extension..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "Shared (Extension)/Resources/dist"

# Build the extension
echo "🔨 Building JavaScript bundles..."
npm run build:dev

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Next steps:"
    echo "1. Open vocabDict.xcodeproj in Xcode"
    echo "2. Select your development team"
    echo "3. Build and run (⌘R)"
    echo ""
    echo "For detailed instructions, see docs/testing-in-safari.md"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi