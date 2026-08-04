import React, { useState, useEffect } from 'react';
import {
  Crown,
  Zap,
  Check,
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  FileText,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  Download,
  RefreshCw,
  AlertCircle,
  Key,
  Copy,
  ChevronRight,
  CheckCircle2,
  Building2,
  Sliders,
  DollarSign,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PlanDetails {
  id: string;
  name: string;
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  priceThb: number;
  billingPeriod: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  savingsPercent?: number;
  features: string[];
}

interface UserSubscriptionData {
  userId: string;
  tier: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
  planId: string;
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  billingCycle: string;
  priceThb: number;
  validUntil: string;
  autoRenew: boolean;
  paymentMethod: string;
  usageQuota: {
    aiMatchesToday: number;
    aiMatchesLimit: number;
    pdfRagExtractionsToday: number;
    pdfRagLimit: number;
    savedSearchAlertsCount: number;
    savedSearchAlertsLimit: number;
    exportsThisMonth: number;
    exportsLimit: number;
  };
}

interface InvoiceRecord {
  id: string;
  receiptNumber: string;
  issueDate: string;
  planId: string;
  planName: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerTaxId?: string;
  companyName: string;
  companyTaxId: string;
  companyAddress: string;
  transactionRef: string;
}

export const SubscriptionView: React.FC = () => {
  const { currentUser, userDoc } = useAuth();
  const [activeTab, setActiveTab] = useState<'PLANS' | 'CHECKOUT' | 'GATED_FEATURES' | 'BILLING_HISTORY' | 'SECURITY_WEBHOOK'>('PLANS');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('PREMIUM_MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<'PROMPTPAY' | 'CREDIT_CARD'>('PROMPTPAY');

  // Subscription State
  const [subscription, setSubscription] = useState<UserSubscriptionData | null>(null);
  const [plans, setPlans] = useState<Record<string, PlanDetails>>({});
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Checkout Session State
  const [checkoutSession, setCheckoutSession] = useState<any | null>(null);
  const [qrCountdown, setQrCountdown] = useState<number>(900); // 15 mins
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [otpInput, setOtpInput] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  // Card Form State
  const [cardHolder, setCardHolder] = useState<string>('KANNA PATARANUSORN');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('888');

  // Gated Feature Test State
  const [gatedTestResult, setGatedTestResult] = useState<any | null>(null);

  // Webhook Tester State
  const [webhookSecret, setWebhookSecret] = useState<string>('whsec_veriigo_prod_sprint13_88391');
  const [webhookTestResult, setWebhookTestResult] = useState<any | null>(null);

  useEffect(() => {
    fetchSubscriptionData();
    fetchInvoices();
  }, []);

  useEffect(() => {
    let timer: any;
    if (checkoutSession && paymentMethod === 'PROMPTPAY' && qrCountdown > 0) {
      timer = setInterval(() => {
        setQrCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [checkoutSession, paymentMethod, qrCountdown]);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/current');
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
      }
      const plansRes = await fetch('/api/subscription/plans');
      const plansData = await plansRes.json();
      if (plansData.success) {
        setPlans(plansData.plans);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/subscription/invoices');
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const handleCreateCheckout = async (planKey: string) => {
    setSelectedPlanId(planKey);
    setActionLoading(true);
    setNotification(null);
    try {
      const res = await fetch('/api/subscription/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planKey,
          paymentMethod,
          billingDetails: {
            customerName: userDoc?.displayName || currentUser?.displayName || 'คุณกัณหา ภัทรานุสรณ์',
            email: currentUser?.email || 'kunnapatara@gmail.com',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutSession(data.session);
        setQrCountdown(900);
        setActiveTab('CHECKOUT');
        setNotification({ type: 'success', message: 'สร้างรายการสั่งซื้อและช่องทางชำระเงินสำเร็จ!' });
      } else {
        setNotification({ type: 'error', message: data.message || 'ไม่สามารถสร้างรายการสั่งซื้อได้' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบชำระเงิน' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!checkoutSession) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/subscription/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionRef: checkoutSession.transactionRef }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
        setNotification({ type: 'success', message: data.message });
        setShowOtpModal(false);
        fetchInvoices();
        setActiveTab('PLANS');
      } else {
        setNotification({ type: 'error', message: data.message || 'การยืนยันชำระเงินไม่สมบูรณ์' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะชำระเงิน' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickTierSwitch = async (targetTier: 'FREE' | 'PREMIUM' | 'ENTERPRISE') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTier }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
        setNotification({ type: 'success', message: `ปรับระดับผู้ใช้เป็น ${targetTier} เรียบร้อยแล้ว` });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'ไม่สามารถเปลี่ยนระดับสิทธิ์ได้' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    if (!subscription) return;
    const endpoint = subscription.autoRenew ? '/api/subscription/cancel' : '/api/subscription/resume';
    setActionLoading(true);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.data);
        setNotification({ type: 'info', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'เกิดข้อผิดพลาดในการอัปเดตการต่ออายุ' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestGatedFeature = async () => {
    setGatedTestResult(null);
    setActionLoading(true);
    try {
      const res = await fetch('/api/subscription/gated-feature-access', { method: 'POST' });
      const data = await res.json();
      setGatedTestResult(data);
    } catch (err) {
      setGatedTestResult({ success: false, message: 'เกิดข้อผิดพลาดในการทดสอบ Feature Gate' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunWebhookDevTest = async () => {
    setWebhookTestResult(null);
    setActionLoading(true);
    try {
      const [hmacRes, webhookRes] = await Promise.all([
        fetch('/api/subscription/webhook/developer-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'payment_intent.succeeded',
            planId: 'PREMIUM_MONTHLY',
            secretKey: webhookSecret,
          }),
        }).then((r) => r.json()),
        fetch('/api/payment/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 't=1600000000,v1=f18525b6823c9148d8a7c293673',
          },
          body: JSON.stringify({
            event: 'payment_intent.succeeded',
            data: { amount: 29900, currency: 'thb', customerEmail: currentUser?.email || 'kunnapatara@gmail.com' },
          }),
        }).then((r) => r.json()),
      ]);

      setWebhookTestResult({
        success: hmacRes.success && webhookRes.received,
        hmacVerification: hmacRes,
        stripeWebhookEvent: webhookRes,
      });
    } catch (err) {
      setWebhookTestResult({ success: false, message: 'เกิดข้อผิดพลาดในการทดสอบ Webhook HMAC & Payment Webhook' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="ml-3 text-slate-300 font-medium">กำลังโหลดข้อมูลระบบแพ็กเกจ & การชำระเงิน...</span>
      </div>
    );
  }

  const currentTier = subscription?.tier || 'FREE';

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Active Subscription Status */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                <Crown className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">แพ็กเกจสมาชิก VERIIGO Government Intelligence</h1>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                      currentTier === 'ENTERPRISE'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : currentTier === 'PREMIUM'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-700/50 text-slate-300 border-slate-600'
                    }`}
                  >
                    {currentTier === 'ENTERPRISE' ? '👑 ENTERPRISE ACTIVE' : currentTier === 'PREMIUM' ? '✨ PREMIUM ACTIVE' : 'FREE TIER'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-0.5">
                  ระบบบริหารจัดการแพ็กเกจการใช้งาน สิทธิประโยชน์ และโครงสร้างเกตเวย์ชำระเงินแบบเข้ารหัส HMAC Security
                </p>
              </div>
            </div>
          </div>

          {/* User Quota Bar Summary */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 backdrop-blur-md">
            <div className="text-left px-2">
              <p className="text-xs text-slate-400">โควตาประมวลผล Gemini AI</p>
              <p className="text-sm font-semibold text-amber-400">
                {subscription?.usageQuota.aiMatchesLimit === 999999 ? 'ไม่จำกัด (Unlimited)' : `${subscription?.usageQuota.aiMatchesToday} / ${subscription?.usageQuota.aiMatchesLimit} ครั้ง/วัน`}
              </p>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div className="text-left px-2">
              <p className="text-xs text-slate-400">การแจ้งเตือนงานตรงสเปก</p>
              <p className="text-sm font-semibold text-emerald-400">
                {subscription?.usageQuota.savedSearchAlertsLimit} เงื่อนไข
              </p>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div className="text-left px-2">
              <p className="text-xs text-slate-400">สกัดเอกสาร PDF RAG</p>
              <p className="text-sm font-semibold text-cyan-400">
                {subscription?.usageQuota.pdfRagLimit === 999999 ? 'ไม่จำกัด' : '1 ฉบับ/วัน'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Notification */}
        {notification && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-sm flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-200 border-emerald-500/40'
                : notification.type === 'error'
                ? 'bg-rose-950/60 text-rose-200 border-rose-500/40'
                : 'bg-cyan-950/60 text-cyan-200 border-cyan-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {notification.type === 'info' && <Sparkles className="w-5 h-5 text-cyan-400" />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white text-xs">
              ปิด
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto space-x-2">
        <button
          onClick={() => setActiveTab('PLANS')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
            activeTab === 'PLANS'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Crown className="w-4 h-4" />
          เปรียบเทียบแพ็กเกจสมาชิก
        </button>
        <button
          onClick={() => setActiveTab('CHECKOUT')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
            activeTab === 'CHECKOUT'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          ชำระเงิน & เกตเวย์
          {checkoutSession && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
        </button>
        <button
          onClick={() => setActiveTab('GATED_FEATURES')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
            activeTab === 'GATED_FEATURES'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Lock className="w-4 h-4" />
          ทดสอบ Feature Gating (Middleware)
        </button>
        <button
          onClick={() => setActiveTab('BILLING_HISTORY')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
            activeTab === 'BILLING_HISTORY'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          ประวัติใบกำกับภาษี & ใบเสร็จ
        </button>
        <button
          onClick={() => setActiveTab('SECURITY_WEBHOOK')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all ${
            activeTab === 'SECURITY_WEBHOOK'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          ความปลอดภัย Webhook HMAC
        </button>
      </div>

      {/* TAB 1: PRICING PLANS */}
      {activeTab === 'PLANS' && (
        <div className="space-y-8">
          {/* Monthly / Yearly Toggle */}
          <div className="flex justify-center items-center">
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-2 shadow-inner">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  billingCycle === 'MONTHLY' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                รอบการชำระรายเดือน
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  billingCycle === 'YEARLY' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                รอบการชำระรายปี
                <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 font-bold rounded-full border border-emerald-500/40">
                  ประหยัด 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* FREE PLAN */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all relative">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Free Basic</h3>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-medium rounded-full">ใช้งานฟรี</span>
                </div>
                <p className="text-slate-400 text-xs min-h-[36px]">สำหรับผู้เริ่มต้นค้นหาประกาศสอบและสกัดข้อมูลพื้นฐาน</p>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold text-white">฿0</span>
                  <span className="text-slate-400 text-sm">/ เดือน</span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-800/80 text-sm">
                  <li className="flex items-start gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>ค้นหาประกาศงานข้าราชการย้อนหลัง 30 วัน</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>บันทึกตำแหน่งงานสนใจสูงสุด 3 รายการ</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>แจ้งเตือนคำค้นหา 1 เงื่อนไข (ส่งสรุปรายวัน)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>สกัดข้อมูลประกาศด้วย Gemini AI 1 ฉบับ/วัน</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-500 line-through">
                    <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>การแจ้งเตือน Realtime Web Push ทันที</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-500 line-through">
                    <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>ส่งออกรายงานเตรียมสอบ PDF / Excel</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                {currentTier === 'FREE' ? (
                  <button
                    disabled
                    className="w-full py-3 bg-slate-800 text-slate-400 rounded-xl font-semibold text-sm cursor-not-allowed border border-slate-700"
                  >
                    แพ็กเกจปัจจุบันของคุณ
                  </button>
                ) : (
                  <button
                    onClick={() => handleQuickTierSwitch('FREE')}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-sm transition-all"
                  >
                    สลับกลับมาใช้แพ็กเกจฟรี
                  </button>
                )}
              </div>
            </div>

            {/* PREMIUM PLAN (FEATURED) */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30 border-2 border-amber-500 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative scale-105">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider px-4 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                แนะนำยอดนิยมสำหรับผู้เตรียมสอบ
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Premium Individual
                    <Crown className="w-5 h-5 text-amber-400" />
                  </h3>
                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/40">
                    ปลดล็อกทุกฟีเจอร์
                  </span>
                </div>
                <p className="text-slate-300 text-xs min-h-[36px]">
                  สำหรับบุคคลที่ต้องการเพิ่มโอกาสสอบติดข้าราชการด้วยระบบจับคู่และแจ้งเตือน Realtime
                </p>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold text-amber-400">
                    {billingCycle === 'MONTHLY' ? '฿299' : '฿2,870'}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {billingCycle === 'MONTHLY' ? '/ เดือน' : '/ ปี (เฉลี่ย 239 บาท/ด.)'}
                  </span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-amber-500/20 text-sm">
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="font-medium">ค้นหาและวิเคราะห์ตำแหน่งงานได้ไม่จำกัด</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>จับคู่คุณสมบัติด้วย Gemini 2.5 Flash RAG Unlimited</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>สกัดเอกสารประกาศสอบ PDF ได้ไม่จำกัดฉบับ</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>การแจ้งเตือน Realtime Web Push & Email ทันที</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>วิเคราะห์แนวโน้มอัตราเงินเดือน Salary Benchmark</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>ส่งออกรายงานเตรียมสอบ High-Res PDF / Excel</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                {currentTier === 'PREMIUM' ? (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full py-3 bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded-xl font-bold text-sm cursor-default"
                    >
                      ✓ คุณใช้งานแพ็กเกจนี้อยู่แล้ว
                    </button>
                    <button
                      onClick={handleToggleAutoRenew}
                      className="w-full text-xs text-slate-400 hover:text-amber-400 transition-all underline text-center block"
                    >
                      {subscription?.autoRenew ? 'ยกเลิกการต่ออายุอัตโนมัติ' : 'เปิดใช้งานการต่ออายุอัตโนมัติ'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCreateCheckout(billingCycle === 'MONTHLY' ? 'PREMIUM_MONTHLY' : 'PREMIUM_YEARLY')}
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    สมัครสมาชิก Premium ทันที
                  </button>
                )}
              </div>
            </div>

            {/* ENTERPRISE PLAN */}
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between hover:border-purple-500/60 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Agency & Enterprise
                    <Building2 className="w-5 h-5 text-purple-400" />
                  </h3>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/40">
                    องค์กร/สถาบัน
                  </span>
                </div>
                <p className="text-slate-400 text-xs min-h-[36px]">สำหรับศูนย์ติว สถาบันการศึกษา หรือหน่วยงานวิเคราะห์ข้อมูล</p>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-extrabold text-purple-300">฿990</span>
                  <span className="text-slate-400 text-sm">/ เดือน</span>
                </div>

                <ul className="space-y-3 pt-4 border-t border-slate-800 text-sm">
                  <li className="flex items-start gap-2.5 text-slate-200">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>รองรับผู้ใช้งานพร้อมกัน 5 บัญชี (Multi-seat)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-200">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>สิทธิ์เรียกใช้งาน Crawler & Extraction API Direct</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-200">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>ระบบแจ้งเตือน 50 เงื่อนไขคำค้นหาพร้อมกัน</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-200">
                    <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>Dedicated SLA & Priority Technical Support</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                {currentTier === 'ENTERPRISE' ? (
                  <button
                    disabled
                    className="w-full py-3 bg-purple-500/20 text-purple-300 border border-purple-500/50 rounded-xl font-bold text-sm cursor-default"
                  >
                    ✓ คุณใช้งานแพ็กเกจ Enterprise
                  </button>
                ) : (
                  <button
                    onClick={() => handleCreateCheckout('ENTERPRISE_MONTHLY')}
                    disabled={actionLoading}
                    className="w-full py-3 bg-slate-800 hover:bg-purple-900/40 border border-purple-500/40 text-purple-200 rounded-xl font-semibold text-sm transition-all"
                  >
                    อัปเกรดเป็น Enterprise
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              ตารางเปรียบเทียบสิทธิประโยชน์อย่างละเอียด (Feature Comparison Matrix)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">คุณสมบัติ / ฟีเจอร์</th>
                    <th className="py-3.5 px-4 text-center font-bold">Free Basic</th>
                    <th className="py-3.5 px-4 text-center font-bold text-amber-400">Premium Individual</th>
                    <th className="py-3.5 px-4 text-center font-bold text-purple-400">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr>
                    <td className="py-3 px-4 font-medium">สแกน & ค้นหาประกาศงานข้าราชการ</td>
                    <td className="py-3 px-4 text-center text-slate-400">ย้อนหลัง 30 วัน</td>
                    <td className="py-3 px-4 text-center text-amber-400 font-bold">ไม่จำกัดย้อนหลัง</td>
                    <td className="py-3 px-4 text-center text-purple-400 font-bold">ไม่จำกัดย้อนหลัง</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium"> Gemini RAG AI Matching ประมวลผลวุฒิ</td>
                    <td className="py-3 px-4 text-center text-slate-400">10 ครั้ง/วัน</td>
                    <td className="py-3 px-4 text-center text-amber-400 font-bold">ไม่จำกัด (Unlimited)</td>
                    <td className="py-3 px-4 text-center text-purple-400 font-bold">ไม่จำกัด (Unlimited)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">สกัดไฟล์ประกาศสอบ PDF ด้วย OCR/AI</td>
                    <td className="py-3 px-4 text-center text-slate-400">1 ฉบับ/วัน</td>
                    <td className="py-3 px-4 text-center text-amber-400 font-bold">ไม่จำกัด (Unlimited)</td>
                    <td className="py-3 px-4 text-center text-purple-400 font-bold">ไม่จำกัด (Unlimited)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">ช่องทางแจ้งเตือน Realtime Web Push / Email</td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      <X className="w-4 h-4 mx-auto text-slate-600" />
                    </td>
                    <td className="py-3 px-4 text-center text-amber-400">
                      <Check className="w-5 h-5 mx-auto text-amber-400" />
                    </td>
                    <td className="py-3 px-4 text-center text-purple-400">
                      <Check className="w-5 h-5 mx-auto text-purple-400" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">ส่งออกไฟล์สรุปเตรียมสอบ PDF / Excel</td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      <X className="w-4 h-4 mx-auto text-slate-600" />
                    </td>
                    <td className="py-3 px-4 text-center text-amber-400">
                      <Check className="w-5 h-5 mx-auto text-amber-400" />
                    </td>
                    <td className="py-3 px-4 text-center text-purple-400">
                      <Check className="w-5 h-5 mx-auto text-purple-400" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">สิทธิ์การเข้าถึง API Direct Access</td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      <X className="w-4 h-4 mx-auto text-slate-600" />
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      <X className="w-4 h-4 mx-auto text-slate-600" />
                    </td>
                    <td className="py-3 px-4 text-center text-purple-400 font-bold">
                      <Check className="w-5 h-5 mx-auto text-purple-400" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHECKOUT & PAYMENT GATEWAY */}
      {activeTab === 'CHECKOUT' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-amber-400" />
                  เกตเวย์ชำระเงินและเปิดใช้งานแพ็กเกจ
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  ทำรายการผ่านระบบชำระเงินความปลอดภัยสูง รองรับมาตรฐาน PromptPay EMVCo และบัตรเครดิต
                </p>
              </div>
              {checkoutSession && (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-mono font-bold rounded-full border border-amber-500/40">
                  REF: {checkoutSession.transactionRef}
                </span>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 block">เลือกช่องทางชำระเงิน (Payment Gateway)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('PROMPTPAY');
                    if (checkoutSession) handleCreateCheckout(selectedPlanId);
                  }}
                  className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                    paymentMethod === 'PROMPTPAY'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <QrCode className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold text-sm text-white">Thai PromptPay QR (ฟรีค่าธรรมเนียม)</p>
                    <p className="text-xs text-slate-400">สแกนผ่านแอป Mobile Banking ทุกธนาคาร</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('CREDIT_CARD');
                    if (checkoutSession) handleCreateCheckout(selectedPlanId);
                  }}
                  className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <p className="font-bold text-sm text-white">บัตรเครดิต / เดบิต (Stripe Gateway)</p>
                    <p className="text-xs text-slate-400">Visa, Mastercard, JCB พร้อมระบบ 3DS OTP</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Checkout Details */}
            {checkoutSession ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-4 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">รายการสั่งซื้อ:</span>
                    <h4 className="text-base font-bold text-white">{checkoutSession.planName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">ยอดชำระสุทธิ (รวม VAT 7%):</span>
                    <p className="text-2xl font-black text-amber-400">{formatMoney(checkoutSession.totalThb)}</p>
                  </div>
                </div>

                {/* PROMPTPAY DISPLAY */}
                {paymentMethod === 'PROMPTPAY' && (
                  <div className="space-y-6 text-center">
                    <div className="p-6 bg-white rounded-2xl w-fit mx-auto shadow-2xl border-4 border-emerald-500 relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase">
                        PromptPay EMVCo Standard
                      </div>
                      {/* Generated Dynamic Visual QR Code */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                          checkoutSession.qrCodePayload || '00020101021229370016A000000677010111011300668123456785802TH5303764540329963048839'
                        )}`}
                        alt="PromptPay QR Code"
                        className="w-52 h-52 mx-auto"
                      />
                      <p className="text-slate-900 font-bold text-xs mt-2">บริษัท เวอริโก้ เจเนอเรชัน จำกัด</p>
                    </div>

                    <div className="flex justify-center items-center gap-3 text-xs text-slate-400">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>
                        รหัสชำระเงินจะหมดอายุในอีก{' '}
                        <strong className="text-amber-400 font-mono text-sm">{formatCountdown(qrCountdown)}</strong> นาที
                      </span>
                    </div>

                    {/* Copy Payload Bar */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs font-mono max-w-lg mx-auto">
                      <span className="truncate text-slate-400 mr-2">{checkoutSession.qrCodePayload}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(checkoutSession.qrCodePayload || '');
                          setNotification({ type: 'info', message: 'คัดลอก PromptPay Payload เรียบร้อยแล้ว' });
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 font-sans font-semibold rounded shrink-0 flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        คัดลอก
                      </button>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleVerifyPayment}
                        disabled={actionLoading}
                        className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 mx-auto"
                      >
                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                        จำลองสแกนจ่ายผ่านแอปธนาคาร & ยืนยันรายการทันที
                      </button>
                    </div>
                  </div>
                )}

                {/* CREDIT CARD DISPLAY */}
                {paymentMethod === 'CREDIT_CARD' && (
                  <div className="space-y-4 max-w-lg mx-auto">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">ชื่อผู้ถือบัตร (Cardholder Name)</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-400">หมายเลขบัตรเครดิต (Card Number)</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">วันหมดอายุ (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400">CVC / CVV</label>
                        <input
                          type="password"
                          value={cardCvc}
                          maxLength={4}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setShowOtpModal(true)}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all mt-4 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      ชำระเงินด้วยบัตรเครดิต ({formatMoney(checkoutSession.totalThb)})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">ยังไม่มีรายการสั่งซื้อค้างชำระ</h4>
                  <p className="text-slate-400 text-xs">กรุณาเลือกแพ็กเกจสมาชิกที่ต้องการสมัครในแถบ "เปรียบเทียบแพ็กเกจสมาชิก"</p>
                </div>
                <button
                  onClick={() => setActiveTab('PLANS')}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
                >
                  เลือกแพ็กเกจสั่งซื้อ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FEATURE GATING DEMO */}
      {activeTab === 'GATED_FEATURES' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-400" />
                การทดสอบระบบสิทธิ์การเข้าถึงฟีเจอร์ (Subscription Middleware Feature Gate)
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                ทดสอบการทำงานของ Express Middleware (`requirePremiumTier`) ในการบล็อกผู้ใช้ระดับ Free และอนุญาตผู้ใช้ระดับ Premium/Enterprise
              </p>
            </div>

            {/* Quick Tier Override Buttons for Demo */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs text-slate-400">ระดับสิทธิ์ปัจจุบันของบัญชีคุณ:</span>
                <p className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  {currentTier === 'FREE' ? <Lock className="w-4 h-4 text-slate-400" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
                  {currentTier} TIER
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">สลับสิทธิ์ทดสอบ:</span>
                <button
                  onClick={() => handleQuickTierSwitch('FREE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    currentTier === 'FREE' ? 'bg-slate-700 text-white border border-slate-600' : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  สิทธิ์ FREE
                </button>
                <button
                  onClick={() => handleQuickTierSwitch('PREMIUM')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    currentTier === 'PREMIUM' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-amber-400 hover:bg-slate-800'
                  }`}
                >
                  สิทธิ์ PREMIUM
                </button>
              </div>
            </div>

            {/* Test Trigger */}
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                เรียกใช้งาน API Protected Route (`/api/subscription/gated-feature-access`)
              </h4>
              <p className="text-xs text-slate-400">
                ฟีเจอร์นี้ป้องกันการส่งออกไฟล์รายงานวิเคราะห์ความพร้อมสอบระดับลึก High-Res PDF หากเป็นผู้ใช้ FREE จะตอบกลับด้วย HTTP 403 Forbidden
              </p>

              <button
                onClick={handleTestGatedFeature}
                disabled={actionLoading}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                ส่งคำขอเข้าใช้งานฟีเจอร์สงวนสิทธิ์ (Test Protected Endpoint)
              </button>

              {/* Output Result */}
              {gatedTestResult && (
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">ผลการตอบกลับจากเซิร์ฟเวอร์ (API Response):</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded ${
                        gatedTestResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {gatedTestResult.success ? 'HTTP 200 OK (ALLOWED)' : 'HTTP 403 FORBIDDEN (LOCKED)'}
                    </span>
                  </div>

                  <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto max-h-64">
                    {JSON.stringify(gatedTestResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BILLING HISTORY & TAX INVOICE */}
      {activeTab === 'BILLING_HISTORY' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-amber-400" />
                  ประวัติการชำระเงิน & ใบกำกับภาษีเต็มรูปแบบ
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  ดาวน์โหลดและตรวจสอบใบกำกับภาษี/ใบเสร็จรับเงินอิเล็กทรอนิกส์ (e-Tax Invoice)
                </p>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">เลขที่เอกสาร</th>
                    <th className="py-3.5 px-4 font-bold">วันที่ออกเอกสาร</th>
                    <th className="py-3.5 px-4 font-bold">แพ็กเกจ</th>
                    <th className="py-3.5 px-4 font-bold text-right">ยอดรวม (THB)</th>
                    <th className="py-3.5 px-4 font-bold text-center">สถานะ</th>
                    <th className="py-3.5 px-4 font-bold text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {invoices.length > 0 ? (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition-all">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{inv.id}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">{new Date(inv.issueDate).toLocaleDateString('th-TH')}</td>
                        <td className="py-3.5 px-4 font-medium text-white">{inv.planName}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-white">{formatMoney(inv.totalAmount)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/40">
                            ชำระแล้ว (PAID)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            ดูใบกำกับภาษี
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                        ยังไม่มีประวัติการออกใบกำกับภาษี
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WEBHOOK SECURITY & DEVELOPER TOOLS */}
      {activeTab === 'SECURITY_WEBHOOK' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
                ระบบความปลอดภัย Webhook & HMAC-SHA256 Verification
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                จำลองการส่ง Webhook Payload จาก payment gateway พร้อมการตรวจสอบลายเซ็นดิจิทัลเพื่อป้องกันการปลอมแปลงคำสั่งชำระเงิน
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Webhook Secret Key (HMAC Key)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      setWebhookSecret('whsec_veriigo_prod_sprint13_' + Math.floor(Math.random() * 90000 + 10000));
                      setNotification({ type: 'info', message: 'สุ่มรหัส HMAC Secret Key ใหม่เรียบร้อย' });
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    สุ่มคีย์ใหม่
                  </button>
                </div>
              </div>

              <button
                onClick={handleRunWebhookDevTest}
                disabled={actionLoading}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                คำนวณ ลายเซ็น HMAC Signature & จำลองยิง Webhook Event
              </button>

              {webhookTestResult && (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                    <p className="text-slate-400">
                      HMAC Signature คำนวณได้: <span className="font-mono text-emerald-400 font-bold">{webhookTestResult.calculatedSignature}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-400">คำสั่ง cURL สำหรับทดสอบผ่าน Terminal:</p>
                  <pre className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-[11px] font-mono text-amber-200 overflow-x-auto whitespace-pre-wrap">
                    {webhookTestResult.curlCommand}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3DS OPT MODAL FOR CREDIT CARD */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">3D Secure 2.0 OTP Authentication</h3>
              <p className="text-xs text-slate-400">
                รหัสผ่านใช้ครั้งเดียวถูกส่งไปยังหมายเลขโทรศัพท์ 081-XXX-8812 ของคุณ
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block text-center">กรอกรหัส OTP (ทดสอบพิมพ์ 123456)</label>
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-xl font-mono bg-slate-950 border border-slate-800 rounded-xl py-3 text-amber-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOtpModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleVerifyPayment}
                disabled={actionLoading}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                ยืนยันการชำระเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL THAI TAX INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-2xl w-full space-y-6 shadow-2xl relative my-8">
            {/* Action Bar */}
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-slate-800" />
                <h3 className="font-bold text-slate-900 text-lg">ใบกำกับภาษี / ใบเสร็จรับเงิน (e-Tax Invoice)</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Invoice Body */}
            <div className="space-y-6 text-xs text-slate-800">
              {/* Header Info */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-extrabold text-slate-950 text-base">{selectedInvoice.companyName}</h4>
                  <p className="text-slate-600 mt-1">{selectedInvoice.companyAddress}</p>
                  <p className="text-slate-600 mt-0.5 font-mono">เลขประจำตัวผู้เสียภาษีอากร: {selectedInvoice.companyTaxId}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-xs">ชำระเงินแล้ว</span>
                  <p className="font-mono font-bold text-slate-950 text-sm mt-2">{selectedInvoice.id}</p>
                  <p className="text-slate-500 mt-0.5">วันที่: {new Date(selectedInvoice.issueDate).toLocaleDateString('th-TH')}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-slate-50 p-4 rounded-xl border space-y-1">
                <span className="font-bold text-slate-900">ข้อมูลผู้ซื้อ / ผู้รับบริการ:</span>
                <p className="font-semibold text-slate-900">{selectedInvoice.customerName}</p>
                <p className="text-slate-600">อีเมล: {selectedInvoice.customerEmail}</p>
                {selectedInvoice.customerTaxId && (
                  <p className="text-slate-600 font-mono">เลขประจำตัวผู้เสียภาษีผู้ซื้อ: {selectedInvoice.customerTaxId}</p>
                )}
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 bg-slate-100">
                    <th className="py-2.5 px-3 font-bold">ลำดับ</th>
                    <th className="py-2.5 px-3 font-bold">รายการ</th>
                    <th className="py-2.5 px-3 font-bold text-right">จำนวนเงิน (บาท)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-3 px-3 font-mono">1</td>
                    <td className="py-3 px-3 font-medium">{selectedInvoice.planName}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">{selectedInvoice.subtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Summary Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-2 text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>มูลค่าสินค้า/บริการ (Subtotal):</span>
                    <span className="font-mono">{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ภาษีมูลค่าเพิ่ม 7% (VAT 7%):</span>
                    <span className="font-mono">{selectedInvoice.vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-950 text-sm pt-2 border-t border-slate-900">
                    <span>จำนวนเงินรวมทั้งสิ้น:</span>
                    <span className="font-mono text-amber-600">{selectedInvoice.totalAmount.toFixed(2)} THB</span>
                  </div>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="pt-8 border-t flex justify-between items-end text-center text-[11px] text-slate-500">
                <div className="space-y-1">
                  <p className="font-mono">VERIIGO e-Tax Signature Hash: 8839a9101ff2</p>
                  <p>เอกสารนี้จัดทำและส่งข้อมูลให้กรมสรรพากรด้วยวิธีการทางอิเล็กทรอนิกส์</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  พิมพิ์ / ดาวน์โหลด PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
