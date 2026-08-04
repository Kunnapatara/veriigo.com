# VERIIGO V2: OFFICIAL ARCHITECTURE DECISION RECORDS (ADR) CONSTITUTION

**Document Status:** APPROVED  
**Authority:** Chief Software Architect & Enterprise Architecture Board  
**Target Platform:** VERIIGO National Government Recruitment Intelligence Platform  
**Target Capacity:** 3,000+ Official Government Sources | Millions of Immutable Documents | Enterprise Data Lineage  
**Effective Date:** August 2026  

---

## EXECUTIVE SUMMARY

VERIIGO V2 transitions the National Government Recruitment Intelligence Platform from a tightly coupled prototype architecture to an decoupled, event-driven, enterprise-grade data intelligence ecosystem.

Prior architectures suffered from fundamental coupling failures where source collection, crawling, AI extraction, persistence, and dashboard rendering were synchronously intertwined. Quota limits or extraction errors in downstream services caused total operational failure, invisible data drops, or silent fallbacks to cached sets.

VERIIGO V2 establishes an **Immutable Document Lake**, **CQRS Read/Write Separation**, **Strict Lineage Traceability**, and an **Event-Driven Microservices Foundation**. Every extracted data point is cryptographically and logically anchored to an immutable raw source document. The platform operates on a zero-silent-failure, 100% observable, line-level deterministic lineage model.

---

## ADR-001: Immutable Document Lake Architecture

* **Status:** ACCEPTED / APPROVED
* **Context:** Government job announcements are published as raw HTML pages, PDF gazettes, DOCX files, images, and RSS feeds. Government agencies frequently update or delete announcements without notice. Under V1, scraped documents were parsed on-the-fly and discarded, making audit verification, AI re-extraction, or regulatory compliance impossible.
* **Decision:** We establish a mandatory, immutable **Document Lake** (Google Cloud Storage + Metadata Registry).
  1. Raw downloaded files must be written to Cloud Storage in an immutable tier (`versioningEnabled = true`, `retentionPolicy = 7 years`).
  2. Documents are keyed deterministically by SHA-256 fingerprint (`documentId = sha256(rawBytes)`).
  3. No extraction or processing is permitted prior to successful persistence in the Document Lake.
* **Alternatives Considered:**
  * *Inline Ephemeral Parsing:* Rejected due to complete lack of auditability, inability to re-process documents when AI models improve, and risk of data loss during extractor failures.
  * *Storing Raw Content directly in Firestore / Database:* Rejected due to document size limitations (1MB Firestore limit), quota inflation, and poor cost efficiency for multi-terabyte binary storage.
* **Trade-offs:** Higher initial storage costs for long-term retention; small latency overhead (15–30ms) to write raw bytes to Object Storage before enqueueing downstream tasks.
* **Consequences:** 100% protection against data loss. Complete historical replayability: when new Gemini models or validation rules are deployed, the entire platform can re-extract millions of historical documents from raw sources without re-crawling government servers.
* **Future Impact:** Enables legal evidence retention for official government recruitment auditing and historical labor analytics across multi-year horizons.
* **Non-negotiable Rules:**
  * `RULE-DL-01`: Raw documents are **immutable**. Overwrites, inplace updates, or deletions are strictly prohibited.
  * `RULE-DL-02`: A document must be written to the Document Lake and assigned a verified SHA-256 hash before any AI parser is invoked.

---

## ADR-002: Event-Driven Pipeline & Decoupled Processing

* **Status:** ACCEPTED / APPROVED
* **Context:** Synchronous crawler-to-extractor pipelines mean slow AI model responses (or HTTP 429/503 errors) block crawler execution threads, causing crawler timeouts, rate-limit bans from government servers, and cascading system outages.
* **Decision:** Decouple Crawling, Document Storage, AI Extraction, and Indexing using **Google Cloud Tasks / Pub/Sub** into asynchronous event-driven worker pools.
  * **Crawler Pool:** Downloads raw bytes → writes to Document Lake → emits `DocumentIngestedEvent`.
  * **Extraction Pool:** Consumes `DocumentIngestedEvent` → runs Gemini extraction with isolated retry/rate-limit handlers → emits `JobExtractedEvent`.
  * **Validation & Deduplication Pool:** Consumes `JobExtractedEvent` → applies quality gates → writes to Normalized Job Store.
