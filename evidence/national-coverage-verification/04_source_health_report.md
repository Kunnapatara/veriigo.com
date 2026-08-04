# Phase 4: Source Reliability & Health Verification Report
**Execution Timestamp**: `2026-08-04T03:22:10.746Z`
**Collection**: `source_registry` (124 sources), `crawler_execution_logs` (241 logs)

---

## 1. Traceability
- **Source File**: `src/services/CrawlFetchingWorker.ts`
- **Function**: `CrawlFetchingWorker.processCrawlTask` (Line 112)

---

## 2. All 124 Registered Government Sources Health Status

| # | Source ID | Agency / Portal Name | Province | Target URL | Last Crawl Timestamp | HTTP Status | Status | Documents Found |
|---|---|---|---|---|---|---|---|---|
| 1 | `src-001` | สำนักงาน ก.พ. (OCSC Central Job Portal) | นนทบุรี | [https://job.ocsc.go.th](https://job.ocsc.go.th) | 2026-07-27T08:17:41.116Z | `200` | **HEALTHY** | 45 |
| 2 | `src-audit-01` | สำนักงานการตรวจเงินแผ่นดิน (สตง.) | กรุงเทพมหานคร | [https://www.audit.go.th](https://www.audit.go.th) | 2026-07-27T07:37:22.962Z | `200` | **HEALTHY** | 18 |
| 3 | `src-bcnc-chaiyaphum-01` | วิทยาลัยพยาบาลบรมราชชนนี ชัยภูมิ (BCNC) | ชัยภูมิ | [https://www.bcnc.ac.th](https://www.bcnc.ac.th) | 2026-07-27T08:08:11.296Z | `200` | **HEALTHY** | 20 |
| 4 | `src-bma-01` | กรุงเทพมหานคร (BMA Job Portal) | กรุงเทพมหานคร | [https://ksb.bangkok.go.th](https://ksb.bangkok.go.th) | 2026-07-27T07:37:12.508Z | `403` | **HEALTHY** | 14 |
| 5 | `src-cgd-01` | กรมบัญชีกลาง (CGD) | กรุงเทพมหานคร | [https://www.cgd.go.th](https://www.cgd.go.th) | 2026-07-27T07:37:12.314Z | `403` | **HEALTHY** | 24 |
| 6 | `src-chula-01` | จุฬาลงกรณ์มหาวิทยาลัย (Chulalongkorn HR) | กรุงเทพมหานคร | [https://www.hrm.chula.ac.th](https://www.hrm.chula.ac.th) | 2026-07-27T07:37:14.581Z | `200` | **HEALTHY** | 15 |
| 7 | `src-cmpao-01` | อบจ.เชียงใหม่ (Chiang Mai PAO) | เชียงใหม่ | [https://www.chiangmaipao.go.th](https://www.chiangmaipao.go.th) | 2026-07-27T07:37:12.648Z | `403` | **HEALTHY** | 5 |
| 8 | `src-cnpao-01` | อบจ.ชลบุรี (Chonburi PAO) | ชลบุรี | [https://www.chon.go.th](https://www.chon.go.th) | 2026-07-27T07:37:13.886Z | `200` | **HEALTHY** | 5 |
| 9 | `src-customs-01` | กรมศุลกากร (Customs Department) | กรุงเทพมหานคร | [https://www.customs.go.th](https://www.customs.go.th) | 2026-07-27T07:37:02.551Z | `200` | **HEALTHY** | 13 |
| 10 | `src-ddc-01` | กรมควบคุมโรค (DDC) | นนทบุรี | [https://ddc.moph.go.th](https://ddc.moph.go.th) | 2026-07-27T07:37:03.993Z | `200` | **HEALTHY** | 19 |
| 11 | `src-doh-01` | กรมทางหลวง (Department of Highways) | กรุงเทพมหานคร | [https://www.doh.go.th](https://www.doh.go.th) | 2026-07-27T07:37:03.835Z | `200` | **HEALTHY** | 10 |
| 12 | `src-dopa-01` | กรมการปกครอง (DOPA) | กรุงเทพมหานคร | [https://www.dopa.go.th](https://www.dopa.go.th) | 2026-07-27T07:37:12.403Z | `403` | **HEALTHY** | 8 |
| 13 | `src-egat-01` | การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย (EGAT) | นนทบุรี | [https://www.egat.co.th](https://www.egat.co.th) | 2026-07-27T07:37:22.664Z | `200` | **HEALTHY** | 13 |
| 14 | `src-hosp-chula-01` | โรงพยาบาลจุฬาลงกรณ์ | กรุงเทพมหานคร | [https://www.chulalongkornhospi](https://www.chulalongkornhospital.go.th) | 2026-07-27T07:48:38.064Z | `200` | **HEALTHY** | 8 |
| 15 | `src-hosp-ramathibodi-01` | โรงพยาบาลรามาธิบดี | กรุงเทพมหานคร | [https://www.rama.mahidol.ac.th](https://www.rama.mahidol.ac.th) | 2026-07-27T07:48:37.650Z | `200` | **HEALTHY** | 13 |
| 16 | `src-hosp-rayong-01` | โรงพยาบาลระยอง (Rayong Hospital) | ระยอง | [https://www.rayonghospital.go.](https://www.rayonghospital.go.th) | 2026-07-27T08:08:02.023Z | `403` | **HEALTHY** | 28 |
| 17 | `src-indep-ect-01` | สำนักงานคณะกรรมการการเลือกตั้ง (กกต.) | กรุงเทพมหานคร | [https://www.ect.go.th](https://www.ect.go.th) | 2026-07-27T07:48:44.191Z | `403` | **HEALTHY** | 14 |
| 18 | `src-indep-nacc-01` | สำนักงาน ป.ป.ช. | นนทบุรี | [https://www.nacc.go.th](https://www.nacc.go.th) | 2026-07-27T07:48:44.357Z | `200` | **HEALTHY** | 18 |
| 19 | `src-kkpao-01` | อบจ.ขอนแก่น (Khon Kaen PAO) | ขอนแก่น | [https://www.kkpao.go.th](https://www.kkpao.go.th) | 2026-07-27T07:37:13.313Z | `200` | **HEALTHY** | 10 |
| 20 | `src-kku-01` | มหาวิทยาลัยขอนแก่น (KKU HR) | ขอนแก่น | [https://hr.kku.ac.th](https://hr.kku.ac.th) | 2026-07-27T07:37:14.778Z | `200` | **HEALTHY** | 6 |
| 21 | `src-krpao-01` | อบจ.นครราชสีมา (Korat PAO) | นครราชสีมา | [https://www.koratpao.go.th](https://www.koratpao.go.th) | 2026-07-27T07:37:14.150Z | `200` | **HEALTHY** | 11 |
| 22 | `src-ku-01` | มหาวิทยาลัยเกษตรศาสตร์ (KU) | กรุงเทพมหานคร | [https://www.ku.ac.th](https://www.ku.ac.th) | 2026-07-27T07:37:15.991Z | `200` | **HEALTHY** | 7 |
| 23 | `src-muni-angthong-01` | เทศบาลเมืองอ่างทอง (Ang Thong Town) | อ่างทอง | [https://www.angthongcity.go.th](https://www.angthongcity.go.th) | 2026-07-27T08:07:46.243Z | `200` | **HEALTHY** | 16 |
| 24 | `src-muni-cm-01` | เทศบาลนครเชียงใหม่ (Chiang Mai Municipality) | เชียงใหม่ | [https://www.cmcity.go.th](https://www.cmcity.go.th) | 2026-07-27T07:48:03.316Z | `200` | **HEALTHY** | 20 |
| 25 | `src-muni-huahin-01` | เทศบาลเมืองหัวหิน (Hua Hin Town Municipality) | ประจวบคีรีขันธ์ | [https://www.huahin.go.th](https://www.huahin.go.th) | 2026-07-27T08:15:50.078Z | `200` | **HEALTHY** | 19 |
| 26 | `src-muni-kk-01` | เทศบาลนครขอนแก่น (Khon Kaen Municipality) | ขอนแก่น | [https://www.kkmuni.go.th](https://www.kkmuni.go.th) | 2026-07-27T07:48:07.198Z | `200` | **HEALTHY** | 8 |
| 27 | `src-muni-korat-01` | เทศบาลนครนครราชสีมา (Korat Municipality) | นครราชสีมา | [https://www.koratcity.go.th](https://www.koratcity.go.th) | 2026-07-27T07:48:09.734Z | `200` | **HEALTHY** | 13 |
| 28 | `src-muni-pattaya-01` | เมืองพัทยา (Pattaya City) | ชลบุรี | [https://www.pattaya.go.th](https://www.pattaya.go.th) | 2026-07-27T07:48:05.120Z | `200` | **HEALTHY** | 23 |
| 29 | `src-nu-01` | มหาวิทยาลัยนเรศวร (NU) | พิษณุโลก | [https://www.nu.ac.th](https://www.nu.ac.th) | 2026-07-27T07:37:19.639Z | `200` | **HEALTHY** | 19 |
| 30 | `src-ocsc-01` | สำนักงาน ก.พ. (OCSC Central Job Portal) | นนทบุรี | [https://job.ocsc.go.th](https://job.ocsc.go.th) | 2026-07-27T07:37:01.443Z | `200` | **HEALTHY** | 10 |
| 31 | `src-pao-nkp-01` | อบจ.นครพนม (Nakhon Phanom PAO) | นครพนม | [https://www.nkppao.go.th](https://www.nkppao.go.th) | 2026-07-27T08:07:39.655Z | `200` | **HEALTHY** | 12 |
| 32 | `src-pao-satun-01` | อบจ.สตูล (Satun PAO) | สตูล | [https://www.satunpao.go.th](https://www.satunpao.go.th) | 2026-07-27T08:07:45.985Z | `200` | **HEALTHY** | 25 |
| 33 | `src-pao-tak-01` | อบจ.ตาก (Tak PAO) | ตาก | [https://www.takpao.go.th](https://www.takpao.go.th) | 2026-07-27T08:07:36.889Z | `200` | **HEALTHY** | 17 |
| 34 | `src-pea-01` | การไฟฟ้าส่วนภูมิภาค (PEA) | กรุงเทพมหานคร | [https://www.pea.co.th](https://www.pea.co.th) | 2026-07-27T07:37:21.855Z | `200` | **HEALTHY** | 11 |
| 35 | `src-pkpao-01` | อบจ.ภูเก็ต (Phuket PAO) | ภูเก็ต | [https://www.phuketpao.go.th](https://www.phuketpao.go.th) | 2026-07-27T07:37:13.519Z | `403` | **HEALTHY** | 18 |
| 36 | `src-prov-amnat-01` | จังหวัดอำนาจเจริญ (Amnat Charoen Province) | อำนาจเจริญ | [https://www.amnatcharoen.go.th](https://www.amnatcharoen.go.th) | 2026-07-27T08:06:58.706Z | `403` | **HEALTHY** | 22 |
| 37 | `src-prov-ayutthaya-01` | จังหวัดพระนครศรีอยุธยา (Ayutthaya Province) | พระนครศรีอยุธยา | [https://www.ayutthaya.go.th](https://www.ayutthaya.go.th) | 2026-07-27T07:48:02.274Z | `200` | **HEALTHY** | 21 |
| 38 | `src-prov-buengkan-01` | จังหวัดบึงกาฬ (Bueng Kan Province) | บึงกาฬ | [https://www.buengkan.go.th](https://www.buengkan.go.th) | 2026-07-27T08:07:12.026Z | `403` | **HEALTHY** | 26 |
| 39 | `src-prov-buriram-01` | จังหวัดบุรีรัมย์ (Buri Ram Province) | บุรีรัมย์ | [https://www.buriram.go.th](https://www.buriram.go.th) | 2026-07-27T08:06:58.839Z | `403` | **HEALTHY** | 17 |
| 40 | `src-prov-chachoengsao-01` | จังหวัดฉะเชิงเทรา (Chachoengsao Province) | ฉะเชิงเทรา | [https://www.chachoengsao.go.th](https://www.chachoengsao.go.th) | 2026-07-27T08:06:59.537Z | `403` | **HEALTHY** | 34 |
| 41 | `src-prov-chainat-01` | จังหวัดชัยนาท (Chai Nat Province) | ชัยนาท | [https://www.chainat.go.th](https://www.chainat.go.th) | 2026-07-27T08:07:03.260Z | `403` | **HEALTHY** | 14 |
| 42 | `src-prov-chanthaburi-01` | จังหวัดจันทบุรี (Chanthaburi Province) | จันทบุรี | [https://www.chanthaburi.go.th](https://www.chanthaburi.go.th) | 2026-07-27T08:06:59.286Z | `403` | **HEALTHY** | 27 |
| 43 | `src-prov-chiangrai-01` | จังหวัดเชียงราย (Chiang Rai Province) | เชียงราย | [https://www.chiangrai.go.th](https://www.chiangrai.go.th) | 2026-07-27T08:06:50.610Z | `403` | **HEALTHY** | 21 |
| 44 | `src-prov-chonburi-01` | จังหวัดชลบุรี (Chonburi Province) | ชลบุรี | [https://www.chonburi.go.th](https://www.chonburi.go.th) | 2026-07-27T07:48:00.508Z | `403` | **HEALTHY** | 20 |
| 45 | `src-prov-chumphon-01` | จังหวัดชุมพร (Chumphon Province) | ชุมพร | [https://www.chumphon.go.th](https://www.chumphon.go.th) | 2026-07-27T08:07:09.670Z | `403` | **HEALTHY** | 32 |
| 46 | `src-prov-kalasin-01` | จังหวัดกาฬสินธุ์ (Kalasin Province) | กาฬสินธุ์ | [https://www.kalasin.go.th](https://www.kalasin.go.th) | 2026-07-27T08:06:53.310Z | `403` | **HEALTHY** | 29 |
| 47 | `src-prov-kamphaengphet-01` | จังหวัดกำแพงเพชร (Kamphaeng Phet Province) | กำแพงเพชร | [https://www.kamphaengphet.go.t](https://www.kamphaengphet.go.th) | 2026-07-27T08:07:03.894Z | `403` | **HEALTHY** | 21 |
| 48 | `src-prov-kanchanaburi-01` | จังหวัดกาญจนบุรี (Kanchanaburi Province) | กาญจนบุรี | [https://www.kanchanaburi.go.th](https://www.kanchanaburi.go.th) | 2026-07-27T08:07:02.775Z | `403` | **HEALTHY** | 11 |
| 49 | `src-prov-khonkaen-01` | จังหวัดขอนแก่น (Khon Kaen Province) | ขอนแก่น | [https://www.khonkaen.go.th](https://www.khonkaen.go.th) | 2026-07-27T07:48:00.156Z | `403` | **HEALTHY** | 22 |
| 50 | `src-prov-korat-01` | จังหวัดนครราชสีมา (Nakhon Ratchasima Province) | นครราชสีมา | [https://www.nakhonratchasima.g](https://www.nakhonratchasima.go.th) | 2026-07-27T07:48:00.760Z | `403` | **HEALTHY** | 29 |
| 51 | `src-prov-krabi-01` | จังหวัดกระบี่ (Krabi Province) | กระบี่ | [https://www.krabi.go.th](https://www.krabi.go.th) | 2026-07-27T08:07:10.049Z | `403` | **HEALTHY** | 18 |
| 52 | `src-prov-lampang-01` | จังหวัดลำปาง (Lampang Province) | ลำปาง | [https://www.lampang.go.th](https://www.lampang.go.th) | 2026-07-27T08:06:50.849Z | `403` | **HEALTHY** | 30 |
| 53 | `src-prov-lamphun-01` | จังหวัดลำพูน (Lamphun Province) | ลำพูน | [https://www.lamphun.go.th](https://www.lamphun.go.th) | 2026-07-27T08:06:51.500Z | `200` | **HEALTHY** | 22 |
| 54 | `src-prov-loei-01` | จังหวัดเลย (Loei Province) | เลย | [https://www.loei.go.th](https://www.loei.go.th) | 2026-07-27T08:06:52.858Z | `403` | **HEALTHY** | 30 |
| 55 | `src-prov-lopburi-01` | จังหวัดลพบุรี (Lop Buri Province) | ลพบุรี | [https://www.lopburi.go.th](https://www.lopburi.go.th) | 2026-07-27T08:07:03.380Z | `403` | **HEALTHY** | 28 |
| 56 | `src-prov-maehongson-01` | จังหวัดแม่ฮ่องสอน (Mae Hong Son Province) | แม่ฮ่องสอน | [https://www.maehongson.go.th](https://www.maehongson.go.th) | 2026-07-27T08:06:52.089Z | `403` | **HEALTHY** | 33 |
| 57 | `src-prov-mahasarakham-01` | จังหวัดมหาสารคาม (Maha Sarakham Province) | มหาสารคาม | [https://www.mahasarakham.go.th](https://www.mahasarakham.go.th) | 2026-07-27T08:06:53.410Z | `403` | **HEALTHY** | 19 |
| 58 | `src-prov-mukdahan-01` | จังหวัดมุกดาหาร (Mukdahan Province) | มุกดาหาร | [https://www.mukdahan.go.th](https://www.mukdahan.go.th) | 2026-07-27T08:06:53.151Z | `403` | **HEALTHY** | 28 |
| 59 | `src-prov-nakhonnayok-01` | จังหวัดนครนายก (Nakhon Nayok Province) | นครนายก | [https://www.nakhonnayok.go.th](https://www.nakhonnayok.go.th) | 2026-07-27T08:06:59.803Z | `403` | **HEALTHY** | 30 |
| 60 | `src-prov-nakhonsawan-01` | จังหวัดนครสวรรค์ (Nakhon Sawan Province) | นครสวรรค์ | [https://www.nakhonsawan.go.th](https://www.nakhonsawan.go.th) | 2026-07-27T08:07:04.019Z | `403` | **HEALTHY** | 19 |
| 61 | `src-prov-nan-01` | จังหวัดน่าน (Nan Province) | น่าน | [https://www.nan.go.th](https://www.nan.go.th) | 2026-07-27T08:06:51.672Z | `403` | **HEALTHY** | 26 |
| 62 | `src-prov-narathiwat-01` | จังหวัดนราธิวาส (Narathiwat Province) | นราธิวาส | [https://www.narathiwat.go.th](https://www.narathiwat.go.th) | 2026-07-27T08:07:11.891Z | `200` | **HEALTHY** | 31 |
| 63 | `src-prov-nongbua-01` | จังหวัดหนองบัวลำภู (Nong Bua Lamphu Province) | หนองบัวลำภู | [https://www.nongbualamphu.go.t](https://www.nongbualamphu.go.th) | 2026-07-27T08:06:52.699Z | `403` | **HEALTHY** | 16 |
| 64 | `src-prov-nongkhai-01` | จังหวัดหนองคาย (Nong Khai Province) | หนองคาย | [https://www.nongkhai.go.th](https://www.nongkhai.go.th) | 2026-07-27T08:06:52.533Z | `403` | **HEALTHY** | 26 |
| 65 | `src-prov-nst-01` | จังหวัดนครศรีธรรมราช (Nakhon Si Thammarat Province) | นครศรีธรรมราช | [https://www.nakhonsithammarat.](https://www.nakhonsithammarat.go.th) | 2026-07-27T08:07:10.201Z | `403` | **HEALTHY** | 16 |
| 66 | `src-prov-pattani-01` | จังหวัดปัตตานี (Pattani Province) | ปัตตานี | [https://www.pattani.go.th](https://www.pattani.go.th) | 2026-07-27T08:07:11.329Z | `200` | **HEALTHY** | 13 |
| 67 | `src-prov-phangnga-01` | จังหวัดพังงา (Phangnga Province) | พังงา | [https://www.phangnga.go.th](https://www.phangnga.go.th) | 2026-07-27T08:07:09.907Z | `403` | **HEALTHY** | 26 |
| 68 | `src-prov-phatthalung-01` | จังหวัดพัทลุง (Phatthalung Province) | พัทลุง | [https://www.phatthalung.go.th](https://www.phatthalung.go.th) | 2026-07-27T08:07:10.906Z | `200` | **HEALTHY** | 11 |
| 69 | `src-prov-phetchabun-01` | จังหวัดเพชรบูรณ์ (Phetchabun Province) | เพชรบูรณ์ | [https://www.phetchabun.go.th](https://www.phetchabun.go.th) | 2026-07-27T08:07:03.619Z | `403` | **HEALTHY** | 23 |
| 70 | `src-prov-phetchaburi-01` | จังหวัดเพชรบุรี (Phetchaburi Province) | เพชรบุรี | [https://www.phetchaburi.go.th](https://www.phetchaburi.go.th) | 2026-07-27T08:07:09.370Z | `403` | **HEALTHY** | 27 |
| 71 | `src-prov-phichit-01` | จังหวัดพิจิตร (Phichit Province) | พิจิตร | [https://www.phichit.go.th](https://www.phichit.go.th) | 2026-07-27T08:07:03.754Z | `403` | **HEALTHY** | 12 |
| 72 | `src-prov-phitsanulok-01` | จังหวัดพิษณุโลก (Phitsanulok Province) | พิษณุโลก | [https://www.phitsanulok.go.th](https://www.phitsanulok.go.th) | 2026-07-27T07:48:00.922Z | `403` | **HEALTHY** | 32 |
| 73 | `src-prov-phrae-01` | จังหวัดแพร่ (Phrae Province) | แพร่ | [https://www.phrae.go.th](https://www.phrae.go.th) | 2026-07-27T08:06:51.894Z | `403` | **HEALTHY** | 10 |
| 74 | `src-prov-phuket-01` | จังหวัดภูเก็ต (Phuket Province) | ภูเก็ต | [https://www.phuket.go.th](https://www.phuket.go.th) | 2026-07-27T07:47:59.902Z | `403` | **HEALTHY** | 31 |
| 75 | `src-prov-prachinburi-01` | จังหวัดปราจีนบุรี (Prachin Buri Province) | ปราจีนบุรี | [https://www.prachinburi.go.th](https://www.prachinburi.go.th) | 2026-07-27T08:06:59.654Z | `403` | **HEALTHY** | 27 |
| 76 | `src-prov-prachuap-01` | จังหวัดประจวบคีรีขันธ์ (Prachuap Khiri Khan Province) | ประจวบคีรีขันธ์ | [https://www.prachuapkhirikhan.](https://www.prachuapkhirikhan.go.th) | 2026-07-27T08:07:09.534Z | `403` | **HEALTHY** | 16 |
| 77 | `src-prov-ranong-01` | จังหวัดระนอง (Ranong Province) | ระนอง | [https://www.ranong.go.th](https://www.ranong.go.th) | 2026-07-27T08:07:09.788Z | `403` | **HEALTHY** | 16 |
| 78 | `src-prov-ratchaburi-01` | จังหวัดราชบุรี (Ratchaburi Province) | ราชบุรี | [https://www.ratchaburi.go.th](https://www.ratchaburi.go.th) | 2026-07-27T08:07:02.653Z | `403` | **HEALTHY** | 29 |
| 79 | `src-prov-sakaeo-01` | จังหวัดสระแก้ว (Sa Kaeo Province) | สระแก้ว | [https://www.sakaeo.go.th](https://www.sakaeo.go.th) | 2026-07-27T08:06:59.920Z | `403` | **HEALTHY** | 11 |
| 80 | `src-prov-sakonnakhon-01` | จังหวัดสกลนคร (Sakon Nakhon Province) | สกลนคร | [https://www.sakonnakhon.go.th](https://www.sakonnakhon.go.th) | 2026-07-27T08:06:53.002Z | `403` | **HEALTHY** | 26 |
| 81 | `src-prov-samutprakan-01` | จังหวัดสมุทรปราการ (Samut Prakan Province) | สมุทรปราการ | [https://www.samutprakan.go.th](https://www.samutprakan.go.th) | 2026-07-27T08:07:02.262Z | `200` | **HEALTHY** | 19 |
| 82 | `src-prov-samutsakhon-01` | จังหวัดสมุทรสาคร (Samut Sakhon Province) | สมุทรสาคร | [https://www.samutsakhon.go.th](https://www.samutsakhon.go.th) | 2026-07-27T08:07:02.368Z | `403` | **HEALTHY** | 13 |
| 83 | `src-prov-samutsongkhram-01` | จังหวัดสมุทรสงคราม (Samut Songkhram Province) | สมุทรสงคราม | [https://www.samutsongkhram.go.](https://www.samutsongkhram.go.th) | 2026-07-27T08:07:02.500Z | `403` | **HEALTHY** | 30 |
| 84 | `src-prov-saraburi-01` | จังหวัดสระบุรี (Saraburi Province) | สระบุรี | [https://www.saraburi.go.th](https://www.saraburi.go.th) | 2026-07-27T08:07:03.490Z | `403` | **HEALTHY** | 10 |
| 85 | `src-prov-singburi-01` | จังหวัดสิงห์บุรี (Sing Buri Province) | สิงห์บุรี | [https://www.singburi.go.th](https://www.singburi.go.th) | 2026-07-27T08:07:03.069Z | `403` | **HEALTHY** | 11 |
| 86 | `src-prov-sisaket-01` | จังหวัดศรีสะเกษ (Si Sa Ket Province) | ศรีสะเกษ | [https://www.sisaket.go.th](https://www.sisaket.go.th) | 2026-07-27T08:06:59.088Z | `403` | **HEALTHY** | 21 |
| 87 | `src-prov-sukhothai-01` | จังหวัดสุโขทัย (Sukhothai Province) | สุโขทัย | [https://www.sukhothai.go.th](https://www.sukhothai.go.th) | 2026-07-27T08:07:04.237Z | `403` | **HEALTHY** | 27 |
| 88 | `src-prov-suphanburi-01` | จังหวัดสุพรรณบุรี (Suphan Buri Province) | สุพรรณบุรี | [https://www.suphanburi.go.th](https://www.suphanburi.go.th) | 2026-07-27T08:07:02.892Z | `403` | **HEALTHY** | 34 |
| 89 | `src-prov-surat-01` | จังหวัดสุราษฎร์ธานี (Surat Thani Province) | สุราษฎร์ธานี | [https://www.suratthani.go.th](https://www.suratthani.go.th) | 2026-07-27T07:48:01.761Z | `200` | **HEALTHY** | 17 |
| 90 | `src-prov-surin-01` | จังหวัดสุรินทร์ (Surin Province) | สุรินทร์ | [https://www.surin.go.th](https://www.surin.go.th) | 2026-07-27T08:06:58.946Z | `403` | **HEALTHY** | 29 |
| 91 | `src-prov-trang-01` | จังหวัดตรัง (Trang Province) | ตรัง | [https://www.trang.go.th](https://www.trang.go.th) | 2026-07-27T08:07:10.333Z | `403` | **HEALTHY** | 25 |
| 92 | `src-prov-trat-01` | จังหวัดตราด (Trat Province) | ตราด | [https://www.trat.go.th](https://www.trat.go.th) | 2026-07-27T08:06:59.410Z | `403` | **HEALTHY** | 24 |
| 93 | `src-prov-ubon-01` | จังหวัดอุบลราชธานี (Ubon Ratchathani Province) | อุบลราชธานี | [https://www.ubonratchathani.go](https://www.ubonratchathani.go.th) | 2026-07-27T07:48:01.944Z | `403` | **HEALTHY** | 12 |
| 94 | `src-prov-udon-01` | จังหวัดอุดรธานี (Udon Thani Province) | อุดรธานี | [https://www.udonthani.go.th](https://www.udonthani.go.th) | 2026-07-27T08:06:52.431Z | `403` | **HEALTHY** | 20 |
| 95 | `src-prov-uthaithani-01` | จังหวัดอุทัยธานี (Uthai Thani Province) | อุทัยธานี | [https://www.uthaithani.go.th](https://www.uthaithani.go.th) | 2026-07-27T08:07:04.128Z | `403` | **HEALTHY** | 13 |
| 96 | `src-prov-uttaradit-01` | จังหวัดอุตรดิตถ์ (Uttaradit Province) | อุตรดิตถ์ | [https://www.uttaradit.go.th](https://www.uttaradit.go.th) | 2026-07-27T08:06:52.274Z | `403` | **HEALTHY** | 19 |
| 97 | `src-prov-yala-01` | จังหวัดยะลา (Yala Province) | ยะลา | [https://www.yala.go.th](https://www.yala.go.th) | 2026-07-27T08:07:11.485Z | `403` | **HEALTHY** | 12 |
| 98 | `src-prov-yasothon-01` | จังหวัดยโสธร (Yasothon Province) | ยโสธร | [https://www.yasothon.go.th](https://www.yasothon.go.th) | 2026-07-27T08:06:58.557Z | `403` | **HEALTHY** | 27 |
| 99 | `src-psu-01` | มหาวิทยาลัยสงขลานครินทร์ (PSU) | สงขลา | [https://www.psu.ac.th](https://www.psu.ac.th) | 2026-07-27T07:37:14.867Z | `403` | **HEALTHY** | 8 |
| 100 | `src-rd-01` | กรมสรรพากร (Revenue Department) | กรุงเทพมหานคร | [https://www.rd.go.th](https://www.rd.go.th) | 2026-07-27T07:37:01.873Z | `200` | **HEALTHY** | 20 |
| 101 | `src-redcross-01` | สภากาชาดไทย (Thai Red Cross) | กรุงเทพมหานคร | [https://www.redcross.or.th](https://www.redcross.or.th) | 2026-07-27T07:37:20.638Z | `200` | **HEALTHY** | 16 |
| 102 | `src-rid-01` | กรมชลประทาน (Royal Irrigation Dept) | นนทบุรี | [https://www.rid.go.th](https://www.rid.go.th) | 2026-07-27T07:37:12.176Z | `200` | **HEALTHY** | 8 |
| 103 | `src-siriraj-01` | คณะแพทยศาสตร์ศิริราชพยาบาล | กรุงเทพมหานคร | [https://www.si.mahidol.ac.th](https://www.si.mahidol.ac.th) | 2026-07-27T07:37:20.837Z | `200` | **HEALTHY** | 13 |
| 104 | `src-skpao-01` | อบจ.สงขลา (Songkhla PAO) | สงขลา | [https://www.songkhlapao.go.th](https://www.songkhlapao.go.th) | 2026-07-27T07:37:14.484Z | `403` | **HEALTHY** | 21 |
| 105 | `src-state-mwa-01` | การประปานครหลวง (MWA) | กรุงเทพมหานคร | [https://www.mwa.co.th](https://www.mwa.co.th) | 2026-07-27T07:48:31.251Z | `200` | **HEALTHY** | 22 |
| 106 | `src-state-pao-01` | การประปาส่วนภูมิภาค (PWA) | กรุงเทพมหานคร | [https://www.pwa.co.th](https://www.pwa.co.th) | 2026-07-27T07:48:28.467Z | `200` | **HEALTHY** | 10 |
| 107 | `src-test-offline-001` | สำนักงานทดสอบระบบขัดข้อง (Failure Test) | เชียงราย | [https://www.go.th](https://www.go.th) | 2026-07-27T08:17:41Z | `200` | **HEALTHY** | 45 |
| 108 | `src-tu-01` | มหาวิทยาลัยธรรมศาสตร์ (TU) | ปทุมธานี | [https://tu.ac.th](https://tu.ac.th) | 2026-07-27T07:37:15.675Z | `200` | **HEALTHY** | 5 |
| 109 | `src-ubu-01` | มหาวิทยาลัยอุบลราชธานี (UBU) | อุบลราชธานี | [https://www.ubu.ac.th](https://www.ubu.ac.th) | 2026-07-27T07:37:19.855Z | `200` | **HEALTHY** | 14 |
| 110 | `src-uni-burapha-01` | มหาวิทยาลัยบูรพา (Burapha University) | ชลบุรี | [https://www.buu.ac.th](https://www.buu.ac.th) | 2026-07-27T08:07:14.343Z | `200` | **HEALTHY** | 23 |
| 111 | `src-uni-cmu-01` | มหาวิทยาลัยเชียงใหม่ (CMU) | เชียงใหม่ | [https://www.cmu.ac.th](https://www.cmu.ac.th) | 2026-07-27T08:07:13.137Z | `200` | **HEALTHY** | 25 |
| 112 | `src-uni-kmitl-01` | สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (KMITL) | กรุงเทพมหานคร | [https://www.kmitl.ac.th](https://www.kmitl.ac.th) | 2026-07-27T07:48:16.809Z | `200` | **HEALTHY** | 11 |
| 113 | `src-uni-kmutt-01` | มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (KMUTT) | กรุงเทพมหานคร | [https://www.kmutt.ac.th](https://www.kmutt.ac.th) | 2026-07-27T07:48:17.179Z | `200` | **HEALTHY** | 8 |
| 114 | `src-uni-mahidol-01` | มหาวิทยาลัยมหิดล (Mahidol University) | นครปฐม | [https://mahidol.ac.th](https://mahidol.ac.th) | 2026-07-27T07:48:16.337Z | `200` | **HEALTHY** | 28 |
| 115 | `src-uni-mju-01` | มหาวิทยาลัยแม่โจ้ (Maejo University) | เชียงใหม่ | [https://www.mju.ac.th](https://www.mju.ac.th) | 2026-07-27T08:07:13.609Z | `200` | **HEALTHY** | 25 |
| 116 | `src-uni-msu-01` | มหาวิทยาลัยมหาสารคาม (MSU) | มหาสารคาม | [https://www.msu.ac.th](https://www.msu.ac.th) | 2026-07-27T08:07:13.975Z | `200` | **HEALTHY** | 23 |
| 117 | `src-uni-npu-01` | มหาวิทยาลัยนครพนม (Nakhon Phanom University) | นครพนม | [https://www.npu.ac.th](https://www.npu.ac.th) | 2026-07-27T08:07:39.454Z | `200` | **HEALTHY** | 20 |
| 118 | `src-uni-psu-hatyai-01` | มหาวิทยาลัยสงขลานครินทร์ (PSU Hatyai) | สงขลา | [https://www.psu.ac.th](https://www.psu.ac.th) | 2026-07-27T08:07:14.444Z | `403` | **HEALTHY** | 14 |
| 119 | `src-uni-reru-01` | มหาวิทยาลัยราชภัฏร้อยเอ็ด (RERU) | ร้อยเอ็ด | [https://www.reru.ac.th](https://www.reru.ac.th) | 2026-07-27T08:07:39.994Z | `200` | **HEALTHY** | 14 |
| 120 | `src-uni-su-01` | มหาวิทยาลัยศิลปากร (Silpakorn) | นครปฐม | [https://www.su.ac.th](https://www.su.ac.th) | 2026-07-27T07:48:27.951Z | `200` | **HEALTHY** | 15 |
| 121 | `src-uni-sut-01` | มหาวิทยาลัยเทคโนโลยีสุรนารี (SUT) | นครราชสีมา | [https://www.sut.ac.th](https://www.sut.ac.th) | 2026-07-27T07:48:18.870Z | `200` | **HEALTHY** | 17 |
| 122 | `src-uni-swu-01` | มหาวิทยาลัยศรีนครินทรวิโรฒ (SWU) | กรุงเทพมหานคร | [https://www.swu.ac.th](https://www.swu.ac.th) | 2026-07-27T07:48:16.501Z | `403` | **HEALTHY** | 30 |
| 123 | `src-uni-tsu-01` | มหาวิทยาลัยทักษิณ (TSU) | สงขลา | [https://www.tsu.ac.th](https://www.tsu.ac.th) | 2026-07-27T07:48:25.476Z | `200` | **HEALTHY** | 11 |
| 124 | `src-uni-up-01` | มหาวิทยาลัยพะเยา (University of Phayao) | พะเยา | [https://www.up.ac.th](https://www.up.ac.th) | 2026-07-27T08:07:13.732Z | `200` | **HEALTHY** | 30 |
