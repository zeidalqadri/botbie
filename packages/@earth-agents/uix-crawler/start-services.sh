#!/bin/bash

# UIX Crawler Services Startup Script
# This script starts both the Crawler API and Gallery API

echo "🚀 Starting UIX Crawler Services..."
echo "=================================="
echo ""

# Change to the crawler directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if ts-node is available globally, if not use npx
if command -v ts-node &> /dev/null; then
    TS_NODE="ts-node"
else
    TS_NODE="npx ts-node"
fi

# Kill any existing processes on our ports
echo "🧹 Cleaning up old processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p logs
mkdir -p uix-database
mkdir -p uix-images
mkdir -p crawl-results

# Start the services
echo "🔧 Starting API services..."
echo ""

# Use the CLI serve command which starts both APIs
$TS_NODE src/cli.ts serve \
    --crawler-port 3001 \
    --gallery-port 3002 \
    --cors "*" \
    --db "file://./uix-database" \
    --images "file://./uix-images" &

# Store the PID
echo $! > .services.pid

# Wait a moment for services to start
sleep 3

# Check if services are running
echo ""
echo "🔍 Checking service status..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Crawler API is running on http://localhost:3001"
else
    echo "❌ Crawler API failed to start"
fi

if curl -s http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Gallery API is running on http://localhost:3002"
else
    echo "❌ Gallery API failed to start"
fi

echo ""
echo "📊 Services started! Monitor with: ./scripts/monitor-dashboard.sh"
echo "🛑 To stop services: ./stop-services.sh"
echo ""
echo "Services running in background. Check logs/crawler.log for details."