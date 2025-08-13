#!/bin/bash

# GCP Deployment Workaround Script
# Since gcp-expert agent is not available in Claude Code, this script uses backend-architecture agent

echo "🚀 Starting GCP deployment for N8N..."
echo ""
echo "This script will use the backend-architecture agent to help deploy N8N to GCP."
echo ""

# Function to invoke backend-architecture agent with GCP-specific prompt
deploy_with_backend_agent() {
    echo "📋 Using backend-architecture agent for GCP deployment..."
    
    # Create a temporary prompt file
    cat > /tmp/gcp-deploy-prompt.txt << 'EOF'
I need help deploying N8N to Google Cloud Platform (GCP). Please analyze the deployment requirements and provide:

1. GCP service selection (Compute Engine, Cloud Run, or App Engine)
2. Infrastructure setup using Terraform or deployment scripts
3. Networking configuration (VPC, firewall rules)
4. Database setup (Cloud SQL or Firestore)
5. IAM roles and service accounts
6. SSL/TLS configuration
7. Monitoring and logging setup
8. Cost optimization recommendations

The deployment should be production-ready with:
- High availability
- Secure configuration
- Automated deployment process
- Backup and recovery strategy

Project details:
- Application: N8N workflow automation
- Located at: /Users/zeidalqadri/Desktop/ConsurvBL/cabal/aijentik/packages/@earth-agents/n8n-cli
- Existing files: docker-compose.yml, terraform configurations, deployment scripts

Please provide a complete deployment solution.
EOF

    echo ""
    echo "To deploy N8N to GCP using the backend-architecture agent, run:"
    echo ""
    echo "claude task --description 'Deploy N8N to GCP' --subagent-type backend-architecture --prompt '@/tmp/gcp-deploy-prompt.txt'"
    echo ""
    echo "Or use the deployment-engineer agent:"
    echo ""
    echo "claude task --description 'Deploy N8N to GCP' --subagent-type deployment-engineer --prompt '@/tmp/gcp-deploy-prompt.txt'"
}

# Function to use existing deployment scripts
use_existing_scripts() {
    echo "📁 Found existing GCP deployment scripts:"
    echo ""
    
    cd /Users/zeidalqadri/Desktop/ConsurvBL/cabal/aijentik/packages/@earth-agents/n8n-cli
    
    if [ -f "cloud-deployment/deploy-gcp.sh" ]; then
        echo "✅ cloud-deployment/deploy-gcp.sh - Full GCP deployment with Terraform"
    fi
    
    if [ -f "cloud-deployment/deploy-gcp-simple.sh" ]; then
        echo "✅ cloud-deployment/deploy-gcp-simple.sh - Simple GCP deployment"
    fi
    
    if [ -f "terraform/main.tf" ]; then
        echo "✅ terraform/main.tf - Terraform configuration for GCP"
    fi
    
    echo ""
    echo "You can run these scripts directly:"
    echo "  ./cloud-deployment/deploy-gcp.sh"
    echo "  ./cloud-deployment/deploy-gcp-simple.sh"
}

# Main menu
echo "Choose an option:"
echo "1. Use backend-architecture agent for GCP deployment guidance"
echo "2. Use existing GCP deployment scripts"
echo "3. View GCP deployment documentation"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        deploy_with_backend_agent
        ;;
    2)
        use_existing_scripts
        ;;
    3)
        echo "📚 Opening GCP deployment documentation..."
        cat /Users/zeidalqadri/Desktop/ConsurvBL/cabal/aijentik/packages/@earth-agents/n8n-cli/cloud-deployment/gcp-deploy.md 2>/dev/null || echo "Documentation not found"
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "💡 Tip: The gcp-expert specialist has been added to Earth Agents but requires Claude Code integration."
echo "    For now, use backend-architecture or deployment-engineer agents with GCP-specific prompts."