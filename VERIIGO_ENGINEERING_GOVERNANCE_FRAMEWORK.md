# VERIIGO ENGINEERING GOVERNANCE FRAMEWORK & CONSTITUTION

**Document Status:** OFFICIAL & BINDING  
**Authority:** Chief Enterprise Architect & Technical Governance Lead  
**Target Platform:** VERIIGO National Government Recruitment Intelligence Platform  
**Scope:** Architecture Review Board (ARB), Data Governance, AI Safety, Quality Gates, RFC Process, Release Standards  
**Effective Date:** August 2026  

---

## SECTION 1: ENGINEERING LIFECYCLE

The VERIIGO Engineering Lifecycle governs all modifications across the platform—spanning crawler engines, data lake storage, AI extraction pipelines, search indexing, and frontend analytics.

```
Idea ──► RFC Draft ──► ARB Review ──► Security Review ──► Data Gov Review ──► Approval ──► Implementation ──► Testing ──► Deployment ──► PIR
```

### 1. Stage Definitions & Authorities

| Stage | Purpose | Required Inputs | Required Outputs | Approval Authority | Exit Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Idea** | Problem identification & high-level concept formulation | Issue ticket or strategic feature request | Problem statement & scope declaration | Tech Lead / Staff Engineer | Clear statement of value & alignment with platform goals |
| **2. RFC Draft** | Formal technical proposal & architecture design | Idea concept, ADR alignment | Complete RFC Document (Markdown) | Author / Lead Architect | RFC Template fully populated with no blank sections |
| **3. Architecture Review** | Evaluation of system impact, scalability, and ADR compliance | RFC Document | ARB Review Comments & Decision | Enterprise Architecture Board (ARB) | Consensus or 2/3 ARB vote approval |
| **4. Security Review** | Threat modeling, IAM analysis, and vulnerability assessment | RFC Document & System Diagram | Security Risk Assessment & Controls | Chief Information Security Officer (CISO) | Zero unmitigated Critical/High security risks |
| **5. Data Governance Review** | Lineage validation, schema impact, retention & privacy audit | RFC Document & Data Contracts | Data Lineage & Schema Approval | Data Governance Board (DGB) | Schema backwards compatibility & lineage chain verified |
| **6. Approval** | Formal authorization to proceed with implementation | ARB, Security, Data Gov sign-offs | Approved RFC status (`STATUS: APPROVED`) | Principal Enterprise Architect | All mandatory review sign-offs recorded |
| **7. Implementation** | Code execution, test development, and documentation | Approved RFC | Pull Request(s), Unit & Integration Tests | Engineering Team | Code complete, 100% linter passing, tests passing |
| **8. Testing & Validation** | Automated CI/CD execution, staging verification, load tests | PR & Staging Environment | Test Execution Logs, Benchmark Metrics | QA Lead / Automation Suite | Quality Gates passed, zero regression errors |
| **9. Deployment** | Production release execution via canary or blue/green | Approved Release Ticket | Production Deployment & Smoke Verification | Release Manager / Ops Lead | Post-deployment smoke tests 100% green |
| **10. Post-Impl Review (PIR)** | Evaluate real-world outcome against RFC goals | Production Observability Data (SLOs) | PIR Report & Lessons Learned | ARB & Lead Author | System SLOs met over 14-day evaluation window |

---

## SECTION 2: OFFICIAL RFC TEMPLATE

Every feature, schema change, crawler enhancement, or infrastructure update **MUST** submit an RFC using the standardized markdown format below:

