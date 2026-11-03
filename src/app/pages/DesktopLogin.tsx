import { useState } from "react";
import { api } from "../api/client";
import { useUser } from "../auth";
import { Button, useErrorToast } from "../components/ui";
import { Link, useTitle } from "../router";
import { GlassCard } from "@/components/dashboard/glass";
import { tr } from "@/i18n";

/**
 * /app/desktop-login?port=…&challenge=…&state=…: the Deyla app for Windows opens this page to sign in through the
 * browser — any account, Google and Yandex ones too. «Разрешить» sends the browser back to the app on this computer
 * (127.0.0.1) with a one-time code only that app can use (backend app/api/desktop.py).
 */
export function DesktopLoginPage() {
  useTitle(tr("Вход в приложение для компьютера", "Sign in to the desktop app"));
  const user = useUser();
  const query = new URLSearchParams(window.location.search);
  const port = Number(query.get("port"));
  const challenge = query.get("challenge") ?? "";
  const state = query.get("state") ?? "";
  const valid = Number.isInteger(port) && port >= 1024 && port <= 65535 && /^[\w-]{43,128}$/.test(challenge) && /^[\w-]{8,64}$/.test(state);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"allowed" | "denied" | null>(null);
  const reportError = useErrorToast();

  const allow = async () => {
    setBusy(true);
    try {
      const { redirect } = await api.desktop.authorize({ port, challenge, state });
      setDone("allowed");
      window.location.href = redirect;
    } catch (error) {
      reportError(error instanceof Error ? error.message : tr("Не получилось — попробуйте ещё раз", "That didn't work — try again"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page max-w-xl mx-auto">
      <GlassCard title={tr("Вход в Дейлу на компьютере", "Sign in to Deyla on your computer")}>
        {!valid ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {tr("Ссылка неполная. Нажмите «Войти через браузер» в приложении ещё раз.", "The link is incomplete. Press “Sign in through the browser” in the app again.")}
          </p>
        ) : done === "allowed" ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {tr("Готово — вернитесь в приложение. Эту вкладку можно закрыть.", "Done — go back to the app. You can close this tab.")}
          </p>
        ) : done === "denied" ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {tr("Вход отменён. Эту вкладку можно закрыть.", "Sign-in cancelled. You can close this tab.")} <Link to="/">{tr("На главную", "Go home")}</Link>
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-200">
              {tr("Приложение Deyla на этом компьютере просит войти в аккаунт", "The Deyla app on this computer asks to sign in to")}{" "}
              <b>{user.email}</b>.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tr(
                "Разрешайте, только если вы сами только что нажали «Войти через браузер» в приложении. Выйти из приложения можно кнопкой «Выйти» в нём.",
                "Allow only if you have just pressed “Sign in through the browser” in the app yourself. You can sign the app out with its “Sign out” button."
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="primary" icon="check" busy={busy} onClick={allow}>
                {tr("Разрешить", "Allow")}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => setDone("denied")}>
                {tr("Отмена", "Cancel")}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
