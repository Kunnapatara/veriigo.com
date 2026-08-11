# Sprint 1 Evidence Trust Layer: Lineage Verification Report
**Execution Timestamp**: `2026-08-04T07:28:33.593Z`
**Lineage Formula**: `source_registry -> source_snapshots -> documents -> document_evidence -> job_announcements -> audit_logs`

---

## 1. Lineage Verification Matrix

| # | Job ID | Source Registry ID | Snapshot ID | Document Lake ID | Document Evidence ID | Extraction Task ID | Audit Log Count | Lineage Verified |
|---|---|---|---|---|---|---|---|---|
| 1 | `job-trust-src-ocsc-001-1` | `src-ocsc-001` | `snap-4fb77d1571b6-msec6rzu` | `doc-msec6spm-2r9a7` | `evid-doc-msec6spm-2r9a7` | `ext-task-trust-1-msec6sxn` | `1` | `VERIFIED_COMPLETE` |
| 2 | `job-trust-src-moph-002-2` | `src-moph-002` | `snap-f27507742560-msec6sdu` | `doc-msec6th0-g95wf` | `evid-doc-msec6th0-g95wf` | `ext-task-trust-2-msec6tis` | `1` | `VERIFIED_COMPLETE` |
| 3 | `job-trust-src-bangkok-003-3` | `src-bangkok-003` | `snap-5dfe034b4ea6-msec6shp` | `doc-msec6ttu-5a95j` | `evid-doc-msec6ttu-5a95j` | `ext-task-trust-3-msec6tvs` | `1` | `VERIFIED_COMPLETE` |
| 4 | `job-trust-src-dopa-004-4` | `src-dopa-004` | `snap-d2bc6ebf1cf7-msec6sk4` | `doc-msec6u72-c0bpq` | `evid-doc-msec6u72-c0bpq` | `ext-task-trust-4-msec6u8u` | `1` | `VERIFIED_COMPLETE` |

---

## 2. Granular Chain Inspection Details

### Item 1: Job `job-trust-src-ocsc-001-1`
- **Title**: ตำแหน่งงานราชการ สำนักงานคณะกรรมการข้าราชการพลเรือน (สำนักงาน ก.พ.)
- **Source Registry**: `src-ocsc-001` (สำนักงานคณะกรรมการข้าราชการพลเรือน (สำนักงาน ก.พ.)) - Found: `true`
- **Source Snapshot**: `snap-4fb77d1571b6-msec6rzu` (SHA256: `4fb77d1571b6d4679602a1c5977c93a2e5d0efdc7ce6c66123da4441e42941cd`) - Found: `true`
- **Document Lake**: `doc-msec6spm-2r9a7` - Found: `true`
- **Document Evidence**: `evid-doc-msec6spm-2r9a7` - Found: `true`
- **Extraction Task**: `ext-task-trust-1-msec6sxn` (Model: `gemini-2.5-flash`) - Found: `true`
- **Complete Lineage**: `true`

### Item 2: Job `job-trust-src-moph-002-2`
- **Title**: ตำแหน่งงานราชการ กระทรวงสาธารณสุข
- **Source Registry**: `src-moph-002` (กระทรวงสาธารณสุข) - Found: `true`
- **Source Snapshot**: `snap-f27507742560-msec6sdu` (SHA256: `f275077425603c2c5b1cf8bddf9e1680db5cce2616344e5e6c1ea3e99e434162`) - Found: `true`
- **Document Lake**: `doc-msec6th0-g95wf` - Found: `true`
- **Document Evidence**: `evid-doc-msec6th0-g95wf` - Found: `true`
- **Extraction Task**: `ext-task-trust-2-msec6tis` (Model: `gemini-2.5-flash`) - Found: `true`
- **Complete Lineage**: `true`

### Item 3: Job `job-trust-src-bangkok-003-3`
- **Title**: ตำแหน่งงานราชการ กรุงเทพมหานคร
- **Source Registry**: `src-bangkok-003` (กรุงเทพมหานคร) - Found: `true`
- **Source Snapshot**: `snap-5dfe034b4ea6-msec6shp` (SHA256: `5dfe034b4ea6d00a43d6a32bbcd5567e726aec6461620dac7e9ba24e947ad49f`) - Found: `true`
- **Document Lake**: `doc-msec6ttu-5a95j` - Found: `true`
- **Document Evidence**: `evid-doc-msec6ttu-5a95j` - Found: `true`
- **Extraction Task**: `ext-task-trust-3-msec6tvs` (Model: `gemini-2.5-flash`) - Found: `true`
- **Complete Lineage**: `true`

### Item 4: Job `job-trust-src-dopa-004-4`
- **Title**: ตำแหน่งงานราชการ กรมการปกครอง
- **Source Registry**: `src-dopa-004` (กรมการปกครอง) - Found: `true`
- **Source Snapshot**: `snap-d2bc6ebf1cf7-msec6sk4` (SHA256: `d2bc6ebf1cf7c2e72340661f67fc4b921f176003416a156fe7c943b36ab4ac69`) - Found: `true`
- **Document Lake**: `doc-msec6u72-c0bpq` - Found: `true`
- **Document Evidence**: `evid-doc-msec6u72-c0bpq` - Found: `true`
- **Extraction Task**: `ext-task-trust-4-msec6u8u` (Model: `gemini-2.5-flash`) - Found: `true`
- **Complete Lineage**: `true`

