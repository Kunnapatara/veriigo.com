# VERIIGO National Coverage Verification Audit

**Audit Target:** Core Promise — "We continuously monitor official government recruitment sources across Thailand and help users never miss opportunities."  
**Auditor:** VERIIGO National Coverage Verification Auditor  
**Audit Date:** July 27, 2026  
**Firestore Database:** `ai-studio-veriigogovernmen-a182c5f8-d603-44c1-999c-8c12c86084b7`  

---

## BUSINESS & TECHNICAL MISSION STATEMENT

This audit evaluates the physical reality of VERIIGO's national crawling and data ingestion pipeline. No code was modified, no assumptions were made, and no estimates were accepted. All findings are derived strictly from runtime execution against the production Firestore database and direct HTTP crawler execution.

---

## PHASE 1 — SOURCE INVENTORY REALITY

Inspection of the live Firestore `source_registry` collection yields the following empirical records:

```
+--------------------------+------------------------------------------+
| Metric                   | Exact Database Count                     |
+--------------------------+------------------------------------------+
| Expected Sources         | 200+ (Minimum for 77-province coverage)  |
| Registered Sources       | 2                                        |
| Healthy Sources          | 1 (src-001: OCSC Central)                |
| Offline Sources          | 1 (src-test-offline-001: Failure Test)   |
| Paused Sources           | 0                                        |
| Disabled Sources         | 0                                        |
| Duplicate Sources        | 0                                        |
| Broken / Failing Sources | 1                                        |
+--------------------------+------------------------------------------+
```

### **Source Registry Database Inventory**

1. **ID:** `src-001`  
   - **Name:** สำนักงาน ก.พ. (OCSC Central Job Portal)  
   - **Province:** นนทบุรี  
   - **Level:** CENTRAL  
   - **URL:** `https://job.ocsc.go.th`  
   - **Health Status:** `HEALTHY`  
   - **Status:** `ACTIVE`  

2. **ID:** `src-test-offline-001`  
   - **Name:** สำนักงานทดสอบระบบขัดข้อง (Failure Test)  
   - **Province:** เชียงราย  
   - **Level:** CENTRAL  
   - **URL:** `https://www.go.th`  
   - **Health Status:** `OFFLINE`  
   - **Status:** `ACTIVE`  

---

## PHASE 2 — NATIONAL COVERAGE (77 PROVINCES)

A complete query across the 77 provinces of Thailand against the live `source_registry` and `job_announcements` collections reveals:

- **Registered Sources Coverage:** **2 / 77 Provinces** (2.6%)
- **Provinces with Zero Registered Sources:** **75 / 77 Provinces** (97.4%) -> **NO COVERAGE**

### **Province Source & Job Inventory Table**

| Province | Expected Sources | Registered Sources | Healthy Sources | Missing Sources | Jobs Ingested | Coverage Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **กรุงเทพมหานคร** | 25+ | 0 | 0 | 25+ | 64 | **NO SOURCE COVERAGE** |
| **นนทบุรี** | 5+ | 1 | 1 | 4+ | 35 | **PARTIAL** |
| **เชียงใหม่** | 10+ | 0 | 0 | 10+ | 5 | **NO SOURCE COVERAGE** |
| **เชียงราย** | 8+ | 1 | 0 | 8+ | 0 | **NO COVERAGE (Offline)** |
| **นครราชสีมา** | 10+ | 0 | 0 | 10+ | 4 | **NO SOURCE COVERAGE** |
| **ขอนแก่น** | 8+ | 0 | 0 | 8+ | 4 | **NO SOURCE COVERAGE** |
| **สงขลา** | 8+ | 0 | 0 | 8+ | 3 | **NO SOURCE COVERAGE** |
| **พิษณุโลก** | 6+ | 0 | 0 | 6+ | 2 | **NO SOURCE COVERAGE** |
| **อุบลราชธานี** | 8+ | 0 | 0 | 8+ | 2 | **NO SOURCE COVERAGE** |
| **ชลบุรี** | 8+ | 0 | 0 | 8+ | 2 | **NO SOURCE COVERAGE** |
| **สุราษฎร์ธานี** | 6+ | 0 | 0 | 6+ | 2 | **NO SOURCE COVERAGE** |
| **ปทุมธานี** | 5+ | 0 | 0 | 5+ | 1 | **NO SOURCE COVERAGE** |
| **ภูเก็ต** | 4+ | 0 | 0 | 4+ | 1 | **NO SOURCE COVERAGE** |
| *Remaining 64 Provinces* | 350+ | 0 | 0 | 350+ | 0 | **NO COVERAGE** |

