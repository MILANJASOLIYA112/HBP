import React, { useState, useMemo, useRef, useEffect } from 'react';
import { HBPProcedure, ClaimDocumentChecklist } from '../types/hbp';
import { splitMandatoryDocuments } from '../data/hbpData';
import { processImportedFile, ParsedImportedFile, formatFileSize } from '../utils/fileImport';
import {
  downloadAuditPdf,
  downloadAuditSessionProgressPdf,
  generateAuditSessionProgressPdf,
  generateAuditPdfSummary,
} from '../utils/exportAuditPdf';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import {
  GoogleDriveFile,
  uploadToGoogleDrive,
} from '../services/googleDriveService';
import {
  initAuth,
  googleSignIn,
  googleLogout,
  getAccessToken,
} from '../services/googleAuth';
import { User } from 'firebase/auth';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Check,
  RotateCcw,
  Paperclip,
  Square,
  FileSpreadsheet,
  FileCode,
  FileCheck2,
  Trash2,
  Eye,
  X,
  FileUp,
  Download,
  FileDown,
  Info,
  HardDrive,
  ExternalLink,
  Loader2,
  Building2,
  Stethoscope,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export {
  generateAuditSessionProgressPdf,
  downloadAuditSessionProgressPdf,
  generateAuditPdfSummary,
  downloadAuditPdf,
};

interface RequiredDocumentTrackerProps {
  procedures?: HBPProcedure[];
  currentProcedure: HBPProcedure;
  onSelectProcedure?: (procedure: HBPProcedure) => void;
}