```markdown
# RFC-[NUMBER]: [TITLE OF PROPOSAL]

* **Authors:** [Name, Role, Email]
* **Status:** [DRAFT | UNDER_REVIEW | APPROVED | REJECTED | SUPERSEDED]
* **Created Date:** [YYYY-MM-DD]
* **Target Release:** [vX.Y.Z]
* **ADR Compliance:** [ADR-001, ADR-002, ADR-003, ...]

---

## 1. EXECUTIVE SUMMARY & PROBLEM STATEMENT
[Provide a concise 2-3 paragraph summary of the problem and proposed solution.]

## 2. GOALS & NON-GOALS
### Goals
* Goal 1: ...
* Goal 2: ...

### Non-Goals
* Non-Goal 1: ...

## 3. ARCHITECTURAL IMPACT & SYSTEM TOPOLOGY
[Describe affected subsystems: Document Lake, Crawler Engine, AI Pipeline, Search Index, Frontend.]

## 4. ADR COMPLIANCE ANALYSIS
[Verify compliance with ADR-001 through ADR-012. Explicitly note any required exceptions or new ADR proposals.]

## 5. DATA CONTRACTS & SCHEMA EVOLUTION
[Detail all new/modified schemas, database collections, and API payloads.]

## 6. AI GOVERNANCE & LINEAGE IMPACT
* **Model(s) Used:** [e.g., Gemini 1.5 Flash]
* **Prompt Version:** [e.g., v2.4.0]
* **Lineage Tracking:** [Describe how bounding text anchors and raw document hashes are preserved.]
* **Confidence Threshold:** [e.g., >= 0.85]

## 7. SECURITY, PRIVACY & COMPLIANCE
[Detail IAM policies, encryption standards, Thai PDPA privacy compliance, and URL whitelist checks.]

## 8. PERFORMANCE, SCALABILITY & COST IMPACT
* **Latency Impact:** [Target P95 response time]
* **Throughput Impact:** [Target requests per second]
* **Cost Projection:** [Estimated monthly GCS, Cloud Run, and Gemini API cost changes]

## 9. MIGRATION & ROLLBACK STRATEGY
* **Phase 1:** ...
* **Phase 2:** ...
* **Rollback Trigger:** [Specify metrics or error rates that trigger an automatic rollback]

## 10. OBSERVABILITY & SLI/SLO MONITORING
* **Correlation ID Propagation:** [Yes/No]
* **New Metrics:** [List custom OpenTelemetry metrics]
* **Alert Thresholds:** [P1/P2 alert triggers]

## 11. APPROVAL SIGNATURES
* [ ] Enterprise Architecture Board (ARB Lead)
* [ ] Chief Information Security Officer (CISO)
* [ ] Data Governance Officer (DGO)
* [ ] Lead Release Engineer
```

---

## SECTION 3: RFC CATEGORIES

All proposals must be tagged with exactly one primary category and zero or more secondary tags:

1. **Architecture (`CAT-ARCH`):** Subsystem boundaries, decoupling, CQRS models, event streaming structures.
2. **Infrastructure (`CAT-INFRA`):** Cloud Run, Pub/Sub queues, Cloud Tasks, networking, IAM policies.
3. **Crawler Engine (`CAT-CRAWL`):** Discovery heuristics, HTML/PDF scraping algorithms, rate limiting, proxy management.
4. **AI Extraction (`CAT-AI`):** Gemini prompts, model version upgrades, multimodal OCR pipelines, parsing schemas.
5. **Data Lineage (`CAT-LINEAGE`):** Cryptographic verification, text anchor coordinates, audit logs, provenance tracking.
6. **Document Lake (`CAT-LAKE`):** Object storage lifecycle, versioning, SHA-256 deduplication, binary retention policies.
7. **Search & Indexing (`CAT-SEARCH`):** Full-text search, Thai language tokenization, query caching, indexing.
8. **Authentication & Security (`CAT-SEC`):** OAuth2, Firebase Auth, RBAC, API key rotation, vulnerability mitigation.
9. **Database & Persistence (`CAT-DB`):** PostgreSQL/Firestore schema evolution, migrations, index optimization.
10. **Frontend & UX (`CAT-UI`):** Dashboard views, analytics charts, response state handling, filtering components.
11. **Observability & Ops (`CAT-OPS`):** OpenTelemetry tracing, log aggregation, alerting thresholds, SLO tracking.
12. **Compliance & Legal (`CAT-COMP`):** Government data privacy (PDPA), source verification, regulatory auditing.

---

## SECTION 4: ARCHITECTURE REVIEW BOARD (ARB)

### 1. Composition & Roles
* **Chairperson:** Chief Enterprise Architect (Final tie-breaking vote).
* **Permanent Members:** Principal Infrastructure Architect, Principal Data Architect, Lead Security Engineer, Staff AI Engineer, Lead Product Engineer.

### 2. Responsibilities
* Enforce adherence to the VERIIGO Constitution and ADRs (ADR-001 through ADR-012).
* Conduct weekly RFC review sessions.
* Authorize system-wide architectural modifications.
* Arbitrate technical disputes between engineering teams.

### 3. Approval Thresholds & Escalation Rules
* **Standard RFC:** Requires approval from at least 3 ARB members (including Lead Architect).
* **Major / Breaking RFC:** Requires unanimous approval from all 5 ARB members.
* **Escalation:** If consensus is not reached within 14 days, the proposal is escalated to the Chief Technology Officer (CTO) for final disposition.