* **Alternatives Considered:**
  * *Monolithic Synchronous Loop:* Rejected because a single slow Gemini call (e.g. 15s PDF OCR) blocks the entire scraping thread and causes rate-limiting or container memory exhaustion.
* **Trade-offs:** Eventual consistency across the pipeline; require distributed state tracking and dead-letter queue (DLQ) monitoring.
* **Consequences:** Failure isolation. If the AI Extraction service experiences rate limits or upstream API degradation, crawlers continue ingesting raw government documents at full speed without loss. Documents queue safely in Cloud Pub/Sub / Cloud Tasks until AI extractors resume.
* **Scalability & Queue Design:**
  * Dedicated Queue per workload tier: `crawl-queue-high-freq`, `crawl-queue-standard`, `extraction-queue-pdf`, `extraction-queue-html`.
  * Exponential backoff retry strategy: $2^n \times 1000\text{ms}$ up to 5 attempts, followed by dead-letter queue routing (`dlq-extraction-failed`).
* **Future AI Models:** Allows swapping or multi-prompting LLM models (e.g. Gemini 1.5 Flash, Gemini Pro, Fine-tuned models) without modifying crawler logic.

---

## ADR-003: Normalized Job Database Architecture

* **Status:** ACCEPTED / APPROVED
* **Context:** Government job postings contain unstructured Thai language, non-standard salary ranges, varied education naming conventions, and frequent duplicate publications across multiple news portals and agency mirrors. Storing raw extracted JSON directly in the main view store causes search degradation and inconsistent filtering.
* **Decision:** Strict separation between raw document metadata and normalized, deduplicated Job records.
  1. **Document Record:** Stores file metadata, raw hash, headers, source URL, crawl timestamp.
  2. **Job Record:** Stores standardized, validated schema fields (`title`, `agencyId`, `ocscLevel`, `salaryMin`, `salaryMax`, `provinceCode`, `applicationStartDate`, `applicationEndDate`, `officialPdfUrl`, `sourceDocumentId`, `fingerprintHash`).
  3. **Deduplication Engine:** Exact SHA-256 content deduplication + Semantic cross-source matching (matching `agencyId` + `positionTitle` + `applicationStartDate`).
* **Alternatives Considered:**
  * *Single Schema Document/Job Store:* Rejected because job details change across updates while original document remains immutable.
* **Trade-offs:** Requires schema transformation layer and explicit normalization algorithms.
* **Consequences:** Search queries run against clean, structured, indexed fields with sub-50ms response times. Deduplication prevents identical job announcements from appearing multiple times on the dashboard.
* **Historical Changes:** Job records preserve version history (`version`, `previousJobId`) to track official amendments or deadline extensions published by government agencies.

---

## ADR-004: Data Lineage & Cryptographic Evidence Chain

* **Status:** ACCEPTED / APPROVED
* **Context:** In national government recruitment intelligence, unverified or fabricated job announcements damage platform credibility and lead to legal liability. Every data point displayed on the user UI must be auditable back to the official government source publication.
* **Decision:** Implement a mandatory, end-to-end **Data Lineage Model**.
  * Every `JobRecord` must embed an immutable `LineageHeader`:
    ```json
    {
      "sourceId": "src-gov-ocsc-001",
      "officialSourceUrl": "https://job.ocsc.go.th/Main/GOVExam.aspx",
      "documentId": "doc-sha256-a3f890...",
      "documentHash": "a3f890e1189c...",
      "downloadTimestamp": "2026-08-02T20:15:00Z",
      "extractor": {
        "modelName": "gemini-1.5-flash",
        "promptVersion": "v2.4.1",
        "extractionTimestamp": "2026-08-02T20:15:12Z",
        "rawExtractionId": "ext-99201"
      },
      "textSegmentAnchor": {
        "pageNumber": 2,
        "boundingSnippet": "รับสมัครบุคคลเพื่อเลือกสรรเป็นพนักงานราชการทั่วไป..."
      },
      "validation": {
        "engineVersion": "v2.1.0",
        "rulesPassed": ["RULE-01", "RULE-02", "RULE-03", "RULE-04"],
        "confidenceScore": 0.98
      }
    }
    ```
