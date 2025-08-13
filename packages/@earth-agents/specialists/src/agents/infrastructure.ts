import { SpecialistDefinition } from '../types';
import { specialistRegistry } from '../SpecialistAgentAdapter';

// Infrastructure & Operations Specialists

export const devopsTroubleshooter: SpecialistDefinition = {
  name: 'devops-troubleshooter',
  description: 'Diagnose production issues and resolve infrastructure problems',
  category: 'infrastructure',
  focusAreas: [
    'Log analysis',
    'Performance debugging',
    'Network troubleshooting',
    'Container debugging',
    'Resource optimization',
    'Incident response',
    'Root cause analysis'
  ],
  approach: [
    'Gather evidence systematically',
    'Check recent changes',
    'Analyze logs and metrics',
    'Test hypotheses',
    'Document findings'
  ],
  outputs: [
    'Root cause analysis',
    'Resolution steps',
    'Preventive measures',
    'Monitoring improvements',
    'Incident reports'
  ],
  keyPrinciple: 'Assume nothing, verify everything'
};

export const deploymentEngineer: SpecialistDefinition = {
  name: 'deployment-engineer',
  description: 'Configure CI/CD pipelines and manage cloud deployments',
  category: 'infrastructure',
  focusAreas: [
    'CI/CD pipelines',
    'Container orchestration',
    'Blue-green deployments',
    'Infrastructure as Code',
    'Release management',
    'Rollback strategies',
    'Environment management'
  ],
  approach: [
    'Automate everything',
    'Version all artifacts',
    'Test deployments',
    'Plan for rollbacks',
    'Monitor deployments'
  ],
  outputs: [
    'Pipeline configurations',
    'Deployment scripts',
    'IaC templates',
    'Release procedures',
    'Rollback plans'
  ]
};

export const siteReliabilityEngineer: SpecialistDefinition = {
  name: 'site-reliability-engineer',
  description: 'Ensure system reliability, availability, and performance',
  category: 'infrastructure',
  focusAreas: [
    'SLI/SLO definition',
    'Error budgets',
    'Monitoring setup',
    'Alerting strategies',
    'Capacity planning',
    'Chaos engineering',
    'Post-mortem analysis'
  ],
  approach: [
    'Define clear SLOs',
    'Monitor proactively',
    'Automate responses',
    'Practice chaos engineering',
    'Learn from incidents'
  ],
  outputs: [
    'SLI/SLO definitions',
    'Monitoring dashboards',
    'Alert configurations',
    'Runbooks',
    'Capacity plans'
  ]
};

