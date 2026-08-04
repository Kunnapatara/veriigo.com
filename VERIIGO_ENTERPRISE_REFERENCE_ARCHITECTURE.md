# VERIIGO ENTERPRISE REFERENCE ARCHITECTURE (ERA)

**Document Classification:** OFFICIAL ENTERPRISE ARCHITECTURE SPECIFICATION  
**Document Authority:** Chief Enterprise Architect & Technical Governance Board  
**Platform Target:** VERIIGO National Government Recruitment Intelligence Platform  
**Target Enterprise Scale:** 3,000+ Official Government Sources | Millions of Immutable Documents | Enterprise Data Lineage  
**Architectural Framework Alignment:** TOGAF 10, ArchiMate 3.1, DDD (Domain-Driven Design), CQRS, Data Mesh, Zero Trust Architecture  
**Effective Date:** August 2026  

---

## PART 1: BUSINESS ARCHITECTURE

### 1.1 Enterprise Mission
To aggregate, standardize, verify, and democratize public sector recruitment data across all 3,000+ Thai government agencies, ministries, provincial offices, state enterprises, and local administrative organizations (SAOs), establishing a single immutable source of truth for national government recruitment intelligence.

### 1.2 Enterprise Vision
To serve as the definitive National Government Recruitment Intelligence Platform—empowering citizens with transparent, instant, and verified access to public employment opportunities while delivering data-driven workforce analytics, regulatory compliance auditability, and labor market insights for government policymakers.

### 1.3 Core Business Capabilities
* **Source Intelligence:** Continuous discovery, registration, and health monitoring of all official government portals and official Gazette publishers.
* **Document Acquisition & Preservation:** Automated ingestion and legal-grade preservation of public employment announcements in raw formats.
* **Recruitment Extraction & Intelligence:** Structured AI-driven transformation of unstructured official announcements into normalized employment records.
* **Verifiable Data Lineage:** End-to-end auditability linking every displayed recruitment data point back to its original official document, text snippet, and publication metadata.
* **Citizen Employment Discovery:** High-speed, multi-attribute, faceted search and personalized recommendation for job seekers nationwide.
* **Government Workforce Analytics:** Macro-level analytical reporting on public sector hiring trends, salary distributions, educational requirements, and regional workforce demand.

### 1.4 Stakeholder Map
1. **Citizens & Job Seekers:** Access accurate, timely, and verified civil service job opportunities with instant notification alerts.
2. **Government Agencies & HR Divisions (OCSC, OPD, Ministries):** Monitor recruitment reach, benchmark civil service position requirements, and audit public hiring transparency.
3. **Policy Makers & Labor Economists:** Analyze national public sector workforce demand, salary expenditure trends, and regional employment distribution.
4. **Platform Operators & Data Auditors:** Oversee data quality, manage crawler health, review low-confidence extractions, and enforce governance rules.

### 1.5 Government Recruitment Intelligence Value Chain

```
[Source Discovery] ──► [Document Acquisition] ──► [AI Structured Extraction] ──► [Quality Verification] ──► [Citizen Discovery & Analytics]
```

---

## PART 2: CAPABILITY MAP

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          VERIIGO CAPABILITY MAP                                                   │
├──────────────────────────────────────┬────────────────────────────────────┬───────────────────────────────────────┤
│ 1. SOURCE INTELLIGENCE               │ 2. DOCUMENT ACQUISITION            │ 3. EXTRACTION & PROCESSING            │
│  ├─ Source Discovery & Registration   │  ├─ Multi-protocol Crawler Engine  │  ├─ Layout-aware Document Parser     │
│  ├─ Portal Health Monitoring         │  ├─ Immutable Document Lake Ingest │  ├─ Gemini Multimodal Extraction      │
│  └─ Frequency & Schedule Management   │  └─ SHA-256 Deduplication           │  └─ Bounding Snippet Text Anchoring   │
├──────────────────────────────────────┼────────────────────────────────────┼───────────────────────────────────────┤
│ 4. QUALITY & LINEAGE GOVERNANCE      │ 5. DATA NORMALIZATION              │ 6. SEARCH & DISCOVERY                 │
│  ├─ Quality Gate Engine              │  ├─ Position & Salary Normalizer   │  ├─ Sub-50ms Faceted Search Index     │
│  ├─ Cryptographic Evidence Chain     │  ├─ OCSC Level & Education Mapper  │  ├─ Geo-spatial & Province Filtering  │
│  └─ Human Review Queue Management    │  └─ Deduplication & Merge Engine   │  └─ Personalized Job Alert Engine     │
├──────────────────────────────────────┴────────────────────────────────────┴───────────────────────────────────────┤
│ 7. ENTERPRISE PLATFORM SERVICES                                                                                   │
│  ├─ OpenTelemetry Observability  ├─ Identity & Access Management (RBAC)  ├─ Audit & Compliance Ledger            │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 3: ENTERPRISE INFORMATION ARCHITECTURE

