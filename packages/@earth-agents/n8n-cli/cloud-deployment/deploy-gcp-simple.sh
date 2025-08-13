#!/bin/bash
# Earth Agents N8N - Simplified GCP Cloud Run Deployment

set -e

# Configuration
PROJECT_ID="zeidgeistdotcom"
REGION="us-central1"
SERVICE_NAME="earth-agents-n8n"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Earth Agents N8N - Simplified GCP Deployment${NC}"
echo -e "${BLUE}Project: ${PROJECT_ID}${NC}"
echo ""

# Set project
echo -e "${GREEN}Setting GCP project...${NC}"
gcloud config set project ${PROJECT_ID}

# Check current user permissions
echo -e "${GREEN}Checking authentication...${NC}"
CURRENT_USER=$(gcloud config get-value account)
echo -e "${BLUE}Authenticated as: ${CURRENT_USER}${NC}"

# Enable required APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  servicenetworking.googleapis.com \
  sqladmin.googleapis.com || echo "Some APIs may already be enabled"

# Check if user has necessary roles
echo -e "${GREEN}Checking IAM permissions...${NC}"
echo "You need these roles:"
echo "- Cloud Run Admin"
echo "- Cloud SQL Admin" 
echo "- Secret Manager Admin"
echo "- Service Usage Admin"

read -p "Do you have these permissions? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Please grant yourself these roles:${NC}"
    echo "gcloud projects add-iam-policy-binding ${PROJECT_ID} \\"
    echo "  --member=\"user:${CURRENT_USER}\" \\"
    echo "  --role=\"roles/run.admin\""
    echo ""
    echo "gcloud projects add-iam-policy-binding ${PROJECT_ID} \\"
    echo "  --member=\"user:${CURRENT_USER}\" \\"
    echo "  --role=\"roles/cloudsql.admin\""
    exit 1
fi

# Option 1: Deploy with SQLite (Simplest)
echo -e "${YELLOW}Deployment Options:${NC}"
echo "1) Cloud Run with SQLite (Simplest, single container)"
echo "2) Cloud Run with Cloud SQL (Requires VPC setup)"
echo ""
read -p "Choose option (1 or 2): " -n 1 -r DEPLOY_OPTION
echo

if [[ $DEPLOY_OPTION == "1" ]]; then
    echo -e "${GREEN}Deploying N8N with SQLite to Cloud Run...${NC}"
    
    # Generate encryption key
    N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    # Create secret for encryption key
    echo -n "${N8N_ENCRYPTION_KEY}" | gcloud secrets create n8n-encryption-key --data-file=- 2>/dev/null || \
      echo -n "${N8N_ENCRYPTION_KEY}" | gcloud secrets versions add n8n-encryption-key --data-file=-
    
    # Deploy to Cloud Run with SQLite
    gcloud run deploy ${SERVICE_NAME} \
      --image=n8nio/n8n:latest \
      --platform=managed \
      --region=${REGION} \
      --allow-unauthenticated \
      --port=5678 \
      --memory=2Gi \
      --cpu=2 \
      --max-instances=10 \
      --update-env-vars="
N8N_BASIC_AUTH_ACTIVE=true,
N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com,
N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626,
N8N_HOST=0.0.0.0,
N8N_PORT=5678,
N8N_PROTOCOL=https,
EXECUTIONS_PROCESS=main,
N8N_METRICS=true,
DATABASE_TYPE=sqlite,
DATABASE_SQLITE_DATABASE_FILE=/home/node/.n8n/database.sqlite,
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
"
    
