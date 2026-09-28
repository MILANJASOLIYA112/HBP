import {
  HBPProcedure,
  ClaimDocumentChecklist,
  HospitalTier,
  HospitalAccreditation,
  CalculatedTariff,
} from '../types/hbp';

export type AuditTemplateMode = 'full_summary' | 'deficiency_alert' | 'preauth_clearance' | 'executive';

export interface WhatsAppShareOptions {
  patientId?: string;
  admissionDate?: string;
  notes?: string;
  auditorName?: string;
  phoneNumber?: string; // optional recipient number, e.g. "919876543210"
  hospitalName?: string;
  departmentOrWard?: string;
  treatingDoctor?: string;
  templateMode?: AuditTemplateMode;
}

/**
 * Generates a structured WhatsApp text message template summarizing current audit status
 * and the mandatory document checklist for the active procedure.
 */
export function generateStructuredAuditWhatsAppTemplate(
  procedure: HBPProcedure,
  checklist: ClaimDocumentChecklist[],
  options: WhatsAppShareOptions = {}
): string {
  const mode = options.templateMode || 'full_summary';
  const patientId = options.patientId || `PAT-${procedure.procedure_code}`;
  const admissionDate = options.admissionDate || new Date().toISOString().split('T')[0];
  const auditorName = options.auditorName || 'Clinical Claims Auditor';
  const hospitalName = options.hospitalName || 'Empanelled Hospital / Facility';
  const doctor = options.treatingDoctor ? ` | *Treating Doctor:* ${options.treatingDoctor}` : '';
  const ward = options.departmentOrWard ? ` | *Ward/Bed:* ${options.departmentOrWard}` : '';

  // Calculate metrics
  const totalCount = checklist.length;
  const verifiedCount = checklist.filter((i) => i.status === 'verified').length;
  const overallPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const preAuthList = checklist.filter((i) => i.stage === 'pre_auth');
  const claimList = checklist.filter((i) => i.stage === 'claim_processing');
  const preAuthDone = preAuthList.filter((i) => i.status === 'verified').length;
  const claimDone = claimList.filter((i) => i.status === 'verified').length;
  const preAuthPercent = preAuthList.length > 0 ? Math.round((preAuthDone / preAuthList.length) * 100) : 100;
  const claimPercent = claimList.length > 0 ? Math.round((claimDone / claimList.length) * 100) : 100;

  const missingPreAuth = preAuthList.filter((i) => i.status !== 'verified');
  const missingClaim = claimList.filter((i) => i.status !== 'verified');

  // TEMPLATE 1: DEFICIENCY & ACTION REQUIRED ALERT
  if (mode === 'deficiency_alert') {
    const lines: string[] = [
      `🚨 *URGENT: PM-JAY MANDATORY DOCUMENT DEFICIENCY NOTICE*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏥 *Hospital:* ${hospitalName}${ward}`,
      `👤 *Patient ID:* ${patientId}${doctor}`,
      `📋 *Package:* [${procedure.procedure_code}] ${procedure.package_name}`,
      `📅 *Date:* ${admissionDate}`,
      `👨‍⚕️ *Auditor:* ${auditorName}`,
      ``,
      `⚠️ *CURRENT DEFICIENT STATUS:*`,
      `• Total Compliance: *${overallPercent}%* (${verifiedCount}/${totalCount} documents attached)`,
      `• Missing Mandatory Requirements: *${missingPreAuth.length + missingClaim.length} pending*`,
      ``,
      `❗ *MISSING MANDATORY DOCUMENTS REQUIRED IMMEDIATELY:*`,
    ];

    if (missingPreAuth.length > 0) {
      lines.push(`*-- Pre-Authorization Requirements (${missingPreAuth.length} missing) --*`);
      missingPreAuth.forEach((item, idx) => {
        lines.push(`[✗] ${idx + 1}. *${item.name}* (REQUIRED before surgery)`);
      });
      lines.push(``);
    }

    if (missingClaim.length > 0) {
      lines.push(`*-- Claim Processing Requirements (${missingClaim.length} missing) --*`);
      missingClaim.forEach((item, idx) => {
        lines.push(`[✗] ${idx + 1}. *${item.name}* (REQUIRED for discharge settlement)`);
      });
      lines.push(``);
    }

    lines.push(
      `📌 *Action Required:* Please upload and attach the above mandatory documents to avoid pre-auth rejection or query by the State Health Agency (SHA).`,
      ``,
      options.notes ? `📝 *Auditor Remarks:* ${options.notes}\n` : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_Issued by Hospital Pre-Auth & Quality Assurance Desk_`
    );

    return lines.filter(Boolean).join('\n');
  }

  // TEMPLATE 2: PRE-AUTH CLEARANCE CONFIRMATION
  if (mode === 'preauth_clearance') {
    const isCleared = preAuthPercent === 100;
    const lines: string[] = [
      `✅ *PM-JAY PRE-AUTHORIZATION COMPLIANCE CLEARANCE*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏥 *Hospital:* ${hospitalName}${ward}`,
      `👤 *Patient ID:* ${patientId}${doctor}`,
      `📋 *Package:* [${procedure.procedure_code}] ${procedure.package_name}`,
      `💰 *Approved Base Tariff:* ₹${procedure.package_amount_tier3} | *LOS:* ${procedure.los}d`,
      `📅 *Date:* ${admissionDate}`,
      ``,
      `📊 *PRE-AUTH AUDIT OUTCOME:*`,
      `• *Status:* ${isCleared ? '🟢 PRE-AUTH 100% CLEARED & AUDITED' : '🟡 CONDITIONAL / ACTION PENDING'}`,
      `• *Pre-Auth Documents:* *${preAuthDone}/${preAuthList.length} Verified (${preAuthPercent}%)*`,
      ``,
      `📑 *VERIFIED PRE-AUTH DOCUMENTS:*`,
    ];

    preAuthList.forEach((item, idx) => {
      const isOk = item.status === 'verified';
      lines.push(`${isOk ? '[✓]' : '[✗]'} ${idx + 1}. ${item.name} - ${isOk ? 'ATTACHED' : 'PENDING'}`);
    });

    lines.push(
      ``,
      `🏥 *Next Step:* ${isCleared ? 'Patient may proceed with scheduled procedure.' : 'Pending documents must be submitted before OT slot confirmation.'}`,
      ``,
      options.notes ? `📝 *Remarks:* ${options.notes}\n` : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_Audited by: ${auditorName}_`
    );

    return lines.filter(Boolean).join('\n');
  }

  // TEMPLATE 3: EXECUTIVE SUMMARY
  if (mode === 'executive') {
    const lines: string[] = [
      `📊 *AB-PMJAY AUDIT EXECUTIVE BRIEF*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `• *Patient:* ${patientId} | *Date:* ${admissionDate}`,
      `• *Procedure:* [${procedure.procedure_code}] ${procedure.package_name.slice(0, 36)}`,
      `• *Specialty:* ${procedure.specialty} | *Tariff:* ₹${procedure.package_amount_tier3}`,
      `• *Compliance:* *${overallPercent}%* (${verifiedCount}/${totalCount} docs verified)`,
      `• *Pre-Auth:* ${preAuthPercent}% (${preAuthDone}/${preAuthList.length}) | *Claim:* ${claimPercent}% (${claimDone}/${claimList.length})`,
      `• *Verdict:* ${overallPercent === 100 ? 'APPROVED' : overallPercent >= 50 ? 'ACTION REQUIRED' : 'DEFICIENT'}`,
      options.notes ? `• *Notes:* ${options.notes}` : '',
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_AB-PMJAY Audit Engine · ${auditorName}_`
    ];
    return lines.filter(Boolean).join('\n');
  }

  // TEMPLATE 4 (DEFAULT): FULL COMPREHENSIVE AUDIT STATUS & MANDATORY DOCUMENT CHECKLIST
  const statusLabel =
    overallPercent === 100
      ? '🟢 FULLY COMPLIANT [APPROVED FOR SETTLEMENT]'
      : overallPercent >= 50
      ? '🟡 PARTIALLY COMPLIANT [ACTION REQUIRED]'
      : '🔴 DEFICIENT [MANDATORY DOCUMENTS MISSING]';

  const lines: string[] = [
    `🏥 *AB-PMJAY CLINICAL AUDIT SESSION SUMMARY*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📌 *AUDIT SESSION METADATA*`,
    `• *Hospital / Facility:* ${hospitalName}${ward}`,
    `• *Patient ID:* ${patientId}${doctor}`,
    `• *Date of Audit:* ${admissionDate}`,
    `• *Lead Auditor:* ${auditorName}`,
    `• *Package Code:* ${procedure.procedure_code}`,
    `• *Package Name:* ${procedure.package_name}`,
    `• *Specialty:* ${procedure.specialty} (${procedure.specialty_code})`,
    `• *Base Tariff (Tier 3):* ₹${procedure.package_amount_tier3.replace(/[^0-9,]/g, '') || procedure.package_amount_tier3} | *LOS:* ${procedure.los === 'NA' ? 'Daycare' : `${procedure.los} Days`}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📊 *CURRENT AUDIT STATUS & COMPLIANCE SCORECARD*`,
    `• *Overall Audit Readiness:* *${overallPercent}%* (${verifiedCount}/${totalCount} Documents Verified)`,
    `• *Clearance Status:* ${statusLabel}`,
    `• *Pre-Auth Compliance:* *${preAuthPercent}%* (${preAuthDone}/${preAuthList.length} Verified)`,
    `• *Claim Settlement Compliance:* *${claimPercent}%* (${claimDone}/${claimList.length} Verified)`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📑 *MANDATORY DOCUMENT CHECKLIST*`,
  ];

  if (preAuthList.length > 0) {
    lines.push(``, `*1. PRE-AUTHORIZATION STAGE (${preAuthDone}/${preAuthList.length} Verified):*`);
    preAuthList.forEach((item, index) => {
      const isOk = item.status === 'verified';
      const badge = isOk ? '[✓]' : '[✗]';
      const fileDetail = item.attachedFile?.name ? ` (📎 ${item.attachedFile.name})` : item.fileMockName ? ` (📎 ${item.fileMockName})` : '';
      lines.push(`${badge} ${index + 1}. *${item.name}* - ${isOk ? 'ATTACHED' : 'MISSING / PENDING'}${fileDetail}`);
    });
  }

  if (claimList.length > 0) {
    lines.push(``, `*2. CLAIM PROCESSING & DISCHARGE STAGE (${claimDone}/${claimList.length} Verified):*`);
    claimList.forEach((item, index) => {
      const isOk = item.status === 'verified';
      const badge = isOk ? '[✓]' : '[✗]';
      const fileDetail = item.attachedFile?.name ? ` (📎 ${item.attachedFile.name})` : item.fileMockName ? ` (📎 ${item.fileMockName})` : '';
      lines.push(`${badge} ${index + 1}. *${item.name}* - ${isOk ? 'ATTACHED' : 'MISSING / PENDING'}${fileDetail}`);
    });
  }

  // Pending Actions section
  lines.push(``, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, `⚠️ *PENDING ACTION ITEMS:*`);
  if (missingPreAuth.length === 0 && missingClaim.length === 0) {
    lines.push(`✅ *Zero Deficiencies.* All mandatory pre-auth and claim documents verified.`);
  } else {
    if (missingPreAuth.length > 0) {
      lines.push(`• *Pre-Auth:* ${missingPreAuth.length} document(s) pending before surgical authorization.`);
    }
    if (missingClaim.length > 0) {
      lines.push(`• *Claim Discharge:* ${missingClaim.length} document(s) pending before final TMS submission.`);
    }
  }

  if (options.notes && options.notes.trim().length > 0) {
    lines.push(
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📝 *AUDITOR CLINICAL OBSERVATIONS:*`,
      `${options.notes.trim()}`
    );
  }

  lines.push(
    ``,
    `⚖️ *HOSPITAL AUDIT AFFIRMATION:* Certified in strict compliance with National Health Authority (NHA) AB-PMJAY HBP 2.2 Guidelines.`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `_Generated by PM-JAY Clinical Audit & Tariff System_`
  );

  return lines.join('\n');
}

