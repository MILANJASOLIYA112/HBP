import React from 'react';
import { HBPProcedure } from '../types/hbp';
import { X, FileCheck, Calculator, Trash2 } from 'lucide-react';
import { parseNumericTariff } from '../data/hbpData';

interface PackageComparisonModalProps {
  selectedCodes: string[];
  allProcedures: HBPProcedure[];
  onClose: () => void;
  onRemoveCode: (code: string) => void;
  onOpenAudit: (procedure: HBPProcedure) => void;
  onOpenCalculator: (procedure: HBPProcedure) => void;
}

export const PackageComparisonModal: React.FC<PackageComparisonModalProps> = ({
  selectedCodes,
  allProcedures,
  onClose,
  onRemoveCode,
  onOpenAudit,
  onOpenCalculator,
}) => {
  const comparedProcs = selectedCodes
    .map((code) => allProcedures.find((p) => p.procedure_code === code))
    .filter((p): p is HBPProcedure => !!p);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500 font-mono">Comparative HBP Analysis</div>
            <h2 className="text-lg font-bold text-slate-900">
              Side-by-Side Package Comparison ({comparedProcs.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          {comparedProcs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No packages selected for comparison. Click the checkbox on any procedure in the catalog to add it here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <tbody>
                  {/* Package Code & Name */}
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-3 font-semibold text-slate-500 w-36 bg-slate-50">Package</td>
                    {comparedProcs.map((proc) => (
                      <td key={proc.procedure_code} className="py-3 px-3 min-w-[220px]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {proc.procedure_code}
                          </span>
                          <button
                            onClick={() => onRemoveCode(proc.procedure_code)}
                            title="Remove from compare"
                            className="text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="font-semibold text-slate-900 mt-1">{proc.package_name}</div>
                        <div className="text-slate-500 text-[11px]">{proc.specialty} ({proc.specialty_code})</div>
                      </td>
                    ))}
                  </tr>

                  {/* Tier 3 Tariff */}
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-3 font-semibold text-slate-500 bg-slate-50">Tier 3 Tariff</td>
                    {comparedProcs.map((proc) => {
                      const tariffMeta = parseNumericTariff(proc.package_amount_tier3);
                      return (
                        <td key={proc.procedure_code} className="py-3 px-3 font-mono">
                          <div className="font-bold text-slate-900 text-sm tabular-nums">{tariffMeta.label}</div>
                          {proc.stratification_criteria === 'Yes' && (
                            <div className="text-[10px] text-amber-700 font-sans mt-0.5">
                              Stratification: {proc.stratification_remarks}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Implants */}
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-3 font-semibold text-slate-500 bg-slate-50">Mapped Implant</td>
                    {comparedProcs.map((proc) => (
                      <td key={proc.procedure_code} className="py-3 px-3">
                        <span className={proc.implant_mapped !== 'NA' ? 'font-medium text-teal-800' : 'text-slate-500'}>
                          {proc.implant_mapped}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Length of Stay */}
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-3 font-semibold text-slate-500 bg-slate-50">LOS Benchmark</td>
                    {comparedProcs.map((proc) => (
                      <td key={proc.procedure_code} className="py-3 px-3 font-mono tabular-nums text-slate-800">
                        {proc.los === 'NA' ? 'Daycare / N/A' : `${proc.los} Days`}
                      </td>
                    ))}
                  </tr>

                  {/* Public Hospital Reserve */}
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-3 font-semibold text-slate-500 bg-slate-50">Public Reserve</td>
                    {comparedProcs.map((proc) => (
                      <td key={proc.procedure_code} className="py-3 px-3">
                        {proc.reservation_public_hospitals === 'Yes' ? (
                          <span className="font-semibold text-amber-800">Reserved for Public Hospitals</span>
                        ) : (
                          <span className="text-slate-600">Open to Empanelled Private</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Multi-Procedure */}
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-3 font-semibold text-slate-500 bg-slate-50">Multi-Procedure</td>
                    {comparedProcs.map((proc) => (
                      <td key={proc.procedure_code} className="py-3 px-3 text-slate-700">
                        {proc.multiple_procedures === 'Yes' ? 'Eligible (50%/25% rules)' : 'Standalone only'}
                      </td>
                    ))}
                  </tr>

                  {/* Clinical Criteria */}
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-3 font-semibold text-slate-500 bg-slate-50">Clinical Criteria</td>
                    {comparedProcs.map((proc) => (
                      <td key={proc.procedure_code} className="py-3 px-3 text-slate-700 leading-relaxed">
                        {proc.procedure_name}
                      </td>
                    ))}
                  </tr>

                  {/* Mandatory Pre-Auth Documents */}
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-3 font-semibold text-slate-500 bg-slate-50">Pre-Auth Documents</td>
                    {comparedProcs.map((proc) => (
                      <td key={proc.procedure_code} className="py-3 px-3 text-slate-700 leading-relaxed bg-slate-50/50">
                        {proc.mandatory_documents_pre_auth}
                      </td>
                    ))}
                  </tr>

                  {/* Mandatory Claim Documents */}
                  <tr className="border-b border-slate-200">
                    <td className="py-3 px-3 font-semibold text-slate-500 bg-slate-50">Claim Documents</td>
                    {comparedProcs.map((proc) => (
                      <td key={proc.procedure_code} className="py-3 px-3 text-slate-700 leading-relaxed">
                        {proc.mandatory_documents_claim_processing}
                      </td>
                    ))}
                  </tr>

                  {/* Direct Actions */}
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-500 bg-slate-50">Quick Launch</td>
                    {comparedProcs.map((proc) => (
                      <td key={proc.procedure_code} className="py-3 px-3">
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => {
                              onClose();
                              onOpenAudit(proc);
                            }}
                            className="inline-flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium text-teal-900 bg-teal-50 hover:bg-teal-100 rounded transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Audit Pre-Auth</span>
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              onOpenCalculator(proc);
                            }}
                            className="inline-flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Calculate Tariff</span>
                          </button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
