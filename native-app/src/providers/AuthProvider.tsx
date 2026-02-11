import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { clearToken, loadToken, saveToken } from "../lib/auth-store";
import type { AuthUser } from "../lib/types";

type AuthContextType = {
  initialized: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; handle: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshMe = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await apiRequest<AuthUser>("/auth/me", { token });
      setUser(me);
    } catch {
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await loadToken();
      if (!mounted) return;
      setToken(stored);
      setInitialized(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password }
    });
    await saveToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: { name: string; handle: string; email: string; password: string }) => {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload
    });
    await saveToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      initialized,
      token,
      user,
      login,
      register,
      logout,
      refreshMe
    }),
    [initialized, token, user, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
