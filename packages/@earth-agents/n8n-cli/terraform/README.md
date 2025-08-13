# 🚀 GCP Terraform Deployment for Earth Agents N8N

## Quick Start

### 1. Prerequisites

```bash
# Install Terraform
brew install terraform

# Install Google Cloud SDK
brew install google-cloud-sdk

# Authenticate
gcloud auth login
gcloud auth application-default login
```

### 2. Configure Variables

```bash
# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Required variables:**
- `project_id`: Your GCP project ID
- `n8n_password`: Your N8N password (default: Zeyazaya@1626)

### 3. Deploy

```bash
# Initialize Terraform
terraform init

# Review plan
terraform plan

# Deploy (choose one):

# Option A: Cloud Run (Recommended)
terraform apply -var="deployment_type=cloud_run"

# Option B: Compute Engine VM
terraform apply -var="deployment_type=compute_engine"

# Option C: GKE (Coming soon)
terraform apply -var="deployment_type=gke"
```

### 4. Get Your URLs

After deployment:

```bash
# Get N8N URL
terraform output service_url

# Get webhook URLs
terraform output webhook_urls
```

## 📝 Post-Deployment Steps

### 1. Access N8N
- URL: From `terraform output service_url`
- Username: `zeidalqadri@gmail.com`
- Password: `Zeyazaya@1626`

### 2. Import Workflows

```bash
# Export from local
./scripts/export-workflows.sh --all --output=workflows.json

# Import via API
curl -X POST $(terraform output -raw service_url)/api/v1/workflows \
  -H "X-N8N-API-KEY: your-api-key" \
  -H "Content-Type: application/json" \
  -d @workflows.json
```

### 3. Update GitHub Webhooks

Use the URLs from `terraform output webhook_urls`:
- Code Review webhook
- Design Compliance webhook

### 4. Configure API Keys

In N8N UI, go to Credentials and add:
- GitHub Personal Access Token
- Slack Webhook URL
- Other service API keys

## 🔧 Customization

### Change Instance Size (Cloud Run)

Edit `main.tf`:
```hcl
resources {
  limits = {
    cpu    = "4"    # Increase CPU
    memory = "4Gi"  # Increase memory
  }
}
```

### Add Custom Domain

```bash
# Reserve static IP
gcloud compute addresses create n8n-ip --global

# Add to terraform.tfvars
custom_domain = "n8n.yourdomain.com"
```

### Enable Monitoring

```hcl
# Add to main.tf
resource "google_monitoring_uptime_check_config" "n8n" {
  display_name = "N8N Health Check"
  timeout      = "10s"
  period       = "60s"
  
  http_check {
    path         = "/healthz"
    port         = "443"
    use_ssl      = true
    validate_ssl = true
  }
  
  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = google_cloud_run_service.n8n[0].status[0].url
    }
  }
}
```

## 🛡️ Security

### 1. Restrict Database Access

```hcl
# In main.tf, modify ip_configuration
ip_configuration {
  ipv4_enabled    = true
  private_network = google_compute_network.vpc.id
  
  # Remove public access
  # authorized_networks {
  #   name  = "allow-all"
  #   value = "0.0.0.0/0"
  # }
}
```

### 2. Add Cloud Armor

```bash
# Create security policy
gcloud compute security-policies create n8n-security-policy \
  --description "N8N Security Policy"

# Add rules
gcloud compute security-policies rules create 1000 \
  --security-policy n8n-security-policy \
  --expression "origin.region_code == 'US'" \
  --action "allow"
```

### 3. Enable VPC Service Controls

```hcl
resource "google_access_context_manager_service_perimeter" "n8n" {
  parent = "accessPolicies/${var.access_policy}"
  name   = "accessPolicies/${var.access_policy}/servicePerimeters/n8n"
  title  = "N8N Service Perimeter"
  
  status {
    restricted_services = [
      "storage.googleapis.com",
      "sqladmin.googleapis.com"
    ]
  }
}
```

## 🔄 Updates & Maintenance

### Update N8N Version

```bash
# Update image in main.tf
image = "n8nio/n8n:1.20.0"  # Specific version

# Apply changes
terraform apply
```

### Backup Workflows

```bash
# Manual backup
gcloud sql export sql earth-agents-n8n-db \
  gs://your-backup-bucket/backup-$(date +%Y%m%d).sql \
  --database=n8n

# Automated backups are configured in Cloud SQL
```

### Scale Up/Down

```bash
# Cloud Run auto-scales, but you can set limits
terraform apply -var="max_instances=20"
```

## 🗑️ Cleanup

```bash
# Destroy all resources
terraform destroy

# Or destroy specific resources
terraform destroy -target=google_cloud_run_service.n8n
```

## 📊 Cost Management

### View current costs:
```bash
# Enable billing export
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT \
  --display-name="N8N Budget" \
  --budget-amount=50 \
  --threshold-rule=percent=80
```

### Optimize costs:
1. Use Cloud Scheduler to stop/start instances
2. Enable Cloud Run min instances = 0
3. Use committed use discounts for Compute Engine

## 🆘 Troubleshooting

### Cloud Run not starting?
```bash
# Check logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Check service status
gcloud run services describe earth-agents-n8n --region=us-central1
```

### Database connection issues?
```bash
# Test connection
gcloud sql connect earth-agents-n8n-db --user=n8n

# Check Cloud SQL Proxy logs
kubectl logs -l app=n8n -c cloudsql-proxy
```

### Workflow execution failures?
1. Check N8N logs in UI
2. Verify API credentials
3. Check execution timeout settings
4. Monitor memory usage

## 📞 Support

- GitHub Issues: [Create issue](https://github.com/earth-agents/n8n-cli/issues)
- Documentation: [Earth Agents Docs](https://docs.earth-agents.com)
- N8N Community: [N8N Forum](https://community.n8n.io)