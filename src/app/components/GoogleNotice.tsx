// src/components/onboarding/GoogleVerificationGuide.tsx

import { useEffect, useRef, useState, type ReactNode, useId } from "react";
import { tr } from "@/i18n";
import { cn } from "@/utils/cn";
import { GlassSurface } from "@/components/dashboard/glass";

/* ═══════════════════════════════════════════════════════════
   Иконка — красный треугольник с восклицательным знаком
   ═══════════════════════════════════════════════════════════ */
const WarningTriangle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 2.5 1.5 21.5h21L12 2.5Z" fill="#EA4335" />
    <rect x="11" y="8.5" width="2" height="7" rx="1" fill="#FFFFFF" />
    <circle cx="12" cy="18.5" r="1.2" fill="#FFFFFF" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   Анимации: пульс только на инфо-точке done и fade-in.
   Больше нет bounce у стрелки (указатель статичный).
   ═══════════════════════════════════════════════════════════ */
const PulseStyles: React.FC = () => (
  <style>{`
    @keyframes gg-fade-in {
      from { opacity: 0; transform: translateY(-2px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .gg-fade-in { animation: gg-fade-in 260ms ease-out; }
    @media (prefers-reduced-motion: reduce) {
      .gg-fade-in { animation: none; }
    }
  `}</style>
);

const FLOW_PATH_EN =
  "M 24 6 L 88 6 " +
  // верхний правый бок: почти вертикаль, вогнут внутрь
  "C 80 14, 84 21, 88 28 " +
  // нижний правый бок: диагональ, вогнут внутрь
  "C 92 35, 96 42, 104 50 " +
  // база
  "L 72 50 " +
  // нижний левый бок: зеркало правого (чуть иначе — не строго симметрично)
  "C 78 42, 82 35, 88 28 " +
  // верхний левый бок: длинная диагональ, вогнут внутрь
  "C 68 20, 46 11, 24 6 Z";

const FLOW_PATH_RU =
  "M 24 6 L 128 6 " +
  "C 120 14, 124 21, 128 28 " +
  "C 132 35, 136 42, 144 50 " +
  "L 112 50 " +
  "C 118 42, 122 35, 128 28 " +
  "C 100 20, 60 11, 24 6 Z";

const CurvedPointer: React.FC<{ isRu: boolean }> = ({ isRu }) => {
  const gid = useId();
  return (
    <svg
      aria-hidden="true"
      className="absolute pointer-events-none z-10"
      style={{ left: 0, bottom: "100%", width: 200, height: 50 }}
      viewBox="0 0 200 50"
    >
      <defs>
        {/* Градиент снизу вверх: низ = фон плашки (0.10), верх = solid amber (цвет бара) */}
        <linearGradient
          id={gid}
          gradientUnits="userSpaceOnUse"
          x1="0" y1="50" x2="0" y2="6"
        >
          <stop offset="0%"  stopColor="#f59e0b" stopOpacity="0.1" />
          <stop offset="30%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="65%" stopColor="#f59e0b" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={isRu ? FLOW_PATH_RU : FLOW_PATH_EN} fill={`url(#${gid})`} />
    </svg>
  );
};

const CalloutToAction: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const isRu = tr("en", "ru") === "ru";
  return (
    <div className="relative">
      <CurvedPointer isRu={isRu} />
      <GlassSurface
        className={[
          "!bg-amber-500/[0.10] dark:!bg-amber-500/[0.08]",
          "!ring-amber-400/50 dark:!ring-amber-400/35",
          "!shadow-[0_4px_24px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.6)]",
          "dark:!shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]",
          compact ? "px-3 py-2" : "px-4 py-3",
        ].join(" ")}
      >
        <p
          className={[
            "text-amber-900 dark:text-amber-100 leading-relaxed text-center font-medium",
            compact ? "text-xs" : "text-sm",
          ].join(" ")}
        >
          {tr(
            "Dayla is currently going through Google verification, so Google may say 'App not verified by Google'. This is normal, your data is safe.",
            "Dayla сейчас проходит проверку в Google, поэтому Google может написать «Приложение не проверено Google». Это нормально, ваши данные в безопасности."
          )}
        </p>
      </GlassSurface>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Одинаково незаметная кнопка действия (серый текст + amber
   подчёркивание). Используется и на шаге "initial", и на шаге
   "advanced" — визуально Advanced и Go to … идентичны.
   ═══════════════════════════════════════════════════════════ */
const SubtleActionButton: React.FC<{
  label: ReactNode;
  onClick: () => void;
}> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "relative overflow-visible",
      "text-sm font-normal text-[#9aa0a6] hover:text-[#5f6368]",
      "px-1 -mx-1 py-0.5 transition-colors"
    )}
  >
    {label}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-0 right-0 -bottom-1 h-[3px] rounded-full bg-amber-500"
    />
  </button>
);

