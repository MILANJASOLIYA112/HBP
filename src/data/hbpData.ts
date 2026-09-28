import { HBPProcedure, HospitalTier, HospitalAccreditation, CalculatedTariff, ClaimDocumentChecklist } from '../types/hbp';

export const INITIAL_HBP_DATA: HBPProcedure[] = [
  // --- USER ORIGINAL PACKAGES ---
  {
    specialty_code: "BM",
    specialty: "Burns Management",
    package_name: "Thermal burns",
    procedure_name: "Criteria 1: % Total Body Surface Area Burns (TBSA):less than 20% in adults and less than 10% in children younger than 12 years. Dressing without anesthesia",
    procedure_code: "BM001A",
    package_amount_tier3: "7000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical Notes, MLC copy with number, Extent of burns visible on photograph (with rule of 9 chart)",
    mandatory_documents_claim_processing: "Post Treatment clinical photograph, lab tests or other diagnostic procedures done as a part of treatment. Detailed clinical notes."
  },
  {
    specialty_code: "BM",
    specialty: "Burns Management",
    package_name: "Thermal burns",
    procedure_name: "Criteria 2: % Total Body Surface Area Burns (TBSA): Upto 25%; Includes % TBSA skin grafted, flap cover, follow-up dressings etc. as deemed necessary; Surgical procedures are required for deep burns that are not amenable to heal with dressings alone.",
    procedure_code: "BM001B",
    package_amount_tier3: "50000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "19",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical Notes, MLC copy with number, Extent of upto 40% burns visible on photograph (with rule of 9 chart)",
    mandatory_documents_claim_processing: "Post Treatment clinical photograph, lab tests, X-rays or other diagnostic procedures done as a part of treatment. Detailed discharge summary."
  },
  {
    specialty_code: "BM",
    specialty: "Burns Management",
    package_name: "Flame burns",
    procedure_name: "% Total Body Surface Area Burns (TBSA): > 60 %; Includes % TBSA skin grafted, flap cover, follow-up dressings etc. as deemed necessary; Surgical procedures are required for deep burns that are not amenable to heal with dressings alone.",
    procedure_code: "BM003D",
    package_amount_tier3: "100000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "19",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical Notes, MLC copy with number, Extent > 60% burns visible on photograph (with rule of 9 chart)",
    mandatory_documents_claim_processing: "Post Treatment clinical photograph, lab tests, X-rays or other diagnostic procedures done as a part of treatment. Detailed discharge summary."
  },
  {
    specialty_code: "BM",
    specialty: "Burns Management",
    package_name: "Post Burn Contracture surgeries for Functional Improvement",
    procedure_name: "Post Burn Contracture surgeries for Functional Improvement (Package including splints, pressure garments, silicone - gel sheet and physiotherapy): Neck contracture; Contracture release with - Split thickness Skin Graft (STSG) / Full Thickness Skin Graft (FTSG) / Flap cover is done for each joint with post-operative regular dressings for STSG / FTSG / Flap cover.",
    procedure_code: "BM006B",
    package_amount_tier3: "62500",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "10",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical history detailing the burns - etiology, treatment given and resultant contractures left. Functional disability to be detailed and expected functional improvement to be shared. Pre-op clinical photograph.",
    mandatory_documents_claim_processing: "Post Treatment clinical photograph, Detailed discharge summary. Detailed Procedure / Operative Notes."
  },
  {
    specialty_code: "ER",
    specialty: "Emergency Room Packages",
    package_name: "Laceration - Suturing / Dressing",
    procedure_name: "Laceration - Suturing / Dressing",
    procedure_code: "ER001A",
    package_amount_tier3: "2000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical notes with planned line of treatment with pre-clinical photograph",
    mandatory_documents_claim_processing: "Clinical notes / discharge summary with planned line of treatment & post clinical photograph"
  },
  {
    specialty_code: "ID",
    specialty: "Infectious Diseases, General Medicine",
    package_name: "Treatment of COVID-19 Infection",
    procedure_name: "Treatment of COVID-19 Infection",
    procedure_code: "ID003A",
    package_amount_tier3: "Routine Ward - 1800, HDU - 2700, ICU (without Ventilator) - 3600, ICU (with Ventilator) - 4500",
    implant_mapped: "NA",
    stratification_criteria: "Yes",
    stratification_remarks: "Day wise",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Positive report for COVID-19 Test, Clinical notes",
    mandatory_documents_claim_processing: "Clinical Notes and Discharge Summary"
  },
  {
    specialty_code: "IN",
    specialty: "Interventional Neuroradiology",
    package_name: "Cerebral & Spinal AVM embolization - Using Histoacryl (per sitting)",
    procedure_name: "Spinal AVM embolization - Using Histoacryl (per sitting)",
    procedure_code: "IN002",
    package_amount_tier3: "100000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "NA",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical notes and CT/MRI/ DSA confirming the diagnosis",
    mandatory_documents_claim_processing: "Detailed Procedure / Operative Notes. Radiographic stills photograph/CT/MRI/Angio, Invoice / bar code of histoacryl used, Detailed Discharge Summary"
  },
  {
    specialty_code: "IN",
    specialty: "Interventional Radiology",
    package_name: "Carotico-cavernous Fistula (CCF) embolization",
    procedure_name: "Carotico-cavernous Fistula (CCF) embolization with coils. [includes 5 coils, guide catheter, micro-catheter, micro-guidewire, general items]",
    procedure_code: "IN004A",
    package_amount_tier3: "187500",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "7",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical notes and CT/MRI/ DSA confirming the diagnosis",
    mandatory_documents_claim_processing: "Post procedure x-ray showing coils; Detailed Procedure / Operative Notes. Invoice / bar code of used coil / catheter and other accessories, detailed discharge summary"
  },
  {
    specialty_code: "MC",
    specialty: "Cardiology, Interventional Radiology",
    package_name: "Catheter directed Thrombolysis",
    procedure_name: "For Deep vein thrombosis (DVT)",
    procedure_code: "MC002A",
    package_amount_tier3: "38500",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical notes and doppler establishing presence of DVT",
    mandatory_documents_claim_processing: "Post procedure Colour Doppler of affected limb/part, invoice of catheter used, invoice of the thrombolytic drug (tPA) used, Detailed Discharge Summary."
  },
  {
    specialty_code: "MG",
    specialty: "Pediatric Medical Management, General Medicine, Nephrology",
    package_name: "Continuous renal replacement therapy/Continuous veno-venous hemofiltration",
    procedure_name: "Initiation cost for disposable",
    procedure_code: "MG077A",
    package_amount_tier3: "Rs 33,000 per day for maximum of 5 in one admission",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "3-5 days",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical notes detailing history and Admission notes showing vitals and examination findings; any investigations done.",
    mandatory_documents_claim_processing: "Detailed ICPs, Treatment details, detailed discharge summary, eGFR, RFT, All investigations reports."
  },
  {
    specialty_code: "MM",
    specialty: "Mental Disorders",
    package_name: "Mental Retardation (intellectual disability)",
    procedure_name: "Intellectual Disability (ID)",
    procedure_code: "MM001A",
    package_amount_tier3: "Routine Ward - 1800, HDU - 2700, ICU (without Ventilator) - 3600, ICU (with Ventilator) - 4500",
    implant_mapped: "NA",
    stratification_criteria: "Yes",
    stratification_remarks: "Day wise",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "Yes",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Detailed history with chronicity; need for hospitalization. Admission under empanneled Psychiatrist is a must.",
    mandatory_documents_claim_processing: "Detailed treatment notes; all investigations done; detailed discharge summary."
  },
  {
    specialty_code: "MN",
    specialty: "Neo - natal Care",
    package_name: "Basic neonatal care package",
    procedure_name: "Neonates 1800-2500g OR Neonates of any weight requiring closer monitoring or short-term care on mother's bedside",
    procedure_code: "MN001A",
    package_amount_tier3: "1000/day",
    implant_mapped: "NA",
    stratification_criteria: "Yes",
    stratification_remarks: "Routine Ward - 500",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "4",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Detailed clinical notes (incl trigger for hospitalization and examiantion findings), supporting investigations. Admission under neonatologist in NICU (in major locations) and under Pediatrician in smaller locations is a must.",
    mandatory_documents_claim_processing: "Detailed ICPs (daily Treatment details), detailed discharge summary, All investigations reports."
  },
  {
    specialty_code: "MO",
    specialty: "Medical Oncology",
    package_name: "CT for CA Breast",
    procedure_name: "Trastuzumab 8 mg/Kg in Cycle 1 D1; Trastuzumab 6 mg/kg D1 from C2 every 21 days",
    procedure_code: "MO001F",
    package_amount_tier3: "23400",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "1",
    auto_approved: "No",
    mandatory_documents_pre_auth: "CBC, LFT,RFT, Biopsy report or surgical pathology report of Modified radical mastectomy or breast conservation surgery, Her-2 neu IHC - 3+ or Her 2-neu positive FISH,ECG,2D-ECHO,USG abdomen and pelvis, CXR PA view or CECT chest+abdomen and pelvis in case of metastatic disease",
    mandatory_documents_claim_processing: "BAR CODE OF THE DRUGS, REPORTS OF THE TESTS (PATHOLOGY, RADIOLOGY, MICROBIOLOGY, HEMATOLOGY, BIOCHEMISTRY,ETC.) DISCHARGE SUMMARY OF INPATIENT DEPARTMENT, DISCHARGE SUMMARY OF DAY CARE DEPARTMENT, CHARTS OF CHEMOTHERAPY REGIMEN, TRANFUSION SLIPS"
  },
  {
    specialty_code: "OBG & Gynec",
    specialty: "OBG & Gynec",
    package_name: "Hysterectomy",
    procedure_name: "Abdominal Hysterectomy",
    procedure_code: "SO010A",
    package_amount_tier3: "20000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "Yes",
    los: "5",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical notes with planned line of treatment (including System Examination) and Relavant Investigations (USG Abdomen + Pelvis/ CT abdomen+ Pelvis) confirming the indication",
    mandatory_documents_claim_processing: "Histopathology, Detailed Discharge Summary with Procedure / Operative Notes"
  },
  {
    specialty_code: "SB",
    specialty: "Orthopedics",
    package_name: "Total Hip Replacement",
    procedure_name: "Cementless",
    procedure_code: "SB038B",
    package_amount_tier3: "46300",
    implant_mapped: "Implant for Total Hip Replacement - Cementless - 65000",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "7",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical notes and X-ray/ CT justifying the surgery",
    mandatory_documents_claim_processing: "Post Procedure X-ray showing implant, detailed Procedure / Operative Notes. Bar code of implant used, Detailed discharge summary"
  },
  {
    specialty_code: "US",
    specialty: "Unspecified Surgical Package",
    package_name: "Unspecified Surgical Package",
    procedure_name: "Unspecified Surgical Package",
    procedure_code: "US001A",
    package_amount_tier3: "Upto one lakh",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "NA",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical notes with planned line of treatment (including indication for need of required Procedure )",
    mandatory_documents_claim_processing: "Procedure / Operative Notes, Detailed Discharge Summary"
  },

  // --- GENERAL SURGERY PACKAGES (GS) ---
  {
    specialty_code: "GS",
    specialty: "General Surgery",
    package_name: "Laparoscopic Cholecystectomy",
    procedure_name: "Laparoscopic Cholecystectomy with / without Cholangiogram for Symptomatic Gallstone Disease / Cholecystitis",
    procedure_code: "GS001A",
    package_amount_tier3: "22000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Pre-operative USG Abdomen showing Gallbladder calculi or cholecystitis, Liver Function Tests (LFT), Clinical admission notes",
    mandatory_documents_claim_processing: "Histopathology report of Gallbladder, Detailed Operative Notes with port sites description, Discharge summary"
  },
  {
    specialty_code: "GS",
    specialty: "General Surgery",
    package_name: "Appendectomy",
    procedure_name: "Laparoscopic or Open Appendectomy for Acute Appendicitis / Perforated Appendicitis",
    procedure_code: "GS004A",
    package_amount_tier3: "16500",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "USG / CT Abdomen proving appendicitis or acute appendicular lump, CBC report with leukocytosis, Clinical notes",
    mandatory_documents_claim_processing: "Histopathology of appendix, Operative notes detailing intra-abdominal findings, Detailed discharge summary"
  },
  {
    specialty_code: "GS",
    specialty: "General Surgery",
    package_name: "Inguinal Hernia Repair",
    procedure_name: "Unilateral Inguinal Hernia Repair with Polypropylene Mesh Placement (Open / Laparoscopic TAPP / TEP)",
    procedure_code: "GS012A",
    package_amount_tier3: "14000",
    implant_mapped: "Polypropylene Hernia Mesh - 1500",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Clinical examination notes confirming reducible or obstructed inguinal hernia, USG Groin if done",
    mandatory_documents_claim_processing: "Operative notes, Barcode of Polypropylene Mesh used, Post-operative clinical recovery notes, Detailed discharge summary"
  },
  {
    specialty_code: "GS",
    specialty: "General Surgery",
    package_name: "Modified Radical Mastectomy",
    procedure_name: "Modified Radical Mastectomy (MRM) with Axillary Lymph Node Dissection for Breast Carcinoma",
    procedure_code: "GS022A",
    package_amount_tier3: "27500",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "5",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Biopsy / Tru-cut / FNAC report confirming Malignancy, Bilateral Mammogram or USG Breast, Metastatic workup (CXR, USG Abdomen)",
    mandatory_documents_claim_processing: "Histopathology of breast specimen with margin status and axillary nodes, Detailed operative notes, Detailed discharge summary"
  },
  {
    specialty_code: "GS",
    specialty: "General Surgery",
    package_name: "Hemorrhoidectomy",
    procedure_name: "Open / Milligan-Morgan / Stapled Hemorrhoidectomy for Grade 3/4 Internal Hemorrhoids",
    procedure_code: "GS031A",
    package_amount_tier3: "12500",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Proctoscopy findings detailing grade of hemorrhoids, Pre-operative clinical notes, CBC",
    mandatory_documents_claim_processing: "Operative notes, Post-procedure clinical notes, Detailed discharge summary"
  },

  // --- CARDIOLOGY & CARDIO-THORACIC SURGERY (CT & MC) ---
  {
    specialty_code: "CT",
    specialty: "Cardio-Thoracic Surgery",
    package_name: "Coronary Artery Bypass Grafting",
    procedure_name: "Coronary Artery Bypass Grafting (CABG) - On Pump or Off Pump (OPCAB) with LIMA and Vein Grafts",
    procedure_code: "CT001A",
    package_amount_tier3: "135000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "8",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Coronary Angiogram (CAG) report & CD/film confirming multi-vessel disease or LMCA involvement, 2D Echocardiography, Pre-op ECG",
    mandatory_documents_claim_processing: "Operative notes detailing grafts harvested and bypassed, Post-op ECG, Post-op CXR, ICU monitoring charts, Detailed discharge summary"
  },
  {
    specialty_code: "MC",
    specialty: "Cardiology",
    package_name: "PTCA with Stenting",
    procedure_name: "Percutaneous Transluminal Coronary Angioplasty (PTCA) with Single Drug Eluting Stent (DES)",
    procedure_code: "MC001A",
    package_amount_tier3: "65000",
    implant_mapped: "Drug Eluting Stent (DES) - 30000",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Coronary Angiography (CAG) report showing critical coronary stenosis (>70%), Pre-op ECG, 2D Echo report",
    mandatory_documents_claim_processing: "Pre and post procedure Angiography stills / CD showing patent stent, Barcode of DES stent and balloon catheter, Detailed discharge summary"
  },
  {
    specialty_code: "MC",
    specialty: "Cardiology",
    package_name: "Permanent Pacemaker Implantation",
    procedure_name: "Permanent Pacemaker Implantation (PPI) - Dual Chamber (DDD/DDDR) for Complete Heart Block or Sick Sinus Syndrome",
    procedure_code: "MC005A",
    package_amount_tier3: "45000",
    implant_mapped: "Dual Chamber Pacemaker Pulse Generator & Leads - 80000",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "ECG / Holter monitoring proving Complete Heart Block (CHB) / symptomatic bradycardia, 2D Echo report, Clinical admission notes",
    mandatory_documents_claim_processing: "Post-op Chest X-ray showing lead placement and pulse generator, Barcode of Pacemaker generator and pacing leads, Interrogation report, Detailed discharge summary"
  },
  {
    specialty_code: "CT",
    specialty: "Cardio-Thoracic Surgery",
    package_name: "Mitral Valve Replacement",
    procedure_name: "Mitral Valve Replacement (MVR) using Mechanical or Bioprosthetic Tissue Valve with Cardiopulmonary Bypass",
    procedure_code: "CT008A",
    package_amount_tier3: "145000",
    implant_mapped: "Prosthetic Heart Valve (Mechanical / Tissue) - 45000",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "9",
    auto_approved: "No",
    mandatory_documents_pre_auth: "2D Echo / TEE detailing severe mitral stenosis or regurgitation, CAG for age >40 yrs, Pre-op ECG, Clinical notes",
    mandatory_documents_claim_processing: "Post-op 2D Echo confirming prosthetic valve function, Barcode of prosthetic valve used, Operative notes, Detailed discharge summary"
  },

  // --- ORTHOPEDICS & TRAUMA (SB) ---
  {
    specialty_code: "SB",
    specialty: "Orthopedics",
    package_name: "Fracture Neck of Femur / Shaft Femur",
    procedure_name: "Open Reduction and Internal Fixation (ORIF) / Closed Reduction Internal Fixation (CRIF) with Proximal Femoral Nail (PFN) or DHS",
    procedure_code: "SB001A",
    package_amount_tier3: "28000",
    implant_mapped: "Proximal Femoral Nail (PFN) / DHS Implant - 12000",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "5",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Pre-operative X-ray of pelvis with bilateral hips / affected femur showing fracture, Clinical history and trauma notes",
    mandatory_documents_claim_processing: "Post-operative X-ray showing anatomical reduction and implant in situ, Barcode of PFN/DHS implant and screws, Detailed discharge summary"
  },
  {
    specialty_code: "SB",
    specialty: "Orthopedics",
    package_name: "Total Knee Replacement",
    procedure_name: "Total Knee Replacement (TKR) - Unilateral Cemented with Patellar Resurfacing / Retention",
    procedure_code: "SB035A",
    package_amount_tier3: "48000",
    implant_mapped: "Total Knee Replacement Implant Set (Femoral, Tibial & Poly Insert) - 65000",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "7",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Pre-op weight-bearing AP & Lateral X-rays showing Grade 3/4 Osteoarthritis with joint space loss, Clinical notes",
    mandatory_documents_claim_processing: "Post-operative X-ray showing prosthesis alignment, Barcode of Femoral, Tibial and Polyethylene insert, Operative notes, Detailed discharge summary"
  },
  {
    specialty_code: "SB",
    specialty: "Orthopedics",
    package_name: "Arthroscopic ACL Reconstruction",
    procedure_name: "Arthroscopic Anterior Cruciate Ligament (ACL) Reconstruction using Hamstring / Bone-Patellar-Tendon-Bone Graft with Fixation Devices",
    procedure_code: "SB042A",
    package_amount_tier3: "32000",
    implant_mapped: "Endobutton and Bioscrew / Interference Screw - 15000",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "MRI Knee scan report proving complete ACL rupture, Clinical Lachman & Pivot shift test notes",
    mandatory_documents_claim_processing: "Arthroscopic still photographs of graft in place, Barcode of fixation devices (Endobutton/Bioscrew), Operative notes, Detailed discharge summary"
  },

  // --- NEUROSURGERY & SPINE (NS) ---
  {
    specialty_code: "NS",
    specialty: "Neurosurgery",
    package_name: "Craniotomy for Hematoma Evacuation",
    procedure_name: "Emergency Craniotomy / Craniectomy and Evacuation of Extradural (EDH) / Subdural (SDH) / Intracerebral Hematoma",
    procedure_code: "NS001A",
    package_amount_tier3: "60000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "7",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Emergency NCCT Brain scan showing intracranial bleed with mass effect / midline shift, Glasgow Coma Scale (GCS) clinical record",
    mandatory_documents_claim_processing: "Post-operative CT Brain showing evacuation of hematoma, Detailed operative notes, ICP monitoring notes, Detailed discharge summary"
  },
  {
    specialty_code: "NS",
    specialty: "Neurosurgery",
    package_name: "Lumbar Microdiscectomy",
    procedure_name: "Microdiscectomy / Fenestration Discectomy for Lumbar Disc Herniation / Prolapse Intervertebral Disc (PIVD)",
    procedure_code: "NS008A",
    package_amount_tier3: "42000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "4",
    auto_approved: "No",
    mandatory_documents_pre_auth: "MRI Lumbar Spine showing nerve root compression corresponding to neurological signs (SLR test, sensory/motor deficit), Clinical notes",
    mandatory_documents_claim_processing: "Detailed Operative notes, Post-operative neurological evaluation chart, Detailed discharge summary"
  },
  {
    specialty_code: "NS",
    specialty: "Neurosurgery",
    package_name: "Excision of Brain Tumour",
    procedure_name: "Craniotomy and Microsurgical Excision of Supratentorial Brain Tumour / Glioma / Meningioma",
    procedure_code: "NS015A",
    package_amount_tier3: "90000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "10",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Contrast Enhanced MRI Brain scan report showing neoplastic mass, Neurological examination record",
    mandatory_documents_claim_processing: "Histopathology report of resected tumour specimen with IHC, Post-op CT/MRI Brain, Detailed operative notes, Detailed discharge summary"
  },
  {
    specialty_code: "NS",
    specialty: "Neurosurgery",
    package_name: "Ventriculo-Peritoneal Shunt",
    procedure_name: "Ventriculo-Peritoneal (VP) Shunt Implantation for Obstructive or Communicating Hydrocephalus",
    procedure_code: "NS022A",
    package_amount_tier3: "28000",
    implant_mapped: "VP Shunt System (Chhabra / Medtronic) - 12000",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "4",
    auto_approved: "No",
    mandatory_documents_pre_auth: "CT / MRI Brain demonstrating ventricular dilatation / hydrocephalus, Clinical signs of raised ICP",
    mandatory_documents_claim_processing: "Post-op X-ray showing shunt catheter course, Post-op CT Brain, Barcode of VP shunt valve and catheter, Detailed discharge summary"
  },

  // --- OPHTHALMOLOGY (OP) ---
  {
    specialty_code: "OP",
    specialty: "Ophthalmology",
    package_name: "Phacoemulsification with Foldable IOL",
    procedure_name: "Phacoemulsification with Foldable Hydrophobic Acrylic Intraocular Lens (IOL) for Senile / Complicated Cataract",
    procedure_code: "OP001A",
    package_amount_tier3: "9500",
    implant_mapped: "Foldable Hydrophobic Acrylic IOL - 3500",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "1",
    auto_approved: "Yes",
    mandatory_documents_pre_auth: "Slit lamp examination notes grading cataract, A-scan biometry report with keratometry and target IOL power, Pre-op visual acuity",
    mandatory_documents_claim_processing: "Post-operative visual acuity record, IOL box label / barcode with serial number, Operative notes, Discharge summary"
  },
  {
    specialty_code: "OP",
    specialty: "Ophthalmology",
    package_name: "Trabeculectomy",
    procedure_name: "Trabeculectomy with Antimetabolite (Mitomycin-C / 5-FU) for Primary or Secondary Glaucoma",
    procedure_code: "OP007A",
    package_amount_tier3: "11000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Intraocular pressure (IOP) applanation tonometry record, Humphrey visual field test, Cup-disc ratio documentation, Gonioscopy notes",
    mandatory_documents_claim_processing: "Post-op bleb assessment and IOP record, Detailed operative notes, Detailed discharge summary"
  },
  {
    specialty_code: "OP",
    specialty: "Ophthalmology",
    package_name: "Vitrectomy for Retinal Detachment",
    procedure_name: "Pars Plana Vitrectomy (PPV) with Endolaser and Silicon Oil / Gas Tamponade for Rhegmatogenous Retinal Detachment",
    procedure_code: "OP012A",
    package_amount_tier3: "28000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "B-Scan Ultrasonography report / Fundus photograph proving retinal detachment with tear, Pre-op visual acuity",
    mandatory_documents_claim_processing: "Post-op fundus examination record, Invoice/proof of silicon oil or heavy liquids used, Operative notes, Detailed discharge summary"
  },

  // --- ENT / OTORHINOLARYNGOLOGY (EN) ---
  {
    specialty_code: "EN",
    specialty: "ENT",
    package_name: "Tympanoplasty",
    procedure_name: "Tympanoplasty (Type 1) / Myringoplasty with Temporalis Fascia Graft for Chronic Suppurative Otitis Media (CSOM)",
    procedure_code: "EN001A",
    package_amount_tier3: "15000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Pure Tone Audiometry (PTA) chart showing conductive hearing loss, Pre-op Otoscopy findings detailing tympanic perforation, Clinical notes",
    mandatory_documents_claim_processing: "Operative notes describing graft placement and middle ear status, Post-op notes, Detailed discharge summary"
  },
  {
    specialty_code: "EN",
    specialty: "ENT",
    package_name: "Functional Endoscopic Sinus Surgery",
    procedure_name: "Functional Endoscopic Sinus Surgery (FESS) - Bilateral for Chronic Rhinosinusitis / Sinonasal Polyposis",
    procedure_code: "EN006A",
    package_amount_tier3: "24000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "CT Paranasal Sinuses (PNS) coronal view proving sinus disease / polyps, Diagnostic nasal endoscopy report",
    mandatory_documents_claim_processing: "Histopathology report of excised nasal polyp/tissue, Operative notes detailing cleared sinuses, Detailed discharge summary"
  },
  {
    specialty_code: "EN",
    specialty: "ENT",
    package_name: "Septoplasty",
    procedure_name: "Septoplasty with or without Turbinoplasty for Deviated Nasal Septum (DNS) with Nasal Obstruction",
    procedure_code: "EN011A",
    package_amount_tier3: "12000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Pre-operative Anterior Rhinoscopy notes documenting severe septal deviation and airway narrowing",
    mandatory_documents_claim_processing: "Detailed Operative notes, Post-operative pack removal notes, Detailed discharge summary"
  },

  // --- OBSTETRICS & GYNECOLOGY (OB) ---
  {
    specialty_code: "OB",
    specialty: "Obstetrics & Gynecology",
    package_name: "Normal Vaginal Delivery",
    procedure_name: "Normal Vaginal Delivery including Episiotomy, Repair, Active Management of Third Stage, and Newborn Resuscitation",
    procedure_code: "OB001A",
    package_amount_tier3: "9000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "Yes",
    mandatory_documents_pre_auth: "Antenatal checkup (ANC) card, Admission clinical notes with labor stage, Blood investigations",
    mandatory_documents_claim_processing: "Partograph, Delivery register extract with date/time of birth, infant gender, birth weight, and APGAR score, Discharge summary"
  },
  {
    specialty_code: "OB",
    specialty: "Obstetrics & Gynecology",
    package_name: "Caesarean Section",
    procedure_name: "Lower Segment Caesarean Section (LSCS) for Emergency or Planned Obstetric Indications (CPD, Fetal Distress, Malpresentation, Previous LSCS)",
    procedure_code: "OB003A",
    package_amount_tier3: "18000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "4",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Ultrasound Obstetric scan report, Clinical notes documenting clear obstetric indication for surgical delivery, Partograph if in trial",
    mandatory_documents_claim_processing: "Operative notes detailing uterine incision and placenta delivery, Newborn birth details with pediatrician examination, Detailed discharge summary"
  },
  {
    specialty_code: "OB",
    specialty: "Obstetrics & Gynecology",
    package_name: "Ovarian Cystectomy",
    procedure_name: "Laparoscopic or Open Ovarian Cystectomy for Benign Ovarian Cyst / Dermoid / Endometrioma",
    procedure_code: "OB015A",
    package_amount_tier3: "22000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Pelvic USG / MRI detailing cyst dimensions and morphology, CA-125 level if indicated, Clinical notes",
    mandatory_documents_claim_processing: "Histopathology report of excised ovarian cyst wall, Operative notes with laparoscopy stills, Detailed discharge summary"
  },

  // --- UROLOGY & NEPHROLOGY (SU & MG) ---
  {
    specialty_code: "SU",
    specialty: "Urology",
    package_name: "Transurethral Resection of Prostate",
    procedure_name: "Transurethral Resection of Prostate (TURP) - Monopolar or Bipolar for Benign Prostatic Hyperplasia (BPH)",
    procedure_code: "SU001A",
    package_amount_tier3: "25000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "3",
    auto_approved: "No",
    mandatory_documents_pre_auth: "USG KUB with Prostate volume and Post Void Residual (PVR) urine volume, Serum PSA report, Uroflowmetry record",
    mandatory_documents_claim_processing: "Histopathology report of resected prostate chips, Operative notes detailing resection, Detailed discharge summary"
  },
  {
    specialty_code: "SU",
    specialty: "Urology",
    package_name: "Percutaneous Nephrolithotomy",
    procedure_name: "Percutaneous Nephrolithotomy (PCNL) with Pneumatic / Laser Lithotripsy for Large Renal / Staghorn Calculi",
    procedure_code: "SU008A",
    package_amount_tier3: "28000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "4",
    auto_approved: "No",
    mandatory_documents_pre_auth: "NCCT KUB scan demonstrating renal calculus size, location and Hounsfield Units, Serum Creatinine, Urine culture report",
    mandatory_documents_claim_processing: "Post-operative X-ray KUB / USG showing stone clearance, Nephrostomy tube removal notes, Operative notes, Detailed discharge summary"
  },
  {
    specialty_code: "SU",
    specialty: "Urology",
    package_name: "Ureteroscopic Lithotripsy",
    procedure_name: "Ureteroscopic Lithotripsy (URSL) with Holmium Laser / Pneumatic Lithotrite and DJ Stenting for Ureteric Calculus",
    procedure_code: "SU014A",
    package_amount_tier3: "18000",
    implant_mapped: "Double J (DJ) Stent - 1500",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "NCCT KUB / USG KUB establishing site and dimensions of ureteric calculus, RFT report",
    mandatory_documents_claim_processing: "Post-op X-ray KUB showing DJ stent in proper position, Barcode of DJ stent used, Operative notes, Detailed discharge summary"
  },
  {
    specialty_code: "SU",
    specialty: "Urology",
    package_name: "Simple / Radical Nephrectomy",
    procedure_name: "Nephrectomy (Open / Laparoscopic) for Non-functioning Kidney, Pyonephrosis or Renal Cell Carcinoma",
    procedure_code: "SU020A",
    package_amount_tier3: "35000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "5",
    auto_approved: "No",
    mandatory_documents_pre_auth: "CT Abdomen with IV Contrast / Renal DTPA Scan documenting non-functioning kidney or renal neoplasm, Serum Creatinine",
    mandatory_documents_claim_processing: "Histopathology report of excised kidney, Detailed operative notes, Detailed discharge summary"
  },

  // --- PEDIATRIC SURGERY & MEDICINE (PE) ---
  {
    specialty_code: "PE",
    specialty: "Pediatric Surgery",
    package_name: "Pediatric Herniotomy",
    procedure_name: "Herniotomy for Congenital Inguinal Hernia / Patent Processus Vaginalis in Infant or Child",
    procedure_code: "PE001A",
    package_amount_tier3: "12000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Pediatric surgical examination notes, USG Groin confirming patent sac, Pediatric pre-anesthesia fitness note",
    mandatory_documents_claim_processing: "Operative notes describing sac ligation, Post-op pediatrician notes, Detailed discharge summary"
  },
  {
    specialty_code: "PE",
    specialty: "Pediatric Medicine",
    package_name: "Pediatric Severe Pneumonia / Sepsis",
    procedure_name: "Inpatient Management of Severe Pediatric Pneumonia with Respiratory Distress / Sepsis in PICU or High Dependency Ward",
    procedure_code: "PE009A",
    package_amount_tier3: "2500/day",
    implant_mapped: "NA",
    stratification_criteria: "Yes",
    stratification_remarks: "Day wise PICU / Ward billing",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "5",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Chest X-ray showing consolidation/infiltrates, CBC, CRP, Blood culture, Arterial Blood Gas (ABG), Pediatric clinical vitals charting",
    mandatory_documents_claim_processing: "Daily Inpatient Clinical Progress notes (ICPs), Oxygen and IV antibiotic charts, Repeat CXR, Detailed discharge summary"
  },

  // --- ONCOLOGY & RADIOTHERAPY (MO & RO) ---
  {
    specialty_code: "MO",
    specialty: "Medical Oncology",
    package_name: "Systemic Chemotherapy Regimen",
    procedure_name: "Platinum-Based Systemic Chemotherapy (Paclitaxel + Carboplatin / Cisplatin) for Solid Tumours (Per Cycle)",
    procedure_code: "MO005A",
    package_amount_tier3: "14500",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "2",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Histopathology / Biopsy report proving primary malignancy, CBC, LFT, RFT, Chemotherapy protocol sheet signed by Medical Oncologist",
    mandatory_documents_claim_processing: "Drug batch barcodes and vials verification, Chemotherapy administration and infusion record, Day care discharge summary"
  },
  {
    specialty_code: "RO",
    specialty: "Radiation Oncology",
    package_name: "Intensity Modulated Radiotherapy",
    procedure_name: "Intensity Modulated Radiotherapy (IMRT) - Radical Curative Treatment for Head & Neck / Pelvic / Thoracic Malignancy (Complete Course)",
    procedure_code: "RO001A",
    package_amount_tier3: "65000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "NA",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Histopathology report, Diagnostic CT/MRI, Radiation Oncologist prescription, CT Simulation planning scans and Dose-Volume Histograms (DVH)",
    mandatory_documents_claim_processing: "Radiation treatment chart with delivered fraction doses, Portal verification images, Treatment completion summary"
  },

  // --- POLYTRAUMA & EMERGENCY CRITICAL CARE (PT & ER) ---
  {
    specialty_code: "PT",
    specialty: "Polytrauma",
    package_name: "Polytrauma Damage Control Resuscitation",
    procedure_name: "Polytrauma Comprehensive Care - Damage Control Resuscitation, Multi-specialty Surgical Interventions and Intensive Care Stabilization",
    procedure_code: "PT001A",
    package_amount_tier3: "85000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "Yes",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "10",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Emergency room trauma triage record, Whole body trauma CT scan / X-rays showing multiple injuries, MLC copy with number, Blood transfusion slips",
    mandatory_documents_claim_processing: "Operative notes from all surgical specialties involved, Post-op diagnostic proof, Daily ICU chart, Detailed discharge summary"
  },
  {
    specialty_code: "ER",
    specialty: "Emergency Medicine",
    package_name: "Acute Poisoning Management",
    procedure_name: "Inpatient Critical Care Resuscitation for Organophosphorus (OP) / Snake Bite / Toxin Ingestion with Antidote Administration",
    procedure_code: "ER005A",
    package_amount_tier3: "18000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "No",
    reservation_public_hospitals: "No",
    los: "4",
    auto_approved: "No",
    mandatory_documents_pre_auth: "MLC copy with number, Emergency admission triage sheet, Toxicological history, Pseudocholinesterase report or coagulation profile",
    mandatory_documents_claim_processing: "Atropine / PAM / ASV administration flow chart, Daily vitals charting, Detailed discharge summary"
  },

  // --- UNSPECIFIED MEDICAL MANAGEMENT (UM) ---
  {
    specialty_code: "UM",
    specialty: "Unspecified Medical Package",
    package_name: "Unspecified Medical Management",
    procedure_name: "Inpatient Medical Management for Complex Unlisted Conditions with Secondary Complications",
    procedure_code: "UM001A",
    package_amount_tier3: "Upto 50000",
    implant_mapped: "NA",
    stratification_criteria: "No",
    stratification_remarks: "NA",
    multiple_procedures: "No",
    special_conditions: "Yes",
    reservation_public_hospitals: "No",
    los: "5",
    auto_approved: "No",
    mandatory_documents_pre_auth: "Detailed clinical notes indicating why condition is not listed in HBP 2.2, Diagnostic investigations confirming primary diagnosis",
    mandatory_documents_claim_processing: "Daily ICPs, Medication chart, Diagnostic proof of resolution, Detailed discharge summary"
  }
];