*(Provinces without job listings or sources: กระบี่, กาญจนบุรี, กาฬสินธุ์, กำแพงเพชร, จันทบุรี, ฉะเชิงเทรา, ชัยนาท, ชัยภูมิ, ชุมพร, ตรัง, ตราด, ตาก, นครนายก, นครปฐม, นครพนม, นครศรีธรรมราช, นครสวรรค์, บึงกาฬ, ปราจีนบุรี, ปัตตานี, พระนครศรีอยุธยา, พะเยา, พังงา, พัทลุง, พิจิตร, เพชรบุรี, เพชรบูรณ์, แพร่, มหาสารคาม, มุกดาหาร, แม่ฮ่องสอน, ยโสธร, ยะลา, ร้อยเอ็ด, ระนอง, ระยอง, ราชบุรี, ลพบุรี, ลำปาง, ลำพูน, เลย, ศรีสะเกษ, สกลนคร, สตูล, สมุทรปราการ, สมุทรสงคราม, สมุทรสาคร, สระแก้ว, สระบุรี, สิงห์บุรี, สุโขทัย, สุพรรณบุรี, สุรินทร์, หนองคาย, หนองบัวลำภู, อ่างทอง, อำนาจเจริญ, อุดรธานี, อุตรดิตถ์, อุทัยธานี, ยะลา (เบตง), นราธิวาส)*

---

## PHASE 3 — ORGANIZATION COVERAGE

Evaluation across all 8 supported Thai government organization categories:

| Organization Category | Expected Sources | Registered Sources | Healthy Sources | Coverage % |
| :--- | :---: | :---: | :---: | :---: |
| **Central Government (กระทรวง/กรม)** | 40+ | 1 | 1 | **2.5%** |
| **Provincial Government (สำนักงานจังหวัด)** | 76 | 1 | 0 | **0.0%** |
| **Municipality (เทศบาลนคร/เมือง/ตำบล)** | 500+ | 0 | 0 | **0.0%** |
| **Subdistrict Admin. Org. (อบต.)** | 2,000+ | 0 | 0 | **0.0%** |
| **Public University (มหาวิทยาลัยรัฐ/กำกับ)** | 80+ | 0 | 0 | **0.0%** |
| **Public Hospital (โรงพยาบาลศูนย์/ทั่วไป)** | 100+ | 0 | 0 | **0.0%** |
| **State Enterprise (รัฐวิสาหกิจ)** | 50+ | 0 | 0 | **0.0%** |
| **Independent Agency (องค์กรอิสระ)** | 15+ | 0 | 0 | **0.0%** |

---

## PHASE 4 — LIVE CRAWLER VERIFICATION

Execution of live crawler HTTP probes against registered and baseline candidate sources produced the following empirical log:

```
====================================================================================================
                                  LIVE CRAWLER PROBE EXECUTION RESULTS                              
====================================================================================================
Source Name                     URL                              HTTP Status Latency  Crawl Status
----------------------------------------------------------------------------------------------------
สำนักงาน ก.พ. (OCSC)           https://job.ocsc.go.th           200 OK      202ms    SUCCESS
กระทรวงมหาดไทย (MOI)            https://www.moi.go.th/jobs       404         1285ms   FAILED
กรมส่งเสริมการปกครองท้องถิ่น    https://dlaapplicant2026.com     FETCH_FAIL  N/A      FAILED
สำนักงานทดสอบระบบขัดข้อง        https://www.go.th                FETCH_FAIL  N/A      FAILED
====================================================================================================
```

