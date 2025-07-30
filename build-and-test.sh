#!/bin/bash

echo "🏗️  Building Earth Agents ecosystem..."

# Build core package
echo "📦 Building @earth-agents/core..."
cd packages/@earth-agents/core
npm install
npm run build
cd ../../..

# Build Botbie
echo "🤖 Building @earth-agents/botbie..."
cd packages/@earth-agents/botbie
npm install
npm run build
cd ../../..

# Build CLI
echo "🖥️  Building @earth-agents/cli..."
cd packages/@earth-agents/cli
npm install
npm run build
cd ../../..

# Make CLI executable
chmod +x packages/@earth-agents/cli/dist/index.js
chmod +x packages/@earth-agents/botbie/dist/cli.js

echo "✅ Build complete!"
echo ""
echo "🧪 Testing Botbie on sample project..."
echo ""

# Run Botbie on the sample project
node packages/@earth-agents/botbie/dist/cli.js analyze examples/sample-project

echo ""
echo "🎉 Done! You can now use:"
echo "  - earth analyze    # Run unified CLI"
echo "  - botbie analyze   # Run Botbie directly"