# Sprint 1 Evidence Trust Layer: Combined Confidence Score Audit
**Execution Timestamp**: `2026-08-04T07:28:33.593Z`
**Governance Rule**: `Confidence Score = (0.5 * DeterministicSchemaScore) + (0.5 * AIExtractionScore)`
**Strict Constraint**: AI model cannot self-certify truth. Deterministic validation strictly required.

---

## 1. Confidence Evaluation Rules
1. **Mandatory Position Title** (25 pts)
2. **Mandatory Organization / Agency Name** (25 pts)
3. **Formatted Application Deadline** (20 pts)
4. **Valid Official Source URL** (15 pts)
5. **Verified Source Snapshot & SHA256 Hash** (15 pts)

---

## 2. Verified Confidence Score Audit Table

| # | Job ID | Title | Agency Name | Deterministic Score | AI Model Score | Combined Score | Validation Pass | Confidence Version |
|---|---|---|---|---|---|---|---|---|
| 1 | `job-trust-src-ocsc-001-1` | ตำแหน่งงานราชการ สำนักงานคณะกรรมการข้าราชการพลเรือน (สำนักงาน ก.พ.) | สำนักงานคณะกรรมการข้าราชการพลเรือน (สำนักงาน ก.พ.) | `1` | `0.9` | `0.95` | `PASSED` | `confidence-v2.4.0-trust-layer` |
| 2 | `job-trust-src-moph-002-2` | ตำแหน่งงานราชการ กระทรวงสาธารณสุข | กระทรวงสาธารณสุข | `1` | `0.9` | `0.95` | `PASSED` | `confidence-v2.4.0-trust-layer` |
| 3 | `job-trust-src-bangkok-003-3` | ตำแหน่งงานราชการ กรุงเทพมหานคร | กรุงเทพมหานคร | `1` | `0.9` | `0.95` | `PASSED` | `confidence-v2.4.0-trust-layer` |
| 4 | `job-trust-src-dopa-004-4` | ตำแหน่งงานราชการ กรมการปกครอง | กรมการปกครอง | `1` | `0.9` | `0.95` | `PASSED` | `confidence-v2.4.0-trust-layer` |

---

## 3. Rule Execution Log Breakdown

### Record 1: `job-trust-src-ocsc-001-1` (Combined Score: 0.95)
- [`PASS`] **TITLE_VALID**: Position title present: ตำแหน่งงานราชการ สำนักงานคณะกรรมการข้ารา
- [`PASS`] **AGENCY_VALID**: Agency name present: สำนักงานคณะกรรมการข้าราชการพลเรือน (สำนักงาน ก.พ.)
- [`PASS`] **DEADLINE_VALID**: Application deadline formatted: 2026-08-30
- [`PASS`] **OFFICIAL_URL_VALID**: Official URL valid: https://job.ocsc.go.th/announcement/2026/civil-ser
- [`PASS`] **SNAPSHOT_HASH_PRESENT**: Source snapshot and SHA256 payload hash verified

### Record 2: `job-trust-src-moph-002-2` (Combined Score: 0.95)
- [`PASS`] **TITLE_VALID**: Position title present: ตำแหน่งงานราชการ กระทรวงสาธารณสุข
- [`PASS`] **AGENCY_VALID**: Agency name present: กระทรวงสาธารณสุข
- [`PASS`] **DEADLINE_VALID**: Application deadline formatted: 2026-08-06
- [`PASS`] **OFFICIAL_URL_VALID**: Official URL valid: https://personnel.moph.go.th/jobs/nurse-2026.html
- [`PASS`] **SNAPSHOT_HASH_PRESENT**: Source snapshot and SHA256 payload hash verified

### Record 3: `job-trust-src-bangkok-003-3` (Combined Score: 0.95)
- [`PASS`] **TITLE_VALID**: Position title present: ตำแหน่งงานราชการ กรุงเทพมหานคร
- [`PASS`] **AGENCY_VALID**: Agency name present: กรุงเทพมหานคร
- [`PASS`] **DEADLINE_VALID**: Application deadline formatted: 2026-08-02
- [`PASS`] **OFFICIAL_URL_VALID**: Official URL valid: https://bma.go.th/recruit/engineer-2026.html
- [`PASS`] **SNAPSHOT_HASH_PRESENT**: Source snapshot and SHA256 payload hash verified

### Record 4: `job-trust-src-dopa-004-4` (Combined Score: 0.95)
- [`PASS`] **TITLE_VALID**: Position title present: ตำแหน่งงานราชการ กรมการปกครอง
- [`PASS`] **AGENCY_VALID**: Agency name present: กรมการปกครอง
- [`PASS`] **DEADLINE_VALID**: Application deadline formatted: 2026-05-15
- [`PASS`] **OFFICIAL_URL_VALID**: Official URL valid: https://dopa.go.th/jobs/archive-2026.html
- [`PASS`] **SNAPSHOT_HASH_PRESENT**: Source snapshot and SHA256 payload hash verified
