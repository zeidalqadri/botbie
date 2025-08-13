# 🔐 API Keys Configuration Guide

## Required API Keys for Earth Agents Workflows

### **🐙 GitHub Integration**
```bash
GITHUB_TOKEN=ghp_your_github_token
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repository-name
```
**How to get:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token with repo, workflow, and admin:repo_hook scopes
3. Copy the token

### **💬 Slack Integration**
```bash
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
```
**How to get:**
1. Go to https://api.slack.com/apps
2. Create new app → Choose workspace
3. Add Incoming Webhooks and Bot Token Scopes
4. Copy webhook URL and bot token

### **📝 Notion Integration**
```bash
NOTION_API_KEY=secret_your_notion_integration_key
```
**How to get:**
1. Go to https://www.notion.so/my-integrations
2. Create new integration
3. Copy the Internal Integration Token

### **📊 Monitoring & Alerting**
```bash
DATADOG_API_KEY=your_datadog_api_key
PAGERDUTY_API_KEY=your_pagerduty_api_key
```
**DataDog:** Go to Organization Settings → API Keys
**PagerDuty:** Go to Configuration → API Access → Create API Key

### **📚 Confluence Integration**
```bash
CONFLUENCE_API_URL=https://your-domain.atlassian.net
CONFLUENCE_API_TOKEN=your_confluence_api_token
CONFLUENCE_SPACE=TECH
```
**How to get:**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create API token
3. Use your email + API token for basic auth

### **🎯 Jira Integration**
```bash
JIRA_API_URL=https://your-domain.atlassian.net
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=PROJ
```
**Same as Confluence** - Use the same API token

### **🎨 Figma Integration**
```bash
FIGMA_FILE_KEY=your_figma_file_key
FIGMA_ACCESS_TOKEN=your_figma_access_token
```
**How to get:**
1. Go to Figma → Account Settings → Personal access tokens
2. Generate new token
3. File key is in the Figma URL: figma.com/file/[FILE_KEY]/

### **☁️ AWS S3 (for compliance reports)**
```bash
S3_COMPLIANCE_BUCKET=your-compliance-reports-bucket
S3_ACCESS_KEY_ID=your_s3_access_key
S3_SECRET_ACCESS_KEY=your_s3_secret_key
S3_REGION=us-east-1
```
**How to get:**
1. AWS Console → IAM → Users → Create access key
2. Create S3 bucket for compliance reports

### **🔍 Elasticsearch (for logging)**
```bash
ELASTICSEARCH_INDEX=earth-agents-knowledge
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_API_KEY=your_elasticsearch_api_key
```
**Optional** - For advanced logging and search

## 🛠 Quick Setup Commands

```bash
# Copy template and edit
cp .env .env.local
nano .env.local

# Test CLI access after adding N8N API key
python3 scripts/earth-agents-cli.py workflows

# Test health check
python3 scripts/earth-agents-cli.py health
```

## 🚀 Priority Order for Setup

1. **N8N_API_KEY** - Required for CLI access
2. **GITHUB_TOKEN** - For code review workflows
3. **SLACK_WEBHOOK** - For notifications
4. **EARTH_AGENTS_API_KEY** - For specialist integrations
5. **Others** - Based on which workflows you want to activate

## 🔒 Security Note

- Keep your `.env` file secure and never commit it to version control
- Use environment-specific files (`.env.development`, `.env.production`)
- Consider using a secret management service for production