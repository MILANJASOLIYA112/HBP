import React, { useState, useEffect } from 'react';
import { Plus, Download, HardDrive, Smartphone } from 'lucide-react';
import { initAuth, googleSignIn, googleLogout } from '../services/googleAuth';
import { User } from 'firebase/auth';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: 'catalog' | 'auditor' | 'calculator' | 'rule_of_9';
  setActiveTab: (tab: 'catalog' | 'auditor' | 'calculator' | 'rule_of_9') => void;
  compareCount: number;
  onOpenCompare: () => void;
  onOpenAddModal: () => void;
  onExportData: () => void;
  onOpenDriveHub?: (tab?: 'save' | 'load' | 'files') => void;
  onOpenApkModal?: (tab?: 'instant' | 'pwabuilder' | 'studio' | 'qr') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  compareCount,
  onOpenCompare,
  onOpenAddModal,
  onExportData,
  onOpenDriveHub,
  onOpenApkModal,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setHasToken(!!token);
      },
      () => {
        setUser(null);
        setHasToken(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleDriveConnect = async () => {
    if (hasToken) {
      if (window.confirm(`Disconnect Google Drive account (${user?.email})?`)) {
        await googleLogout();
        setUser(null);
        setHasToken(false);
      }
    } else {
      try {
        const res = await googleSignIn();
        if (res) {
          setUser(res.user);
          setHasToken(true);
        }
      } catch (err: any) {
        alert(`Google Sign-In failed: ${err.message}`);
      }
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('catalog')}
          className="text-lg font-bold tracking-tight text-slate-900 text-left hover:text-teal-700 transition-colors cursor-pointer"
        >
          Health Benefit Package Master
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`transition-colors pb-0.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'text-teal-700 font-semibold border-b-2 border-teal-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Package Catalog
          </button>
          <button
            onClick={() => setActiveTab('auditor')}
            className={`transition-colors pb-0.5 cursor-pointer ${
              activeTab === 'auditor'
                ? 'text-teal-700 font-semibold border-b-2 border-teal-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Document Tracker & Dossier
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`transition-colors pb-0.5 cursor-pointer ${
              activeTab === 'calculator'
                ? 'text-teal-700 font-semibold border-b-2 border-teal-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tariff & Multi-Procedure Estimator
          </button>
          <button
            onClick={() => setActiveTab('rule_of_9')}
            className={`transition-colors pb-0.5 cursor-pointer ${
              activeTab === 'rule_of_9'
                ? 'text-teal-700 font-semibold border-b-2 border-teal-700'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rule of 9 Burn Calculator
          </button>
          {compareCount > 0 && (
            <button
              onClick={onOpenCompare}
              className="text-teal-700 font-medium hover:text-teal-900 transition-colors cursor-pointer"
            >
              Compare ({compareCount})
            </button>
          )}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          {/* Android APK & Install Button */}
          <button
            onClick={() => onOpenApkModal?.('qr')}
            title="Generate Android APK (.apk) or Install to Mobile (Tab 4: QR & Direct Install)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 border border-sky-200 text-sky-800 hover:bg-sky-100 hover:border-sky-300 transition-colors shadow-xs cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Export APK</span>
            <span className="sm:hidden">APK</span>
          </button>

          {/* Google Drive Status Button */}
          <button
            onClick={() => (onOpenDriveHub ? onOpenDriveHub('load') : handleDriveConnect())}
            title={
              hasToken
                ? `Google Drive Connected (${user?.email}) - Click to open Drive Storage Hub`
                : 'Connect Google Drive for cloud procedure & audit storage'
            }
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              hasToken
                ? 'bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <HardDrive className={`w-3.5 h-3.5 ${hasToken ? 'text-teal-700' : 'text-slate-500'}`} />
            <span className="hidden md:inline">
              {hasToken ? 'Drive' : 'Connect Drive'}
            </span>
          </button>

          <button
            onClick={onExportData}
            title="Export master packages as JSON"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Package</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-100 px-4 py-2 gap-2 overflow-x-auto text-xs font-medium bg-slate-50 items-center">
        <button
          onClick={() => onOpenApkModal?.('qr')}
          className="whitespace-nowrap px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-semibold flex items-center gap-1 shrink-0"
        >
          <Smartphone className="w-3 h-3 text-sky-600" />
          <span>Get APK</span>
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'catalog' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'}`}
        >
          Catalog
        </button>
        <button
          onClick={() => setActiveTab('auditor')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'auditor' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'}`}
        >
          Doc Tracker
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'calculator' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'}`}
        >
          Tariff Estimator
        </button>
        <button
          onClick={() => setActiveTab('rule_of_9')}
          className={`whitespace-nowrap px-2.5 py-1 rounded ${activeTab === 'rule_of_9' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'}`}
        >
          Rule of 9
        </button>
        {compareCount > 0 && (
          <button
            onClick={onOpenCompare}
            className="whitespace-nowrap px-2.5 py-1 rounded bg-teal-100 text-teal-800 font-semibold"
          >
            Compare ({compareCount})
          </button>
        )}
      </div>
    </header>
  );
};