The VERIIGO Information Architecture is structured into 12 core Domain-Driven Bounded Contexts:

1. **Source Domain (`SourceEntity`):** Official government organization metadata, portal URL patterns, crawl frequency, health status, and official domain level (`.go.th`, `.or.th`, `.mi.th`).
2. **Document Domain (`DocumentEntity`):** Immutable record of ingested binaries (PDF, HTML, DOCX), storing SHA-256 fingerprint hash, download timestamp, HTTP headers, and GCS URI.
3. **Job Domain (`JobAnnouncementEntity`):** Normalized civil service vacancy record containing standardized position title, agency, OCSC level, salary bounds, qualification criteria, and application window dates.
4. **Agency Domain (`GovernmentAgencyEntity`):** Hierarchy of Thai public sector organizations (Ministry $\rightarrow$ Department $\rightarrow$ Bureau $\rightarrow$ Local Office).
5. **Province Domain (`GeographicProvinceEntity`):** Geographic taxonomy covering all 77 Thai provinces, districts, and administrative regions.
6. **Occupation Domain (`JobCategoryTaxonomy`):** Standardized occupational classification for civil service positions (e.g. Administrative, Engineering, Medical, Educational).
7. **Evidence Domain (`ExtractionEvidenceEntity`):** Bounding box, page number, and verbatim text snippet anchoring AI extraction outputs back to raw document binaries.
8. **Audit Domain (`AuditLedgerEntity`):** Immutable log of operational decisions, pipeline execution states, quality gate verdicts, and manual review overrides.
9. **Lineage Domain (`DataLineageHeader`):** Cryptographic provenance chain binding a `JobAnnouncement` to its `Document`, `Source`, `ModelVersion`, `PromptVersion`, and `ValidationRules`.
10. **User Domain (`UserProfileEntity`):** Citizen account data, saved bookmarks, preference filters, and search histories.
11. **Subscription Domain (`NotificationSubscription`):** Real-time alert preferences, push targets (Email, LINE, WebPush), and channel delivery states.
12. **Analytics Domain (`LaborIntelligenceMetrics`):** Aggregated metrics on recruitment volume, salary distributions, skill demand, and regional hiring velocity.

---

## PART 4: ENTERPRISE APPLICATION ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       LOGICAL APPLICATION ARCHITECTURE                                           │
├───────────────────────┬───────────────────────┬───────────────────────┬──────────────────────────────────────────┤
│ CRAWLER SERVICE       │ DOCUMENT LAKE INGEST  │ OCR & PARSER SERVICE  │ AI EXTRACTION SERVICE                    │
│ Stateless workers     │ Immutable GCS Bucket  │ PDF/HTML Structural   │ Gemini Multimodal Engine                 │
│ HTTP / RSS / Sitemaps │ SHA-256 Storage Engine│ Layout Parser         │ Versioned Prompt Pipeline                │
├───────────────────────┼───────────────────────┼───────────────────────┼──────────────────────────────────────────┤
│ QUALITY GATE ENGINE   │ NORMALIZED JOB ENGINE │ SEARCH ENGINE         │ RECOMMENDATION ENGINE                    │
│ Automated Rule-set    │ Deduplication & Merge │ CQRS Read Store       │ User Vector Matching                     │
│ Confidence Evaluator  │ Historical Versioning │ Faceted Search Index  │ Instant Job Alert Dispatcher             │
├───────────────────────┴───────────────────────┴───────────────────────┴──────────────────────────────────────────┤
│ PRESENTATION LAYER                                                                                               │
│ ├─ Citizen Explorer Dashboard (Web SPA)               ├─ Government Analytics Portal                             │
│ ├─ Enterprise Admin & Audit Console                   ├─ Human-in-the-Loop Review Console                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 5: INTEGRATION ARCHITECTURE