### 4. Emergency Approval Protocol
In the event of a Critical Production Outage (Severity 0 / Severity 1):
1. Emergency RFC (`STATUS: EMERGENCY`) can be verbally authorized by the ARB Chair and CISO.
2. Implementation and deployment proceed immediately under direct supervision.
3. Formal post-facto RFC documentation and ARB review must be completed within 48 hours of incident resolution.

---

## SECTION 5: DATA GOVERNANCE BOARD (DGB)

The Data Governance Board manages data contracts, schema integrity, and lineage auditability.

### 1. Governance Directives
* **Schema Evolution:** All database collection schemas must maintain backwards compatibility for a minimum of 2 major release versions. Field deprecations require a 90-day deprecation notice.
* **Versioning:** Schemas are versioned explicitly (e.g. `JobAnnouncementSchema_v2.json`). Breaking schema changes require a new collection or endpoint version.
* **Retention & Deletion Policy:** Raw document binaries in the Document Lake have a mandatory 7-year retention policy. Deletion is restricted by WORM (Write Once, Read Many) object lock policies.
* **Immutable Data Protection:** Mutation or overwrite of raw document records in `document_lake_meta` or raw binaries is technically prevented at the IAM and storage tier.
* **Lineage Chain Audit:** Every automated job record write is verified against the SHA-256 hash of its source document before insertion into the normalized job store.

---

## SECTION 6: AI GOVERNANCE FRAMEWORK

To prevent hallucinations, ensure reproducible extraction, and maintain absolute auditability of AI-derived insights:

### 1. Versioning Triad
Every AI extraction result stored in the system must record the exact **Versioning Triad**:
1. `PromptVersion`: e.g. `prompt-th-gov-job-v2.4.1`
2. `ModelVersion`: e.g. `gemini-1.5-flash-002`
3. `ValidationVersion`: e.g. `validator-gate-v3.1.0`

### 2. Confidence Thresholds & Human Review Routing
* **High Confidence ($\ge 0.85$):** Passed automatically through Quality Gate to Public Job Store.
* **Medium Confidence ($0.60 - 0.84$):** Routed to `human_review_queue`. Requires manual verification by an authorized operator before publishing.
* **Low Confidence ($< 0.60$):** Rejected automatically. Document flagged for prompt re-tuning or custom OCR template parsing.

### 3. Anti-Hallucination & Provenance Verification
* AI output must contain direct text snippets (`boundingSnippet`) extracted verbatim from the raw document.
* Automated validation scripts execute verbatim string matching between extracted snippets and raw document OCR text. Any mismatch instantly sets confidence to `0.00`.

---

## SECTION 7: CHANGE MANAGEMENT & CHANGE CLASSES

| Change Class | Definition | Approval Required | Testing Required | Deployment Strategy | Rollback Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Minor** | Bug fixes, visual UI tweaks, non-breaking copy changes | Tech Lead | Unit Tests, Visual Regression | Standard CI/CD Pipeline | One-click automated rollback |
| **Standard** | New non-breaking feature, crawler performance upgrade | ARB Member + Tech Lead | Integration Tests, Staging Verification | Blue/Green Deployment | Automated script rollback within 5 minutes |
| **Major** | Infrastructure update, new database index, model upgrade | Full ARB (3+ members) + DGB | Load Tests, Staging Full Suite, Shadow Traffic | Canary Deployment (10% → 50% → 100%) | Verified dual-run rollback strategy |
| **Breaking** | Schema refactor, API contract change, storage migration | Unanimous ARB + CISO + DGB | End-to-End Migration Test, Replay Validation | Phased Migration with Fallback Compatibility | Parallel dual-write database rollback plan |
| **Emergency** | Critical security patch, live production hotfix | ARB Chair + CISO | Automated Regression Suite | Immediate Accelerated Deployment | Direct container image rollback |

---

## SECTION 8: PRODUCTION READINESS REVIEW (PRR)

Before any RFC is authorized for production deployment, it must pass all 9 PRR dimensions:

1. **Architecture:** Decoupled design, no synchronous cross-boundary calls, compliant with ADR-001 through ADR-012.
2. **Security:** Zero high/critical vulnerabilities, IAM least-privilege verified, SSL/TLS transport enforced.
3. **Performance:** Meets P95 latency target ($< 8.0\text{s}$ extraction, $< 50\text{ms}$ search API), memory/CPU bounds verified.
4. **Observability:** OpenTelemetry traces, log correlation IDs, custom metrics, and dashboards configured.
5. **Data Quality:** Quality Gate rules active, schema validation passed, zero unvalidated AI outputs.
6. **Lineage:** 100% cryptographic source traceability, bounding snippet anchors present.
7. **Compliance:** Government source domain verified (`.go.th`, `.or.th`), Thai PDPA privacy rules respected.
8. **Disaster Recovery:** Circuit breakers verified under simulated outage, dead-letter queues active.
9. **Cost Review:** Financial impact projected and approved against quarterly cloud budget.

