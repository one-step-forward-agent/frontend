import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/api/types';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
} from '@/api/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  clearError: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        //set({ isLoading: true, error: null });
        //// Имитация задержки
        //await new Promise(resolve => setTimeout(resolve, 500));
        //const mockUser = { 
        //  id: '1', 
        //  username: username || 'test', 
        //  email: 'test@test.com',
        //  created_at: new Date().toISOString()
        //};
        //set({
        //  user: mockUser,
        //  isLoading: false,
        //  error: null,
        //  isAuthenticated: true,
        //});
        set({ isLoading: true, error: null });
        try {
            await apiLogin({ username, password });
            const user = await getCurrentUser(); // загружаем профиль по токену
            set({
            user,
            isLoading: false,
            error: null,
            isAuthenticated: true,
            });
        } catch (error: any) {
            const detail = error.response?.data?.detail || error.message || 'Ошибка входа';
            set({
            isLoading: false,
            error: typeof detail === 'string' ? detail : JSON.stringify(detail),
            isAuthenticated: false,
            });
            throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // 1. Регистрируем пользователя
          await apiRegister({ username, email, password});
          
          // 2. Автоматически логинимся (используем уже существующую функцию login)
          await get().login(username, password);
          // После успешного логина состояние уже обновлено в login,
          // поэтому здесь ничего дополнительно не делаем.
        } catch (error: any) {
          // Ошибка может быть как от регистрации, так и от логина
          const detail = error.response?.data?.detail || error.message || 'Ошибка регистрации';
          set({
            isLoading: false,
            error: typeof detail === 'string' ? detail : JSON.stringify(detail),
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: () => {
        apiLogout();
        set({
          user: null,
          error: null,
          isAuthenticated: false,
        });
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      clearError: () => set({ error: null }),

      loadUser: async () => {
        //const mockUser = { id: '1', username: 'test', email: 'test@test.com', created_at: new Date().toISOString() };
        //set({ user: mockUser, isAuthenticated: true, isLoading: false });

        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ user: null, error: null, isAuthenticated: false });
          return;
        }
        set({ isLoading: true });
        try {
          const user = await getCurrentUser();
          set({
            user,
            isLoading: false,
            error: null,
            isAuthenticated: true,
          });
        } catch (error) {
          localStorage.removeItem('access_token');
          set({
            user: null,
            isLoading: false,
            error: null,
            isAuthenticated: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);