### **Crawler Performance Summary**
- **Tested Target URLs:** 4
- **Successful Crawls (HTTP 200):** 1 (25.0%)
- **Failed Crawls:** 3 (75.0%)
- **Failure Reasons:**
  - `https://www.moi.go.th/jobs`: **HTTP 404 Not Found** (Path does not exist on target host)
  - `https://dlaapplicant2026.com`: **DNS / Connection Error** (`fetch failed`)
  - `https://www.go.th`: **Connection Error** (`fetch failed`)

---

## PHASE 5 — JOB DISCOVERY VERIFICATION

Inspection of the `job_announcements` collection in Firestore:

- **Total Jobs in Database:** 125
- **Jobs Added Today:** 36
- **Jobs Added Last 7 Days:** 117
- **Provinces Represented in Jobs:** 12
- **Organization Types Represented:** 16
- **Duplicate Jobs:** 0 (SHA-256 fingerprint uniqueness maintained)
- **Expired Jobs:** 0
- **Invalid Jobs (Missing mandatory fields):** 0

### **Job Concentration by Province**
- **Bangkok (กรุงเทพมหานคร):** 64 jobs (51.2%)
- **Nonthaburi (นนทบุรี):** 35 jobs (28.0%)
- **Chiang Mai (เชียงใหม่):** 5 jobs (4.0%)
- **Nakhon Ratchasima (นครราชสีมา):** 4 jobs (3.2%)
- **Khon Kaen (ขอนแก่น):** 4 jobs (3.2%)
- **Songkhla (สงขลา):** 3 jobs (2.4%)
- **Others (6 provinces):** 10 jobs (8.0%)
- **Remaining 65 Provinces:** 0 jobs (0.0%)

---

## PHASE 6 — TRACEABILITY TEST

A strict 8-point traceability audit was conducted across all 125 job documents in Firestore:

```
+------------------------------------+------------------+------------------+
| Traceability Attribute             | Compliant Jobs   | Non-Compliant    |
+------------------------------------+------------------+------------------+
| 1. Original Application URL Exists  | 125 / 125 (100%) | 0                |
| 2. Original Document (PDF) Exists  | 0 / 125 (0%)     | 125 (Missing)    |
| 3. SHA-256 Document Hash Exists    | 0 / 125 (0%)     | 125 (Missing)    |
| 4. Official Published Date Exists  | 0 / 125 (0%)     | 125 (Missing)    |
| 5. System Retrieved Date Exists    | 125 / 125 (100%) | 0                |
| 6. Parser Version Annotated        | 0 / 125 (0%)     | 125 (Missing)    |
| 7. AI Model Metadata Annotated     | 0 / 125 (0%)     | 125 (Missing)    |
| 8. Extraction Confidence Score     | 0 / 125 (0%)     | 125 (Missing)    |
+------------------------------------+------------------+------------------+
```

### **Traceability Result:** **0 / 125 Jobs Fully Traceable (0.0%)**
While job documents retain valid `applicationUrl` and `retrievedDate` attributes, audit-grade verification fields (`pdfAnnouncementUrl`, `documentHashSHA256`, `parserVersion`, `aiModel`, `confidenceScore`) exist in separate `document_evidence` records (of which only 1 record exists in the database) and are **not linked or hydrated onto job items**. Therefore, job listings are **NOT TRACEABLE** to raw announcement PDFs.

---

## PHASE 7 — COVERAGE GAP REPORT

### **1. Top Missing Provinces (65 Total)**
Provinces with zero job listings and zero active sources in `source_registry`:
- Yala, Pattani, Narathiwat, Mae Hong Son, Nan, Phrae, Uttaradit, Tak, Sukhothai, Kamphaeng Phet, Phichit, Phetchabun, Nakhon Sawan, Uthai Thani, Chai Nat, Sing Buri, Lop Buri, Ang Thong, Phra Nakhon Si Ayutthaya, Saraburi, Nakhon Nayok, Prachin Buri, Sa Kaeo, Chachoengsao, Chanthaburi, Trat, Rayong, Kanchanaburi, Ratchaburi, Phetchaburi, Prachuap Khiri Khan, Chumphon, Ranong, Phang Nga, Krabi, Trang, Phatthalung, Satun, Kalasin, Mukdahan, Yasothon, Amnat Charoen, Nong Bua Lamphu, Nong Khai, Bueng Kan, Loei, Sakon Nakhon, Nakhon Phanom.

