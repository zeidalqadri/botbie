#!/bin/bash
# Import Earth Agents workflows to Cloud N8N

# Your Cloud N8N URL
N8N_URL="https://earth-agents-n8n-665365059532.us-central1.run.app"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Earth Agents Workflow Import Tool${NC}"
echo ""
echo -e "${YELLOW}First, get your API key from N8N:${NC}"
echo "1. Go to: ${N8N_URL}"
echo "2. Login with: zeidalqadri@gmail.com / Zeyazaya@1626"
echo "3. Go to Settings → API"
echo "4. Create new API key"
echo ""
read -p "Enter your N8N API key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo -e "${RED}API key is required!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Importing workflows...${NC}"

# Import each workflow
for workflow in workflows/*.json; do
    if [ -f "$workflow" ]; then
        WORKFLOW_NAME=$(basename "$workflow" .json)
        echo -n "Importing $WORKFLOW_NAME... "
        
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${N8N_URL}/api/v1/workflows" \
            -H "X-N8N-API-KEY: ${API_KEY}" \
            -H "Content-Type: application/json" \
            -d @"$workflow")
        
        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | sed '$d')
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
            echo -e "${GREEN}✓${NC}"
            # Extract workflow ID if available
            WORKFLOW_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
            if [ ! -z "$WORKFLOW_ID" ]; then
                echo "  Workflow ID: $WORKFLOW_ID"
            fi
        else
            echo -e "${RED}✗${NC}"
            echo "  Error: HTTP $HTTP_CODE"
            echo "  Response: $BODY"
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ Import complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Go to ${N8N_URL}/workflows"
echo "2. Activate the workflows you want to use"
echo "3. Configure credentials for external services"
echo "4. Update GitHub webhooks with the new URLs"
echo ""
echo -e "${YELLOW}GitHub Webhook Configuration:${NC}"
echo "1. Go to your GitHub repository → Settings → Webhooks"
echo "2. Add webhook URL: ${N8N_URL}/webhook/ea-code-review"
echo "3. Select 'Pull requests' events"
echo "4. Set content type to 'application/json'"