export function parseNumericTariff(rawAmount: string): { amount: number; isVariable: boolean; label: string } {
  if (!rawAmount) return { amount: 0, isVariable: false, label: '₹0' };
  
  const trimmed = rawAmount.trim();
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    return { amount: num, isVariable: false, label: `₹${num.toLocaleString('en-IN')}` };
  }
  
  if (trimmed.toLowerCase().includes('upto one lakh')) {
    return { amount: 100000, isVariable: true, label: 'Ceiling ₹1,00,000' };
  }

  if (trimmed.toLowerCase().includes('upto 50000')) {
    return { amount: 50000, isVariable: true, label: 'Ceiling ₹50,000' };
  }
  
  if (trimmed.includes('33,000')) {
    return { amount: 33000, isVariable: true, label: '₹33,000 / day (max 5 days)' };
  }

  if (trimmed.includes('1000/day')) {
    return { amount: 1000, isVariable: true, label: '₹1,000 / day' };
  }

  if (trimmed.includes('2500/day')) {
    return { amount: 2500, isVariable: true, label: '₹2,500 / day' };
  }

  if (trimmed.includes('Routine Ward - 1800')) {
    return { amount: 1800, isVariable: true, label: '₹1,800 - ₹4,500 / day' };
  }

  const matches = trimmed.match(/\d+[\d,]*/);
  if (matches) {
    const num = parseInt(matches[0].replace(/,/g, ''), 10);
    return { amount: num, isVariable: true, label: `₹${num.toLocaleString('en-IN')}` };
  }

  return { amount: 0, isVariable: true, label: trimmed };
}

