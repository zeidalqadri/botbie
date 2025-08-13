#!/bin/bash

# Earth Agents N8N CLI Setup Script
# This script initializes the complete Earth Agents N8N environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
ENV_EXAMPLE="$PROJECT_DIR/.env.example"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker first."
    fi
    
    log "✅ Prerequisites check passed"
}

# Create environment file
setup_environment() {
    log "Setting up environment configuration..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        if [[ -f "$ENV_EXAMPLE" ]]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            log "Created .env file from .env.example"
        else
            error ".env.example file not found"
        fi
    else
        warn ".env file already exists, skipping creation"
    fi
    
    # Generate secure passwords if using defaults
    if grep -q "secure_password_change_me\|secure_admin_password" "$ENV_FILE"; then
        warn "Default passwords detected in .env file"
        log "Generating secure passwords..."
        
        # Generate random passwords
        POSTGRES_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        ADMIN_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
        
        # Replace in .env file
        sed -i.bak "s/secure_password_change_me/$POSTGRES_PASS/g" "$ENV_FILE"
        sed -i.bak "s/secure_admin_password/$ADMIN_PASS/g" "$ENV_FILE"
        sed -i.bak "s/your-encryption-key-32-chars-long/$ENCRYPTION_KEY/g" "$ENV_FILE"
        
        log "✅ Generated secure passwords"
        log "🔑 Admin password: $ADMIN_PASS"
        warn "Please save this password securely!"
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    
    local dirs=(
        "$PROJECT_DIR/workflows"
        "$PROJECT_DIR/credentials" 
        "$PROJECT_DIR/backups"
        "$PROJECT_DIR/logs"
        "$PROJECT_DIR/exports"
        "$PROJECT_DIR/templates"
    )
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log "Created directory: $dir"
        fi
    done
}

# Pull Docker images
pull_images() {
    log "Pulling Docker images..."
    
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" pull
    
    log "✅ Docker images pulled successfully"
}

# Start services
start_services() {
    log "Starting Earth Agents N8N services..."
    
    cd "$PROJECT_DIR"
    docker-compose up -d
    
    log "⏳ Waiting for services to be ready..."
    
    # Wait for N8N to be ready
    local max_attempts=60
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:5678/healthz &> /dev/null; then
            log "✅ N8N is ready!"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "N8N failed to start within expected time"
        fi
        
        echo -n "."
        sleep 5
        ((attempt++))
    done
}

# Import Earth Agents workflows
import_workflows() {
    log "Importing Earth Agents workflows..."
    
    if [[ -d "$PROJECT_DIR/workflows" ]] && [[ $(ls -A "$PROJECT_DIR/workflows"/*.json 2>/dev/null | wc -l) -gt 0 ]]; then
        "$SCRIPT_DIR/import-workflows.sh" --all
        log "✅ Workflows imported successfully"
    else
        warn "No workflow files found in workflows/ directory"
        log "You can import workflows later using: ./scripts/import-workflows.sh"
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring cron job
    local cron_job="*/5 * * * * $SCRIPT_DIR/health-check.sh >> $PROJECT_DIR/logs/health.log 2>&1"
    
    # Add to crontab if not already present
    if ! crontab -l 2>/dev/null | grep -q "health-check.sh"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        log "✅ Health check monitoring enabled"
    fi
}

# Display status
show_status() {
    log "Earth Agents N8N Setup Complete! 🎉"
    echo ""
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" ps
    echo ""
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo "  N8N Interface: http://localhost:5678"
    echo "  Username: $(grep N8N_BASIC_AUTH_USER "$ENV_FILE" | cut -d'=' -f2)"
    echo ""
    echo -e "${BLUE}🛠️  Available Commands:${NC}"
    echo "  npm run logs        - View service logs"
    echo "  npm run health      - Check service health"
    echo "  npm run backup      - Backup workflows and data"
    echo "  npm run import      - Import workflows"
    echo "  npm run export      - Export workflows"
    echo "  npm run monitor     - Monitor workflow execution"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo "  - Please update API keys in .env file for external integrations"
    echo "  - Admin password was generated and displayed above"
    echo "  - Backup your .env file securely"
}

# Main execution
main() {
    log "🚀 Starting Earth Agents N8N Setup..."
    
    check_prerequisites
    setup_environment
    create_directories
    pull_images
    start_services
    import_workflows
    setup_monitoring
    show_status
    
    log "✅ Setup completed successfully!"
}

# Handle script interruption
trap 'error "Setup interrupted"' INT TERM

# Run main function
main "$@"