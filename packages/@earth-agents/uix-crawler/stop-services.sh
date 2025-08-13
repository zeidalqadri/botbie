#!/bin/bash

# Stop UIX Crawler Services

echo "🛑 Stopping UIX Crawler Services..."

# Check if PID file exists
if [ -f .services.pid ]; then
    PID=$(cat .services.pid)
    if ps -p $PID > /dev/null; then
        kill $PID
        echo "✅ Stopped process $PID"
    else
        echo "⚠️  Process $PID not found"
    fi
    rm .services.pid
else
    echo "⚠️  No PID file found"
fi

# Also kill any processes on our ports
echo "🧹 Cleaning up ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

echo "✅ Services stopped"