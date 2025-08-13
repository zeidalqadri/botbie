#!/bin/bash
# Earth Agents N8N - Direct GCP Deployment (SQLite version for simplicity)

set -e

# Configuration
PROJECT_ID="zeidgeistdotcom"
REGION="us-central1"
SERVICE_NAME="earth-agents-n8n"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying Earth Agents N8N to GCP Cloud Run${NC}"
echo -e "${BLUE}Project: ${PROJECT_ID}${NC}"
echo ""

# Set project
gcloud config set project ${PROJECT_ID}

# Enable APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable run.googleapis.com secretmanager.googleapis.com

# Generate encryption key
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Create or update secret
echo -e "${GREEN}Creating encryption key secret...${NC}"
if gcloud secrets describe n8n-encryption-key --project=${PROJECT_ID} >/dev/null 2>&1; then
    echo -n "${N8N_ENCRYPTION_KEY}" | gcloud secrets versions add n8n-encryption-key --data-file=-
else
    echo -n "${N8N_ENCRYPTION_KEY}" | gcloud secrets create n8n-encryption-key --data-file=-
fi

# Deploy to Cloud Run with SQLite (simplest approach)
echo -e "${GREEN}Deploying N8N to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image=n8nio/n8n:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --port=5678 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --min-instances=0 \
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
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY},
WEBHOOK_URL=https://${SERVICE_NAME}-${PROJECT_ID}.${REGION}.run.app,
N8N_EDITOR_BASE_URL=https://${SERVICE_NAME}-${PROJECT_ID}.${REGION}.run.app
"

# Get service URL
echo -e "${GREEN}Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 N8N Access Information:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "Username: ${YELLOW}zeidalqadri@gmail.com${NC}"
echo -e "Password: ${YELLOW}Zeyazaya@1626${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔗 GitHub Webhook URLs:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "Code Review: ${YELLOW}${SERVICE_URL}/webhook/ea-code-review${NC}"
echo -e "Design Compliance: ${YELLOW}${SERVICE_URL}/webhook/ea-design-compliance${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📝 Next Steps:${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo "1. Open N8N: ${SERVICE_URL}"
echo "2. Login with your credentials"
echo "3. Go to Settings → API → Create API Key"
echo "4. Import workflows using the API key"
echo "5. Update GitHub webhooks with the URLs above"
echo ""

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
  "credentials": {
    "username": "zeidalqadri@gmail.com",
    "password": "Zeyazaya@1626"
  },
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo -e "${GREEN}Deployment info saved to: deployment-info.json${NC}"
echo ""
echo -e "${GREEN}🎉 Your Earth Agents N8N is now live on Google Cloud!${NC}"