* **Alternatives Considered:**
  * *Storing simple source URL string:* Rejected because URLs break, change, or redirect over time, losing exact evidentiary context.
* **Trade-offs:** Adds ~1.5KB of lineage metadata per job record.
* **Consequences:** Complete auditability. Clicking any field on the VERIIGO Dashboard highlights the exact text segment and original PDF document page from which the AI extracted the information.

---

## ADR-005: CQRS Search & Read Architecture

* **Status:** ACCEPTED / APPROVED
* **Context:** In V1, dashboard views performed live queries and full scans directly on operational database tables or triggered crawler logic, leading to query blockages, high database costs, and quota limits (`RESOURCE_EXHAUSTED`).
* **Decision:** Implement strict **Command Query Responsibility Segregation (CQRS)**.
  1. **Write Side (Command):** Crawler, Extraction Pipeline, and Validation Engine write exclusively to operational collections (`source_registry`, `document_lake_meta`, `jobs_normalized`).
  2. **Read Side (Query):** Dashboard, Search API, and Public Explorer read strictly from a dedicated **Search & View Store** (Elasticsearch / Cloud SQL Read Replica / Indexed Firestore Read Cache).
  3. Dashboard component handlers are **STRICTLY FORBIDDEN** from triggering crawler execution or performing unindexed collection scans.
* **Alternatives Considered:**
  * *Direct Firestore Collection Queries:* Rejected due to lack of full-text Thai search capabilities, high document read costs, and risk of hitting project quotas during user traffic spikes.
* **Trade-offs:** Small projection lag (typically <5 seconds) between job validation and search index availability.
* **Consequences:** Dashboard queries respond in under 50ms regardless of crawler activity. Database read quotas are protected. UI experience remains fast and resilient.

---

## ADR-006: Enterprise Failure Handling Policy

* **Status:** ACCEPTED / APPROVED
* **Context:** Previous systems exhibited silent fallbacks—when database queries failed or returned quota errors, system components returned mock seeds or empty arrays without alerting operators, creating a false impression of pipeline health.
* **Decision:** Enforce **Zero Silent Fallback & Zero Fake Success Policy**.
  * **No Silent Fallbacks:** Under no circumstances may production code fall back to hardcoded mock data or empty sets upon system failure.
  * **Explicit Fault Emission:** Every failure must emit a structured error log containing a `CorrelationID`, `StageID`, `SourceID`, and exact exception payload.
  * **Handling Matrix:**
    * *Firestore Quota / DB Unavailable:* Circuit breaker opens immediately. System emits `CRITICAL_INFRA_ALERT`, logs error to Cloud Logging, and queues retry tasks in exponential backoff.
    * *Gemini Timeout / API Error:* Extraction task fails gracefully, increments task attempt counter, and re-enqueues to `extraction-retry-queue` (max 5 attempts before DLQ).
    * *Crawler Timeout / SSL / 403:* Logged as `SOURCE_TRANSIENT_ERROR`. Retry worker attempts alternative user-agent / proxy pool with backoff.
    * *Corrupted / Broken PDF:* Document flagged as `DOCUMENT_CORRUPTED` in Document Lake; routed to Human Review Queue.
* **Consequences:** Complete operational visibility. System errors are immediately observable via monitoring dashboards rather than hidden behind fake UI success states.

---

## ADR-007: Mandatory Data Quality Gate & Validation Policy

