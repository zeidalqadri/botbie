#!/bin/bash
# Deploy stable N8N version with proper configuration

set -e

PROJECT_ID="zeidgeistdotcom"
REGION="us-central1"
SERVICE_NAME="earth-agents-n8n"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying Stable N8N Version${NC}"

# Deploy N8N with minimal configuration to avoid CSP issues
echo -e "${GREEN}Deploying N8N v1.19.0 (stable version)...${NC}"

gcloud run deploy ${SERVICE_NAME} \
  --image=n8nio/n8n:1.19.0 \
  --region=${REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --port=5678 \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --clear-env-vars \
  --set-env-vars="
N8N_BASIC_AUTH_ACTIVE=true,
N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com,
N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626,
DATABASE_TYPE=sqlite,
N8N_ENCRYPTION_KEY=your-32-char-encryption-key-here"

# Wait for deployment
echo -e "${YELLOW}Waiting for deployment to complete...${NC}"
sleep 30

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

# Test the deployment
echo -e "${GREEN}Testing N8N deployment...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
    echo -e "${GREEN}✅ N8N is running!${NC}"
    
    # Test with basic auth
    AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -u "zeidalqadri@gmail.com:Zeyazaya@1626" "${SERVICE_URL}/")
    if [ "$AUTH_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Authentication is working!${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  HTTP Status: $HTTP_STATUS${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}N8N Access:${NC}"
echo -e "URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "Username: ${YELLOW}zeidalqadri@gmail.com${NC}"
echo -e "Password: ${YELLOW}Zeyazaya@1626${NC}"
echo ""
echo -e "${BLUE}Webhook URLs:${NC}"
echo -e "Code Review: ${YELLOW}${SERVICE_URL}/webhook/ea-code-review${NC}"
echo -e "Design Compliance: ${YELLOW}${SERVICE_URL}/webhook/ea-design-compliance${NC}"
echo ""

# Alternative: Try local Docker first
echo -e "${YELLOW}If Cloud Run continues to have issues, try running locally:${NC}"
cat > run-n8n-local.sh << 'EOF'
#!/bin/bash
# Run N8N locally with ngrok for webhooks
docker run -d \
  --name n8n-local \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com \
  -e N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626 \
  -e DATABASE_TYPE=sqlite \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n:1.19.0

echo "N8N running at http://localhost:5678"
echo "Use ngrok to expose: ngrok http 5678"
EOF
chmod +x run-n8n-local.sh