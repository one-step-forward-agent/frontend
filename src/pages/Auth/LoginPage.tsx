import { tr } from "@/i18n";
// src/pages/Auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Sparkles, ArrowRight } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { Alert, FormField, Input } from '@/components/ui';
import { cn } from '@/utils/cn';
import { SignInButtons } from './SignInButtons';
import { PasswordToggle } from './RegisterPage';

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_SHEEN_PILL =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

export const safeNext = (next: string | null): string =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, login, isSubmitting: isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Set by a Google or Yandex sign-in that could not log in, e.g. the email already has a password account
  const redirectError = searchParams.get('error');

  useEffect(() => {
    if (isAuthenticated) {
      navigate(safeNext(searchParams.get('next')), { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
    } catch {
    }
  };

  return (
    <div className="relative max-w-md w-full mx-auto">

      {/* ─── Заголовок ───────────────────────── */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
          {tr("Вход в аккаунт", "Sign in")}
        </h2>
      </div>

      {redirectError && !error && (
        <Alert variant="error" className="mb-4">
          {redirectError}
        </Alert>
      )}

      {/* ─── Форма ───────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="email" label="Email" required>
          {(field) => (
            <Input
              {...field}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          )}
        </FormField>

        <FormField id="password" label={tr("Пароль", "Password")} required>
          {(field) => (
            <div className="relative">
              <Input
                {...field}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder={tr("Минимум 8 символов", "At least 8 characters")}
                className="pr-10"
                required
              />
              <PasswordToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            </div>
          )}
        </FormField>

        {error && (
          <Alert
            variant="error"
            className="animate-in fade-in slide-in-from-top-1 duration-200"
          >
            {error}
          </Alert>
        )}

        {/* ─── Liquid Glass CTA ─────────────── */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "group relative overflow-hidden w-full",
            "inline-flex items-center justify-center gap-2",
            "h-12 rounded-full",
            "text-sm md:text-base font-semibold",
            "text-sky-700 dark:text-sky-300",
            GLASS_BODY,
            "transition-transform duration-300",
            "hover:-translate-y-0.5 active:translate-y-0",
            "disabled:opacity-60 disabled:pointer-events-none"
          )}
        >
          <span aria-hidden="true" className={GLASS_SHEEN_PILL} />

          <span className="relative inline-flex items-center gap-2">
            {isLoading ? (
              <>
                <span
                  aria-hidden="true"
                  className="w-4 h-4 rounded-full border-2 border-sky-500/40 border-t-sky-600 animate-spin"
                />
                {tr("Входим…", "Signing in…")}
              </>
            ) : (
              <>
                {tr("Войти", "Sign in")}
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </>
            )}
          </span>
        </button>
      </form>

      {/* ─── Разделитель ─────────────────────── */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/30 dark:bg-white/10" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
          {tr("или", "or")}
        </span>
        <div className="h-px flex-1 bg-white/30 dark:bg-white/10" />
      </div>

      <div className="mt-5">
        <SignInButtons returnTo={safeNext(searchParams.get('next'))} />
      </div>

      {/* ─── Ссылка на регистрацию ───────────── */}
      <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
        {tr("Нет аккаунта?", "No account?")}{' '}
        <Link
          to="/register"
          className={cn(
            "group relative inline-flex items-center gap-1",
            "font-medium text-sky-600 dark:text-sky-400",
            "hover:text-sky-700 dark:hover:text-sky-300",
            "transition-colors"
          )}
        >
          {tr("Зарегистрироваться", "Sign up")}
          <ArrowRight
            size={13}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </p>

      {/* ─── Микро-подпись ───────────────────── */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
        <Sparkles size={11} aria-hidden="true" />
        {tr("Ваши данные защищены", "Your data is protected")}
      </div>
    </div>
  );
};

export default LoginPage;