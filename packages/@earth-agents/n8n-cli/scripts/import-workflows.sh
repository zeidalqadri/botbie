#!/bin/bash

# Earth Agents N8N Workflow Import Script
# Imports workflows from JSON files into N8N via CLI

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
WORKFLOWS_DIR="$PROJECT_DIR/workflows"
CONTAINER_NAME="earth-agents-n8n"

# Load environment variables
if [[ -f "$PROJECT_DIR/.env" ]]; then
    set -a
    source "$PROJECT_DIR/.env"
    set +a
fi

# Logging functions
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

# Show help
show_help() {
    cat << EOF
Earth Agents N8N Workflow Import Tool

USAGE:
    $0 [OPTIONS] [WORKFLOW_FILES...]

OPTIONS:
    --all               Import all workflow files from workflows/ directory
    --activate          Activate workflows after import
    --validate          Validate workflow JSON before import
    --overwrite         Overwrite existing workflows with same ID
    --dry-run           Show what would be imported without actually importing
    --help              Show this help message

EXAMPLES:
    $0 --all                                    # Import all workflows
    $0 --activate workflow1.json workflow2.json # Import and activate specific workflows
    $0 --validate --dry-run --all               # Validate all workflows without importing

WORKFLOW FILES:
    Workflow files should be placed in the workflows/ directory and have .json extension.
    Each file should contain a valid N8N workflow export.

EOF
}

# Check if N8N container is running
check_n8n_running() {
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        error "N8N container '$CONTAINER_NAME' is not running. Please start it first with: npm run start"
    fi
}

# Validate workflow JSON
validate_workflow() {
    local workflow_file="$1"
    
    log "Validating workflow: $(basename "$workflow_file")"
    
    # Check if file exists and is readable
    if [[ ! -f "$workflow_file" ]]; then
        error "Workflow file not found: $workflow_file"
    fi
    
    if [[ ! -r "$workflow_file" ]]; then
        error "Cannot read workflow file: $workflow_file"
    fi
    
    # Validate JSON syntax
    if ! jq empty "$workflow_file" 2>/dev/null; then
        error "Invalid JSON in workflow file: $workflow_file"
    fi
    
    # Check required N8N workflow fields
    local required_fields=("name" "nodes" "connections")
    for field in "${required_fields[@]}"; do
        if ! jq -e ".$field" "$workflow_file" >/dev/null 2>&1; then
            error "Missing required field '$field' in workflow: $workflow_file"
        fi
    done
    
    # Validate nodes structure
    local node_count=$(jq '.nodes | length' "$workflow_file")
    if [[ "$node_count" -eq 0 ]]; then
        warn "Workflow has no nodes: $workflow_file"
    fi
    
    log "✅ Workflow validation passed: $(basename "$workflow_file")"
}

# Preprocess workflow before import
preprocess_workflow() {
    local workflow_file="$1"
    local temp_file="/tmp/$(basename "$workflow_file")"
    
    log "Preprocessing workflow: $(basename "$workflow_file")"
    
    # Remove IDs to prevent conflicts (optional based on --overwrite flag)
    if [[ "${OVERWRITE:-false}" != "true" ]]; then
        jq 'del(.id) | walk(if type == "object" and has("id") then del(.id) else . end)' "$workflow_file" > "$temp_file"
    else
        cp "$workflow_file" "$temp_file"
    fi
    
    # Update environment-specific variables
    if [[ -n "${EARTH_AGENTS_API_URL:-}" ]]; then
        jq --arg api_url "$EARTH_AGENTS_API_URL" '
            (.nodes[] | select(.type == "n8n-nodes-base.httpRequest") | .parameters.url) |= 
            if . and (. | contains("earth-agents")) then $api_url else . end
        ' "$temp_file" > "$temp_file.tmp" && mv "$temp_file.tmp" "$temp_file"
    fi
    
    echo "$temp_file"
}

# Import single workflow
import_workflow() {
    local workflow_file="$1"
    local workflow_name=$(basename "$workflow_file" .json)
    
    log "Importing workflow: $workflow_name"
    
    # Validate if requested
    if [[ "${VALIDATE:-false}" == "true" ]]; then
        validate_workflow "$workflow_file"
    fi
    
    # Preprocess workflow
    local processed_file=$(preprocess_workflow "$workflow_file")
    
    # Copy file to container
    docker cp "$processed_file" "$CONTAINER_NAME:/tmp/workflow_import.json"
    
    # Import workflow via N8N CLI
    local import_cmd="n8n import:workflow --input=/tmp/workflow_import.json"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log "DRY RUN: Would execute: $import_cmd"
        log "Workflow content preview:"
        jq '.name, .nodes | length, .connections | keys' "$processed_file"
    else
        if docker exec -u node "$CONTAINER_NAME" $import_cmd; then
            log "✅ Successfully imported: $workflow_name"
            
            # Get workflow ID for activation
            if [[ "${ACTIVATE:-false}" == "true" ]]; then
                activate_workflow_by_name "$workflow_name"
            fi
        else
            error "Failed to import workflow: $workflow_name"
        fi
    fi
    
    # Cleanup
    rm -f "$processed_file"
}

