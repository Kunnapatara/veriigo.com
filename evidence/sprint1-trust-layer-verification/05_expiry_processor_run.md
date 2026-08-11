# Sprint 1 Evidence Trust Layer: Lifecycle & Expiration Processor Report
**Execution Timestamp**: `2026-08-04T07:28:33.593Z`
**Lifecycle Engine Module**: `src/services/JobExpirationProcessor.ts`
**Lifecycle States**: `ACTIVE` -> `EXPIRING_SOON` -> `EXPIRED` -> `ARCHIVED`

---

## 1. Execution Overview

- **Total Jobs Scanned**: `254`
- **Jobs Transitioned to EXPIRING_SOON (<= 3 days remaining)**: `1`
- **Jobs Transitioned to EXPIRED (Deadline passed)**: `1`
- **Jobs Transitioned to ARCHIVED (>= 30 days past deadline)**: `1`
- **Total Modified Document IDs**: `3`
- **Processed Timestamp**: `2026-08-04T07:28:36.918Z`

---

## 2. Firestore Job Lifecycle State Distribution

| # | Job ID | Title | Agency Name | Application Deadline | Lifecycle Status | Updated At |
|---|---|---|---|---|---|---|
| 1 | `job-trust-src-bangkok-003-3` | ตำแหน่งงานราชการ กรุงเทพมหานคร | กรุงเทพมหานคร | `2026-08-02` | `EXPIRED` | `2026-08-04T07:28:36.918Z` |
| 2 | `job-trust-src-dopa-004-4` | ตำแหน่งงานราชการ กรมการปกครอง | กรมการปกครอง | `2026-05-15` | `ARCHIVED` | `2026-08-04T07:28:36.918Z` |
| 3 | `job-trust-src-moph-002-2` | ตำแหน่งงานราชการ กระทรวงสาธารณสุข | กระทรวงสาธารณสุข | `2026-08-06` | `EXPIRING_SOON` | `2026-08-04T07:28:36.918Z` |
| 4 | `job-trust-src-ocsc-001-1` | ตำแหน่งงานราชการ สำนักงานคณะกรรมการข้าราชการพลเรือน (สำนักงาน ก.พ.) | สำนักงานคณะกรรมการข้าราชการพลเรือน (สำนักงาน ก.พ.) | `2026-08-30` | `ACTIVE` | `2026-08-04T07:28:33.593Z` |

---

## 3. Audit Trail Ledger Evidence
Every state transition emits an immutable record to the `/audit_logs` Firestore collection.

- **Actor ID**: `system-lifecycle-processor`
- **Actor Role**: `SYSTEM`
- **Actions Recorded**: `JOB_LIFECYCLE_EXPIRING_SOON`, `JOB_LIFECYCLE_EXPIRED`, `JOB_LIFECYCLE_ARCHIVED`