/**
 * Direct file download helper that exports the structured WhatsApp text template as a .txt file.
 */
export function downloadStructuredAuditTemplateTxt(
  procedure: HBPProcedure,
  checklist: ClaimDocumentChecklist[],
  options: WhatsAppShareOptions = {}
): void {
  const content = generateStructuredAuditWhatsAppTemplate(procedure, checklist, options);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanCode = procedure.procedure_code.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanPat = (options.patientId || 'patient').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `WhatsApp_Audit_Template_${cleanCode}_${cleanPat}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Formats full procedure package details into WhatsApp Markdown text (*bold*, bullet points, emojis).
 */
export function formatPackageWhatsAppText(procedure: HBPProcedure): string {
  const isReserved = procedure.reservation_public_hospitals === 'Yes';
  const hasStrat = procedure.stratification_criteria === 'Yes';
  const hasImplant = procedure.implant_mapped && procedure.implant_mapped !== 'NA';

  const lines: string[] = [
    `🏥 *AYUSHMAN BHARAT PM-JAY · HEALTH BENEFIT PACKAGE*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Package Name:* ${procedure.package_name}`,
    `🆔 *Procedure Code:* ${procedure.procedure_code}`,
    `🩺 *Specialty:* ${procedure.specialty} (${procedure.specialty_code})`,
    `💰 *Tier 3 Base Tariff:* ₹${procedure.package_amount_tier3.replace(/[^0-9,]/g, '') || procedure.package_amount_tier3}`,
    `⏱️ *Length of Stay (LOS):* ${procedure.los === 'NA' ? 'Daycare / NA' : `${procedure.los} Days`}`,
    `🏥 *Public Hospital Reserve:* ${isReserved ? 'Reserved for Public Hospitals' : 'Open (Public & Private Empanelled)'}`,
    `📑 *Multiple Procedures:* ${procedure.multiple_procedures === 'Yes' ? 'Allowed with standard percentage discounting' : 'No'}`,
    ``,
    `🔬 *Clinical Criteria & Procedure Description:*`,
    `${procedure.procedure_name.trim()}`,
  ];

  if (hasStrat) {
    lines.push(
      ``,
      `⚠️ *Stratification Rules:*`,
      `${procedure.stratification_remarks || 'Applicable as per NHA guidelines'}`
    );
  }

  if (hasImplant) {
    lines.push(
      ``,
      `🔩 *Mapped Implant Tariff:*`,
      `${procedure.implant_mapped} (Claimed as separate line item)`
    );
  }

  lines.push(
    ``,
    `📄 *MANDATORY PRE-AUTHORIZATION DOCUMENTS:*`,
    `${procedure.mandatory_documents_pre_auth || 'None explicitly specified.'}`,
    ``,
    `🧾 *MANDATORY CLAIM SETTLEMENT DOCUMENTS:*`,
    `${procedure.mandatory_documents_claim_processing || 'None explicitly specified.'}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `_Source: National Health Authority (NHA) AB-PMJAY HBP 2.2 Specification_`
  );

  return lines.join('\n');
}

