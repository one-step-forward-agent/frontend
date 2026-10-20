import { useEffect, useRef, useState, type ReactNode } from "react";
import { tr } from "@/i18n";

/**
 * Dayla's Google app is still being verified by Google, so Google first shows "Google hasn't verified this app".
 * Before every way to Google (sign-in, sign-up, connecting the calendar) the user is told how to get past it:
 * "Advanced" → "Go to … (unsafe)". `confirm()` resolves true when the user goes on, false when they cancel.
 *
 * Plain Tailwind, no app.css: it is also shown on the login, sign-up and onboarding pages outside the app.
 */
export function useGoogleNotice(): { notice: ReactNode; confirm: () => Promise<boolean> } {
  const [open, setOpen] = useState(false);
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
    answer.current(value);
    answer.current = () => undefined;
  };

  const confirm = () =>
    new Promise<boolean>((resolve) => {
      answer.current = resolve;
      setOpen(true);
    });

  const steps = [
    tr("Внизу слева нажмите «Дополнительные настройки» (Advanced).", "At the bottom left, click “Advanced”."),
    tr("Нажмите «Перейти на сайт … (небезопасно)» (Go to … (unsafe)).", "Click “Go to … (unsafe)”."),
    tr("Выберите аккаунт и разрешите доступ — вы вернётесь в Dayla.", "Choose your account and allow access — you'll be back in Dayla."),
  ];

  const notice = (
    <dialog
      ref={dialog}
      onClose={() => open && close(false)}
      onClick={(event) => event.target === dialog.current && close(false)}
      aria-labelledby="google-notice-title"
      className="m-auto p-0 bg-transparent border-none max-w-md w-[calc(100%-2rem)] backdrop:bg-slate-900/50"
    >
      <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-black/10 dark:ring-white/10 shadow-2xl p-5 text-left">
        <h2 id="google-notice-title" className="text-base font-semibold text-gray-900 dark:text-white">
          {tr("Google покажет предупреждение", "Google will show a warning")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {tr(
            "Dayla сейчас проходит проверку в Google, поэтому Google может написать «Приложение не проверено Google». Это нормально, ваши данные в безопасности. Чтобы продолжить:",
            "Dayla is going through Google's verification right now, so Google may say “Google hasn't verified this app”. That's expected and your data is safe. To continue:"
          )}
        </p>
        <ol className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-400/40"
              >
                {index + 1}
              </span>
              <span className="leading-snug">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => close(false)}
            className="h-9 px-4 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-500/10"
          >
            {tr("Отмена", "Cancel")}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => close(true)}
            className="h-9 px-4 rounded-full text-sm font-medium text-white bg-sky-600 hover:bg-sky-700"
          >
            {tr("Понятно, перейти в Google", "Got it, go to Google")}
          </button>
        </div>
      </div>
    </dialog>
  );

  return { notice, confirm };
}
