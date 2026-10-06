import { useState, useEffect, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  isAuthenticated,
} from '@/api/auth';
import type { User } from '@/api/types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  isAuth: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAuthenticated()) {
        const userData = await getCurrentUser();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки пользователя');
      setUser(null);
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(
  async (username: string, password: string) => {
        setLoading(true);
        setError(null);
        try {
        await apiLogin({ username, password });            // сохраняет токен
        const userData = await getCurrentUser();          // загружаем профиль
        setUser(userData);
        } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Ошибка входа');
        throw err;
        } finally {
        setLoading(false);
        }
    },
    [],
  );

  const register = useCallback(
    async (username: string, email: string, password: string, fullName?: string) => {
      setLoading(true);
      setError(null);
      try {
        await apiRegister({ email, password, name: fullName ?? username });
        setUser(await getCurrentUser());
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Ошибка регистрации');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuth: !!user,
  };
};