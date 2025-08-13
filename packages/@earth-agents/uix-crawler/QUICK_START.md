# UIX Crawler Quick Start Guide

## Current Setup Status

All services are now running successfully! The workspace protocol issue has been resolved by switching from `workspace:*` to `file:` protocol.

## Running Services

- **N8N Workflow Engine**: http://localhost:5678
- **UIX Crawler API**: http://localhost:3001
- **Gallery API**: http://localhost:3002

## Quick Commands

### Check Service Status
```bash
./scripts/monitor-dashboard.sh
```

### Manual Crawl
```bash
./scripts/manual-crawl.sh <URL>
# Example: ./scripts/manual-crawl.sh https://stripe.com
```

### View Logs
```bash
./scripts/check-logs.sh
```

### Start Services (if stopped)
```bash
node run-services.js
```

## What Was Fixed

1. **Dependency Protocol**: Changed from `workspace:*` to `file:` protocol in:
   - `@earth-agents/uix-crawler/package.json`
   - `@earth-agents/specialists/package.json`
   - `@earth-agents/workflows/package.json`

2. **Service Startup**: Using `run-services.js` which provides mock APIs for testing the N8N workflow integration.

## N8N Automation

The N8N workflow is configured to:
- Run every 6 hours automatically
- Crawl award-winning design sites
- Extract UI components and design patterns
- Generate code for high-quality designs
- Send notifications via Slack and email

## Next Steps

1. **Import N8N Workflow**: 
   - Go to http://localhost:5678
   - Import `/packages/@earth-agents/n8n-cli/workflows/uix-automated-crawler.json`
   - Configure credentials for Slack/Email notifications

2. **Production Deployment**:
   - Build TypeScript properly: `npm run build`
   - Set up PM2 for process management
   - Configure proper database (PostgreSQL)
   - Set up S3 for image storage

3. **Monitoring**:
   - Check the monitoring dashboard regularly
   - Review logs for any errors
   - Monitor crawl success rates