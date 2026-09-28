import React, { useState } from 'react';
import { HBPProcedure } from '../types/hbp';
import { Flame, Check, ArrowRight, RefreshCw, FileCheck, Calculator } from 'lucide-react';

interface BurnsRuleOfNineCalculatorProps {
  burnProcedures: HBPProcedure[];
  onSelectForAudit: (procedure: HBPProcedure) => void;
  onSelectForCalculator: (procedure: HBPProcedure) => void;
}

interface AnatomicalRegion {
  id: string;
  name: string;
  percentage: number;
  category: 'head' | 'torso' | 'arms' | 'legs' | 'perineum';
}

const REGIONS: AnatomicalRegion[] = [
  { id: 'head_neck', name: 'Head & Neck', percentage: 9, category: 'head' },
  { id: 'anterior_chest', name: 'Anterior Chest (Upper Torso)', percentage: 9, category: 'torso' },
  { id: 'anterior_abdomen', name: 'Anterior Abdomen (Lower Torso)', percentage: 9, category: 'torso' },
  { id: 'upper_back', name: 'Upper Back', percentage: 9, category: 'torso' },
  { id: 'lower_back', name: 'Lower Back & Buttocks', percentage: 9, category: 'torso' },
  { id: 'right_arm', name: 'Right Arm (Whole)', percentage: 9, category: 'arms' },
  { id: 'left_arm', name: 'Left Arm (Whole)', percentage: 9, category: 'arms' },
  { id: 'right_leg', name: 'Right Leg (Whole)', percentage: 18, category: 'legs' },
  { id: 'left_leg', name: 'Left Leg (Whole)', percentage: 18, category: 'legs' },
  { id: 'perineum', name: 'Perineum / Genitalia', percentage: 1, category: 'perineum' },
];

