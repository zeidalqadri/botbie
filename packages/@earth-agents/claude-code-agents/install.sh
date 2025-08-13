#!/bin/bash

# Earth Agents Claude Code Slash Commands Installation Script
# This script installs Earth Agents workflow-based slash commands into Claude Code

set -e  # Exit on any error

echo "🌍 Earth Agents Claude Code Installation"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Claude Code is installed
print_status "Checking Claude Code installation..."
if ! command -v claude &> /dev/null; then
    print_error "Claude Code CLI not found. Please install Claude Code first."
    exit 1
fi

print_success "Claude Code CLI found: $(which claude)"

# Find Claude Code agents directory
CLAUDE_AGENTS_DIR=""

# Common Claude Code agent directory locations
POSSIBLE_DIRS=(
    "$HOME/.claude/agents"
    "$HOME/.config/claude/agents"
    "$HOME/Library/Application Support/Claude/agents"
    "/usr/local/share/claude/agents"
)

print_status "Looking for Claude Code agents directory..."

for dir in "${POSSIBLE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        CLAUDE_AGENTS_DIR="$dir"
        print_success "Found agents directory: $CLAUDE_AGENTS_DIR"
        break
    fi
done

# If not found, try to create it
if [ -z "$CLAUDE_AGENTS_DIR" ]; then
    print_warning "Agents directory not found. Creating ~/.claude/agents/"
    CLAUDE_AGENTS_DIR="$HOME/.claude/agents"
    mkdir -p "$CLAUDE_AGENTS_DIR"
    print_success "Created agents directory: $CLAUDE_AGENTS_DIR"
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_status "Installing Earth Agents slash commands..."

# Count of installed agents
INSTALLED_COUNT=0

# Install each .md agent file
for agent_file in "$SCRIPT_DIR"/*.md; do
    # Skip README.md
    if [[ "$(basename "$agent_file")" == "README.md" ]]; then
        continue
    fi
    
    if [ -f "$agent_file" ]; then
        agent_name=$(basename "$agent_file")
        
        # Copy the agent file
        cp "$agent_file" "$CLAUDE_AGENTS_DIR/"
        print_success "Installed: /$agent_name"
        ((INSTALLED_COUNT++))
    fi
done

echo ""
print_success "Installation complete! Installed $INSTALLED_COUNT Earth Agents slash commands."

echo ""
echo "🚀 Available Commands:"
echo "===================="
echo "   /performance-optimization  - Comprehensive performance analysis"
echo "   /security-audit            - Enterprise security pipeline"
echo "   /legacy-modernization      - Transform legacy applications"
echo "   /ai-code-review           - Intelligent automated code review"
echo "   /rapid-prototyping        - Quick idea-to-prototype development"
echo "   /ui-design                - Modern UI/UX design with accessibility"
echo "   /backend-architecture     - Scalable backend system architecture"
echo "   /debug-analysis           - Deep debugging and system analysis"

echo ""
echo "💡 Usage:"
echo "========="
echo "1. Open Claude Code"
echo "2. Type '/' followed by the command name"
echo "3. Provide your specific requirements"
echo ""
echo "Example:"
echo "   /performance-optimization"
echo "   \"Optimize my React app - bundle is 2MB and Core Web Vitals are poor\""

echo ""
echo "📚 For more information:"
echo "======================="
echo "   - Read the README.md in this directory"
echo "   - Check the Earth Agents documentation"
echo "   - Visit: https://github.com/your-repo/earth-agents"

echo ""
print_success "Earth Agents slash commands are ready to use! 🌍🤖"

# Check if Claude Code needs to be restarted
print_warning "You may need to restart Claude Code for the new commands to appear."