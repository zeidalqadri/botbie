#!/bin/bash
# Direct workflow import without API key

N8N_URL="https://earth-agents-n8n-665365059532.us-central1.run.app"
AUTH="zeidalqadri@gmail.com:Zeyazaya@1626"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Direct Workflow Import (using Basic Auth)${NC}"
echo ""

# First, let's check if we can access the API
echo -e "${GREEN}Testing API access...${NC}"
API_TEST=$(curl -s -w "\n%{http_code}" -u "$AUTH" "${N8N_URL}/rest/workflows" 2>/dev/null | tail -1)

if [ "$API_TEST" != "200" ]; then
    echo -e "${RED}Cannot access N8N API. Status: $API_TEST${NC}"
    echo "Trying alternative approach..."
    
    # Try healthcheck endpoint
    HEALTH=$(curl -s -u "$AUTH" "${N8N_URL}/healthz" 2>/dev/null)
    echo "Health check: $HEALTH"
fi

echo ""
echo -e "${YELLOW}Since the UI might have issues, let's use the local N8N instead.${NC}"
echo ""

# Check if local N8N is running
if docker ps | grep -q "n8n-data-n8n-1"; then
    echo -e "${GREEN}✅ Local N8N is running!${NC}"
    echo ""
    echo -e "${BLUE}You can use your local N8N at: http://localhost:5678${NC}"
    echo "Then use ngrok to expose it for webhooks:"
    echo -e "${GREEN}ngrok http 5678${NC}"
else
    echo -e "${YELLOW}Local N8N is not running. Start it with:${NC}"
    echo "docker start n8n-data-n8n-1"
fi

echo ""
echo -e "${BLUE}Alternative: Create a new clean deployment${NC}"
cat > clean-deploy.sh << 'EOF'
#!/bin/bash
# Deploy N8N to a new Cloud Run service
gcloud run deploy n8n-earth-agents-v2 \
  --image=n8nio/n8n:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=5678 \
  --memory=2Gi \
  --set-env-vars="DATABASE_TYPE=sqlite"
EOF
chmod +x clean-deploy.sh

echo ""
echo -e "${YELLOW}Options:${NC}"
echo "1. Use local N8N with ngrok (recommended)"
echo "2. Deploy fresh N8N: ./clean-deploy.sh"
echo "3. Debug cloud deployment issues"