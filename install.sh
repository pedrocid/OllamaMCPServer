#!/bin/bash

# Ollama MCP Server Installation Script
set -e

echo "🚀 Installing Ollama MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

# Check if Ollama is installed and running
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama is not installed. Please install Ollama first."
    echo "   Visit: https://ollama.ai/"
    echo "   Or use: brew install ollama"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Make executable
chmod +x dist/index.js

echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start Ollama: ollama serve"
echo "2. Pull a model: ollama pull llama3.2"
echo "3. Run the server: npm start"
echo "4. Or use with npx: npx ."
echo ""
echo "🔧 For IDE setup, see SETUP-GUIDE.md"
echo ""

# Test Ollama connection
if command -v curl &> /dev/null; then
    echo "🔍 Testing Ollama connection..."
    if curl -s http://localhost:11434/api/tags &> /dev/null; then
        echo "✅ Ollama is running and accessible"
        
        # List available models
        MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -3)
        if [ -n "$MODELS" ]; then
            echo "📚 Available models:"
            echo "$MODELS" | while read -r model; do
                echo "   - $model"
            done
        else
            echo "⚠️  No models found. Pull a model with: ollama pull llama3.2"
        fi
    else
        echo "⚠️  Ollama is not running. Start it with: ollama serve"
    fi
fi

echo ""
echo "🎉 Ready to use! Run 'npm start' to begin."