import { useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import type { AuthToken, UserProfile } from '../types/api';
import { deriveIsAdmin } from '../utils/authRole';
import { useAuthStore } from '../store/useAuthStore';

type AuthContextType = {
  token: string | null;
  userEmail: string | null;
  userRole: UserProfile['role'] | null;
  companyRole: UserProfile['role'] | null;
  /** Admin of the active company (not necessarily of the platform). */
  isAdmin: boolean;
  /** Runs the deployment itself: SMTP, backups. See require_platform_admin. */
  canManagePlatform: boolean;
  isAuthenticated: boolean;
  isAutoLoggingIn: boolean;
  setSession: (tokens: AuthToken) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  autoLogin: () => Promise<boolean>;
  logout: () => void;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, hydrateUserRole, setUserRole, autoLogin } = useAuthStore(useShallow((s) => ({
    token: s.token,
    hydrateUserRole: s.hydrateUserRole,
    setUserRole: s.setUserRole,
    autoLogin: s.autoLogin,
  })));

  useEffect(() => {
    if (!token) {
      void autoLogin();
    } else {
      void hydrateUserRole();
    }
  }, [token, hydrateUserRole, setUserRole, autoLogin]);

  return <>{children}</>;
}

export function useAuth() {
  const state = useAuthStore(useShallow((s) => ({
    token: s.token,
    userEmail: s.userEmail,
    userRole: s.userRole,
    companyRole: s.companyRole,
    canManagePlatform: s.canManagePlatform,
    isAutoLoggingIn: s.isAutoLoggingIn,
    setSession: s.setSession,
    login: s.login,
    autoLogin: s.autoLogin,
    logout: s.logout,
  })));

  return {
    ...state,
    isAdmin: deriveIsAdmin(state.companyRole, state.userRole),
    isAuthenticated: Boolean(state.token),
  } as AuthContextType;
}
