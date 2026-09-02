import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import {
  ClearanceStage,
  Requirement,
  StudentRecord,
  StaffRecord,
  SubmissionRecord,
  NotificationRecord,
  AuditLogRecord,
  SystemSettings,
  ClearanceStats,
  ClearanceStageKey,
  STAGE_ORDER,
  STAGE_MAPPING_NUMERICAL,
  STAGE_MAPPING_STRING,
} from '../types';
import {
  INITIAL_STAGES,
  INITIAL_REQUIREMENTS,
  INITIAL_STUDENTS,
  INITIAL_STAFF,
  INITIAL_SUBMISSIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SETTINGS,
} from '../services/seedData';
import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  handleFirestoreError,
  testFirestoreConnection,
  OperationType,
} from '../lib/firestoreUtils';
import {
  uploadFileToGitHub,
  uploadDataUriToGitHub,
} from '../services/githubStorageService';

interface DataContextType {
  stages: ClearanceStage[];
  requirements: Requirement[];
  students: StudentRecord[];
  submissions: SubmissionRecord[];
  staffList: StaffRecord[];
  notifications: NotificationRecord[];
  auditLogs: AuditLogRecord[];
  settings: SystemSettings;
  stats: ClearanceStats;
  isLoading: boolean;
  isFirestoreLive: boolean;
  error: string | null;
  // Actions
  approveSubmission: (
    submissionId: string,
    reviewerId: string,
    reviewerName: string,
    comment?: string
  ) => Promise<boolean>;
  rejectSubmission: (
    submissionId: string,
    reviewerId: string,
    reviewerName: string,
    reason: string,
    comment: string
  ) => Promise<boolean>;
  addStaff: (
    staffData: Omit<StaffRecord, 'id' | 'createdAt'>,
    actorId: string,
    actorName: string,
    actorRole: any
  ) => Promise<boolean>;
  addStaffUser: (
    staffData: Omit<StaffRecord, 'id' | 'createdAt'>,
    actorId?: string,
    actorName?: string,
    actorRole?: any
  ) => Promise<boolean>;
  toggleStaffStatus: (
    staffId: string,
    actorId?: string,
    actorName?: string,
    actorRole?: any
  ) => Promise<boolean>;
  addRequirement: (
    reqData: Omit<Requirement, 'id' | 'createdAt'>,
    actorId?: string,
    actorName?: string,
    actorRole?: any
  ) => Promise<boolean>;
  updateRequirement: (
    reqId: string,
    updates: Partial<Requirement>,
    actorId?: string,
    actorName?: string,
    actorRole?: any
  ) => Promise<boolean>;
  toggleRequirementActive: (
    reqId: string,
    actorId?: string,
    actorName?: string,
    actorRole?: any
  ) => Promise<boolean>;
  addStudent: (
    studentData: Omit<StudentRecord, 'id' | 'createdAt'>,
    actorId?: string,
    actorName?: string,
    actorRole?: any
  ) => Promise<boolean>;
  submitDocument: (
    submissionData: Omit<SubmissionRecord, 'id' | 'submittedAt'>
  ) => Promise<boolean>;
  updateSettings: (
    newSettings: Partial<SystemSettings>,
    actorId?: string,
    actorName?: string,
    actorRole?: any
  ) => Promise<boolean>;
  markNotificationRead: (notifId: string) => Promise<void>;
  wipeAllSubmissions: (actorId?: string, actorName?: string, actorRole?: any) => Promise<boolean>;
  resetToDemoData: (actorId?: string, actorName?: string, actorRole?: any) => Promise<void>;
  resetToSeedData: (actorId?: string, actorName?: string, actorRole?: any) => Promise<void>;
  seedFirestoreIfEmpty: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stages, setStages] = useState<ClearanceStage[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);

  const [isLoading, setIsLoading] = useState(true);
  const [isFirestoreLive, setIsFirestoreLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to purge all mock test data (submissions & students) from Firestore
  const purgeMockSubmissionsFromFirestore = async () => {
    try {
      // 1. Purge mock submissions (identified by legacy IDs or unsplash URLs)
      const subsSnap = await getDocs(collection(db, 'submissions'));
      if (!subsSnap.empty) {
        const batch = writeBatch(db);
        let count = 0;
        subsSnap.docs.forEach((d) => {
          const data = d.data();
          if (
            d.id.startsWith('sub_') ||
            (data.fileUrl && data.fileUrl.includes('unsplash.com'))
          ) {
            batch.delete(d.ref);
            count++;
          }
        });
        if (count > 0) {
          await batch.commit();
          console.log(`Purged ${count} mock submissions from Firestore.`);
        }
      }

      // 2. Purge mock students (std_001 through std_008)
      const mockStudentIds = [
        'std_001', 'std_002', 'std_003', 'std_004',
        'std_005', 'std_006', 'std_007', 'std_008',
      ];
      const studBatch = writeBatch(db);
      let studCount = 0;
      for (const id of mockStudentIds) {
        studBatch.delete(doc(db, 'students', id));
        studCount++;
      }
      await studBatch.commit();
      if (studCount > 0) {
        console.log(`Purged ${studCount} mock student records from Firestore.`);
      }
    } catch (e) {
      console.warn('Purge mock data note:', e);
    }
  };

  // Helper to ensure stage matrix order and descriptions in Firestore stay in sync
  const syncStagesToFirestore = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_STAGES.forEach((stage) => {
        batch.set(doc(db, 'clearanceStages', stage.id), stage, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Sync stages to Firestore note:', e);
    }
  };

  // Helper to populate initial Firestore collections if empty (stages, requirements, staff only - NO mock submissions)
  const seedFirestoreIfEmpty = async () => {
    try {
      const stagesSnap = await getDocs(collection(db, 'clearanceStages'));
      if (stagesSnap.empty) {
        console.log('Populating initial Firestore database records (policies & staff only)...');
        const batch = writeBatch(db);

        // 1. Stages
        INITIAL_STAGES.forEach((stage) => {
          batch.set(doc(db, 'clearanceStages', stage.id), stage);
        });

        // 2. Requirements
        INITIAL_REQUIREMENTS.forEach((req) => {
          batch.set(doc(db, 'requirements', req.id), req);
        });

        // 3. Administrative Staff
        INITIAL_STAFF.forEach((staff) => {
          batch.set(doc(db, 'staff', staff.id), staff);
          batch.set(doc(db, 'users', staff.id), {
            uid: staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            departmentId: staff.departmentId,
            departmentName: staff.departmentName,
            assignedStage: staff.assignedStage,
            active: staff.active,
            createdAt: staff.createdAt,
          });
        });

        // 4. System Settings
        batch.set(doc(db, 'systemSettings', 'global'), INITIAL_SETTINGS);

        await batch.commit();
        console.log('Firestore seed commit successful (0 mock submissions).');
      } else {
        await syncStagesToFirestore();
      }
    } catch (err) {
      console.warn('Seed Firestore error (fallback active):', err);
    }
  };

  // Setup live real-time Firestore listeners
  useEffect(() => {
    let unsubscribeStages: () => void = () => {};
    let unsubscribeReqs: () => void = () => {};
    let unsubscribeStudents: () => void = () => {};
    let unsubscribeSubmissions: () => void = () => {};
    let unsubscribeStaff: () => void = () => {};
    let unsubscribeNotifs: () => void = () => {};
    let unsubscribeAudits: () => void = () => {};
    let unsubscribeSettings: () => void = () => {};

    const initializeFirestoreSync = async () => {
      setIsLoading(true);
      setError(null);

      // Validate connection
      const isOnline = await testFirestoreConnection();
      if (isOnline) {
        setIsFirestoreLive(true);
      }

      try {
        await seedFirestoreIfEmpty();
        await purgeMockSubmissionsFromFirestore();

        // 1. Stages listener
        unsubscribeStages = onSnapshot(
          collection(db, 'clearanceStages'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded = snapshot.docs.map((d) => d.data() as ClearanceStage);
              loaded.sort((a, b) => a.order - b.order);
              setStages(loaded);
              setIsFirestoreLive(true);
            }
          },
          (err) => {
            console.warn('Stages listener error:', err);
          }
        );

        // 2. Requirements listener
        unsubscribeReqs = onSnapshot(
          collection(db, 'requirements'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded = snapshot.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Requirement, 'id'>),
              }));
              setRequirements(loaded);
              setIsFirestoreLive(true);
            }
          },
          (err) => {
            console.warn('Requirements listener error:', err);
          }
        );

        // 3. Students listener (listens to students and jsp_students)
        const normalizeStudent = (dId: string, data: any): StudentRecord => {
          const name = data.fullName || data.name || 'Student';
          const matric = data.matricNumber || data.studentId || dId;
          const stagesStatus: Record<ClearanceStageKey, any> = {
            admission: 'not_started',
            faculty: 'not_started',
            bursary: 'not_started',
            library: 'not_started',
            sports: 'not_started',
            student_affairs: 'not_started',
            accommodation: 'not_started',
            graduation: 'not_started',
            ...(data.stagesStatus || {}),
          };

          if (Array.isArray(data.stages)) {
            data.stages.forEach((st: any) => {
              const key = STAGE_MAPPING_STRING[st.id || st.stageNumber];
              if (key) {
                if (st.status === 'COMPLETED' || st.documentStatus === 'APPROVED') {
                  stagesStatus[key] = 'approved';
                } else if (st.status === 'ACTION_REQUIRED' || st.documentStatus === 'REJECTED') {
                  stagesStatus[key] = 'rejected';
                } else if (st.status === 'PENDING' || st.documentStatus === 'PENDING_REVIEW') {
                  stagesStatus[key] = 'pending';
                }
              }
            });
          }

          const approvedCount = Object.values(stagesStatus).filter((s) => s === 'approved').length;
          const progressPercent =
            typeof data.progressPercent === 'number'
              ? data.progressPercent
              : Math.round((approvedCount / 8) * 100);

          const currentIndex = STAGE_ORDER.findIndex((s) => stagesStatus[s] !== 'approved');
          const currentStage = currentIndex === -1 ? 'graduation' : STAGE_ORDER[currentIndex];

          return {
            id: dId,
            uid: data.uid || dId,
            name,
            matricNumber: matric,
            email:
              data.email ||
              `${matric.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@student.jisp.edu.ng`,
            departmentId: data.departmentId || 'dept_1',
            departmentName: data.department || data.departmentName || 'Computer Science',
            level: data.level || 'ND II',
            session: data.session || '2024/2025',
            clearanceStatus:
              approvedCount === 8
                ? 'completed'
                : data.clearanceStatus || (approvedCount > 0 ? 'in_progress' : 'not_started'),
            currentStage,
            progressPercent,
            stagesStatus,
            active: data.active !== false,
            createdAt: data.createdAt || data.registrationDate || new Date().toISOString(),
            phoneNumber: data.phoneNumber || data.phone,
          };
        };

        unsubscribeStudents = onSnapshot(
          collection(db, 'students'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded = snapshot.docs.map((d) => normalizeStudent(d.id, d.data()));
              setStudents(loaded);
              setIsFirestoreLive(true);
            } else {
              setStudents([]);
            }
          },
          (err) => {
            console.warn('Students listener error:', err);
          }
        );

        // 4. Submissions listener
        unsubscribeSubmissions = onSnapshot(
          collection(db, 'submissions'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded = snapshot.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<SubmissionRecord, 'id'>),
              }));
              setSubmissions(loaded);
              setIsFirestoreLive(true);
            } else {
              setSubmissions([]);
            }
          },
          (err) => {
            console.warn('Submissions listener error:', err);
          }
        );

        // 5. Staff listener
        unsubscribeStaff = onSnapshot(
          collection(db, 'staff'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded = snapshot.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<StaffRecord, 'id'>),
              }));
              setStaffList(loaded);
              setIsFirestoreLive(true);
            }
          },
          (err) => {
            console.warn('Staff listener error:', err);
          }
        );

        // 6. Notifications listener
        unsubscribeNotifs = onSnapshot(
          collection(db, 'notifications'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded = snapshot.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<NotificationRecord, 'id'>),
              }));
              loaded.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              setNotifications(loaded);
              setIsFirestoreLive(true);
            } else {
              setNotifications([]);
            }
          },
          (err) => {
            console.warn('Notifications listener error:', err);
          }
        );

        // 7. Audit Logs listener
        unsubscribeAudits = onSnapshot(
          collection(db, 'auditLogs'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded = snapshot.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<AuditLogRecord, 'id'>),
              }));
              loaded.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              setAuditLogs(loaded);
              setIsFirestoreLive(true);
            }
          },
          (err) => {
            console.warn('Audit logs listener error:', err);
          }
        );

        // 8. Settings listener
        unsubscribeSettings = onSnapshot(
          doc(db, 'systemSettings', 'global'),
          (snapshot) => {
            if (snapshot.exists()) {
              setSettings(snapshot.data() as SystemSettings);
              setIsFirestoreLive(true);
            }
          },
          (err) => {
            console.warn('Settings listener error:', err);
          }
        );
      } catch (err: any) {
        console.error('Error establishing Firestore sync:', err);
        setError(err?.message || 'Firestore connection issue');
      } finally {
        setIsLoading(false);
      }
    };

    initializeFirestoreSync();

    return () => {
      unsubscribeStages();
      unsubscribeReqs();
      unsubscribeStudents();
      unsubscribeSubmissions();
      unsubscribeStaff();
      unsubscribeNotifs();
      unsubscribeAudits();
      unsubscribeSettings();
    };
  }, []);

  // Compute live clearance statistics across stages
  const stats: ClearanceStats = useMemo(() => {
    const totalStudents = students.length;
    let completed = 0;
    let inProgress = 0;
    let awaitingReview = 0;

    const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
    awaitingReview = pendingSubmissions.length;

    students.forEach((s) => {
      if (s.clearanceStatus === 'completed') {
        completed++;
      } else {
        inProgress++;
      }
    });

    const stageStats: Record<
      ClearanceStageKey,
      { total: number; completed: number; pending: number; rejected: number; completionRate: number }
    > = {} as any;

    const currentStages = stages.length > 0 ? stages : INITIAL_STAGES;

    currentStages.forEach((stage) => {
      const stageSubs = submissions.filter((s) => s.stageId === stage.id);
      const subPending = stageSubs.filter((s) => s.status === 'pending').length;
      const subApproved = stageSubs.filter((s) => s.status === 'approved').length;
      const subRejected = stageSubs.filter((s) => s.status === 'rejected').length;

      let stdCompleted = 0;
      let stdPending = 0;
      let stdRejected = 0;

      students.forEach((student) => {
        const st = student.stagesStatus?.[stage.id as ClearanceStageKey];
        if (st === 'approved') stdCompleted++;
        else if (st === 'pending') stdPending++;
        else if (st === 'rejected') stdRejected++;
      });

      const stagePending = Math.max(subPending, stdPending);
      const stageCompleted = Math.max(subApproved, stdCompleted);
      const stageRejected = Math.max(subRejected, stdRejected);

      const totalEffective = Math.max(
        totalStudents,
        stagePending + stageCompleted + stageRejected
      );
      const completionRate =
        totalEffective > 0 ? Math.round((stageCompleted / totalEffective) * 100) : 0;

      stageStats[stage.id as ClearanceStageKey] = {
        total: totalEffective,
        completed: stageCompleted,
        pending: stagePending,
        rejected: stageRejected,
        completionRate,
      };
    });

    return {
      totalStudents,
      completed,
      inProgress,
      awaitingReview,
      stageStats,
    };
  }, [students, submissions, stages]);

  // Record audit log helper directly to Firestore
  const addAuditLogInDb = async (log: Omit<AuditLogRecord, 'id' | 'createdAt'>) => {
    const logId = 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newLog: AuditLogRecord = {
      ...log,
      id: logId,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'auditLogs', logId), newLog);
    } catch (error) {
      console.warn('Direct audit log write error:', error);
      // Fallback local update
      setAuditLogs((prev) => [newLog, ...prev]);
    }
  };

  // Helper to cross-sync review status to student portal collections (jsp_documents and jsp_clearance_records)
  const crossSyncReviewToStudentPortal = async (
    targetSub: SubmissionRecord,
    isApproved: boolean,
    reviewerName: string,
    comment?: string,
    reason?: string
  ) => {
    const now = new Date().toISOString();
    const numStageId = STAGE_MAPPING_NUMERICAL[targetSub.stageId] || 1;

    // 1. Cross-sync to jsp_documents
    try {
      const directDocRef = doc(db, 'jsp_documents', targetSub.id);
      const directDocSnap = await getDoc(directDocRef);
      if (directDocSnap.exists()) {
        await updateDoc(directDocRef, {
          status: isApproved ? 'APPROVED' : 'REJECTED',
          remarks: comment || reason || (isApproved ? 'Verified and Approved' : 'Rejected'),
          rejectionReason: !isApproved ? reason || comment : null,
          reviewedAt: now,
          reviewedBy: reviewerName,
        });
      }

      const qUid = query(
        collection(db, 'jsp_documents'),
        where('studentUid', '==', targetSub.studentId)
      );
      const snapUid = await getDocs(qUid);
      for (const d of snapUid.docs) {
        const dData = d.data();
        if (dData.stageId === numStageId || dData.stageTitle === targetSub.stageName) {
          await updateDoc(d.ref, {
            status: isApproved ? 'APPROVED' : 'REJECTED',
            remarks: comment || reason || (isApproved ? 'Verified and Approved' : 'Rejected'),
            rejectionReason: !isApproved ? reason || comment : null,
            reviewedAt: now,
            reviewedBy: reviewerName,
          });
        }
      }
    } catch (e) {
      console.warn('jsp_documents cross-update note:', e);
    }

    // 2. Cross-sync to jsp_clearance_records
    try {
      const possibleKeys = Array.from(
        new Set(
          [
            targetSub.studentId,
            targetSub.matricNumber,
            targetSub.matricNumber?.replace(/\//g, '_'),
          ].filter(Boolean)
        )
      );

      for (const docKey of possibleKeys) {
        const recRef = doc(db, 'jsp_clearance_records', docKey);
        const recSnap = await getDoc(recRef);
        if (recSnap.exists()) {
          const recData = recSnap.data();
          let stages = Array.isArray(recData.stages) ? [...recData.stages] : [];

          stages = stages.map((st: any) => {
            if (st.id === numStageId || st.stageNumber === numStageId) {
              return {
                ...st,
                status: isApproved ? 'COMPLETED' : 'ACTION_REQUIRED',
                documentStatus: isApproved ? 'APPROVED' : 'REJECTED',
                approvalDate: isApproved ? new Date(now).toLocaleDateString() : null,
                rejectionReason: !isApproved
                  ? reason || comment || 'Document requires re-submission'
                  : null,
                isActionRequired: !isApproved,
                actionButtonText: !isApproved ? 'Re-upload Now' : null,
              };
            }
            if (
              isApproved &&
              (st.id === numStageId + 1 || st.stageNumber === numStageId + 1) &&
              st.status === 'LOCKED'
            ) {
              return {
                ...st,
                status: 'READY',
                actionButtonText: 'Start Clearance',
              };
            }
            return st;
          });

          const completedCount = stages.filter((s: any) => s.status === 'COMPLETED').length;
          const isFullyCleared = completedCount === 8;

          const activities = Array.isArray(recData.activities) ? [...recData.activities] : [];
          activities.unshift({
            id: 'act_' + Date.now(),
            title: `${targetSub.stageName} ${isApproved ? 'Approved' : 'Rejected'}`,
            description: `${isApproved ? 'Verified' : 'Rejected'} by clearance officer ${reviewerName}. ${comment || reason || ''}`.trim(),
            timeAgo: 'Just now',
            status: isApproved ? 'COMPLETED' : 'ACTION_REQUIRED',
            stageId: numStageId,
          });

          const alerts = Array.isArray(recData.alerts) ? [...recData.alerts] : [];
          alerts.unshift({
            id: 'alt_' + Date.now(),
            title: `${targetSub.stageName} Clearance ${isApproved ? 'Approved' : 'Action Required'}`,
            description: isApproved
              ? `Your ${targetSub.requirementName} has been verified and approved by ${reviewerName}.`
              : `Your ${targetSub.requirementName} was rejected: ${reason || comment}. Please re-upload.`,
            timeAgo: 'Just now',
            isUrgent: !isApproved,
            isRead: false,
            stageId: numStageId,
          });

          await setDoc(
            recRef,
            {
              stages,
              completedCount,
              isFullyCleared,
              activities: activities.slice(0, 30),
              alerts: alerts.slice(0, 30),
              lastUpdated: now,
              timestamp: Date.now(),
            },
            { merge: true }
          );
        }
      }
    } catch (e) {
      console.warn('jsp_clearance_records cross-update note:', e);
    }
  };

  // 1. Approve Submission Workflow
  const approveSubmission = async (
    submissionId: string,
    reviewerId: string,
    reviewerName: string,
    comment?: string
  ): Promise<boolean> => {
    try {
      const targetSub = submissions.find((s) => s.id === submissionId);
      if (!targetSub) return false;

      const now = new Date().toISOString();
      const updatedSubmissionData = {
        status: 'approved' as const,
        reviewedAt: now,
        reviewedBy: reviewerId,
        reviewerName,
        reviewComment: comment || 'Document verified and approved on Remita ledger.',
      };

      // 1. Update submission in Firestore
      try {
        await updateDoc(doc(db, 'submissions', submissionId), updatedSubmissionData);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `submissions/${submissionId}`);
      }

      // 2. Cross-sync to Student Portal records (jsp_documents & jsp_clearance_records)
      await crossSyncReviewToStudentPortal(targetSub, true, reviewerName, comment);

      // 3. Update Student stage status & progress
      const studentId = targetSub.studentId;
      const stageId = targetSub.stageId;
      const targetStudent = students.find((s) => s.id === studentId);

      if (targetStudent) {
        const updatedStagesStatus = {
          ...targetStudent.stagesStatus,
          [stageId]: 'approved' as const,
        };

        const approvedCount = Object.values(updatedStagesStatus).filter(
          (st) => st === 'approved'
        ).length;
        const progressPercent = Math.round((approvedCount / 8) * 100);
        const isAllCompleted = approvedCount === 8;

        const currentIndex = STAGE_ORDER.indexOf(stageId);
        const nextStage =
          currentIndex < STAGE_ORDER.length - 1
            ? STAGE_ORDER[currentIndex + 1]
            : STAGE_ORDER[STAGE_ORDER.length - 1];

        const updatedStudentData = {
          stagesStatus: updatedStagesStatus,
          progressPercent,
          clearanceStatus: isAllCompleted ? ('completed' as const) : ('in_progress' as const),
          currentStage: isAllCompleted ? 'graduation' : nextStage,
        };

        try {
          await updateDoc(doc(db, 'students', studentId), updatedStudentData);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `students/${studentId}`);
        }
      }

      // 4. Create Student Notification in Firestore
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newNotif: NotificationRecord = {
        id: notifId,
        studentId,
        title: `${targetSub.stageName} Document Approved`,
        message: `Your ${targetSub.requirementName} has been approved by ${reviewerName}.`,
        type: 'approval',
        read: false,
        createdAt: now,
      };

      try {
        await setDoc(doc(db, 'notifications', notifId), newNotif);
      } catch (err) {
        console.warn('Notification write error:', err);
      }

      // 5. Record Audit Log
      await addAuditLogInDb({
        actorId: reviewerId,
        actorName: reviewerName,
        actorRole: 'STAFF',
        action: 'DOCUMENT_APPROVED',
        targetType: 'SUBMISSION',
        targetId: submissionId,
        metadata: {
          studentName: targetSub.studentName,
          matricNumber: targetSub.matricNumber,
          stage: targetSub.stageName,
          requirement: targetSub.requirementName,
          comment: comment || 'Approved',
        },
      });

      return true;
    } catch (err) {
      console.error('Approval failed:', err);
      return false;
    }
  };

  // 2. Reject Submission Workflow
  const rejectSubmission = async (
    submissionId: string,
    reviewerId: string,
    reviewerName: string,
    reason: string,
    comment: string
  ): Promise<boolean> => {
    try {
      const targetSub = submissions.find((s) => s.id === submissionId);
      if (!targetSub) return false;

      const now = new Date().toISOString();

      // 1. Update submission record in Firestore
      const updatedSubmissionData = {
        status: 'rejected' as const,
        reviewedAt: now,
        reviewedBy: reviewerId,
        reviewerName,
        rejectionReason: reason,
        reviewComment: comment,
      };

      try {
        await updateDoc(doc(db, 'submissions', submissionId), updatedSubmissionData);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `submissions/${submissionId}`);
      }

      // 2. Cross-sync to Student Portal records (jsp_documents & jsp_clearance_records)
      await crossSyncReviewToStudentPortal(targetSub, false, reviewerName, comment, reason);

      // 3. Update student stage status in Firestore
      const targetStudent = students.find((s) => s.id === targetSub.studentId);
      if (targetStudent) {
        const updatedStudentData = {
          stagesStatus: {
            ...targetStudent.stagesStatus,
            [targetSub.stageId]: 'rejected' as const,
          },
        };
        try {
          await updateDoc(doc(db, 'students', targetSub.studentId), updatedStudentData);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `students/${targetSub.studentId}`);
        }
      }

      // 4. Create Student Notification
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newNotif: NotificationRecord = {
        id: notifId,
        studentId: targetSub.studentId,
        title: `${targetSub.stageName} Document Rejected`,
        message: `Your ${targetSub.requirementName} was rejected: ${reason}. Please review notes and re-upload.`,
        type: 'rejection',
        read: false,
        createdAt: now,
      };

      try {
        await setDoc(doc(db, 'notifications', notifId), newNotif);
      } catch (err) {
        console.warn('Notification write error:', err);
      }

      // 5. Record Audit Log
      await addAuditLogInDb({
        actorId: reviewerId,
        actorName: reviewerName,
        actorRole: 'STAFF',
        action: 'DOCUMENT_REJECTED',
        targetType: 'SUBMISSION',
        targetId: submissionId,
        metadata: {
          studentName: targetSub.studentName,
          matricNumber: targetSub.matricNumber,
          stage: targetSub.stageName,
          requirement: targetSub.requirementName,
          reason,
          comment,
        },
      });

      return true;
    } catch (err) {
      console.error('Rejection failed:', err);
      return false;
    }
  };

  // 3. Staff Management Actions
  const addStaff = async (
    staffData: Omit<StaffRecord, 'id' | 'createdAt'>,
    actorId: string,
    actorName: string,
    actorRole: any
  ): Promise<boolean> => {
    try {
      const staffId = 'staff_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newStaff: StaffRecord = {
        ...staffData,
        id: staffId,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'staff', staffId), newStaff);
        // Also ensure user profile document exists
        await setDoc(doc(db, 'users', staffId), {
          uid: staffId,
          name: newStaff.name,
          email: newStaff.email,
          role: newStaff.role,
          departmentId: newStaff.departmentId,
          departmentName: newStaff.departmentName,
          assignedStage: newStaff.assignedStage,
          active: newStaff.active,
          createdAt: newStaff.createdAt,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `staff/${staffId}`);
      }

      await addAuditLogInDb({
        actorId,
        actorName,
        actorRole,
        action: 'STAFF_CREATED',
        targetType: 'STAFF',
        targetId: staffId,
        metadata: {
          name: newStaff.name,
          email: newStaff.email,
          role: newStaff.role,
          assignedStage: newStaff.assignedStage,
        },
      });
      return true;
    } catch (e) {
      console.error('Add staff failed:', e);
      return false;
    }
  };

  const toggleStaffStatus = async (
    staffId: string,
    actorId: string,
    actorName: string,
    actorRole: any
  ): Promise<boolean> => {
    try {
      const targetStaff = staffList.find((s) => s.id === staffId);
      if (!targetStaff) return false;

      const newActiveState = !targetStaff.active;

      try {
        await updateDoc(doc(db, 'staff', staffId), { active: newActiveState });
        await updateDoc(doc(db, 'users', staffId), { active: newActiveState });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `staff/${staffId}`);
      }

      await addAuditLogInDb({
        actorId,
        actorName,
        actorRole,
        action: newActiveState ? 'STAFF_UPDATED' : 'STAFF_DEACTIVATED',
        targetType: 'STAFF',
        targetId: staffId,
        metadata: {
          staffName: targetStaff.name,
          status: newActiveState ? 'ACTIVE' : 'DEACTIVATED',
        },
      });
      return true;
    } catch (e) {
      console.error('Toggle staff status failed:', e);
      return false;
    }
  };

  // 4. Requirements Management Actions
  const addRequirement = async (
    reqData: Omit<Requirement, 'id' | 'createdAt'>,
    actorId: string,
    actorName: string,
    actorRole: any
  ): Promise<boolean> => {
    try {
      const reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newReq: Requirement = {
        ...reqData,
        id: reqId,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'requirements', reqId), newReq);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `requirements/${reqId}`);
      }

      await addAuditLogInDb({
        actorId,
        actorName,
        actorRole,
        action: 'REQUIREMENT_CREATED',
        targetType: 'REQUIREMENT',
        targetId: reqId,
        metadata: {
          name: newReq.name,
          stageId: newReq.stageId,
          required: newReq.required,
        },
      });
      return true;
    } catch (e) {
      console.error('Add requirement error:', e);
      return false;
    }
  };

  const updateRequirement = async (
    reqId: string,
    updates: Partial<Requirement>,
    actorId: string,
    actorName: string,
    actorRole: any
  ): Promise<boolean> => {
    try {
      try {
        await updateDoc(doc(db, 'requirements', reqId), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `requirements/${reqId}`);
      }

      await addAuditLogInDb({
        actorId,
        actorName,
        actorRole,
        action: 'REQUIREMENT_UPDATED',
        targetType: 'REQUIREMENT',
        targetId: reqId,
        metadata: updates,
      });
      return true;
    } catch (e) {
      console.error('Update requirement error:', e);
      return false;
    }
  };

  const toggleRequirementActive = async (
    reqId: string,
    actorId: string,
    actorName: string,
    actorRole: any
  ): Promise<boolean> => {
    try {
      const targetReq = requirements.find((r) => r.id === reqId);
      if (!targetReq) return false;

      const nextActive = !targetReq.active;

      try {
        await updateDoc(doc(db, 'requirements', reqId), { active: nextActive });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `requirements/${reqId}`);
      }

      await addAuditLogInDb({
        actorId,
        actorName,
        actorRole,
        action: nextActive ? 'REQUIREMENT_UPDATED' : 'REQUIREMENT_DEACTIVATED',
        targetType: 'REQUIREMENT',
        targetId: reqId,
        metadata: {
          requirementName: targetReq.name,
          status: nextActive ? 'ACTIVE' : 'DEACTIVATED',
        },
      });
      return true;
    } catch (e) {
      console.error('Toggle requirement error:', e);
      return false;
    }
  };

  // 5. System Settings
  const updateSettings = async (
    newSettings: Partial<SystemSettings>,
    actorId: string,
    actorName: string,
    actorRole: any
  ): Promise<boolean> => {
    try {
      const updated = {
        ...settings,
        ...newSettings,
        lastUpdated: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'systemSettings', 'global'), updated);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'systemSettings/global');
      }

      await addAuditLogInDb({
        actorId,
        actorName,
        actorRole,
        action: 'SYSTEM_SETTINGS_UPDATED',
        targetType: 'SYSTEM',
        targetId: 'global',
        metadata: newSettings,
      });
      return true;
    } catch (e) {
      console.error('Update settings error:', e);
      return false;
    }
  };

  const markNotificationRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (e) {
      // Local fallback
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    }
  };

  const resetToDemoData = async (actorId: string, actorName: string, actorRole: any) => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);

      // Stages
      INITIAL_STAGES.forEach((s) => {
        batch.set(doc(db, 'clearanceStages', s.id), s);
      });

      // Requirements
      INITIAL_REQUIREMENTS.forEach((r) => {
        batch.set(doc(db, 'requirements', r.id), r);
      });

      // Students
      INITIAL_STUDENTS.forEach((st) => {
        batch.set(doc(db, 'students', st.id), st);
      });

      // Submissions
      INITIAL_SUBMISSIONS.forEach((sub) => {
        batch.set(doc(db, 'submissions', sub.id), sub);
      });

      // Staff
      INITIAL_STAFF.forEach((stf) => {
        batch.set(doc(db, 'staff', stf.id), stf);
        batch.set(doc(db, 'users', stf.id), {
          uid: stf.id,
          name: stf.name,
          email: stf.email,
          role: stf.role,
          departmentId: stf.departmentId,
          departmentName: stf.departmentName,
          assignedStage: stf.assignedStage,
          active: stf.active,
          createdAt: stf.createdAt,
        });
      });

      // Notifications
      INITIAL_NOTIFICATIONS.forEach((n) => {
        batch.set(doc(db, 'notifications', n.id), n);
      });

      // Settings
      batch.set(doc(db, 'systemSettings', 'global'), INITIAL_SETTINGS);

      await batch.commit();

      await addAuditLogInDb({
        actorId,
        actorName,
        actorRole,
        action: 'DATABASE_INITIALIZED',
        targetType: 'SYSTEM',
        targetId: 'all',
        metadata: { note: 'Database reset and synced to verified initial records.' },
      });
    } catch (err) {
      console.error('Reset database error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Wipe all mock submissions from database
  const wipeAllSubmissions = async (
    actorId?: string,
    actorName?: string,
    actorRole?: any
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const subsSnap = await getDocs(collection(db, 'submissions'));
      const batch = writeBatch(db);
      subsSnap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();

      setSubmissions([]);

      await addAuditLogInDb({
        actorId: actorId || 'ADMIN',
        actorName: actorName || 'Administrator',
        actorRole: actorRole || 'SUPER_ADMIN',
        action: 'DATABASE_INITIALIZED',
        targetType: 'SYSTEM',
        targetId: 'submissions',
        metadata: { note: 'Purged mock submissions. Clean live database state active.' },
      });
      return true;
    } catch (e) {
      console.error('Wipe submissions error:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Student Registration & Sync
  const addStudent = async (
    studentData: Omit<StudentRecord, 'id' | 'createdAt'>,
    actorId?: string,
    actorName?: string,
    actorRole?: any
  ): Promise<boolean> => {
    try {
      const studentId = 'std_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newStudent: StudentRecord = {
        ...studentData,
        id: studentId,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'students', studentId), newStudent);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `students/${studentId}`);
      }

      await addAuditLogInDb({
        actorId: actorId || 'ADMIN',
        actorName: actorName || 'Administrator',
        actorRole: actorRole || 'ADMIN',
        action: 'DATABASE_INITIALIZED',
        targetType: 'STUDENT',
        targetId: studentId,
        metadata: {
          name: newStudent.name,
          matricNumber: newStudent.matricNumber,
          department: newStudent.departmentName,
        },
      });

      return true;
    } catch (e) {
      console.error('Add student error:', e);
      return false;
    }
  };

  // 7. Student Document Submission & Sync (Supports GitHub Storage & Free Tier Direct Sync)
  const submitDocument = async (
    submissionData: Omit<SubmissionRecord, 'id' | 'submittedAt'>
  ): Promise<boolean> => {
    try {
      // 1. Upload to GitHub Storage CDN if it's a Data URL
      let finalFileUrl = submissionData.fileUrl;
      if (submissionData.fileUrl && submissionData.fileUrl.startsWith('data:')) {
        try {
          const ghResult = await uploadDataUriToGitHub(
            submissionData.fileUrl,
            submissionData.fileName,
            submissionData.studentId,
            submissionData.stageId
          );
          if (ghResult?.downloadUrl) {
            finalFileUrl = ghResult.downloadUrl;
          }
        } catch (ghErr) {
          console.warn('GitHub upload fallback to Data URI:', ghErr);
        }
      }

      const subId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const now = new Date().toISOString();
      const newSub: SubmissionRecord = {
        ...submissionData,
        fileUrl: finalFileUrl,
        id: subId,
        submittedAt: now,
      };

      // 2. Write to submissions collection
      try {
        await setDoc(doc(db, 'submissions', subId), newSub);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `submissions/${subId}`);
      }

      // 3. Cross-write to jsp_documents
      const numStageId = STAGE_MAPPING_NUMERICAL[newSub.stageId] || 1;
      try {
        await setDoc(doc(db, 'jsp_documents', subId), {
          id: subId,
          studentUid: newSub.studentId,
          matricNumber: newSub.matricNumber,
          stageId: numStageId,
          stageTitle: newSub.stageName,
          documentType: newSub.requirementName,
          fileName: newSub.fileName,
          fileUri: newSub.fileUrl,
          hasAttachment: true,
          status: 'PENDING_REVIEW',
          remarks: 'Submitted for verification',
          uploadDate: now,
          createdAt: Date.now(),
        });
      } catch (e) {
        console.warn('jsp_documents write note:', e);
      }

      // 4. Update student's stage status in students collection
      try {
        const studentDoc = doc(db, 'students', newSub.studentId);
        await updateDoc(studentDoc, {
          [`stagesStatus.${newSub.stageId}`]: 'pending',
          clearanceStatus: 'in_progress',
        });
      } catch (err) {
        console.warn('Update student stage status error on submit:', err);
      }

      // 5. Cross-sync to jsp_clearance_records
      try {
        const docKeys = [
          newSub.studentId,
          newSub.matricNumber,
          newSub.matricNumber?.replace(/\//g, '_'),
        ].filter(Boolean);

        for (const docKey of docKeys) {
          const recRef = doc(db, 'jsp_clearance_records', docKey);
          const recSnap = await getDoc(recRef);
          if (recSnap.exists()) {
            const recData = recSnap.data();
            let stages = Array.isArray(recData.stages) ? [...recData.stages] : [];

            stages = stages.map((st: any) => {
              if (st.id === numStageId || st.stageNumber === numStageId) {
                return {
                  ...st,
                  status: 'PENDING',
                  documentStatus: 'PENDING_REVIEW',
                  documentName: newSub.fileName,
                  isActionRequired: false,
                  actionButtonText: 'Awaiting Officer Review',
                };
              }
              return st;
            });

            const activities = Array.isArray(recData.activities) ? [...recData.activities] : [];
            activities.unshift({
              id: 'act_' + Date.now(),
              title: `${newSub.stageName} Document Submitted`,
              description: `Uploaded ${newSub.requirementName} for verification.`,
              timeAgo: 'Just now',
              status: 'PENDING',
              stageId: numStageId,
            });

            await setDoc(
              recRef,
              {
                stages,
                activities: activities.slice(0, 30),
                lastUpdated: now,
                timestamp: Date.now(),
              },
              { merge: true }
            );
          }
        }
      } catch (e) {
        console.warn('jsp_clearance_records write note:', e);
      }

      // 6. Notify reviewing staff
      const notifId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      try {
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          studentId: newSub.studentId,
          title: `New ${newSub.stageName} Submission`,
          message: `${newSub.studentName} (${newSub.matricNumber}) uploaded ${newSub.requirementName} [${Math.round(newSub.fileSize / 1024)} KB].`,
          type: 'submission',
          read: false,
          createdAt: now,
        });
      } catch (e) {}

      // 7. Record Audit Log
      await addAuditLogInDb({
        actorId: newSub.studentId,
        actorName: newSub.studentName,
        actorRole: 'STUDENT',
        action: 'DOCUMENT_SUBMITTED',
        targetType: 'SUBMISSION',
        targetId: subId,
        metadata: {
          studentName: newSub.studentName,
          matricNumber: newSub.matricNumber,
          stage: newSub.stageName,
          requirement: newSub.requirementName,
          fileSizeKb: Math.round(newSub.fileSize / 1024),
          fileName: newSub.fileName,
        },
      });

      return true;
    } catch (e: any) {
      console.error('Document submission error:', e);
      alert(e.message || 'Failed to submit document. Please check file and network connection.');
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        stages,
        requirements,
        students,
        submissions,
        staffList,
        notifications,
        auditLogs,
        settings,
        stats,
        isLoading,
        isFirestoreLive,
        error,
        approveSubmission,
        rejectSubmission,
        addStaff,
        addStaffUser: addStaff,
        toggleStaffStatus,
        addRequirement,
        updateRequirement,
        toggleRequirementActive,
        addStudent,
        submitDocument,
        updateSettings,
        markNotificationRead,
        wipeAllSubmissions,
        resetToDemoData,
        resetToSeedData: resetToDemoData,
        seedFirestoreIfEmpty,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