### **2. Top Missing Organization Types**
- **Local Administrative Bodies (อบต. / เทศบาล / อบจ.):** Over 2,800 local government bodies lack crawlers.
- **Regional Public Hospitals:** Ministry of Public Health regional hospital recruitment portals are unindexed.
- **Rajabhat & Rajamangala Universities:** 38 Rajabhat campuses across Thailand have zero source entries.

### **3. Broken / Offline Sources**
- `src-test-offline-001` (`https://www.go.th`): Marked `OFFLINE` in Firestore; network requests fail.
- `https://www.moi.go.th/jobs`: Returns `HTTP 404 Not Found`.
- `https://dlaapplicant2026.com`: DNS failure (`fetch failed`).

---

## PHASE 8 — CORE PROMISE VERIFICATION

### **Questions & Empirical Answers:**

1. **Can VERIIGO currently search government recruitment announcements across all 77 provinces?**  
   **NO.** Only 12 provinces have job records in Firestore, and only 2 provinces have registered sources in `source_registry`. 65 provinces have 0 listings.

2. **Can VERIIGO currently search all supported government organization categories?**  
   **PARTIAL.** Central ministries and OCSC jobs are ingested, but municipal, subdistrict (อบต.), public hospital, and university sources are absent from `source_registry`.

3. **Can VERIIGO honestly claim: "National Government Recruitment Coverage"?**  
   **NO.**

### **Evidence-Based Explanation**
With only 2 registered sources in `source_registry` (one of which is offline), zero crawlers configured for local administrative organizations across 75 provinces, 75% crawler failure on candidate URLs, and zero fully traceable job records matching raw PDF SHA-256 hashes, the claim of nationwide coverage is unverified by runtime data.

---

## PHASE 9 — RELEASE BLOCKERS

To achieve audit verification for nationwide coverage claims, the following release blockers must be resolved:

| Blocker ID | Severity | Blocker Description | Files & Database Impact | Remediation Required |
| :--- | :--- | :--- | :--- | :--- |
| **BLK-COV-01** | **CRITICAL** | **Source Registry Under-populated:** `source_registry` contains only 2 registered sources instead of provincial & local government feeds. | Firestore: `source_registry` | Seed and register at least 150+ verified government career portals covering all 77 provinces. |
| **BLK-COV-02** | **CRITICAL** | **Missing 65 Provinces:** 65 provinces contain 0 job listings in `job_announcements`. | Firestore: `job_announcements` | Implement active crawling for provincial governor offices and local administrative bodies. |
| **BLK-CRAWL-03** | **HIGH** | **Crawler Target Failures:** Candidate URLs (`moi.go.th/jobs`, `dlaapplicant2026.com`) throw 404 and DNS errors. | `/src/server/crawler/crawler-engine.ts` | Update source registry with active, working URLs and implement URL validation during source creation. |
| **BLK-TRACE-04** | **HIGH** | **Traceability Attributes Missing on Jobs:** Job documents lack `documentHashSHA256`, `parserVersion`, and `confidenceScore`. | `/src/repositories/GovernmentJobRepository.ts`, Firestore: `job_announcements` | Hydrate job items with SHA-256 hashes, parser versions, and confidence scores from `document_evidence`. |

---

## FINAL AUDIT VERDICT

```
=====================================================================================
                                FINAL AUDIT VERDICT                                  
=====================================================================================

                       C) NOT VERIFIED                                              

  The claim "National Government Recruitment Coverage" cannot currently be           
  supported by database records or live crawler execution.                           

  - Only 2 sources exist in source_registry (1 Healthy, 1 Offline).                 
  - 65 of 77 Thai provinces have zero job announcements.                            
  - 0 out of 125 job records pass the 8-point SHA-256 PDF traceability audit.         
=====================================================================================
```
