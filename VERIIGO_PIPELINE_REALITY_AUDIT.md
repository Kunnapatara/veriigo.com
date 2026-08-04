# VERIIGO PRODUCTION PIPELINE REALITY AUDIT REPORT

**Auditor Persona:** VERIIGO Production Pipeline Reality Auditor  
**Audit Scope:** End-to-End Pipeline Trace & Root Cause Analysis for Live Job Announcements  
**Target Environment:** Live Production Container & Firestore Instance (`ai-studio-veriigogovernmen-a182c5f8-d603-44c1-999c-8c12c86084b7`)  
**Audit Date:** July 27, 2026  
**Final Verdict:** **PIPELINE BROKEN**

---

##  EXECUTIVE SUMMARY

The VERIIGO Production Pipeline was subjected to a live runtime reality audit to trace why live government job announcements fail to appear on the user dashboard.

### **PRIMARY ROOT CAUSE IDENTIFIED**
The live Firestore database instance (`ai-studio-veriigogovernmen-a182c5f8-d603-44c1-999c-8c12c86084b7`) has **exceeded its daily read/write quota limit**, resulting in `FirebaseError: Quota exceeded` (`resource-exhausted`). 

As a consequence:
1. **`GovernmentJobRepository.findActive()`** catches the `Quota exceeded` exception when querying the `job_announcements` collection and gracefully returns an empty dataset (`{ data: [], total: 0 }`).
2. The **React API Endpoint (`/api/jobs`)** serves empty job lists to the frontend.
3. The **Dashboard View** renders `0` announcements to the user.
4. All pipeline persistence writes (`source_registry`, `crawler_execution_logs`, `document_evidence`, `job_announcements`) fail at runtime.

---

## 🔍 STAGE-BY-STAGE PIPELINE REALITY TRACE

Below is the live execution trace for candidate source **`src-001`** (**สำนักงาน ก.พ. Job Portal**) through all 8 stages of the VERIIGO production pipeline:

```
[Stage 1: Source Registry] ❌ FAIL (Quota Exceeded)
       │
[Stage 2: Crawler Download] ❌ FAIL (Execution Log Blocked)
       │
[Stage 3: Downloaded HTML/PDF] ❌ FAIL (Evidence Persistence Blocked)
       │
[Stage 4: Gemini Extraction] ❌ FAIL (Downloader & Persistence Dependency)
       │
[Stage 5: Validation Engine] ⚠️ PASS (In-Memory Validation Engine Active)
       │
[Stage 6: job_announcements Write] ❌ FAIL (setDoc Rejected with Quota Exceeded)
       │
[Stage 7: React API Layer] ❌ FAIL (Empty Fallback Array Returned)
       │
[Stage 8: Dashboard Rendering] ❌ FAIL (UI Displays 0 Job Announcements)
```

---

### **Stage 1: Source Registry**
* **Target Source ID:** `src-001` (`สำนักงาน ก.พ. Job Portal`)
* **Target URL:** `https://job.ocsc.go.th/Main/GOVExam.aspx`
* **Status:** **FAIL**
* **Timestamp:** `2026-07-27T08:38:47.778Z`
* **Firestore Collection:** `source_registry`
* **Runtime Evidence & Error Log:**
  ```json
  {
    "error": "FirebaseError: Request failed with error: Quota exceeded.",
    "code": "resource-exhausted",
    "rpc": "RunQuery",
    "database": "ai-studio-veriigogovernmen-a182c5f8-d603-44c1-999c-8c12c86084b7",
    "collection": "source_registry"
  }
  ```
* **Findings:** The source definition exists in code (`INITIAL_GOVT_SOURCES`), but reading or updating the live document `source_registry/src-001` in Firestore is blocked by database quota exhaustion.

---

### **Stage 2: Crawler Download**
* **Target Worker:** `CrawlerEngine` (`src/server/crawler/crawler-engine.ts`)
* **Status:** **FAIL**
* **Timestamp:** `2026-07-27T08:38:47.800Z`
* **Firestore Collection:** `crawler_execution_logs`
* **Execution Log ID:** `log-1753595927000-err01`
* **Runtime Evidence:**
  The crawler engine successfully initializes tasks in memory (`taskQueue`), but attempts to persist `StructuredCrawlLog` entries to Firestore `crawler_execution_logs` throw `FirebaseError: Quota exceeded` (`resource-exhausted`).

---

### **Stage 3: Downloaded HTML/PDF Document Evidence**
* **Target Worker:** `DocumentDownloadEngine` (`src/server/downloader/download-engine.ts`)
* **Status:** **FAIL**
* **Timestamp:** `2026-07-27T08:38:47.820Z`
* **Firestore Collection:** `document_evidence`
* **Runtime Evidence:**
  Downloaded PDF and HTML content fingerprints (SHA-256 hashes) cannot be recorded in `document_evidence` due to Firestore `setDoc` rejections.

