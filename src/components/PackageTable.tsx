import React, { useState } from 'react';
import { HBPProcedure } from '../types/hbp';
import { parseNumericTariff, parseImplantCost } from '../data/hbpData';
import { ArrowUpDown, Eye, FileCheck, Calculator, CheckSquare, Square } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface PackageTableProps {
  procedures: HBPProcedure[];
  onSelectProcedure: (procedure: HBPProcedure) => void;
  onOpenAudit: (procedure: HBPProcedure) => void;
  onAddToCalculator: (procedure: HBPProcedure) => void;
  selectedForCompare: string[];
  onToggleCompare: (procedureCode: string) => void;
  sortField: keyof HBPProcedure | 'amount_numeric';
  sortDirection: 'asc' | 'desc';
  onSort: (field: keyof HBPProcedure | 'amount_numeric') => void;
}

export const PackageTable: React.FC<PackageTableProps> = ({
  procedures,
  onSelectProcedure,
  onOpenAudit,
  onAddToCalculator,
  selectedForCompare,
  onToggleCompare,
  sortField,
  sortDirection,
  onSort,
}) => {
  const [shareProcedure, setShareProcedure] = useState<HBPProcedure | null>(null);

  const getSortIcon = (field: keyof HBPProcedure | 'amount_numeric') => {
    return (
      <ArrowUpDown
        className={`w-3.5 h-3.5 ml-1 inline-block transition-opacity ${
          sortField === field ? 'text-teal-700 opacity-100' : 'text-slate-400 opacity-40 hover:opacity-100'
        }`}
      />
    );
  };

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold select-none">
          <tr>
            <th className="py-3 px-3 w-10 text-center">
              <span className="sr-only">Compare</span>
            </th>
            <th
              onClick={() => onSort('procedure_code')}
              className="py-3 px-3 cursor-pointer hover:text-slate-900 whitespace-nowrap"
            >
              <span>Code</span>
              {getSortIcon('procedure_code')}
            </th>
            <th
              onClick={() => onSort('specialty')}
              className="py-3 px-3 cursor-pointer hover:text-slate-900"
            >
              <span>Specialty</span>
              {getSortIcon('specialty')}
            </th>
            <th
              onClick={() => onSort('package_name')}
              className="py-3 px-3 cursor-pointer hover:text-slate-900 min-w-[180px]"
            >
              <span>Package & Procedure Criteria</span>
              {getSortIcon('package_name')}
            </th>
            <th
              onClick={() => onSort('amount_numeric')}
              className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right whitespace-nowrap"
            >
              <span>Tier 3 Tariff</span>
              {getSortIcon('amount_numeric')}
            </th>
            <th
              onClick={() => onSort('los')}
              className="py-3 px-3 cursor-pointer hover:text-slate-900 text-center whitespace-nowrap"
            >
              <span>LOS (Days)</span>
              {getSortIcon('los')}
            </th>
            <th className="py-3 px-3 text-center whitespace-nowrap">
              <span>Public Reserve</span>
            </th>
            <th className="py-3 px-3 text-center whitespace-nowrap">
              <span>Multi-Proc</span>
            </th>
            <th className="py-3 px-3 text-right whitespace-nowrap">
              <span>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {procedures.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-12 text-center text-slate-500">
                No health benefit packages match your current search or filters.
              </td>
            </tr>
          ) : (
            procedures.map((proc) => {
              const isSelectedCompare = selectedForCompare.includes(proc.procedure_code);
              const tariffMeta = parseNumericTariff(proc.package_amount_tier3);
              const implantVal = parseImplantCost(proc.implant_mapped);

              return (
                <tr
                  key={proc.procedure_code}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Compare checkbox */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onToggleCompare(proc.procedure_code)}
                      title={isSelectedCompare ? 'Remove from comparison' : 'Add to comparison'}
                      className="text-slate-400 hover:text-teal-700 transition-colors cursor-pointer"
                    >
                      {isSelectedCompare ? (
                        <CheckSquare className="w-4 h-4 text-teal-700" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Code */}
                  <td className="py-3 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                    <button
                      onClick={() => onSelectProcedure(proc)}
                      className="hover:underline hover:text-teal-700 cursor-pointer text-left"
                    >
                      {proc.procedure_code}
                    </button>
                  </td>

                  {/* Specialty */}
                  <td className="py-3 px-3 text-slate-700 max-w-[140px] truncate" title={proc.specialty}>
                    <div className="font-medium text-slate-900 truncate">{proc.specialty}</div>
                    <div className="text-[11px] font-mono text-slate-400">{proc.specialty_code}</div>
                  </td>

                  {/* Package & Procedure */}
                  <td className="py-3 px-3 max-w-[320px]">
                    <div className="font-semibold text-slate-900 leading-snug">
                      {proc.package_name}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5" title={proc.procedure_name}>
                      {proc.procedure_name}
                    </p>
                    {proc.implant_mapped !== 'NA' && (
                      <div className="text-[11px] text-teal-700 font-medium mt-1">
                        + Implant: {proc.implant_mapped}
                      </div>
                    )}
                  </td>

                  {/* Tariff */}
                  <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                    <div className="text-slate-900 font-semibold tabular-nums">
                      {tariffMeta.label}
                    </div>
                    {proc.stratification_criteria === 'Yes' && (
                      <div className="text-[10px] text-amber-700 font-sans">
                        Stratified: {proc.stratification_remarks}
                      </div>
                    )}
                    {implantVal > 0 && (
                      <div className="text-[10px] text-slate-500 font-sans tabular-nums">
                        Implant: ₹{implantVal.toLocaleString('en-IN')}
                      </div>
                    )}
                  </td>

                  {/* LOS */}
                  <td className="py-3 px-3 text-center whitespace-nowrap font-mono tabular-nums text-slate-700">
                    {proc.los === 'NA' ? 'Daycare / N/A' : `${proc.los} d`}
                  </td>

                  {/* Reservation */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {proc.reservation_public_hospitals === 'Yes' ? (
                      <span className="text-amber-800 font-medium text-[11px]">
                        Public Only
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">
                        Open
                      </span>
                    )}
                  </td>

                  {/* Multi-Procedure */}
                  <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600">
                    {proc.multiple_procedures === 'Yes' ? 'Eligible' : 'Single'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectProcedure(proc)}
                        title="View Full Clinical & Document Details"
                        className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenAudit(proc)}
                        title="Open Pre-Auth & Claim Processing Checklist"
                        className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onAddToCalculator(proc)}
                        title="Calculate Tariff for this Package"
                        className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setShareProcedure(proc)}
                        title="Share Full Package via WhatsApp"
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* WhatsApp Share Modal */}
      {shareProcedure && (
        <WhatsAppShareModal
          isOpen={!!shareProcedure}
          onClose={() => setShareProcedure(null)}
          procedure={shareProcedure}
          defaultMode="package"
        />
      )}
    </div>
  );
};
