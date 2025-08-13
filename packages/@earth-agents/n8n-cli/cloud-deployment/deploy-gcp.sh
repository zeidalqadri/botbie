#!/bin/bash
# Earth Agents N8N - GCP Cloud Run Deployment Script

set -e

# Configuration
PROJECT_ID="zeidgeistdotcom"
REGION="us-central1"
SERVICE_NAME="earth-agents-n8n"
DB_INSTANCE_NAME="earth-agents-n8n-db"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Earth Agents N8N - GCP Deployment${NC}"
echo -e "${BLUE}Project: ${PROJECT_ID}${NC}"
echo ""

# Set project
echo -e "${GREEN}Setting GCP project...${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${GREEN}Enabling required APIs...${NC}"
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  compute.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# Generate passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)

echo -e "${GREEN}Creating Cloud SQL PostgreSQL instance...${NC}"
gcloud sql instances create ${DB_INSTANCE_NAME} \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=${REGION} \
  --network=default \
  --no-assign-ip \
  --backup \
  --backup-start-time=02:00 || echo "Instance may already exist"

# Create database
echo -e "${GREEN}Creating database...${NC}"
gcloud sql databases create n8n \
  --instance=${DB_INSTANCE_NAME} || echo "Database may already exist"

# Set password
echo -e "${GREEN}Setting database password...${NC}"
gcloud sql users set-password postgres \
  --instance=${DB_INSTANCE_NAME} \
  --password=${POSTGRES_PASSWORD}

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe ${DB_INSTANCE_NAME} --format="value(connectionName)")
echo -e "${BLUE}Database connection: ${CONNECTION_NAME}${NC}"

# Create secrets
echo -e "${GREEN}Creating secrets in Secret Manager...${NC}"
echo -n "${POSTGRES_PASSWORD}" | gcloud secrets create postgres-password --data-file=- || \
  echo -n "${POSTGRES_PASSWORD}" | gcloud secrets versions add postgres-password --data-file=-

echo -n "Zeyazaya@1626" | gcloud secrets create n8n-password --data-file=- || \
  echo -n "Zeyazaya@1626" | gcloud secrets versions add n8n-password --data-file=-

echo -n "${N8N_ENCRYPTION_KEY}" | gcloud secrets create n8n-encryption-key --data-file=- || \
  echo -n "${N8N_ENCRYPTION_KEY}" | gcloud secrets versions add n8n-encryption-key --data-file=-

# Create service account
echo -e "${GREEN}Creating service account...${NC}"
gcloud iam service-accounts create n8n-service-account \
  --display-name="N8N Service Account" || echo "Service account may already exist"

# Grant permissions
SERVICE_ACCOUNT="n8n-service-account@${PROJECT_ID}.iam.gserviceaccount.com"

for role in \
  "roles/cloudsql.client" \
  "roles/secretmanager.secretAccessor" \
  "roles/logging.logWriter" \
  "roles/monitoring.metricWriter"; do
  gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="${role}"
done

# Deploy to Cloud Run
echo -e "${GREEN}Deploying N8N to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
  --image=n8nio/n8n:latest \
  --platform=managed \
  --region=${REGION} \
  --allow-unauthenticated \
  --port=5678 \
  --memory=2Gi \
  --cpu=2 \
  --service-account=${SERVICE_ACCOUNT} \
  --add-cloudsql-instances=${CONNECTION_NAME} \
  --update-env-vars="
DATABASE_TYPE=postgresdb,
DATABASE_POSTGRESDB_HOST=/cloudsql/${CONNECTION_NAME},
DATABASE_POSTGRESDB_PORT=5432,
DATABASE_POSTGRESDB_DATABASE=n8n,
DATABASE_POSTGRESDB_USER=postgres,
N8N_BASIC_AUTH_ACTIVE=true,
N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com,
N8N_HOST=0.0.0.0,
N8N_PORT=5678,
N8N_PROTOCOL=https,
EXECUTIONS_PROCESS=main,
N8N_METRICS=true,
WEBHOOK_URL=https://${SERVICE_NAME}-${PROJECT_ID}.${REGION}.run.app
" \
  --update-secrets="
DATABASE_POSTGRESDB_PASSWORD=postgres-password:latest,
N8N_BASIC_AUTH_PASSWORD=n8n-password:latest,
N8N_ENCRYPTION_KEY=n8n-encryption-key:latest
"

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Access Information:${NC}"
echo -e "URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "Username: ${YELLOW}zeidalqadri@gmail.com${NC}"
echo -e "Password: ${YELLOW}Zeyazaya@1626${NC}"
echo ""
echo -e "${BLUE}🔗 Webhook URLs:${NC}"
echo -e "Code Review: ${YELLOW}${SERVICE_URL}/webhook/ea-code-review${NC}"
echo -e "Design Compliance: ${YELLOW}${SERVICE_URL}/webhook/ea-design-compliance${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Access N8N at the URL above"
echo "2. Import your workflows"
echo "3. Configure API credentials"
echo "4. Update GitHub webhooks with the new URLs"
echo ""
echo -e "${GREEN}🎉 Your Earth Agents N8N is now live on GCP!${NC}"

# Save deployment info
cat > deployment-info.json << EOF
{
  "service_url": "${SERVICE_URL}",
  "project_id": "${PROJECT_ID}",
  "region": "${REGION}",
  "service_name": "${SERVICE_NAME}",
  "database_instance": "${DB_INSTANCE_NAME}",
  "connection_name": "${CONNECTION_NAME}",
  "webhook_urls": {
    "code_review": "${SERVICE_URL}/webhook/ea-code-review",
    "design_compliance": "${SERVICE_URL}/webhook/ea-design-compliance"
  },
  "deployed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo ""
echo -e "${GREEN}Deployment info saved to deployment-info.json${NC}"