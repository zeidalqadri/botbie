#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=== UIX Automated Crawler Workflow ===${NC}"
echo ""
echo -e "${GREEN}📁 Workflow File Location:${NC}"
echo "/Users/zeidalqadri/Desktop/ConsurvBL/cabal/aijentik/packages/@earth-agents/n8n-cli/workflows/uix-automated-crawler.json"
echo ""
echo -e "${YELLOW}📋 Instructions:${NC}"
echo "1. Open N8N UI: http://localhost:5678"
echo "2. Create a new workflow or import from file"
echo "3. Copy the JSON content below if needed"
echo ""
echo -e "${BLUE}--- Workflow JSON Content ---${NC}"
echo ""
cat /Users/zeidalqadri/Desktop/ConsurvBL/cabal/aijentik/packages/@earth-agents/n8n-cli/workflows/uix-automated-crawler.json | jq '.' 2>/dev/null || cat /Users/zeidalqadri/Desktop/ConsurvBL/cabal/aijentik/packages/@earth-agents/n8n-cli/workflows/uix-automated-crawler.json
echo ""
echo -e "${GREEN}✅ Copy the above JSON and paste it into N8N${NC}"