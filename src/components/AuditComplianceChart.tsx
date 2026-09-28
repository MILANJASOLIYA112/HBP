import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { AuditSession } from '../types/hbp';
import { calculateAuditMetrics } from '../data/auditSessionData';
import { downloadAuditTrendReportPdf } from '../utils/exportAuditPdf';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { openWhatsAppShare } from '../utils/whatsappShare';
import {
  TrendingUp,
  ShieldCheck,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  RotateCcw,
  PlusCircle,
  Table as TableIcon,
  LineChart as ChartIcon,
  FileDown,
  Copy,
  X,
} from 'lucide-react';

interface AuditComplianceChartProps {
  sessions: AuditSession[];
  onAddSession?: (session: AuditSession) => void;
  onResetSessions?: () => void;
  onClose?: () => void;
}

export const AuditComplianceChart: React.FC<AuditComplianceChartProps> = ({
  sessions,
  onAddSession,
  onResetSessions,
  onClose,
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '14d' | '30d'>('all');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [showAverageTrendSeries, setShowAverageTrendSeries] = useState(true);
  const [showPreAuthSeries, setShowPreAuthSeries] = useState(true);
  const [showClaimSeries, setShowClaimSeries] = useState(true);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  const formatSessionWhatsAppTemplate = (s: AuditSession): string => {
    return [
      `🏥 *AB-PMJAY AUDIT SESSION RECORD*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `• *Date:* ${s.date} (${s.timestamp.slice(0, 10)})`,
      `• *Patient ID:* ${s.patientId}`,
      `• *Procedure Code:* ${s.procedureCode}`,
      `• *Package:* ${s.packageName}`,
      `• *Specialty:* ${s.specialty}`,
      ``,
      `📊 *COMPLIANCE STATUS:*`,
      `• Overall Compliance: *${s.complianceRate}%* (${s.verifiedDocuments}/${s.totalDocuments} Docs Verified)`,
      `• Pre-Auth Compliance: *${s.preAuthComplianceRate}%*`,
      `• Claim Settlement Rate: *${s.claimComplianceRate}%*`,
      `• Verdict: *${s.status === 'compliant' ? 'APPROVED (100%)' : s.status === 'partially_compliant' ? 'ACTION REQUIRED' : 'DEFICIENT'}*`,
      s.notes ? `\n📝 *Notes:* ${s.notes}` : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_National Health Authority (NHA) PM-JAY Audit Record_`
    ].filter(Boolean).join('\n');
  };

  const handleShareSessionWhatsApp = (s: AuditSession) => {
    const text = formatSessionWhatsAppTemplate(s);
    openWhatsAppShare(text);
  };

  const handleCopySessionWhatsApp = async (s: AuditSession) => {
    const text = formatSessionWhatsAppTemplate(s);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSessionId(s.id);
      setTimeout(() => setCopiedSessionId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered sessions based on time range
  const filteredSessions = useMemo(() => {
    if (sessions.length === 0) return [];
    
    // Sort chronologically
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    if (timeRange === 'all') return sorted;

    const now = new Date('2026-09-28T23:59:59.000Z').getTime();
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return sorted.filter((s) => new Date(s.timestamp).getTime() >= cutoff);
  }, [sessions, timeRange]);

  // Aggregate metrics
  const metrics = useMemo(() => calculateAuditMetrics(filteredSessions), [filteredSessions]);

  // Chart data formatting
  const chartData = useMemo(() => {
    let runningSum = 0;
    return filteredSessions.map((session, index) => {
      runningSum += session.complianceRate;
      const runningAvg = Math.round((runningSum / (index + 1)) * 10) / 10;
      return {
        index: index + 1,
        id: session.id,
        date: session.date,
        timestamp: session.timestamp,
        patientId: session.patientId,
        procedureCode: session.procedureCode,
        packageName: session.packageName,
        complianceRate: session.complianceRate,
        historicalAverage: runningAvg,
        preAuthComplianceRate: session.preAuthComplianceRate,
        claimComplianceRate: session.claimComplianceRate,
        totalDocuments: session.totalDocuments,
        verifiedDocuments: session.verifiedDocuments,
        status: session.status,
      };
    });
  }, [filteredSessions]);

  // Export audit logs as CSV
  const handleExportCSV = () => {
    const headers = [
      'Session ID',
      'Date',
      'Patient ID',
      'Procedure Code',
      'Package Name',
      'Specialty',
      'Total Docs',
      'Verified Docs',
      'Overall Compliance %',
      'Pre-Auth %',
      'Claim %',
      'Status'
    ];
    const rows = filteredSessions.map((s) => [
      `"${s.id}"`,
      `"${s.date}"`,
      `"${s.patientId}"`,
      `"${s.procedureCode}"`,
      `"${s.packageName.replace(/"/g, '""')}"`,
      `"${s.specialty}"`,
      s.totalDocuments,
      s.verifiedDocuments,
      s.complianceRate,
      s.preAuthComplianceRate,
      s.claimComplianceRate,
      `"${s.status}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_compliance_history_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white rounded-lg p-3 text-xs shadow-xl border border-slate-800 space-y-1.5 min-w-[210px] z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-mono text-[11px] text-slate-400">
            <span>{data.date}</span>
            <span className="text-teal-400 font-bold">{data.procedureCode}</span>
          </div>

          <div className="font-semibold text-slate-100 text-xs truncate max-w-[240px]">
            {data.packageName}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Patient: {data.patientId}
          </div>

          <div className="pt-1.5 border-t border-slate-800 space-y-1 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-teal-300">Session Compliance:</span>
              <span className="font-bold text-teal-400 tabular-nums">{data.complianceRate}%</span>
            </div>
            <div className="flex items-center justify-between text-emerald-300 font-semibold">
              <span>Historical Running Avg:</span>
              <span className="tabular-nums">{data.historicalAverage}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Pre-Auth Rate:</span>
              <span className="tabular-nums">{data.preAuthComplianceRate}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Claim Rate:</span>
              <span className="tabular-nums">{data.claimComplianceRate}%</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Verified Documents:</span>
              <span>{data.verifiedDocuments} / {data.totalDocuments}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      {/* Top Header & Chart Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-bold text-slate-900">Audit Compliance Analytics</span>
            <span aria-hidden="true">·</span>
            <span>Historical Session Trajectory</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
            Audit Compliance Rate Over Time
          </h2>
        </div>

        {/* View Toggles & Time Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                timeRange === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                timeRange === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeRange('14d')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                timeRange === '14d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                timeRange === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
          </div>

          {/* Chart / Table View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('chart')}
              title="Chart View"
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                viewMode === 'chart' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Sessions Log Table View"
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => downloadAuditTrendReportPdf(filteredSessions)}
            title="Export audit compliance trajectory as formatted PDF report"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden md:inline">Export PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Export audit compliance data as CSV"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Export CSV</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close compliance trend"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-slate-500 font-medium">Average Compliance Rate</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
            {metrics.averageComplianceRate}%
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Target threshold &ge; 90%
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-slate-500 font-medium">First-Time Approval Rate</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
            {metrics.firstTimeApprovalRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {metrics.fullyCompliantCount} of {metrics.totalAudits} audits at 100%
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-slate-500 font-medium">Pre-Auth Compliance Avg</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
            {metrics.averagePreAuthRate}%
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Prior-to-admission ready
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-slate-500 font-medium">Total Audits Logged</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
            {metrics.totalAudits}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Across {filteredSessions.length} recorded sessions
          </div>
        </div>
      </div>

      {/* SERIES TOGGLES */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-4">
          <span className="text-slate-500 font-medium">Toggle Series:</span>
          
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <div className="w-3 h-3 rounded bg-teal-600 border border-teal-700" />
            <span className="font-semibold text-slate-800">Session Compliance</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAverageTrendSeries}
              onChange={(e) => setShowAverageTrendSeries(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600 cursor-pointer"
            />
            <span className="text-emerald-800 font-semibold">Historical Running Avg (Green)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPreAuthSeries}
              onChange={(e) => setShowPreAuthSeries(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
            />
            <span className="text-slate-700">Pre-Auth Rate (Blue)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showClaimSeries}
              onChange={(e) => setShowClaimSeries(e.target.checked)}
              className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-600"
            />
            <span className="text-slate-700">Claim Settlement Rate (Amber)</span>
          </label>
        </div>

        {onResetSessions && (
          <button
            onClick={onResetSessions}
            className="text-[11px] text-slate-400 hover:text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset History</span>
          </button>
        )}
      </div>

      {/* RECHARTS VISUALIZATION CONTAINER */}
      {viewMode === 'chart' ? (
        <div className="w-full h-72 sm:h-80 pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No audit sessions found for the selected time range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
              >
                <defs>
                  {/* Teal Gradient for Overall Compliance Area */}
                  <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                  </linearGradient>
                  {/* Indigo Gradient */}
                  <linearGradient id="preAuthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />

                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  unit="%"
                />

                <Tooltip content={<CustomTooltip />} />

                {/* 100% Target Reference Line */}
                <ReferenceLine
                  y={100}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: '100% Full Compliance Target',
                    position: 'insideTopRight',
                    fill: '#059669',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                {/* Period Baseline Average Reference Line */}
                <ReferenceLine
                  y={metrics.averageComplianceRate}
                  stroke="#0f766e"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: `Period Avg: ${metrics.averageComplianceRate}%`,
                    position: 'insideBottomRight',
                    fill: '#0f766e',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                {/* Primary Overall Compliance Area & Line */}
                <Area
                  type="monotone"
                  dataKey="complianceRate"
                  name="Session Compliance %"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#complianceGradient)"
                  activeDot={{ r: 5, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
                />

                {/* Historical Running Average Line */}
                {showAverageTrendSeries && (
                  <Line
                    type="monotone"
                    dataKey="historicalAverage"
                    name="Historical Average %"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#059669', stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}

                {/* Pre-Auth Rate Line */}
                {showPreAuthSeries && (
                  <Line
                    type="monotone"
                    dataKey="preAuthComplianceRate"
                    name="Pre-Auth Rate %"
                    stroke="#4f46e5"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ r: 3, fill: '#4f46e5' }}
                  />
                )}

                {/* Claim Processing Rate Line */}
                {showClaimSeries && (
                  <Line
                    type="monotone"
                    dataKey="claimComplianceRate"
                    name="Claim Rate %"
                    stroke="#d97706"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={{ r: 3, fill: '#d97706' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : (
        /* RECENT AUDIT SESSIONS LOG TABLE */
        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-72">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Patient ID</th>
                <th className="py-2.5 px-3 font-mono">Code</th>
                <th className="py-2.5 px-3">Package Name</th>
                <th className="py-2.5 px-3 text-right font-mono">Compliance</th>
                <th className="py-2.5 px-3 text-right font-mono">Pre-Auth</th>
                <th className="py-2.5 px-3 text-right font-mono">Claim</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Template</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 whitespace-nowrap text-slate-600">{session.date}</td>
                  <td className="py-2 px-3 font-mono text-slate-900">{session.patientId}</td>
                  <td className="py-2 px-3 font-mono font-bold text-teal-800">{session.procedureCode}</td>
                  <td className="py-2 px-3 text-slate-700 max-w-[200px] truncate" title={session.packageName}>
                    {session.packageName}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {session.complianceRate}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-indigo-700 tabular-nums">
                    {session.preAuthComplianceRate}%
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-amber-700 tabular-nums">
                    {session.claimComplianceRate}%
                  </td>
                  <td className="py-2 px-3 text-center whitespace-nowrap">
                    {session.complianceRate === 100 ? (
                      <span className="font-semibold text-emerald-700">100% Approved</span>
                    ) : session.complianceRate >= 50 ? (
                      <span className="font-medium text-teal-800">In Progress</span>
                    ) : (
                      <span className="font-medium text-rose-700">Deficient</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleCopySessionWhatsApp(session)}
                        title="Copy structured WhatsApp text template for this audit session"
                        className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      >
                        {copiedSessionId === session.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleShareSessionWhatsApp(session)}
                        title="Open in WhatsApp"
                        className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Note */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>
          Compliance rate is computed from saved audit sessions based on mandatory pre-auth and claim processing checklist fulfillment.
        </span>
        <span className="font-mono text-slate-400">
          Recharts Engine v2 · Real-Time Historical Tracking
        </span>
      </div>
    </div>
  );
};
