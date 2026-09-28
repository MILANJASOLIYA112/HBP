import { AuditSession } from '../types/hbp';

export const INITIAL_AUDIT_SESSIONS: AuditSession[] = [
  {
    id: 'aud-101',
    timestamp: '2026-09-15T10:15:00.000Z',
    date: 'Sep 15',
    patientId: 'PMJAY-PAT-2026-8011',
    procedureCode: 'GS001A',
    packageName: 'Laparoscopic Cholecystectomy',
    specialty: 'General Surgery',
    totalDocuments: 5,
    verifiedDocuments: 5,
    complianceRate: 100,
    preAuthComplianceRate: 100,
    claimComplianceRate: 100,
    status: 'compliant',
    auditorName: 'Dr. S. Sharma',
    notes: 'All pre-op USG and operative histology verified.'
  },
  {
    id: 'aud-102',
    timestamp: '2026-09-17T14:30:00.000Z',
    date: 'Sep 17',
    patientId: 'PMJAY-PAT-2026-8024',
    procedureCode: 'BM001A',
    packageName: 'Thermal burns',
    specialty: 'Burns Management',
    totalDocuments: 4,
    verifiedDocuments: 3,
    complianceRate: 75,
    preAuthComplianceRate: 67,
    claimComplianceRate: 100,
    status: 'partially_compliant',
    auditorName: 'Dr. V. Mehta',
    notes: 'Rule of 9 photograph provided, MLC number verified.'
  },
  {
    id: 'aud-103',
    timestamp: '2026-09-19T09:45:00.000Z',
    date: 'Sep 19',
    patientId: 'PMJAY-PAT-2026-8042',
    procedureCode: 'SB038B',
    packageName: 'Total Hip Replacement',
    specialty: 'Orthopedics',
    totalDocuments: 4,
    verifiedDocuments: 4,
    complianceRate: 100,
    preAuthComplianceRate: 100,
    claimComplianceRate: 100,
    status: 'compliant',
    auditorName: 'Dr. A. Verma',
    notes: 'Cementless implant barcode and post-op X-ray attached.'
  },
  {
    id: 'aud-104',
    timestamp: '2026-09-20T16:20:00.000Z',
    date: 'Sep 20',
    patientId: 'PMJAY-PAT-2026-8055',
    procedureCode: 'CT001A',
    packageName: 'Coronary Artery Bypass Grafting',
    specialty: 'Cardio-Thoracic Surgery',
    totalDocuments: 6,
    verifiedDocuments: 5,
    complianceRate: 83,
    preAuthComplianceRate: 100,
    claimComplianceRate: 67,
    status: 'partially_compliant',
    auditorName: 'Dr. K. Patel',
    notes: 'Post-op ICU chart verified, repeat CXR pending.'
  },
  {
    id: 'aud-105',
    timestamp: '2026-09-22T11:00:00.000Z',
    date: 'Sep 22',
    patientId: 'PMJAY-PAT-2026-8069',
    procedureCode: 'MC001A',
    packageName: 'PTCA with Stenting',
    specialty: 'Cardiology',
    totalDocuments: 4,
    verifiedDocuments: 4,
    complianceRate: 100,
    preAuthComplianceRate: 100,
    claimComplianceRate: 100,
    status: 'compliant',
    auditorName: 'Dr. R. Gupta',
    notes: 'DES stent barcode verified with post-stent angiogram film.'
  },
  {
    id: 'aud-106',
    timestamp: '2026-09-24T13:10:00.000Z',
    date: 'Sep 24',
    patientId: 'PMJAY-PAT-2026-8081',
    procedureCode: 'NS001A',
    packageName: 'Craniotomy for Hematoma Evacuation',
    specialty: 'Neurosurgery',
    totalDocuments: 5,
    verifiedDocuments: 4,
    complianceRate: 80,
    preAuthComplianceRate: 100,
    claimComplianceRate: 67,
    status: 'partially_compliant',
    auditorName: 'Dr. V. Mehta',
    notes: 'Emergency CT brain verified, post-op CT verified.'
  },
  {
    id: 'aud-107',
    timestamp: '2026-09-25T15:40:00.000Z',
    date: 'Sep 25',
    patientId: 'PMJAY-PAT-2026-8094',
    procedureCode: 'MO001F',
    packageName: 'CT for CA Breast',
    specialty: 'Medical Oncology',
    totalDocuments: 8,
    verifiedDocuments: 8,
    complianceRate: 100,
    preAuthComplianceRate: 100,
    claimComplianceRate: 100,
    status: 'compliant',
    auditorName: 'Dr. S. Sharma',
    notes: 'Her-2 neu FISH 3+ and Trastuzumab drug barcode verified.'
  },
  {
    id: 'aud-108',
    timestamp: '2026-09-26T17:15:00.000Z',
    date: 'Sep 26',
    patientId: 'PMJAY-PAT-2026-8108',
    procedureCode: 'SO010A',
    packageName: 'Hysterectomy',
    specialty: 'OBG & Gynec',
    totalDocuments: 3,
    verifiedDocuments: 2,
    complianceRate: 67,
    preAuthComplianceRate: 100,
    claimComplianceRate: 50,
    status: 'partially_compliant',
    auditorName: 'Dr. A. Verma',
    notes: 'USG pelvis attached, histopathology specimen submitted.'
  },
  {
    id: 'aud-109',
    timestamp: '2026-09-27T10:30:00.000Z',
    date: 'Sep 27',
    patientId: 'PMJAY-PAT-2026-8119',
    procedureCode: 'OP001A',
    packageName: 'Phacoemulsification with Foldable IOL',
    specialty: 'Ophthalmology',
    totalDocuments: 4,
    verifiedDocuments: 4,
    complianceRate: 100,
    preAuthComplianceRate: 100,
    claimComplianceRate: 100,
    status: 'compliant',
    auditorName: 'Dr. K. Patel',
    notes: 'A-scan biometry and foldable IOL barcode verified.'
  },
  {
    id: 'aud-110',
    timestamp: '2026-09-28T09:00:00.000Z',
    date: 'Sep 28',
    patientId: 'PMJAY-PAT-2026-9041',
    procedureCode: 'BM001B',
    packageName: 'Thermal burns',
    specialty: 'Burns Management',
    totalDocuments: 5,
    verifiedDocuments: 5,
    complianceRate: 100,
    preAuthComplianceRate: 100,
    claimComplianceRate: 100,
    status: 'compliant',
    auditorName: 'Dr. S. Sharma',
    notes: 'Rule of 9 photographic proof and graft notes complete.'
  }
];

