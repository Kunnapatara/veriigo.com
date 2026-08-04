/**
 * VERIIGO - Payment Gateway Abstraction & Webhook Verification (Sprint 13)
 * Provides multi-channel payment gateway interface, Thai PromptPay EMVCo QR generator,
 * Stripe/Credit Card processing abstraction, and HMAC-SHA256 Webhook signature validation.
 */

import crypto from 'crypto';

export type PaymentMethodType = 'PROMPTPAY' | 'CREDIT_CARD' | 'STRIPE';
export type PlanId = 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY' | 'ENTERPRISE_MONTHLY';

export interface PlanDetails {
  id: PlanId;
  name: string;
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  priceThb: number;
  billingPeriod: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  savingsPercent?: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<PlanId, PlanDetails> = {
  FREE: {
    id: 'FREE',
    name: 'VERIIGO Free Basic',
    tier: 'FREE',
    priceThb: 0,
    billingPeriod: 'MONTHLY',
    features: [
      'ค้นหาประกาศงานข้าราชการย้อนหลัง 30 วัน',
      'บันทึกตำแหน่งงานสนใจสูงสุด 3 รายการ',
      'แจ้งเตือนตามคำค้นหา 1 เงื่อนไข (ส่งรายวัน)',
      'สกัดข้อมูลประกาศด้วย Gemini AI 1 ฉบับ/วัน',
      'ตรวจสอบคุณสมบัติผ่านระบบพื้นฐาน',
    ],
  },
  PREMIUM_MONTHLY: {
    id: 'PREMIUM_MONTHLY',
    name: 'VERIIGO Premium Individual (รายเดือน)',
    tier: 'PREMIUM',
    priceThb: 299,
    billingPeriod: 'MONTHLY',
    features: [
      'ค้นหาและวิเคราะห์ตำแหน่งงานได้ไม่จำกัด',
      'ประมวลผลจับคู่คุณสมบัติด้วย Gemini 2.5 Flash RAG Unlimited',
      'สกัดเอกสารประกาศสอบ PDF ได้ไม่จำกัด',
      'การแจ้งเตือน Realtime Web Push & Email ทันทีที่มีงานตรงสเปก',
      'วิเคราะห์แนวโน้มอัตราเงินเดือน & Salary Benchmark',
      'ส่งออกรายงานใบสรุปเตรียมสอบ PDF / Excel High-Res',
      'สิทธิ์ใช้งานก่อนใครและบริการดูแลแบบ Priority Support',
    ],
  },
  PREMIUM_YEARLY: {
    id: 'PREMIUM_YEARLY',
    name: 'VERIIGO Premium Individual (รายปี - ประหยัด 20%)',
    tier: 'PREMIUM',
    priceThb: 2870, // ~239 THB/month (Saves 20%)
    billingPeriod: 'YEARLY',
    savingsPercent: 20,
    features: [
      'รวมทุกฟีเจอร์ของ Premium Individual',
      'ประหยัดกว่าแบบรายเดือนถึง 20% (เฉลียงเพียง 239 บาท/เดือน)',
      'ฟรี! สิทธิ์เข้าถึงชุดเก็งข้อสอบ ภาค ก. & ภาค ข. อัปเดตปี 2026',
      'รายงานสถิติอัตราแข่งขันการสอบแข่งขันข้าราชการรายกระทรวง',
    ],
  },
  ENTERPRISE_MONTHLY: {
    id: 'ENTERPRISE_MONTHLY',
    name: 'VERIIGO Agency & Enterprise (สถาบัน/หน่วยงาน)',
    tier: 'ENTERPRISE',
    priceThb: 990,
    billingPeriod: 'MONTHLY',
    features: [
      'รองรับผู้ใช้งานพร้อมกันได้สูงสุด 5 บัญชี (Multi-seat)',
      'เรียกใช้งาน Crawler & Document Extraction API Direct Access',
      'ระบบการตั้งค่า SLA และการสำรองข้อมูลรายวัน',
      'รายงานสถิติตลาดงานข้าราชการระดับบริหาร',
      'การสนับสนุนทางเทคนิคเฉพาะทาง Dedicated Account Manager',
    ],
  },
};

export interface BillingDetails {
  customerName: string;
  email: string;
  taxId?: string;
  companyName?: string;
  address?: string;
}

export interface CheckoutSessionRequest {
  planId: PlanId;
  paymentMethod: PaymentMethodType;
  billingDetails: BillingDetails;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  transactionRef: string;
  planId: PlanId;
  planName: string;
  amountThb: number;
  vatThb: number;
  totalThb: number;
  paymentMethod: PaymentMethodType;
  qrCodePayload?: string;
  stripeCheckoutUrl?: string;
  expiresAt: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

// PromptPay EMVCo Payload CRC16 Checksum Generator
export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = (crc >> 8) ^ data.charCodeAt(i);
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Thai PromptPay Dynamic QR Payload Generator (EMVCo Standard)
 */
export function generatePromptPayPayload(mobileOrTaxId: string, amount: number): string {
  // EMVCo PromptPay Standard Constants
  const payloadFormat = '000201';
  const poiMethod = '010212'; // Dynamic QR
  const merchantAccountInfoTag = '29';

  // Format ID: 00 = AID (A000000677010111), 01 = Mobile (0066...) or TaxID (02...)
  const isMobile = mobileOrTaxId.length === 10;
  let formattedTarget = mobileOrTaxId;

  if (isMobile) {
    formattedTarget = '0066' + mobileOrTaxId.substring(1);
  }

  const targetTag = isMobile ? '01' : '02';
  const targetSubValue = `${targetTag}${formattedTarget.length.toString().padStart(2, '0')}${formattedTarget}`;
  const aidValue = '0016A000000677010111';
  const subContent = `${aidValue}${targetSubValue}`;
  const merchantAccountTagValue = `${merchantAccountInfoTag}${subContent.length.toString().padStart(2, '0')}${subContent}`;

  const countryCode = '5802TH';
  const currency = '5303764'; // 764 = THB

  const formattedAmount = amount.toFixed(2);
  const amountTag = `54${formattedAmount.length.toString().padStart(2, '0')}${formattedAmount}`;

  const rawWithoutCrc = `${payloadFormat}${poiMethod}${merchantAccountTagValue}${countryCode}${currency}${amountTag}6304`;
  const crc = calculateCRC16(rawWithoutCrc);

  return `${rawWithoutCrc}${crc}`;
}

/**
 * Payment Gateway Adapter Interface
 */
export interface PaymentGatewayAdapter {
  createCheckoutSession(req: CheckoutSessionRequest): Promise<CheckoutSessionResponse>;
  verifyTransactionStatus(transactionRef: string): Promise<{ status: 'SUCCESS' | 'PENDING' | 'FAILED'; paidAt?: string }>;
}

/**
 * Thai PromptPay Gateway Implementation
 */
export class PromptPayGatewayAdapter implements PaymentGatewayAdapter {
  private billerTaxId = '0105568012345'; // VERIIGO Co., Ltd. Registered PromptPay Tax ID