export const kubernetesExpert: SpecialistDefinition = {
  name: 'kubernetes-expert',
  description: 'Expert in Kubernetes 1.29+ with deep knowledge of Gateway API v1.1, sidecar containers, service mesh integration, and cloud-native patterns. Specializes in production-grade cluster architecture, GitOps, and advanced workload orchestration.',
  category: 'infrastructure',
  focusAreas: [
    'Kubernetes 1.29+ with native sidecar containers',
    'Gateway API v1.1 with GRPCRoute and service mesh',
    'In-place Pod resource updates and lifecycle management',
    'CEL (Common Expression Language) for admission control',
    'Service mesh integration (Istio, Linkerd, Cilium)',
    'GitOps with ArgoCD and Flux v2',
    'Multi-cluster management with Cluster API',
    'eBPF-based networking with Cilium',
    'Kubernetes Operators and CRD development',
    'StatefulSet and DaemonSet optimization',
    'HPA, VPA, and Cluster Autoscaling',
    'Security policies with OPA and Pod Security Standards',
    'Observability with OpenTelemetry and Prometheus',
    'Edge deployments with k3s and MicroK8s'
  ],
  approaches: [
    'Design clusters with Gateway API v1.1 for advanced routing',
    'Implement native sidecar containers for proxy and logging',
    'Use CEL for sophisticated admission control policies',
    'Apply GitOps principles for declarative management',
    'Leverage service mesh for zero-trust networking',
    'Implement progressive delivery with Flagger',
    'Use Cluster API for consistent multi-cloud deployments',
    'Monitor with Prometheus and distributed tracing',
    'Secure with Pod Security Standards and OPA policies',
    'Optimize costs with proper resource requests and limits'
  ],
  outputs: [
    'Gateway API v1.1 configurations with advanced routing',
    'Sidecar container patterns and implementations',
    'Multi-cluster GitOps architectures',
    'CEL-based admission policies',
    'Service mesh configurations',
    'Helm charts with best practices',
    'Operator implementations with Kubebuilder',
    'RBAC and security policies',
    'Observability stack deployments',
    'Cost optimization reports'
  ],
  subagentType: 'kubernetes-expert',
  keyPrinciple: 'Build resilient, secure, and scalable Kubernetes platforms leveraging the latest features like Gateway API v1.1, native sidecars, and modern cloud-native patterns for production excellence',
  examples: [
    {
      input: 'Implement a modern microservices platform using Kubernetes 1.29 with Gateway API and sidecar containers',
      output: `## Modern Kubernetes Platform with Gateway API v1.1 & Sidecars

### 1. Gateway API v1.1 Configuration

\`\`\`yaml
# Gateway Class
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: modern-gateway
spec:
  controllerName: io.cilium/gateway-controller
  parametersRef:
    group: gateway.networking.k8s.io
    kind: GatewayClassConfig
    name: cilium-config

---
# Gateway with TLS
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: api-gateway
  namespace: production
spec:
  gatewayClassName: modern-gateway
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    tls:
      mode: Terminate
      certificateRefs:
      - name: api-cert
        namespace: production
    allowedRoutes:
      namespaces:
        from: Selector
        selector:
          matchLabels:
            gateway-access: "true"
  - name: grpc
    protocol: GRPC
    port: 9090
    allowedRoutes:
      namespaces:
        from: All

---
# HTTPRoute with advanced routing
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-routes
  namespace: production
spec:
  parentRefs:
  - name: api-gateway
    sectionName: https
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/v2
      headers:
      - name: X-API-Version
        value: "2.0"
    filters:
    - type: RequestHeaderModifier
      requestHeaderModifier:
        add:
        - name: X-Gateway-Route
          value: v2-api
    - type: RequestMirror
      requestMirror:
        backendRef:
          name: analytics-service
          port: 8080
    backendRefs:
    - name: api-v2
      port: 8080
      weight: 90
    - name: api-v2-canary
      port: 8080
      weight: 10
  
  # Session persistence (v1.1 feature)
  - matches:
    - path:
        type: PathPrefix
        value: /app
    backendRefs:
    - name: webapp
      port: 3000
    sessionPersistence:
      sessionName: webapp-session
      type: Cookie
      cookieLifetime: 3600s

---
# GRPCRoute (GA in v1.1)
apiVersion: gateway.networking.k8s.io/v1
kind: GRPCRoute
metadata:
  name: grpc-services
  namespace: production
spec:
  parentRefs:
  - name: api-gateway
    sectionName: grpc
  rules:
  - matches:
    - method:
        service: UserService
        method: GetUser
    backendRefs:
    - name: user-service
      port: 9090
  - matches:
    - method:
        service: OrderService
    backendRefs:
    - name: order-service
      port: 9090
\`\`\`

### 2. Native Sidecar Containers (K8s 1.29+)

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      # Native sidecar containers
      initContainers:
      # Envoy proxy sidecar
      - name: envoy-proxy
        image: envoyproxy/envoy:v1.28
        restartPolicy: Always  # This makes it a sidecar
        ports:
        - containerPort: 9901
          name: admin
        - containerPort: 8080
          name: proxy
        volumeMounts:
        - name: envoy-config
          mountPath: /etc/envoy
        livenessProbe:
          httpGet:
            path: /ready
            port: admin
          initialDelaySeconds: 10
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
      
      # Fluent Bit log collector sidecar
      - name: fluent-bit
        image: fluent/fluent-bit:2.2
        restartPolicy: Always
        volumeMounts:
        - name: app-logs
          mountPath: /var/log/app
        - name: fluent-bit-config
          mountPath: /fluent-bit/etc
        resources:
          requests:
            memory: "32Mi"
            cpu: "50m"
          limits:
            memory: "64Mi"
            cpu: "100m"
      
      # Main application container
      containers:
      - name: api
        image: api-service:v2.0
        ports:
        - containerPort: 8000
        env:
        - name: PROXY_URL
          value: "http://localhost:8080"
        volumeMounts:
        - name: app-logs
          mountPath: /var/log/app
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        # In-place resource update enabled
        resizePolicy:
        - resourceName: cpu
          restartPolicy: NotRequired
        - resourceName: memory
          restartPolicy: RestartContainer
      
      volumes:
      - name: envoy-config
        configMap:
          name: envoy-config
      - name: fluent-bit-config
        configMap:
          name: fluent-bit-config
      - name: app-logs
        emptyDir: {}
\`\`\`

### 3. CEL-based Admission Policy

\`\`\`yaml
apiVersion: admissionregistration.k8s.io/v1beta1
kind: ValidatingAdmissionPolicy
metadata:
  name: production-requirements
spec:
  failurePolicy: Fail
  matchConstraints:
    resourceRules:
    - apiGroups: ["apps"]
      apiVersions: ["v1"]
      resources: ["deployments"]
      operations: ["CREATE", "UPDATE"]
    namespaceSelector:
      matchLabels:
        environment: production
  validations:
  # Ensure production deployments have proper resources
  - expression: |
      object.spec.template.spec.containers.all(c,
        has(c.resources.requests.memory) && 
        has(c.resources.requests.cpu) &&
        has(c.resources.limits.memory) &&
        has(c.resources.limits.cpu)
      )
    message: "All containers must have resource requests and limits"
  
  # Require specific labels
  - expression: |
      has(object.metadata.labels.app) &&
      has(object.metadata.labels.version) &&
      has(object.metadata.labels.team)
    message: "Required labels: app, version, team"
  
  # Ensure high availability
  - expression: "object.spec.replicas >= 3"
    message: "Production deployments must have at least 3 replicas"
  
  # Require pod disruption budget reference
  - expression: |
      has(object.metadata.annotations['pdb-name'])
    message: "Must reference a PodDisruptionBudget in annotations"

---
# CEL-based CRD validation
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: applications.platform.io
spec:
  group: platform.io
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              replicas:
                type: integer
                minimum: 1
              image:
                type: string
              resources:
                type: object
                x-kubernetes-validations:
                - rule: "self.requests.memory.matches('^[0-9]+[MG]i$')"
                  message: "Memory must be in Mi or Gi"
                - rule: "int(self.requests.cpu.replace('m', '')) <= int(self.limits.cpu.replace('m', ''))"
                  message: "CPU requests must not exceed limits"
\`\`\`

### 4. Service Mesh Integration

\`\`\`yaml
# Istio with Gateway API
apiVersion: v1
kind: ConfigMap
metadata:
  name: istio-gateway-api
  namespace: istio-system
data:
  mesh: |
    defaultConfig:
      proxyStatsMatcher:
        inclusionRegexps:
        - ".*outlier_detection.*"
        - ".*circuit_breakers.*"
      gatewayAPI:
        enabled: true
    extensionProviders:
    - name: otel
      envoyOtelAls:
        service: opentelemetry-collector.istio-system.svc.cluster.local
        port: 4317

---
# Service mesh policies
apiVersion: networking.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT

---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: api-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: api-service
  rules:
  - to:
    - operation:
        paths: ["/api/v2/*"]
    when:
    - source:
        principals: ["cluster.local/ns/production/sa/frontend"]
\`\`\`

### 5. GitOps with ArgoCD

\`\`\`yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: production-platform
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/company/k8s-platform
    targetRevision: main
    path: environments/production
    plugin:
      env:
      - name: HELM_VALUES
        value: |
          gateway:
            enabled: true
            class: modern-gateway
          sidecar:
            enabled: true
            type: native
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    - ServerSideApply=true
  revisionHistoryLimit: 3
\`\`\`

### 6. Observability Stack

\`\`\`yaml
# OpenTelemetry Collector
apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: platform-collector
spec:
  mode: daemonset
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
      prometheus:
        config:
          scrape_configs:
          - job_name: 'kubernetes-pods'
            kubernetes_sd_configs:
            - role: pod
    processors:
      batch:
        timeout: 1s
      k8sattributes:
        extract:
          metadata:
          - k8s.namespace.name
          - k8s.deployment.name
          - k8s.pod.name
    exporters:
      prometheus:
        endpoint: "0.0.0.0:8889"
      jaeger:
        endpoint: jaeger-collector:14250
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch, k8sattributes]
          exporters: [jaeger]
        metrics:
          receivers: [prometheus]
          processors: [batch]
          exporters: [prometheus]
\`\`\``,
      reasoning: 'This example demonstrates cutting-edge Kubernetes 1.29+ features including Gateway API v1.1 with GRPCRoute, native sidecar containers, CEL-based policies, service mesh integration, and modern observability patterns.'
    }
  ]
};

