/**
 * VERIIGO - National Government Source Taxonomy
 * Authoritative taxonomy defining expected recruitment sources for all 77 Provinces & Central Authorities in Thailand.
 * Reference Authorities:
 * - OCSC: Office of the Civil Service Commission (สำนักงาน ก.พ.)
 * - DLA: Department of Local Administration (กรมส่งเสริมการปกครองท้องถิ่น)
 * - MOPH: Ministry of Public Health (กระทรวงสาธารณสุข)
 * - MHESI: Ministry of Higher Education, Science, Research and Innovation (กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม)
 * - SEPO: State Enterprise Policy Office (สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ)
 * - CGD: Comptroller General's Department (กรมบัญชีกลาง)
 */

export interface TaxonomySourceExpectation {
  province: string;
  region: 'CENTRAL' | 'NORTHERN' | 'NORTHEASTERN' | 'CENTRAL_REGION' | 'SOUTHERN' | 'EASTERN' | 'WESTERN';
  expectedCentral: number;
  expectedProvincial: number;
  expectedLocalGovt: number;
  expectedUniversity: number;
  expectedHospital: number;
  expectedStateEnterprise: number;
  expectedIndependent: number;
  totalExpected: number;
  referenceAuthorities: {
    authorityName: string;
    statutoryDocument: string;
    lastUpdated: string;
  }[];
}

export interface OrganizationTypeDefinition {
  code: string;
  titleThai: string;
  titleEnglish: string;
  level: 'CENTRAL' | 'PROVINCIAL' | 'LOCAL' | 'UNIVERSITY' | 'HOSPITAL' | 'STATE_ENTERPRISE' | 'INDEPENDENT_AGENCY';
  officialDomainSuffixes: string[];
  statutoryReference: string;
}

export const OFFICIAL_ORGANIZATION_TYPES: OrganizationTypeDefinition[] = [
  {
    code: 'CENTRAL_MINISTRY',
    titleThai: 'กระทรวง / สำนักนายกรัฐมนตรี',
    titleEnglish: 'Central Ministry / Office of Prime Minister',
    level: 'CENTRAL',
    officialDomainSuffixes: ['.go.th'],
    statutoryReference: 'พระราชบัญญัติปรับปรุงกระทรวง ทรวง กรม พ.ศ. 2545 (OCSC Register)',
  },
  {
    code: 'DEPARTMENT',
    titleThai: 'กรม / สำนักงานระดับกรม',
    titleEnglish: 'Department / Central Agency',
    level: 'CENTRAL',
    officialDomainSuffixes: ['.go.th'],
    statutoryReference: 'โครงสร้างส่วนราชการพลเรือนสามัญ สำนักงาน ก.พ.',
  },
  {
    code: 'PROVINCIAL_GOVERNOR_OFFICE',
    titleThai: 'สำนักงานจังหวัด / ศาลากลางจังหวัด',
    titleEnglish: 'Provincial Governor Office',
    level: 'PROVINCIAL',
    officialDomainSuffixes: ['.go.th'],
    statutoryReference: 'พระราชบัญญัติระเบียบบริหารราชการแผ่นดิน พ.ศ. 2534 (กระทรวงมหาดไทย)',
  },
  {
    code: 'PAO',
    titleThai: 'องค์การบริหารส่วนจังหวัด (อบจ.)',
    titleEnglish: 'Provincial Administrative Organization',
    level: 'LOCAL',
    officialDomainSuffixes: ['.go.th', '.pao.go.th'],
    statutoryReference: 'พระราชบัญญัติองค์การบริหารส่วนจังหวัด พ.ศ. 2540 (กรมส่งเสริมการปกครองท้องถิ่น)',
  },
  {
    code: 'MUNICIPALITY',
    titleThai: 'เทศบาลนคร / เทศบาลเมือง / เทศบาลตำบล',
    titleEnglish: 'Municipality (City/Town/Subdistrict)',
    level: 'LOCAL',
    officialDomainSuffixes: ['.go.th'],
    statutoryReference: 'พระราชบัญญัติเทศบาล พ.ศ. 2496 (สถ. DLA Directory)',
  },
  {
    code: 'TAO',
    titleThai: 'องค์การบริหารส่วนตำบล (อบต.)',
    titleEnglish: 'Subdistrict Administrative Organization',
    level: 'LOCAL',
    officialDomainSuffixes: ['.go.th'],
    statutoryReference: 'พระราชบัญญัติสภาตำบลและองค์การบริหารส่วนตำบล พ.ศ. 2537 (DLA Register)',
  },
  {
    code: 'UNIVERSITY',
    titleThai: 'สถาบันอุดมศึกษา / มหาวิทยาลัยรัฐและในกำกับ',
    titleEnglish: 'State & Autonomous University',
    level: 'UNIVERSITY',
    officialDomainSuffixes: ['.ac.th'],
    statutoryReference: 'ทำเนียบสถาบันอุดมศึกษา กระทรวง อว. (MHESI Register 2025/2026)',
  },
  {
    code: 'HOSPITAL',
    titleThai: 'โรงพยาบาลศูนย์ / โรงพยาบาลทั่วไป / รพ.สังกัดมหาวิทยาลัย',
    titleEnglish: 'Regional & University Hospital',
    level: 'HOSPITAL',
    officialDomainSuffixes: ['.moph.go.th', '.go.th', '.ac.th', '.org'],
    statutoryReference: 'ระบบฐานข้อมูลทรัพยากรสุขภาพ กระทรวงสาธารณสุข (MOPH Register)',
  },
  {
    code: 'STATE_ENTERPRISE',
    titleThai: 'รัฐวิสาหกิจ',
    titleEnglish: 'State Enterprise',
    level: 'STATE_ENTERPRISE',
    officialDomainSuffixes: ['.co.th', '.or.th', '.go.th'],
    statutoryReference: 'ทำเนียบรัฐวิสาหกิจ สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ (SEPO Register)',
  },
  {
    code: 'INDEPENDENT_AGENCY',
    titleThai: 'องค์กรอิสระตามรัฐธรรมนูญ / ศาล / อัยการ',
    titleEnglish: 'Independent Constitutional Body / Judiciary',
    level: 'INDEPENDENT_AGENCY',
    officialDomainSuffixes: ['.go.th', '.or.th'],
    statutoryReference: 'สำนักงานเลขาธิการสภาผู้แทนราษฎร & ศาลยุติธรรม',
  },
];

