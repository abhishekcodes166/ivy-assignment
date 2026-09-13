import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSession, onSessionExpired, type Session } from '@/api/client';
import * as authApi from '@/api/auth';

interface AuthValue {
  session: Session | null;
  isAuthenticated: boolean;
  /** True after a refresh-token failure, so the login screen can explain why. */
  expired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => getSession());
  const [expired, setExpired] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setSessionState(null);
      setExpired(true);
      queryClient.clear();
    });
    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const next = await authApi.login(email, password);
      setExpired(false);
      setSessionState(next);
      // A different user must never inherit the previous user's cached saved list.
      queryClient.clear();
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    await authApi.logout();
    setSessionState(null);
    setExpired(false);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthValue>(
    () => ({ session, isAuthenticated: Boolean(session), expired, signIn, signOut }),
    [session, expired, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
