import React, { useState, useRef } from 'react';
import { HBPProcedure } from '../types/hbp';
import { parseProceduresFromFile, formatFileSize } from '../utils/fileImport';
import {
  X,
  Check,
  Upload,
  FileSpreadsheet,
  FileText,
  FileCode,
  FileUp,
  Download,
  AlertCircle,
  CheckCircle2,
  ListPlus,
  Edit3,
  Loader2,
  Trash2,
} from 'lucide-react';

interface AddPackageModalProps {
  onClose: () => void;
  onAddPackage: (procedure: HBPProcedure) => void;
  onBatchAddPackages?: (procedures: HBPProcedure[]) => void;
  existingSpecialties: { code: string; name: string }[];
}

export const AddPackageModal: React.FC<AddPackageModalProps> = ({
  onClose,
  onAddPackage,
  onBatchAddPackages,
  existingSpecialties,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  
  // Manual Form State
  const [formData, setFormData] = useState<HBPProcedure>({
    specialty_code: 'BM',
    specialty: 'Burns Management',
    package_name: '',
    procedure_name: '',
    procedure_code: '',
    package_amount_tier3: '15000',
    implant_mapped: 'NA',
    stratification_criteria: 'No',
    stratification_remarks: 'NA',
    multiple_procedures: 'Yes',
    special_conditions: 'No',
    reservation_public_hospitals: 'No',
    los: '3',
    auto_approved: 'No',
    mandatory_documents_pre_auth: 'Clinical Notes, Investigations report confirming diagnosis',
    mandatory_documents_claim_processing: 'Detailed Discharge Summary, Operative Notes, Post-op diagnostic proof',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // File Upload & Batch Parse State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedFileSummary, setUploadedFileSummary] = useState<{
    fileName: string;
    fileSize: string;
    format: string;
    summary: string;
  } | null>(null);
  const [parsedProcedures, setParsedProcedures] = useState<HBPProcedure[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // File Selection & Parsing Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setImportError(null);
    setSuccessMessage(null);

    try {
      const result = await parseProceduresFromFile(file);

      if (result.error) {
        setImportError(result.error);
        setParsedProcedures([]);
        setSelectedIndices([]);
      } else if (result.procedures.length === 0) {
        setImportError('No valid procedures found in the uploaded file.');
        setParsedProcedures([]);
        setSelectedIndices([]);
      } else {
        setUploadedFileSummary({
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          format: result.format.toUpperCase(),
          summary: result.summary,
        });
        setParsedProcedures(result.procedures);
        // Select all by default
        setSelectedIndices(result.procedures.map((_, i) => i));

        // If in manual tab and only 1 procedure parsed, offer auto-fill
        if (activeTab === 'manual') {
          populateFormWithProcedure(result.procedures[0]);
          setSuccessMessage(`Auto-filled manual form with procedure [${result.procedures[0].procedure_code}] from "${file.name}".`);
        } else {
          setSuccessMessage(`Successfully parsed ${result.procedures.length} procedure record(s) from "${file.name}".`);
        }
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to read and parse procedure file.');
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  // Populate manual form with a parsed procedure
  const populateFormWithProcedure = (proc: HBPProcedure) => {
    setFormData(proc);
    setFormError(null);
  };

  // Handle Manual Form Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.procedure_code.trim()) {
      setFormError('Procedure Code is required (e.g. GS001A)');
      return;
    }
    if (!formData.package_name.trim()) {
      setFormError('Package Name is required');
      return;
    }
    if (!formData.procedure_name.trim()) {
      setFormError('Clinical criteria / procedure description is required');
      return;
    }

    onAddPackage(formData);
    onClose();
  };

  // Handle Batch Import Execution
  const handleExecuteBatchImport = () => {
    const toImport = selectedIndices.map((idx) => parsedProcedures[idx]).filter(Boolean);
    if (toImport.length === 0) {
      setImportError('Please select at least one procedure to import.');
      return;
    }

    if (onBatchAddPackages) {
      onBatchAddPackages(toImport);
    } else {
      toImport.forEach((proc) => onAddPackage(proc));
    }

    onClose();
  };

  // Toggle selection for batch import
  const toggleSelectIndex = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === parsedProcedures.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(parsedProcedures.map((_, i) => i));
    }
  };

  // Specialty dropdown change handler
  const handleSpecialtyChange = (code: string) => {
    const found = existingSpecialties.find((s) => s.code === code);
    setFormData((prev) => ({
      ...prev,
      specialty_code: code,
      specialty: found ? found.name : prev.specialty,
    }));
  };

  // Download sample procedure templates (CSV or XML)
  const handleDownloadSample = (format: 'csv' | 'xml') => {
    if (format === 'csv') {
      const csvHeader = 'specialty_code,specialty,package_name,procedure_name,procedure_code,package_amount_tier3,implant_mapped,stratification_criteria,stratification_remarks,multiple_procedures,special_conditions,reservation_public_hospitals,los,auto_approved,mandatory_documents_pre_auth,mandatory_documents_claim_processing';
      const sampleRow = 'GS,General Surgery,Laparoscopic Appendectomy,Laparoscopic Appendectomy for acute inflammation,GS010A,17500,NA,No,NA,Yes,No,No,3,No,"Clinical notes, USG Abdomen showing appendicitis","Histopathology of appendix, Detailed Operative notes"';
      const sampleRow2 = 'SB,Orthopedics,Total Knee Replacement,Unilateral Cemented TKR,SB040A,48000,"Knee Prosthesis - 65000",No,NA,Yes,Yes,No,7,No,"Pre-op weight bearing X-rays Grade 3/4 OA","Post-op X-ray showing prosthesis, Barcode of implant"';
      const content = `${csvHeader}\n${sampleRow}\n${sampleRow2}`;
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_hbp_procedures.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<procedures>
  <procedure>
    <procedure_code>GS010A</procedure_code>
    <package_name>Laparoscopic Appendectomy</package_name>
    <procedure_name>Laparoscopic Appendectomy for acute inflammation</procedure_name>
    <specialty>General Surgery</specialty>
    <specialty_code>GS</specialty_code>
    <package_amount_tier3>17500</package_amount_tier3>
    <implant_mapped>NA</implant_mapped>
    <stratification_criteria>No</stratification_criteria>
    <stratification_remarks>NA</stratification_remarks>
    <multiple_procedures>Yes</multiple_procedures>
    <special_conditions>No</special_conditions>
    <reservation_public_hospitals>No</reservation_public_hospitals>
    <los>3</los>
    <auto_approved>No</auto_approved>
    <mandatory_documents_pre_auth>Clinical notes, USG Abdomen</mandatory_documents_pre_auth>
    <mandatory_documents_claim_processing>Histopathology, Operative notes</mandatory_documents_claim_processing>
  </procedure>
</procedures>`;
      const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_hbp_procedures.xml';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col my-auto">
        {/* Hidden File Input for XLSX, PDF, XML, CSV */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.pdf,.xml,.csv,text/csv,application/pdf,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500 font-mono">HBP Master Maintenance</div>
            <h2 className="text-lg font-bold text-slate-900">Add Procedure Packages</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-6 pt-3 pb-0 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('manual')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'border-teal-700 text-teal-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Manual Entry Form</span>
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'import'
                  ? 'border-teal-700 text-teal-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Batch Import from File (XLSX, PDF, XML, CSV)</span>
              {parsedProcedures.length > 0 && (
                <span className="font-mono text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full font-bold">
                  {parsedProcedures.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
            className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer pb-2"
          >
            {isParsing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            <span>Upload File</span>
          </button>
        </div>

        {/* Notifications & Status Banner */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {(formError || importError) && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{formError || importError}</span>
            </div>
            <button onClick={() => { setFormError(null); setImportError(null); }} className="text-rose-700 hover:text-rose-900 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: MANUAL ENTRY FORM */}
        {activeTab === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
            {/* Quick File Auto-fill Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-800 block text-xs">
                  Quick Auto-Fill or Batch Import
                </span>
                <span className="text-[11px] text-slate-500">
                  Upload an XLSX, PDF, XML, or CSV file to auto-populate these fields or batch-import.
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
              >
                {isParsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>Choose XLSX / PDF / XML / CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Specialty Code & Name
                </label>
                <select
                  value={formData.specialty_code}
                  onChange={(e) => handleSpecialtyChange(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  {existingSpecialties.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Procedure Code (e.g. BM009A)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GS010A"
                  value={formData.procedure_code}
                  onChange={(e) => setFormData({ ...formData, procedure_code: e.target.value.toUpperCase() })}
                  className="w-full font-mono py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Package Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Laparoscopic Appendectomy"
                value={formData.package_name}
                onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Clinical Criteria / Procedure Details
              </label>
              <textarea
                rows={3}
                required
                placeholder="Clinical indication, surgical technique, and eligibility criteria..."
                value={formData.procedure_name}
                onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tier 3 Tariff (₹ or daily rate)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 25000"
                  value={formData.package_amount_tier3}
                  onChange={(e) => setFormData({ ...formData, package_amount_tier3: e.target.value })}
                  className="w-full font-mono py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Length of Stay (Days)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3 or NA"
                  value={formData.los}
                  onChange={(e) => setFormData({ ...formData, los: e.target.value })}
                  className="w-full font-mono py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Implant Mapped (or NA)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mesh - 5000 or NA"
                  value={formData.implant_mapped}
                  onChange={(e) => setFormData({ ...formData, implant_mapped: e.target.value })}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Public Reserve</label>
                <select
                  value={formData.reservation_public_hospitals}
                  onChange={(e) => setFormData({ ...formData, reservation_public_hospitals: e.target.value })}
                  className="w-full py-1.5 px-2 border border-slate-300 rounded bg-white"
                >
                  <option value="No">No (Open)</option>
                  <option value="Yes">Yes (Public Only)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Multi-Procedure</label>
                <select
                  value={formData.multiple_procedures}
                  onChange={(e) => setFormData({ ...formData, multiple_procedures: e.target.value })}
                  className="w-full py-1.5 px-2 border border-slate-300 rounded bg-white"
                >
                  <option value="Yes">Yes (Eligible)</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Stratification</label>
                <select
                  value={formData.stratification_criteria}
                  onChange={(e) => setFormData({ ...formData, stratification_criteria: e.target.value })}
                  className="w-full py-1.5 px-2 border border-slate-300 rounded bg-white"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Auto-Approved</label>
                <select
                  value={formData.auto_approved}
                  onChange={(e) => setFormData({ ...formData, auto_approved: e.target.value })}
                  className="w-full py-1.5 px-2 border border-slate-300 rounded bg-white"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mandatory Documents for Pre-Authorization
              </label>
              <textarea
                rows={2}
                value={formData.mandatory_documents_pre_auth}
                onChange={(e) => setFormData({ ...formData, mandatory_documents_pre_auth: e.target.value })}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mandatory Documents for Claim Processing
              </label>
              <textarea
                rows={2}
                value={formData.mandatory_documents_claim_processing}
                onChange={(e) => setFormData({ ...formData, mandatory_documents_claim_processing: e.target.value })}
                className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Save to Master Catalog</span>
              </button>
            </div>
          </form>
        ) : (
          /* TAB 2: BATCH IMPORT FROM FILE (XLSX, PDF, XML, CSV) */
          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            {/* File Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-600/40 hover:border-teal-600 rounded-xl p-6 text-center bg-teal-50/20 hover:bg-teal-50/40 transition-colors cursor-pointer space-y-2"
            >
              {isParsing ? (
                <Loader2 className="w-8 h-8 text-teal-700 mx-auto animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-teal-700 mx-auto" />
              )}
              <div className="text-sm font-semibold text-slate-900">
                {isParsing ? 'Parsing procedure file...' : 'Click to select or upload an XLSX, PDF, XML, or CSV file'}
              </div>
              <p className="text-xs text-slate-500">
                Supports Excel spreadsheets (<span className="font-mono font-medium">.xlsx</span>), Clinical PDFs (<span className="font-mono font-medium">.pdf</span>), XML dockets (<span className="font-mono font-medium">.xml</span>), and CSV sheets (<span className="font-mono font-medium">.csv</span>)
              </p>
            </div>

            {/* Supported Formats Guide & Sample Download */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-3 text-slate-600">
                <span className="font-medium text-slate-800">Supported Formats:</span>
                <span className="font-mono text-emerald-800 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">XLSX</span>
                <span className="font-mono text-rose-800 font-semibold bg-rose-100 px-1.5 py-0.5 rounded">PDF</span>
                <span className="font-mono text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">XML</span>
                <span className="font-mono text-cyan-800 font-semibold bg-cyan-100 px-1.5 py-0.5 rounded">CSV</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSample('csv')}
                  className="text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Sample CSV</span>
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => handleDownloadSample('xml')}
                  className="text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Sample XML</span>
                </button>
              </div>
            </div>

            {/* Parsed Procedures Table Preview */}
            {parsedProcedures.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      Parsed Procedures for Batch Import ({parsedProcedures.length})
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {selectedIndices.length} selected
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-teal-700 hover:text-teal-900 font-medium cursor-pointer"
                  >
                    {selectedIndices.length === parsedProcedures.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIndices.length === parsedProcedures.length}
                            onChange={toggleSelectAll}
                            className="rounded border-slate-300 text-teal-700"
                          />
                        </th>
                        <th className="py-2 px-2 font-mono">Code</th>
                        <th className="py-2 px-2">Specialty</th>
                        <th className="py-2 px-2">Package Name</th>
                        <th className="py-2 px-2 text-right font-mono">Tier 3</th>
                        <th className="py-2 px-2 text-center font-mono">LOS</th>
                        <th className="py-2 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedProcedures.map((proc, index) => {
                        const isSelected = selectedIndices.includes(index);

                        return (
                          <tr
                            key={`${proc.procedure_code}-${index}`}
                            className={`hover:bg-slate-50 transition-colors ${
                              isSelected ? 'bg-teal-50/30' : ''
                            }`}
                          >
                            <td className="py-2 px-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectIndex(index)}
                                className="rounded border-slate-300 text-teal-700"
                              />
                            </td>
                            <td className="py-2 px-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                              {proc.procedure_code}
                            </td>
                            <td className="py-2 px-2 text-slate-600 truncate max-w-[120px]" title={proc.specialty}>
                              {proc.specialty}
                            </td>
                            <td className="py-2 px-2 font-medium text-slate-800 max-w-[200px] truncate" title={proc.package_name}>
                              {proc.package_name}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                              {proc.package_amount_tier3}
                            </td>
                            <td className="py-2 px-2 text-center font-mono text-slate-600 whitespace-nowrap">
                              {proc.los}d
                            </td>
                            <td className="py-2 px-2 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  populateFormWithProcedure(proc);
                                  setActiveTab('manual');
                                }}
                                className="text-teal-700 hover:text-teal-900 font-medium underline text-[11px] cursor-pointer"
                              >
                                Edit in Form
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Batch Import Action Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {parsedProcedures.length > 0
                  ? `Ready to import ${selectedIndices.length} procedure(s) into master state`
                  : 'Upload an XLSX, PDF, XML, or CSV file above to preview'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedIndices.length === 0}
                  onClick={handleExecuteBatchImport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <ListPlus className="w-4 h-4" />
                  <span>Batch Import {selectedIndices.length} Procedure(s)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
