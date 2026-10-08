// src/components/onboarding/OnboardingLayout.tsx
import * as React from "react";
import { Sparkles, ArrowRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/theme";
import { cn } from "@/utils/cn";
import { PageBackdrop } from "@/components/onboarding/PageBackdrop";
import LandingHeader from "@/components/landing/LandingHeader";

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_SHEEN =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

export interface OnboardingLayoutProps {
  step: number;
  totalSteps: number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  onSkip,
  nextLabel = "Далее",
  nextDisabled,
  loading,
}) => {
  const progress = Math.min(100, Math.max(0, Math.round((step / totalSteps) * 100)));

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden flex flex-col">
      <PageBackdrop />

      {/* ─── Header ─────────────────────────────── */}
      <LandingHeader />
      {/* ─── Main ───────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-start md:items-center justify-center px-4 md:px-6 py-8 md:py-10">
        <div className="w-full max-w-2xl">
          {/* Прогресс-бар — стеклянный трек + синяя заливка */}
          <div
            className={cn(
              "mb-5 h-1 w-full overflow-hidden rounded-full",
              "bg-white/[0.06] dark:bg-white/[0.02]",
              "ring-1 ring-white/30 dark:ring-white/10",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            )}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                "h-full rounded-full",
                "bg-gradient-to-r from-sky-400 to-blue-500",
                "shadow-[0_0_8px_rgba(59,130,246,0.6)]"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
      </main>

      {/* ─── Footer ─────────────────────────────── */}
      <footer className="relative z-10 px-4 md:px-6 pb-6 md:pb-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                "relative overflow-hidden inline-flex items-center gap-1.5",
                "px-4 py-2.5 rounded-full",
                "text-sm font-medium",
                "text-gray-700 dark:text-gray-300",
                GLASS_BODY,
                "transition-transform duration-200",
                "hover:-translate-y-0.5"
              )}
            >
              <span aria-hidden="true" className={GLASS_SHEEN} />
              <ChevronLeft size={16} className="relative" aria-hidden="true" />
              <span className="relative">Назад</span>
            </button>
          )}

          <div className="flex-1" />

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className={cn(
                "relative overflow-hidden inline-flex items-center",
                "px-4 py-2.5 rounded-full",
                "text-sm font-medium",
                "text-gray-600 dark:text-gray-400",
                "transition-colors duration-200",
                "hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              Пропустить
            </button>
          )}

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || loading}
              className={cn(
                "relative overflow-hidden inline-flex items-center gap-1.5",
                "px-5 py-2.5 rounded-full",
                "text-sm font-semibold",
                "text-blue-700 dark:text-blue-300",
                GLASS_BODY,
                "transition-all duration-200",
                "hover:-translate-y-0.5",
                "disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0"
              )}
            >
              <span aria-hidden="true" className={GLASS_SHEEN} />
              {loading ? (
                <span className="relative inline-flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="w-3.5 h-3.5 rounded-full border-2 border-blue-500/40 border-t-blue-600 animate-spin"
                  />
                  <span>Подождите…</span>
                </span>
              ) : (
                <span className="relative inline-flex items-center gap-1.5">
                  {nextLabel}
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};