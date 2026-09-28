import React, { useState } from 'react';
import { HBPProcedure } from '../types/hbp';
import { parseNumericTariff, parseImplantCost } from '../data/hbpData';
import { X, Copy, Check, FileCheck, Calculator, Flame, AlertCircle } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { WhatsAppShareModal } from './WhatsAppShareModal';

interface PackageDetailModalProps {
  procedure: HBPProcedure | null;
  onClose: () => void;
  onOpenAudit: (procedure: HBPProcedure) => void;
  onOpenCalculator: (procedure: HBPProcedure) => void;
  onOpenBurnsCalc?: (procedure: HBPProcedure) => void;
}

export const PackageDetailModal: React.FC<PackageDetailModalProps> = ({
  procedure,
  onClose,
  onOpenAudit,
  onOpenCalculator,
  onOpenBurnsCalc,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  if (!procedure) return null;

  const tariffMeta = parseNumericTariff(procedure.package_amount_tier3);
  const implantVal = parseImplantCost(procedure.implant_mapped);
  const isBurns = procedure.specialty_code === 'BM' || procedure.package_name.toLowerCase().includes('burn');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <span className="font-bold text-slate-900 text-sm">{procedure.procedure_code}</span>
              <span aria-hidden="true">·</span>
              <span>{procedure.specialty_code}</span>
              <span aria-hidden="true">·</span>
              <span>{procedure.specialty}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{procedure.package_name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Share full package details via WhatsApp text"
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Share to WhatsApp</span>
              <span className="sm:hidden">Share</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Procedure Criteria Description */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Clinical & Procedure Criteria</span>
              <button
                onClick={() => handleCopy(procedure.procedure_name, 'crit')}
                className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedKey === 'crit' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'crit' ? 'Copied' : 'Copy Criteria'}</span>
              </button>
            </div>
            <p className="text-slate-800 leading-relaxed font-normal whitespace-pre-line">
              {procedure.procedure_name}
            </p>
          </div>

          {/* Key Parameters Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-[11px] text-slate-500">Tier 3 Package Tariff</div>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                {tariffMeta.label}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-[11px] text-slate-500">Length of Stay (LOS)</div>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                {procedure.los === 'NA' ? 'Daycare / N/A' : `${procedure.los} Days`}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-[11px] text-slate-500">Public Hospital Reserve</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {procedure.reservation_public_hospitals === 'Yes' ? 'Reserved' : 'Open / No'}
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-[11px] text-slate-500">Multi-Procedure Allowed</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {procedure.multiple_procedures === 'Yes' ? 'Yes (Discounted)' : 'No'}
              </div>
            </div>
          </div>

          {/* Stratification & Special Conditions Notice */}
          {(procedure.stratification_criteria === 'Yes' || procedure.implant_mapped !== 'NA' || procedure.special_conditions === 'Yes') && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs space-y-1.5 text-amber-950">
              {procedure.stratification_criteria === 'Yes' && (
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Stratification Rules: </span>
                    <span>{procedure.stratification_remarks}</span>
                  </div>
                </div>
              )}
              {procedure.implant_mapped !== 'NA' && (
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Mapped Implant Tariff: </span>
                    <span>{procedure.implant_mapped} (Claimed as separate line item)</span>
                  </div>
                </div>
              )}
              {procedure.special_conditions === 'Yes' && (
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Special Clinical Conditions: </span>
                    <span>Strict compliance with HBP pre-requisites & specialist empanelment required.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mandatory Documents for Pre-Auth */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                Mandatory Documents for Pre-Authorization
              </h4>
              <button
                onClick={() => handleCopy(procedure.mandatory_documents_pre_auth, 'pre')}
                className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedKey === 'pre' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'pre' ? 'Copied' : 'Copy List'}</span>
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-slate-700 leading-relaxed text-xs">
              {procedure.mandatory_documents_pre_auth}
            </div>
          </div>

          {/* Mandatory Documents for Claim Processing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                Mandatory Documents for Claim Processing & Discharge
              </h4>
              <button
                onClick={() => handleCopy(procedure.mandatory_documents_claim_processing, 'claim')}
                className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedKey === 'claim' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'claim' ? 'Copied' : 'Copy List'}</span>
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-slate-700 leading-relaxed text-xs">
              {procedure.mandatory_documents_claim_processing}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isBurns && onOpenBurnsCalc && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBurnsCalc(procedure);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-700" />
                <span>Rule of 9 Burn Chart</span>
              </button>
            )}
            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share to WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAudit(procedure);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Generate Audit Checklist</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenCalculator(procedure);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculate Settlement</span>
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Modal */}
      {isWhatsAppOpen && (
        <WhatsAppShareModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          procedure={procedure}
          defaultMode="package"
        />
      )}
    </div>
  );
};
