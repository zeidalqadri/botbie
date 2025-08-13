# 🔗 Webhook Setup Guide for Earth Agents

## ⚠️ The Localhost Challenge

GitHub (and other external services) cannot reach `http://localhost:5678` because it's on your local machine. You have several options:

## 🚀 Solution Options

### **Option 1: ngrok (Recommended for Testing)**
ngrok creates a secure tunnel to your localhost, making it publicly accessible.

```bash
# Install ngrok
brew install ngrok

# Expose your N8N instance
ngrok http 5678

# You'll get a URL like: https://abc123.ngrok.io
# Use this URL for webhooks: https://abc123.ngrok.io/webhook/ea-code-review
```

### **Option 2: Cloudflare Tunnel (Free & Persistent)**
More stable than ngrok for long-term use.

```bash
# Install cloudflared
brew install cloudflare/cloudflare/cloudflared

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create earth-agents-n8n

# Run tunnel
cloudflared tunnel --url http://localhost:5678 run earth-agents-n8n

# Your URL will be: https://earth-agents-n8n.your-domain.com
```

### **Option 3: Deploy to Cloud (Production)**
Deploy N8N to a cloud service:
- Railway.app (Easy deployment)
- Render.com
- AWS EC2/Lightsail
- DigitalOcean
- Heroku

### **Option 4: Use GitHub Actions (Alternative)**
Instead of webhooks, trigger workflows via GitHub Actions:

```yaml
name: Trigger Earth Agents Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  trigger-review:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger N8N Workflow
        run: |
          curl -X POST http://your-n8n-url/webhook/ea-code-review \
            -H "Content-Type: application/json" \
            -d '${{ toJson(github.event) }}'
```

## 🛠 Quick Setup with ngrok

1. **Install ngrok:**
```bash
brew install ngrok
```

2. **Start ngrok:**
```bash
ngrok http 5678
```

3. **You'll see output like:**
```
Forwarding  https://abc123.ngrok.io -> http://localhost:5678
```

4. **Update GitHub Webhook:**
- Payload URL: `https://abc123.ngrok.io/webhook/ea-code-review`
- Content type: `application/json`
- Select events: "Pull requests"

5. **Update N8N Webhook Node:**
- In N8N, edit the webhook node in your workflow
- Change the webhook path if needed
- Save and activate the workflow

## 🔐 Security Notes

- **ngrok URLs change** each time you restart (unless you have a paid plan)
- **Cloudflare Tunnel** provides persistent URLs
- **Add webhook secret** in production for security
- **Validate payloads** to ensure they're from GitHub

## 📝 Testing Your Webhook

1. **Create a test PR** in your repository
2. **Check ngrok dashboard:** http://localhost:4040
3. **Check N8N executions** for the workflow
4. **Debug any issues** in the N8N execution logs

## 🎯 For Your Current Setup

Since you're at the GitHub webhook configuration screen:

1. **Open a new terminal** and run:
   ```bash
   ngrok http 5678
   ```

2. **Copy the HTTPS URL** from ngrok output

3. **In GitHub webhook form:**
   - Payload URL: `https://[your-ngrok-id].ngrok.io/webhook/ea-code-review`
   - Content type: `application/json`
   - Which events: Select "Let me select individual events"
   - Check: ✅ Pull requests
   - Active: ✅ (leave checked)

4. **Click "Add webhook"**

That's it! Your GitHub webhook will now reach your local N8N instance through ngrok.