# Activate workflow by name
activate_workflow_by_name() {
    local workflow_name="$1"
    
    log "Activating workflow: $workflow_name"
    
    # Get workflow ID by name (this is a simplified approach)
    # In practice, you might need to query N8N API to get the ID
    local workflow_id=$(docker exec -u node "$CONTAINER_NAME" n8n list:workflow 2>/dev/null | grep "$workflow_name" | awk '{print $1}' || echo "")
    
    if [[ -n "$workflow_id" ]]; then
        if docker exec -u node "$CONTAINER_NAME" n8n update:workflow:active "$workflow_id" --active=true; then
            log "✅ Activated workflow: $workflow_name"
        else
            warn "Failed to activate workflow: $workflow_name"
        fi
    else
        warn "Could not find workflow ID for: $workflow_name"
    fi
}

# Import all workflows from directory
import_all_workflows() {
    log "Importing all workflows from: $WORKFLOWS_DIR"
    
    if [[ ! -d "$WORKFLOWS_DIR" ]]; then
        error "Workflows directory not found: $WORKFLOWS_DIR"
    fi
    
    local workflow_files=()
    while IFS= read -r -d '' file; do
        workflow_files+=("$file")
    done < <(find "$WORKFLOWS_DIR" -name "*.json" -type f -print0 2>/dev/null)
    
    if [[ ${#workflow_files[@]} -eq 0 ]]; then
        warn "No workflow files found in: $WORKFLOWS_DIR"
        return 0
    fi
    
    log "Found ${#workflow_files[@]} workflow file(s)"
    
    local success_count=0
    local failure_count=0
    
    for workflow_file in "${workflow_files[@]}"; do
        if import_workflow "$workflow_file"; then
            ((success_count++))
        else
            ((failure_count++))
        fi
    done
    
    log "Import completed: $success_count successful, $failure_count failed"
}

# List available workflow files
list_workflows() {
    log "Available workflow files in: $WORKFLOWS_DIR"
    
    if [[ ! -d "$WORKFLOWS_DIR" ]]; then
        warn "Workflows directory not found: $WORKFLOWS_DIR"
        return 0
    fi
    
    find "$WORKFLOWS_DIR" -name "*.json" -type f -exec basename {} \; | sort
}

# Main execution
main() {
    local import_all=false
    local activate=false
    local validate=false
    local overwrite=false
    local dry_run=false
    local workflow_files=()
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                import_all=true
                shift
                ;;
            --activate)
                activate=true
                shift
                ;;
            --validate)
                validate=true
                shift
                ;;
            --overwrite)
                overwrite=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            --list)
                list_workflows
                exit 0
                ;;
            *.json)
                if [[ -f "$WORKFLOWS_DIR/$1" ]]; then
                    workflow_files+=("$WORKFLOWS_DIR/$1")
                elif [[ -f "$1" ]]; then
                    workflow_files+=("$1")
                else
                    error "Workflow file not found: $1"
                fi
                shift
                ;;
            *)
                error "Unknown option: $1. Use --help for usage information."
                ;;
        esac
    done
    
    # Export flags for use in functions
    export ACTIVATE="$activate"
    export VALIDATE="$validate"
    export OVERWRITE="$overwrite"
    export DRY_RUN="$dry_run"
    
    # Check prerequisites
    check_n8n_running
    
    # Execute based on options
    if [[ "$import_all" == true ]]; then
        import_all_workflows
    elif [[ ${#workflow_files[@]} -gt 0 ]]; then
        log "Importing ${#workflow_files[@]} specific workflow file(s)"
        for workflow_file in "${workflow_files[@]}"; do
            import_workflow "$workflow_file"
        done
    else
        warn "No workflows specified. Use --all to import all workflows or specify workflow files."
        show_help
        exit 1
    fi
    
    log "✅ Workflow import process completed!"
}

# Handle script interruption
trap 'error "Import interrupted"' INT TERM

# Run main function
main "$@"