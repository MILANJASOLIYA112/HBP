import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { HBPProcedure } from '../types/hbp';
import { parseNumericTariff } from '../data/hbpData';
import {
  PieChart as PieIcon,
  Filter,
  Layers,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Search,
  Copy,
  Check,
  Building2,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';

interface SpecialtyDistributionChartProps {
  procedures: HBPProcedure[];
  filteredProcedures?: HBPProcedure[];
  selectedSpecialty: string;
  onSelectSpecialty: (code: string) => void;
  onClose?: () => void;
}

// Curated high-contrast clinical & executive palette
const SPECIALTY_PALETTE: string[] = [
  '#0d9488', // Teal 600
  '#0284c7', // Sky 600
  '#4f46e5', // Indigo 600
  '#7c3aed', // Violet 600
  '#c026d3', // Fuchsia 600
  '#e11d48', // Rose 600
  '#ea580c', // Orange 600
  '#d97706', // Amber 600
  '#16a34a', // Green 600
  '#0891b2', // Cyan 600
  '#2563eb', // Blue 600
  '#9333ea', // Purple 600
  '#db2777', // Pink 600
  '#65a30d', // Lime 600
  '#475569', // Slate 600
  '#059669', // Emerald 600
  '#b45309', // Amber 700
  '#6b21a8', // Purple 800
];

export interface SpecialtyItem {
  code: string;
  name: string;
  count: number;
  percentage: number;
  color: string;
  implantCount: number;
  publicReserveCount: number;
  multiProcCount: number;
  avgTariff: number;
}

export const SpecialtyDistributionChart: React.FC<SpecialtyDistributionChartProps> = ({
  procedures,
  filteredProcedures,
  selectedSpecialty,
  onSelectSpecialty,
  onClose,
}) => {
  // Chart visual options
  const [chartType, setChartType] = useState<'donut' | 'pie'>('donut');
  const [dataSource, setDataSource] = useState<'all' | 'filtered'>('all');
  const [displayMode, setDisplayMode] = useState<'all' | 'top8'>('all');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [breakdownSearch, setBreakdownSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Active dataset based on toggle
  const activeProcedures = useMemo(() => {
    if (dataSource === 'filtered' && filteredProcedures && filteredProcedures.length > 0) {
      return filteredProcedures;
    }
    return procedures;
  }, [dataSource, filteredProcedures, procedures]);

  // Aggregate specialties data
  const specialtyBreakdown = useMemo(() => {
    const map = new Map<string, {
      code: string;
      name: string;
      count: number;
      implantCount: number;
      publicReserveCount: number;
      multiProcCount: number;
      totalTariff: number;
      tariffSampleCount: number;
    }>();

    activeProcedures.forEach((proc) => {
      const code = proc.specialty_code || 'OTHER';
      const name = proc.specialty || 'Other / General';

      const existing = map.get(code) || {
        code,
        name,
        count: 0,
        implantCount: 0,
        publicReserveCount: 0,
        multiProcCount: 0,
        totalTariff: 0,
        tariffSampleCount: 0,
      };

      existing.count += 1;
      if (proc.implant_mapped && proc.implant_mapped !== 'NA') {
        existing.implantCount += 1;
      }
      if (proc.reservation_public_hospitals === 'Yes') {
        existing.publicReserveCount += 1;
      }
      if (proc.multiple_procedures === 'Yes') {
        existing.multiProcCount += 1;
      }

      const { amount } = parseNumericTariff(proc.package_amount_tier3);
      if (amount > 0) {
        existing.totalTariff += amount;
        existing.tariffSampleCount += 1;
      }

      map.set(code, existing);
    });

    const total = activeProcedures.length || 1;
    const sorted = Array.from(map.values()).sort((a, b) => b.count - a.count);

    return sorted.map((item, index): SpecialtyItem => ({
      code: item.code,
      name: item.name,
      count: item.count,
      percentage: Number(((item.count / total) * 100).toFixed(1)),
      color: SPECIALTY_PALETTE[index % SPECIALTY_PALETTE.length],
      implantCount: item.implantCount,
      publicReserveCount: item.publicReserveCount,
      multiProcCount: item.multiProcCount,
      avgTariff: item.tariffSampleCount > 0 ? Math.round(item.totalTariff / item.tariffSampleCount) : 0,
    }));
  }, [activeProcedures]);

  // Chart data (potentially grouping into Top 8 + Other if requested)
  const chartData = useMemo(() => {
    if (displayMode === 'all' || specialtyBreakdown.length <= 8) {
      return specialtyBreakdown;
    }

    const top8 = specialtyBreakdown.slice(0, 8);
    const rest = specialtyBreakdown.slice(8);
    const otherCount = rest.reduce((acc, curr) => acc + curr.count, 0);
    const otherImplants = rest.reduce((acc, curr) => acc + curr.implantCount, 0);
    const otherPublic = rest.reduce((acc, curr) => acc + curr.publicReserveCount, 0);
    const otherMulti = rest.reduce((acc, curr) => acc + curr.multiProcCount, 0);
    const total = activeProcedures.length || 1;

    const otherItem: SpecialtyItem = {
      code: 'OTHER',
      name: `Other Specialties (${rest.length})`,
      count: otherCount,
      percentage: Number(((otherCount / total) * 100).toFixed(1)),
      color: '#64748b', // Slate 500
      implantCount: otherImplants,
      publicReserveCount: otherPublic,
      multiProcCount: otherMulti,
      avgTariff: 0,
    };

    return [...top8, otherItem];
  }, [specialtyBreakdown, displayMode, activeProcedures.length]);

  // High-level Catalog KPIs
  const stats = useMemo(() => {
    const totalCount = activeProcedures.length;
    const specialtyCount = specialtyBreakdown.length;
    const topSpecialty = specialtyBreakdown[0];
    const totalImplants = specialtyBreakdown.reduce((acc, s) => acc + s.implantCount, 0);
    const totalPublicReserved = specialtyBreakdown.reduce((acc, s) => acc + s.publicReserveCount, 0);
    const avgPerSpecialty = specialtyCount > 0 ? (totalCount / specialtyCount).toFixed(1) : '0';

    return {
      totalCount,
      specialtyCount,
      topSpecialty,
      totalImplants,
      totalPublicReserved,
      avgPerSpecialty,
    };
  }, [activeProcedures.length, specialtyBreakdown]);

  // Filtered breakdown list for search
  const visibleBreakdown = useMemo(() => {
    if (!breakdownSearch.trim()) return specialtyBreakdown;
    const q = breakdownSearch.toLowerCase();
    return specialtyBreakdown.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [specialtyBreakdown, breakdownSearch]);

  // Currently focused item (either hovered slice or selected specialty or top item)
  const currentFocusedItem = useMemo(() => {
    if (activeIndex !== null && chartData[activeIndex]) {
      return chartData[activeIndex];
    }
    if (selectedSpecialty !== 'all') {
      const match = specialtyBreakdown.find((s) => s.code === selectedSpecialty);
      if (match) return match;
    }
    return null;
  }, [activeIndex, chartData, selectedSpecialty, specialtyBreakdown]);

  // Copy structured breakdown to clipboard
  const handleCopyBreakdown = async () => {
    const lines = [
      `🏥 HBP CATALOG SPECIALTY DISTRIBUTION REPORT`,
      `Total Procedures: ${stats.totalCount} | Medical Specialties: ${stats.specialtyCount}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...specialtyBreakdown.map(
        (s, i) => `${i + 1}. [${s.code}] ${s.name}: ${s.count} procedures (${s.percentage}%)`
      ),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy summary', e);
    }
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: SpecialtyItem = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl border border-slate-700 max-w-xs text-xs z-50 pointer-events-none">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <div className="font-bold text-white truncate">{data.name}</div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-semibold ml-auto shrink-0">
              {data.code}
            </span>
          </div>

          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span>Procedures Count:</span>
              <span className="font-bold text-teal-400 font-mono text-sm tabular-nums">
                {data.count} <span className="text-xs text-slate-400 font-normal">({data.percentage}%)</span>
              </span>
            </div>

            {data.avgTariff > 0 && (
              <div className="flex items-center justify-between text-slate-300">
                <span>Avg Base Tariff:</span>
                <span className="font-mono text-slate-200">₹{data.avgTariff.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
              <span>Implants Mapped:</span>
              <span className="text-slate-300 font-mono">{data.implantCount} packages</span>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Public Reserved:</span>
              <span className="text-slate-300 font-mono">{data.publicReserveCount} packages</span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-teal-300/90 font-medium flex items-center gap-1">
            <span>Click slice to filter catalog</span>
            <ChevronRight className="w-2.5 h-2.5" />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      {/* Top Header & Visual Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <PieIcon className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-bold text-slate-900">Catalog Composition</span>
            <span aria-hidden="true">·</span>
            <span>HBP Master Specialty Breakdown</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
            Specialty Distribution
          </h2>
        </div>

        {/* Action & View Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Data Source Selector (if search or filters are active) */}
          {filteredProcedures && filteredProcedures.length !== procedures.length && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg font-medium">
              <button
                onClick={() => setDataSource('all')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  dataSource === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({procedures.length})
              </button>
              <button
                onClick={() => setDataSource('filtered')}
                className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                  dataSource === 'filtered'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Filtered ({filteredProcedures.length})
              </button>
            </div>
          )}

          {/* Donut vs Pie Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg font-medium">
            <button
              onClick={() => setChartType('donut')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                chartType === 'donut'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Donut
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${
                chartType === 'pie'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pie
            </button>
          </div>

          {/* Top 8 vs All toggle */}
          {specialtyBreakdown.length > 8 && (
            <button
              onClick={() => setDisplayMode((prev) => (prev === 'all' ? 'top8' : 'all'))}
              className={`px-2.5 py-1 font-medium rounded-lg border transition-colors cursor-pointer ${
                displayMode === 'top8'
                  ? 'bg-teal-50 border-teal-200 text-teal-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {displayMode === 'top8' ? 'Showing Top 8' : 'Show Top 8'}
            </button>
          )}

          {/* Copy Report */}
          <button
            onClick={handleCopyBreakdown}
            title="Copy structured breakdown to clipboard"
            className="inline-flex items-center gap-1 px-2.5 py-1 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Active Filter Clear indicator if a specialty is selected */}
          {selectedSpecialty !== 'all' && (
            <button
              onClick={() => onSelectSpecialty('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter ({selectedSpecialty})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-slate-500 font-medium">Medical Specialties</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
            {stats.specialtyCount}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-0.5 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Catalog categories
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-slate-500 font-medium">Largest Specialty</div>
          <div className="text-base font-bold text-slate-900 mt-0.5 truncate" title={stats.topSpecialty?.name}>
            {stats.topSpecialty?.name || 'NA'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {stats.topSpecialty?.count || 0} packages ({stats.topSpecialty?.percentage || 0}%)
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-slate-500 font-medium">Avg Procedures / Spec</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
            {stats.avgPerSpecialty}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Across active procedures
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-slate-500 font-medium">Implant Coverage</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
            {stats.totalImplants} <span className="text-xs text-slate-400 font-normal">({stats.totalCount > 0 ? ((stats.totalImplants / stats.totalCount) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            With mapped implants
          </div>
        </div>
      </div>

      {/* Main Visual Section: Side-by-Side Pie Chart & Interactive Breakdown List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* LEFT COLUMN: RECHARTS PIE / DONUT (5-cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[340px] h-[280px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={chartType === 'donut' ? 68 : 0}
                  outerRadius={105}
                  paddingAngle={chartType === 'donut' ? 2 : 1}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(entry: any) => {
                    const code = entry?.payload?.code || entry?.code;
                    if (code && code !== 'OTHER') {
                      onSelectSpecialty(selectedSpecialty === code ? 'all' : code);
                    }
                  }}
                  cursor="pointer"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => {
                    const isSelected = selectedSpecialty === entry.code;
                    const isHovered = activeIndex === index;
                    return (
                      <Cell
                        key={`cell-${entry.code}-${index}`}
                        fill={entry.color}
                        stroke={isSelected ? '#0f172a' : isHovered ? '#1e293b' : '#ffffff'}
                        strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                        opacity={activeIndex !== null && !isHovered && !isSelected ? 0.75 : 1}
                        className="transition-all duration-200 outline-none"
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Label */}
            {chartType === 'donut' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {currentFocusedItem ? (
                  <>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                      {currentFocusedItem.code}
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-900 tracking-tight tabular-nums leading-none mt-0.5">
                      {currentFocusedItem.count}
                    </span>
                    <span className="text-[11px] text-teal-700 font-semibold font-mono mt-0.5">
                      {currentFocusedItem.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 max-w-[110px] truncate mt-0.5">
                      {currentFocusedItem.name}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                      Total Catalog
                    </span>
                    <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight tabular-nums leading-none mt-1">
                      {stats.totalCount}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Packages
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {stats.specialtyCount} Specialties
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-slate-400 mt-1 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            <span>Hover slices for statistics · Click slice to filter catalog</span>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE BREAKDOWN TABLE & FILTER CARDS (7-cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Search filter for specialties */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search specialties (e.g. Burns, Surgery, BM)..."
                value={breakdownSearch}
                onChange={(e) => setBreakdownSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
              {breakdownSearch && (
                <button
                  onClick={() => setBreakdownSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-[10px] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-500 font-mono shrink-0">
              {visibleBreakdown.length} of {specialtyBreakdown.length} shown
            </div>
          </div>

          {/* Scrollable Ranked Breakdown List */}
          <div className="max-h-[260px] overflow-y-auto pr-1 space-y-1.5 divide-y divide-slate-100 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
            {visibleBreakdown.map((item, index) => {
              const isSelected = selectedSpecialty === item.code;
              const isHovered = activeIndex !== null && chartData[activeIndex]?.code === item.code;

              return (
                <div
                  key={item.code}
                  onMouseEnter={() => {
                    const chartIdx = chartData.findIndex((c) => c.code === item.code);
                    if (chartIdx !== -1) setActiveIndex(chartIdx);
                  }}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => onSelectSpecialty(isSelected ? 'all' : item.code)}
                  className={`group pt-1.5 first:pt-0 p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-teal-50 border border-teal-200 shadow-xs'
                      : isHovered
                      ? 'bg-white border border-slate-200 shadow-xs'
                      : 'hover:bg-white'
                  }`}
                >
                  {/* Left: Rank, Color Swatch & Specialty Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-slate-400 w-4 text-right shrink-0">
                      #{index + 1}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs transition-transform group-hover:scale-125"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[11px] text-slate-700 group-hover:text-teal-800">
                          {item.code}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-medium text-slate-900 truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>

                      {/* Mini Share Bar */}
                      <div className="w-full bg-slate-200/80 rounded-full h-1 mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(item.percentage, 3)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics & Filter Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 tabular-nums">
                        {item.count}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          pkg{item.count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-[10px] text-teal-700 font-mono font-medium">
                        {item.percentage}%
                      </div>
                    </div>

                    {/* Filter Trigger Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSpecialty(isSelected ? 'all' : item.code);
                      }}
                      title={isSelected ? 'Remove filter' : `Filter catalog by ${item.name}`}
                      className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'text-slate-400 hover:text-teal-700 hover:bg-slate-200'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Footer hint */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>Click any specialty to filter the catalog table and grid below</span>
            </span>
            {selectedSpecialty !== 'all' && (
              <span className="font-semibold text-teal-800">
                Active filter: {selectedSpecialty}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
