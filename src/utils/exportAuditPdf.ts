import { jsPDF } from 'jspdf';
import { HBPProcedure, ClaimDocumentChecklist, AuditSession } from '../types/hbp';

export interface AuditProgressPdfOptions {
  patientId?: string;
  admissionDate?: string;
  auditorName?: string;
  notes?: string;
  session?: Partial<AuditSession>;
}

export interface ExportAuditPdfParams {
  procedure: HBPProcedure;
  patientId?: string;
  admissionDate?: string;
  checklist: ClaimDocumentChecklist[];
  auditorName?: string;
  notes?: string;
  session?: Partial<AuditSession>;
}

/**
 * Generates a formatted PDF document summarizing the current audit session progress
 * and the checklist of required documents for the active procedure.
 *
 * @param procedure The active HBP procedure under audit
 * @param checklist Array of required documents with current verification status
 * @param options Optional patient, session, auditor, and notes details
 * @returns jsPDF document instance ready for save, output, or preview
 */
export function generateAuditSessionProgressPdf(
  procedure: HBPProcedure,
  checklist: ClaimDocumentChecklist[],
  options: AuditProgressPdfOptions = {}
): jsPDF {
  return generateAuditPdfSummary({
    procedure,
    checklist,
    patientId: options.patientId || options.session?.patientId || `PMJAY-PAT-${procedure.procedure_code.replace(/[^a-zA-Z0-9]/g, '')}`,
    admissionDate: options.admissionDate || options.session?.date || new Date().toISOString().split('T')[0],
    auditorName: options.auditorName || options.session?.auditorName || 'Hospital Pre-Auth Officer',
    notes: options.notes || options.session?.notes || '',
    session: options.session,
  });
}

/**
 * Generates and triggers the direct download of the audit session progress PDF.
 */
export function downloadAuditSessionProgressPdf(
  procedure: HBPProcedure,
  checklist: ClaimDocumentChecklist[],
  options: AuditProgressPdfOptions = {}
): void {
  const doc = generateAuditSessionProgressPdf(procedure, checklist, options);
  const cleanCode = procedure.procedure_code.replace(/[^a-zA-Z0-9]/g, '_');
  const patId = options.patientId || `PAT-${cleanCode}`;
  const cleanPat = patId.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `HBP_Audit_Session_Progress_${cleanCode}_${cleanPat}.pdf`;
  doc.save(filename);
}

