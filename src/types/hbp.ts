export interface HBPProcedure {
  specialty_code: string;
  specialty: string;
  package_name: string;
  procedure_name: string;
  procedure_code: string;
  package_amount_tier3: string;
  implant_mapped: string;
  stratification_criteria: string;
  stratification_remarks: string;
  multiple_procedures: string;
  special_conditions: string;
  reservation_public_hospitals: string;
  los: string;
  auto_approved: string;
  mandatory_documents_pre_auth: string;
  mandatory_documents_claim_processing: string;
}

export type HospitalTier = 'tier3' | 'tier2' | 'tier1';
export type HospitalAccreditation = 'none' | 'entry_nabh' | 'full_nabh';

export interface CalculatedTariff {
  baseAmount: number;
  tierMultiplier: number;
  accreditationMultiplier: number;
  multiProcedureMultiplier: number;
  procedureCost: number;
  implantCost: number;
  totalCost: number;
  breakdown: string[];
}

export interface ClaimDocumentChecklist {
  id: string;
  name: string;
  stage: 'pre_auth' | 'claim_processing';
  mandatory: boolean;
  status: 'pending' | 'verified' | 'rejected' | 'waived';
  notes: string;
  verifiedAt?: string;
  fileMockName?: string;
  attachedFile?: {
    name: string;
    size: number;
    type: string;
    format: 'xlsx' | 'pdf' | 'xml' | 'csv' | 'other';
    contentPreview?: string;
    lastModified?: string;
  };
  driveFile?: {
    id: string;
    name: string;
    webViewLink?: string;
    size?: string;
  };
}

export interface AuditSession {
  id: string;
  timestamp: string;
  date: string;
  patientId: string;
  procedureCode: string;
  packageName: string;
  specialty: string;
  totalDocuments: number;
  verifiedDocuments: number;
  complianceRate: number; // 0-100
  preAuthComplianceRate: number; // 0-100
  claimComplianceRate: number; // 0-100
  status: 'compliant' | 'partially_compliant' | 'deficient';
  auditorName?: string;
  notes?: string;
}

