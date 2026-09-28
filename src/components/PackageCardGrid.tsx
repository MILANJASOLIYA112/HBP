import React, { useState } from 'react';
import { HBPProcedure } from '../types/hbp';
import { parseNumericTariff, parseImplantCost } from '../data/hbpData';
import { Eye, FileCheck, Calculator, CheckSquare, Square } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface PackageCardGridProps {
  procedures: HBPProcedure[];
  onSelectProcedure: (procedure: HBPProcedure) => void;
  onOpenAudit: (procedure: HBPProcedure) => void;
  onAddToCalculator: (procedure: HBPProcedure) => void;
  selectedForCompare: string[];
  onToggleCompare: (procedureCode: string) => void;
}

export const PackageCardGrid: React.FC<PackageCardGridProps> = ({
  procedures,
  onSelectProcedure,
  onOpenAudit,
  onAddToCalculator,
  selectedForCompare,
  onToggleCompare,
}) => {
  const [shareProcedure, setShareProcedure] = useState<HBPProcedure | null>(null);

  if (procedures.length === 0) {
    return (
      <div className="py-16 text-center text-slate-500 bg-white border border-slate-200 rounded-lg">
        No packages match your search filter criteria.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {procedures.map((proc) => {
        const tariffMeta = parseNumericTariff(proc.package_amount_tier3);
        const implantVal = parseImplantCost(proc.implant_mapped);
        const isSelectedCompare = selectedForCompare.includes(proc.procedure_code);

        return (
          <div
            key={proc.procedure_code}
            className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-xs"
          >
            <div>
              {/* Clean unboxed header metadata with typographic separators */}
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-semibold text-slate-900">{proc.procedure_code}</span>
                  <span aria-hidden="true">·</span>
                  <span>{proc.specialty_code}</span>
                  <span aria-hidden="true">·</span>
                  <span>LOS: {proc.los === 'NA' ? 'Daycare' : `${proc.los}d`}</span>
                </div>
                <button
                  onClick={() => onToggleCompare(proc.procedure_code)}
                  title={isSelectedCompare ? 'Remove from comparison' : 'Compare'}
                  className="text-slate-400 hover:text-teal-700 cursor-pointer"
                >
                  {isSelectedCompare ? (
                    <CheckSquare className="w-4 h-4 text-teal-700" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Package and Procedure name */}
              <h3
                onClick={() => onSelectProcedure(proc)}
                className="text-base font-semibold text-slate-900 hover:text-teal-700 cursor-pointer transition-colors leading-snug"
              >
                {proc.package_name}
              </h3>
              <div className="text-xs text-teal-800 font-medium mt-0.5">{proc.specialty}</div>

              <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                {proc.procedure_name}
              </p>

              {/* Tariff Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Tier 3 Tariff:</span>
                  <span className="text-base font-bold font-mono tabular-nums text-slate-900">
                    {tariffMeta.label}
                  </span>
                </div>
                {implantVal > 0 && (
                  <div className="flex items-baseline justify-between text-xs text-slate-500 mt-1">
                    <span>Implant Add-on:</span>
                    <span className="font-mono tabular-nums text-slate-700 font-medium">
                      +₹{implantVal.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                {proc.stratification_criteria === 'Yes' && (
                  <div className="text-[11px] text-amber-800 mt-1">
                    Stratification: {proc.stratification_remarks}
                  </div>
                )}
              </div>

              {/* Clean metadata footnotes */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-50">
                <span>Public Reserve: {proc.reservation_public_hospitals}</span>
                <span aria-hidden="true">·</span>
                <span>Multi-Procedure: {proc.multiple_procedures}</span>
                <span aria-hidden="true">·</span>
                <span>Auto-Approve: {proc.auto_approved}</span>
              </div>
            </div>

            {/* Functional action buttons */}
            <div className="grid grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => onSelectProcedure(proc)}
                title="View Full Package Details"
                className="inline-flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Details</span>
              </button>
              <button
                onClick={() => onOpenAudit(proc)}
                title="Open Pre-Auth & Claim Checklist"
                className="inline-flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded transition-colors cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pre-Auth</span>
              </button>
              <button
                onClick={() => onAddToCalculator(proc)}
                title="Calculate Tariff Breakdown"
                className="inline-flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded transition-colors cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tariff</span>
              </button>
              <button
                onClick={() => setShareProcedure(proc)}
                title="Share Package via WhatsApp"
                className="inline-flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        );
      })}

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
