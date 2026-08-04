/**
 * VERIIGO - Thai Citizen ID Validation & Masking Utility
 * Performs modulo 11 checksum verification according to Thai OCSC & Civil Registration standard
 */

/**
 * Validates a 13-digit Thai Citizen ID string
 */
export const validateThaiCitizenId = (id: string): boolean => {
  if (!id) return false;
  
  // Remove hyphens or spaces
  const cleanId = id.replace(/[-\s]/g, '');

  if (cleanId.length !== 13 || !/^\d{13}$/.test(cleanId)) {
    return false;
  }

  // Calculate Modulo 11 Checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId.charAt(i), 10) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleanId.charAt(12), 10);
};

/**
 * Masks a Thai Citizen ID for privacy compliance (PDPA)
 * Example: "1103701234567" -> "1-1037-XXXXX-56-7"
 */
export const maskThaiCitizenId = (id: string): string => {
  if (!id) return '';
  const cleanId = id.replace(/[-\s]/g, '');
  if (cleanId.length !== 13) return id;

  const p1 = cleanId.substring(0, 1);
  const p2 = cleanId.substring(1, 5);
  const p4 = cleanId.substring(10, 12);
  const p5 = cleanId.substring(12, 13);

  return `${p1}-${p2}-XXXXX-${p4}-${p5}`;
};
