import React, { useState, useEffect } from 'react';
import {
  GoogleDriveFile,
  listGoogleDriveFiles,
  uploadToGoogleDrive,
  deleteGoogleDriveFile,
} from '../services/googleDriveService';
import {
  googleSignIn,
  googleLogout,
  getAccessToken,
  initAuth,
} from '../services/googleAuth';
import { User } from 'firebase/auth';
import {
  X,
  Search,
  Upload,
  FileText,
  FileImage,
  FileCheck,
  ExternalLink,
  Trash2,
  RefreshCw,
  FolderOpen,
  Check,
  AlertCircle,
  HardDrive,
  Loader2,
} from 'lucide-react';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: GoogleDriveFile) => void;
  targetDocName?: string;
  patientId?: string;
  procedureCode?: string;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  targetDocName,
  patientId,
  procedureCode,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        // Not authenticated
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files when token is available and modal is open
  useEffect(() => {
    if (isOpen && token) {
      loadFiles(token);
    }
  }, [isOpen, token]);

  const loadFiles = async (currentToken: string, query?: string) => {
    setIsLoadingFiles(true);
    setErrorMessage(null);
    try {
      const driveFiles = await listGoogleDriveFiles(currentToken, { query });
      setFiles(driveFiles);
    } catch (err: any) {
      console.error('Error loading Google Drive files:', err);
      setErrorMessage(err.message || 'Failed to load files from Google Drive');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const authResult = await googleSignIn();
      if (authResult) {
        setUser(authResult.user);
        setToken(authResult.accessToken);
        await loadFiles(authResult.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setErrorMessage(err.message || 'Sign in with Google failed. Please try again.');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      loadFiles(token, searchQuery);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    setErrorMessage(null);
    setUploadSuccessMessage(null);

    try {
      const customDescription = `Clinical document for Patient ${patientId || 'N/A'}, Procedure ${procedureCode || 'N/A'}: ${targetDocName || file.name}`;
      const uploaded = await uploadToGoogleDrive(token, file, {
        name: `${patientId ? `[${patientId}]_` : ''}${file.name}`,
        mimeType: file.type || 'application/octet-stream',
        description: customDescription,
      });

      setUploadSuccessMessage(`Successfully uploaded "${uploaded.name}" to Google Drive!`);
      // Reload list and highlight
      await loadFiles(token);
      setTimeout(() => setUploadSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Upload to Drive error:', err);
      setErrorMessage(err.message || 'Failed to upload document to Google Drive');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
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

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
              <HardDrive className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Google Drive Document Browser</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800 uppercase tracking-wider">
                  Cloud Files
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {targetDocName ? (
                  <span>
                    Select or upload document for:{' '}
                    <strong className="text-slate-800">{targetDocName}</strong>
                  </span>
                ) : (
                  <span>Browse and attach clinical verification files from your Google Drive</span>
                )}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* If NOT Authenticated: Official Sign in with Google Button */}
          {!token ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <div className="max-w-md space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">
                  Connect Google Drive to Access Files
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sign in with Google to browse your clinical documents, upload verified diagnostic
                  reports, and sync patient audit dossiers with your Google Drive storage.
                </p>
              </div>

              {/* Official Google Material Style Button */}
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm border border-slate-300 rounded-lg shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                    <span>Connecting to Google Drive...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 max-w-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Authenticated Drive Browser */
            <div className="space-y-4">
              {/* Account Ribbon & Quick Upload */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-teal-50/60 border border-teal-200/80 rounded-lg text-xs">
                <div className="flex items-center gap-2.5">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-7 h-7 rounded-full border border-teal-300"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                      {(user?.displayName || user?.email || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-teal-950">
                      {user?.displayName || 'Google Drive Connected'}
                    </div>
                    <div className="text-[11px] text-teal-700 font-mono">{user?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Upload directly to Google Drive */}
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg cursor-pointer transition-colors shadow-2xs">
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploading ? 'Uploading...' : 'Upload to Drive'}</span>
                    <input
                      type="file"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                    />
                  </label>

                  <button
                    onClick={handleSignOut}
                    className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-lg transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Notifications */}
              {uploadSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{uploadSuccessMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Search & Refresh Toolbar */}
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search files in Google Drive (e.g. burn, clinical, discharge)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        if (token) loadFiles(token);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-[10px] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Search
                </button>

                <button
                  type="button"
                  onClick={() => token && loadFiles(token, searchQuery)}
                  title="Refresh files"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                </button>
              </form>

              {/* Files Grid / List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>Google Drive Files ({files.length})</span>
                  <span>Click to attach to checklist</span>
                </div>

                {isLoadingFiles ? (
                  <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
                    <span>Loading your Google Drive documents...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-2">
                    <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="text-xs font-medium text-slate-700">No matching files found in Drive</div>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Use the "Upload to Drive" button above to add clinical documents or search with a different keyword.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                    {files.map((file) => {
                      const isPdf = file.mimeType.includes('pdf');
                      const isImage = file.mimeType.includes('image');

                      return (
                        <div
                          key={file.id}
                          onClick={() => {
                            onSelectFile(file);
                            onClose();
                          }}
                          className="p-3 hover:bg-teal-50/50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-teal-100 group-hover:text-teal-800 transition-colors">
                              {isPdf ? (
                                <FileText className="w-4 h-4 text-red-600" />
                              ) : isImage ? (
                                <FileImage className="w-4 h-4 text-sky-600" />
                              ) : (
                                <FileCheck className="w-4 h-4 text-teal-600" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-slate-900 group-hover:text-teal-900 truncate">
                                {file.name}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                {file.size && <span>{formatFileSize(file.size)}</span>}
                                {file.size && <span>·</span>}
                                {file.modifiedTime && (
                                  <span>
                                    Modified {new Date(file.modifiedTime).toLocaleDateString()}
                                  </span>
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
                                onClick={(e) => e.stopPropagation()}
                                title="Open in Google Drive"
                                className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <button
                              onClick={(e) => handleDelete(file, e)}
                              title="Delete file from Google Drive"
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                onSelectFile(file);
                                onClose();
                              }}
                              className="px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200 rounded group-hover:bg-teal-700 group-hover:text-white transition-colors"
                            >
                              Attach
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-teal-700" />
            <span>Google Drive API v3 · Secure OAuth 2.0 In-Memory Session</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