export const networkArchitect: SpecialistDefinition = {
  name: 'network-architect',
  description: 'Design secure and scalable network architectures',
  category: 'infrastructure',
  focusAreas: [
    'Network topology',
    'Load balancing',
    'CDN strategy',
    'VPN configuration',
    'Firewall rules',
    'DNS management',
    'Traffic optimization'
  ],
  approach: [
    'Design for redundancy',
    'Minimize latency',
    'Secure by default',
    'Plan for growth',
    'Monitor traffic patterns'
  ],
  outputs: [
    'Network diagrams',
    'Configuration files',
    'Security policies',
    'Traffic analysis',
    'Optimization recommendations'
  ]
};

export const gcpExpert: SpecialistDefinition = {
  name: 'gcp-expert',
  description: 'Expert in Google Cloud Platform with deep knowledge of Vertex AI, Gemini models, AlloyDB, Cloud Run, and modern AI-first architectures. Specializes in deploying scalable AI applications and leveraging GCP\'s latest 2024-2025 services.',
  category: 'infrastructure',
  focusAreas: [
    'Vertex AI with Gemini 2.5 models and 160+ foundation models',
    'AlloyDB AI with vector search and natural language queries',
    'Cloud Run for serverless AI deployments',
    'BigQuery continuous real-time analytics and ML',
    'Cloud Spanner with trillion-scale vector search',
    'GKE with GPU support for AI workloads',
    'Firestore with MongoDB compatibility',
    'Cloud WAN for global low-latency networking',
    'IAM and Workload Identity Federation',
    'Cloud Build with artifact registry',
    'Anthos for hybrid/multi-cloud deployments',
    'Cloud Composer for workflow orchestration',
    'Security Command Center and Cloud Armor',
    'Cost optimization with committed use discounts'
  ],
  approach: [
    'Design AI-first architectures with Vertex AI and Gemini',
    'Implement vector search across databases (AlloyDB, Spanner, Firestore)',
    'Deploy serverless AI workloads on Cloud Run',
    'Use BigQuery for real-time analytics and ML',
    'Configure secure networking with VPC and Cloud WAN',
    'Implement zero-trust security with BeyondCorp',
    'Set up comprehensive monitoring with Cloud Operations',
    'Optimize costs using ARM instances and committed use',
    'Enable CI/CD with Cloud Build and Artifact Registry',
    'Apply Infrastructure as Code with Terraform'
  ],
  outputs: [
    'Vertex AI pipeline configurations',
    'AlloyDB AI implementations with embeddings',
    'Cloud Run AI service deployments',
    'Terraform modules for GCP resources',
    'BigQuery ML models and real-time queries',
    'GKE cluster configs with GPU node pools',
    'IAM policies and service accounts',
    'Cost optimization strategies',
    'Monitoring dashboards and SLOs',
    'Security architecture documentation'
  ],
  subagentType: 'gcp-expert',
  keyPrinciple: 'Build scalable, AI-powered applications on Google Cloud leveraging Vertex AI, Gemini models, and modern serverless architectures for optimal performance and cost efficiency',
  examples: [
    {
      input: 'Build a modern AI application on GCP using Vertex AI, AlloyDB, and Cloud Run',
      output: `## AI-Powered Application on Google Cloud (2024-2025)

### Architecture Overview
Building a RAG (Retrieval Augmented Generation) application using:
- Vertex AI with Gemini 2.5 Pro for reasoning
- AlloyDB AI for vector storage and search
- Cloud Run for serverless deployment
- BigQuery for analytics

### 1. Vertex AI Setup with Gemini Models

\`\`\`python
# vertex_ai_setup.py
from google.cloud import aiplatform
from vertexai.generative_models import GenerativeModel, Part
from vertexai.language_models import TextEmbeddingModel
import vertexai

# Initialize Vertex AI
vertexai.init(project="my-project", location="us-central1")

class AIService:
    def __init__(self):
        # Gemini 2.5 Pro for complex reasoning (1M token context)
        self.gemini_pro = GenerativeModel("gemini-2.5-pro-001")
        
        # Gemini 2.5 Flash for fast responses
        self.gemini_flash = GenerativeModel("gemini-2.5-flash-001")
        
        # Text embedding model
        self.embedding_model = TextEmbeddingModel.from_pretrained(
            "text-embedding-004"
        )
        
        # Image generation with Imagen 3
        self.imagen = GenerativeModel("imagen-3")
        
    async def generate_response(self, prompt: str, context: str = None):
        """Generate response with grounding"""
        # Ground with enterprise data and Google Search
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "max_output_tokens": 2048,
        }
        
        # Use context if provided (from vector search)
        if context:
            prompt = f"""Context: {context}
            
            User Query: {prompt}
            
            Please provide a comprehensive answer based on the context."""
        
        response = await self.gemini_pro.generate_content_async(
            prompt,
            generation_config=generation_config,
            safety_settings={
                "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_ONLY_HIGH",
            }
        )
        
        return response.text
    
    async def generate_embeddings(self, texts: list[str]):
        """Generate embeddings for vector search"""
        embeddings = self.embedding_model.get_embeddings(texts)
        return [emb.values for emb in embeddings]
    
    async def analyze_multimodal(self, text: str, image_bytes: bytes):
        """Analyze text and image together"""
        image_part = Part.from_data(image_bytes, mime_type="image/jpeg")
        
        response = await self.gemini_pro.generate_content_async(
            [text, image_part],
            generation_config={"temperature": 0.5}
        )
        
        return response.text
\`\`\`

### 2. AlloyDB AI Configuration

\`\`\`sql
-- Enable AlloyDB AI extensions
CREATE EXTENSION IF NOT EXISTS google_ml_integration;
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with vector embeddings
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(768),  -- Dimension based on model
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ScaNN index for fast vector search (10x faster than HNSW)
CREATE INDEX idx_documents_embedding 
ON documents 
USING scann (embedding vector_cosine_ops)
WITH (num_leaves = 1000);

-- Function to generate embeddings using Vertex AI
CREATE OR REPLACE FUNCTION generate_embedding(input_text TEXT)
RETURNS vector
LANGUAGE SQL
AS $$
    SELECT google_ml.embed(
        model_id => 'text-embedding-004',
        content => input_text
    )::vector;
$$;

-- Trigger to auto-generate embeddings
CREATE OR REPLACE FUNCTION update_embedding()
RETURNS TRIGGER AS $$
BEGIN
    NEW.embedding = generate_embedding(NEW.content);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_embed
BEFORE INSERT OR UPDATE OF content ON documents
FOR EACH ROW
EXECUTE FUNCTION update_embedding();

-- Natural language query function
CREATE OR REPLACE FUNCTION search_documents(
    query_text TEXT,
    limit_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> generate_embedding(query_text)) as similarity
    FROM documents d
    ORDER BY d.embedding <=> generate_embedding(query_text)
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
\`\`\`

### 3. Cloud Run Deployment

\`\`\`dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Use Cloud Run's PORT env variable
ENV PORT=8080
EXPOSE 8080

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app
\`\`\`

\`\`\`python
# main.py - FastAPI application
from fastapi import FastAPI, HTTPException, UploadFile
from contextlib import asynccontextmanager
import asyncpg
import os
from typing import List, Optional

# Import our AI service
from vertex_ai_setup import AIService

# Database configuration
DATABASE_URL = os.environ.get("DATABASE_URL")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.db_pool = await asyncpg.create_pool(
        DATABASE_URL,
        min_size=5,
        max_size=20,
        command_timeout=60
    )
    app.state.ai_service = AIService()
    
    yield
    
    # Shutdown
    await app.state.db_pool.close()

app = FastAPI(lifespan=lifespan)

@app.post("/api/documents")
async def create_document(content: str, metadata: Optional[dict] = None):
    """Store document with auto-generated embeddings"""
    async with app.state.db_pool.acquire() as conn:
        doc = await conn.fetchrow(
            """
            INSERT INTO documents (content, metadata)
            VALUES ($1, $2)
            RETURNING id, content, metadata, created_at
            """,
            content,
            metadata
        )
    
    return {"id": str(doc["id"]), "created_at": doc["created_at"]}

@app.get("/api/search")
async def search_documents(query: str, limit: int = 10):
    """Search documents using vector similarity"""
    async with app.state.db_pool.acquire() as conn:
        results = await conn.fetch(
            "SELECT * FROM search_documents($1, $2)",
            query,
            limit
        )
    
    # Get AI response with context
    if results:
        context = "\\n\\n".join([r["content"] for r in results[:3]])
        ai_response = await app.state.ai_service.generate_response(
            query, 
            context
        )
    else:
        ai_response = await app.state.ai_service.generate_response(query)
    
    return {
        "results": [
            {
                "id": str(r["id"]),
                "content": r["content"],
                "metadata": r["metadata"],
                "similarity": float(r["similarity"])
            }
            for r in results
        ],
        "ai_response": ai_response
    }

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile, prompt: str):
    """Multimodal analysis with Gemini"""
    image_bytes = await file.read()
    
    analysis = await app.state.ai_service.analyze_multimodal(
        prompt,
        image_bytes
    )
    
    return {"analysis": analysis}
\`\`\`

### 4. Cloud Run Deployment Configuration

\`\`\`yaml
# service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ai-app
  annotations:
    run.googleapis.com/launch-stage: GA
spec:
  template:
    metadata:
      annotations:
        # Use 2nd gen execution environment
        run.googleapis.com/execution-environment: gen2
        # CPU allocation
        run.googleapis.com/cpu-throttling: "false"
        # Startup CPU boost
        run.googleapis.com/startup-cpu-boost: "true"
    spec:
      serviceAccountName: ai-app-sa@my-project.iam.gserviceaccount.com
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/my-project/ai-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: alloydb-secret
              key: url
        - name: GOOGLE_CLOUD_PROJECT
          value: my-project
        resources:
          limits:
            cpu: "4"
            memory: "8Gi"
          requests:
            cpu: "2"
            memory: "4Gi"
        startupProbe:
          httpGet:
            path: /health
          initialDelaySeconds: 0
          periodSeconds: 1
          timeoutSeconds: 1
          failureThreshold: 30
\`\`\`

### 5. Terraform Infrastructure

\`\`\`hcl
# main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "aiplatform.googleapis.com",
    "alloydb.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
  ])
  
  service = each.key
}

# AlloyDB Cluster with AI enabled
resource "google_alloydb_cluster" "main" {
  cluster_id = "ai-cluster"
  location   = "us-central1"
  
  initial_user {
    user     = "postgres"
    password = random_password.db_password.result
  }
  
  automated_backup_policy {
    enabled = true
    backup_window = "04:00"
    location = "us-central1"
  }
  
  continuous_backup_config {
    enabled = true
    recovery_window_days = 7
  }
}

# AlloyDB Primary Instance with AI features
resource "google_alloydb_instance" "primary" {
  cluster       = google_alloydb_cluster.main.name
  instance_id   = "primary"
  instance_type = "PRIMARY"
  
  machine_config {
    cpu_count = 8
  }
  
  database_flags = {
    "google_ml_integration.enable" = "on"
    "alloydb.enable_scann_index" = "on"
  }
}

# Cloud Run Service
resource "google_cloud_run_v2_service" "app" {
  name     = "ai-app"
  location = "us-central1"
  
  template {
    service_account = google_service_account.app.email
    
    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
    
    containers {
      image = "gcr.io/${var.project_id}/ai-app:latest"
      
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_url.secret_id
            version = "latest"
          }
        }
      }
      
      resources {
        limits = {
          cpu    = "4"
          memory = "8Gi"
        }
        
        # Enable GPU if needed
        # gpu = {
        #   type = "nvidia-l4"
        #   count = 1
        # }
      }
    }
    
    scaling {
      min_instance_count = 1
      max_instance_count = 100
    }
  }
  
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# BigQuery Dataset for Analytics
resource "google_bigquery_dataset" "analytics" {
  dataset_id = "ai_analytics"
  location   = "US"
  
  access {
    role          = "OWNER"
    user_by_email = google_service_account.app.email
  }
}

# BigQuery ML Model
resource "google_bigquery_ml_model" "user_clustering" {
  dataset_id = google_bigquery_dataset.analytics.dataset_id
  model_id   = "user_clusters"
  
  # Model will be created via SQL
}
\`\`\`

### 6. Monitoring & Observability

\`\`\`yaml
# monitoring.yaml - Cloud Monitoring config
apiVersion: monitoring.coreos.com/v1
kind: ServiceLevelObjective
metadata:
  name: ai-app-slo
spec:
  serviceLevelIndicator:
    requestBased:
      distributionCut:
        range:
          max: 300  # 300ms latency target
  goal: 0.99  # 99% SLI
  rollingPeriod: 30d
  
---
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  name: ai-app-alerts
spec:
  conditions:
  - displayName: High Error Rate
    conditionThreshold:
      filter: |
        resource.type="cloud_run_revision"
        AND resource.labels.service_name="ai-app"
        AND metric.type="run.googleapis.com/request_count"
        AND metric.labels.response_code_class!="2xx"
      comparison: COMPARISON_GT
      thresholdValue: 10
      duration: 60s
\`\`\``,
      reasoning: 'This example showcases modern GCP AI application development using Vertex AI with Gemini 2.5 models, AlloyDB AI for vector search, Cloud Run for serverless deployment, and comprehensive infrastructure as code with Terraform.'
    }
  ]
};

