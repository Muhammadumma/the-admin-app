export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'STUDENT';

export type ClearanceStageKey =
  | 'admission'
  | 'library'
  | 'faculty'
  | 'bursary'
  | 'sports'
  | 'accommodation'
  | 'student_affairs'
  | 'graduation';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type ClearanceOverallStatus = 'not_started' | 'in_progress' | 'awaiting_review' | 'completed';
export type StageReviewStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  assignedStage?: ClearanceStageKey | string;
  active: boolean;
  createdAt: string;
}

export interface ClearanceStage {
  id: ClearanceStageKey;
  name: string;
  order: number;
  active: boolean;
  description: string;
  iconName?: string;
  color?: string;
}

export interface Requirement {
  id: string;
  stageId: ClearanceStageKey;
  name: string;
  description?: string;
  required: boolean;
  allowedFileTypes: string[];
  maxFileSize: number; // in MB
  active: boolean;
  createdAt?: string;
}

export interface StudentRecord {
  id: string;
  uid?: string;
  name: string;
  matricNumber: string;
  email: string;
  departmentId: string;
  departmentName: string;
  level: string; // e.g. "ND II", "HND II", "400 Level", "Final Year"
  session: string; // e.g. "2025/2026"
  clearanceStatus: ClearanceOverallStatus;
  currentStage: ClearanceStageKey;
  progressPercent: number; // 0 to 100
  stagesStatus: Record<ClearanceStageKey, StageReviewStatus>;
  active: boolean;
  createdAt: string;
  photoUrl?: string;
  phoneNumber?: string;
}

export interface StaffRecord {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  assignedStage: ClearanceStageKey;
  active: boolean;
  createdAt: string;
  phone?: string;
}

export interface SubmissionRecord {
  id: string;
  studentId: string;
  studentName: string;
  matricNumber: string;
  departmentName: string;
  requirementId: string;
  requirementName: string;
  stageId: ClearanceStageKey;
  stageName: string;
  fileUrl: string;
  fileName: string;
  fileType: string; // 'pdf' | 'png' | 'jpeg' | 'jpg'
  fileSize: number; // in bytes or KB
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  rejectionReason?: string;
  reviewComment?: string;
  rejectionHistory?: Array<{
    reason: string;
    comment: string;
    rejectedAt: string;
    reviewerName: string;
  }>;
}

export interface NotificationRecord {
  id: string;
  userId?: string;
  studentId: string;
  title: string;
  message: string;
  type: 'approval' | 'rejection' | 'submission' | 'system';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action:
    | 'STAFF_CREATED'
    | 'STAFF_UPDATED'
    | 'STAFF_DEACTIVATED'
    | 'DOCUMENT_APPROVED'
    | 'DOCUMENT_REJECTED'
    | 'REQUIREMENT_CREATED'
    | 'REQUIREMENT_UPDATED'
    | 'REQUIREMENT_DEACTIVATED'
    | 'STAGE_UPDATED'
    | 'USER_PERMISSION_CHANGED'
    | 'SYSTEM_SETTINGS_UPDATED'
    | 'DATABASE_INITIALIZED';
  targetType: 'SUBMISSION' | 'STAFF' | 'REQUIREMENT' | 'STAGE' | 'STUDENT' | 'SYSTEM';
  targetId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface SystemSettings {
  institutionName: string;
  academicSession: string;
  clearanceSystemStatus: 'ACTIVE' | 'PAUSED';
  contactEmail?: string;
  superAdminEmail?: string;
  lastUpdated?: string;
}

export interface ClearanceStats {
  totalStudents: number;
  completed: number;
  inProgress: number;
  awaitingReview: number;
  stageStats: Record<
    ClearanceStageKey,
    {
      total: number;
      completed: number;
      pending: number;
      rejected: number;
      completionRate: number;
    }
  >;
}
