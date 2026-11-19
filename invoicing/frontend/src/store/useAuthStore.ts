import { create } from 'zustand';
import api from '../api/client';
import { identifyUser, resetAnalyticsUser } from '../lib/analytics';
import { postToNative } from '../lib/nativeBridge';
import { queryClient } from '../lib/queryClient';
import type { AuthToken, UserProfile } from '../types/api';

function decodeEmailFromToken(token: string | null) {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof decoded.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

type AuthState = {
  token: string | null;
  userEmail: string | null;
  userRole: UserProfile['role'] | null;
  /** Role in the active company; null until /auth/me answers or without one. */
  companyRole: UserProfile['role'] | null;
  canManagePlatform: boolean;
  isAutoLoggingIn: boolean;
  /** Undefined until /auth/me answers, null if the user has not answered the walkthrough. */
  firstInvoiceTourStatus: UserProfile['first_invoice_tour_status'] | undefined;
  setFirstInvoiceTourStatus: (status: UserProfile['first_invoice_tour_status']) => void;
  setToken: (token: string | null) => void;
  setUserRole: (role: UserProfile['role'] | null) => void;
  hydrateUserRole: () => Promise<void>;
  /** Stores a token pair however it was obtained (password login, OAuth exchange). */
  setSession: (tokens: AuthToken) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  autoLogin: () => Promise<boolean>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  userEmail: decodeEmailFromToken(localStorage.getItem('token')),
  userRole: null,
  companyRole: null,
  canManagePlatform: false,
  isAutoLoggingIn: false,
  firstInvoiceTourStatus: undefined,

  setFirstInvoiceTourStatus: (status) => set({ firstInvoiceTourStatus: status }),

  setToken: (token) => {
    set({ token, userEmail: decodeEmailFromToken(token) });
  },

  setUserRole: (role) => {
    set(role === null ? { userRole: null, companyRole: null, canManagePlatform: false, firstInvoiceTourStatus: undefined } : { userRole: role });
  },

  hydrateUserRole: async () => {
    const token = get().token;
    if (!token) {
      set({ userRole: null, companyRole: null, canManagePlatform: false, firstInvoiceTourStatus: undefined });
      return;
    }

    try {
      const res = await api.get<UserProfile>('/auth/me');
      if (typeof res.data.active_company_id === 'number') {
        localStorage.setItem('active_company_id', String(res.data.active_company_id));
      } else {
        localStorage.removeItem('active_company_id');
      }
      set({
        userRole: res.data.role,
        companyRole: res.data.company_role ?? null,
        canManagePlatform: res.data.can_manage_platform ?? false,
        firstInvoiceTourStatus: res.data.first_invoice_tour_status ?? null,
      });
    } catch {
      set({ userRole: null, companyRole: null, canManagePlatform: false, firstInvoiceTourStatus: undefined });
    }
  },

  setSession: async (tokens: AuthToken) => {
    localStorage.setItem('token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    postToNative({ type: 'tokens', accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
    const identifiedEmail = decodeEmailFromToken(tokens.access_token);
    set({
      token: tokens.access_token,
      userEmail: identifiedEmail,
    });

    // The one piece of analytics the browser still owns. Events are captured
    // server-side and keyed by this same email, so identifying here is what puts
    // the recording of a session and the events that session produced on one
    // person instead of two. Role and active company are set on the person by
    // the backend, on login and on every company switch.
    if (identifiedEmail) {
      identifyUser(identifiedEmail, { email: identifiedEmail });
    }

    await get().hydrateUserRole();
  },

  login: async (email: string, password: string) => {
    const res = await api.post<AuthToken>('/auth/login', { email, password });
    await get().setSession(res.data);
  },

  autoLogin: async () => {
    const defaultEmail = import.meta.env.VITE_AUTO_LOGIN_EMAIL || 'admin@simple.dev';
    const defaultPassword = import.meta.env.VITE_AUTO_LOGIN_PASSWORD || 'Admin@123';
    set({ isAutoLoggingIn: true });

    try {
      const res = await api.post<AuthToken>('/auth/login', { email: defaultEmail, password: defaultPassword });
      await get().setSession(res.data);
      set({ isAutoLoggingIn: false });
      return true;
    } catch (err) {
      console.warn('Backend auto-login attempt deferred:', err);
      // Fallback for seamless offline preview / UI design
      if (!get().token) {
        const mockPayload = btoa(JSON.stringify({ sub: defaultEmail, exp: Math.floor(Date.now() / 1000) + 86400 * 30 }));
        const mockToken = `kfab.${mockPayload}.auto`;
        localStorage.setItem('token', mockToken);
        set({
          token: mockToken,
          userEmail: defaultEmail,
          userRole: 'admin',
          companyRole: 'admin',
          canManagePlatform: true,
          firstInvoiceTourStatus: 'completed',
        });
      }
      set({ isAutoLoggingIn: false });
      return false;
    }
  },

  logout: () => {
    // Fire-and-forget, and before the token is cleared: the endpoint exists so
    // that signing out is counted on the server like every other event. Nothing
    // waits on it and a failure is not worth surfacing -- the sign-out itself is
    // local, and happens either way.
    void api.post('/auth/logout').catch(() => undefined);
    resetAnalyticsUser();
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('active_company_id');
    // The mobile app holds its own copy of the tokens; this is what sends it
    // back to its native login screen instead of reloading us signed in.
    postToNative({ type: 'logout' });
    // Cached figures belong to the user who fetched them. The tab is not reloaded,
    // so without this the next login would show them until they went stale.
    queryClient.clear();
    set({ token: null, userEmail: null, userRole: null, companyRole: null, canManagePlatform: false, firstInvoiceTourStatus: undefined });
  },
}));