/**
 * Formats full package details AND current audit session progress summary into WhatsApp Markdown text.
 */
export function formatPackageAndAuditSummaryWhatsAppText(
  procedure: HBPProcedure,
  checklist: ClaimDocumentChecklist[],
  options: WhatsAppShareOptions = {}
): string {
  const patientId = options.patientId || `PAT-${procedure.procedure_code}`;
  const admissionDate = options.admissionDate || new Date().toISOString().split('T')[0];
  const auditorName = options.auditorName || 'Clinical Claims Auditor';

  // Compliance metrics
  const totalCount = checklist.length;
  const verifiedCount = checklist.filter((i) => i.status === 'verified').length;
  const overallPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const preAuthList = checklist.filter((i) => i.stage === 'pre_auth');
  const claimList = checklist.filter((i) => i.stage === 'claim_processing');
  const preAuthDone = preAuthList.filter((i) => i.status === 'verified').length;
  const claimDone = claimList.filter((i) => i.status === 'verified').length;
  const preAuthPercent = preAuthList.length > 0 ? Math.round((preAuthDone / preAuthList.length) * 100) : 100;
  const claimPercent = claimList.length > 0 ? Math.round((claimDone / claimList.length) * 100) : 100;

  const statusLabel =
    overallPercent === 100
      ? '🟢 FULLY COMPLIANT [APPROVED]'
      : overallPercent >= 50
      ? '🟡 PARTIAL COMPLIANCE [ACTION REQUIRED]'
      : '🔴 DEFICIENT [MANDATORY DOCUMENTS MISSING]';

  const lines: string[] = [
    `🏥 *AB-PMJAY CLINICAL AUDIT & PACKAGE COMPLIANCE SUMMARY*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Package:* ${procedure.package_name}`,
    `🆔 *Procedure Code:* ${procedure.procedure_code} | *Specialty:* ${procedure.specialty}`,
    `💰 *Tariff:* ₹${procedure.package_amount_tier3.replace(/[^0-9,]/g, '') || procedure.package_amount_tier3} | *LOS:* ${procedure.los === 'NA' ? 'Daycare' : `${procedure.los} Days`}`,
    `👤 *Patient ID:* ${patientId}`,
    `📅 *Audit Date:* ${admissionDate}`,
    `👨‍⚕️ *Auditor:* ${auditorName}`,
    ``,
    `📊 *AUDIT SESSION COMPLIANCE SCORECARD:*`,
    `• *Overall Readiness:* *${overallPercent}%* (${verifiedCount}/${totalCount} documents attached)`,
    `• *Compliance Status:* ${statusLabel}`,
    `• *Pre-Auth Readiness:* *${preAuthPercent}%* (${preAuthDone}/${preAuthList.length} verified)`,
    `• *Claim Settlement Readiness:* *${claimPercent}%* (${claimDone}/${claimList.length} verified)`,
    ``,
    `📑 *CHECKLIST OF REQUIRED DOCUMENTS:*`,
  ];

  // Pre-Auth items
  if (preAuthList.length > 0) {
    lines.push(`*-- [1] Pre-Authorization Stage (${preAuthDone}/${preAuthList.length}) --*`);
    preAuthList.forEach((item, index) => {
      const isOk = item.status === 'verified';
      const icon = isOk ? '✅' : '⏳';
      const fileDetail = item.attachedFile?.name ? ` (📎 ${item.attachedFile.name})` : item.fileMockName ? ` (📎 ${item.fileMockName})` : '';
      lines.push(`${icon} ${index + 1}. *${item.name}* - ${isOk ? 'ATTACHED' : 'PENDING'}${fileDetail}`);
    });
    lines.push(``);
  }

  // Claim items
  if (claimList.length > 0) {
    lines.push(`*-- [2] Claim Processing & Discharge Stage (${claimDone}/${claimList.length}) --*`);
    claimList.forEach((item, index) => {
      const isOk = item.status === 'verified';
      const icon = isOk ? '✅' : '⏳';
      const fileDetail = item.attachedFile?.name ? ` (📎 ${item.attachedFile.name})` : item.fileMockName ? ` (📎 ${item.fileMockName})` : '';
      lines.push(`${icon} ${index + 1}. *${item.name}* - ${isOk ? 'ATTACHED' : 'PENDING'}${fileDetail}`);
    });
    lines.push(``);
  }

  // Observations / Notes
  if (options.notes && options.notes.trim().length > 0) {
    lines.push(
      `📝 *Auditor Observations & Notes:*`,
      `${options.notes.trim()}`,
      ``
    );
  }

  lines.push(
    `⚖️ *Hospital Affirmation:* Certified against NHA PM-JAY Guidelines for Pre-Auth & TMS Claim Settlement.`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `_Generated via PM-JAY Clinical Audit & Tariff System_`
  );

  return lines.join('\n');
}