* **Status:** ACCEPTED / APPROVED
* **Context:** Inaccurate job postings (e.g., incorrect application deadlines or wrong salary numbers) compromise user trust. AI extraction models can occasionally hallucinate or misinterpret complex Thai formatting.
* **Decision:** Implement a mandatory, automated **Data Quality Gate** (`JobValidationEngine v2`) before any job is marked `ACTIVE` for public display.
* **Validation Rules:**
  1. `RULE-VAL-01`: **Official Source Verification:** `officialSourceUrl` must match a verified government domain (`.go.th`, `.or.th`, `.mi.th`). Non-government URLs are rejected.
  2. `RULE-VAL-02`: **Deadline Validity:** `applicationEndDate` must be a valid ISO timestamp and must be $\ge$ `applicationStartDate`. If deadline is in the past, job status is set to `EXPIRED`.
  3. `RULE-VAL-03`: **Salary Range Sanity:** If specified, `salaryMin` and `salaryMax` must be numeric, $> 0$, and `salaryMin` $\le$ `salaryMax`. Unusual ranges ($> 300,000$ THB/mo) trigger soft review.
  4. `RULE-VAL-04`: **Mandatory Text Completeness:** Title length $\ge 5$ chars; Organization Name $\ge 3$ chars; Province code valid ISO/Thai province.
  5. `RULE-VAL-05`: **Confidence Threshold:** Overall extraction confidence score must be $\ge 0.85$.
* **Human Review Routing:** Any extracted job failing Quality Gate with confidence between $0.60$ and $0.84$ is routed to the `human_review_queue`. Jobs with confidence $< 0.60$ are rejected.

---

## ADR-008: Enterprise Observability & Lineage Tracking

* **Status:** ACCEPTED / APPROVED
* **Context:** Tracking millions of document extractions across 3,000+ sources requires unified tracing and metrics across all pipeline stages.
* **Decision:** Deploy standard **OpenTelemetry Distributed Tracing & Metrics Framework**.
  * **Correlation ID:** Every ingestion workflow generates a unique `traceId` (`veriigo-trc-XXXXXX`) at the crawler stage. This `traceId` is propagated through Pub/Sub headers, Cloud Tasks, Gemini prompt metadata, Firestore writes, and API responses.
  * **Core Service Level Indicators (SLIs):**
    * *Crawler Ingestion Success Rate:* Target $\ge 99.5\%$
    * *Document Extraction Latency (P95):* Target $< 8.0$ seconds
    * *Extraction Accuracy (Ground Truth Sample Audit):* Target $\ge 99.0\%$
    * *End-to-End Ingestion Lag (Crawl to Search Index):* Target $< 60$ seconds
  * **Alerting Thresholds:**
    * `ALERT-P1`: > 10 consecutive crawler failures for any tier-1 government source.
    * `ALERT-P1`: Firestore / Database error rate $> 1.0\%$.
    * `ALERT-P2`: Gemini extraction error rate $> 3.0\%$.

---

## ADR-009: Horizon Scaling Architecture (124 → 3,000+ Sources)

* **Status:** ACCEPTED / APPROVED
* **Context:** Scaling from 124 initial government sources to 3,000+ national sources (including municipal sub-districts, local administrative organizations, provincial hospitals, and public universities) increases daily document throughput by 25x.
* **Decision:** Partition and scale horizontal worker pools by source tier and crawl schedule:
  * **Source Partitioning Strategy:**
    * *Tier 1 (National Ministries / OCSC):* High frequency (Crawl every 1–3 hours). High priority queue.
    * *Tier 2 (Provincial Offices / Universities):* Medium frequency (Crawl every 6–12 hours). Standard queue.
    * *Tier 3 (Local Administrative Orgs / SAO / Sub-districts):* Low frequency (Crawl daily/weekly). Batch queue.
  * **Horizontal Scaling Boundaries:**
    * Worker pools run on Cloud Run / Kubernetes with Auto-scaler based on Queue Depth metrics (`pubsub.googleapis.com/subscription/num_undelivered_messages`).
    * Database writes are batched and rate-limited to stay within provisioned database IOPs.
    * Gemini API requests use dynamic sliding-window rate limiters with client-side bucket concurrency algorithms.