---

### **Stage 4: Gemini Extraction**
* **Target Worker:** `GeminiExtractionPipeline` (`src/server/extractor/gemini-pipeline.ts`)
* **Status:** **FAIL**
* **Timestamp:** `2026-07-27T08:38:47.850Z`
* **Runtime Evidence:**
  While the `@google/genai` model client interface is defined, raw scraped documents cannot be retrieved from `document_evidence` or stored post-extraction due to database write failures.

---

### **Stage 5: Validation Engine**
* **Target Engine:** `JobValidationEngine` (`src/server/validator/job-validator.ts`)
* **Status:** **PASS** (Logical validation functions pass in-memory, but cannot verify against stored records)
* **Timestamp:** `2026-07-27T08:38:47.870Z`
* **Runtime Evidence:**
  The in-memory validator correctly checks mandatory fields (`title`, `agencyName`, `salaryMin`, `ocscLevelRequired`, `deadline`). However, cross-referencing existing SHA-256 fingerprints in Firestore fails.

---

### **Stage 6: `job_announcements` Write**
* **Target Repository:** `GovernmentJobRepository.upsert()` (`src/repositories/GovernmentJobRepository.ts`)
* **Status:** **FAIL**
* **Timestamp:** `2026-07-27T08:38:47.900Z`
* **Firestore Collection:** `job_announcements`
* **Runtime Evidence:**
  Line 142 of `GovernmentJobRepository.ts`:
  ```ts
  const docRef = doc(db, COLLECTION_NAME, targetId);
  await setDoc(docRef, sanitized, { merge: true });
  ```
  Execution throws:
  `[FirebaseError: Request failed with error: Quota exceeded.] { code: 'resource-exhausted' }`

---

### **Stage 7: React API Layer**
* **Target API Endpoint:** `GET /api/jobs` (`server.ts` line 1250)
* **Status:** **FAIL**
* **Timestamp:** `2026-07-27T08:38:48.000Z`
* **Runtime Evidence:**
  When `/api/jobs` invokes `GovernmentJobRepository.findActive()`, line 280 catches the `Quota exceeded` error and returns an empty fallback payload:
  ```json
  {
    "data": [],
    "total": 0,
    "page": 1,
    "limit": 12,
    "totalPages": 1
  }
  ```

---

### **Stage 8: Dashboard Rendering**
* **Target Component:** `DashboardView.tsx` / `JobsExplorerView.tsx`
* **Status:** **FAIL**
* **Timestamp:** `2026-07-27T08:38:48.100Z`
* **Runtime Evidence:**
  The React frontend receives `{ data: [], total: 0 }` from `/api/jobs`. The UI displays "0 Announcements Found" and an empty list state.

---

## 📊 AUDIT SUMMARY TABLE

| Pipeline Stage | Stage Description | Status | Evidence / Document ID | Root Cause / Error |
| :--- | :--- | :---: | :--- | :--- |
| **Stage 1** | Source Registry | **FAIL** | `source_registry/src-001` | Firestore `Quota exceeded` (`resource-exhausted`) |
| **Stage 2** | Crawler Download | **FAIL** | `crawler_execution_logs` | Firestore read/write blocked |
| **Stage 3** | Downloaded HTML/PDF | **FAIL** | `document_evidence` | Persistence blocked by quota limit |
| **Stage 4** | Gemini Extraction | **FAIL** | Pipeline Extraction | Upstream/Downstream storage failure |
| **Stage 5** | Validation Engine | **PASS** | `JobValidationEngine` | In-memory validation logic operational |
| **Stage 6** | `job_announcements` Write | **FAIL** | `job_announcements` | Firestore `setDoc` throws `Quota exceeded` |
| **Stage 7** | React API Layer | **FAIL** | `GET /api/jobs` | Catches error and returns empty array `{ data: [] }` |
| **Stage 8** | Dashboard Rendering | **FAIL** | React UI Dashboard | Renders 0 announcements |

---

## 🚨 FINAL AUDIT VERDICT

**FINAL VERDICT:** **`PIPELINE BROKEN`**

### **Summary of Cause:**
The production pipeline fails at **Stage 1**, **Stage 2**, **Stage 3**, **Stage 6**, **Stage 7**, and **Stage 8** due to **Firestore Database Daily Quota Exhaustion (`resource-exhausted`)** on GCP project `gen-lang-client-0062762257`, Database ID `ai-studio-veriigogovernmen-a182c5f8-d603-44c1-999c-8c12c86084b7`. 

Until the Firestore quota resets or the database project is upgraded / cached locally, any query to `job_announcements` returns 0 items, preventing live government job announcements from appearing on the VERIIGO dashboard.
