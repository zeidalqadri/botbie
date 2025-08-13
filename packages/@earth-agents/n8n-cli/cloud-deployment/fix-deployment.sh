#!/bin/bash
# Fix N8N Cloud Run deployment issues

set -e

PROJECT_ID="zeidgeistdotcom"
REGION="us-central1"
SERVICE_NAME="earth-agents-n8n"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing Earth Agents N8N Deployment${NC}"

# Update deployment with fixed environment variables
echo -e "${GREEN}Updating Cloud Run service configuration...${NC}"

gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --update-env-vars="
N8N_BASIC_AUTH_ACTIVE=true,
N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com,
N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626,
N8N_HOST=0.0.0.0,
N8N_PORT=5678,
N8N_PROTOCOL=https,
EXECUTIONS_PROCESS=main,
N8N_METRICS=false,
DATABASE_TYPE=sqlite,
DATABASE_SQLITE_DATABASE_FILE=n8n/database.sqlite,
N8N_USER_FOLDER=/home/node/.n8n,
N8N_DISABLE_PRODUCTION_MAIN_PROCESS=true,
VUE_APP_URL_BASE_API=https://earth-agents-n8n-665365059532.us-central1.run.app/,
N8N_EDITOR_BASE_URL=https://earth-agents-n8n-665365059532.us-central1.run.app,
WEBHOOK_URL=https://earth-agents-n8n-665365059532.us-central1.run.app,
N8N_PAYLOAD_SIZE_MAX=16,
N8N_METRICS_PREFIX=n8n_,
NODE_ENV=production,
N8N_LOG_LEVEL=info,
N8N_PERSONALIZATION_ENABLED=false
"

echo ""
echo -e "${GREEN}✅ Configuration updated!${NC}"
echo ""
echo -e "${YELLOW}Waiting for service to redeploy (this may take 1-2 minutes)...${NC}"

# Wait for the service to be ready
sleep 30

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

echo ""
echo -e "${GREEN}Testing N8N accessibility...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -u "zeidalqadri@gmail.com:Zeyazaya@1626" "${SERVICE_URL}/")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ N8N is accessible!${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP Status: $HTTP_STATUS${NC}"
    echo "Checking logs for issues..."
    gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}" --limit=20 --format=json | jq -r '.[] | .textPayload' | grep -E "(error|Error|ERROR)" | head -10 || true
fi

echo ""
echo -e "${BLUE}📋 Try accessing N8N again:${NC}"
echo -e "URL: ${YELLOW}${SERVICE_URL}${NC}"
echo ""
echo -e "${BLUE}If still having issues, try:${NC}"
echo "1. Clear browser cache and cookies"
echo "2. Try incognito/private browsing mode"
echo "3. Use a different browser"
echo ""

# Alternative: Deploy a specific N8N version known to work
echo -e "${YELLOW}If issues persist, we can deploy a specific N8N version.${NC}"
echo -e "Run: ${GREEN}./deploy-specific-version.sh${NC}"

# Create alternative deployment script
cat > deploy-specific-version.sh << 'EOF'
#!/bin/bash
echo "Deploying N8N version 1.19.0 (stable)..."
gcloud run deploy earth-agents-n8n \
  --image=n8nio/n8n:1.19.0 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=5678 \
  --memory=2Gi \
  --cpu=2 \
  --update-env-vars="
N8N_BASIC_AUTH_ACTIVE=true,
N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com,
N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626,
N8N_HOST=0.0.0.0,
N8N_PORT=5678,
N8N_PROTOCOL=https,
DATABASE_TYPE=sqlite,
EXECUTIONS_PROCESS=main
"
EOF
chmod +x deploy-specific-version.sh