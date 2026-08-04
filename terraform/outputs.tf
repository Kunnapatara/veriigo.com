output "cloud_run_service_url" {
  value       = google_cloud_run_service.veriigo_app.status[0].url
  description = "The HTTPS URL of the deployed VERIIGO Cloud Run platform"
}

output "cloud_run_service_account" {
  value       = google_service_account.cloud_run_sa.email
  description = "The service account email attached to Cloud Run"
}

output "document_lake_bucket_name" {
  value       = google_storage_bucket.document_lake.name
  description = "The GCS bucket storing raw Thai government recruitment PDFs"
}

output "pubsub_crawl_completed_topic" {
  value       = google_pubsub_topic.crawl_completed.id
  description = "Pub/Sub topic ID for crawl completed events"
}