VERIIGO employs an **Event-Driven Microservices Architecture** built on asynchronous messaging and data contracts:

* **Ingestion Event (`DocumentIngestedEvent`):** Emitted when the Crawler writes a raw binary to the Document Lake. Contains `documentId`, `sourceId`, `sha256`, and `storageUri`.
* **Extraction Event (`JobExtractedEvent`):** Emitted when the AI Extraction Service processes a document. Contains raw extracted fields, `confidenceScore`, and `lineageMetadata`.
* **Validation Event (`JobValidatedEvent`):** Emitted when the Quality Gate approves an extraction. Triggers index creation in the CQRS Search Store.
* **Dead Letter Queue (DLQ):** Failed task messages after 5 exponential backoff retries are routed to `dlq-ingestion-failed` or `dlq-extraction-failed` for diagnostic analysis.
* **Data Contracts:** All cross-service payloads strictly conform to JSON Schema contracts with automated build-time validation.

---

## PART 6: ENTERPRISE SECURITY ARCHITECTURE

VERIIGO enforces a **Zero Trust Security Architecture** across all layers:

1. **Identity & Access Management:** Multi-factor Firebase Authentication for citizen and administrative users. Role-Based Access Control (RBAC) enforcing principle of least privilege (`Viewer`, `Reviewer`, `Operator`, `Admin`, `SystemWorker`).
2. **Data Encryption:**
   * **In-Transit:** TLS 1.3 enforced across all external and internal microservice endpoints.
   * **At-Rest:** AES-256 customer-managed encryption keys (CMEK) for Document Lake storage and primary databases.
3. **Secrets Management:** Secrets (API keys, database credentials) managed via Google Cloud Secret Manager; injected dynamically into runtime memory without local disk persistence.
4. **Compliance & Privacy:** Full compliance with the Thai Personal Data Protection Act (PDPA). Whitelisted access restricted strictly to official Thai government domains (`.go.th`, `.or.th`, `.mi.th`).

---

## PART 7: ENTERPRISE AI ARCHITECTURE

```
Raw Document Binary ──► Document Parser ──► Gemini Multimodal ──► Verbatim Snippet Matcher ──► Quality Gate (≥0.85) ──► Job Store
                                                                             │
                                                                             └──► Low Confidence (<0.85) ──► Human Review Queue
```

* **Model Tiering:** Gemini 1.5 Flash for high-speed structured text/PDF extraction; Gemini 1.5 Pro for complex scanned image OCR and multi-page gazettes.
* **Prompt Governance:** All prompts are versioned in code repositories (`/prompts/v2.4.1.json`), tested against ground-truth evaluation datasets, and immutable in execution environments.
* **Confidence Engine:** Weighted multi-field confidence score combining model certainty, salary sanity, application window logic, and verbatim snippet anchor matching.

---

## PART 8: TECHNOLOGY ARCHITECTURE

* **Cloud Storage:** Google Cloud Storage (GCS) with Object Versioning and WORM Retention Policies.
* **Operational Database:** Cloud SQL (PostgreSQL) for relational normalized job records, agency taxonomies, and audit trails.
* **Cache & Real-time Layer:** Firestore for real-time UI state sync and metadata caching.
* **Search Engine:** Elasticsearch / Cloud Search for full-text Thai tokenization, fuzzy matching, and sub-50ms faceted filtering.
* **Compute Environment:** Google Cloud Run (Serverless Container Instances) with auto-scaling from 0 to 1,000 instances.
* **Networking:** Cloud Armor DDoS Protection, Cloud CDN for static asset delivery, and private VPC Service Controls.

---

## PART 9: OPERATIONAL ARCHITECTURE

* **Observability Suite:** OpenTelemetry SDK propagating W3C `traceparent` headers across all HTTP and event queue boundaries.
* **Core Metrics & Service Level Objectives (SLOs):**
  * *Ingestion Availability:* 99.9% uptime.
  * *Search Response Latency:* P95 < 50ms.
  * *AI Extraction Accuracy:* >= 99.0% verified field accuracy.
* **Disaster Recovery:** Multi-region storage replication with RPO (Recovery Point Objective) < 1 minute and RTO (Recovery Time Objective) < 15 minutes.

---

## PART 10: DEPLOYMENT ARCHITECTURE

```
[Development] ──► [QA Integration] ──► [Staging Replay] ──► [Pilot Canary (10% Traffic)] ──► [Production (100%)]
```

