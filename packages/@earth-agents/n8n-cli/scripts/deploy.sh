#!/bin/bash

# Earth Agents N8N Deployment Script
# Comprehensive deployment automation for Earth Agents workflows

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WORKFLOWS_DIR="$PROJECT_DIR/workflows"
TEMPLATES_DIR="$PROJECT_DIR/templates"
LOGS_DIR="$PROJECT_DIR/logs"

# Load environment variables
if [[ -f "$PROJECT_DIR/.env" ]]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

# Deployment configuration
DEPLOYMENT_ENV="${EARTH_AGENTS_ENV:-development}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOGS_DIR/deploy.log"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOGS_DIR/deploy.log"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOGS_DIR/deploy.log"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOGS_DIR/deploy.log"
}

# Show help
show_help() {
    cat << EOF
Earth Agents N8N Deployment Tool

USAGE:
    $0 [OPTIONS] [COMMAND]

COMMANDS:
    deploy              Full deployment (default)
    rollback           Rollback to previous version
    status             Show deployment status
    validate           Validate configuration and workflows
    clean              Clean up old deployments

OPTIONS:
    --env ENV           Target environment (development|staging|production)
    --no-backup         Skip backup before deployment
    --no-health-check   Skip health checks after deployment
    --no-rollback       Don't rollback on failure
    --dry-run           Show what would be deployed without executing
    --force             Force deployment even if validations fail
    --help              Show this help message

EXAMPLES:
    $0                                    # Deploy to development
    $0 --env production                   # Deploy to production
    $0 --dry-run --env staging           # Dry run for staging
    $0 rollback                          # Rollback last deployment

EOF
}

# Validate environment and configuration
validate_configuration() {
    log "Validating deployment configuration..."
    
    # Check required directories
    local required_dirs=("$WORKFLOWS_DIR" "$LOGS_DIR")
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log "Created missing directory: $dir"
        fi
    done
    
    # Check Docker environment
    if ! docker ps >/dev/null 2>&1; then
        error "Docker is not running or not accessible"
    fi
    
    # Check N8N container
    if ! docker ps | grep -q "earth-agents-n8n"; then
        error "N8N container is not running. Start with: npm run start"
    fi
    
    # Validate environment-specific configuration
    case "$DEPLOYMENT_ENV" in
        "development")
            info "Deploying to development environment"
            ;;
        "staging")
            info "Deploying to staging environment"
            # Check staging-specific requirements
            if [[ -z "${STAGING_API_URL:-}" ]]; then
                warn "STAGING_API_URL not set, using default"
            fi
            ;;
        "production")
            info "Deploying to production environment"
            # Check production-specific requirements
            if [[ -z "${PROD_API_URL:-}" ]]; then
                error "PROD_API_URL must be set for production deployment"
            fi
            if [[ "${N8N_BASIC_AUTH_ACTIVE:-}" != "true" ]]; then
                error "Basic auth must be enabled for production"
            fi
            ;;
        *)
            error "Unknown environment: $DEPLOYMENT_ENV"
            ;;
    esac
    
    log "✅ Configuration validation passed"
}

# Generate workflows from templates
generate_workflows() {
    log "Generating workflows from templates..."
    
    if [[ ! -d "$TEMPLATES_DIR" ]]; then
        warn "Templates directory not found, skipping template generation"
        return 0
    fi
    
    local template_count=0
    local generated_count=0
    
    # Process each template file
    while IFS= read -r -d '' template_file; do
        ((template_count++))
        local template_name=$(basename "$template_file" .template.json)
        local output_file="$WORKFLOWS_DIR/${template_name}.json"
        
        log "Processing template: $template_name"
        
        # Use Python for advanced template processing
        if python3 "$SCRIPT_DIR/process-template.py" \
            --template "$template_file" \
            --output "$output_file" \
            --env "$DEPLOYMENT_ENV" \
            --config "$PROJECT_DIR/.env"; then
            ((generated_count++))
            log "✅ Generated workflow: $template_name"
        else
            warn "Failed to generate workflow from template: $template_name"
        fi
    done < <(find "$TEMPLATES_DIR" -name "*.template.json" -type f -print0 2>/dev/null)
    
    if [[ $template_count -gt 0 ]]; then
        log "Generated $generated_count/$template_count workflows from templates"
    fi
}