---

## SECTION 9: COMPLIANCE VERIFICATION MATRIX (ADR-001 TO ADR-012)

| ADR Reference | Requirement Summary | Automated Verification Method | Manual Audit Verification | Pass Criteria | Fail Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADR-001** | Immutable Document Lake | Automated GCS Bucket WORM Policy Check | Random sample verification of binary hashes | SHA-256 match & WORM active | Overwritten or missing binary |
| **ADR-002** | Event-Driven Pipeline | Static AST Analysis for async message handling | Queue depth & DLQ inspection | Zero sync extraction in HTTP handlers | Sync Gemini call inside HTTP handler |
| **ADR-003** | Normalized Job Database | Automated Schema Linter (`tsc --noEmit`) | Review of deduplication match rate | Clean structured schema insert | Raw unstructured JSON stored |
| **ADR-004** | Data Lineage | Automated Lineage Header Validation Script | Lineage audit trail check for sample jobs | $100\%$ lineage header population | Missing snippet or document hash |
| **ADR-005** | CQRS Search Architecture | Static Analysis for collection scan detection | Query performance profiling under load | Search reads from Search Index | Direct unindexed collection scan |
| **ADR-006** | Failure Handling | Circuit Breaker Unit Test Suite | Log audit during simulated DB outage | Zero silent fallback; explicit fault logged | Mock seed returned on DB error |
| **ADR-007** | Data Quality Gate | Quality Gate Integration Test Suite | Manual inspection of `human_review_queue` | All active jobs pass quality gate | Unverified job published to UI |
| **ADR-008** | Observability | OpenTelemetry Correlation ID Validator | Trace waterfall analysis in Cloud Trace | $100\%$ requests propagate `traceId` | Uncorrelated log or missing trace |
| **ADR-009** | Horizon Scalability | Auto-scaler Stress Test Script | Worker pool scaling evaluation | Workers scale smoothly under queue load | Worker thread lock / OOM crash |
| **ADR-010** | Technology Matrix | Static Dependency Linter | Infrastructure-as-Code audit | Approved tech stack used | Unapproved database or library |
| **ADR-011** | Architecture Principles | Static CI Analysis for Architectural Violations | Quarterly Architecture Audit | $0$ constitution violations | Direct breach of binding principles |
| **ADR-012** | Engineering Guardrails | Static Code Linter (`npm run lint`) | PR Guardrail Checklist Verification | All guardrail checks pass | Direct database scan or unpaginated query |

---

## SECTION 10: MANDATORY QUALITY GATES

Production CI/CD pipelines will automatically reject any code merge or deployment that violates these 8 Quality Gates:

```
[Quality Gate 1: No Unindexed Scans]   ---> PASS
[Quality Gate 2: No Silent Fallback]    ---> PASS
[Quality Gate 3: Validated AI Output]   ---> PASS
[Quality Gate 4: 100% Data Lineage]     ---> PASS
[Quality Gate 5: Strict Schema Match]   ---> PASS
[Quality Gate 6: Mandatory Pagination]  ---> PASS
[Quality Gate 7: Exponential Backoff]   ---> PASS
[Quality Gate 8: OpenTelemetry Traces]  ---> PASS
```

1. **Gate 1 (No Unindexed Scans):** Static analysis forbids `getDocs(collection())` without explicit `where()` and `limit()` clauses.
2. **Gate 2 (No Silent Fallback):** Code must not catch database or API exceptions and silently return mock seed data.
3. **Gate 3 (Validated AI Output):** Every AI-extracted record must pass `JobValidationEngine` checks before public publication.
4. **Gate 4 (100% Data Lineage):** Jobs missing `officialSourceUrl`, `documentHash`, or `boundingSnippet` are rejected.
5. **Gate 5 (Strict Schema Match):** All data transformations must strictly match TypeScript interfaces (`tsc --noEmit` pass).
6. **Gate 6 (Mandatory Pagination):** All list endpoints enforce page limit bounds ($1 \le \text{limit} \le 100$).
7. **Gate 7 (Exponential Backoff):** All external HTTP/API integration calls must utilize retry mechanisms with exponential backoff.
8. **Gate 8 (OpenTelemetry Traces):** All service entry points must initialize and propagate `traceId` correlation headers.

---

## SECTION 11: REPOSITORY & MODULE OWNERSHIP STANDARDS

