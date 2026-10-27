// Before Google's sign-in: Deyla is still being verified by Google, so Google shows an "unverified app" warning.
// The dialog shows a short copy of that screen with the button to press ringed, so the real one is passed without reading.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { tr } from "@/i18n";
import { cn } from "@/utils/cn";

const WarningTriangle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M12 2.5 1.5 21.5h21L12 2.5Z" fill="#EA4335" />
    <rect x="11" y="8.5" width="2" height="7" rx="1" fill="#FFFFFF" />
    <circle cx="12" cy="18.5" r="1.2" fill="#FFFFFF" />
  </svg>
);

type Step = "initial" | "advanced";

// Google's own words: its screen is in the language of the Google account, so the Russian steps give the English too
const ADVANCED = tr("Дополнительно", "Advanced");
const goTo = (appName: string) => tr(`Перейти на сайт ${appName} (небезопасно)`, `Go to ${appName} (unsafe)`);

/** The button to press now: ringed in sky blue so it is found at once */
const TargetLink: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "text-sm font-medium text-[#1a73e8] hover:text-[#1765cc]",
      "rounded-md px-2 py-1 -mx-2 -my-1",
      "ring-2 ring-sky-500 ring-offset-2 ring-offset-white",
      "motion-safe:animate-pulse hover:animate-none focus-visible:animate-none"
    )}
  >
    {label}
  </button>
);

/** A short copy of Google's "unverified app" screen; its "Advanced" and "Go to …" work like the real ones */
const GoogleWarningMock: React.FC<{
  step: Step;
  appName: string;
  onAdvanced: () => void;
  onProceed: () => void;
}> = ({ step, appName, onAdvanced, onProceed }) => (
  <div
    className="rounded-xl bg-white ring-1 ring-black/[0.08] px-6 py-7 sm:px-8"
    style={{ fontFamily: '"Google Sans","Roboto","Helvetica Neue",Arial,sans-serif' }}
  >
    <WarningTriangle className="w-10 h-10" />
    <h2 id="google-notice-title" className="mt-5 text-xl font-normal leading-snug text-[#202124]">
      {tr("Google не проверил это приложение", "Google hasn't verified this app")}
    </h2>
    <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
      {step === "initial" ? (
        <TargetLink label={ADVANCED} onClick={onAdvanced} />
      ) : (
        <TargetLink label={goTo(appName)} onClick={onProceed} />
      )}
      {/* Not the way on: shown greyed, as a part of the picture */}
      <span aria-hidden="true" className="h-9 px-[18px] inline-flex items-center rounded bg-[#1a73e8]/40 text-white text-sm font-medium uppercase tracking-wide">
        {tr("Вернуться в безопасное место", "Back to safety")}
      </span>
    </div>
  </div>
);

/** The dialog before Google's sign-in: confirm() resolves true once the user has gone through the warning. */
export function useGoogleNotice(opts?: { appName?: string }): {
  notice: ReactNode;
  confirm: () => Promise<boolean>;
} {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("initial");
  const answer = useRef<(value: boolean) => void>(() => undefined);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
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
      setStep("initial");
      setOpen(true);
    });

  const appName = opts?.appName ?? "Deyla";

  const notice = (
    <dialog
      ref={dialog}
      onClose={() => open && close(false)}
      onClick={(event) => event.target === dialog.current && close(false)}
      aria-labelledby="google-notice-title"
      className="m-auto p-0 bg-transparent border-none max-w-lg w-[calc(100%-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm"
    >
      <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-black/5 dark:ring-white/10 shadow-2xl p-4 sm:p-5 space-y-4">
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white">
            {tr("Google покажет предупреждение — это нормально", "Google will show a warning — that's expected")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {tr("Deyla ещё на проверке у Google. Нажмите выделенную кнопку:", "Deyla is still being verified by Google. Click the highlighted button:")}
          </p>
        </div>

        <GoogleWarningMock
          step={step}
          appName={appName}
          onAdvanced={() => setStep("advanced")}
          onProceed={() => close(true)}
        />

        <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {tr("Затем разрешите доступ к календарю.", "Then allow calendar access.")}
        </p>

        <div className="flex justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => close(false)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {tr("Отмена", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
          >
            {tr("Всё понятно — перейти в Google", "Got it — go to Google")}
          </button>
        </div>
      </div>
    </dialog>
  );

  return { notice, confirm };
}
