# ☁️ GCP Deployment Guide for Earth Agents N8N

## Why Google Cloud Platform?
- **$300 free credit** for new accounts
- **Cloud Run** for serverless deployment
- **Persistent disk** support for workflows
- **Cloud SQL** for PostgreSQL
- **Global load balancing** and SSL
- **Terraform** support for IaC

## 🚀 Deployment Options

### Option 1: Cloud Run (Serverless - Recommended)
Best for: Auto-scaling, pay-per-use, minimal maintenance

### Option 2: GKE (Kubernetes)
Best for: Full control, complex deployments, multi-service

### Option 3: Compute Engine (VM)
Best for: Traditional deployment, full control

---

## 📋 Prerequisites

```bash
# Install Google Cloud SDK
brew install google-cloud-sdk

# Login to GCP
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  compute.googleapis.com \
  containerregistry.googleapis.com
```

---

## 🏃 Option 1: Cloud Run Deployment

### Step 1: Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create earth-agents-n8n-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --network=default \
  --no-assign-ip

# Create database
gcloud sql databases create n8n \
  --instance=earth-agents-n8n-db

# Set password for postgres user
gcloud sql users set-password postgres \
  --instance=earth-agents-n8n-db \
  --password=YOUR_SECURE_PASSWORD
```

### Step 2: Create Dockerfile for Cloud Run

```dockerfile
# Dockerfile.gcp
FROM n8nio/n8n:latest

# Install Cloud SQL Proxy
USER root
RUN wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /cloud_sql_proxy \
  && chmod +x /cloud_sql_proxy

# Install additional dependencies
RUN apk add --no-cache \
    postgresql-client \
    bash \
    curl

# Copy startup script
COPY scripts/gcp-entrypoint.sh /gcp-entrypoint.sh
RUN chmod +x /gcp-entrypoint.sh

# Copy workflows
COPY workflows /home/node/.n8n/workflows

# Set ownership
RUN chown -R node:node /home/node/.n8n

USER node

EXPOSE 8080

ENTRYPOINT ["/gcp-entrypoint.sh"]
```

### Step 3: Create Entrypoint Script

```bash
#!/bin/bash
# scripts/gcp-entrypoint.sh

# Start Cloud SQL Proxy in background
/cloud_sql_proxy -instances=$INSTANCE_CONNECTION_NAME=tcp:5432 &

# Wait for proxy to be ready
sleep 5

# Start n8n
n8n start
```

### Step 4: Build and Push Container

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Build image
docker build -t gcr.io/YOUR_PROJECT_ID/earth-agents-n8n:latest -f Dockerfile.gcp .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/earth-agents-n8n:latest
```

### Step 5: Deploy to Cloud Run

```bash
# Deploy with environment variables
gcloud run deploy earth-agents-n8n \
  --image gcr.io/YOUR_PROJECT_ID/earth-agents-n8n:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars="
DATABASE_TYPE=postgresdb,
DATABASE_POSTGRESDB_HOST=127.0.0.1,
DATABASE_POSTGRESDB_PORT=5432,
DATABASE_POSTGRESDB_DATABASE=n8n,
DATABASE_POSTGRESDB_USER=postgres,
DATABASE_POSTGRESDB_PASSWORD=YOUR_SECURE_PASSWORD,
N8N_HOST=0.0.0.0,
N8N_PORT=8080,
N8N_PROTOCOL=https,
N8N_BASIC_AUTH_ACTIVE=true,
N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com,
N8N_BASIC_AUTH_PASSWORD=Zeyazaya@1626,
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32),
EXECUTIONS_PROCESS=main,
INSTANCE_CONNECTION_NAME=YOUR_PROJECT_ID:us-central1:earth-agents-n8n-db
" \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:earth-agents-n8n-db
```

### Step 6: Get Your URL

```bash
# Get the service URL
gcloud run services describe earth-agents-n8n --region us-central1 --format 'value(status.url)'

# Your URL will be like: https://earth-agents-n8n-xxxxx-uc.a.run.app
```

---

## 🎯 Option 2: GKE Deployment (Full Kubernetes)

### Step 1: Create GKE Cluster

```bash
# Create cluster
gcloud container clusters create earth-agents-cluster \
  --zone us-central1-a \
  --num-nodes 2 \
  --machine-type e2-medium \
  --enable-autorepair \
  --enable-autoupgrade

# Get credentials
gcloud container clusters get-credentials earth-agents-cluster --zone us-central1-a
```

### Step 2: Create Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: earth-agents
---
# k8s/postgresql.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: earth-agents
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14-alpine
        env:
        - name: POSTGRES_DB
          value: n8n
        - name: POSTGRES_USER
          value: n8n
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
---
# k8s/n8n-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n
  namespace: earth-agents
