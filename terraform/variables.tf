variable "gcp_project_id" {
  type        = string
  description = "The Google Cloud Platform Project ID"
  default     = "veriigo-prod"
}

variable "gcp_region" {
  type        = string
  description = "The target GCP region for deployment"
  default     = "asia-southeast1"
}

variable "gcs_document_lake_bucket" {
  type        = string
  description = "GCS bucket name for immutable Document Lake PDFs and payloads"
  default     = "veriigo-document-lake-prod"
}

variable "container_image_url" {
  type        = string
  description = "Google Artifact Registry container image URI for VERIIGO Cloud Run service"
  default     = "asia-southeast1-docker.pkg.dev/veriigo-prod/veriigo-app/veriigo-platform:v2.0.0"
}
