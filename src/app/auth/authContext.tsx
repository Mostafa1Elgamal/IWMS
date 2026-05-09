import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  getRoleDashboardPath,
  getSession,
  login as authLogin,
  logout as authLogout,
  type AuthSession,
  type UserRole,
} from "./authService";

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => void;
  getDefaultPath: () => string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => getSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      role: session?.role ?? null,
      login: async (email, password) => {
        const newSession = await authLogin(email, password);
        setSession(newSession);
        return newSession;
      },
      logout: () => {
        authLogout();
        setSession(null);
      },
      getDefaultPath: () =>
        session ? getRoleDashboardPath(session.role) : "/login",
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