---

## ADR-010: Technology Decision Matrix

| Technology Component | Evaluated Purpose | Strengths | Weaknesses / Limits | Final Decision | Justification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cloud Storage (GCS)** | Raw Document Lake (PDF/HTML/Images) | Unlimited scale, 99.999999999% durability, native versioning & retention policies | Object latency higher than RAM/SSD | **SELECTED (Primary Document Lake)** | Immutable storage for millions of raw files with lifecycle rules. |
| **Cloud Tasks / Pub/Sub** | Asynchronous Event Pipeline | Guarantees at-least-once delivery, horizontal concurrency control, DLQ support | Requires idempotent consumer design | **SELECTED (Pipeline Backbone)** | Decouples crawlers, extractors, and indexers cleanly. |
| **Gemini 1.5 Flash / Pro** | Unstructured Thai Document Extraction | Multimodal native PDF OCR, Thai language understanding, structured JSON output | API rate limits, requires retry handling | **SELECTED (AI Extraction Engine)** | Industry-leading Thai document extraction accuracy and context window. |
| **Cloud SQL (PostgreSQL)** | Normalized Job Store & Lineage Database | ACID compliance, complex JSONB indexing, relational integrity, zero quota exhaustion | Higher fixed monthly cost than serverless NoSQL | **SELECTED (Primary Normalized Store)** | Relational structure ideal for complex queries, deduplication, and joins. |
| **Firestore (Serverless)** | Operational Cache & Real-time State | Fast document read/write, native real-time subscriptions | Strict daily free quota limits, costly full collection scans | **SELECTED (Caching & Real-Time Sync Only)** | Used strictly for metadata caching and live UI subscriptions; NOT for raw document storage. |
| **Elasticsearch / Cloud Search** | Full-Text Search Engine | Sub-20ms Thai tokenization, fuzzy search, faceted filtering | Operational management overhead | **SELECTED (Search Index Layer)** | Delivers instant UI search performance across millions of historical jobs. |

---

## ADR-011: Official VERIIGO Architecture Principles

The following 20 core architectural principles are binding for all engineering decisions across VERIIGO V2:

1. **Document First:** No job announcement exists in the platform without an immutable, verified raw source document in the Document Lake.
2. **Every Conclusion is Traceable:** Every extracted field must be deterministically linked to its original source URL, document hash, and bounding text segment.
3. **No Silent Fallbacks:** Errors must be explicitly logged and surfaced. Falling back to mock data or empty sets on failure is strictly forbidden.
4. **Immutable Raw Storage:** Raw ingested documents are written once and never updated or deleted.
5. **Event-Driven Architecture:** All heavy processing (crawling, downloading, extracting, indexing) must occur asynchronously via event queues.
6. **Command-Query Responsibility Segregation (CQRS):** Search and read paths are isolated from ingestion write paths.
7. **Zero Full Collection Scans:** Database queries must use indexed, paginated, boundary-constrained clauses (`where`, `limit`, `startAfter`).
8. **Schema-First Design:** All data contracts between services are defined by strict TypeScript / JSON schemas.
9. **Idempotent Processing:** Re-processing the same document or re-running an extraction pipeline must produce identical, deterministic results without duplicate records.
10. **Observable Everything:** Every request, job task, and extraction step must propagate a global Correlation ID.
11. **Quality Gate Supremacy:** Unverified or low-confidence AI extractions must never be published directly to public dashboards.
12. **Defense in Depth Security:** Public source access, service service communication, and administrative portals operate under least-privilege IAM controls.
13. **Graceful Degraded Mode:** If AI services are degraded, document crawling and raw storage must continue uninhibited.
14. **Deduplication at Ingestion:** Cryptographic hashing and semantic deduplication occur before database write operations.
15. **Stateless Worker Compute:** All crawler and extraction workers must be completely stateless to allow infinite horizontal auto-scaling.
16. **Versioned AI Prompts & Models:** All extraction records store the exact prompt template version and model parameter set used during inference.
17. **Bounded Resource Quotas:** External API calls (Gemini, government portals) must be governed by token-bucket rate limiters.
18. **Human-in-the-Loop Safeguards:** Low-confidence extractions are automatically routed to a dedicated human audit workflow.
19. **Zero-Trust Input Validation:** All crawled content is treated as untrusted and sanitized before rendering or extraction.
20. **Audit Log Permanence:** System configuration changes, review decisions, and manual overrides are logged to an append-only audit trail.

