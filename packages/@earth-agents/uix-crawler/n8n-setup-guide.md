# N8N Workflow Setup Guide

## Fixed Workflow
I've created a fixed workflow that:
- ✅ Removed Slack notifications
- ✅ Fixed node types and configurations
- ✅ Made external services optional (disabled by default)

## Import the Fixed Workflow

1. **Open N8N**: http://localhost:5678
2. **Import**: Use the fixed workflow at:
   ```
   /packages/@earth-agents/n8n-cli/workflows/uix-automated-crawler-fixed.json
   ```

## Configure Services

### 1. Google Sheets (Optional)
To enable Google Sheets logging:

1. **Create Credentials**:
   - In N8N, go to Credentials → New → Google Sheets OAuth2
   - Follow the OAuth2 setup process
   - Grant access to Google Sheets

2. **Create a Spreadsheet**:
   - Create a new Google Sheet
   - Name the first sheet: "UIX Crawl Results"
   - Add headers: URL, Name, Components Found, Primary Color, Font Families, Accessibility Score, Crawl Date

3. **Configure the Node**:
   - Enable the "Log to Google Sheets" node
   - Add your spreadsheet ID in the node settings
   - Select your credentials

### 2. Email Digest (Optional)
To enable email notifications:

1. **SMTP Credentials**:
   - Go to Credentials → New → Email (SMTP)
   - Add your SMTP settings:
     ```
     Host: smtp.gmail.com (for Gmail)
     Port: 587
     User: your-email@gmail.com
     Password: your-app-password
     ```

2. **Configure the Node**:
   - Enable the "Send Email Digest" node
   - Update the recipient email if needed

### 3. GitHub Integration (Optional)
To enable automatic repository creation:

1. **Create GitHub Token**:
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens
   - Create a token with `repo` scope

2. **Add to N8N**:
   - Go to Credentials → New → GitHub OAuth2
   - Add your token

3. **Configure the Node**:
   - Enable the "Create/Update Repo" node
   - Set environment variables or update node settings:
     - GITHUB_OWNER: your-username
     - GITHUB_REPO: uix-components

## Core Workflow (Always Active)

The workflow will still work without external services:
1. **Crawls websites** every 6 hours
2. **Analyzes UI components** and design patterns
3. **Stores results** in local APIs
4. **Generates insights** about design trends

## Testing the Workflow

1. **Manual Test**:
   - Click "Execute Workflow" button
   - Watch the execution progress
   - Check results in each node

2. **Check Results**:
   ```bash
   # Monitor dashboard
   ./scripts/monitor-dashboard.sh
   
   # Check logs
   ./scripts/check-logs.sh
   ```

## Troubleshooting

### If nodes show errors:
1. **Disabled nodes** are gray - they won't execute
2. **Red nodes** need configuration - add credentials
3. **Orange warnings** are non-critical

### Common fixes:
- **HTTP Request fails**: Check if APIs are running on ports 3001/3002
- **Google Sheets fails**: Re-authenticate or check permissions
- **Email fails**: Check SMTP settings and app passwords

## Next Steps

1. **Enable services** you want to use
2. **Configure credentials** for each service
3. **Activate the workflow** with the toggle switch
4. **Monitor results** in the dashboard

The workflow is designed to work incrementally - start with core functionality and add services as needed!