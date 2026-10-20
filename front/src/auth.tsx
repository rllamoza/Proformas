import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, User } from './api';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserState: (u: User | null) => void;
}
const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshUser = async () => {
    try {
      const u = await api<User>('/auth/me');
      setUser(u);
    } catch {
      setUser(null);
    }
  };
  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);
  const login = async (email: string, password: string) =>
    setUser(await api<User>('/auth/login', { method: 'POST', body: { email, password } }));
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  };
  return (
    <Ctx.Provider value={{ user, loading, login, logout, refreshUser, setUserState: setUser }}>
      {children}
    </Ctx.Provider>
  );
}
