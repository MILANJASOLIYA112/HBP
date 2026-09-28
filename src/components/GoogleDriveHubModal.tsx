import React, { useState, useEffect } from 'react';
import {
  GoogleDriveFile,
  listGoogleDriveFiles,
  downloadDriveFileText,
  saveAuditSessionJsonToDrive,
  saveProceduresExportToDrive,
  deleteGoogleDriveFile,
} from '../services/googleDriveService';
import {
  googleSignIn,
  googleLogout,
  getAccessToken,
  initAuth,
} from '../services/googleAuth';
import { HBPProcedure, AuditSession } from '../types/hbp';
import { User } from 'firebase/auth';
import {
  X,
  HardDrive,
  Upload,
  Download,
  FileText,
  FileJson,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Trash2,
  Loader2,
  BookmarkCheck,
  PackageOpen,
  ArrowRight,
  Database,
  CloudDownload,
  CloudUpload,
} from 'lucide-react';

interface GoogleDriveHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession?: AuditSession | null;
  procedures?: HBPProcedure[];
  onLoadAuditSession?: (session: AuditSession) => void;
  onLoadProcedures?: (procedures: HBPProcedure[]) => void;
  initialTab?: 'save' | 'load' | 'files';
}

export const GoogleDriveHubModal: React.FC<GoogleDriveHubModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  procedures = [],
  onLoadAuditSession,
  onLoadProcedures,
  initialTab = 'load',
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'files'>(initialTab);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Files state
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<'all' | 'sessions' | 'catalog'>('all');

  // Action status
  const [statusNotice, setStatusNotice] = useState<{ message: string; type: 'success' | 'error'; link?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && token) {
      fetchFiles(token);
    }
  }, [isOpen, token]);

  const fetchFiles = async (currentToken: string, query?: string) => {
    setIsLoadingFiles(true);
    try {
      const driveFiles = await listGoogleDriveFiles(currentToken, { query });
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Error fetching files:', err);
      setStatusNotice({ message: err.message || 'Failed to fetch Drive files', type: 'error' });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusNotice(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        await fetchFiles(res.accessToken);
      }
    } catch (err: any) {
      setStatusNotice({ message: err.message || 'Sign in failed', type: 'error' });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await googleLogout();
    setUser(null);
    setToken(null);
    setFiles([]);
  };

  // SAVE: Procedures Export to Drive
  const handleSaveProceduresToDrive = async () => {
    if (!token) return;
    setIsProcessing(true);
    setStatusNotice(null);
    try {
      const uploaded = await saveProceduresExportToDrive(token, procedures);
      setStatusNotice({
        message: `Master Catalog (${procedures.length} procedures) successfully saved to your Google Drive!`,
        type: 'success',
        link: uploaded.webViewLink,
      });
      await fetchFiles(token);
    } catch (err: any) {
      setStatusNotice({ message: err.message || 'Failed to save catalog to Drive', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // SAVE: Active Audit Session to Drive
  const handleSaveSessionToDrive = async () => {
    if (!token || !activeSession) return;
    setIsProcessing(true);
    setStatusNotice(null);
    try {
      const uploaded = await saveAuditSessionJsonToDrive(token, activeSession);
      setStatusNotice({
        message: `Audit Session for [${activeSession.procedureCode}] saved to your Google Drive!`,
        type: 'success',
        link: uploaded.webViewLink,
      });
      await fetchFiles(token);
    } catch (err: any) {
      setStatusNotice({ message: err.message || 'Failed to save audit session to Drive', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // LOAD: File from Drive
  const handleLoadFileContent = async (file: GoogleDriveFile) => {
    if (!token) return;
    setIsProcessing(true);
    setStatusNotice(null);
    try {
      const text = await downloadDriveFileText(token, file.id);
      const parsed = JSON.parse(text);

      // Check if it's an AuditSession
      if (parsed.procedureCode && parsed.complianceRate !== undefined && onLoadAuditSession) {
        onLoadAuditSession(parsed as AuditSession);
        setStatusNotice({
          message: `Successfully loaded audit session for [${parsed.procedureCode}] (${parsed.patientId}) from Google Drive!`,
          type: 'success',
        });
        setTimeout(() => onClose(), 2000);
        return;
      }

      // Check if it's procedures array
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].procedure_code && onLoadProcedures) {
        onLoadProcedures(parsed as HBPProcedure[]);
        setStatusNotice({
          message: `Successfully imported ${parsed.length} procedures from Google Drive into Master Catalog!`,
          type: 'success',
        });
        setTimeout(() => onClose(), 2000);
        return;
      }

      throw new Error('Unrecognized file structure. Expected Audit Session or Procedures list in JSON.');
    } catch (err: any) {
      setStatusNotice({
        message: `Could not load file: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (file: GoogleDriveFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await deleteGoogleDriveFile(token, file.id, file.name);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err: any) {
      alert(`Could not delete file: ${err.message}`);
    }
  };

  // Filtered files for load view
  const displayFiles = files.filter((f) => {
    if (selectedFileType === 'sessions') {
      return f.name.toLowerCase().includes('audit') || f.name.toLowerCase().includes('session');
    }
    if (selectedFileType === 'catalog') {
      return (
        f.name.toLowerCase().includes('package') ||
        f.name.toLowerCase().includes('catalog') ||
        f.name.toLowerCase().includes('hbp')
      );
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
              <HardDrive className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Google Drive Storage Hub</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800 uppercase tracking-wider">
                  OAuth Client Storage
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Save & load audit sessions and procedure catalog exports directly with your personal Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Ribbon or Status Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-teal-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {token && user ? (
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full border border-teal-300" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-[10px]">
                  {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-800">{user.displayName || 'Google Drive Connected'}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="text-teal-700 font-mono">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-600">
              Sign in with your Google account to access your personal Google Drive cloud storage.
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {token ? (
              <button
                onClick={handleSignOut}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Disconnect Account
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                {isAuthenticating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {statusNotice && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
              statusNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{statusNotice.message}</span>
            </div>
            {statusNotice.link && (
              <a
                href={statusNotice.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline flex items-center gap-1 ml-3"
              >
                <span>View in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Mode Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('load')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'load'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudDownload className="w-4 h-4 text-teal-700" />
            <span>Load from Google Drive</span>
          </button>
          <button
            onClick={() => setActiveTab('save')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'save'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudUpload className="w-4 h-4 text-teal-700" />
            <span>Save to Google Drive</span>
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'files'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4 text-teal-700" />
            <span>All Drive Files ({files.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!token ? (
            <div className="py-12 text-center space-y-4 max-w-md mx-auto">
              <HardDrive className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h4 className="text-base font-bold text-slate-900">Sign in to Access Google Drive</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Authenticate using the OAuth Client to save and load your audit sessions, clinical compliance reports, and procedure packages directly from your personal storage.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-300 rounded-lg shadow-xs hover:shadow transition-all cursor-pointer"
              >
                {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin text-teal-700" /> : <HardDrive className="w-4 h-4 text-teal-700" />}
                <span>Connect Personal Google Drive</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: LOAD FROM GOOGLE DRIVE */}
              {activeTab === 'load' && (
                <div className="space-y-4">
                  {/* Category Filter & Refresh */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button
                        onClick={() => setSelectedFileType('all')}
                        className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                          selectedFileType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        All Documents
                      </button>
                      <button
                        onClick={() => setSelectedFileType('sessions')}
                        className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                          selectedFileType === 'sessions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Audit Sessions
                      </button>
                      <button
                        onClick={() => setSelectedFileType('catalog')}
                        className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                          selectedFileType === 'catalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Procedure Catalogs
                      </button>
                    </div>

                    <button
                      onClick={() => token && fetchFiles(token)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                      <span>Refresh Drive</span>
                    </button>
                  </div>

                  {/* List of Files */}
                  {isLoadingFiles ? (
                    <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
                      <span>Reading files from your Google Drive storage...</span>
                    </div>
                  ) : displayFiles.length === 0 ? (
                    <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <FileJson className="w-8 h-8 text-slate-300 mx-auto" />
                      <div className="text-xs font-semibold text-slate-700">No compatible audit or catalog exports found</div>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Save your first audit session or procedure export using the "Save to Google Drive" tab.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[380px] overflow-y-auto">
                      {displayFiles.map((file) => {
                        const isAuditSession =
                          file.name.toLowerCase().includes('audit') || file.name.toLowerCase().includes('session');
                        const isCatalog =
                          file.name.toLowerCase().includes('package') || file.name.toLowerCase().includes('catalog');

                        return (
                          <div
                            key={file.id}
                            className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                                {isAuditSession ? (
                                  <BookmarkCheck className="w-4 h-4 text-teal-700" />
                                ) : isCatalog ? (
                                  <PackageOpen className="w-4 h-4 text-teal-700" />
                                ) : (
                                  <FileText className="w-4 h-4 text-slate-600" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-slate-900 truncate">{file.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>
                                    {isAuditSession
                                      ? 'Audit Session Record'
                                      : isCatalog
                                      ? 'Procedure Catalog JSON'
                                      : file.mimeType}
                                  </span>
                                  {file.modifiedTime && (
                                    <>
                                      <span>·</span>
                                      <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-400 hover:text-teal-700 rounded"
                                  title="Open in Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                onClick={() => handleLoadFileContent(file)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                <CloudDownload className="w-3.5 h-3.5" />
                                <span>{isAuditSession ? 'Load into Auditor' : isCatalog ? 'Load into Catalog' : 'Load Data'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SAVE TO GOOGLE DRIVE */}
              {activeTab === 'save' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option 1: Save Current Audit Session */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                          <BookmarkCheck className="w-4 h-4 text-teal-700" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">Save Active Audit Session</h5>
                          <span className="text-[11px] text-slate-500">Structured JSON Session Record</span>
                        </div>
                      </div>

                      {activeSession ? (
                        <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/80 font-mono">
                          <div>Procedure: <strong className="text-slate-900">{activeSession.procedureCode}</strong></div>
                          <div>Patient: <strong className="text-slate-900">{activeSession.patientId}</strong></div>
                          <div>Compliance: <strong className="text-teal-700">{activeSession.complianceRate}%</strong></div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 bg-white p-2.5 rounded-lg border border-slate-200/60">
                          No active session in memory. Select or audit a procedure in the Auditor first.
                        </div>
                      )}

                      <button
                        onClick={handleSaveSessionToDrive}
                        disabled={!activeSession || isProcessing}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-40"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                        <span>Save Session to Google Drive</span>
                      </button>
                    </div>

                    {/* Option 2: Save Master Procedure Catalog Export */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                          <PackageOpen className="w-4 h-4 text-indigo-700" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">Save Master Procedure Catalog</h5>
                          <span className="text-[11px] text-slate-500">Complete Master Tariff JSON</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/80 font-mono">
                        <div>Total Packages: <strong className="text-slate-900">{procedures.length}</strong></div>
                        <div>Export Format: <strong className="text-slate-900">application/json</strong></div>
                        <div>Storage: <strong className="text-indigo-700">Personal Google Drive</strong></div>
                      </div>

                      <button
                        onClick={handleSaveProceduresToDrive}
                        disabled={isProcessing}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-40"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                        <span>Save Catalog to Google Drive</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ALL DRIVE FILES */}
              {activeTab === 'files' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search all files in your Google Drive..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={() => token && fetchFiles(token, searchQuery)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-medium rounded-lg cursor-pointer"
                    >
                      Search
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[340px] overflow-y-auto">
                    {files.map((file) => (
                      <div key={file.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-400">{file.mimeType}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-teal-700 rounded"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={(e) => handleDelete(file, e)}
                            className="p-1.5 text-slate-400 hover:text-red-700 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-teal-700" />
            <span>OAuth Client ID Integration · Personal Google Drive</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
