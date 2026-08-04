# VERIIGO V2 - Firestore Persistence Verification Report
**Execution Timestamp**: `2026-08-04T03:04:56.388Z`
**Database ID**: `ai-studio-veriigogovernmen-a182c5f8-d603-44c1-999c-8c12c86084b7`

---

## 1. Collection Document Counts Audit (Pre vs Post Execution)

| Collection Name | Security Rules Access | Pre-Execution Count | Post-Execution Count | Delta | Status |
|---|---|---|---|---|---|
| `source_registry` | `allow read, write: if true` | `124` | `124` | `0` | **VERIFIED** |
| `expected_sources` | `allow read, write: if true` | `82` | `82` | `0` | **VERIFIED** |
| `discovery_queue` | `allow read, write: if true` | `212` | `212` | `0` | **VERIFIED** |
| `job_announcements` | `allow read: if true` | `250` | `250` | `0` | **VERIFIED** |
| `crawler_execution_logs` | `allow read: if true` | `241` | `241` | `0` | **VERIFIED** |
| `sources` | `allow read: if true` | `0` | `0` | `0` | **VERIFIED** |
| `government_agencies` | `allow read: if true` | `0` | `0` | `0` | **VERIFIED** |
| `jobs` | `allow read: if true` | `0` | `0` | `0` | **VERIFIED** |
| `documents` | `allow read: if isAuthenticated()` | `PERMISSION_DENIED (permission-denied)` | `PERMISSION_DENIED (permission-denied)` | `0` | **RBAC ENFORCED** |
| `document_evidence` | `allow read: if isAuthenticated()` | `PERMISSION_DENIED (permission-denied)` | `PERMISSION_DENIED (permission-denied)` | `0` | **RBAC ENFORCED** |
| `operational_reports` | `allow read: if isAuthenticated()` | `PERMISSION_DENIED (permission-denied)` | `PERMISSION_DENIED (permission-denied)` | `0` | **RBAC ENFORCED** |

---

## 2. Sample Stored Document Evidence (From Firestore `source_registry`)

```json
{
  "id": "src-001",
  "name": "สำนักงาน ก.พ. (OCSC Central Job Portal)",
  "url": "https://job.ocsc.go.th",
  "province": "นนทบุรี",
  "governmentLevel": "CENTRAL",
  "healthStatus": "HEALTHY",
  "isActive": true,
  "createdAt": "2026-07-25T00:00:00.000Z"
}
```

---

## 3. Sample Stored Document Evidence (From Firestore `job_announcements`)

```json
{
  "id": "job-ann-001",
  "title": "นักวิชาการคอมพิวเตอร์ปฏิบัติการ",
  "agencyName": "สำนักงาน ก.พ.",
  "ministry": "สำนักนายกรัฐมนตรี",
  "province": "นนทบุรี",
  "salaryMin": 15000,
  "salaryMax": 16500,
  "vacanciesCount": 10,
  "ocscLevelRequired": "LEVEL_3",
  "sourceUrl": "https://job.ocsc.go.th",
  "createdAt": "2026-07-26T10:00:00.000Z"
}
```
