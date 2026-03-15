import { useState, useCallback } from 'react';

const STORAGE_KEY = 'holat_user';

export interface AuthUser {
  name: string;
  phone: string;
}

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.name && parsed.phone) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(readUser);

  const login = useCallback((name: string, phone: string) => {
    const u: AuthUser = { name, phone };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    login,
    logout,
  };
}