  async createCheckoutSession(req: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    const plan = SUBSCRIPTION_PLANS[req.planId];
    if (!plan) throw new Error(`Invalid plan ID: ${req.planId}`);

    const subtotal = Math.round(plan.priceThb / 1.07 * 100) / 100;
    const vat = Math.round((plan.priceThb - subtotal) * 100) / 100;

    const transactionRef = `TXN-PP-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const sessionId = `cs_pp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const qrCodePayload = generatePromptPayPayload(this.billerTaxId, plan.priceThb);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    return {
      sessionId,
      transactionRef,
      planId: req.planId,
      planName: plan.name,
      amountThb: subtotal,
      vatThb: vat,
      totalThb: plan.priceThb,
      paymentMethod: 'PROMPTPAY',
      qrCodePayload,
      expiresAt,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
  }

  async verifyTransactionStatus(transactionRef: string): Promise<{ status: 'SUCCESS' | 'PENDING' | 'FAILED'; paidAt?: string }> {
    // Simulated gateway verification check
    return {
      status: 'SUCCESS',
      paidAt: new Date().toISOString(),
    };
  }
}

/**
 * Stripe & Credit Card Gateway Implementation
 */
export class StripeCreditCardGatewayAdapter implements PaymentGatewayAdapter {
  async createCheckoutSession(req: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    const plan = SUBSCRIPTION_PLANS[req.planId];
    if (!plan) throw new Error(`Invalid plan ID: ${req.planId}`);

    const subtotal = Math.round(plan.priceThb / 1.07 * 100) / 100;
    const vat = Math.round((plan.priceThb - subtotal) * 100) / 100;

    const transactionRef = `TXN-STRIPE-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const sessionId = `cs_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const checkoutUrl = `https://checkout.veriigo.gov.th/pay/${sessionId}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    return {
      sessionId,
      transactionRef,
      planId: req.planId,
      planName: plan.name,
      amountThb: subtotal,
      vatThb: vat,
      totalThb: plan.priceThb,
      paymentMethod: req.paymentMethod,
      stripeCheckoutUrl: checkoutUrl,
      expiresAt,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
  }

  async verifyTransactionStatus(transactionRef: string): Promise<{ status: 'SUCCESS' | 'PENDING' | 'FAILED'; paidAt?: string }> {
    return {
      status: 'SUCCESS',
      paidAt: new Date().toISOString(),
    };
  }
}

/**
 * Webhook Cryptographic Security Verification (HMAC-SHA256)
 */
export class WebhookSecurityVerifier {
  private secretKey: string;

  constructor(secretKey = process.env.VERIIGO_WEBHOOK_SECRET || 'whsec_veriigo_prod_sprint13_88391') {
    this.secretKey = secretKey;
  }

  public generateSignature(payloadString: string): string {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(payloadString, 'utf8')
      .digest('hex');
  }

  public verifySignature(payloadString: string, providedSignature: string): boolean {
    if (!providedSignature) return false;
    const expectedSignature = this.generateSignature(payloadString);
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(providedSignature, 'utf8')
      );
    } catch {
      return false;
    }
  }
}
