import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Calendar,
  Clock,
  Cpu,
  Hash,
  AlertCircle,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import { DocumentEvidenceDoc } from '../../types/firestore';

interface TraceabilityViewProps {
  jobId: string;
  onBack?: () => void;
}

const formatEvidenceDate = (val: any): string => {
  if (!val) return 'ไม่ระบุ';
  try {
    if (typeof val === 'object' && typeof val.toDate === 'function') {
      return val.toDate().toLocaleDateString('th-TH');
    }
    return new Date(val).toLocaleDateString('th-TH');
  } catch {
    return 'ไม่ระบุ';
  }
};

const formatEvidenceDateTime = (val: any): string => {
  if (!val) return 'ไม่ระบุ';
  try {
    if (typeof val === 'object' && typeof val.toDate === 'function') {
      return val.toDate().toLocaleString('th-TH');
    }
    return new Date(val).toLocaleString('th-TH');
  } catch {
    return 'ไม่ระบุ';
  }
};

export const TraceabilityView: React.FC<TraceabilityViewProps> = ({ jobId, onBack }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [evidence, setEvidence] = useState<DocumentEvidenceDoc | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchEvidence = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/jobs/${jobId}/evidence`).then((r) => r.json());
        if (res.success) {
          setEvidence(res.data);
        }
      } catch (err) {
        console.error('Failed to load evidence', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvidence();
  }, [jobId]);

  const handleCopyHash = () => {
    if (evidence?.documentHashSHA256) {
      navigator.clipboard.writeText(evidence.documentHashSHA256);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-4">
        <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-slate-600 text-sm">กำลังตรวจสอบหลักฐานความถูกต้องของประกาศรับสมัครงาน (Document Evidence)...</div>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-slate-600 space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <div className="text-lg font-bold">ไม่พบหลักฐานดิจิทัลสำหรับประกาศนี้</div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition"
          >
            กลับสู่หน้ารายการงาน
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับ
        </button>
      )}

      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          VERIIGO Traceability & Document Proof (Phase 5)
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          หลักฐานการตรวจสอบย้อนกลับประกาศรับสมัครงานดิจิทัล
        </h1>
        <p className="text-slate-300 text-sm">
          พิสูจน์แหล่งที่มา วันเวลาที่ดักจับ ลายเซ็นต์ดิจิทัล SHA-256 และโมเดลปัญญาประดิษฐ์ที่ใช้ในการสกัดข้อมูล
        </p>
      </div>

      {/* Main Evidence Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-8">
        {/* SHA-256 Fingerprint Block */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-cyan-600" />
              Document Hash (SHA-256 Verification Fingerprint)
            </span>
            <button
              onClick={handleCopyHash}
              className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-700 font-bold transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'คัดลอกสำเร็จ' : 'คัดลอก Hash'}
            </button>
          </div>
          <div className="font-mono text-xs md:text-sm font-semibold text-slate-800 break-all bg-white p-3 rounded-lg border border-slate-200">
            {evidence.documentHashSHA256}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">หน่วยงานเจ้าของประกาศ</div>
                <div className="font-bold text-slate-900 text-base">{evidence.agencyName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">วันที่ประกาศ / วันที่ดักจับได้</div>
                <div className="font-semibold text-slate-800 text-sm">
                  {formatEvidenceDate(evidence.publishedDate)}{' '}
                  (ดักจับเมื่อ: {formatEvidenceDateTime(evidence.retrievedDate)})
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">ลิงก์ต้นฉบับประกาศทางการ</div>
                <a
                  href={evidence.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cyan-600 hover:underline text-sm break-all inline-flex items-center gap-1"
                >
                  {evidence.documentUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">AI Extraction Pipeline</div>
                <div className="font-bold text-slate-900 text-sm">
                  Model: {evidence.aiModel} | Parser: {evidence.parserVersion}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs text-slate-500">Confidence Score</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-extrabold text-emerald-600">{evidence.confidenceScore}%</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    {evidence.validationStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Reasons */}
        <div className="border-t border-slate-100 pt-6 space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">เหตุผลยืนยันความถูกต้อง (Confidence Reasons)</h3>
          <ul className="space-y-2">
            {evidence.validationResult?.confidenceReasons.map((reason, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