export function parseImplantCost(implantStr: string): number {
  if (!implantStr || implantStr === 'NA') return 0;
  const match = implantStr.match(/(\d+[\d,]*)$/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return 0;
}

export function splitMandatoryDocuments(docString: string, stage: 'pre_auth' | 'claim_processing'): ClaimDocumentChecklist[] {
  if (!docString || docString === 'NA') return [];
  
  // Split on commas, semicolons or periods followed by space/capital letter
  const items = docString
    .split(/[,;]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 2);

  return items.map((item, index) => ({
    id: `${stage}-${index}-${item.slice(0, 10).toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    name: item,
    stage,
    mandatory: true,
    status: 'pending',
    notes: ''
  }));
}

export const TIER_CONFIG: Record<HospitalTier, { label: string; multiplier: number; desc: string }> = {
  tier3: { label: 'Tier 3 Cities (Base Rate)', multiplier: 1.0, desc: 'Base HBP rate for Non-Metro & Tier 3 locations' },
  tier2: { label: 'Tier 2 Cities (+10%)', multiplier: 1.10, desc: '+10% standard geographic enhancement' },
  tier1: { label: 'Tier 1 Metro (+25%)', multiplier: 1.25, desc: '+25% enhancement for Tier 1 Metropolitan centres' }
};

export const ACCREDITATION_CONFIG: Record<HospitalAccreditation, { label: string; multiplier: number; desc: string }> = {
  none: { label: 'No Accreditation (1.0x)', multiplier: 1.0, desc: 'Standard empanelled facility' },
  entry_nabh: { label: 'Entry Level NABH (+10%)', multiplier: 1.10, desc: 'Quality certified hospital' },
  full_nabh: { label: 'Full NABH / NABL (+15%)', multiplier: 1.15, desc: 'Fully accredited apex healthcare provider' }
};

export function calculateProcedureTariff(
  procedure: HBPProcedure,
  tier: HospitalTier,
  accreditation: HospitalAccreditation,
  sequenceIndex: number = 0,
  bedDays: number = 1
): CalculatedTariff {
  const { amount: baseNum, isVariable } = parseNumericTariff(procedure.package_amount_tier3);
  const implantCost = parseImplantCost(procedure.implant_mapped);
  
  const tierMultiplier = TIER_CONFIG[tier].multiplier;
  const accreditationMultiplier = ACCREDITATION_CONFIG[accreditation].multiplier;
  
  // Multi-procedure rule: 1st 100%, 2nd 50%, 3rd+ 25%
  let multiProcedureMultiplier = 1.0;
  if (sequenceIndex === 1) multiProcedureMultiplier = 0.5;
  else if (sequenceIndex >= 2) multiProcedureMultiplier = 0.25;

  let computedBase = baseNum;
  const breakdown: string[] = [];

  // Check if per-day rate
  if (procedure.procedure_code === 'MG077A') {
    const cappedDays = Math.min(Math.max(bedDays, 1), 5);
    computedBase = 33000 * cappedDays;
    breakdown.push(`CRRT @ ₹33,000/day × ${cappedDays} days = ₹${computedBase.toLocaleString('en-IN')}`);
  } else if (procedure.procedure_code === 'MN001A') {
    computedBase = 1000 * Math.max(bedDays, 1);
    breakdown.push(`Neonatal care @ ₹1,000/day × ${Math.max(bedDays, 1)} days = ₹${computedBase.toLocaleString('en-IN')}`);
  } else if (procedure.procedure_code === 'PE009A') {
    computedBase = 2500 * Math.max(bedDays, 1);
    breakdown.push(`Pediatric PICU/ward care @ ₹2,500/day × ${Math.max(bedDays, 1)} days = ₹${computedBase.toLocaleString('en-IN')}`);
  } else if (procedure.procedure_code === 'ID003A' || procedure.procedure_code === 'MM001A') {
    computedBase = baseNum * Math.max(bedDays, 1);
    breakdown.push(`Routine ward @ ₹${baseNum}/day × ${Math.max(bedDays, 1)} days = ₹${computedBase.toLocaleString('en-IN')}`);
  } else {
    breakdown.push(`Base Tariff (Tier 3): ₹${baseNum.toLocaleString('en-IN')}`);
  }

  // Procedure cost with city tier + accreditation + multi-procedure sequence
  const adjustedProcedureCost = Math.round(computedBase * tierMultiplier * accreditationMultiplier * multiProcedureMultiplier);

  if (tierMultiplier > 1) {
    breakdown.push(`City Tier adjustment (${TIER_CONFIG[tier].label}): ×${tierMultiplier}`);
  }
  if (accreditationMultiplier > 1) {
    breakdown.push(`Quality Accreditation (${ACCREDITATION_CONFIG[accreditation].label}): ×${accreditationMultiplier}`);
  }
  if (multiProcedureMultiplier < 1) {
    breakdown.push(`Multi-Procedure Rule (Procedure #${sequenceIndex + 1}): ×${multiProcedureMultiplier * 100}%`);
  }

  if (implantCost > 0) {
    breakdown.push(`Mapped Implant Cost (Fixed, Non-Discounted): ₹${implantCost.toLocaleString('en-IN')}`);
  }

  const totalCost = adjustedProcedureCost + implantCost;

  return {
    baseAmount: computedBase,
    tierMultiplier,
    accreditationMultiplier,
    multiProcedureMultiplier,
    procedureCost: adjustedProcedureCost,
    implantCost,
    totalCost,
    breakdown
  };
}
