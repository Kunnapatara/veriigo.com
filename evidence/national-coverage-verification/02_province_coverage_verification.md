# Phase 2: 77 Province Recruitment Coverage Verification
**Execution Timestamp**: `2026-08-04T03:22:10.746Z`
**Query Method**: `CoverageMetricService.calculateProvinceCoverage` (`src/services/coverage/CoverageMetricService.ts:49`)
**Firestore Collections**: `job_announcements`, `source_registry`

---

## 1. Query Code Traceability
- **Source File**: `src/services/coverage/CoverageMetricService.ts`
- **Function**: `CoverageMetricService.calculateProvinceCoverage`
- **Line**: 49

```typescript
const provinceMap = new Map<string, ProvinceCoverageSummary>();
THAILAND_PROVINCES.forEach(prov => provinceMap.set(prov, { province: prov, announcementsCount: 0 }));
```

---

## 2. Complete 77 Thai Provinces Recruitment Coverage Table

| # | Province Name | Announcement Count | Unique Agencies | Latest Announcement Date | Status |
|---|---|---|---|---|---|
| 1 | กรุงเทพมหานคร | 128 | 24 | 2026-07-28 | **ACTIVE** |
| 2 | สมุทรปราการ | 0 | 0 | N/A | 0 |
| 3 | นนทบุรี | 68 | 2 | 2026-07-28 | **ACTIVE** |
| 4 | ปทุมธานี | 1 | 1 | 2026-07-28 | **ACTIVE** |
| 5 | พระนครศรีอยุธยา | 0 | 0 | N/A | 0 |
| 6 | อ่างทอง | 0 | 0 | N/A | 0 |
| 7 | ลพบุรี | 0 | 0 | N/A | 0 |
| 8 | สิงห์บุรี | 0 | 0 | N/A | 0 |
| 9 | ชัยนาท | 0 | 0 | N/A | 0 |
| 10 | สระบุรี | 0 | 0 | N/A | 0 |
| 11 | ชลบุรี | 4 | 2 | 2026-07-28 | **ACTIVE** |
| 12 | ระยอง | 0 | 0 | N/A | 0 |
| 13 | จันทบุรี | 0 | 0 | N/A | 0 |
| 14 | ตราด | 0 | 0 | N/A | 0 |
| 15 | ฉะเชิงเทรา | 0 | 0 | N/A | 0 |
| 16 | ปราจีนบุรี | 0 | 0 | N/A | 0 |
| 17 | นครนายก | 0 | 0 | N/A | 0 |
| 18 | สระแก้ว | 0 | 0 | N/A | 0 |
| 19 | นครราชสีมา | 10 | 3 | 2026-07-28 | **ACTIVE** |
| 20 | บุรีรัมย์ | 0 | 0 | N/A | 0 |
| 21 | สุรินทร์ | 0 | 0 | N/A | 0 |
| 22 | ศรีสะเกษ | 0 | 0 | N/A | 0 |
| 23 | อุบลราชธานี | 4 | 1 | 2026-07-28 | **ACTIVE** |
| 24 | ยโสธร | 0 | 0 | N/A | 0 |
| 25 | ชัยภูมิ | 0 | 0 | N/A | 0 |
| 26 | อำนาจเจริญ | 0 | 0 | N/A | 0 |
| 27 | บึงกาฬ | 0 | 0 | N/A | 0 |
| 28 | หนองบัวลำภู | 0 | 0 | N/A | 0 |
| 29 | ขอนแก่น | 9 | 4 | 2026-07-28 | **ACTIVE** |
| 30 | อุดรธานี | 0 | 0 | N/A | 0 |
| 31 | เลย | 0 | 0 | N/A | 0 |
| 32 | หนองคาย | 0 | 0 | N/A | 0 |
| 33 | มหาสารคาม | 0 | 0 | N/A | 0 |
| 34 | ร้อยเอ็ด | 0 | 0 | N/A | 0 |
| 35 | กาฬสินธุ์ | 0 | 0 | N/A | 0 |
| 36 | สกลนคร | 0 | 0 | N/A | 0 |
| 37 | นครพนม | 0 | 0 | N/A | 0 |
| 38 | มุกดาหาร | 0 | 0 | N/A | 0 |
| 39 | เชียงใหม่ | 11 | 4 | 2026-07-28 | **ACTIVE** |
| 40 | ลำพูน | 0 | 0 | N/A | 0 |
| 41 | ลำปาง | 0 | 0 | N/A | 0 |
| 42 | อุตรดิตถ์ | 0 | 0 | N/A | 0 |
| 43 | แพร่ | 0 | 0 | N/A | 0 |
| 44 | น่าน | 0 | 0 | N/A | 0 |
| 45 | พะเยา | 0 | 0 | N/A | 0 |
| 46 | เชียงราย | 0 | 0 | N/A | 0 |
| 47 | แม่ฮ่องสอน | 0 | 0 | N/A | 0 |
| 48 | นครสวรรค์ | 0 | 0 | N/A | 0 |
| 49 | อุทัยธานี | 0 | 0 | N/A | 0 |
| 50 | กำแพงเพชร | 0 | 0 | N/A | 0 |
| 51 | ตาก | 0 | 0 | N/A | 0 |
| 52 | สุโขทัย | 0 | 0 | N/A | 0 |
| 53 | พิษณุโลก | 4 | 1 | 2026-07-28 | **ACTIVE** |
| 54 | พิจิตร | 0 | 0 | N/A | 0 |
| 55 | เพชรบูรณ์ | 0 | 0 | N/A | 0 |
| 56 | ราชบุรี | 0 | 0 | N/A | 0 |
| 57 | กาญจนบุรี | 0 | 0 | N/A | 0 |
| 58 | สุพรรณบุรี | 0 | 0 | N/A | 0 |
| 59 | นครปฐม | 0 | 0 | N/A | 0 |
| 60 | สมุทรสาคร | 0 | 0 | N/A | 0 |
| 61 | สมุทรสงคราม | 0 | 0 | N/A | 0 |
| 62 | เพชรบุรี | 0 | 0 | N/A | 0 |
| 63 | ประจวบคีรีขันธ์ | 0 | 0 | N/A | 0 |
| 64 | นครศรีธรรมราช | 0 | 0 | N/A | 0 |
| 65 | กระบี่ | 0 | 0 | N/A | 0 |
| 66 | พังงา | 0 | 0 | N/A | 0 |
| 67 | ภูเก็ต | 1 | 1 | 2026-07-28 | **ACTIVE** |
| 68 | สุราษฎร์ธานี | 3 | 2 | 2026-07-28 | **ACTIVE** |
| 69 | ระนอง | 0 | 0 | N/A | 0 |
| 70 | ชุมพร | 0 | 0 | N/A | 0 |
| 71 | สงขลา | 7 | 2 | 2026-07-28 | **ACTIVE** |
| 72 | สตูล | 0 | 0 | N/A | 0 |
| 73 | ตรัง | 0 | 0 | N/A | 0 |
| 74 | พัทลุง | 0 | 0 | N/A | 0 |
| 75 | ปัตตานี | 0 | 0 | N/A | 0 |
| 76 | ยะลา | 0 | 0 | N/A | 0 |
| 77 | นราธิวาส | 0 | 0 | N/A | 0 |

---

## 3. Summary
- **Total Thailand Provinces**: 77
- **Provinces with Active Job Announcements**: `12`
- **Provinces with Registered Sources**: 77
