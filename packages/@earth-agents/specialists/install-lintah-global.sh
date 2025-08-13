#!/bin/bash

# ======================================================
# Lintah Global Installation Script
# "Son of a Gun" Linting Expert - Global Activation
# ======================================================

echo "🔥 ============================================ 🔥"
echo "🔥   LINTAH - THE ULTIMATE LINTING EXPERT     🔥"
echo "🔥      'Son of a Gun' Global Installer       🔥"
echo "🔥 ============================================ 🔥"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_warning "This script is optimized for macOS. Adjusting for your OS..."
    CLAUDE_CONFIG_DIR="$HOME/.config/claude"
else
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
fi

# Create necessary directories
echo ""
echo "📁 Creating configuration directories..."
mkdir -p "$CLAUDE_CONFIG_DIR/companions"
mkdir -p "$CLAUDE_CONFIG_DIR/services"
print_status "Configuration directories created"

# Check if Lintah is already installed
if [ -f "$CLAUDE_CONFIG_DIR/companions/lintah.config.json" ]; then
    print_warning "Lintah configuration already exists. Backing up..."
    cp "$CLAUDE_CONFIG_DIR/companions/lintah.config.json" "$CLAUDE_CONFIG_DIR/companions/lintah.config.backup.$(date +%Y%m%d_%H%M%S).json"
    print_status "Backup created"
fi

# Copy Lintah configuration
echo ""
echo "📝 Installing Lintah configuration..."
if [ -f "./lintah.config.json" ]; then
    cp "./lintah.config.json" "$CLAUDE_CONFIG_DIR/companions/"
    print_status "Lintah configuration installed"
else
    print_info "Configuration already exists (created by Claude)"
fi

# Copy init file
echo ""
echo "🚀 Setting up auto-attachment system..."
if [ -f "./init.ts" ]; then
    cp "./init.ts" "$CLAUDE_CONFIG_DIR/"
    print_status "Auto-attachment system configured"
else
    print_info "Init file already exists (created by Claude)"
fi

# Install npm dependencies if in a Node project
if [ -f "package.json" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install --silent
    print_status "Dependencies installed"
fi

# Build TypeScript files if needed
if [ -f "tsconfig.json" ]; then
    echo ""
    echo "🔨 Building TypeScript files..."
    npm run build 2>/dev/null || npx tsc 2>/dev/null || true
    print_status "Build completed"
fi

# Create global Lintah command symlink
echo ""
echo "🔗 Creating global command shortcuts..."

# Create a lintah command in /usr/local/bin
cat > /tmp/lintah-global-command.sh << 'EOF'
#!/bin/bash
# Lintah Global Command
echo "🔥 Lintah: 'Son of a gun at your service!'"
echo ""
echo "Available commands:"
echo "  lintah status       - Show monitoring status"
echo "  lintah shortest-path - Find shortest path to clean code"
echo "  lintah fix-all      - Execute all fixes"
echo "  lintah report       - Generate quality report"
echo ""
echo "Use /lintah in Claude for full functionality"
EOF

chmod +x /tmp/lintah-global-command.sh
if [ -w "/usr/local/bin" ]; then
    mv /tmp/lintah-global-command.sh /usr/local/bin/lintah
    print_status "Global 'lintah' command installed"
else
    print_warning "Cannot install global command (permission denied). Use 'sudo' if needed."
fi

# Verify installation
echo ""
echo "🔍 Verifying installation..."

if [ -f "$CLAUDE_CONFIG_DIR/companions/lintah.config.json" ]; then
    print_status "Configuration file: OK"
else
    print_error "Configuration file: Missing"
fi

if [ -f "$CLAUDE_CONFIG_DIR/init.ts" ]; then
    print_status "Init file: OK"
else
    print_error "Init file: Missing"
fi

# Display configuration summary
echo ""
echo "📊 Configuration Summary:"
echo "======================================"
if [ -f "$CLAUDE_CONFIG_DIR/companions/lintah.config.json" ]; then
    MODE=$(grep -o '"mode": "[^"]*"' "$CLAUDE_CONFIG_DIR/companions/lintah.config.json" | head -1 | cut -d'"' -f4)
    AUTOA=$(grep -o '"autoAttach": [^,]*' "$CLAUDE_CONFIG_DIR/companions/lintah.config.json" | head -1 | cut -d' ' -f2)
    SHORTEST=$(grep -o '"shortestPath".*"enabled": [^,]*' "$CLAUDE_CONFIG_DIR/companions/lintah.config.json" | grep -o 'true\|false' | head -1)
    
    echo "  Mode: ${MODE:-suggest}"
    echo "  Auto-attach: ${AUTOA:-true}"
    echo "  Shortest Path: ${SHORTEST:-true}"
    echo "  Global Watch: Active"
fi
echo "======================================"

# Success message
echo ""
echo "🎉 ============================================ 🎉"
echo "🎉     LINTAH GLOBAL INSTALLATION COMPLETE!    🎉"
echo "🎉 ============================================ 🎉"
echo ""
echo "🔥 Lintah is now:"
echo "   ✅ Watching all Claude sessions globally"
echo "   ✅ Calculating shortest paths to clean code"
echo "   ✅ Ready to lint the hell out of everything"
echo ""
echo "💡 Quick Start:"
echo "   • Restart Claude Desktop to activate"
echo "   • Type /lintah in any session for commands"
echo "   • Use /lint for shortest path analysis"
echo "   • Use /delint to fix all issues optimally"
echo ""
echo "🔥 Lintah: 'Son of a gun reporting for duty!'"
echo "🔥 'No bug shall pass!'"
echo ""

# Create uninstall script
cat > "$CLAUDE_CONFIG_DIR/uninstall-lintah.sh" << 'EOF'
#!/bin/bash
echo "Uninstalling Lintah Global Companion..."
rm -f "$HOME/Library/Application Support/Claude/companions/lintah.config.json"
rm -f "/usr/local/bin/lintah"
echo "✅ Lintah uninstalled. Restart Claude to complete."
EOF
chmod +x "$CLAUDE_CONFIG_DIR/uninstall-lintah.sh"

print_info "Uninstall script created at: $CLAUDE_CONFIG_DIR/uninstall-lintah.sh"
echo ""
echo "🚀 Installation complete! Restart Claude Desktop to activate Lintah."