# Validate all workflows
validate_workflows() {
    log "Validating all workflows..."
    
    local workflow_count=0
    local valid_count=0
    local invalid_workflows=()
    
    while IFS= read -r -d '' workflow_file; do
        ((workflow_count++))
        local workflow_name=$(basename "$workflow_file")
        
        # Validate JSON syntax
        if ! jq empty "$workflow_file" 2>/dev/null; then
            invalid_workflows+=("$workflow_name: Invalid JSON")
            continue
        fi
        
        # Validate required fields
        local required_fields=("name" "nodes" "connections")
        local missing_fields=()
        
        for field in "${required_fields[@]}"; do
            if ! jq -e ".$field" "$workflow_file" >/dev/null 2>&1; then
                missing_fields+=("$field")
            fi
        done
        
        if [[ ${#missing_fields[@]} -gt 0 ]]; then
            invalid_workflows+=("$workflow_name: Missing fields: ${missing_fields[*]}")
            continue
        fi
        
        # Validate nodes
        local node_count=$(jq '.nodes | length' "$workflow_file")
        if [[ "$node_count" -eq 0 ]]; then
            invalid_workflows+=("$workflow_name: No nodes defined")
            continue
        fi
        
        # Check for environment-specific configurations
        if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
            # Check for hardcoded localhost URLs
            if jq -r '.nodes[].parameters.url // empty' "$workflow_file" | grep -q "localhost"; then
                invalid_workflows+=("$workflow_name: Contains localhost URLs in production")
                continue
            fi
        fi
        
        ((valid_count++))
    done < <(find "$WORKFLOWS_DIR" -name "*.json" -type f -print0 2>/dev/null)
    
    if [[ ${#invalid_workflows[@]} -gt 0 ]]; then
        error "Found ${#invalid_workflows[@]} invalid workflows:"
        printf '%s\n' "${invalid_workflows[@]}"
        if [[ "${FORCE:-false}" != "true" ]]; then
            error "Fix validation errors or use --force to deploy anyway"
        else
            warn "Continuing deployment despite validation errors (--force used)"
        fi
    fi
    
    log "✅ Validated $valid_count/$workflow_count workflows"
}

# Create deployment backup
create_backup() {
    if [[ "$BACKUP_BEFORE_DEPLOY" != "true" ]]; then
        info "Skipping backup (disabled)"
        return 0
    fi
    
    log "Creating deployment backup..."
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$PROJECT_DIR/backups/deploy_${backup_timestamp}"
    
    mkdir -p "$backup_dir"
    
    # Export current workflows
    "$SCRIPT_DIR/export-workflows.sh" --output "$backup_dir/workflows.json" --all
    
    # Backup environment configuration
    cp "$PROJECT_DIR/.env" "$backup_dir/.env.backup" 2>/dev/null || true
    
    # Create backup metadata
    cat > "$backup_dir/backup.info" << EOF
Backup created: $(date)
Environment: $DEPLOYMENT_ENV
Docker containers: $(docker ps --format "{{.Names}}" | grep earth-agents | tr '\n' ' ')
Git commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git branch: $(git branch --show-current 2>/dev/null || echo "N/A")
EOF
    
    # Store backup path for potential rollback
    echo "$backup_dir" > "$PROJECT_DIR/.last_backup"
    
    log "✅ Backup created: $backup_dir"
}

# Deploy workflows
deploy_workflows() {
    log "Deploying Earth Agents workflows..."
    
    # Import all workflows
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log "DRY RUN: Would import workflows"
        "$SCRIPT_DIR/import-workflows.sh" --dry-run --all --validate
    else
        "$SCRIPT_DIR/import-workflows.sh" --all --validate --activate
    fi
    
    log "✅ Workflows deployed successfully"
}

# Perform health checks
health_check() {
    if [[ "${NO_HEALTH_CHECK:-false}" == "true" ]]; then
        info "Skipping health checks (disabled)"
        return 0
    fi
    
    log "Performing deployment health checks..."
    
    local start_time=$(date +%s)
    local timeout=$HEALTH_CHECK_TIMEOUT
    local healthy=false
    
    while [[ $(($(date +%s) - start_time)) -lt $timeout ]]; do
        # Check N8N API health
        if curl -f -s "http://localhost:5678/healthz" >/dev/null 2>&1; then
            # Check if workflows are loaded
            local workflow_count=$(docker exec earth-agents-n8n n8n list:workflow 2>/dev/null | wc -l || echo "0")
            
            if [[ "$workflow_count" -gt 0 ]]; then
                healthy=true
                break
            fi
        fi
        
        echo -n "."
        sleep 10
    done
    
    if [[ "$healthy" == "true" ]]; then
        log "✅ Health checks passed"
        
        # Run additional checks
        "$SCRIPT_DIR/health-check.sh" --detailed
    else
        error "Health checks failed after ${timeout}s"
    fi
}

# Rollback deployment
rollback_deployment() {
    log "Rolling back deployment..."
    
    local backup_dir
    if [[ -f "$PROJECT_DIR/.last_backup" ]]; then
        backup_dir=$(cat "$PROJECT_DIR/.last_backup")
    else
        error "No backup information found for rollback"
    fi
    
    if [[ ! -d "$backup_dir" ]]; then
        error "Backup directory not found: $backup_dir"
    fi
    
    # Restore workflows
    if [[ -f "$backup_dir/workflows.json" ]]; then
        docker exec earth-agents-n8n n8n import:workflow --input=/tmp/workflows_backup.json
        docker cp "$backup_dir/workflows.json" earth-agents-n8n:/tmp/workflows_backup.json
        log "✅ Workflows restored from backup"
    fi
    
    # Restart services to ensure clean state
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" restart
    
    log "✅ Rollback completed"
}

# Show deployment status
show_status() {
    log "Earth Agents N8N Deployment Status"
    echo ""
    
    # Container status
    echo -e "${BLUE}📊 Container Status:${NC}"
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" ps
    echo ""
    
    # Workflow status
    echo -e "${BLUE}📋 Workflow Status:${NC}"
    if docker exec earth-agents-n8n n8n list:workflow 2>/dev/null; then
        echo ""
    else
        echo "Unable to retrieve workflow status"
    fi
    
    # Environment info
    echo -e "${BLUE}🌍 Environment:${NC}"
    echo "  Environment: $DEPLOYMENT_ENV"
    echo "  N8N URL: http://localhost:${N8N_PORT:-5678}"
    echo "  API URL: ${EARTH_AGENTS_API_URL:-Not set}"
    echo ""
    
    # Recent deployments
    echo -e "${BLUE}📅 Recent Deployments:${NC}"
    ls -la "$PROJECT_DIR/backups/" 2>/dev/null | tail -5 || echo "No backup history found"
}

# Clean up old deployments
clean_deployments() {
    log "Cleaning up old deployments..."
    
    # Remove old backups (keep last 10)
    if [[ -d "$PROJECT_DIR/backups" ]]; then
        local backup_count=$(ls -1 "$PROJECT_DIR/backups" | wc -l)
        if [[ $backup_count -gt 10 ]]; then
            ls -1t "$PROJECT_DIR/backups" | tail -n +11 | xargs -I {} rm -rf "$PROJECT_DIR/backups/{}"
            log "Cleaned up $((backup_count - 10)) old backups"
        fi
    fi
    
    # Clean up old log files (keep last 30 days)
    find "$LOGS_DIR" -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
    
    # Clean up Docker
    docker system prune -f >/dev/null 2>&1 || true
    
    log "✅ Cleanup completed"
}

# Main deployment function
deploy() {
    log "🚀 Starting Earth Agents N8N deployment to $DEPLOYMENT_ENV..."
    
    # Pre-deployment steps
    validate_configuration
    generate_workflows
    validate_workflows
    create_backup
    
    # Deployment
    deploy_workflows
    
    # Post-deployment steps
    health_check
    
    # Success notification
    log "🎉 Deployment completed successfully!"
    
    # Show final status
    show_status
}

# Main execution
main() {
    local command="${1:-deploy}"
    shift || true
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                DEPLOYMENT_ENV="$2"
                shift 2
                ;;
            --no-backup)
                BACKUP_BEFORE_DEPLOY="false"
                shift
                ;;
            --no-health-check)
                NO_HEALTH_CHECK="true"
                shift
                ;;
            --no-rollback)
                ROLLBACK_ON_FAILURE="false"
                shift
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --force)
                FORCE="true"
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                if [[ -z "${command}" ]]; then
                    command="$1"
                    shift
                else
                    error "Unknown option: $1"
                fi
                ;;
        esac
    done
    
    # Create logs directory
    mkdir -p "$LOGS_DIR"
    
    # Execute command
    case "$command" in
        "deploy")
            deploy
            ;;
        "rollback")
            rollback_deployment
            ;;
        "status")
            show_status
            ;;
        "validate")
            validate_configuration
            validate_workflows
            ;;
        "clean")
            clean_deployments
            ;;
        *)
            error "Unknown command: $command. Use --help for available commands."
            ;;
    esac
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Error handling for rollback
handle_error() {
    local exit_code=$?
    error "Deployment failed with exit code: $exit_code"
    
    if [[ "$ROLLBACK_ON_FAILURE" == "true" ]] && [[ -f "$PROJECT_DIR/.last_backup" ]]; then
        warn "Attempting automatic rollback..."
        rollback_deployment
    fi
    
    exit $exit_code
}

trap 'handle_error' ERR

# Run main function
main "$@"