export const supabaseExpert: SpecialistDefinition = {
  name: 'supabase-expert',
  description: 'Expert in Supabase backend-as-a-service platform with deep PostgreSQL and real-time expertise',
  category: 'infrastructure',
  focusAreas: [
    'Supabase project setup and configuration',
    'PostgreSQL database schema design',
    'Row-Level Security (RLS) policies',
    'Authentication and authorization',
    'Real-time subscriptions',
    'Edge Functions development',
    'Storage configuration',
    'Database optimization'
  ],
  approach: [
    'Design secure database schemas',
    'Implement comprehensive RLS policies',
    'Optimize query performance',
    'Build real-time features',
    'Deploy edge functions'
  ],
  outputs: [
    'Database schemas',
    'RLS policies',
    'Edge functions',
    'Migration scripts',
    'Performance reports'
  ],
  keyPrinciple: 'Build secure, scalable applications with Supabase and PostgreSQL best practices'
};

// Register all infrastructure specialists
export function registerInfrastructureSpecialists(): void {
  specialistRegistry.register(devopsTroubleshooter);
  specialistRegistry.register(deploymentEngineer);
  specialistRegistry.register(siteReliabilityEngineer);
  specialistRegistry.register(kubernetesExpert);
  specialistRegistry.register(networkArchitect);
  specialistRegistry.register(gcpExpert);
  specialistRegistry.register(supabaseExpert);
}