import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('villa_checklist_token');
    const saved = localStorage.getItem('villa_checklist_user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (_) {
        localStorage.removeItem('villa_checklist_token');
        localStorage.removeItem('villa_checklist_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (loginName, password) => {
    const data = await authApi.login(loginName, password);
    localStorage.setItem('villa_checklist_token', data.token);
    localStorage.setItem('villa_checklist_user', JSON.stringify({ staffId: data.staffId, name: data.name, login: data.login }));
    setUser({ staffId: data.staffId, name: data.name, login: data.login });
    return data;
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('villa_checklist_token');
    await authApi.logout(token);
    localStorage.removeItem('villa_checklist_token');
    localStorage.removeItem('villa_checklist_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