export const BurnsRuleOfNineCalculator: React.FC<BurnsRuleOfNineCalculatorProps> = ({
  burnProcedures,
  onSelectForAudit,
  onSelectForCalculator,
}) => {
  const [patientType, setPatientType] = useState<'adult' | 'child'>('adult');
  const [selectedRegions, setSelectedRegions] = useState<Record<string, number>>({});
  const [deepBurns, setDeepBurns] = useState(false);

  const toggleRegion = (id: string, fullPercent: number) => {
    setSelectedRegions((prev) => {
      const current = prev[id] || 0;
      if (current === 0) {
        return { ...prev, [id]: fullPercent };
      } else if (current === fullPercent) {
        return { ...prev, [id]: Math.round(fullPercent / 2) }; // Half involvement
      } else {
        const next = { ...prev };
        delete next[id];
        return next;
      }
    });
  };

  const setManualPercent = (id: string, maxPercent: number, val: number) => {
    setSelectedRegions((prev) => {
      const clamped = Math.max(0, Math.min(maxPercent, val));
      if (clamped === 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: clamped };
    });
  };

  const resetAll = () => {
    setSelectedRegions({});
    setDeepBurns(false);
  };

  const totalTBSA = Object.values(selectedRegions).reduce((acc, curr) => acc + curr, 0);

  // Match HBP package
  let matchedCode = 'BM001A';
  let matchedReason = '';

  if (totalTBSA > 60) {
    matchedCode = 'BM003D';
    matchedReason = 'Total Body Surface Area > 60% burns. Meets Flame/Thermal Major Burn criteria with surgical intervention.';
  } else if (totalTBSA > 20 || deepBurns) {
    matchedCode = 'BM001B';
    matchedReason = deepBurns
      ? 'Deep burns requiring surgical intervention / skin grafting / flap cover (Criteria 2).'
      : 'TBSA between 20% and 25% (or extensive) requiring surgical management and wound debridement.';
  } else {
    matchedCode = 'BM001A';
    matchedReason = patientType === 'adult'
      ? 'TBSA < 20% in adult patient. Eligible for Criteria 1 dressing without anesthesia.'
      : 'TBSA < 10% in pediatric patient (< 12 yrs). Eligible for Criteria 1.';
  }

  const matchedProcedure = burnProcedures.find((p) => p.procedure_code === matchedCode) || burnProcedures[0];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 font-mono">
              Clinical Pre-Auth Wallace Rule of 9 Burns Tool
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Total Body Surface Area (% TBSA) Package Matcher
            </h1>
          </div>
          <button
            onClick={resetAll}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Chart</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          HBP Guidelines for Burns Management (BM001A, BM001B, BM003D) require photographic evidence mapped with Wallace Rule of Nines.
          Use this interactive chart to calculate patient % TBSA and identify the qualifying PM-JAY tariff package.
        </p>

        {/* Patient Classification & Deep Burns Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="font-semibold text-slate-700 block mb-1">Patient Age Category:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPatientType('adult')}
                className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer ${
                  patientType === 'adult' ? 'border-teal-700 bg-teal-50 text-teal-950' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Adult (Criteria: &lt;20% TBSA)
              </button>
              <button
                onClick={() => setPatientType('child')}
                className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer ${
                  patientType === 'child' ? 'border-teal-700 bg-teal-50 text-teal-950' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                Child &lt; 12 Yrs (Criteria: &lt;10% TBSA)
              </button>
            </div>
          </div>

          <div>
            <span className="font-semibold text-slate-700 block mb-1">Burn Depth / Surgical Requirement:</span>
            <label className="flex items-center gap-2 cursor-pointer mt-1.5">
              <input
                type="checkbox"
                checked={deepBurns}
                onChange={(e) => setDeepBurns(e.target.checked)}
                className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-700"
              />
              <span className="text-slate-800">
                Deep burns not amenable to heal with dressings alone (requires skin graft / flap cover)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Grid: Anatomical Selector on Left, Diagnostic Match on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Anatomical Regions Table / Toggles */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Anatomical Regions (Wallace Rule of Nines)
            </h2>
            <span className="text-xs text-slate-500">Click row to toggle 0% / 50% / 100%</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {REGIONS.map((region) => {
              const currentVal = selectedRegions[region.id] || 0;
              const isFull = currentVal === region.percentage;
              const isPartial = currentVal > 0 && currentVal < region.percentage;

              return (
                <div
                  key={region.id}
                  className={`py-2.5 px-3 flex items-center justify-between rounded-lg transition-colors cursor-pointer ${
                    currentVal > 0 ? 'bg-amber-50/60' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => toggleRegion(region.id, region.percentage)}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{region.name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({region.percentage}%)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Current involvement: {currentVal}%
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      min={0}
                      max={region.percentage}
                      value={currentVal}
                      onChange={(e) => setManualPercent(region.id, region.percentage, parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center font-mono py-1 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                    />
                    <span className="text-slate-400 font-mono text-xs">%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnostic Assessment Result on Right */}
        <div className="lg:col-span-5 space-y-4">
          {/* TBSA Metric Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="text-xs font-mono text-slate-500">Calculated Wallace TBSA</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold font-mono text-slate-900 tabular-nums">
                {totalTBSA}%
              </span>
              <span className="text-xs font-semibold text-slate-600">Total Body Surface Area</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalTBSA > 60 ? 'bg-rose-600' : totalTBSA > 20 ? 'bg-amber-500' : 'bg-teal-600'
                }`}
                style={{ width: `${Math.min(100, totalTBSA)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>0%</span>
              <span>20% (Criteria 1)</span>
              <span>60% (Criteria 3)</span>
              <span>100%</span>
            </div>
          </div>

          {/* Matched HBP Package Recommendation */}
          <div className="bg-white border-2 border-teal-700 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-teal-800">
                <Check className="w-4 h-4 text-teal-700" />
                <span>Qualifying Health Benefit Package</span>
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {matchedProcedure.procedure_code}
              </div>
              <div className="text-sm font-semibold text-slate-800 mt-0.5">
                {matchedProcedure.package_name}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {matchedReason}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Base Tier 3 Rate:</span>
              <span className="text-base font-bold text-slate-900">
                ₹{parseInt(matchedProcedure.package_amount_tier3, 10).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Expected Stay (LOS):</span>
              <span className="font-semibold text-slate-800">{matchedProcedure.los} Days</span>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                onClick={() => onSelectForAudit(matchedProcedure)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Open Pre-Auth Checklist for {matchedProcedure.procedure_code}</span>
              </button>
              <button
                onClick={() => onSelectForCalculator(matchedProcedure)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Add to Settlement Calculator</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
