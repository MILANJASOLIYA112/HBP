import React, { useState, useEffect } from 'react';
import { HBPProcedure, ClaimDocumentChecklist, AuditSession } from '../types/hbp';
import { splitMandatoryDocuments } from '../data/hbpData';
import {
  downloadAuditPdf,
  generateAuditSessionProgressPdf,
  downloadAuditSessionProgressPdf,
  generateAuditPdfSummary,
} from '../utils/exportAuditPdf';
import { RequiredDocumentTracker } from './RequiredDocumentTracker';
import { AuditComplianceChart } from './AuditComplianceChart';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ShieldCheck,
  Upload,
  Trash2,
  Check,
  RefreshCw,
  CheckSquare,
  BookmarkPlus,
  TrendingUp,
  FileDown,
  X,
  HardDrive,
  Loader2,
  ExternalLink,
  CloudDownload,
} from 'lucide-react';
import { uploadToGoogleDrive } from '../services/googleDriveService';
import { googleSignIn, getAccessToken } from '../services/googleAuth';
import { GoogleDriveHubModal } from './GoogleDriveHubModal';

export { RequiredDocumentTracker };
export {
  generateAuditSessionProgressPdf,
  downloadAuditSessionProgressPdf,
  generateAuditPdfSummary,
  downloadAuditPdf,
};

interface PreAuthClaimAuditorProps {
  procedures: HBPProcedure[];
  currentProcedure: HBPProcedure | null;
  onSelectProcedure: (procedure: HBPProcedure) => void;
  auditSessions?: AuditSession[];
  onSaveAuditSession?: (session: AuditSession) => void;
  onResetAuditSessions?: () => void;
}