export function generateAuditPdfSummary({
  procedure,
  patientId = 'PMJAY-PAT-2026-9041',
  admissionDate = new Date().toISOString().split('T')[0],
  checklist,
  auditorName = 'Hospital Pre-Auth Officer',
  notes = '',
  session,
}: ExportAuditPdfParams): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // Colors
  const primaryColor: [number, number, number] = [15, 118, 110]; // Teal #0f766e
  const darkSlate: [number, number, number] = [15, 23, 42]; // Slate 900
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderColor: [number, number, number] = [226, 232, 240]; // Slate 200
  const emeraldColor: [number, number, number] = [5, 150, 105]; // Emerald 600
  const amberColor: [number, number, number] = [217, 119, 6]; // Amber 600
  const redColor: [number, number, number] = [225, 29, 72]; // Rose 600
  const slateColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('AYUSHMAN BHARAT PM-JAY · HEALTH BENEFIT PACKAGE (HBP)', margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(230, 250, 245);
  doc.text('Pre-Authorization & Claim Compliance Audit Dossier · Current Session Progress', margin + 4, y + 12);

  const timestampStr = new Date().toLocaleString();
  doc.setFontSize(7.5);
  doc.text(`Generated: ${timestampStr}`, pageWidth - margin - 4, y + 12, { align: 'right' });

  y += 23;

  // 2. Patient & Active Procedure Summary Card
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setTextColor(...darkSlate);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Active Code: ${procedure.procedure_code}`, margin + 4, y + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  const pkgTitle = procedure.procedure_name && procedure.procedure_name !== procedure.package_name
    ? `${procedure.package_name} - ${procedure.procedure_name}`
    : procedure.package_name;
  const safePkgTitle = pkgTitle.length > 55 ? pkgTitle.slice(0, 52) + '...' : pkgTitle;
  doc.text(`Package: ${safePkgTitle}`, margin + 55, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Column 1
  doc.text(`Patient ID: ${patientId}`, margin + 4, y + 13);
  doc.text(`Date of Audit: ${admissionDate}`, margin + 4, y + 19);
  doc.text(`Specialty: ${procedure.specialty} (${procedure.specialty_code})`, margin + 4, y + 25);

  // Column 2
  doc.text(`Tier 3 Tariff: ${procedure.package_amount_tier3}`, margin + 70, y + 13);
  doc.text(`Length of Stay: ${procedure.los === 'NA' ? 'Daycare' : `${procedure.los} Days`}`, margin + 70, y + 19);
  doc.text(`Public Reserve: ${procedure.reservation_public_hospitals === 'Yes' ? 'Reserved' : 'Open'}`, margin + 70, y + 25);

  // Column 3
  doc.text(`Multi-Procedure: ${procedure.multiple_procedures}`, margin + 130, y + 13);
  doc.text(`Stratification: ${procedure.stratification_criteria.slice(0, 20)}`, margin + 130, y + 19);
  doc.text(`Implant Mapped: ${procedure.implant_mapped === 'NA' ? 'None' : procedure.implant_mapped.slice(0, 22)}`, margin + 130, y + 25);

  y += 38;

  // 3. Current Audit Session Progress Scorecard
  const preAuthItems = checklist.filter((i) => i.stage === 'pre_auth');
  const claimItems = checklist.filter((i) => i.stage === 'claim_processing');
  const preAuthDone = preAuthItems.filter((i) => i.status === 'verified').length;
  const claimDone = claimItems.filter((i) => i.status === 'verified').length;
  const totalItems = checklist.length;
  const totalDone = checklist.filter((i) => i.status === 'verified').length;

  const calculatedOverall = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;
  const calculatedPreAuth = preAuthItems.length > 0 ? Math.round((preAuthDone / preAuthItems.length) * 100) : 100;
  const calculatedClaim = claimItems.length > 0 ? Math.round((claimDone / claimItems.length) * 100) : 100;

  const overallPercent = session?.complianceRate ?? calculatedOverall;
  const preAuthPercent = session?.preAuthComplianceRate ?? calculatedPreAuth;
  const claimPercent = session?.claimComplianceRate ?? calculatedClaim;

  const isFullyCompliant = overallPercent === 100;
  const isPartiallyCompliant = overallPercent >= 50 && overallPercent < 100;

  // Scorecard box background
  if (isFullyCompliant) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
  } else if (isPartiallyCompliant) {
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(251, 191, 36);
  } else {
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(254, 205, 211);
  }
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  if (isFullyCompliant) {
    doc.setTextColor(6, 95, 70);
  } else if (isPartiallyCompliant) {
    doc.setTextColor(146, 64, 14);
  } else {
    doc.setTextColor(159, 18, 57);
  }
  doc.text(`Overall Audit Compliance Progress: ${overallPercent}% (${totalDone}/${totalItems} Documents Verified)`, margin + 4, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Pre-Auth Verification: ${preAuthPercent}% (${preAuthDone}/${preAuthItems.length} verified)   ·   Claim Settlement Verification: ${claimPercent}% (${claimDone}/${claimItems.length} verified)`,
    margin + 4,
    y + 14
  );

  doc.setFont('helvetica', 'bold');
  const statusLabel = isFullyCompliant
    ? 'STATUS: FULLY COMPLIANT [APPROVED]'
    : isPartiallyCompliant
    ? 'STATUS: PARTIALLY COMPLIANT [ACTION REQUIRED]'
    : 'STATUS: DEFICIENT [PENDING DOCUMENTS]';

  doc.text(statusLabel, pageWidth - margin - 4, y + 10.5, { align: 'right' });

  y += 25;

  // 4. Checklist Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkSlate);
  doc.text('CHECKLIST OF REQUIRED DOCUMENTS (ACTIVE PROCEDURE)', margin, y);
  y += 4;

  const renderTableHeader = (currentY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(...borderColor);
    doc.rect(margin, currentY, contentWidth, 7, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('#', margin + 2, currentY + 4.8);
    doc.text('Stage', margin + 8, currentY + 4.8);
    doc.text('Mandatory Required Document', margin + 34, currentY + 4.8);
    doc.text('Attachment Status', margin + 118, currentY + 4.8);
    doc.text('File Name / Auditor Verification Notes', margin + 148, currentY + 4.8);
    return currentY + 7;
  };

  y = renderTableHeader(y);

  // 5. Checklist Rows
  checklist.forEach((item, index) => {
    // Check if near bottom of page
    if (y > pageHeight - 32) {
      doc.addPage();
      y = 16;
      y = renderTableHeader(y);
    }

    const isVerified = item.status === 'verified';
    const isWaived = item.status === 'waived';
    const isRejected = item.status === 'rejected';
    const stageLabel = item.stage === 'pre_auth' ? 'Pre-Auth' : 'Claim';

    doc.setFillColor(index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.setDrawColor(...borderColor);
    doc.rect(margin, y, contentWidth, 9.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkSlate);
    doc.text(`${index + 1}`, margin + 2, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.stage === 'pre_auth' ? 15 : 217, item.stage === 'pre_auth' ? 118 : 119, item.stage === 'pre_auth' ? 110 : 6);
    doc.text(stageLabel, margin + 8, y + 6);

    // Document Name (truncated safely)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkSlate);
    const docName = item.name.length > 52 ? item.name.slice(0, 50) + '...' : item.name;
    doc.text(docName, margin + 34, y + 6);

    // Status Pill
    if (isVerified) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...emeraldColor);
      doc.text('ATTACHED [✓]', margin + 118, y + 6);
    } else if (isRejected) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...redColor);
      doc.text('REJECTED [✗]', margin + 118, y + 6);
    } else if (isWaived) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...slateColor);
      doc.text('WAIVED [-]', margin + 118, y + 6);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...amberColor);
      doc.text('MISSING [⌛]', margin + 118, y + 6);
    }

    // Notes or attached file name
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const noteText =
      item.attachedFile?.name ||
      item.fileMockName ||
      item.notes ||
      (isVerified ? 'Verified & attached' : 'Pending upload/attachment');
    const safeNote = noteText.length > 32 ? noteText.slice(0, 30) + '...' : safeSanitize(noteText);
    doc.text(safeNote, margin + 148, y + 6);

    y += 9.5;
  });

  y += 5;

  // 6. Auditor Notes & Progress Summary Block (if notes exist)
  const fullNotes = notes || (session?.notes ? session.notes : '');
  if (fullNotes && fullNotes.trim().length > 0) {
    if (y > pageHeight - 48) {
      doc.addPage();
      y = 16;
    }

    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkSlate);
    doc.text('AUDITOR OBSERVATIONS & PROGRESS FINDINGS', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(safeSanitize(fullNotes), contentWidth - 8);
    doc.text(splitNotes.slice(0, 2), margin + 4, y + 10.5);

    y += 20;
  }

  // Check if sign-off fits on this page, else new page
  if (y > pageHeight - 40) {
    doc.addPage();
    y = 16;
  }

  // 7. Certification & Sign-off Block
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkSlate);
  doc.text('HOSPITAL & CLINICAL AUDIT CERTIFICATION', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'I hereby certify that the verified documents listed above have been audited against National Health Authority (NHA) PM-JAY guidelines.',
    margin + 4,
    y + 9.5
  );
  doc.text(
    'Mandatory pre-authorization requisites and claim processing proofs are maintained in hospital physical and electronic records.',
    margin + 4,
    y + 13.5
  );

  // Signatures
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkSlate);
  doc.text(`Auditor: ${auditorName}`, margin + 4, y + 21);
  doc.text('Signature: __________________________', margin + 65, y + 21);
  doc.text('Hospital Seal / Stamp: _______________', margin + 130, y + 21);

  // Page Numbers Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `AB-PMJAY HBP Claim Dossier · ${procedure.procedure_code} · Page ${i} of ${totalPages}`,
      margin,
      pageHeight - 6
    );
    doc.text('Confidential Medical Quality Audit Record', pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return doc;
}

