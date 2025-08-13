#!/bin/bash
echo "Deploying N8N version 1.19.0 (stable)..."
gcloud run deploy earth-agents-n8n \
  --image=n8nio/n8n:1.19.0 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=5678 \
  --memory=2Gi \
  --cpu=2 \
  --update-env-vars="
N8N_BASIC_AUTH_ACTIVE=true,
N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com,
N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626,
N8N_HOST=0.0.0.0,
N8N_PORT=5678,
N8N_PROTOCOL=https,
DATABASE_TYPE=sqlite,
EXECUTIONS_PROCESS=main
"
