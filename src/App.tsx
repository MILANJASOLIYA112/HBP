import React, { useState, useMemo, useEffect } from 'react';
import { HBPProcedure, AuditSession } from './types/hbp';
import { INITIAL_HBP_DATA, parseNumericTariff, parseImplantCost } from './data/hbpData';
import { loadSavedAuditSessions, saveAuditSessionsToStorage, INITIAL_AUDIT_SESSIONS, calculateAuditMetrics } from './data/auditSessionData';
import { Header } from './components/Header';
import { PackageTable } from './components/PackageTable';
import { PackageCardGrid } from './components/PackageCardGrid';
import { PackageDetailModal } from './components/PackageDetailModal';
import { PreAuthClaimAuditor } from './components/PreAuthClaimAuditor';
import { TariffCalculator } from './components/TariffCalculator';
import { BurnsRuleOfNineCalculator } from './components/BurnsRuleOfNineCalculator';
import { PackageComparisonModal } from './components/PackageComparisonModal';
import { AddPackageModal } from './components/AddPackageModal';
import { AuditComplianceChart } from './components/AuditComplianceChart';
import { SpecialtyDistributionChart } from './components/SpecialtyDistributionChart';
import { GoogleDriveHubModal } from './components/GoogleDriveHubModal';
import { AndroidApkExportModal } from './components/AndroidApkExportModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  CheckCircle2,
  FileCheck,
  Building2,
  Flame,
  ShieldAlert,
  RotateCcw,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  PieChart as PieChartIcon,
  Smartphone,
} from 'lucide-react';

