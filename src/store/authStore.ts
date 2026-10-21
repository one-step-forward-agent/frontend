import { create } from "zustand";
import { api, ApiError, onUnauthorized } from "@/app/api/client";
import { errorText } from "@/app/lib/format";
import type { User } from "@/app/api/types";
import { DEV_AUTH_BYPASS, DEV_USER } from "@/config/devAuth";
import { tr } from "@/i18n";

interface RegisterInput {
  email: string;
  password: string;
  name?: string | null;
  timezone?: string;
  // Spam protection: the hidden field people never fill and how long the form was open
  website?: string;
  form_ms?: number;
  // The code mailed to the email and the token that came with it
  email_code?: string;
  email_token?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSubmitting: boolean;
  error: string | null;

  loadUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  /** Mails the sign-up code; returns its token, or null when the server needs no code */
  requestEmailCode: (email: string, website?: string) => Promise<string | null>;
  logout: (everywhere?: boolean) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

const message = (error: unknown, fallback: string) => (error instanceof ApiError ? errorText(error) : fallback);

export const useAuthStore = create<AuthState>()((set, get) => ({
  // ─── Начальные значения ────────────────────────────────
  // В dev-режиме сразу считаем пользователя залогиненным,
  // чтобы RootRoute не мигал на /login.
  user: DEV_AUTH_BYPASS ? DEV_USER : null,
  isLoading: !DEV_AUTH_BYPASS,       // в dev нечего загружать
  isAuthenticated: DEV_AUTH_BYPASS,
  isSubmitting: false,
  error: null,

  loadUser: async () => {
    if (DEV_AUTH_BYPASS) {
      set({ user: DEV_USER, isAuthenticated: true, isLoading: false });
      return;
    }
    try {
      const user = await api.me.get();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401)
        console.warn("Session check failed", error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    if (DEV_AUTH_BYPASS) {
      set({
        user: DEV_USER,
        isAuthenticated: true,
        isLoading: false,
        isSubmitting: false,
        error: null,
      });
      return;
    }
    set({ isSubmitting: true, error: null });
    try {
      await api.auth.login(email.trim().toLowerCase(), password);
      await get().loadUser();
    } catch (error) {
      set({ error: message(error, tr("Ошибка входа", "Sign-in failed")) });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  register: async ({ email, password, name, timezone, website, form_ms, email_code, email_token }) => {
    if (DEV_AUTH_BYPASS) {
      set({
        user: DEV_USER,
        isAuthenticated: true,
        isLoading: false,
        isSubmitting: false,
        error: null,
      });
      return;
    }
    set({ isSubmitting: true, error: null });
    try {
      await api.auth.register({
        email: email.trim().toLowerCase(),
        password,
        name: name?.trim() || null,
        timezone,
        website,
        form_ms,
        email_code,
        email_token,
      });
      await get().loadUser();
    } catch (error) {
      set({ error: message(error, tr("Ошибка регистрации", "Sign-up failed")) });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  requestEmailCode: async (email, website) => {
    if (DEV_AUTH_BYPASS) return null;
    set({ isSubmitting: true, error: null });
    try {
      const sent = await api.auth.registerCode({ email: email.trim().toLowerCase(), website });
      return sent.required ? sent.email_token : null;
    } catch (error) {
      set({ error: message(error, tr("Не удалось отправить код", "Could not send the code")) });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  logout: async (everywhere = false) => {
    if (DEV_AUTH_BYPASS) {
      // В dev-режиме не разлогиниваем, иначе F5 на /dashboard
      // выкинет на /login — начнёте гоняться за редиректами.
      set({ user: DEV_USER, isAuthenticated: true, error: null });
      return;
    }
    await (everywhere ? api.auth.logoutAll() : api.auth.logout()).catch(
      () => undefined
    );
    set({ user: null, isAuthenticated: false, error: null });
  },

  setUser: (user) =>
    set({
      user: DEV_AUTH_BYPASS ? DEV_USER : user,
      isAuthenticated: DEV_AUTH_BYPASS ? true : !!user,
    }),

  clearError: () => set({ error: null }),
}));

onUnauthorized(() => {
  // В dev-режиме не реагируем на 401 — токена нет, все запросы к API
  // всё равно упадут, но UI останется в залогиненном состоянии.
  if (DEV_AUTH_BYPASS) return;
  useAuthStore.getState().setUser(null);
});