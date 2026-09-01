import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole, ClearanceStageKey, StaffRecord } from '../types';
import { INITIAL_STAFF } from '../services/seedData';
import { db, auth } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  assignedStage: ClearanceStageKey | null;
  login: (email: string, role?: UserRole, stage?: ClearanceStageKey) => Promise<boolean>;
  switchAccount: (staffId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'clearpass_admin_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth session and Firebase anonymous auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Sign in anonymously to ensure request.auth != null in Firebase Auth
        if (!auth.currentUser) {
          await signInAnonymously(auth).catch((e) =>
            console.warn('Anonymous Firebase auth skipped/offline:', e)
          );
        }

        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        } else {
          // Default initial session as Super Admin for instantaneous admin dashboard access
          const defaultAdmin = INITIAL_STAFF[0];
          const defaultProfile: UserProfile = {
            uid: defaultAdmin.id,
            name: defaultAdmin.name,
            email: defaultAdmin.email,
            role: defaultAdmin.role,
            departmentId: defaultAdmin.departmentId,
            departmentName: defaultAdmin.departmentName,
            assignedStage: defaultAdmin.assignedStage,
            active: defaultAdmin.active,
            createdAt: defaultAdmin.createdAt,
          };
          setCurrentUser(defaultProfile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultProfile));
        }
      } catch (e) {
        console.warn('Auth restore warning:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (
    email: string,
    roleOverride?: UserRole,
    stageOverride?: ClearanceStageKey
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth).catch(() => {});
      }

      // 1. Try querying Firestore staff collection
      let matchedStaff: StaffRecord | undefined;
      try {
        const staffSnap = await getDocs(collection(db, 'staff'));
        if (!staffSnap.empty) {
          const list = staffSnap.docs.map((d) => d.data() as StaffRecord);
          matchedStaff = list.find(
            (s) => s.email?.toLowerCase() === email.trim().toLowerCase()
          );
        }
      } catch (e) {
        console.warn('Firestore staff query fallback:', e);
      }

      // Fallback to initial staff
      if (!matchedStaff) {
        matchedStaff = INITIAL_STAFF.find(
          (s) => s.email.toLowerCase() === email.trim().toLowerCase()
        );
      }

      const profile: UserProfile = matchedStaff
        ? {
            uid: matchedStaff.id,
            name: matchedStaff.name,
            email: matchedStaff.email,
            role: roleOverride || matchedStaff.role,
            departmentId: matchedStaff.departmentId,
            departmentName: matchedStaff.departmentName,
            assignedStage: stageOverride || matchedStaff.assignedStage,
            active: matchedStaff.active,
            createdAt: matchedStaff.createdAt,
          }
        : {
            uid: 'usr_' + Math.random().toString(36).substring(2, 9),
            name: email.split('@')[0].replace('.', ' ').toUpperCase(),
            email: email.trim(),
            role: roleOverride || 'SUPER_ADMIN',
            departmentId: 'ADMIN_DEPT',
            departmentName: 'Administrative Services',
            assignedStage: stageOverride || 'admission',
            active: true,
            createdAt: new Date().toISOString(),
          };

      // Sync user profile to Firestore
      try {
        await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
      } catch (err) {
        console.warn('User profile sync to Firestore error:', err);
      }

      setCurrentUser(profile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = async (staffId: string) => {
    try {
      let staff: StaffRecord | undefined;
      try {
        const staffDoc = await getDoc(doc(db, 'staff', staffId));
        if (staffDoc.exists()) {
          staff = staffDoc.data() as StaffRecord;
        }
      } catch (e) {}

      if (!staff) {
        staff = INITIAL_STAFF.find((s) => s.id === staffId);
      }

      if (staff) {
        const profile: UserProfile = {
          uid: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          departmentId: staff.departmentId,
          departmentName: staff.departmentName,
          assignedStage: staff.assignedStage,
          active: staff.active,
          createdAt: staff.createdAt,
        };
        setCurrentUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      }
    } catch (e) {
      console.error('Switch account error:', e);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const role = currentUser?.role || 'STAFF';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isStaff = role === 'STAFF';
  const assignedStage = (currentUser?.assignedStage as ClearanceStageKey) || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        role,
        isSuperAdmin,
        isAdmin,
        isStaff,
        assignedStage,
        login,
        switchAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
