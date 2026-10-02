// src/onboarding/OnboardingLayout.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col">
      <header className="px-4 md:px-6 pt-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>
              Шаг {step} из {totalSteps}
            </span>
            <span>{progress}%</span>
          </div>
          <div
            className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start md:items-center justify-center px-4 md:px-6 py-8 md:py-10">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
      </main>

      <footer className="px-4 md:px-6 pb-6 md:pb-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack} className="dark:text-white dark:border-gray-600">
              Назад
            </Button>
          )}
          <div className="flex-1" />
          {onSkip && (
            <Button type="button" variant="ghost" onClick={onSkip}>
              Пропустить
            </Button>
          )}
          {onNext && (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              isLoading={loading}
              className={cn(nextDisabled && "opacity-50")}
            >
              {nextLabel}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};