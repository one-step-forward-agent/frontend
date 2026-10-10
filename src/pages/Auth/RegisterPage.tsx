// src/pages/Auth/RegisterPage.tsx
import React, { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User, Mail, Lock, ShieldCheck, Check, Sparkles, ArrowRight,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { Alert, FormField, Input } from "@/components/ui";
import { sendMetricGoal } from "@/utils/metrics";
import { safeNext } from "./LoginPage";
import { cn } from "@/utils/cn";

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_SHEEN_PILL =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const GLASS_SHEEN_ROUND_XL =
  "pointer-events-none absolute inset-0 rounded-xl " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isSubmitting: isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const [isConsentGiven, setIsConsentGiven] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  // Spam protection: bots fill every field and submit at once
  const [website, setWebsite] = useState("");
  const openedAt = useRef(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Пароли не совпадают");
      return;
    }
    if (!isConsentGiven) {
      setLocalError(
        "Для регистрации необходимо дать согласие на обработку персональных данных"
      );
      return;
    }
    if (!isTermsAccepted) {
      setLocalError(
        "Для регистрации необходимо принять условия пользовательского соглашения"
      );
      return;
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await register({ email, password, name: username, timezone, website, form_ms: Date.now() - openedAt.current });
      sendMetricGoal("registration_success");
      // A fresh account goes through onboarding, which is applied at its last step.
      const next = searchParams.get("next");
      navigate(next ? safeNext(next) : "/onboarding/field-of-activity", { replace: true });
    } catch {
    }
  };

  // Set by a Google or Yandex sign-up that could not create the account
  const displayError = localError ?? error ?? searchParams.get("error");

  const handleConsentChange = (checked: boolean) => {
    setIsConsentGiven(checked);
    if (localError?.includes("согласие")) setLocalError(null);
  };

  const handleTermsChange = (checked: boolean) => {
    setIsTermsAccepted(checked);
    if (localError?.includes("пользовательского соглашения")) setLocalError(null);
  };

  return (
    <div className="relative max-w-md w-full mx-auto">
      {/* ─── Заголовок ───────────────────────── */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
          Создать аккаунт
        </h2>
      </div>

      {/* ─── Форма ───────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hidden from people and screen readers; a bot that fills it is turned away */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label htmlFor="website">Сайт</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <FormField id="email" label="Email" required>
          {(field) => (
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                aria-hidden="true"
              />
              <Input
                {...field}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="pl-9"
                required
              />
            </div>
          )}
        </FormField>

        <FormField
          id="password"
          label="Пароль"
          required
        >
          {(field) => (
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                aria-hidden="true"
              />
              <Input
                {...field}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Минимум 8 символов"
                className="pl-9"
                required
                minLength={8}
              />
            </div>
          )}
        </FormField>

        <FormField id="confirmPassword" label="Подтверждение пароля" required>
          {(field) => (
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                aria-hidden="true"
              />
              <Input
                {...field}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Повторите пароль"
                className="pl-9"
                required
              />
            </div>
          )}
        </FormField>

        {/* ─── Чекбоксы ─────────────────────────── */}
        <div className="space-y-2.5 pt-1">
          <ConsentCheckbox
            id="consent"
            checked={isConsentGiven}
            onChange={handleConsentChange}
          >
            Я даю согласие на обработку моих персональных данных (имя, email)
            в целях регистрации и предоставления доступа к сервису. С{" "}
            <Link
              to="/personal-data-consent"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
            >
              условиями обработки ПД
            </Link>{" "}
            ознакомлен(а) и согласен(а), с{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
            >
              политикой конфиденциальности
            </a> — тоже.
          </ConsentCheckbox>

          <ConsentCheckbox
            id="terms"
            checked={isTermsAccepted}
            onChange={handleTermsChange}
          >
            Я принимаю условия{" "}
            <Link
              to="/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
            >
              пользовательского соглашения
            </Link>{" "}
            и обязуюсь их соблюдать.
          </ConsentCheckbox>
        </div>

        {displayError && (
          <Alert
            variant="error"
            className="animate-in fade-in slide-in-from-top-1 duration-200"
          >
            {displayError}
          </Alert>
        )}

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
            // ─── Мягкое усиление ring вместо движения ───
            "transition-[box-shadow] duration-200",
            "hover:ring-white/50 dark:hover:ring-white/20",
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
                Создаём…
              </>
            ) : (
              <>
                Зарегистрироваться
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
          или
        </span>
        <div className="h-px flex-1 bg-white/30 dark:bg-white/10" />
      </div>

      {/* ─── Ссылка на вход ──────────────────── */}
      <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
        Уже есть аккаунт?{" "}
        <Link
          to="/login"
          className={cn(
            "group relative inline-flex items-center gap-1",
            "font-medium text-sky-600 dark:text-sky-400",
            "hover:text-sky-700 dark:hover:text-sky-300",
            "transition-colors"
          )}
        >
          Войти
          <ArrowRight
            size={13}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;

/* ─── Стеклянный чекбокс — единый стиль ───────────────────── */

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}
export const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  id,
  checked,
  onChange,
  children,
}) => (
  <label
    htmlFor={id}
    className={cn(
      "group relative flex items-start gap-3 cursor-pointer select-none overflow-hidden",
      "rounded-xl p-3",
      GLASS_BODY,
      // ─── Мягкое усиление ring вместо движения ───
      !checked && "transition-[box-shadow] duration-200",
      !checked && "hover:ring-white/50 dark:hover:ring-white/20"
    )}
    style={
      checked
        ? {
            boxShadow:
              "0 0 0 1.5px rgba(56,189,248,0.6), 0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)",
          }
        : undefined
    }
  >
    <span aria-hidden="true" className={GLASS_SHEEN_ROUND_XL} />

    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />

    {/* Индикатор — как было */}
    <span
      aria-hidden="true"
      className={cn(
        "relative shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center overflow-hidden",
        "ring-1 transition-all duration-200",
        checked
          ? "text-white ring-white/40"
          : "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl ring-white/30 dark:ring-white/10"
      )}
      style={
        checked
          ? {
              backgroundColor: "rgba(56,189,248,0.7)",
              boxShadow:
                "0 2px 8px rgba(56,189,248,0.4), inset 0 1px 0 rgba(255,255,255,0.5)",
            }
          : undefined
      }
    >
      {checked && (
        <Check size={12} strokeWidth={3} className="relative" />
      )}
    </span>

    <span className="relative text-xs leading-snug text-gray-600 dark:text-gray-300">
      {children}
    </span>
  </label>
);