/**
 * Formats multi-procedure admission settlement calculations into WhatsApp Markdown text.
 */
export function formatTariffSummaryWhatsAppText(
  items: { procedure: HBPProcedure; bedDays: number; tariff?: CalculatedTariff; calculation?: CalculatedTariff }[],
  tierLabel: string,
  accreditationLabel: string,
  grandTotal: number,
  totalProcedureCost: number,
  totalImplantCost: number
): string {
  const lines: string[] = [
    `🏥 *AB-PMJAY ADMISSION TARIFF & SETTLEMENT SUMMARY*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `💰 *Total Estimated Claim:* *₹${grandTotal.toLocaleString('en-IN')}*`,
    `🏢 *Hospital Tier:* ${tierLabel}`,
    `🎖️ *NABH Accreditation:* ${accreditationLabel}`,
    `💵 *Procedures Total:* ₹${totalProcedureCost.toLocaleString('en-IN')}`,
    `🔩 *Implants Total:* ₹${totalImplantCost.toLocaleString('en-IN')}`,
    ``,
    `📋 *PROCEDURE BREAKDOWN IN CLAIM (${items.length}):*`,
  ];

  items.forEach((item, idx) => {
    const calc = item.tariff || item.calculation;
    const seq = idx === 0 ? 'Primary (100%)' : idx === 1 ? 'Secondary (50%)' : 'Tertiary (25%)';
    lines.push(
      `*#${idx + 1} [${item.procedure.procedure_code}] ${item.procedure.package_name}*`,
      `  • Multi-Proc Discount: ${seq}`,
      `  • Procedure Cost: ₹${calc ? calc.procedureCost.toLocaleString('en-IN') : '0'}`
    );
    if (calc && calc.implantCost > 0) {
      lines.push(`  • Implant Cost: +₹${calc.implantCost.toLocaleString('en-IN')}`);
    }
    lines.push(`  • Item Total: *₹${calc ? calc.totalCost.toLocaleString('en-IN') : '0'}*`, ``);
  });

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚖️ *Calculated per National Health Authority (NHA) Multi-Procedure Guidelines*`,
    `_Ready for TMS Hospital Portal Claim Submission_`
  );

  return lines.join('\n');
}

/**
 * Returns the WhatsApp Web / App share URL for a given text and optional phone number.
 */
export function getWhatsAppShareUrl(text: string, phoneNumber?: string): string {
  const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
  const encodedText = encodeURIComponent(text);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Triggers sharing to WhatsApp directly or opens the share link.
 */
export function openWhatsAppShare(text: string, phoneNumber?: string): void {
  const url = getWhatsAppShareUrl(text, phoneNumber);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    // If popup was blocked, fallback to creating anchor and triggering click
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}
