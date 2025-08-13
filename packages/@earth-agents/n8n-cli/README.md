# Earth Agents N8N CLI

🚀 **Complete CLI-based automation system for deploying and managing Earth Agents N8N workflows**

## Overview

This CLI system provides comprehensive tools for managing Earth Agents integration with N8N workflows entirely from the command line. It includes Docker containerization, automated deployment, health monitoring, and scriptable workflow management.

## Features

- 🐳 **Docker-based Environment** - Complete containerized setup with N8N, PostgreSQL, Redis
- 🔄 **Automated Deployment** - Full CI/CD pipeline with validation, backup, and rollback
- 📊 **Health Monitoring** - Continuous health checks and alerting
- 🎯 **Workflow Management** - Import, export, activate, and monitor workflows
- 🛠️ **Template System** - Generate workflows from parameterized templates
- 🔧 **CLI Tools** - Python and Bash scripts for all operations
- 📋 **Environment Management** - Support for dev, staging, and production

## Quick Start

### 1. Initial Setup

```bash
# Clone and navigate to the CLI directory
cd packages/@earth-agents/n8n-cli

# Copy environment template
cp .env.example .env

# Edit configuration (add your API keys)
nano .env

# Run complete setup
npm run setup
```

### 2. Deploy Earth Agents Workflows

```bash
# Deploy to development (default)
npm run deploy

# Deploy to production
./scripts/deploy.sh --env production

# Dry run deployment
./scripts/deploy.sh --dry-run --env staging
```

### 3. Manage Workflows

```bash
# Import all workflows
npm run import

# Import specific workflows
./scripts/import-workflows.sh workflow1.json workflow2.json

# Activate all workflows
npm run activate

# Export workflows for backup
npm run export
```

## Architecture

```
┌─────────────────────────────────────────┐
│ Earth Agents N8N CLI System             │
├─────────────────────────────────────────┤
│ Docker Compose Environment              │
│ ├── N8N Application                     │
│ ├── PostgreSQL Database                 │
│ ├── Redis Cache                         │
│ └── CLI Tools Container                 │
├─────────────────────────────────────────┤
│ CLI Scripts & Tools                     │
│ ├── Bash Scripts (setup, deploy, etc.)  │
│ ├── Python CLI (advanced operations)    │
│ ├── Workflow Templates                  │
│ └── Health Monitoring                   │
├─────────────────────────────────────────┤
│ Earth Agents Integration                │
│ ├── Specialist API Wrappers             │
│ ├── Workflow Generators                 │
│ └── Automated Pipelines                 │
└─────────────────────────────────────────┘
```

## Directory Structure

```
n8n-cli/
├── docker-compose.yml          # Docker environment
├── .env.example               # Environment template
├── Dockerfile.cli             # CLI tools container
├── package.json              # NPM scripts
├── scripts/                  # Bash automation scripts
│   ├── setup.sh             # Initial setup
│   ├── deploy.sh            # Deployment automation
│   ├── import-workflows.sh  # Workflow import
│   ├── export-workflows.sh  # Workflow export
│   ├── backup.sh            # Backup system
│   ├── restore.sh           # Restore system
│   ├── health-check.sh      # Health monitoring
│   ├── monitor.sh           # Workflow monitoring
│   └── earth-agents-cli.py  # Python CLI tool
├── workflows/               # Workflow JSON files
├── templates/              # Workflow templates
├── credentials/           # N8N credentials
├── backups/              # System backups
└── logs/                # System logs
```

## CLI Commands

### NPM Scripts

```bash
npm run start      # Start all services
npm run stop       # Stop all services
npm run restart    # Restart services
npm run logs       # View service logs
npm run setup      # Initial environment setup
npm run deploy     # Deploy workflows
npm run backup     # Backup system
npm run restore    # Restore from backup
npm run health     # Health check
npm run import     # Import workflows
npm run export     # Export workflows
npm run activate   # Activate workflows
npm run monitor    # Monitor executions
npm run test       # Test workflows
```

### Bash Scripts

```bash
# Setup and deployment
./scripts/setup.sh                    # Complete environment setup
./scripts/deploy.sh --env production   # Deploy to production
./scripts/deploy.sh --dry-run         # Dry run deployment
./scripts/deploy.sh rollback          # Rollback deployment

# Workflow management
./scripts/import-workflows.sh --all --activate
./scripts/import-workflows.sh workflow1.json workflow2.json
./scripts/export-workflows.sh --all --output=backup.json
./scripts/import-workflows.sh --validate --dry-run --all

# System management
./scripts/backup.sh --full            # Full system backup
./scripts/restore.sh --input=backup.json
./scripts/health-check.sh --detailed  # Detailed health check
./scripts/monitor.sh --follow         # Monitor workflow executions
```

### Python CLI Tool

```bash
# Specialist operations
python scripts/earth-agents-cli.py invoke -s senior-code-reviewer -p "Review this PR"
python scripts/earth-agents-cli.py specialists  # List specialists

# Workflow operations
python scripts/earth-agents-cli.py workflows    # List workflows
python scripts/earth-agents-cli.py execute -w workflow_id -d input.json
python scripts/earth-agents-cli.py activate -w workflow_id

# Template operations
python scripts/earth-agents-cli.py templates    # List templates
python scripts/earth-agents-cli.py generate -t code-review -o workflow.json

# System operations
python scripts/earth-agents-cli.py health       # Health check
python scripts/earth-agents-cli.py backup -o backup.json
python scripts/earth-agents-cli.py logs -f     # Follow logs
```

