import React, { useState, useMemo } from 'react';
import { HBPProcedure, ClaimDocumentChecklist } from '../types/hbp';
import {
  formatPackageWhatsAppText,
  generateStructuredAuditWhatsAppTemplate,
  downloadStructuredAuditTemplateTxt,
  openWhatsAppShare,
  AuditTemplateMode,
} from '../utils/whatsappShare';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import {
  X,
  Copy,
  Check,
  Send,
  Phone,
  FileText,
  CheckSquare,
  Sparkles,
  Info,
  Download,
  AlertTriangle,
  ShieldCheck,
  Building,
  User,
} from 'lucide-react';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedure: HBPProcedure;
  checklist?: ClaimDocumentChecklist[];
  patientId?: string;
  admissionDate?: string;
  notes?: string;
  auditorName?: string;
  defaultMode?: 'summary' | 'package' | AuditTemplateMode;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  procedure,
  checklist = [],
  patientId,
  admissionDate,
  notes: initialNotes,
  auditorName = 'Hospital Pre-Auth Officer',
  defaultMode = 'full_summary',
}) => {
  const [templateType, setTemplateType] = useState<AuditTemplateMode | 'package'>(() => {
    if (defaultMode === 'summary') return 'full_summary';
    return defaultMode;
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hospitalName, setHospitalName] = useState('Apex PM-JAY Empanelled Hospital');
  const [wardOrDoctor, setWardOrDoctor] = useState('');
  const [customNotes, setCustomNotes] = useState(initialNotes || '');
  const [copied, setCopied] = useState(false);
  const [downloadedTxt, setDownloadedTxt] = useState(false);

  // Compute structured text based on active template mode
  const whatsappText = useMemo(() => {
    if (templateType === 'package') {
      return formatPackageWhatsAppText(procedure);
    }
    return generateStructuredAuditWhatsAppTemplate(procedure, checklist, {
      patientId,
      admissionDate,
      auditorName,
      hospitalName,
      departmentOrWard: wardOrDoctor,
      notes: customNotes,
      templateMode: templateType as AuditTemplateMode,
    });
  }, [templateType, procedure, checklist, patientId, admissionDate, auditorName, hospitalName, wardOrDoctor, customNotes]);

  if (!isOpen) return null;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownloadTxt = () => {
    if (templateType === 'package') {
      const blob = new Blob([whatsappText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WhatsApp_Package_${procedure.procedure_code}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      downloadStructuredAuditTemplateTxt(procedure, checklist, {
        patientId,
        admissionDate,
        auditorName,
        hospitalName,
        departmentOrWard: wardOrDoctor,
        notes: customNotes,
        templateMode: templateType as AuditTemplateMode,
      });
    }
    setDownloadedTxt(true);
    setTimeout(() => setDownloadedTxt(false), 2000);
  };

  const handleSendToWhatsApp = () => {
    openWhatsAppShare(whatsappText, phoneNumber);
  };

  const verifiedCount = checklist.filter((i) => i.status === 'verified').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <WhatsAppIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Auditor Session Summary · WhatsApp Text Template
              </h2>
              <p className="text-xs text-emerald-100">
                Structured text message with current audit status and mandatory document checklist
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {/* Template Mode Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Select Structured WhatsApp Message Template:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setTemplateType('full_summary')}
                className={`flex flex-col items-center justify-center p-2 text-center rounded-lg border text-xs transition-all cursor-pointer ${
                  templateType === 'full_summary'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckSquare className="w-4 h-4 text-emerald-600 mb-1" />
                <span>Full Audit Summary</span>
                <span className="text-[10px] text-slate-500 font-normal">Checklist & Status</span>
              </button>

              <button
                onClick={() => setTemplateType('deficiency_alert')}
                className={`flex flex-col items-center justify-center p-2 text-center rounded-lg border text-xs transition-all cursor-pointer ${
                  templateType === 'deficiency_alert'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 mb-1" />
                <span>Deficiency Alert</span>
                <span className="text-[10px] text-slate-500 font-normal">Pending Docs Notice</span>
              </button>

              <button
                onClick={() => setTemplateType('preauth_clearance')}
                className={`flex flex-col items-center justify-center p-2 text-center rounded-lg border text-xs transition-all cursor-pointer ${
                  templateType === 'preauth_clearance'
                    ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-teal-700 mb-1" />
                <span>Pre-Auth Clearance</span>
                <span className="text-[10px] text-slate-500 font-normal">OT / Booking OK</span>
              </button>

              <button
                onClick={() => setTemplateType('package')}
                className={`flex flex-col items-center justify-center p-2 text-center rounded-lg border text-xs transition-all cursor-pointer ${
                  templateType === 'package'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600 mb-1" />
                <span>Package Catalog</span>
                <span className="text-[10px] text-slate-500 font-normal">Tariffs & Criteria</span>
              </button>
            </div>
          </div>

          {/* Template Customization Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Hospital / Institution Name
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="Hospital Name"
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Ward / Bed / Treating Doctor (Optional)
              </label>
              <input
                type="text"
                value={wardOrDoctor}
                onChange={(e) => setWardOrDoctor(e.target.value)}
                placeholder="e.g. Ward 4B / Dr. R. Sharma"
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Auditor Remark / Action Instructions (Appears in message)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Please attach histopathology biopsy report before 5:00 PM for pre-auth."
                className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Optional Direct Recipient Phone Number */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Recipient Mobile Number (Optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">Leave blank to choose any contact in WhatsApp</span>
            </div>
            <input
              type="tel"
              placeholder="e.g. 919876543210 (Country code + 10 digits)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full text-xs font-mono py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          {/* WhatsApp Chat Bubble Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Formatted Message Template Preview</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadTxt}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
                  title="Download template as plain text file"
                >
                  {downloadedTxt ? <Check className="w-3 h-3 text-emerald-600" /> : <Download className="w-3 h-3" />}
                  <span>{downloadedTxt ? 'Downloaded!' : 'Export .TXT'}</span>
                </button>
                <button
                  onClick={handleCopyText}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Template!' : 'Copy Template'}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Styled Card */}
            <div className="bg-[#e5ddd5] p-3 rounded-xl border border-slate-300/80 shadow-inner">
              <div className="bg-white rounded-lg p-3.5 shadow-xs max-h-56 overflow-y-auto text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-text border-l-4 border-emerald-500">
                {whatsappText}
              </div>
              <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 mt-1 font-mono">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-emerald-600 font-bold">✓✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyText}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Template'}</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs"
              title="Download structured template as .txt file"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{downloadedTxt ? 'Saved!' : 'Export .TXT'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSendToWhatsApp}
              className="w-1/2 sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
