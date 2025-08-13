# Earth Agents N8N - GCP Terraform Configuration

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP Zone"
  type        = string
  default     = "us-central1-a"
}

variable "n8n_user" {
  description = "N8N Basic Auth User"
  type        = string
  default     = "zeidalqadri@gmail.com"
}

variable "n8n_password" {
  description = "N8N Basic Auth Password"
  type        = string
  sensitive   = true
}

variable "deployment_type" {
  description = "Deployment type: cloud_run, gke, or compute_engine"
  type        = string
  default     = "cloud_run"
}

# Random resources for passwords
resource "random_password" "postgres_password" {
  length  = 32
  special = true
}

resource "random_password" "n8n_encryption_key" {
  length  = 32
  special = true
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "compute.googleapis.com",
    "containerregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com"
  ])
  
  service = each.key
  disable_on_destroy = false
}

# Cloud SQL Instance
resource "google_sql_database_instance" "n8n_db" {
  name             = "earth-agents-n8n-db"
  database_version = "POSTGRES_14"
  region           = var.region
  
  settings {
    tier = "db-f1-micro"
    
    database_flags {
      name  = "max_connections"
      value = "100"
    }
    
    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      location                       = var.region
      point_in_time_recovery_enabled = true
    }
    
    ip_configuration {
      ipv4_enabled    = true
      private_network = null
      
      authorized_networks {
        name  = "allow-all"
        value = "0.0.0.0/0"
      }
    }
  }
  
  deletion_protection = false
}

# Database
resource "google_sql_database" "n8n" {
  name     = "n8n"
  instance = google_sql_database_instance.n8n_db.name
}

# Database User
resource "google_sql_user" "n8n" {
  name     = "n8n"
  instance = google_sql_database_instance.n8n_db.name
  password = random_password.postgres_password.result
}

# Secret Manager Secrets
resource "google_secret_manager_secret" "n8n_password" {
  secret_id = "n8n-password"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "n8n_password" {
  secret      = google_secret_manager_secret.n8n_password.id
  secret_data = var.n8n_password
}

resource "google_secret_manager_secret" "postgres_password" {
  secret_id = "postgres-password"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "postgres_password" {
  secret      = google_secret_manager_secret.postgres_password.id
  secret_data = random_password.postgres_password.result
}

resource "google_secret_manager_secret" "n8n_encryption_key" {
  secret_id = "n8n-encryption-key"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "n8n_encryption_key" {
  secret      = google_secret_manager_secret.n8n_encryption_key.id
  secret_data = random_password.n8n_encryption_key.result
}

# Service Account for Cloud Run
resource "google_service_account" "n8n_sa" {
  account_id   = "n8n-service-account"
  display_name = "N8N Service Account"
}

# IAM permissions for Service Account
resource "google_project_iam_member" "n8n_sa_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ])
  
  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.n8n_sa.email}"
}

# Cloud Run Service (if deployment_type == "cloud_run")
resource "google_cloud_run_service" "n8n" {
  count    = var.deployment_type == "cloud_run" ? 1 : 0
  name     = "earth-agents-n8n"
  location = var.region
  
  template {
    spec {
      service_account_name = google_service_account.n8n_sa.email
      
      containers {
        image = "n8nio/n8n:latest"
        
        ports {
          container_port = 5678
        }
        
        env {
          name  = "DATABASE_TYPE"
          value = "postgresdb"
        }
        
        env {
          name  = "DATABASE_POSTGRESDB_HOST"
          value = google_sql_database_instance.n8n_db.public_ip_address
        }
        
        env {
          name  = "DATABASE_POSTGRESDB_PORT"
          value = "5432"
        }
        
        env {
          name  = "DATABASE_POSTGRESDB_DATABASE"
          value = google_sql_database.n8n.name
        }
        
        env {
          name  = "DATABASE_POSTGRESDB_USER"
          value = google_sql_user.n8n.name
        }
        
        env {
          name = "DATABASE_POSTGRESDB_PASSWORD"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.postgres_password.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name  = "N8N_BASIC_AUTH_ACTIVE"
          value = "true"
        }
        
        env {
          name  = "N8N_BASIC_AUTH_USER"
          value = var.n8n_user
        }
        
        env {
          name = "N8N_BASIC_AUTH_PASSWORD"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.n8n_password.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name = "N8N_ENCRYPTION_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.n8n_encryption_key.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name  = "N8N_HOST"
          value = "0.0.0.0"
        }
        
        env {
          name  = "N8N_PORT"
          value = "5678"
        }
        
        env {
          name  = "N8N_PROTOCOL"
          value = "https"
        }
        
        env {
          name  = "EXECUTIONS_PROCESS"
          value = "main"
        }
        
        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "10"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.n8n_db.connection_name
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.required_apis,
    google_sql_database_instance.n8n_db,
    google_sql_database.n8n,
    google_sql_user.n8n
  ]
}

# Cloud Run IAM - Allow unauthenticated access
resource "google_cloud_run_service_iam_member" "n8n_public" {
  count    = var.deployment_type == "cloud_run" ? 1 : 0
  service  = google_cloud_run_service.n8n[0].name
  location = google_cloud_run_service.n8n[0].location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Compute Engine Instance (if deployment_type == "compute_engine")
resource "google_compute_instance" "n8n_vm" {
  count        = var.deployment_type == "compute_engine" ? 1 : 0
  name         = "earth-agents-n8n-vm"
  machine_type = "e2-medium"
  zone         = var.zone
  
  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 20
    }
  }
  
  network_interface {
    network = "default"
    
    access_config {
      // Ephemeral public IP
    }
  }
  
  metadata = {
    startup-script = templatefile("${path.module}/startup-script.sh", {
      postgres_password   = random_password.postgres_password.result
      n8n_password       = var.n8n_password
      n8n_user           = var.n8n_user
      n8n_encryption_key = random_password.n8n_encryption_key.result
      db_host            = google_sql_database_instance.n8n_db.public_ip_address
    })
  }
  
  tags = ["http-server", "https-server", "n8n"]
  
  service_account {
    email  = google_service_account.n8n_sa.email
    scopes = ["cloud-platform"]
  }
}

# Firewall rules for Compute Engine
resource "google_compute_firewall" "n8n_allow" {
  count   = var.deployment_type == "compute_engine" ? 1 : 0
  name    = "allow-n8n"
  network = "default"
  
  allow {
    protocol = "tcp"
    ports    = ["5678", "80", "443"]
  }
  
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["n8n"]
}

# Outputs
output "service_url" {
  value = var.deployment_type == "cloud_run" ? (
    length(google_cloud_run_service.n8n) > 0 ? google_cloud_run_service.n8n[0].status[0].url : ""
  ) : (
    var.deployment_type == "compute_engine" && length(google_compute_instance.n8n_vm) > 0 ? 
    "http://${google_compute_instance.n8n_vm[0].network_interface[0].access_config[0].nat_ip}:5678" : ""
  )
  description = "The URL of the deployed N8N service"
}

output "database_connection" {
  value = google_sql_database_instance.n8n_db.connection_name
  description = "Cloud SQL connection name"
}

output "webhook_urls" {
  value = {
    code_review = var.deployment_type == "cloud_run" && length(google_cloud_run_service.n8n) > 0 ? 
      "${google_cloud_run_service.n8n[0].status[0].url}/webhook/ea-code-review" : ""
    design_compliance = var.deployment_type == "cloud_run" && length(google_cloud_run_service.n8n) > 0 ? 
      "${google_cloud_run_service.n8n[0].status[0].url}/webhook/ea-design-compliance" : ""
  }
  description = "Webhook URLs for Earth Agents workflows"
}