# 🚂 Railway Deployment Guide for Earth Agents N8N

## Why Railway?
- **One-click deployment** with GitHub integration
- **Free tier** available ($5 credit/month)
- **Automatic SSL** and custom domains
- **Built-in PostgreSQL** database
- **Environment variables** management
- **Automatic deployments** from GitHub

## 🚀 Quick Deployment Steps

### Step 1: Prepare Your Repository

First, let's create a deployment-ready structure:

```bash
cd /Users/zeidalqadri/Desktop/ConsurvBL/cabal/aijentik/packages/@earth-agents/n8n-cli
```

Create these files for Railway deployment:

### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `Dockerfile.production`
```dockerfile
FROM n8nio/n8n:latest

# Install additional tools
USER root
RUN apk add --no-cache \
    postgresql-client \
    redis \
    curl \
    bash

# Copy workflow files
COPY workflows /home/node/.n8n/workflows
COPY credentials /home/node/.n8n/credentials

# Set permissions
RUN chown -R node:node /home/node/.n8n

USER node

# Environment setup
ENV N8N_BASIC_AUTH_ACTIVE=true \
    N8N_HOST=0.0.0.0 \
    N8N_PORT=5678 \
    N8N_PROTOCOL=https \
    WEBHOOK_URL=https://your-app.railway.app \
    N8N_EDITOR_BASE_URL=https://your-app.railway.app \
    EXECUTIONS_PROCESS=main \
    N8N_HIRING_BANNER_ENABLED=false

EXPOSE 5678

CMD ["n8n", "start"]
```

### `.env.production`
```bash
# Database (Railway provides these automatically)
DATABASE_TYPE=postgresdb
DATABASE_POSTGRESDB_DATABASE=${{PGDATABASE}}
DATABASE_POSTGRESDB_HOST=${{PGHOST}}
DATABASE_POSTGRESDB_PORT=${{PGPORT}}
DATABASE_POSTGRESDB_USER=${{PGUSER}}
DATABASE_POSTGRESDB_PASSWORD=${{PGPASSWORD}}

# N8N Configuration
N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com
N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626
N8N_ENCRYPTION_KEY=n8n-encryption-key-earth-agents-2024

# Earth Agents Configuration
EARTH_AGENTS_API_URL=https://your-earth-agents-api.com
EARTH_AGENTS_API_KEY=your-production-api-key

# External Services
GITHUB_TOKEN=ghp_your_github_token
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
# Add other API keys as needed
```

## 📦 Step 2: Deploy to Railway

### Option A: Via Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize new project
railway init

# Link to GitHub repo
railway link

# Deploy
railway up
```

### Option B: Via Railway Dashboard
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will auto-detect and deploy

## 🔧 Step 3: Configure Railway

### Add PostgreSQL Database:
```bash
# In Railway dashboard or CLI
railway add postgresql

# This automatically sets database environment variables
```

### Set Environment Variables:
```bash
# Via CLI
railway variables set N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com
railway variables set N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626
railway variables set N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)
railway variables set GITHUB_TOKEN=ghp_your_token
railway variables set SLACK_WEBHOOK=https://hooks.slack.com/your/webhook
```

### Get Your Railway URL:
```bash
# Your app will be available at:
https://earth-agents-n8n.up.railway.app

# Or set custom domain:
railway domain
```

## 🌐 Step 4: Update Webhook URLs

Once deployed, your permanent webhook URLs will be:
- **Code Review:** `https://earth-agents-n8n.up.railway.app/webhook/ea-code-review`
- **Design Compliance:** `https://earth-agents-n8n.up.railway.app/webhook/ea-design-compliance`

## 📊 Step 5: Import Workflows

After deployment, import your workflows:

```bash
# Export from local
docker exec n8n-data-n8n-1 n8n export:workflow --all --output=/tmp/all-workflows.json
docker cp n8n-data-n8n-1:/tmp/all-workflows.json ./all-workflows.json

# Import to Railway (via N8N UI or API)
curl -X POST https://earth-agents-n8n.up.railway.app/api/v1/workflows \
  -H "X-N8N-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d @all-workflows.json
```

## 🔒 Security Checklist

- [ ] Set strong N8N_ENCRYPTION_KEY
- [ ] Use environment variables for all secrets
- [ ] Enable 2FA on Railway account
- [ ] Set up webhook secrets
- [ ] Configure CORS if needed
- [ ] Set up SSL (automatic on Railway)

## 💰 Cost Estimation

Railway Free Tier:
- $5 credit/month
- ~500 hours of runtime
- Sufficient for testing

Railway Paid:
- $20/month includes $20 usage
- Pay-as-you-go after that
- ~$5-10/month for N8N with moderate usage

## 🎯 Next Steps

1. Complete Railway deployment
2. Update GitHub webhooks with Railway URLs
3. Test all workflows
4. Set up monitoring
5. Configure backups

Would you like me to create the deployment files now?