## Workflow Templates

### Available Templates

1. **Code Review Pipeline** (`code-review-pipeline.template.json`)
2. **Performance Monitoring** (`performance-monitoring.template.json`)
3. **Knowledge Generation** (`knowledge-generation.template.json`)
4. **Design Compliance** (`design-compliance.template.json`)
5. **Security Automation** (`security-automation.template.json`)

### Template Variables

Templates support Jinja2 templating with these variables:

```yaml
# Environment variables
{{ env.GITHUB_TOKEN }}
{{ env.SLACK_WEBHOOK }}
{{ env.NOTION_API_KEY }}

# Configuration
{{ config.n8n_url }}
{{ config.earth_agents_url }}
{{ config.environment }}

# Dynamic values
{{ timestamp }}
{{ deployment_id }}
```

### Generate Workflow from Template

```bash
# Using Python CLI
python scripts/earth-agents-cli.py generate \
  --template code-review-pipeline \
  --output workflows/code-review.json \
  --env-file .env

# Template will be processed with current environment variables
```

## Environment Configuration

### Required Environment Variables

```bash
# N8N Configuration
N8N_HOST=localhost
N8N_PORT=5678
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password

# Database
POSTGRES_USER=n8n
POSTGRES_PASSWORD=secure_db_password
POSTGRES_DB=earth_agents_n8n

# Earth Agents Integration
EARTH_AGENTS_API_URL=http://localhost:8080
EARTH_AGENTS_API_KEY=your_api_key

# External Services
GITHUB_TOKEN=ghp_your_token
SLACK_WEBHOOK=https://hooks.slack.com/services/...
NOTION_API_KEY=secret_your_key
```

### Environment-Specific Deployment

```bash
# Development (default)
./scripts/deploy.sh

# Staging
./scripts/deploy.sh --env staging

# Production (with additional validations)
./scripts/deploy.sh --env production --no-rollback
```

## Monitoring & Health Checks

### Automated Health Monitoring

```bash
# Setup continuous monitoring (runs every 5 minutes)
./scripts/setup.sh  # Includes monitoring setup

# Manual health check
./scripts/health-check.sh

# Detailed health check with metrics
./scripts/health-check.sh --detailed

# Monitor workflow executions
./scripts/monitor.sh --follow
```

### Health Check Metrics

- Container status and resource usage
- N8N API responsiveness
- Database connectivity
- Workflow execution success rates
- Earth Agents API availability
- External service integrations

## Backup & Recovery

### Automated Backups

```bash
# Full system backup
./scripts/backup.sh --full

# Workflows only
./scripts/backup.sh --workflows-only

# Scheduled backup (added to cron during setup)
# Runs daily at 2 AM: 0 2 * * * /path/to/backup.sh --auto
```

### Disaster Recovery

```bash
# Restore from backup
./scripts/restore.sh --input=backup_20250101_120000.tar.gz

# Rollback deployment
./scripts/deploy.sh rollback

# Restore specific workflows
./scripts/import-workflows.sh --input=workflows_backup.json
```

## Troubleshooting

### Common Issues

1. **N8N won't start**
   ```bash
   # Check Docker daemon
   docker info
   
   # Check port conflicts
   lsof -i :5678
   
   # View logs
   npm run logs
   ```

2. **Workflow import fails**
   ```bash
   # Validate workflow
   ./scripts/import-workflows.sh --validate workflow.json
   
   # Check N8N container
   docker exec earth-agents-n8n n8n --version
   ```

3. **Health checks fail**
   ```bash
   # Detailed health check
   ./scripts/health-check.sh --detailed
   
   # Check individual services
   python scripts/earth-agents-cli.py health --service n8n
   ```

### Debug Mode

```bash
# Enable verbose logging
export CLI_LOG_LEVEL=debug

# Run with debug output
./scripts/deploy.sh --dry-run 2>&1 | tee debug.log
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Earth Agents N8N
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Environment
        run: |
          cd packages/@earth-agents/n8n-cli
          cp .env.example .env
          # Update .env with secrets
          
      - name: Deploy to Staging
        run: |
          cd packages/@earth-agents/n8n-cli
          ./scripts/deploy.sh --env staging --no-rollback
          
      - name: Run Tests
        run: |
          cd packages/@earth-agents/n8n-cli
          ./scripts/test-workflows.sh
          
      - name: Deploy to Production
        if: success()
        run: |
          cd packages/@earth-agents/n8n-cli
          ./scripts/deploy.sh --env production
```

## Contributing

1. Add new workflow templates to `templates/`
2. Extend CLI scripts in `scripts/`
3. Add new Python CLI commands in `earth-agents-cli.py`
4. Update documentation and examples
5. Test in development environment before production

## License

MIT License - see LICENSE file for details.

---

**Transform your development workflow with Earth Agents N8N CLI! 🚀**