export default function App() {
  // Master packages state (with localStorage persistence)
  const [procedures, setProcedures] = useState<HBPProcedure[]>(() => {
    try {
      const saved = localStorage.getItem('hbp_master_packages_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_HBP_DATA.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load stored HBP data, using default', e);
    }
    return INITIAL_HBP_DATA;
  });

  useEffect(() => {
    try {
      localStorage.setItem('hbp_master_packages_v2', JSON.stringify(procedures));
    } catch (e) {
      console.error('Failed to store HBP data', e);
    }
  }, [procedures]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'catalog' | 'auditor' | 'calculator' | 'rule_of_9'>('catalog');

  // Android APK Export Modal State
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [apkModalInitialTab, setApkModalInitialTab] = useState<'instant' | 'pwabuilder' | 'studio' | 'qr'>('qr');

  const handleOpenApkModal = (tab?: 'instant' | 'pwabuilder' | 'studio' | 'qr') => {
    setApkModalInitialTab(tab || 'qr');
    setIsApkModalOpen(true);
  };

  // Saved Audit Sessions State (persisted to localStorage)
  const [auditSessions, setAuditSessions] = useState<AuditSession[]>(() => loadSavedAuditSessions());
  const [showDashboardComplianceChart, setShowDashboardComplianceChart] = useState<boolean>(true);
  const [showSpecialtyDistributionChart, setShowSpecialtyDistributionChart] = useState<boolean>(true);

  const handleSaveAuditSession = (session: AuditSession) => {
    setAuditSessions((prev) => {
      const updated = [session, ...prev];
      saveAuditSessionsToStorage(updated);
      return updated;
    });
  };

  const handleResetAuditSessions = () => {
    if (window.confirm('Reset audit sessions history to initial baseline?')) {
      setAuditSessions(INITIAL_AUDIT_SESSIONS);
      saveAuditSessionsToStorage(INITIAL_AUDIT_SESSIONS);
    }
  };

  const auditMetrics = useMemo(() => calculateAuditMetrics(auditSessions), [auditSessions]);

  // Google Drive Hub Modal State
  const [isDriveHubOpen, setIsDriveHubOpen] = useState(false);
  const [driveHubInitialTab, setDriveHubInitialTab] = useState<'save' | 'load' | 'files'>('load');

  const handleLoadProceduresFromDrive = (newProcs: HBPProcedure[]) => {
    setProcedures(newProcs);
    alert(`Successfully loaded and updated ${newProcs.length} procedures from Google Drive!`);
  };

  const handleLoadSessionFromDrive = (session: AuditSession) => {
    handleSaveAuditSession(session);
    const found = procedures.find((p) => p.procedure_code === session.procedureCode);
    if (found) {
      setActiveProcedure(found);
    }
    setActiveTab('auditor');
  };

  // Active procedure for inspector and sub-tools
  const [activeProcedure, setActiveProcedure] = useState<HBPProcedure | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Compare State
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Add Package Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Catalog Filters & Display
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [publicReserveFilter, setPublicReserveFilter] = useState<'all' | 'reserved' | 'open'>('all');
  const [implantFilter, setImplantFilter] = useState<'all' | 'with_implant' | 'no_implant'>('all');
  const [multiProcFilter, setMultiProcFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Sorting
  const [sortField, setSortField] = useState<keyof HBPProcedure | 'amount_numeric'>('procedure_code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Unique specialties
  const specialtiesList = useMemo(() => {
    const map = new Map<string, string>();
    procedures.forEach((p) => {
      if (!map.has(p.specialty_code)) {
        map.set(p.specialty_code, p.specialty);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [procedures]);

  // Filtered and Sorted Procedures
  const filteredProcedures = useMemo(() => {
    return procedures
      .filter((proc) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = proc.procedure_code.toLowerCase().includes(q);
          const matchName = proc.package_name.toLowerCase().includes(q);
          const matchCriteria = proc.procedure_name.toLowerCase().includes(q);
          const matchSpecialty = proc.specialty.toLowerCase().includes(q);
          const matchPreAuth = proc.mandatory_documents_pre_auth.toLowerCase().includes(q);
          const matchClaim = proc.mandatory_documents_claim_processing.toLowerCase().includes(q);
          if (!matchCode && !matchName && !matchCriteria && !matchSpecialty && !matchPreAuth && !matchClaim) {
            return false;
          }
        }

        // Specialty filter
        if (selectedSpecialty !== 'all' && proc.specialty_code !== selectedSpecialty) {
          return false;
        }

        // Public reserve filter
        if (publicReserveFilter === 'reserved' && proc.reservation_public_hospitals !== 'Yes') {
          return false;
        }
        if (publicReserveFilter === 'open' && proc.reservation_public_hospitals === 'Yes') {
          return false;
        }

        // Implant filter
        if (implantFilter === 'with_implant' && proc.implant_mapped === 'NA') {
          return false;
        }
        if (implantFilter === 'no_implant' && proc.implant_mapped !== 'NA') {
          return false;
        }

        // Multi-procedure filter
        if (multiProcFilter === 'yes' && proc.multiple_procedures !== 'Yes') {
          return false;
        }
        if (multiProcFilter === 'no' && proc.multiple_procedures === 'Yes') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'amount_numeric') {
          valA = parseNumericTariff(a.package_amount_tier3).amount;
          valB = parseNumericTariff(b.package_amount_tier3).amount;
        } else if (sortField === 'los') {
          valA = a.los === 'NA' ? 0 : parseInt(a.los, 10) || 0;
          valB = b.los === 'NA' ? 0 : parseInt(b.los, 10) || 0;
        } else {
          valA = (a[sortField] || '').toLowerCase();
          valB = (b[sortField] || '').toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [procedures, searchQuery, selectedSpecialty, publicReserveFilter, implantFilter, multiProcFilter, sortField, sortDirection]);

  // Handlers
  const handleSort = (field: keyof HBPProcedure | 'amount_numeric') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleCompare = (code: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 packages simultaneously.');
        return prev;
      }
      return [...prev, code];
    });
  };

  const handleOpenDetail = (procedure: HBPProcedure) => {
    setActiveProcedure(procedure);
    setIsDetailOpen(true);
  };

  const handleOpenAudit = (procedure: HBPProcedure) => {
    setActiveProcedure(procedure);
    setActiveTab('auditor');
  };

  const handleOpenCalculator = (procedure: HBPProcedure) => {
    setActiveProcedure(procedure);
    setActiveTab('calculator');
  };

  const handleOpenBurnsCalc = (procedure: HBPProcedure) => {
    setActiveProcedure(procedure);
    setActiveTab('rule_of_9');
  };

  const handleAddPackage = (newProc: HBPProcedure) => {
    setProcedures((prev) => [newProc, ...prev]);
  };

  const handleBatchAddPackages = (newProcs: HBPProcedure[]) => {
    setProcedures((prev) => [...newProcs, ...prev]);
  };

  const handleResetDefault = () => {
    if (window.confirm('Reset catalog to the default master Health Benefit Packages?')) {
      setProcedures(INITIAL_HBP_DATA);
      localStorage.removeItem('hbp_master_packages_v1');
      localStorage.removeItem('hbp_master_packages_v2');
    }
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(procedures, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'hbp_master_packages_export.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Burn specific procedures for Rule of 9
  const burnProcedures = useMemo(() => {
    return procedures.filter(
      (p) => p.specialty_code === 'BM' || p.package_name.toLowerCase().includes('burn')
    );
  }, [procedures]);

  // Aggregate stats
  const reservedCount = procedures.filter((p) => p.reservation_public_hospitals === 'Yes').length;
  const implantCount = procedures.filter((p) => p.implant_mapped !== 'NA').length;
  const multiProcCount = procedures.filter((p) => p.multiple_procedures === 'Yes').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-100 selection:text-teal-900">
      {/* Strict 3-zone Header Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        compareCount={selectedForCompare.length}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onExportData={handleExportData}
        onOpenDriveHub={(tab) => {
          setDriveHubInitialTab(tab || 'load');
          setIsDriveHubOpen(true);
        }}
        onOpenApkModal={handleOpenApkModal}
      />

      {/* Main Container: Desktop Baseline 1440px presence */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* TAB 1: MASTER CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Top Workspace Bar */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500 font-mono">
                    Ayushman Bharat Health Benefit Packages · Master Tariff v2.2
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                    HBP Procedure Master & Claim Tariff Catalog
                  </h1>
                </div>

                {/* KPI Metrics */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
                  <div>
                    <span className="text-slate-400">Total Packages:</span>{' '}
                    <span className="font-bold text-slate-900">{procedures.length}</span>
                  </div>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <div>
                    <span className="text-slate-400">With Implants:</span>{' '}
                    <span className="font-bold text-slate-900">{implantCount}</span>
                  </div>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <div>
                    <span className="text-slate-400">Public Reserved:</span>{' '}
                    <span className="font-bold text-slate-900">{reservedCount}</span>
                  </div>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <div>
                    <span className="text-slate-400">Multi-Procedure:</span>{' '}
                    <span className="font-bold text-slate-900">{multiProcCount}</span>
                  </div>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <button
                    onClick={() => setShowDashboardComplianceChart((prev) => !prev)}
                    title="Click to toggle Audit Compliance Trend visualization"
                    className="flex items-center gap-1 hover:text-teal-800 transition-colors cursor-pointer group"
                  >
                    <span className="text-slate-400 group-hover:text-teal-700">Compliance Avg:</span>{' '}
                    <span className="font-bold text-teal-800 group-hover:underline">{auditMetrics.averageComplianceRate}%</span>
                  </button>
                </div>
              </div>

              {/* Dashboard Analytics & Visualizations Ribbon */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5 text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium text-slate-900">
                    <PieChartIcon className="w-3.5 h-3.5 text-teal-700" />
                    <span>Visual Analytics:</span>
                  </div>
                  <span className="hidden sm:inline text-slate-300">·</span>
                  <span className="text-slate-500">
                    {specialtiesList.length} Specialties · {procedures.length} master packages cataloged
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Specialty Distribution Toggle */}
                  <button
                    onClick={() => setShowSpecialtyDistributionChart((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                      showSpecialtyDistributionChart
                        ? 'bg-teal-100 text-teal-900 border border-teal-200 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <PieChartIcon className="w-3 h-3 text-teal-700" />
                    <span>Specialty Distribution (Pie)</span>
                    {showSpecialtyDistributionChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Audit Compliance Trend Toggle */}
                  <button
                    onClick={() => setShowDashboardComplianceChart((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                      showDashboardComplianceChart
                        ? 'bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-3 h-3 text-indigo-700" />
                    <span>Compliance Trend</span>
                    {showDashboardComplianceChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Android APK Export Quick Action */}
                  <button
                    onClick={() => handleOpenApkModal('qr')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer shadow-2xs"
                    title="Export or Generate Android APK (.apk) - Open Tab 4"
                  >
                    <Smartphone className="w-3 h-3 text-sky-600" />
                    <span>Export to Android APK (Tab 4)</span>
                  </button>
                </div>
              </div>

              {/* Filter and Search Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by code (e.g. BM001A), procedure, specialty, clinical criteria, or document keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Specialty Filter Dropdown */}
                <div className="w-full md:w-56 shrink-0">
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 cursor-pointer"
                  >
                    <option value="all">All Specialties ({procedures.length})</option>
                    {specialtiesList.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
                  <button
                    onClick={() => setViewMode('table')}
                    title="High-density data table"
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Card grid"
                    className={`p-1.5 rounded transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Secondary Filter Chips */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500 font-medium">Quick Filters:</span>

                  {/* Public reserve toggle button */}
                  <button
                    onClick={() => setPublicReserveFilter((prev) => (prev === 'reserved' ? 'all' : 'reserved'))}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      publicReserveFilter === 'reserved'
                        ? 'bg-amber-100 text-amber-900 font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Public Reserve Only
                  </button>

                  {/* With implant toggle button */}
                  <button
                    onClick={() => setImplantFilter((prev) => (prev === 'with_implant' ? 'all' : 'with_implant'))}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      implantFilter === 'with_implant'
                        ? 'bg-teal-100 text-teal-900 font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Implants Mapped Only
                  </button>

                  {/* Multi-procedure toggle button */}
                  <button
                    onClick={() => setMultiProcFilter((prev) => (prev === 'yes' ? 'all' : 'yes'))}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      multiProcFilter === 'yes'
                        ? 'bg-teal-100 text-teal-900 font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Multi-Procedure Eligible
                  </button>

                  {(publicReserveFilter !== 'all' || implantFilter !== 'all' || multiProcFilter !== 'all' || selectedSpecialty !== 'all' || searchQuery) && (
                    <button
                      onClick={() => {
                        setPublicReserveFilter('all');
                        setImplantFilter('all');
                        setMultiProcFilter('all');
                        setSelectedSpecialty('all');
                        setSearchQuery('');
                      }}
                      className="text-slate-500 hover:text-teal-700 underline cursor-pointer ml-1 text-xs"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                <div className="text-slate-400 font-mono text-[11px]">
                  Showing {filteredProcedures.length} of {procedures.length} procedures
                </div>
              </div>
            </div>

            {/* SPECIALTY DISTRIBUTION PIE CHART (RECHARTS) */}
            {showSpecialtyDistributionChart && (
              <SpecialtyDistributionChart
                procedures={procedures}
                filteredProcedures={filteredProcedures}
                selectedSpecialty={selectedSpecialty}
                onSelectSpecialty={(code) => setSelectedSpecialty(code)}
                onClose={() => setShowSpecialtyDistributionChart(false)}
              />
            )}

            {/* AUDIT COMPLIANCE RATE OVER TIME CHART (RECHARTS) */}
            {showDashboardComplianceChart && (
              <AuditComplianceChart
                sessions={auditSessions}
                onAddSession={handleSaveAuditSession}
                onResetSessions={handleResetAuditSessions}
                onClose={() => setShowDashboardComplianceChart(false)}
              />
            )}

            {/* Compare Floating Bar (if items selected) */}
            {selectedForCompare.length > 0 && (
              <div className="bg-teal-950 text-white p-3 rounded-lg flex items-center justify-between text-xs shadow-md">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedForCompare.length} procedure(s) selected for side-by-side comparison:</span>
                  <span className="font-mono text-teal-300">{selectedForCompare.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedForCompare([])}
                    className="text-slate-300 hover:text-white cursor-pointer px-2 py-1"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsCompareOpen(true)}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-medium px-3 py-1 rounded cursor-pointer transition-colors"
                  >
                    Compare Now
                  </button>
                </div>
              </div>
            )}

            {/* Main Procedure Presentation */}
            {viewMode === 'table' ? (
              <PackageTable
                procedures={filteredProcedures}
                onSelectProcedure={handleOpenDetail}
                onOpenAudit={handleOpenAudit}
                onAddToCalculator={handleOpenCalculator}
                selectedForCompare={selectedForCompare}
                onToggleCompare={handleToggleCompare}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            ) : (
              <PackageCardGrid
                procedures={filteredProcedures}
                onSelectProcedure={handleOpenDetail}
                onOpenAudit={handleOpenAudit}
                onAddToCalculator={handleOpenCalculator}
                selectedForCompare={selectedForCompare}
                onToggleCompare={handleToggleCompare}
              />
            )}

            {/* Catalog Footer with Reset to Defaults */}
            <div className="pt-4 flex items-center justify-between text-xs text-slate-500">
              <div>
                National Health Authority (NHA) PM-JAY Master Guidelines compliant
              </div>
              <button
                onClick={handleResetDefault}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Original Dataset</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PRE-AUTH & CLAIM AUDITOR */}
        {activeTab === 'auditor' && (
          <PreAuthClaimAuditor
            procedures={procedures}
            currentProcedure={activeProcedure}
            onSelectProcedure={(p) => setActiveProcedure(p)}
            auditSessions={auditSessions}
            onSaveAuditSession={handleSaveAuditSession}
            onResetAuditSessions={handleResetAuditSessions}
          />
        )}

        {/* TAB 3: TARIFF & MULTI-PROCEDURE CALCULATOR */}
        {activeTab === 'calculator' && (
          <TariffCalculator
            allProcedures={procedures}
            initialSelected={activeProcedure}
          />
        )}

        {/* TAB 4: RULE OF 9 BURNS CALCULATOR */}
        {activeTab === 'rule_of_9' && (
          <BurnsRuleOfNineCalculator
            burnProcedures={burnProcedures}
            onSelectForAudit={handleOpenAudit}
            onSelectForCalculator={handleOpenCalculator}
          />
        )}
      </main>

      {/* MODAL: Procedure Detailed Inspector */}
      {isDetailOpen && (
        <PackageDetailModal
          procedure={activeProcedure}
          onClose={() => setIsDetailOpen(false)}
          onOpenAudit={handleOpenAudit}
          onOpenCalculator={handleOpenCalculator}
          onOpenBurnsCalc={handleOpenBurnsCalc}
        />
      )}

      {/* MODAL: Package Comparison */}
      {isCompareOpen && (
        <PackageComparisonModal
          selectedCodes={selectedForCompare}
          allProcedures={procedures}
          onClose={() => setIsCompareOpen(false)}
          onRemoveCode={(code) => setSelectedForCompare((prev) => prev.filter((c) => c !== code))}
          onOpenAudit={handleOpenAudit}
          onOpenCalculator={handleOpenCalculator}
        />
      )}

      {/* MODAL: Add New Package */}
      {isAddModalOpen && (
        <AddPackageModal
          onClose={() => setIsAddModalOpen(false)}
          onAddPackage={handleAddPackage}
          onBatchAddPackages={handleBatchAddPackages}
          existingSpecialties={specialtiesList}
        />
      )}

      {/* MODAL: Google Drive Hub */}
      {isDriveHubOpen && (
        <GoogleDriveHubModal
          isOpen={isDriveHubOpen}
          onClose={() => setIsDriveHubOpen(false)}
          procedures={procedures}
          onLoadProcedures={handleLoadProceduresFromDrive}
          onLoadAuditSession={handleLoadSessionFromDrive}
          initialTab={driveHubInitialTab}
        />
      )}

      {/* MODAL: Android APK Generator & Export */}
      <AndroidApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        initialTab={apkModalInitialTab}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Health Benefit Packages (HBP) Tariff Master & Pre-Auth Auditor</span>
          <span className="font-mono text-[11px] text-slate-400">AB-PMJAY Specification · TMS 2.2 Ready</span>
        </div>
      </footer>
    </div>
  );
}
