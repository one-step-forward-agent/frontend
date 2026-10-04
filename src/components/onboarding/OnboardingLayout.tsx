// src/onboarding/OnboardingLayout.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { PageBackdrop } from "@/components/onboarding/PageBackdrop";

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
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden flex flex-col">
      <PageBackdrop />

      <main className="relative z-10 flex-1 flex items-start md:items-center justify-center px-4 md:px-6 py-8 md:py-10">
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

      <footer className="relative z-10 px-4 md:px-6 pb-6 md:pb-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="dark:text-white dark:border-gray-600"
            >
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