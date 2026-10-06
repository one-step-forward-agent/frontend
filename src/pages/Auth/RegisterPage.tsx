// src/pages/Auth/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User, Mail, Lock, ShieldCheck, Check, Sparkles, ArrowRight,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { Alert, FormField, Input } from "@/components/ui";
import { createPayment } from "@/api/payment";
import { sendMetricGoal } from "@/utils/metrics";
import { cn } from "@/utils/cn";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const [isConsentGiven, setIsConsentGiven] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

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
      await register(email, password, username.trim() || undefined);
      sendMetricGoal("registration_success");

      const plan = searchParams.get("plan");
      if (plan && plan !== "free") {
        const amounts: Record<string, number> = {
          starter: 12990,
          business: 52990,
        };
        const amount = amounts[plan];
        if (amount) {
          try {
            const payment = await createPayment({
              amount,
              description: `Оплата тарифа ${plan}`,
            });
            window.location.href = payment.confirmation_url;
            return;
          } catch {
            setLocalError("Не удалось создать платёж. Попробуйте позже.");
            return;
          }
        }
      }

      navigate("/onboarding/sources-import", { replace: true });
    } catch {
      // ошибка уже в сторе
    }
  };

  const displayError = localError ?? error;

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
      {/* ─── Eyebrow ─────────────────────────── */}
      <div className="mb-6 flex items-center justify-center gap-3">
        <span
          className={cn(
            "relative inline-flex items-center gap-1.5",
            "px-2.5 py-1 rounded-full",
            "bg-white/50 dark:bg-white/[0.05]",
            "backdrop-blur-md",
            "ring-1 ring-white/60 dark:ring-white/10",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)]",
            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]",
            "text-[11px] uppercase tracking-widest font-medium",
            "text-gray-600 dark:text-gray-300"
          )}
        >
          <Sparkles size={11} aria-hidden="true" />
          Регистрация
        </span>

      </div>

      {/* ─── Заголовок ───────────────────────── */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
          Создать аккаунт
        </h2>
      </div>

      {/* ─── Форма ───────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Имя */}
        <FormField id="fullName" label="Имя" required>
          {(field) => (
            <div className="relative">
              <User
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                aria-hidden="true"
              />
              <Input
                {...field}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Как к вам обращаться"
                className="pl-9"
                required
              />
            </div>
          )}
        </FormField>

        {/* Email */}
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

        {/* Пароль */}
        <FormField
          id="password"
          label="Пароль"
          required
          hint="Минимум 6 символов"
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
                placeholder="Придумайте пароль"
                className="pl-9"
                required
                minLength={6}
              />
            </div>
          )}
        </FormField>

        {/* Подтверждение пароля */}
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
            ознакомлен(а) и согласен(а).
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

        {/* ─── Liquid Glass CTA ───────────────── */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "group relative overflow-hidden w-full",
            "inline-flex items-center justify-center gap-2",
            "h-12 rounded-full",
            "text-sm md:text-base font-semibold",
            "text-sky-700 dark:text-sky-300",
            // ─── Liquid Glass тело ───
            "bg-white/75 dark:bg-white/15",
            "backdrop-blur-xl",
            "ring-1 ring-white/70 dark:ring-white/20",
            "shadow-[0_8px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.4)]",
            "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(255,255,255,0.06)]",
            // ─── Hover: плотнее, без смены цвета ───
            "hover:bg-white/90 dark:hover:bg-white/25",
            "hover:-translate-y-0.5 active:translate-y-0",
            "disabled:opacity-60 disabled:pointer-events-none",
            "transition-all duration-300"
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/80 to-transparent opacity-90 blur-[1px]"
          />

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
        <div className="h-px flex-1 bg-white/60 dark:bg-white/10" />
        <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
          или
        </span>
        <div className="h-px flex-1 bg-white/60 dark:bg-white/10" />
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

      {/* ─── Микро-подпись ───────────────────── */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
        <ShieldCheck size={11} aria-hidden="true" />
        Данные передаются по защищённому каналу
      </div>
    </div>
  );
};

export default RegisterPage;

/* ─── Стеклянный чекбокс ─────────────────────────────────── */

interface ConsentCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
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
      "backdrop-blur-md ring-1 transition-all duration-200",
      // ─── Покой: стекло ───
      // ─── Active: плотнее + синий ring ───
      checked
        ? [
            "bg-white/70 dark:bg-white/[0.08]",
            "ring-sky-400/50 dark:ring-sky-400/40",
            "shadow-[0_4px_16px_rgba(59,130,246,0.15),inset_0_1px_0_rgba(255,255,255,0.85)]",
            "dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]",
          ]
        : [
            "bg-white/40 dark:bg-white/[0.03]",
            "ring-white/50 dark:ring-white/10",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)]",
            "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.3)]",
            "hover:bg-white/60 dark:hover:bg-white/[0.06]",
            "hover:ring-white/70 dark:hover:ring-white/15",
          ]
    )}
  >
    {/* Спекулярный блик */}
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-3 top-0.5 h-1/2 rounded-full",
        "bg-gradient-to-b from-white/60 to-transparent blur-[1px]",
        checked ? "opacity-80" : "opacity-40 group-hover:opacity-60",
        "transition-opacity"
      )}
    />

    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />

    {/* Стеклянный чекбокс-индикатор */}
    <span
      aria-hidden="true"
      className={cn(
        "relative shrink-0 mt-0.5 w-5 h-5 rounded-md overflow-hidden",
        "flex items-center justify-center",
        "ring-1 transition-all duration-200",
        checked
          ? [
              "bg-sky-500 ring-sky-400/70 text-white",
              "shadow-[0_2px_8px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]",
              "scale-100",
            ]
          : [
              "bg-white/50 dark:bg-white/[0.05]",
              "ring-white/70 dark:ring-white/15",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
              "scale-95",
              "group-hover:ring-sky-400/50",
            ]
      )}
    >
      {/* Спекулярный блик внутри чекбокса */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0.5 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[0.5px]"
      />
      {checked && (
        <Check size={12} strokeWidth={3} className="relative" />
      )}
    </span>

    <span className="relative text-xs leading-snug text-gray-600 dark:text-gray-300">
      {children}
    </span>
  </label>
);