export const RequiredDocumentTracker: React.FC<RequiredDocumentTrackerProps> = ({
  procedures = [],
  currentProcedure,
  onSelectProcedure,
}) => {
  // Checklist state mapped by procedure code
  const [checklistMap, setChecklistMap] = useState<Record<string, ClaimDocumentChecklist[]>>({});
  const [filterStage, setFilterStage] = useState<'all' | 'pre_auth' | 'claim_processing'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');

  // Google Drive & Auth State
  const [user, setUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [targetItemForDrive, setTargetItemForDrive] = useState<ClaimDocumentChecklist | null>(null);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveSuccessNotice, setDriveSuccessNotice] = useState<{ message: string; link?: string } | null>(null);

  // File preview & Modals state
  const [previewFile, setPreviewFile] = useState<ParsedImportedFile | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isWhatsAppShareOpen, setIsWhatsAppShareOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Hidden file inputs
  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const itemFileInputRef = useRef<HTMLInputElement>(null);
  const [targetItemIdForUpload, setTargetItemIdForUpload] = useState<string | null>(null);

  // Initialize Firebase Auth for Google Drive
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setDriveToken(token);
      },
      () => {
        setDriveToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Current procedure's checklist
  const currentChecklist: ClaimDocumentChecklist[] = useMemo(() => {
    if (!currentProcedure) return [];
    if (checklistMap[currentProcedure.procedure_code]) {
      return checklistMap[currentProcedure.procedure_code];
    }
    const preDocs = splitMandatoryDocuments(currentProcedure.mandatory_documents_pre_auth, 'pre_auth');
    const claimDocs = splitMandatoryDocuments(currentProcedure.mandatory_documents_claim_processing, 'claim_processing');
    return [...preDocs, ...claimDocs];
  }, [currentProcedure?.procedure_code, checklistMap]);

  // Toggle completion status of an item
  const toggleItemCompletion = (itemId: string) => {
    const updated = currentChecklist.map((item) => {
      if (item.id === itemId) {
        const isNowComplete = item.status !== 'verified';
        return {
          ...item,
          status: isNowComplete ? ('verified' as const) : ('pending' as const),
          verifiedAt: isNowComplete
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined,
          fileMockName: isNowComplete
            ? item.fileMockName || `${item.name.slice(0, 16).toLowerCase().replace(/[^a-z0-9]/g, '_')}_verified.pdf`
            : undefined,
        };
      }
      return item;
    });

    setChecklistMap((prev) => ({
      ...prev,
      [currentProcedure.procedure_code]: updated,
    }));
  };

  // Attach a Google Drive file to an item
  const handleAttachGoogleDriveFile = (file: GoogleDriveFile) => {
    if (!targetItemForDrive) return;

    const updated = currentChecklist.map((item) => {
      if (item.id === targetItemForDrive.id) {
        return {
          ...item,
          status: 'verified' as const,
          verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fileMockName: file.name,
          driveFile: {
            id: file.id,
            name: file.name,
            webViewLink: file.webViewLink,
            size: file.size,
          },
        };
      }
      return item;
    });

    setChecklistMap((prev) => ({
      ...prev,
      [currentProcedure.procedure_code]: updated,
    }));

    setDriveSuccessNotice({
      message: `Attached "${file.name}" from Google Drive to ${targetItemForDrive.name}.`,
      link: file.webViewLink,
    });
    setTimeout(() => setDriveSuccessNotice(null), 6000);
    setTargetItemForDrive(null);
  };

  // Save full audit dossier directly to Google Drive
  const handleSaveDossierToGoogleDrive = async () => {
    if (!driveToken) {
      try {
        const res = await googleSignIn();
        if (!res) return;
        setDriveToken(res.accessToken);
        setUser(res.user);
      } catch (err: any) {
        alert(`Google Sign-In failed: ${err.message}`);
        return;
      }
    }

    const token = driveToken || (await getAccessToken());
    if (!token) {
      alert('Google Drive authorization required.');
      return;
    }

    setIsUploadingToDrive(true);
    try {
      const doc = generateAuditSessionProgressPdf(currentProcedure, currentChecklist, {
        auditorName: user?.displayName || 'Clinical Auditor',
        notes: `Clinical Dossier for Department of ${currentProcedure.specialty}. Mandatory documents verified.`,
      });

      const pdfBlob = doc.output('blob');
      const filename = `AB_PMJAY_Dossier_[${currentProcedure.procedure_code}]_${currentProcedure.specialty.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

      const uploaded = await uploadToGoogleDrive(token, pdfBlob, {
        name: filename,
        mimeType: 'application/pdf',
        description: `AB-PMJAY Audit Compliance Dossier for Procedure ${currentProcedure.procedure_code} (${currentProcedure.package_name}). Verified by ${user?.displayName || 'Auditor'}.`,
      });

      setDriveSuccessNotice({
        message: `Audit Dossier successfully saved to your Google Drive!`,
        link: uploaded.webViewLink,
      });
    } catch (err: any) {
      console.error('Error saving dossier to Google Drive:', err);
      alert(`Could not save dossier to Google Drive: ${err.message}`);
    } finally {
      setIsUploadingToDrive(false);
    }
  };

  // Remove attached file
  const removeAttachedFile = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = currentChecklist.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          status: 'pending' as const,
          verifiedAt: undefined,
          fileMockName: undefined,
          attachedFile: undefined,
          driveFile: undefined,
        };
      }
      return item;
    });

    setChecklistMap((prev) => ({
      ...prev,
      [currentProcedure.procedure_code]: updated,
    }));
  };

  // Upload local file to item
  const handleItemFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetItemIdForUpload) return;

    try {
      const parsed = await processImportedFile(file);
      const updated = currentChecklist.map((item) => {
        if (item.id === targetItemIdForUpload) {
          return {
            ...item,
            status: 'verified' as const,
            verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            fileMockName: parsed.name,
            attachedFile: {
              name: parsed.name,
              size: parsed.size,
              type: parsed.type,
              format: parsed.format,
              contentPreview: parsed.previewText,
              lastModified: parsed.lastModified,
            },
          };
        }
        return item;
      });

      setChecklistMap((prev) => ({
        ...prev,
        [currentProcedure.procedure_code]: updated,
      }));

      setNotification(`Document attached: "${parsed.name}" verified.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Failed to read file: ${err.message}`);
    } finally {
      e.target.value = '';
      setTargetItemIdForUpload(null);
    }
  };

  // Batch toggle all items
  const handleMarkAll = (status: 'verified' | 'pending') => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = currentChecklist.map((item) => ({
      ...item,
      status,
      verifiedAt: status === 'verified' ? timeNow : undefined,
      fileMockName: status === 'verified' ? item.fileMockName || `${item.name.slice(0, 14).toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf` : undefined,
    }));

    setChecklistMap((prev) => ({
      ...prev,
      [currentProcedure.procedure_code]: updated,
    }));
  };

  // Stage filters & calculations
  const preAuthList = currentChecklist.filter((i) => i.stage === 'pre_auth');
  const claimList = currentChecklist.filter((i) => i.stage === 'claim_processing');

  const preAuthCompleted = preAuthList.filter((i) => i.status === 'verified').length;
  const claimCompleted = claimList.filter((i) => i.status === 'verified').length;

  const totalCount = currentChecklist.length;
  const completedCount = currentChecklist.filter((i) => i.status === 'verified').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const preAuthPct = preAuthList.length > 0 ? Math.round((preAuthCompleted / preAuthList.length) * 100) : 100;
  const claimPct = claimList.length > 0 ? Math.round((claimCompleted / claimList.length) * 100) : 100;

  // Filtered Checklist
  const filteredList = currentChecklist.filter((item) => {
    if (filterStage !== 'all' && item.stage !== filterStage) return false;
    if (filterStatus === 'completed' && item.status !== 'verified') return false;
    if (filterStatus === 'pending' && item.status === 'verified') return false;
    return true;
  });

  // Department-wide procedures
  const departmentProcedures = useMemo(() => {
    return procedures.filter((p) => p.specialty_code === currentProcedure.specialty_code);
  }, [procedures, currentProcedure.specialty_code]);

  return (
    <div className="space-y-5">
      {/* Hidden file input for single item upload */}
      <input
        type="file"
        ref={itemFileInputRef}
        onChange={handleItemFileChange}
        accept=".pdf,.xlsx,.xls,.xml,.csv,text/csv,application/pdf,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
        className="hidden"
      />

      {/* DEPARTMENT & PROCEDURE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-xl p-5 shadow-sm border border-teal-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                DEPARTMENT: {currentProcedure.specialty.toUpperCase()} ({currentProcedure.specialty_code})
              </span>
              <span className="text-teal-200/60 text-xs">·</span>
              <span className="text-xs text-teal-100 font-mono">
                {departmentProcedures.length} Procedure{departmentProcedures.length > 1 ? 's' : ''} in Department
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>{currentProcedure.package_name}</span>
              <span className="font-mono text-sm px-2 py-0.5 rounded bg-white/10 text-teal-200 border border-white/10">
                {currentProcedure.procedure_code}
              </span>
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl line-clamp-2">
              {currentProcedure.procedure_name}
            </p>
          </div>

          {/* Quick Department Procedure Switcher */}
          {departmentProcedures.length > 1 && onSelectProcedure && (
            <div className="w-full lg:w-72 shrink-0 bg-white/10 p-2.5 rounded-lg border border-white/15">
              <label className="block text-[11px] font-semibold text-teal-200 mb-1">
                Switch Procedure in Department:
              </label>
              <select
                value={currentProcedure.procedure_code}
                onChange={(e) => {
                  const target = procedures.find((p) => p.procedure_code === e.target.value);
                  if (target) onSelectProcedure(target);
                }}
                className="w-full text-xs font-mono py-1.5 px-2 rounded bg-slate-900 text-white border border-teal-700/80 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
              >
                {departmentProcedures.map((p) => (
                  <option key={p.procedure_code} value={p.procedure_code}>
                    [{p.procedure_code}] {p.package_name.slice(0, 28)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Department Clinical Metrics Ribbon */}
        <div className="mt-4 pt-3 border-t border-teal-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Base Tariff (Tier 3):</span>
            <span className="font-mono font-bold text-white text-sm">
              ₹{currentProcedure.package_amount_tier3}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Standard Length of Stay:</span>
            <span className="font-mono font-bold text-white text-sm">
              {currentProcedure.los} {currentProcedure.los === 'NA' ? '' : 'Days'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Implants Mapped:</span>
            <span className="font-bold text-teal-300 text-sm">
              {currentProcedure.implant_mapped === 'NA' ? 'No Implants' : currentProcedure.implant_mapped}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Public Hospital Reserve:</span>
            <span className={`font-bold text-sm ${currentProcedure.reservation_public_hospitals === 'Yes' ? 'text-amber-300' : 'text-slate-300'}`}>
              {currentProcedure.reservation_public_hospitals === 'Yes' ? 'Reserved' : 'Open to All'}
            </span>
          </div>
        </div>
      </div>

      {/* GOOGLE DRIVE INTEGRATION & ACTION BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Google Drive Status / Connect Button */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
            <HardDrive className="w-5 h-5 text-teal-700" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Google Drive Workspace</span>
              {driveToken ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  <Check className="w-3 h-3 text-emerald-600" /> Connected
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Ready to Connect
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {user ? (
                <span>Connected as <strong className="text-slate-800 font-mono">{user.email}</strong> · Direct Drive upload & attachment active</span>
              ) : (
                <span>Sign in with Google to save clinical dossiers and attach patient reports from Drive</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Google Drive Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {!driveToken ? (
            /* Official Google Sign In Button */
            <button
              onClick={async () => {
                try {
                  const res = await googleSignIn();
                  if (res) {
                    setUser(res.user);
                    setDriveToken(res.accessToken);
                  }
                } catch (e: any) {
                  alert(`Sign-in failed: ${e.message}`);
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Connect Google Drive</span>
            </button>
          ) : (
            <>
              {/* Save Dossier directly to Google Drive */}
              <button
                onClick={handleSaveDossierToGoogleDrive}
                disabled={isUploadingToDrive}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                title="Compile and upload patient compliance audit PDF directly into your Google Drive"
              >
                {isUploadingToDrive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingToDrive ? 'Saving to Drive...' : 'Save Dossier to Drive'}</span>
              </button>

              {/* Browse Google Drive Files */}
              <button
                onClick={() => {
                  setTargetItemForDrive(null);
                  setIsDrivePickerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Browse and search Google Drive files"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Browse Drive</span>
              </button>
            </>
          )}

          {/* WhatsApp Text Template Option */}
          <button
            onClick={() => setIsWhatsAppShareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Share audit checklist as structured WhatsApp text"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Text</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={() => downloadAuditSessionProgressPdf(currentProcedure, currentChecklist)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Download audit checklist PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-teal-700" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Drive Notifications */}
      {driveSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{driveSuccessNotice.message}</span>
          </div>
          {driveSuccessNotice.link && (
            <a
              href={driveSuccessNotice.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-teal-800 hover:text-teal-950 underline flex items-center gap-1 ml-3 shrink-0"
            >
              <span>View in Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {notification && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="font-medium">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-teal-700 hover:text-teal-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* COMPLIANCE READINESS PROGRESS BAR SECTION */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
        {/* Overall Compliance Readiness Bar */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Overall Compliance Readiness:</span>
              <span className="font-mono text-base font-extrabold text-teal-800 tabular-nums">
                {progressPercent}%
              </span>
              <span className="text-slate-500 font-mono">
                ({completedCount} of {totalCount} mandatory documents verified)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {progressPercent === 100 ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> 100% Cleared for Claim Approval
                </span>
              ) : progressPercent >= 50 ? (
                <span className="text-teal-700 font-semibold">Partially Compliant · Verification in Progress</span>
              ) : (
                <span className="text-amber-800 font-semibold">Deficient · Mandatory Documents Missing</span>
              )}
            </div>
          </div>

          {/* Large Visual Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200/60">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                progressPercent === 100
                  ? 'bg-emerald-600'
                  : progressPercent >= 50
                  ? 'bg-teal-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Dual Stage Progress Indicators (Pre-Auth vs Claim Settlement) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Pre-Auth Bar */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Pre-Authorization Readiness (Prior to Admission)</span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {preAuthCompleted}/{preAuthList.length} ({preAuthPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  preAuthPct === 100 ? 'bg-emerald-600' : 'bg-teal-600'
                }`}
                style={{ width: `${preAuthPct}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>{preAuthPct === 100 ? '✓ Ready for Pre-Auth Approval' : 'Mandatory prior to surgical intervention'}</span>
              <span className="font-mono font-semibold text-slate-700">{preAuthList.length - preAuthCompleted} pending</span>
            </div>
          </div>

          {/* Claim Settlement Bar */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Claim Settlement Readiness (Post-Op / Discharge)</span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {claimCompleted}/{claimList.length} ({claimPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  claimPct === 100 ? 'bg-emerald-600' : 'bg-teal-600'
                }`}
                style={{ width: `${claimPct}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between">
              <span>{claimPct === 100 ? '✓ Ready for TMS Settlement' : 'Required for hospital bill reimbursement'}</span>
              <span className="font-mono font-semibold text-slate-700">{claimList.length - claimCompleted} pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & BATCH ACTIONS TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
        {/* Stage Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilterStage('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              filterStage === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Mandatory ({totalCount})
          </button>
          <button
            onClick={() => setFilterStage('pre_auth')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              filterStage === 'pre_auth' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pre-Auth Stage ({preAuthList.length})
          </button>
          <button
            onClick={() => setFilterStage('claim_processing')}
            className={`px-3 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              filterStage === 'claim_processing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Claim Settlement Stage ({claimList.length})
          </button>
        </div>

        {/* Status Filter & Batch Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-0.5 rounded cursor-pointer ${
                filterStatus === 'all' ? 'bg-white shadow-2xs font-medium text-slate-900' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-0.5 rounded cursor-pointer ${
                filterStatus === 'pending' ? 'bg-amber-100 font-medium text-amber-900' : 'text-slate-600'
              }`}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-0.5 rounded cursor-pointer ${
                filterStatus === 'completed' ? 'bg-emerald-100 font-medium text-emerald-900' : 'text-slate-600'
              }`}
            >
              Verified ({completedCount})
            </button>
          </div>

          <button
            onClick={() => handleMarkAll('verified')}
            className="px-2.5 py-1 font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
          >
            Mark All Verified
          </button>

          <button
            onClick={() => handleMarkAll('pending')}
            className="px-2.5 py-1 font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* MANDATORY DOCUMENTS CHECKLIST */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-white">
            No mandatory documents match the selected filter criteria.
          </div>
        ) : (
          filteredList.map((item, index) => {
            const isCompleted = item.status === 'verified';
            const attached = item.attachedFile;
            const driveFile = item.driveFile;

            return (
              <div
                key={item.id}
                onClick={() => toggleItemCompletion(item.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left: Checkbox & Document Title */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItemCompletion(item.id);
                    }}
                    className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
                      isCompleted ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-slate-400">#{index + 1}</span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight px-1.5 py-0.5 rounded bg-slate-100">
                        {item.stage === 'pre_auth' ? 'Pre-Auth Mandatory' : 'Claim Settlement'}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Required
                      </span>
                      {item.verifiedAt && (
                        <span className="text-[11px] text-emerald-700 font-mono">
                          Verified at {item.verifiedAt}
                        </span>
                      )}
                    </div>

                    <p className={`text-sm font-semibold leading-relaxed transition-colors ${
                      isCompleted ? 'text-emerald-950' : 'text-slate-900'
                    }`}>
                      {item.name}
                    </p>

                    {/* Attached Drive or Local File Badges */}
                    {(driveFile || attached || item.fileMockName) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {driveFile ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-900 text-xs">
                            <HardDrive className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span className="font-mono font-semibold truncate max-w-xs">{driveFile.name}</span>
                            {driveFile.webViewLink && (
                              <a
                                href={driveFile.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-teal-700 hover:text-teal-950 ml-1"
                                title="Open in Google Drive"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-mono">
                            <Paperclip className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-xs">{attached?.name || item.fileMockName}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => removeAttachedFile(item.id, e)}
                          title="Remove attached file"
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Attachment Actions & Verification Status */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  {/* Attach from Google Drive button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetItemForDrive(item);
                      setIsDrivePickerOpen(true);
                    }}
                    title="Attach document directly from your Google Drive"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-teal-700" />
                    <span>Attach from Drive</span>
                  </button>

                  {/* Upload Local File button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetItemIdForUpload(item.id);
                      itemFileInputRef.current?.click();
                    }}
                    title="Upload local PDF, image, or clinical file"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Upload Local</span>
                  </button>

                  {/* Verification Status Pill */}
                  {isCompleted ? (
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1 bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-300">
                      <Check className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-800 flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pending</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Google Drive Picker Modal */}
      <GoogleDrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => {
          setIsDrivePickerOpen(false);
          setTargetItemForDrive(null);
        }}
        onSelectFile={handleAttachGoogleDriveFile}
        targetDocName={targetItemForDrive?.name}
        patientId={`PMJAY-${currentProcedure.procedure_code}`}
        procedureCode={currentProcedure.procedure_code}
      />

      {/* WhatsApp Share Modal */}
      {isWhatsAppShareOpen && (
        <WhatsAppShareModal
          procedure={currentProcedure}
          checklist={currentChecklist}
          isOpen={isWhatsAppShareOpen}
          onClose={() => setIsWhatsAppShareOpen(false)}
        />
      )}
    </div>
  );
};