elif [[ $DEPLOY_OPTION == "2" ]]; then
    echo -e "${GREEN}Setting up Cloud SQL with Private IP...${NC}"
    
    # Create VPC connector for Cloud SQL
    echo -e "${GREEN}Creating VPC connector...${NC}"
    gcloud compute networks vpc-access connectors create n8n-connector \
      --region=${REGION} \
      --subnet=default \
      --subnet-project=${PROJECT_ID} \
      --min-instances=2 \
      --max-instances=10 || echo "Connector may already exist"
    
    # Create Cloud SQL with public IP (simpler)
    echo -e "${GREEN}Creating Cloud SQL instance with public IP...${NC}"
    DB_INSTANCE_NAME="earth-agents-n8n-db-public"
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    gcloud sql instances create ${DB_INSTANCE_NAME} \
      --database-version=POSTGRES_14 \
      --tier=db-f1-micro \
      --region=${REGION} \
      --assign-ip \
      --authorized-networks=0.0.0.0/0 \
      --backup \
      --backup-start-time=02:00 || echo "Instance may already exist"
    
    # Wait for instance to be ready
    echo -e "${GREEN}Waiting for Cloud SQL instance to be ready...${NC}"
    gcloud sql operations wait --project=${PROJECT_ID} \
      $(gcloud sql operations list --instance=${DB_INSTANCE_NAME} --filter='status!=DONE' --format='value(name)' | head -n1) \
      2>/dev/null || echo "Instance ready"
    
    # Create database and set password
    gcloud sql databases create n8n --instance=${DB_INSTANCE_NAME} || echo "Database exists"
    gcloud sql users set-password postgres --instance=${DB_INSTANCE_NAME} --password=${POSTGRES_PASSWORD}
    
    # Get public IP
    DB_PUBLIC_IP=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(ipAddresses[0].ipAddress)")
    
    # Deploy with Cloud SQL
    gcloud run deploy ${SERVICE_NAME} \
      --image=n8nio/n8n:latest \
      --platform=managed \
      --region=${REGION} \
      --allow-unauthenticated \
      --port=5678 \
      --memory=2Gi \
      --cpu=2 \
      --update-env-vars="
DATABASE_TYPE=postgresdb,
DATABASE_POSTGRESDB_HOST=${DB_PUBLIC_IP},
DATABASE_POSTGRESDB_PORT=5432,
DATABASE_POSTGRESDB_DATABASE=n8n,
DATABASE_POSTGRESDB_USER=postgres,
DATABASE_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD},
N8N_BASIC_AUTH_ACTIVE=true,
N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com,
N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626,
N8N_HOST=0.0.0.0,
N8N_PORT=5678,
N8N_PROTOCOL=https,
EXECUTIONS_PROCESS=main
"
fi

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Access Information:${NC}"
echo -e "URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "Username: ${YELLOW}zeidalqadri@gmail.com${NC}"
echo -e "Password: ${YELLOW}Zeyazaya@1626${NC}"
echo ""
echo -e "${BLUE}🔗 Webhook URLs for GitHub:${NC}"
echo -e "Code Review: ${YELLOW}${SERVICE_URL}/webhook/ea-code-review${NC}"
echo -e "Design Compliance: ${YELLOW}${SERVICE_URL}/webhook/ea-design-compliance${NC}"
echo ""

# Create import script
cat > import-workflows.sh << 'EOF'
#!/bin/bash
# Import Earth Agents workflows to Cloud Run N8N

SERVICE_URL="$1"
if [ -z "$SERVICE_URL" ]; then
  echo "Usage: ./import-workflows.sh <n8n-url>"
  exit 1
fi

echo "Importing workflows to $SERVICE_URL"
echo "First, get an API key from N8N settings, then run:"
echo ""
echo "for workflow in workflows/*.json; do"
echo "  curl -X POST $SERVICE_URL/api/v1/workflows \\"
echo "    -H 'X-N8N-API-KEY: your-api-key' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d @\$workflow"
echo "done"
EOF
chmod +x import-workflows.sh

echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Access N8N at the URL above"
echo "2. Go to Settings → API to create an API key"
echo "3. Run: ./import-workflows.sh ${SERVICE_URL}"
echo "4. Update GitHub webhook URLs"
echo ""
echo -e "${GREEN}🎉 Your Earth Agents N8N is now live on GCP!${NC}"

# Save deployment info
cat > deployment-info.json << EOF
{
  "service_url": "${SERVICE_URL}",
  "project_id": "${PROJECT_ID}",
  "region": "${REGION}",
  "service_name": "${SERVICE_NAME}",
  "webhook_urls": {
    "code_review": "${SERVICE_URL}/webhook/ea-code-review",
    "design_compliance": "${SERVICE_URL}/webhook/ea-design-compliance"
  },
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF