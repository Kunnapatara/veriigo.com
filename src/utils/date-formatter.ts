/**
 * VERIIGO - Thai Date & Buddhist Era (B.E. / พ.ศ.) Formatter Utility
 */

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Format ISO date string into Thai Buddhist Era Date
 * Example: "2026-07-21" -> "21 กรกฎาคม 2569"
 */
export const formatThaiDate = (dateString: string, isShortMonth: boolean = false): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = date.getDate();
  const month = isShortMonth ? THAI_MONTHS_SHORT[date.getMonth()] : THAI_MONTHS_FULL[date.getMonth()];
  const yearBE = date.getFullYear() + 543;

  return `${day} ${month} ${yearBE}`;
};

/**
 * Format ISO date string with Time in Thai locale
 * Example: "2026-07-21T09:30:00" -> "21 กรกฎาคม 2569 เวลา 09:30 น."
 */
export const formatThaiDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const dateFormatted = formatThaiDate(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${dateFormatted} เวลา ${hours}:${minutes} น.`;
};

/**
 * Calculates remaining days until a deadline date
 */
export const getDaysRemaining = (deadlineIsoString: string): { days: number; isExpired: boolean; text: string } => {
  if (!deadlineIsoString) return { days: 0, isExpired: true, text: 'ไม่มีกำหนด' };

  const target = new Date(deadlineIsoString);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return { days: 0, isExpired: true, text: 'ปิดรับสมัครแล้ว' };
  } else if (days === 0) {
    return { days: 0, isExpired: false, text: 'วันสุดท้าย!' };
  } else {
    return { days, isExpired: false, text: `เหลืออีก ${days} วัน` };
  }
};
