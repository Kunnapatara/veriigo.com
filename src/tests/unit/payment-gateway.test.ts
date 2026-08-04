import { describe, it, expect } from 'vitest';
import {
  calculateCRC16,
  generatePromptPayPayload,
  WebhookSecurityVerifier,
  SUBSCRIPTION_PLANS,
  PromptPayGatewayAdapter,
  StripeCreditCardGatewayAdapter,
} from '../../server/payment/payment-gateway';

describe('Sprint 14 - Unit Tests: Payment Gateway & Webhook Security', () => {
  it('should correctly calculate EMVCo CRC16 checksum for PromptPay', () => {
    const rawData = '00020101021229370016A000000677010111021301055680123455802TH530376454032996304';
    const crc = calculateCRC16(rawData);
    expect(crc).toBeDefined();
    expect(crc.length).toBe(4);
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
  });

  it('should generate valid EMVCo PromptPay QR Code payload for mobile & tax ID', () => {
    const taxIdPayload = generatePromptPayPayload('0105568012345', 299);
    expect(taxIdPayload).toContain('000201');
    expect(taxIdPayload).toContain('5802TH');
    expect(taxIdPayload).toContain('5303764'); // THB currency
    expect(taxIdPayload).toContain('5406299.00'); // 299.00 amount

    const mobilePayload = generatePromptPayPayload('0812345678', 2870);
    expect(mobilePayload).toContain('0066812345678');
    expect(mobilePayload).toContain('54072870.00');
  });

  it('should verify HMAC-SHA256 signature correctly for Webhook Security', () => {
    const verifier = new WebhookSecurityVerifier('whsec_test_secret_123');
    const payload = JSON.stringify({ eventType: 'payment_intent.succeeded', amount: 299 });
    const signature = verifier.generateSignature(payload);

    expect(signature).toBeDefined();
    expect(signature.length).toBe(64); // SHA256 hex string

    const isValid = verifier.verifySignature(payload, signature);
    expect(isValid).toBe(true);

    const isInvalid = verifier.verifySignature(payload, 'invalid_signature_hex');
    expect(isInvalid).toBe(false);
  });

  it('should return correct pricing and feature structure for all subscription plans', () => {
    expect(SUBSCRIPTION_PLANS.FREE.priceThb).toBe(0);
    expect(SUBSCRIPTION_PLANS.PREMIUM_MONTHLY.priceThb).toBe(299);
    expect(SUBSCRIPTION_PLANS.PREMIUM_YEARLY.priceThb).toBe(2870);
    expect(SUBSCRIPTION_PLANS.ENTERPRISE_MONTHLY.priceThb).toBe(990);

    expect(SUBSCRIPTION_PLANS.PREMIUM_MONTHLY.features.length).toBeGreaterThan(3);
  });

  it('should create PromptPay checkout session with VAT calculation', async () => {
    const adapter = new PromptPayGatewayAdapter();
    const session = await adapter.createCheckoutSession({
      planId: 'PREMIUM_MONTHLY',
      paymentMethod: 'PROMPTPAY',
      billingDetails: { customerName: 'Test User', email: 'test@veriigo.gov.th' },
    });

    expect(session.sessionId).toContain('cs_pp_');
    expect(session.totalThb).toBe(299);
    expect(session.vatThb + session.amountThb).toBeCloseTo(299, 1);
    expect(session.qrCodePayload).toBeDefined();
    expect(session.status).toBe('PENDING');
  });

  it('should create Stripe checkout session with checkout URL', async () => {
    const adapter = new StripeCreditCardGatewayAdapter();
    const session = await adapter.createCheckoutSession({
      planId: 'PREMIUM_YEARLY',
      paymentMethod: 'STRIPE',
      billingDetails: { customerName: 'Test User', email: 'test@veriigo.gov.th' },
    });

    expect(session.sessionId).toContain('cs_stripe_');
    expect(session.totalThb).toBe(2870);
    expect(session.stripeCheckoutUrl).toContain('https://checkout.veriigo.gov.th');
  });
});
