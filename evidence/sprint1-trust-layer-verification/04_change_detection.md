# Sprint 1 Evidence Trust Layer: Change Detection Verification
**Execution Timestamp**: `2026-08-04T07:28:33.593Z`
**Engine Module**: `src/services/ChangeDetectionEngine.ts`

---

## 1. Change Detection Execution Results

| # | Test Scenario | Source ID | Target URL | Detected Change Type | Details | Detected Timestamp |
|---|---|---|---|---|---|---|
| 1 | Identical Payload Re-crawl (Expected UNCHANGED) | `src-ocsc-001` | [https://job.ocsc.go.th/announcement/2026/civil-service-exam.html](https://job.ocsc.go.th/announcement/2026/civil-service-exam.html) | `MODIFIED_DOCUMENT` | Document payload SHA256 modified. Previous: snap-4fb77... Current: 4fb77d1571... | `2026-08-04T07:28:36.773Z` |
| 2 | Deadline Extension (Expected DEADLINE_CHANGED) | `src-moph-002` | [https://personnel.moph.go.th/jobs/nurse-2026.html](https://personnel.moph.go.th/jobs/nurse-2026.html) | `DEADLINE_CHANGED` | Deadline changed from '2026-08-06' to '2026-08-15' | `2026-08-04T07:28:36.836Z` |
| 3 | New Source Crawled (Expected NEW_ANNOUNCEMENT) | `src-new-005` | [https://dla.go.th/recruit/local-2026.html](https://dla.go.th/recruit/local-2026.html) | `NEW_ANNOUNCEMENT` | New recruitment announcement discovered. No prior record exists. | `2026-08-04T07:28:36.877Z` |

---

## 2. State Comparison Payload Audit

### Scenario 1: Identical Payload Re-crawl (Expected UNCHANGED)
- **Change Type**: `MODIFIED_DOCUMENT`
- **Previous State**:
  - Hash: `snap-4fb77d1571b6-msec6rzu`
  - Deadline: `2026-08-30`
  - Title: `ตำแหน่งงานราชการ สำนักงานคณะกรรมการข้าราชการพลเรือน (สำนักงาน ก.พ.)`
- **Current State**:
  - Hash: `4fb77d1571b6d4679602a1c5977c93a2e5d0efdc7ce6c66123da4441e42941cd`
  - Deadline: `2026-08-30`
  - Title: `ตำแหน่งงานราชการ สำนักงานคณะกรรมการข้าราชการพลเรือน (สำนักงาน ก.พ.)`

### Scenario 2: Deadline Extension (Expected DEADLINE_CHANGED)
- **Change Type**: `DEADLINE_CHANGED`
- **Previous State**:
  - Hash: `snap-f27507742560-msec6sdu`
  - Deadline: `2026-08-06`
  - Title: `ตำแหน่งงานราชการ กระทรวงสาธารณสุข`
- **Current State**:
  - Hash: `a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8`
  - Deadline: `2026-08-15`
  - Title: `ตำแหน่งงานราชการ กระทรวงสาธารณสุข`

### Scenario 3: New Source Crawled (Expected NEW_ANNOUNCEMENT)
- **Change Type**: `NEW_ANNOUNCEMENT`
- **Previous State**:
  - Hash: `N/A`
  - Deadline: `N/A`
  - Title: `N/A`
- **Current State**:
  - Hash: `b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2`
  - Deadline: `2026-09-15`
  - Title: `กรมส่งเสริมการปกครองท้องถิ่น รับสมัครสอบแข่งขัน`

