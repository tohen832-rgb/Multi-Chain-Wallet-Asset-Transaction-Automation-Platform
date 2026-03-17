'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User { id: string; email: string; role: 'ADMIN' | 'OPERATOR' | 'VIEWER' }
interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isOperator: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      api.get('/api/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => { sessionStorage.clear(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/api/auth/login', { email, password });
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  }

  function logout() {
    const rt = sessionStorage.getItem('refreshToken');
    if (rt) api.post('/api/auth/logout', { refreshToken: rt }).catch(() => {});
    sessionStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout,
      isAdmin: user?.role === 'ADMIN',
      isOperator: user?.role === 'ADMIN' || user?.role === 'OPERATOR',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
