export type StudentStatus = 'upcoming' | 'in_progress' | 'completed';

export type TrainingStatus = 'upcoming' | 'in_progress' | 'completed';

export type DocumentStage = 'before' | 'during' | 'after';

export type DocumentType =
  | 'contract'
  | 'signed_quote'
  | 'training_program_doc'
  | 'signed_rules'
  | 'attendance_sheets'
  | 'training_materials'
  | 'skills_assessment'
  | 'satisfaction_survey'
  | 'completion_certificate'
  | 'invoice';

export interface Student {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  instagram_username?: string;
  email?: string;
  phone?: string;
  training_start_date: string;
  training_end_date: string;
  training_level?: string;
  formation_id?: string;
  photo_url?: string;
  status: StudentStatus;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgram {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentTraining {
  id: string;
  student_id: string;
  training_program_id: string;
  training_date: string;
  status: TrainingStatus;
  created_at: string;
  updated_at: string;
}

export interface StudentDocument {
  id: string;
  student_id: string;
  document_type: DocumentType;
  document_stage: DocumentStage;
  file_path: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface StudentWithDetails extends Student {
  trainings?: (StudentTraining & { training_program?: TrainingProgram })[];
  documents?: StudentDocument[];
  missing_documents_count?: number;
}

export interface TrainingDashboardStats {
  total_students_trained: number;
  trainings_in_progress: number;
  trainings_completed: number;
  upcoming_students: number;
  incomplete_folders: number;
}

export const DOCUMENT_TYPES_BY_STAGE: Record<DocumentStage, { type: DocumentType; label: string }[]> = {
  before: [
    { type: 'contract', label: 'Contrat / Convention de formation' },
    { type: 'signed_quote', label: 'Devis signé' },
    { type: 'training_program_doc', label: 'Programme de formation' },
    { type: 'signed_rules', label: 'Règlement intérieur signé' },
  ],
  during: [
    { type: 'attendance_sheets', label: "Feuilles d'émargement" },
    { type: 'training_materials', label: 'Supports de formation' },
    { type: 'skills_assessment', label: 'Évaluation des acquis' },
    { type: 'satisfaction_survey', label: 'Questionnaire de satisfaction' },
  ],
  after: [
    { type: 'completion_certificate', label: 'Attestation de fin de formation' },
    { type: 'invoice', label: 'Facture' },
  ],
};

export const ALL_REQUIRED_DOCUMENT_TYPES = Object.values(DOCUMENT_TYPES_BY_STAGE).flat().map(d => d.type);