const STORAGE_KEY = 'hbp_audit_sessions_v1';

export function loadSavedAuditSessions(): AuditSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved audit sessions from storage:', e);
  }
  return INITIAL_AUDIT_SESSIONS;
}

export function saveAuditSessionsToStorage(sessions: AuditSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save audit sessions:', e);
  }
}

export function calculateAuditMetrics(sessions: AuditSession[]) {
  if (!sessions || sessions.length === 0) {
    return {
      averageComplianceRate: 0,
      totalAudits: 0,
      fullyCompliantCount: 0,
      firstTimeApprovalRate: 0,
      averagePreAuthRate: 0,
      averageClaimRate: 0,
    };
  }

  const totalAudits = sessions.length;
  const sumCompliance = sessions.reduce((acc, s) => acc + s.complianceRate, 0);
  const sumPreAuth = sessions.reduce((acc, s) => acc + s.preAuthComplianceRate, 0);
  const sumClaim = sessions.reduce((acc, s) => acc + s.claimComplianceRate, 0);
  const fullyCompliantCount = sessions.filter((s) => s.complianceRate === 100).length;

  return {
    averageComplianceRate: Math.round((sumCompliance / totalAudits) * 10) / 10,
    totalAudits,
    fullyCompliantCount,
    firstTimeApprovalRate: Math.round((fullyCompliantCount / totalAudits) * 100),
    averagePreAuthRate: Math.round((sumPreAuth / totalAudits) * 10) / 10,
    averageClaimRate: Math.round((sumClaim / totalAudits) * 10) / 10,
  };
}