* **Environment Isolation:** Complete logical and credential separation across Development, Staging, and Production environments.
* **Deployment Pattern:** Blue/Green deployments for service containers; Canary traffic shifting for background crawler and AI worker pools.
* **Rollback Engine:** Automated instant rollback triggered if canary error rates exceed 1.0% or queue latency spikes beyond 10 seconds over 3 consecutive evaluation cycles.

---

## PART 11: END-TO-END DATA FLOW

```
1. Official Government Website (.go.th)
   │ (Crawl Task Triggered)
   ▼
2. Crawler Worker (Downloads Raw Bytes)
   │ (Writes Binary)
   ▼
3. Immutable Document Lake (GCS) + Assigned SHA-256 Hash
   │ (Emits DocumentIngestedEvent)
   ▼
4. Cloud Pub/Sub / Cloud Tasks Queue
   │ (Consumes Task)
   ▼
5. Gemini AI Extraction Engine
   │ (Extracts Fields & Bounding Snippets)
   ▼
6. Quality Gate & Lineage Engine (Validation Rules & Anchor Verification)
   ├── Pass (Confidence ≥ 0.85) ──► Normalized Job Store (Cloud SQL) ──► Search Index ──► Citizen Dashboard UI
   └── Fail (Confidence < 0.85) ──► Human Review Queue Console
```

---

## PART 12: ENTERPRISE ARCHITECTURE PRINCIPLES

1. **Document First:** No job posting exists without an immutable raw source document.
2. **Every Conclusion is Traceable:** Every data field is cryptographically anchored to its source text snippet.
3. **No Silent Fallbacks:** Failures emit explicit alerts; mock data fallbacks in production are strictly forbidden.
4. **Immutable Storage:** Raw ingested content is written once and never mutated or deleted.
5. **Decoupled Event-Driven Pipeline:** Crawling, extraction, validation, and search run as independent async workers.
6. **CQRS Read/Write Separation:** UI queries read strictly from dedicated search indexes, never operational crawler tables.
7. **Zero Unindexed Scans:** All database queries enforce index usage, pagination, and boundary limits.
8. **Schema-First Data Contracts:** All service payloads are governed by strict TypeScript and JSON schemas.
9. **Idempotent Execution:** Processing the same document multiple times produces identical, deterministic outcomes.
10. **Universal Observability:** All requests and queue messages propagate a global Correlation ID.
11. **Quality Gate Supremacy:** Unverified AI extractions are never published directly to citizens.
12. **Zero Trust Security:** Least-privilege access, encrypted transport, and strict whitelist validation across all endpoints.

---

## PART 13: REFERENCE DIAGRAMS

### 13.1 Application Landscape & CQRS Separation

```
         ┌─────────────────────────────────────────────────────────────────────────────────┐
         │                                CRAWLER & INGESTION                              │
         │  Official Govt Sources (.go.th) ──► Crawler Engine ──► Immutable Document Lake  │
         └────────────────────────────────────────┬────────────────────────────────────────┘
                                                  │ (DocumentIngestedEvent)
                                                  ▼
         ┌─────────────────────────────────────────────────────────────────────────────────┐
         │                               AI EXTRACTION PIPELINE                            │
         │   Cloud Queue ──► Gemini AI Engine ──► Quality Gate & Lineage Validation Engine │
         └────────────────────────────────────────┬────────────────────────────────────────┘
                                                  │ (JobValidatedEvent)
                                                  ▼
         ┌─────────────────────────────────────────────────────────────────────────────────┐
         │                                CQRS QUERY & SEARCH                              │
         │    Normalized Job Database ──► Search Index Store ──► Citizen Explorer Dashboard │
         └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 14: EXECUTIVE SUMMARY

VERIIGO V2 transitions the National Government Recruitment Intelligence Platform into an enterprise-grade, highly resilient, AI-powered intelligence ecosystem. By enforcing an **Immutable Document Lake**, **Event-Driven Microservices Isolation**, **CQRS Read/Write Segregation**, and a **100% Traceable Lineage Architecture**, VERIIGO guarantees legal auditability, sub-50ms user search performance, and total protection against data loss across 3,000+ official government sources.

---

**Certified and Approved by:**  
*Chief Enterprise Architect & Technical Governance Board*  
*VERIIGO National Government Recruitment Intelligence Platform*