export const PreAuthClaimAuditor: React.FC<PreAuthClaimAuditorProps> = ({
  procedures,
  currentProcedure,
  onSelectProcedure,
  auditSessions = [],
  onSaveAuditSession,
  onResetAuditSessions,
}) => {
  const activeProc = currentProcedure || procedures[0];

  const [auditorSubView, setAuditorSubView] = useState<'tracker' | 'dossier'>('tracker');
  const [patientId, setPatientId] = useState('PMJAY-PAT-2026-9041');
  const [admissionDate, setAdmissionDate] = useState('2026-09-28');
  const [checklist, setChecklist] = useState<ClaimDocumentChecklist[]>([]);
  const [activeStage, setActiveStage] = useState<'all' | 'pre_auth' | 'claim_processing'>('all');
  const [savedSessionNotification, setSavedSessionNotification] = useState<string | null>(null);
  const [driveNotificationLink, setDriveNotificationLink] = useState<string | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isDriveHubOpen, setIsDriveHubOpen] = useState(false);
  const [driveHubInitialTab, setDriveHubInitialTab] = useState<'save' | 'load' | 'files'>('load');

  const handleSessionLoadedFromDrive = (session: AuditSession) => {
    const found = procedures.find((p) => p.procedure_code === session.procedureCode);
    if (found) {
      onSelectProcedure(found);
    }
    if (session.patientId) {
      setPatientId(session.patientId);
    }
    if (onSaveAuditSession) {
      onSaveAuditSession(session);
    }
    setSavedSessionNotification(`Successfully restored audit session [${session.procedureCode}] from Google Drive (${session.patientId})!`);
  };

  const handleSaveToGoogleDrive = async () => {
    setIsSavingToDrive(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        const authResult = await googleSignIn();
        token = authResult?.accessToken || null;
      }
      if (!token) {
        alert('Google Drive authorization required.');
        return;
      }

      const doc = generateAuditSessionProgressPdf(activeProc, checklist, {
        patientId,
        admissionDate,
        auditorName: 'Medical Claims Auditor',
        notes: `Pre-Auth Readiness: ${preAuthVerified}/${preAuthItems.length}, Claim Readiness: ${claimVerified}/${claimItems.length}.`,
      });
      const blob = doc.output('blob');
      const filename = `AB_PMJAY_Audit_${activeProc.procedure_code}_${patientId}_${Date.now()}.pdf`;

      const uploaded = await uploadToGoogleDrive(token, blob, {
        name: filename,
        mimeType: 'application/pdf',
        description: `Audit dossier for Patient ${patientId}, Procedure ${activeProc.procedure_code}`,
      });

      setDriveNotificationLink(uploaded.webViewLink || null);
      setSavedSessionNotification(`Audit Dossier successfully saved to Google Drive: "${uploaded.name}"!`);
    } catch (err: any) {
      console.error('Error saving to Google Drive:', err);
      alert(`Could not save to Google Drive: ${err.message}`);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Initialize checklist when active procedure changes
  useEffect(() => {
    if (!activeProc) return;
    const preDocs = splitMandatoryDocuments(activeProc.mandatory_documents_pre_auth, 'pre_auth');
    const claimDocs = splitMandatoryDocuments(activeProc.mandatory_documents_claim_processing, 'claim_processing');
    setChecklist([...preDocs, ...claimDocs]);
  }, [activeProc?.procedure_code]);

  const updateDocStatus = (id: string, status: ClaimDocumentChecklist['status']) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              verifiedAt: status === 'verified' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
            }
          : item
      )
    );
  };

  const updateDocNotes = (id: string, notes: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item))
    );
  };

  const attachMockFile = (id: string, filename: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, fileMockName: filename, status: 'verified' } : item))
    );
  };

  const verifyAllStage = (stage: 'pre_auth' | 'claim_processing') => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.stage === stage
          ? { ...item, status: 'verified', verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          : item
      )
    );
  };

  const resetAll = () => {
    if (!activeProc) return;
    const preDocs = splitMandatoryDocuments(activeProc.mandatory_documents_pre_auth, 'pre_auth');
    const claimDocs = splitMandatoryDocuments(activeProc.mandatory_documents_claim_processing, 'claim_processing');
    setChecklist([...preDocs, ...claimDocs]);
  };

  const preAuthItems = checklist.filter((i) => i.stage === 'pre_auth');
  const claimItems = checklist.filter((i) => i.stage === 'claim_processing');

  const preAuthVerified = preAuthItems.filter((i) => i.status === 'verified').length;
  const claimVerified = claimItems.filter((i) => i.status === 'verified').length;

  const preAuthReady = preAuthItems.length > 0 && preAuthVerified === preAuthItems.length;
  const claimReady = claimItems.length > 0 && claimVerified === claimItems.length;

  // Active session object for Google Drive export
  const activeSessionData: AuditSession = {
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    patientId: patientId || 'PMJAY-PAT-2026-9041',
    procedureCode: activeProc.procedure_code,
    packageName: activeProc.package_name,
    specialty: activeProc.specialty,
    totalDocuments: checklist.length,
    verifiedDocuments: checklist.filter((i) => i.status === 'verified').length,
    complianceRate: checklist.length > 0 ? Math.round((checklist.filter((i) => i.status === 'verified').length / checklist.length) * 100) : 0,
    preAuthComplianceRate: preAuthItems.length > 0 ? Math.round((preAuthVerified / preAuthItems.length) * 100) : 100,
    claimComplianceRate: claimItems.length > 0 ? Math.round((claimVerified / claimItems.length) * 100) : 100,
    status: checklist.filter((i) => i.status === 'verified').length === checklist.length ? 'compliant' : 'partially_compliant',
    auditorName: 'Medical Auditor',
    notes: `Audited ${checklist.filter((i) => i.status === 'verified').length}/${checklist.length} documents on ${admissionDate}.`,
  };

  const displayedItems = checklist.filter((i) => {
    if (activeStage === 'all') return true;
    return i.stage === activeStage;
  });

  const handlePrint = () => {
    window.print();
  };

  // Save current audit session to history
  const handleSaveCurrentSession = () => {
    const total = checklist.length;
    const verified = checklist.filter((i) => i.status === 'verified').length;
    const preAuthTotal = preAuthItems.length;
    const preAuthDone = preAuthVerified;
    const claimTotal = claimItems.length;
    const claimDone = claimVerified;

    const complianceRate = total > 0 ? Math.round((verified / total) * 100) : 0;
    const preAuthComplianceRate = preAuthTotal > 0 ? Math.round((preAuthDone / preAuthTotal) * 100) : 100;
    const claimComplianceRate = claimTotal > 0 ? Math.round((claimDone / claimTotal) * 100) : 100;

    const newSession: AuditSession = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      patientId: patientId || 'PMJAY-PAT-2026-9041',
      procedureCode: activeProc.procedure_code,
      packageName: activeProc.package_name,
      specialty: activeProc.specialty,
      totalDocuments: total,
      verifiedDocuments: verified,
      complianceRate,
      preAuthComplianceRate,
      claimComplianceRate,
      status: complianceRate === 100 ? 'compliant' : complianceRate >= 50 ? 'partially_compliant' : 'deficient',
      auditorName: 'Medical Auditor',
      notes: `Audited ${verified}/${total} documents verified on ${admissionDate}.`,
    };

    if (onSaveAuditSession) {
      onSaveAuditSession(newSession);
    }

    setSavedSessionNotification(`Audit session for [${activeProc.procedure_code}] saved! Compliance: ${complianceRate}% (${verified}/${total} docs).`);
    setTimeout(() => setSavedSessionNotification(null), 4000);
  };

  // Export current audit session progress as formatted PDF summary
  const handleExportPdf = () => {
    downloadAuditPdf({
      procedure: activeProc,
      patientId: patientId || 'PMJAY-PAT-2026-9041',
      admissionDate: admissionDate || new Date().toISOString().split('T')[0],
      checklist: checklist,
      auditorName: 'Medical Claims Auditor',
      notes: `Pre-Auth Readiness: ${preAuthVerified}/${preAuthItems.length} (${preAuthReady ? 'Cleared' : 'Pending'}), Claim Readiness: ${claimVerified}/${claimItems.length} (${claimReady ? 'Ready' : 'Pending'}).`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {savedSessionNotification && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="font-medium">{savedSessionNotification}</span>
          </div>
          <div className="flex items-center gap-3">
            {driveNotificationLink && (
              <a
                href={driveNotificationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1 underline"
              >
                <span>Open in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer underline"
              title="Export saved audit status as structured WhatsApp text template"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export WhatsApp Template</span>
            </button>
            <button
              onClick={() => {
                setSavedSessionNotification(null);
                setDriveNotificationLink(null);
              }}
              className="text-teal-700 hover:text-teal-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Auditor Sub-View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setAuditorSubView('tracker')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              auditorSubView === 'tracker'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-teal-700" />
            <span>Required Document Tracker</span>
          </button>
          <button
            onClick={() => setAuditorSubView('dossier')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              auditorSubView === 'dossier'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-700" />
            <span>Full Clinical Dossier & Verification Sheet</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setDriveHubInitialTab('load');
              setIsDriveHubOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Load an audit session or procedure export from your Google Drive"
          >
            <CloudDownload className="w-3.5 h-3.5 text-teal-700" />
            <span>Load from Drive</span>
          </button>
          <button
            onClick={handleSaveToGoogleDrive}
            disabled={isSavingToDrive}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Upload and save patient audit dossier directly to your Google Drive"
          >
            {isSavingToDrive ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <HardDrive className="w-3.5 h-3.5" />
            )}
            <span>{isSavingToDrive ? 'Saving...' : 'Save to Drive'}</span>
          </button>
          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Export current audit status and mandatory document checklist as structured text message template for WhatsApp sharing"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Text Template</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Export audit summary and checklist to formatted PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-teal-700" />
            <span>Export PDF Summary</span>
          </button>
          <button
            onClick={handleSaveCurrentSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Audit Session</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: REQUIRED DOCUMENT TRACKER */}
      {auditorSubView === 'tracker' ? (
        <RequiredDocumentTracker
          procedures={procedures}
          currentProcedure={activeProc}
          onSelectProcedure={onSelectProcedure}
        />
      ) : (
        /* SUB-VIEW 2: DETAILED CLINICAL DOSSIER & CERTIFICATION */
        <div className="space-y-6">
          {/* Top Banner / Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-mono">
                  Clinical Pre-Auth & Claim Document Verification System
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Mandatory Document Compliance Dossier
                </h1>
              </div>

              {/* Quick Package Selector */}
              <div className="w-full md:w-80">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Target Package
                </label>
                <select
                  value={activeProc?.procedure_code || ''}
                  onChange={(e) => {
                    const found = procedures.find((p) => p.procedure_code === e.target.value);
                    if (found) onSelectProcedure(found);
                  }}
                  className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
                >
                  {procedures.map((proc) => (
                    <option key={proc.procedure_code} value={proc.procedure_code}>
                      [{proc.procedure_code}] {proc.package_name.slice(0, 32)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Package Details Pill-Free Summary */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{activeProc.procedure_code}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-800">{activeProc.package_name}</span>
                <span aria-hidden="true">·</span>
                <span>{activeProc.specialty}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span>Tier 3: {activeProc.package_amount_tier3}</span>
                <span aria-hidden="true">·</span>
                <span>LOS: {activeProc.los}d</span>
              </div>
            </div>
          </div>

          {/* Patient Meta and Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Patient Ref Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <label className="text-[11px] font-medium text-slate-500 block">Patient PM-JAY / Beneficiary ID</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full text-xs font-mono font-semibold text-slate-900 border border-slate-200 rounded px-2.5 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
              <div className="mt-2">
                <label className="text-[11px] font-medium text-slate-500 block">Date of Pre-Auth Request</label>
                <input
                  type="date"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                  className="w-full text-xs font-mono text-slate-900 border border-slate-200 rounded px-2.5 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>
            </div>

            {/* Pre-Auth Readiness Metric */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-500">Pre-Auth Compliance</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {preAuthVerified} / {preAuthItems.length} Verified
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={preAuthReady ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                  {preAuthReady ? 'Complete for Pre-Auth' : 'Mandatory Docs Pending'}
                </span>
                <button
                  onClick={() => verifyAllStage('pre_auth')}
                  className="text-[11px] text-teal-700 hover:text-teal-900 cursor-pointer font-medium"
                >
                  Verify All
                </button>
              </div>
            </div>

            {/* Claim Settlement Readiness Metric */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-500">Claim Settlement Compliance</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {claimVerified} / {claimItems.length} Verified
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={claimReady ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  {claimReady ? 'Ready for TMS Claim' : 'Discharge Docs Pending'}
                </span>
                <button
                  onClick={() => verifyAllStage('claim_processing')}
                  className="text-[11px] text-teal-700 hover:text-teal-900 cursor-pointer font-medium"
                >
                  Verify All
                </button>
              </div>
            </div>

            {/* Action Controls */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
              <div className="text-[11px] font-medium text-slate-500">Audit Actions</div>
              <div className="space-y-2 mt-2">
                <button
                  onClick={handleSaveCurrentSession}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded transition-colors cursor-pointer shadow-xs"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Save Session to History</span>
                </button>
                <button
                  onClick={() => setIsWhatsAppOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors cursor-pointer shadow-xs"
                  title="Export current audit status and mandatory document checklist as structured text message template for WhatsApp sharing"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Text Template</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Dossier Sheet</span>
                </button>
                <button
                  onClick={resetAll}
                  className="w-full flex items-center justify-center gap-1.5 py-1 px-3 text-xs font-medium text-slate-500 hover:text-slate-700 rounded transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Checklist</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stage Filter Tabs (Buttons) */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveStage('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeStage === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Documents ({checklist.length})
              </button>
              <button
                onClick={() => setActiveStage('pre_auth')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeStage === 'pre_auth' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pre-Authorization Phase ({preAuthItems.length})
              </button>
              <button
                onClick={() => setActiveStage('claim_processing')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeStage === 'claim_processing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Claim Processing & Discharge ({claimItems.length})
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Click status to toggle compliance state
            </div>
          </div>

          {/* Document Checklist Items */}
          <div className="space-y-3">
            {displayedItems.map((item, idx) => {
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    item.status === 'verified'
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : item.status === 'rejected'
                      ? 'bg-rose-50/30 border-rose-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-slate-400">#{idx + 1}</span>
                        <span className="font-semibold text-slate-700">
                          {item.stage === 'pre_auth' ? 'Pre-Authorization Requirement' : 'Claim Processing Requirement'}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-[11px] text-amber-800 font-medium">Mandatory</span>
                        {item.verifiedAt && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">·</span>
                            <span className="text-[11px] text-emerald-700 font-mono">Verified at {item.verifiedAt}</span>
                          </>
                        )}
                      </div>

                      <p className="text-sm font-medium text-slate-900 leading-snug">
                        {item.name}
                      </p>

                      {/* Attached file mock indicator */}
                      {item.fileMockName ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded w-fit mt-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="font-mono">{item.fileMockName}</span>
                          <button
                            onClick={() => attachMockFile(item.id, '')}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                            title="Remove file"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              const mockName = `${item.name.slice(0, 14).toLowerCase().replace(/[^a-z0-9]/g, '_')}_signed.pdf`;
                              attachMockFile(item.id, mockName);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-teal-700 cursor-pointer font-medium"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Simulate Document Upload</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                      <button
                        onClick={() => updateDocStatus(item.id, 'verified')}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                          item.status === 'verified'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Verified
                      </button>
                      <button
                        onClick={() => updateDocStatus(item.id, 'rejected')}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                          item.status === 'rejected'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Query / Deficient
                      </button>
                      <button
                        onClick={() => updateDocStatus(item.id, 'pending')}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                          item.status === 'pending'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Pending
                      </button>
                    </div>
                  </div>

                  {/* Auditor clinical observation note */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100/80">
                    <input
                      type="text"
                      placeholder="Add auditor verification remark / report findings / reference number..."
                      value={item.notes}
                      onChange={(e) => updateDocNotes(item.id, e.target.value)}
                      className="w-full text-xs text-slate-700 bg-transparent placeholder-slate-400 focus:outline-none focus:border-b focus:border-teal-700 py-0.5"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Official Sign-off Box for Claim Processing */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-xs text-slate-600 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
                <span className="font-bold text-slate-900 text-sm">HBP Claim Audit Certification</span>
              </div>
              <span className="font-mono text-slate-500">HBP Guidelines v2.2</span>
            </div>
            <p className="leading-relaxed">
              The verified documents above have been audited against the National Health Authority (NHA) PM-JAY Health Benefit Package master rules.
              Non-compliance with required pre-auth documents (such as MLC numbers, diagnostic histology, pre-procedure imaging, or post-procedure implant confirmation) may result in pre-auth rejection or recovery of claim settlement amount.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Official clinical audit report conforms to PM-JAY tariff guidelines.
              </span>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => setIsWhatsAppOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-xs"
                  title="Export audit status and mandatory document checklist as structured text message template"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Text Template</span>
                </button>
                <button
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Dossier as PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECHARTS AUDIT COMPLIANCE TREND CHART SECTION */}
      {auditSessions.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <AuditComplianceChart
            sessions={auditSessions}
            onAddSession={onSaveAuditSession}
            onResetSessions={onResetAuditSessions}
          />
        </div>
      )}
      {/* WhatsApp Share Modal */}
      {isWhatsAppOpen && activeProc && (
        <WhatsAppShareModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          procedure={activeProc}
          checklist={checklist}
          patientId={patientId}
          admissionDate={admissionDate}
          notes={`Pre-Auth: ${preAuthVerified}/${preAuthItems.length} (${preAuthReady ? 'Cleared' : 'Pending'}), Claim: ${claimVerified}/${claimItems.length} (${claimReady ? 'Ready' : 'Pending'}).`}
          defaultMode="summary"
        />
      )}

      {/* Google Drive Hub Modal */}
      {isDriveHubOpen && (
        <GoogleDriveHubModal
          isOpen={isDriveHubOpen}
          onClose={() => setIsDriveHubOpen(false)}
          activeSession={activeSessionData}
          procedures={procedures}
          onLoadAuditSession={handleSessionLoadedFromDrive}
          initialTab={driveHubInitialTab}
        />
      )}
    </div>
  );
};