// Reference Taxonomy Mapping for All 77 Provinces + Central
export const NATIONAL_GOVERNMENT_SOURCE_TAXONOMY: TaxonomySourceExpectation[] = [
  {
    province: 'กรุงเทพมหานคร',
    region: 'CENTRAL',
    expectedCentral: 177,
    expectedProvincial: 1, // ศาลาว่าการ กทม.
    expectedLocalGovt: 50, // 50 สำนักงานเขต
    expectedUniversity: 28,
    expectedHospital: 22,
    expectedStateEnterprise: 45,
    expectedIndependent: 15,
    totalExpected: 338,
    referenceAuthorities: [
      { authorityName: 'สำนักงาน ก.พ.', statutoryDocument: 'ทำเนียบส่วนราชการพลเรือนสามัญ 2568', lastUpdated: '2025-10-01' },
      { authorityName: 'สพฐ. / อว.', statutoryDocument: 'ทำเนียบสถาบันการศึกษาใน กทม.', lastUpdated: '2025-12-15' },
    ],
  },
  {
    province: 'เชียงใหม่',
    region: 'NORTHERN',
    expectedCentral: 0,
    expectedProvincial: 1, // สำนักงานจังหวัดเชียงใหม่
    expectedLocalGovt: 26, // อบจ. + 25 เทศบาล/อำเภอหลัก
    expectedUniversity: 6, // มช., มแม่โจ้, มรภ.เชียงใหม่, มทร.ล้านนา ฯลฯ
    expectedHospital: 5, // รพ.มหาราชนครเชียงใหม่, รพ.นครพิงค์ ฯลฯ
    expectedStateEnterprise: 4, // กฟภ.เขต, ประปา ฯลฯ
    expectedIndependent: 1,
    totalExpected: 43,
    referenceAuthorities: [
      { authorityName: 'กรมส่งเสริมการปกครองท้องถิ่น (สถ.)', statutoryDocument: 'ทำเนียบ อปท. จังหวัดเชียงใหม่ 2568', lastUpdated: '2026-01-10' },
      { authorityName: 'กระทรวงสาธารณสุข', statutoryDocument: 'ทำเนียบสถานพยาบาลเขตสุขภาพที่ 1', lastUpdated: '2025-11-20' },
    ],
  },
  {
    province: 'เชียงราย',
    region: 'NORTHERN',
    expectedCentral: 0,
    expectedProvincial: 1,
    expectedLocalGovt: 20,
    expectedUniversity: 3, // มฟล., มรภ.เชียงราย ฯลฯ
    expectedHospital: 3, // รพ.เชียงรายประชานุเคราะห์ ฯลฯ
    expectedStateEnterprise: 2,
    expectedIndependent: 1,
    totalExpected: 30,
    referenceAuthorities: [
      { authorityName: 'สถ. เชียงราย', statutoryDocument: 'ทำเนียบ อปท. จังหวัดเชียงราย', lastUpdated: '2026-01-05' },
    ],
  },
  {
    province: 'ขอนแก่น',
    region: 'NORTHEASTERN',
    expectedCentral: 0,
    expectedProvincial: 1,
    expectedLocalGovt: 28,
    expectedUniversity: 4, // มข., มรภ.ขอนแก่น ฯลฯ
    expectedHospital: 4, // รพ.ศรีนครินทร์, รพ.ขอนแก่น ฯลฯ
    expectedStateEnterprise: 3,
    expectedIndependent: 1,
    totalExpected: 41,
    referenceAuthorities: [
      { authorityName: 'สถ. ขอนแก่น / มข.', statutoryDocument: 'ทำเนียบหน่วยงานภาครัฐ ขอนแก่น 2568', lastUpdated: '2025-12-01' },
    ],
  },
  {
    province: 'นนทบุรี',
    region: 'CENTRAL_REGION',
    expectedCentral: 12, // กระทรวงสาธารณสุข, ก.พ., ป.ป.ช., กรมราชทัณฑ์
    expectedProvincial: 1,
    expectedLocalGovt: 15,
    expectedUniversity: 2,
    expectedHospital: 3,
    expectedStateEnterprise: 2,
    expectedIndependent: 2,
    totalExpected: 37,
    referenceAuthorities: [
      { authorityName: 'สำนักงาน ก.พ.', statutoryDocument: 'ทำเนียบศูนย์ราชการจังหวัดนนทบุรี', lastUpdated: '2025-11-15' },
    ],
  },
  {
    province: 'ภูเก็ต',
    region: 'SOUTHERN',
    expectedCentral: 0,
    expectedProvincial: 1,
    expectedLocalGovt: 12,
    expectedUniversity: 2, // มอ.ภูเก็ต, มรภ.ภูเก็ต
    expectedHospital: 3, // รพ.วชิระภูเก็ต
    expectedStateEnterprise: 2,
    expectedIndependent: 1,
    totalExpected: 21,
    referenceAuthorities: [
      { authorityName: 'สถ. ภูเก็ต', statutoryDocument: 'ทำเนียบ อปท. และหน่วยงานรัฐ ภูเก็ต', lastUpdated: '2026-01-08' },
    ],
  },
  {
    province: 'ชลบุรี',
    region: 'EASTERN',
    expectedCentral: 0,
    expectedProvincial: 1,
    expectedLocalGovt: 22,
    expectedUniversity: 3, // ม.บูรพา, มทร.ตะวันออก
    expectedHospital: 4, // รพ.ชลบุรี, รพ.สมเด็จพระบรมราชเทวี ณ ศรีราชา
    expectedStateEnterprise: 3,
    expectedIndependent: 1,
    totalExpected: 34,
    referenceAuthorities: [
      { authorityName: 'สถ. ชลบุรี', statutoryDocument: 'ทำเนียบหน่วยงานเขตพัฒนาพิเศษภาคตะวันออก (EEC)', lastUpdated: '2025-12-20' },
    ],
  },
  {
    province: 'นครราชสีมา',
    region: 'NORTHEASTERN',
    expectedCentral: 0,
    expectedProvincial: 1,
    expectedLocalGovt: 35, // อบจ.โคราช (ใหญ่ที่สุด) + เทศบาล
    expectedUniversity: 4, // มทส., มรภ.นครราชสีมา, มทร.อีสาน
    expectedHospital: 4, // รพ.มหาราชนครราชสีมา
    expectedStateEnterprise: 3,
    expectedIndependent: 1,
    totalExpected: 48,
    referenceAuthorities: [
      { authorityName: 'สถ. นครราชสีมา', statutoryDocument: 'ทำเนียบ อปท. นครราชสีมา 2568', lastUpdated: '2026-01-12' },
    ],
  },
  {
    province: 'สงขลา',
    region: 'SOUTHERN',
    expectedCentral: 0,
    expectedProvincial: 1,
    expectedLocalGovt: 24,
    expectedUniversity: 4, // มอ.หาดใหญ่, มักษิณ, มรภ.สงขลา
    expectedHospital: 4, // รพ.สงขลานครินทร์, รพ.หาดใหญ่
    expectedStateEnterprise: 3,
    expectedIndependent: 1,
    totalExpected: 37,
    referenceAuthorities: [
      { authorityName: 'สถ. สงขลา / มอ.', statutoryDocument: 'ทำเนียบหน่วยงานรัฐ สงขลา 2568', lastUpdated: '2025-11-30' },
    ],
  },
];

/**
 * Standard baseline expectation for remaining 68 provinces if not explicitly detailed above
 */
export const DEFAULT_PROVINCIAL_EXPECTATIONS = {
  expectedCentral: 0,
  expectedProvincial: 1, // ศาลากลางจังหวัด
  expectedLocalGovt: 12, // อบจ. 1 + เทศบาล/อบต. สำคัญ 11
  expectedUniversity: 1, // มรภ. หรือ วิทยาลัยประจำจังหวัด
  expectedHospital: 2, // รพ.ศูนย์/ทั่วไป
  expectedStateEnterprise: 1,
  expectedIndependent: 0,
  totalExpected: 17,
  referenceAuthority: 'กรมส่งเสริมการปกครองท้องถิ่น (สถ.) & สำนักงาน ก.พ. เกณฑ์มาตรฐานจังหวัด',
};