function safeSanitize(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, '');
}

export function downloadAuditPdf(params: ExportAuditPdfParams): void {
  const doc = generateAuditPdfSummary(params);
  const cleanCode = params.procedure.procedure_code.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPat = (params.patientId || 'patient').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `HBP_Audit_Summary_${cleanCode}_${cleanPat}.pdf`;
  doc.save(filename);
}

export function downloadAuditTrendReportPdf(sessions: import('../types/hbp').AuditSession[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  const primaryColor: [number, number, number] = [15, 118, 110];
  const darkSlate: [number, number, number] = [15, 23, 42];
  const lightBg: [number, number, number] = [248, 250, 252];
  const borderColor: [number, number, number] = [226, 232, 240];

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('AB-PMJAY CLINICAL AUDIT COMPLIANCE TREND REPORT', margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(230, 250, 245);
  doc.text('Executive Longitudinal Quality & Document Compliance Trajectory', margin + 4, y + 12);

  const timestampStr = new Date().toLocaleString();
  doc.setFontSize(7.5);
  doc.text(`Generated: ${timestampStr}`, pageWidth - margin - 4, y + 12, { align: 'right' });

  y += 24;

  // 2. Summary Metrics Calculation
  const totalSessions = sessions.length;
  const avgCompliance = totalSessions > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.complianceRate, 0) / totalSessions) : 0;
  const compliantCount = sessions.filter(s => s.complianceRate === 100).length;
  const partiallyCount = sessions.filter(s => s.complianceRate >= 50 && s.complianceRate < 100).length;
  const deficientCount = sessions.filter(s => s.complianceRate < 50).length;

  // KPI Ribbon
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL SESSIONS', margin + 4, y + 6);
  doc.text('AVG COMPLIANCE', margin + 45, y + 6);
  doc.text('FULLY COMPLIANT', margin + 90, y + 6);
  doc.text('PARTIAL / DEFICIENT', margin + 135, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkSlate);
  doc.text(`${totalSessions}`, margin + 4, y + 14);

  doc.setTextColor(...primaryColor);
  doc.text(`${avgCompliance}%`, margin + 45, y + 14);

  doc.setTextColor(5, 150, 105);
  doc.text(`${compliantCount}`, margin + 90, y + 14);

  doc.setTextColor(217, 119, 6);
  doc.text(`${partiallyCount + deficientCount}`, margin + 135, y + 14);

  y += 28;

  // 3. Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...darkSlate);
  doc.text('HISTORICAL AUDIT SESSIONS LOG', margin, y);
  y += 4;

  const renderHistoryHeader = (currY: number) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(...borderColor);
    doc.rect(margin, currY, contentWidth, 7, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Date', margin + 2, currY + 4.8);
    doc.text('Patient ID', margin + 22, currY + 4.8);
    doc.text('Code', margin + 60, currY + 4.8);
    doc.text('Package Name', margin + 78, currY + 4.8);
    doc.text('Docs', margin + 138, currY + 4.8);
    doc.text('Compliance', margin + 155, currY + 4.8);
    return currY + 7;
  };

  y = renderHistoryHeader(y);

  // 4. Session Rows
  sessions.forEach((s, idx) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 16;
      y = renderHistoryHeader(y);
    }

    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(...borderColor);
    doc.rect(margin, y, contentWidth, 8, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkSlate);
    doc.text(s.date, margin + 2, y + 5.2);

    doc.text(s.patientId, margin + 22, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.text(s.procedureCode, margin + 60, y + 5.2);

    doc.setFont('helvetica', 'normal');
    const safePkg = s.packageName.length > 32 ? s.packageName.slice(0, 30) + '...' : s.packageName;
    doc.text(safePkg, margin + 78, y + 5.2);

    doc.text(`${s.verifiedDocuments}/${s.totalDocuments}`, margin + 138, y + 5.2);

    doc.setFont('helvetica', 'bold');
    if (s.complianceRate === 100) {
      doc.setTextColor(5, 150, 105);
    } else if (s.complianceRate >= 50) {
      doc.setTextColor(...primaryColor);
    } else {
      doc.setTextColor(217, 119, 6);
    }
    doc.text(`${s.complianceRate}%`, margin + 155, y + 5.2);

    y += 8;
  });

  // Footer page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`AB-PMJAY Audit Compliance Trajectory · Page ${i} of ${totalPages}`, margin, pageHeight - 6);
    doc.text('Confidential Medical Quality Assurance Record', pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  const filename = `HBP_Audit_Compliance_Trend_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
