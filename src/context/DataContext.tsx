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
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
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
  toggleStaffStatus: (
    staffId: string,
    actorId: string,
    actorName: string,
    actorRole: any
  ) => Promise<boolean>;
  addRequirement: (
    reqData: Omit<Requirement, 'id' | 'createdAt'>,
    actorId: string,
    actorName: string,
    actorRole: any
  ) => Promise<boolean>;
  updateRequirement: (
    reqId: string,
    updates: Partial<Requirement>,
    actorId: string,
    actorName: string,
    actorRole: any
  ) => Promise<boolean>;
  toggleRequirementActive: (
    reqId: string,
    actorId: string,
    actorName: string,
    actorRole: any
  ) => Promise<boolean>;
  updateSettings: (
    newSettings: Partial<SystemSettings>,
    actorId: string,
    actorName: string,
    actorRole: any
  ) => Promise<boolean>;
  markNotificationRead: (notifId: string) => Promise<void>;
  resetToDemoData: (actorId: string, actorName: string, actorRole: any) => Promise<void>;
  seedFirestoreIfEmpty: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stages, setStages] = useState<ClearanceStage[]>(INITIAL_STAGES);
  const [requirements, setRequirements] = useState<Requirement[]>(INITIAL_REQUIREMENTS);
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(INITIAL_SUBMISSIONS);
  const [staffList, setStaffList] = useState<StaffRecord[]>(INITIAL_STAFF);
  const [notifications, setNotifications] = useState<NotificationRecord[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(INITIAL_AUDIT_LOGS);
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);

  const [isLoading, setIsLoading] = useState(true);
  const [isFirestoreLive, setIsFirestoreLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to populate initial Firestore collections if empty
  const seedFirestoreIfEmpty = async () => {
    try {
      const stagesSnap = await getDocs(collection(db, 'clearanceStages'));
      if (stagesSnap.empty) {
        console.log('Populating initial Firestore database records...');
        const batch = writeBatch(db);

        // 1. Stages
        INITIAL_STAGES.forEach((stage) => {
          batch.set(doc(db, 'clearanceStages', stage.id), stage);
        });

        // 2. Requirements
        INITIAL_REQUIREMENTS.forEach((req) => {
          batch.set(doc(db, 'requirements', req.id), req);
        });

        // 3. Students
        INITIAL_STUDENTS.forEach((student) => {
          batch.set(doc(db, 'students', student.id), student);
        });

        // 4. Staff
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

        // 5. Submissions
        INITIAL_SUBMISSIONS.forEach((sub) => {
          batch.set(doc(db, 'submissions', sub.id), sub);
        });

        // 6. Notifications
        INITIAL_NOTIFICATIONS.forEach((n) => {
          batch.set(doc(db, 'notifications', n.id), n);
        });

        // 7. Audit Logs
        INITIAL_AUDIT_LOGS.forEach((log) => {
          batch.set(doc(db, 'auditLogs', log.id), log);
        });

        // 8. System Settings
        batch.set(doc(db, 'systemSettings', 'global'), INITIAL_SETTINGS);

        await batch.commit();
        console.log('Firestore seed commit successful.');
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

        // 3. Students listener
        unsubscribeStudents = onSnapshot(
          collection(db, 'students'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded = snapshot.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<StudentRecord, 'id'>),
              }));
              setStudents(loaded);
              setIsFirestoreLive(true);
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
      let stageCompleted = 0;
      let stagePending = 0;
      let stageRejected = 0;

      students.forEach((student) => {
        const st = student.stagesStatus?.[stage.id as ClearanceStageKey];
        if (st === 'approved') stageCompleted++;
        else if (st === 'pending') stagePending++;
        else if (st === 'rejected') stageRejected++;
      });

      const completionRate =
        totalStudents > 0 ? Math.round((stageCompleted / totalStudents) * 100) : 0;

      stageStats[stage.id as ClearanceStageKey] = {
        total: totalStudents,
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
        reviewComment: comment || 'Document verified and approved.',
      };

      // 1. Update submission in Firestore
      try {
        await updateDoc(doc(db, 'submissions', submissionId), updatedSubmissionData);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `submissions/${submissionId}`);
      }

      // 2. Update Student stage status & progress
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

        const stageOrder: ClearanceStageKey[] = [
          'admission',
          'library',
          'faculty',
          'bursary',
          'sports',
          'accommodation',
          'student_affairs',
          'graduation',
        ];
        const currentIndex = stageOrder.indexOf(stageId);
        const nextStage =
          currentIndex < stageOrder.length - 1
            ? stageOrder[currentIndex + 1]
            : stageOrder[stageOrder.length - 1];

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

      // 3. Create Student Notification in Firestore
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

      // 4. Record Audit Log
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

      // 2. Update student stage status in Firestore
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

      // 3. Create Student Notification
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

      // 4. Record Audit Log
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
        toggleStaffStatus,
        addRequirement,
        updateRequirement,
        toggleRequirementActive,
        updateSettings,
        markNotificationRead,
        resetToDemoData,
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
