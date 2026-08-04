# ==============================================================================
# VERIIGO V2 National Government Recruitment Intelligence Platform
# Enterprise Infrastructure as Code (IaC) - Terraform Main Configuration
# Target: Google Cloud Platform (GCP)
# Availability SLA: 99.95% | RPO: <15m | RTO: <30m
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.10.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.10.0"
    }
  }
  backend "gcs" {
    bucket = "veriigo-tf-state-prod"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "google-beta" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# ------------------------------------------------------------------------------
# 1. Google Secret Manager Secrets
# ------------------------------------------------------------------------------
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "veriigo-gemini-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "worker_service_key" {
  secret_id = "veriigo-worker-service-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "scheduler_service_key" {
  secret_id = "veriigo-scheduler-service-key"
  replication {
    auto {}
  }
}

# ------------------------------------------------------------------------------
# 2. Service Accounts & Least Privilege IAM
# ------------------------------------------------------------------------------
resource "google_service_account" "cloud_run_sa" {
  account_id   = "veriigo-cloud-run-sa"
  display_name = "VERIIGO Cloud Run Application Runner"
}

resource "google_service_account" "scheduler_sa" {
  account_id   = "veriigo-scheduler-sa"
  display_name = "VERIIGO Cloud Scheduler Service Account"
}

resource "google_project_iam_member" "cloud_run_datastore_user" {
  project = var.gcp_project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_storage_admin" {
  project = var.gcp_project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_pubsub_publisher" {
  project = var.gcp_project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_secret_accessor" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# ------------------------------------------------------------------------------
# 3. Google Cloud Storage Document Lake & DR Buckets
# ------------------------------------------------------------------------------
resource "google_storage_bucket" "document_lake" {
  name                     = var.gcs_document_lake_bucket
  location                 = var.gcp_region
  storage_class            = "STANDARD"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type          = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }

  retention_policy {
    is_locked        = false
    retention_period = 2592000 # 30 days mandatory retention
  }
}

resource "google_storage_bucket" "dr_backups" {
  name                     = "veriigo-disaster-recovery-backups-prod"
  location                 = var.gcp_region
  storage_class            = "STANDARD"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }
}

# ------------------------------------------------------------------------------
# 4. Google Cloud Pub/Sub Distributed Event Topics & Subscriptions
# ------------------------------------------------------------------------------
resource "google_pubsub_topic" "crawl_completed" {
  name = "crawl.completed"
}

resource "google_pubsub_topic" "extraction_completed" {
  name = "extraction.completed"
}

resource "google_pubsub_topic" "normalization_completed" {
  name = "normalization.completed"
}

resource "google_pubsub_topic" "search_updated" {
  name = "search.updated"
}

# Dead Letter Topics
resource "google_pubsub_topic" "crawl_dlq" {
  name = "crawl-dlq-topic"
}

resource "google_pubsub_subscription" "extraction_worker_sub" {
  name  = "extraction-worker-subscription"
  topic = google_pubsub_topic.crawl_completed.name

  ack_deadline_seconds = 60

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.crawl_dlq.id
    max_delivery_attempts = 5
  }

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

# ------------------------------------------------------------------------------
# 5. Cloud Run Service Deployment
# ------------------------------------------------------------------------------
resource "google_cloud_run_service" "veriigo_app" {
  name     = "veriigo-platform-prod"
  location = var.gcp_region

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      containers {
        image = var.container_image_url
        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "PORT"
          value = "3000"
        }
        env {
          name  = "GCS_DOCUMENT_LAKE_BUCKET"
          value = google_storage_bucket.document_lake.name
        }

        startup_probe {
          http_get {
            path = "/health/startup"
            port = 3000
          }
          initial_delay_seconds = 5
          timeout_seconds       = 3
          period_seconds        = 10
          failure_threshold     = 6
        }

        liveness_probe {
          http_get {
            path = "/health/liveness"
            port = 3000
          }
          period_seconds    = 15
          timeout_seconds   = 3
          failure_threshold = 3
        }

        readiness_probe {
          http_get {
            path = "/health/readiness"
            port = 3000
          }
          period_seconds    = 10
          timeout_seconds   = 3
          failure_threshold = 2
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "2"
        "autoscaling.knative.dev/maxScale" = "20"
        "run.googleapis.com/execution-environment" = "gen2"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# ------------------------------------------------------------------------------
# 6. Cloud Scheduler (Twice Daily National Crawl Engine Trigger)
# ------------------------------------------------------------------------------
resource "google_cloud_scheduler_job" "national_crawl_schedule_am" {
  name             = "veriigo-national-crawl-0600-ict"
  description      = "Executes complete 77-province Thai government recruitment discovery crawl at 06:00 ICT"
  schedule         = "0 6 * * *"
  time_zone        = "Asia/Bangkok"
  attempt_deadline = "3600s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.veriigo_app.status[0].url}/api/v2/scheduler/run-cycle"
    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}

resource "google_cloud_scheduler_job" "national_crawl_schedule_pm" {
  name             = "veriigo-national-crawl-1800-ict"
  description      = "Executes complete 77-province Thai government recruitment discovery crawl at 18:00 ICT"
  schedule         = "0 18 * * *"
  time_zone        = "Asia/Bangkok"
  attempt_deadline = "3600s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.veriigo_app.status[0].url}/api/v2/scheduler/run-cycle"
    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }
}

# ------------------------------------------------------------------------------
# 7. Cloud Monitoring Alert Policies (SLO Breach & Critical Failure Alerts)
# ------------------------------------------------------------------------------
resource "google_monitoring_alert_policy" "crawler_failure_alert" {
  display_name = "VERIIGO SRE - Crawler High Failure Rate Alert"
  combiner     = "OR"
  conditions {
    display_name = "Crawler Failure Rate > 5%"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/veriigo/crawl_failure_total\" AND resource.type=\"cloud_run_revision\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 50
      aggregations {
        alignment_period font_size = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
}
