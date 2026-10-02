// src/pages/Auth/RegisterPage.tsx
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { Alert, Button, FormField, Input } from "@/components/ui";
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
      await register(email, password);
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

      // ИСПРАВЛЕНО: было '/onboarding/sourcesimport' — это 404
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
    <div className="relative space-y-6">
      {/* Мягкое свечение на фоне */}
      <div aria-hidden="true" className="absolute -inset-4 -z-10 pointer-events-none">
        <div className="absolute -top-10 left-1/4 w-56 h-56 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full bg-purple-400/15 blur-3xl" />
      </div>

      {/* Заголовок */}
      <div className="text-center">
        <div
          aria-hidden="true"
          className="
            mx-auto w-12 h-12 rounded-2xl
            bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600
            flex items-center justify-center text-white
            shadow-md shadow-blue-500/20
          "
        >
          <Sparkles size={22} />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Создать аккаунт
        </h2>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          Минута — и Deyla начнёт планировать ваш день
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Имя */}
        <FormField id="fullName" label="Имя" required>
          {(field) => (
            <div className="relative">
              <User
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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

        {/* ─── Чекбоксы ─────────────────────────────────── */}
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
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              пользовательского соглашения
            </Link>{" "}
            и обязуюсь их соблюдать.
          </ConsentCheckbox>
        </div>

        {displayError && <Alert variant="error">{displayError}</Alert>}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Зарегистрироваться
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Уже есть аккаунт?{" "}
        <Link
          to="/login"
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Войти
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;

// ─── Кастомный чекбокс в стиле кита ───────────────────────

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
      "group flex items-start gap-3 cursor-pointer select-none",
      "rounded-xl p-3 transition-colors",
      "border",
      checked
        ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60"
        : "bg-white/60 dark:bg-gray-900/40 border-gray-200/70 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
    )}
  >
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
    />

    {/* Кастомный чекбокс */}
    <span
      aria-hidden="true"
      className={cn(
        "shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center",
        "transition-all duration-200",
        checked
          ? "bg-blue-500 border-blue-500 text-white scale-100"
          : "border-gray-300 dark:border-gray-600 scale-95 group-hover:border-blue-400"
      )}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </span>

    <span className="text-xs leading-snug text-gray-600 dark:text-gray-300">
      {children}
    </span>
  </label>
);