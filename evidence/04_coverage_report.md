# VERIIGO V2 - National Government Coverage Report
**Execution Timestamp**: `2026-08-04T03:04:56.388Z`
**Query Method**: `CoverageMetricService.calculateProvinceCoverage` (`src/services/coverage/CoverageMetricService.ts:49`)

---

## 1. Coverage Metrics Summary

- **Province Coverage**: `77 / 77 Thailand Provinces (100%)`
- **Agency Coverage**: `42 Agencies Discovered`
- **Source Registry Coverage**: `53 Active / 124 Registered Sources (43%)`
- **Data Freshness**: `2026-07-27T08:33:50.096Z`

---

## 2. Province Coverage Breakdown (Sample 15 Provinces)

| Province Code | Province Name | Discovered Sources / Jobs | Status |
|---|---|---|---|
| `PROV-01` | นนทบุรี | `74` | **ACTIVE** |
| `PROV-02` | กรุงเทพมหานคร | `148` | **ACTIVE** |
| `PROV-03` | ชัยภูมิ | `1` | **ACTIVE** |
| `PROV-04` | เชียงใหม่ | `15` | **ACTIVE** |
| `PROV-05` | ชลบุรี | `8` | **ACTIVE** |
| `PROV-06` | ระยอง | `1` | **ACTIVE** |
| `PROV-07` | ขอนแก่น | `13` | **ACTIVE** |
| `PROV-08` | นครราชสีมา | `14` | **ACTIVE** |
| `PROV-09` | อ่างทอง | `1` | **ACTIVE** |
| `PROV-10` | ประจวบคีรีขันธ์ | `2` | **ACTIVE** |
| `PROV-11` | พิษณุโลก | `6` | **ACTIVE** |
| `PROV-12` | นครพนม | `2` | **ACTIVE** |
| `PROV-13` | สตูล | `1` | **ACTIVE** |
| `PROV-14` | ตาก | `1` | **ACTIVE** |
| `PROV-15` | ภูเก็ต | `3` | **ACTIVE** |

---

## 3. Query Code Traceability

- **Query Function**: `CoverageMetricService.calculateProvinceCoverage(sources, expectedSources)`
- **Source File**: `src/services/coverage/CoverageMetricService.ts` (Line 49)
- **Repository Integration**: `src/repositories/CoverageRepository.ts` (Line 120)
- **Firestore Collections**: `source_registry`, `expected_sources`, `job_announcements`
