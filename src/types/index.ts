export type UserRole = 'student' | 'election_officer' | 'auditor' | 'admin';
export type UserScope = 'university' | 'faculty' | 'department';
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended';
export type ElectionStatus = 'draft' | 'published' | 'active' | 'paused' | 'closed' | 'results_published';
export type ElectionCategory = 'university' | 'faculty' | 'department';
export type CandidateStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'successful' | 'failed';

export interface Faculty {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  faculty_id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentRecord {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  faculty_id?: string;
  department_id?: string;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  username?: string;
  profile_image_url?: string;
  student_record_id?: string;
  faculty_id?: string;
  department_id?: string;
  scope?: UserScope;
  is_email_verified: boolean;
  is_face_enrolled: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface RegisterData {
  studentId: string;
  facultyId: string;
  departmentId: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Election-related types
export interface Election {
  id: string;
  officer_id: string;
  title: string;
  description?: string;
  academic_year: string;
  category: ElectionCategory;
  scope_id?: string;
  status: ElectionStatus;
  nomination_start?: string;
  nomination_end?: string;
  voting_start: string;
  voting_end: string;
  slot_application_fee: number;
  enable_payment: boolean;
  total_voters: number;
  total_votes_cast: number;
  created_at: string;
  updated_at: string;
}

export interface ElectionPosition {
  id: string;
  election_id: string;
  position_name: string;
  description?: string;
  number_of_winners: number;
  display_order?: number;
  application_opening?: string;
  application_closing?: string;
  application_fee?: number;
  max_applicants?: number;
  is_enabled?: boolean;
  status?: 'draft' | 'published' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface ElectionCandidate {
  id: string;
  election_id: string;
  user_id: string;
  position_id: string;
  student_record_id?: string;
  application_status: CandidateStatus;
  rejection_reason?: string;
  manifesto?: string;
  profile_image_url?: string;
  payment_status: PaymentStatus;
  is_visible_for_voting: boolean;
  submission_date: string;
  approval_date?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ElectionPayment {
  id: string;
  election_id: string;
  candidate_id: string;
  amount: number;
  payment_status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  reference_number?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ElectionVoter {
  id: string;
  election_id: string;
  student_record_id: string;
  user_id?: string;
  has_voted: boolean;
  voted_at?: string;
  created_at: string;
}

export interface ElectionVote {
  id: string;
  election_id: string;
  voter_id?: string;
  candidate_id: string;
  position_id: string;
  vote_timestamp: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details?: string;
  title?: string;
  message?: string;
  actor?: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  created_at: string;
  updated_at: string;
}

export interface SecurityEvent {
  id: string;
  title: string;
  message?: string;
  source?: string;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface ElectionStats {
  totalVoters: number;
  totalVotesCast: number;
  turnoutPercentage: number;
  candidatesApproved: number;
  candidatesRejected: number;
  pendingPayments: number;
  successfulPayments: number;
  failedPayments: number;
}
