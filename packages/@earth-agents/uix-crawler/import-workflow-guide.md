# N8N Workflow Import Guide

Since N8N requires authentication for API access, here's how to import the UIX Automated Crawler workflow manually:

## Steps to Import the Workflow

1. **Open N8N UI**
   - Go to: http://localhost:5678
   - Log in with your credentials

2. **Import the Workflow**
   - Click on "Workflows" in the left sidebar
   - Click the menu button (3 dots) in the top right
   - Select "Import from File" or "Import from URL"
   - Choose the workflow file: `/packages/@earth-agents/n8n-cli/workflows/uix-automated-crawler.json`

3. **Configure the Workflow**
   After importing, you'll need to update these nodes:
   
   - **HTTP Request nodes**: Ensure they point to:
     - Crawler API: `http://localhost:3001`
     - Gallery API: `http://localhost:3002`
   
   - **Credentials** (if using notifications):
     - Slack: Add your Slack webhook URL
     - Email: Configure SMTP settings
     - Google Sheets: Add Google credentials

4. **Activate the Workflow**
   - Click the toggle switch to activate the workflow
   - It will run automatically every 6 hours

## Alternative: Copy and Paste

If file import doesn't work:

1. Open the workflow file in a text editor
2. Copy all the JSON content
3. In N8N, create a new workflow
4. Press Ctrl+A to select all
5. Press Ctrl+V to paste the workflow
6. Save the workflow

## Verify It's Working

1. Check the execution history in N8N
2. Monitor the services dashboard: `./scripts/monitor-dashboard.sh`
3. Check logs: `./scripts/check-logs.sh`

## Workflow File Location
```
/Users/zeidalqadri/Desktop/ConsurvBL/cabal/aijentik/packages/@earth-agents/n8n-cli/workflows/uix-automated-crawler.json
```