/* ═══════════════════════════════════════════════════════════
   Интерактивный мокап страницы Google «unverified app»
   ═══════════════════════════════════════════════════════════ */
type Step = "initial" | "advanced" | "done";

interface GoogleWarningMockProps {
  step: Step;
  appName: string;
  developerEmail: string;
  onAdvanced: () => void;
  onProceed: () => void;
  onBackToSafety?: () => void;
}

const GoogleWarningMock: React.FC<GoogleWarningMockProps> = ({
  step,
  appName,
  developerEmail,
  onAdvanced,
  onProceed,
  onBackToSafety,
}) => (
  <div
    className="rounded-xl bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.08] px-6 py-8 sm:px-8 sm:py-9"
    style={{ fontFamily: '"Google Sans","Roboto","Helvetica Neue",Arial,sans-serif' }}
  >
    <WarningTriangle className="w-12 h-12" />

    <h2 className="mt-6 text-xl sm:text-[22px] font-normal leading-snug text-[#202124]">
      {tr("Google hasn't verified this app", "Google не проверил это приложение")}
    </h2>

    <p className="mt-4 text-sm leading-relaxed text-[#5f6368]">
      {tr(
        "The app is requesting access to sensitive info in your Google Account. Until the developer",
        "Приложение запрашивает доступ к конфиденциальной информации в вашем аккаунте Google. Пока разработчик"
      )}{" "}
      <span className="text-[#1a73e8] underline underline-offset-2">
        ({developerEmail})
      </span>{" "}
      {tr(
        "verifies this app with Google, you shouldn't use it.",
        "не подтвердит это приложение у Google, использовать его не рекомендуется."
      )}
    </p>

    <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 flex-1">
        {step === "initial" && (
          <SubtleActionButton
            onClick={onAdvanced}
            label={tr("Advanced", "Дополнительно")}
          />
        )}

        {step === "advanced" && (
          <div className="gg-fade-in">
            <SubtleActionButton
              onClick={onProceed}
              label={tr(
                `Go to ${appName} (unsafe)`,
                `Перейти к странице ${appName} (небезопасно)`
              )}
            />
          </div>
        )}

        {step === "done" && (
          <span className="gg-fade-in inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {tr("Redirecting to Google…", "Перенаправляем в Google…")}
          </span>
        )}
      </div>

      {/* BACK TO SAFETY — синяя, на 10% меньше (h-9 / px-[18px]) */}
      <button
        type="button"
        onClick={onBackToSafety}
        className="h-9 px-[18px] rounded bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium uppercase tracking-wide shadow-sm transition-colors shrink-0"
      >
        {tr("Back to safety", "В безопасность")}
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Полноценная страница-гайд
   ═══════════════════════════════════════════════════════════ */
interface GoogleVerificationGuideProps {
  appName?: string;
  developerEmail?: string;
  onProceed?: () => void;
  onCancel?: () => void;
}

export const GoogleVerificationGuide: React.FC<GoogleVerificationGuideProps> = ({
  appName = "Dayla",
  developerEmail = "daylaassistant@gmail.com",
  onProceed,
  onCancel,
}) => {
  const [step, setStep] = useState<Step>("initial");

  const handleProceed = () => {
    setStep("done");
    onProceed?.();
  };

  const stepIndex = step === "initial" ? 0 : step === "advanced" ? 1 : 2;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-start justify-center px-4 py-10">
      <PulseStyles />

      <div className="w-full max-w-xl">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-sky-600 dark:text-sky-400">
            {tr("Google integration", "Интеграция с Google")}
          </p>
          <h1 className="mt-2 text-2xl sm:text-[26px] font-semibold text-gray-900 dark:text-white tracking-tight">
            {tr(
              "How to get past the Google warning",
              "Как пройти предупреждение Google"
            )}
          </h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
            {tr(
              "Dayla is going through Google's verification, so Google will show a warning. Follow the two steps — it's safe, your data is protected.",
              "Dayla проходит проверку в Google, поэтому Google покажет предупреждение. Выполните два шага — это безопасно, данные под защитой."
            )}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => {
            const isActive = stepIndex === i;
            const isDone = stepIndex > i;
            return (
              <div key={i} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={cn(
                      "h-px w-8 transition-colors duration-300",
                      isDone ? "bg-sky-500" : "bg-gray-300 dark:bg-gray-700"
                    )}
                  />
                )}
                <span
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-300",
                    isDone && "bg-emerald-500 text-white",
                    isActive &&
                      !isDone &&
                      "bg-sky-500 text-white ring-4 ring-sky-500/20 animate-pulse",
                    !isActive &&
                      !isDone &&
                      "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  )}
                >
                  {isDone ? "✓" : i + 1}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <GoogleWarningMock
            step={step}
            appName={appName}
            developerEmail={developerEmail}
            onAdvanced={() => setStep("advanced")}
            onProceed={handleProceed}
            onBackToSafety={onCancel}
          />
        </div>

        {/* Плашка с указателем появляется на обоих активных шагах */}
        {step !== "done" && (
          <div className="mt-2">
            <CalloutToAction />
          </div>
        )}

        <p className="mt-5 text-center text-[13px] text-gray-500 dark:text-gray-400 min-h-[1.25rem]">
          {step === "initial" &&
            tr(
              "↑ Click “Advanced” in the warning",
              "↑ Нажмите на «Дополнительно» в предупреждении"
            )}
          {step === "advanced" &&
            tr(
              `↑ Now click “Go to ${appName} (unsafe)”`,
              `↑ Теперь нажмите «Перейти к странице ${appName} (небезопасно)»`
            )}
          {step === "done" && (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {tr(
                "Done — pick your Google account and allow access.",
                "Готово — выберите аккаунт Google и разрешите доступ."
              )}
            </span>
          )}
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {tr("Cancel", "Отмена")}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Хук — тот же мокап внутри модального окна.
   ═══════════════════════════════════════════════════════════ */
export function useGoogleNotice(opts?: {
  appName?: string;
  developerEmail?: string;
}): { notice: ReactNode; confirm: () => Promise<boolean> } {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("initial");
  const answer = useRef<(value: boolean) => void>(() => undefined);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const close = (value: boolean) => {
    setOpen(false);
    setStep("initial");
    answer.current(value);
    answer.current = () => undefined;
  };

  const confirm = () =>
    new Promise<boolean>((resolve) => {
      answer.current = resolve;
      setOpen(true);
      setStep("initial");
    });

  const appName = opts?.appName ?? "Dayla";
  const developerEmail = opts?.developerEmail ?? "daylaassistant@gmail.com";

  const notice = (
    <dialog
      ref={dialog}
      onClose={() => open && close(false)}
      onClick={(e) => e.target === dialog.current && close(false)}
      aria-labelledby="google-notice-title"
      className="m-auto p-0 bg-transparent border-none max-w-lg w-[calc(100%-2rem)] backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm"
    >
      <PulseStyles />

      <div className="space-y-3">
        <GoogleWarningMock
          step={step}
          appName={appName}
          developerEmail={developerEmail}
          onAdvanced={() => setStep("advanced")}
          onProceed={() => close(true)}
          onBackToSafety={() => close(false)}
        />

        {step !== "done" && <CalloutToAction compact />}

        <p className="text-center text-[12px] text-gray-300">
          {step === "initial" &&
            tr(
              "↑ Click “Advanced” — it's safe",
              "↑ Нажмите «Дополнительно» — это безопасно"
            )}
          {step === "advanced" &&
            tr(
              `↑ Click “Go to ${appName} (unsafe)”`,
              `↑ Нажмите «Перейти к странице ${appName} (небезопасно)»`
            )}
          {step === "done" &&
            tr("Redirecting to Google…", "Перенаправляем в Google…")}
        </p>
      </div>
    </dialog>
  );

  return { notice, confirm };
}