---

## ADR-012: Engineering Guardrails & Enforcement Rules

* `GUARD-01`: **NEVER** overwrite or modify raw document binaries in Cloud Storage.
* `GUARD-02`: **NEVER** perform unindexed or unbounded queries (`getDocs(collection())`) against production databases.
* `GUARD-03`: **NEVER** execute synchronous AI extraction inside API request-response handlers.
* `GUARD-04`: **NEVER** catch database exceptions and return hardcoded mock data in production builds.
* `GUARD-05`: **ALWAYS** enforce mandatory pagination with maximum limit $\le 100$ items per page.
* `GUARD-06`: **ALWAYS** validate Thai government source URLs against the official verified domain whitelist (`.go.th`, `.or.th`, `.mi.th`).
* `GUARD-07`: **ALWAYS** verify line-level text anchor coordinates when outputting AI extracted fields.
* `GUARD-08`: **NEVER** deploy schema modifications without tested, zero-downtime rollback scripts.

---

## ARCHITECTURE GOVERNANCE & PRODUCTION READINESS

### 1. Architecture Governance Model
* **Architecture Review Board (ARB):** Meets weekly to review proposed ADR modifications, schema updates, and performance benchmarks.
* **Automated ADR Compliance CI Pipeline:** Pull requests are automatically analyzed by static linter rules checking for forbidden query patterns (e.g., unbounded collection scans, synchronous extraction calls, or missing lineage fields).

### 2. Engineering Checklist
- [x] Immutable Document Lake configured with versioning enabled.
- [x] Cloud Tasks / Pub/Sub queues provisioned with Dead-Letter Queues (DLQ).
- [x] Quality Gate validation rules configured with Thai official domain rules.
- [x] OpenTelemetry correlation context propagation enabled across all endpoints.
- [x] Indexed read queries configured with strict pagination limits.

### 3. Release Approval Checklist
- [x] All 12 ADRs formally approved by Principal Architecture Board.
- [x] Automated linter rules passing with zero errors (`tsc --noEmit`).
- [x] Lineage verification tests passing for 100% of sample documents.
- [x] Circuit breaker handlers verified under simulated API quota failures.
- [x] Zero silent fallbacks confirmed across repository query layers.

### 4. Production Readiness Matrix

| Architectural Subsystem | Readiness Status | Target Metric | Verified Capability |
| :--- | :---: | :--- | :--- |
| **Document Lake** | **READY** | $100\%$ Immutable Storage | SHA-256 Hash Verification & GCS Retention |
| **Crawler Engine** | **READY** | $3,000+$ Sources | Asynchronous Queue Worker Auto-scaling |
| **AI Extraction Pipeline** | **READY** | $< 8.0\text{s}$ P95 Latency | Gemini Flash Multimodal PDF Parsing |
| **Data Lineage Engine** | **READY** | $100\%$ Lineage Coverage | Bounding Text Anchor & Hash Verification |
| **CQRS Read/Search Layer** | **READY** | $< 50\text{ms}$ Response Time | Indexed Paginated Search Cache |
| **Observability & Alerts** | **READY** | $100\%$ Trace Propagation | OpenTelemetry Correlation ID Tracking |

---
**Approved by:**
*Chief Software Architect, VERIIGO Government Job Intelligence Platform*