### 1. Directory Structure & Ownership

```
/src
├── /components         # [OWNER: Frontend Team] React UI & Dashboard Views
├── /context            # [OWNER: Frontend Team] React Context Providers
├── /repositories       # [OWNER: Data Platform Team] Database Access & CQRS
├── /server             # [OWNER: Backend Team] Server Logic & Pipeline Workers
│   ├── /crawler        # [OWNER: Data Ingestion Team] Crawler & Discovery Engine
│   ├── /downloader     # [OWNER: Data Ingestion Team] Document Lake Ingestion
│   ├── /extractor      # [OWNER: AI Platform Team] Gemini Pipeline & OCR
│   └── /validator      # [OWNER: Data Quality Team] Quality Gate & Lineage Engine
├── /types              # [OWNER: Architecture Board] Shared Type Definitions
└── /utils              # [OWNER: Platform Core] Shared Utilities & Logging
```

### 2. Dependency Rules
* `src/components` **MUST NOT** import from `src/server` directly.
* `src/repositories` **MUST NOT** import React components or client-side hooks.
* Shared types in `src/types` must remain framework-agnostic.

---

## SECTION 12: RELEASE GOVERNANCE WORKFLOW

```
Development ──► QA Automated ──► Staging Integration ──► Pilot Canary (10%) ──► Full Production
```

1. **Development:** Local environment execution; unit testing; strict linter checks.
2. **QA Automated:** Automated execution of end-to-end integration test suites on pull requests.
3. **Staging Integration:** Deployment to staging environment connected to staging Document Lake and test database.
4. **Pilot Canary (10%):** Production canary release serving 10% of background ingestion tasks. SLOs monitored for 2 hours.
5. **Full Production:** 100% traffic shift. Post-deployment monitoring active for 24 hours.
6. **Hotfix Protocol:** Critical fixes bypass staging but require ARB Lead sign-off and 100% unit test verification.
7. **Automated Rollback:** Triggered instantly if error rate exceeds $1.0\%$ or latency P95 exceeds $12.0\text{s}$ over a 5-minute window.

---

## SECTION 13: TECHNICAL DEBT GOVERNANCE

### 1. Technical Debt Register
All identified technical debt must be logged as a `TECH-DEBT` issue ticket specifying:
* Affected Subsystem
* Risk Score (1 to 10)
* Impact on Performance / Maintainability
* Remediation Plan & Target Release

### 2. Risk Scoring Formula
$$\text{Risk Score} = \text{Severity (1-5)} \times \text{Probability of Impact (1-2)}$$

### 3. Refactoring Allocation
Every engineering sprint allocates exactly **20% of capacity** to address items in the Technical Debt Register with Risk Score $\ge 6$.

---

## SECTION 14: ARCHITECTURE EVOLUTION PROCESS

Architecture Decision Records (ADRs) are living constitution documents.

1. **Adding an ADR:** Submit an RFC proposing the new ADR. Requires unanimous ARB approval.
2. **Deprecating an ADR:** Mark status as `DEPRECATED` with explanatory text referencing the replacing ADR.
3. **Superseding an ADR:** Mark status as `SUPERSEDED BY ADR-XXX`. The new ADR must detail why the prior decision is no longer optimal.
4. **Archiving:** Retired ADRs remain permanently visible in `/docs/adr/` for historical auditability.

---

## SECTION 15: FINAL DELIVERABLES & GOVERNANCE MANUALS

1. **VERIIGO Engineering Constitution:** Fully established in this document.
2. **RFC Process Guide:** Sections 1, 2, and 3 define the mandatory RFC creation and review flow.
3. **Architecture Governance Manual:** Sections 4 and 5 establish ARB and DGB operating rules.
4. **Engineering Compliance Checklist:** Section 9 provides automated and manual verification matrices for all 12 ADRs.
5. **Release Approval Checklist:** Section 12 establishes the 5-stage release pipeline criteria.
6. **Architecture Review Checklist:** Section 8 establishes the 9 PRR dimensions.
7. **Data Governance Checklist:** Section 5 defines retention, schema versioning, and lineage requirements.
8. **AI Governance Checklist:** Section 6 defines versioning, anti-hallucination rules, and human review routing.
9. **Operational Readiness Checklist:** Section 10 defines the 8 automated Quality Gates.
10. **Production Acceptance Checklist:** Final verification sign-off across all boards before public production deployment.

---

**Certified by:**  
*Chief Enterprise Architect & Technical Governance Lead*  
*VERIIGO National Government Recruitment Intelligence Platform*
