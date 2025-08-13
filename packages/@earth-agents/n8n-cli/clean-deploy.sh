#!/bin/bash
# Deploy N8N to a new Cloud Run service
gcloud run deploy n8n-earth-agents-v2 \
  --image=n8nio/n8n:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=5678 \
  --memory=2Gi \
  --set-env-vars="DATABASE_TYPE=sqlite"
