import React, { useState } from 'react';
import { HBPProcedure, HospitalTier, HospitalAccreditation } from '../types/hbp';
import { TIER_CONFIG, ACCREDITATION_CONFIG, calculateProcedureTariff } from '../data/hbpData';
import { Plus, Trash2, ArrowUp, ArrowDown, Calculator, ShieldCheck, Printer, Check, Copy } from 'lucide-react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { formatTariffSummaryWhatsAppText, openWhatsAppShare } from '../utils/whatsappShare';

interface TariffCalculatorProps {
  allProcedures: HBPProcedure[];
  initialSelected?: HBPProcedure | null;
}

interface CartItem {
  cartId: string;
  procedure: HBPProcedure;
  bedDays: number;
}

export const TariffCalculator: React.FC<TariffCalculatorProps> = ({
  allProcedures,
  initialSelected,
}) => {
  const [tier, setTier] = useState<HospitalTier>('tier3');
  const [accreditation, setAccreditation] = useState<HospitalAccreditation>('none');
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (initialSelected) {
      return [{ cartId: 'item-1', procedure: initialSelected, bedDays: 3 }];
    }
    // Default to Total Hip Replacement (SB038B) with implant to showcase calculations
    const defaultProc = allProcedures.find((p) => p.procedure_code === 'SB038B') || allProcedures[0];
    return [{ cartId: 'item-1', procedure: defaultProc, bedDays: 7 }];
  });

  const [selectedToAdd, setSelectedToAdd] = useState<string>(allProcedures[0]?.procedure_code || '');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const handleShareTariffToWhatsApp = () => {
    const text = formatTariffSummaryWhatsAppText(
      calculatedItems,
      TIER_CONFIG[tier].label,
      ACCREDITATION_CONFIG[accreditation].label,
      grandTotal,
      totalProcedureCost,
      totalImplantCost
    );
    openWhatsAppShare(text);
  };

  const handleCopyTariffWhatsApp = async () => {
    const text = formatTariffSummaryWhatsAppText(
      calculatedItems,
      TIER_CONFIG[tier].label,
      ACCREDITATION_CONFIG[accreditation].label,
      grandTotal,
      totalProcedureCost,
      totalImplantCost
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const addProcedureToCart = () => {
    const found = allProcedures.find((p) => p.procedure_code === selectedToAdd);
    if (!found) return;
    const days = found.los !== 'NA' && !isNaN(parseInt(found.los, 10)) ? parseInt(found.los, 10) : 3;
    setCart((prev) => [
      ...prev,
      {
        cartId: `item-${Date.now()}`,
        procedure: found,
        bedDays: days,
      },
    ]);
  };

  const removeCartItem = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newCart = [...cart];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newCart.length) return;
    const temp = newCart[index];
    newCart[index] = newCart[targetIdx];
    newCart[targetIdx] = temp;
    setCart(newCart);
  };

  const updateBedDays = (cartId: string, days: number) => {
    setCart((prev) =>
      prev.map((item) => (item.cartId === cartId ? { ...item, bedDays: Math.max(1, days) } : item))
    );
  };

  // Calculations for each item in sequence
  const calculatedItems = cart.map((item, index) => {
    const tariff = calculateProcedureTariff(
      item.procedure,
      tier,
      accreditation,
      index, // sequence in multi-procedure rules
      item.bedDays
    );
    return {
      ...item,
      tariff,
    };
  });

  const totalProcedureCost = calculatedItems.reduce((acc, curr) => acc + curr.tariff.procedureCost, 0);
  const totalImplantCost = calculatedItems.reduce((acc, curr) => acc + curr.tariff.implantCost, 0);
  const grandTotal = totalProcedureCost + totalImplantCost;

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-mono">
              HBP Rules 2.2 · Tariff & Multi-Procedure Settlement Calculator
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Tariff & Multi-Procedure Claim Estimator
            </h1>
          </div>
          <button
            onClick={() => window.print()}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Claim Tariff</span>
          </button>
        </div>

        {/* Global Hospital Modifiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100">
          {/* City Tier Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Geographic City Classification
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['tier3', 'tier2', 'tier1'] as HospitalTier[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors cursor-pointer ${
                    tier === t
                      ? 'border-teal-700 bg-teal-50/50 text-teal-950 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold">{TIER_CONFIG[t].label.split(' ')[0]} {TIER_CONFIG[t].label.split(' ')[1]}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{t === 'tier3' ? 'Base (1.0x)' : t === 'tier2' ? '+10%' : '+25%'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hospital Quality Accreditation Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital Quality Accreditation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['none', 'entry_nabh', 'full_nabh'] as HospitalAccreditation[]).map((acc) => (
                <button
                  key={acc}
                  onClick={() => setAccreditation(acc)}
                  className={`px-3 py-2 text-xs rounded-lg border text-left transition-colors cursor-pointer ${
                    accreditation === acc
                      ? 'border-teal-700 bg-teal-50/50 text-teal-950 font-medium'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold">
                    {acc === 'none' ? 'Standard' : acc === 'entry_nabh' ? 'Entry NABH' : 'Full NABH/NABL'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {acc === 'none' ? 'No incentive' : acc === 'entry_nabh' ? '+10%' : '+15%'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Procedure to Claim Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Add Another Procedure to Same Admission (Multi-Procedure Settlement)
          </label>
          <select
            value={selectedToAdd}
            onChange={(e) => setSelectedToAdd(e.target.value)}
            className="w-full text-xs font-mono py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
          >
            {allProcedures.map((proc) => (
              <option key={proc.procedure_code} value={proc.procedure_code}>
                [{proc.procedure_code}] {proc.package_name} — {proc.package_amount_tier3}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={addProcedureToCart}
          className="w-full sm:w-auto self-end inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Claim</span>
        </button>
      </div>

      {/* Itemized Procedures in Claim */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Procedures in Admission ({cart.length})
        </h2>

        {cart.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs">
            No procedures in claim. Add a procedure from the list above.
          </div>
        ) : (
          calculatedItems.map((item, idx) => {
            const isPerDay = item.procedure.procedure_code === 'MG077A' ||
              item.procedure.procedure_code === 'MN001A' ||
              item.procedure.procedure_code === 'ID003A' ||
              item.procedure.procedure_code === 'MM001A';

            return (
              <div
                key={item.cartId}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs transition-colors hover:border-slate-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Procedure Metadata & Sequence */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        #{idx + 1} {idx === 0 ? 'Primary Procedure (100%)' : idx === 1 ? 'Secondary Procedure (50%)' : 'Tertiary Procedure (25%)'}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="font-mono text-teal-800 font-semibold">{item.procedure.procedure_code}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-600">{item.procedure.specialty}</span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">
                      {item.procedure.package_name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {item.procedure.procedure_name}
                    </p>

                    {/* Bed days adjuster if per-day billing */}
                    {isPerDay && (
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="text-slate-600 font-medium">Billed Bed / Dialysis Days:</span>
                        <input
                          type="number"
                          min={1}
                          max={item.procedure.procedure_code === 'MG077A' ? 5 : 30}
                          value={item.bedDays}
                          onChange={(e) => updateBedDays(item.cartId, parseInt(e.target.value, 10) || 1)}
                          className="w-16 font-mono text-center text-xs py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-700"
                        />
                        <span className="text-slate-400 text-[11px]">
                          {item.procedure.procedure_code === 'MG077A' ? '(Max 5 days in one admission)' : 'days'}
                        </span>
                      </div>
                    )}

                    {/* Breakdown list */}
                    <div className="text-[11px] text-slate-500 font-mono space-y-0.5 pt-1">
                      {item.tariff.breakdown.map((line, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-1.5">
                          <span className="text-teal-700">•</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Pricing & Reordering Actions */}
                  <div className="flex sm:flex-col items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-500">Calculated Settlement</div>
                      <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                        ₹{item.tariff.totalCost.toLocaleString('en-IN')}
                      </div>
                      {item.tariff.implantCost > 0 && (
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          Includes ₹{item.tariff.implantCost.toLocaleString('en-IN')} implant
                        </div>
                      )}
                    </div>

                    {/* Order up / down / remove buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveItem(idx, 'up')}
                        title="Move Up (Primary)"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        disabled={idx === cart.length - 1}
                        onClick={() => moveItem(idx, 'down')}
                        title="Move Down (Secondary/Tertiary)"
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeCartItem(item.cartId)}
                        title="Remove from claim"
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Claim Settlement Grand Summary */}
      {cart.length > 0 && (
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono text-teal-400">Total Admission Settlement Claim</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums mt-1">
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-xs text-slate-400 font-mono text-left sm:text-right space-y-1">
              <div>Procedures Total: ₹{totalProcedureCost.toLocaleString('en-IN')}</div>
              <div>Implants Total: ₹{totalImplantCost.toLocaleString('en-IN')}</div>
              <div>Applied City Tier: {TIER_CONFIG[tier].label}</div>
            </div>
          </div>

          <div className="pt-4 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span>Calculated per National Health Authority (NHA) Multi-Procedure Guidelines.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyTariffWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {copiedWhatsApp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedWhatsApp ? 'Copied!' : 'Copy Summary'}</span>
              </button>
              <button
                onClick={handleShareTariffToWhatsApp}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