spec:
  replicas: 1
  selector:
    matchLabels:
      app: n8n
  template:
    metadata:
      labels:
        app: n8n
    spec:
      containers:
      - name: n8n
        image: gcr.io/YOUR_PROJECT_ID/earth-agents-n8n:latest
        ports:
        - containerPort: 5678
        env:
        - name: DATABASE_TYPE
          value: postgresdb
        - name: DATABASE_POSTGRESDB_HOST
          value: postgres
        - name: DATABASE_POSTGRESDB_PORT
          value: "5432"
        - name: DATABASE_POSTGRESDB_DATABASE
          value: n8n
        - name: DATABASE_POSTGRESDB_USER
          value: n8n
        - name: DATABASE_POSTGRESDB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: N8N_BASIC_AUTH_ACTIVE
          value: "true"
        - name: N8N_BASIC_AUTH_USER
          value: "zeidalqadri@gmail.com"
        - name: N8N_BASIC_AUTH_PASSWORD
          valueFrom:
            secretKeyRef:
              name: n8n-secret
              key: password
        - name: N8N_ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: n8n-secret
              key: encryption-key
        volumeMounts:
        - name: n8n-data
          mountPath: /home/node/.n8n
      volumes:
      - name: n8n-data
        persistentVolumeClaim:
          claimName: n8n-data-pvc
---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: n8n
  namespace: earth-agents
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 5678
  selector:
    app: n8n
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: n8n
  namespace: earth-agents
  annotations:
    kubernetes.io/ingress.global-static-ip-name: earth-agents-ip
    networking.gke.io/managed-certificates: n8n-cert
spec:
  rules:
  - host: n8n.yourdomain.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: n8n
            port:
              number: 80
```

### Step 3: Deploy to GKE

```bash
# Create secrets
kubectl create secret generic postgres-secret \
  --from-literal=password=YOUR_SECURE_PASSWORD \
  -n earth-agents

kubectl create secret generic n8n-secret \
  --from-literal=password=Zeyazaya@1626 \
  --from-literal=encryption-key=$(openssl rand -base64 32) \
  -n earth-agents

# Apply manifests
kubectl apply -f k8s/

# Get external IP
kubectl get service n8n -n earth-agents
```

---

## 🔧 Option 3: Compute Engine (Simple VM)

### Quick Deployment Script

```bash
# Create VM instance
gcloud compute instances create earth-agents-n8n \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server \
  --metadata-from-file startup-script=scripts/vm-startup.sh

# Create firewall rules
gcloud compute firewall-rules create allow-n8n \
  --allow tcp:5678 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server
```

### VM Startup Script
```bash
#!/bin/bash
# scripts/vm-startup.sh

# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create n8n directory
mkdir -p /opt/earth-agents-n8n
cd /opt/earth-agents-n8n

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - DATABASE_TYPE=postgresdb
      - DATABASE_POSTGRESDB_HOST=postgres
      - DATABASE_POSTGRESDB_PORT=5432
      - DATABASE_POSTGRESDB_DATABASE=n8n
      - DATABASE_POSTGRESDB_USER=n8n
      - DATABASE_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=zeidalqadri@gmail.com
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=0.0.0.0
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${EXTERNAL_IP}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres
    restart: always

volumes:
  postgres_data:
  n8n_data:
EOF

# Set environment variables
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export N8N_PASSWORD="Zeyazaya@1626"
export EXTERNAL_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google")

# Start services
docker-compose up -d
```

---

## 🌐 Domain & SSL Setup

### Option A: Cloud Load Balancer
```bash
# Reserve static IP
gcloud compute addresses create earth-agents-ip --global

# Get the IP
gcloud compute addresses describe earth-agents-ip --global

# Point your domain's A record to this IP
```

### Option B: Cloud DNS
```bash
# Create DNS zone
gcloud dns managed-zones create earth-agents-zone \
  --dns-name="n8n.yourdomain.com." \
  --description="Earth Agents N8N"

# Add A record
gcloud dns record-sets transaction start --zone=earth-agents-zone
gcloud dns record-sets transaction add YOUR_IP \
  --name=n8n.yourdomain.com. \
  --ttl=300 \
  --type=A \
  --zone=earth-agents-zone
gcloud dns record-sets transaction execute --zone=earth-agents-zone
```

---

## 🔐 Security Best Practices

1. **Use Secret Manager**
```bash
# Create secrets
echo -n "Zeyazaya@1626" | gcloud secrets create n8n-password --data-file=-
echo -n "$(openssl rand -base64 32)" | gcloud secrets create n8n-encryption-key --data-file=-

# Grant access
gcloud secrets add-iam-policy-binding n8n-password \
  --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

2. **Enable VPC Service Controls**
3. **Set up Cloud Armor for DDoS protection**
4. **Configure Cloud IAP for additional auth layer**

---

## 💰 Cost Estimation

### Cloud Run:
- **Free tier**: 2M requests/month, 360k GB-seconds
- **Estimated**: $10-20/month for moderate usage

### GKE:
- **Cluster management**: $0.10/hour (~$73/month)
- **Nodes**: ~$50/month for 2x e2-medium
- **Total**: ~$125/month

### Compute Engine:
- **e2-medium**: ~$25/month
- **Storage**: ~$2/month
- **Total**: ~$30/month

---

## 🎯 Next Steps

1. Choose your deployment option
2. Set up monitoring with Cloud Monitoring
3. Configure Cloud Logging
4. Set up automated backups
5. Update GitHub webhooks with your GCP URL

Which deployment option would you like to proceed with?