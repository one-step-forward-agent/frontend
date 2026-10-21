// src/components/onboarding/Integrations.tsx
import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Link2 } from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useGoogleNotice } from "@/app/components/GoogleNotice";
import { useOnboarding } from "./OnboardingContext";
import { cn } from "@/utils/cn";
import { api, type SignInProvider } from "@/app/api/client";
import { errorText } from "@/app/lib/format";
import { ConsentCheckbox } from "@/pages/Auth/RegisterPage";
import { useAuthStore } from "@/store/authStore";
import { tr } from "@/i18n";

const TOTAL = 2;

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_SHEEN =
  "pointer-events-none absolute inset-0 rounded-2xl " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const GLASS_SHEEN_PILL =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const ACTIVE_RING_SKY =
  "0 0 0 1.5px rgba(56,189,248,0.6), 0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)";

/* ─── Провайдеры ─────────────────────────────────────────── */

export type OAuthProvider =
  | "google" | "apple" | "jira" | "notion" | "slack" | "telegram" | "yandex";

export type ManualProvider = "trueconf";
export type Provider = OAuthProvider | ManualProvider;

type Integration = {
  id: Provider;
  name: string;
  src: string;
  w: number;
  kind: "oauth" | "manual";
  // Not open for connecting yet: shown with "Coming soon" and can't be picked
  soon?: boolean;
};

const INTEGRATIONS: Integration[] = [
  { id: "google", name: "Google Calendar",  src: "/images/google-calendar.png",     w: 40, kind: "oauth" },
  { id: "yandex", name: tr("Яндекс Календарь", "Yandex Calendar"), src: "/images/yandexcalendar.png",      w: 40, kind: "oauth" },
  { id: "jira",   name: "Jira",             src: "/images/Jira_Software_Logo.svg", w: 36, kind: "oauth" },
  { id: "notion", name: "Notion",           src: "/images/Notion.webp",             w: 40, kind: "oauth", soon: true },
];

const isOAuthProvider = (id: Provider): id is OAuthProvider =>
  INTEGRATIONS.find((i) => i.id === id)?.kind === "oauth";

// Without an account the first of these creates it: its email becomes the Dayla account, no password needed
const SIGN_UP_WITH: { id: SignInProvider; name: string }[] = [
  { id: "google", name: "Google" },
  { id: "yandex", name: tr("Яндекс ID", "Yandex ID") },
];

// Back here after signing up or logging in: ?resume=1 connects the remaining chosen services
const RESUME_PATH = "/onboarding/integrations?resume=1";

const loadConnected = (): Promise<Provider[]> =>
  api.integrations
    .list()
    .then((items) =>
      items
        .filter((i) => i.connection && INTEGRATIONS.some((x) => x.id === i.slug))
        .map((i) => i.slug as Provider)
    )
    .catch(() => []);

/* ─── Компонент ─────────────────────────────────────────── */

export const Integrations: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, update } = useOnboarding();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const needsAccount = !authLoading && !isAuthenticated;

  const initialSelected: Provider[] = React.useMemo(
    () =>
      ((data.integrations ?? []) as string[]).filter((id): id is Provider =>
        INTEGRATIONS.some((i) => i.id === id && !i.soon)
      ),
    [data.integrations]
  );

  const [selected, setSelected] = React.useState<Provider[]>(initialSelected);
  const [error, setError] = React.useState<string | null>(null);

  // Провайдеры, у которых OAuth уже прошёл (по данным бэкенда и по ?connected=).
  const [connected, setConnected] = React.useState<Provider[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [consentGiven, setConsentGiven] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);

  const signUpWith = SIGN_UP_WITH.find((provider) => selected.includes(provider.id));
  const google = useGoogleNotice();

  React.useEffect(() => {
    if (!isAuthenticated) return;
    // загрузит обработчик возврата с OAuth
    if (searchParams.has("connected") || searchParams.has("resume")) return;
    loadConnected().then(setConnected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const toggle = (id: Provider) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError(null);
  };

  /* ─── Старт OAuth у следующего неподключённого провайдера ─── */
  // URL с правильными client_id, scope, redirect_uri и подписанным
  // state генерирует бэкенд — фронт только редиректит.
  const connectNext = async (queue: Provider[], done: Provider[]) => {
    const next = queue.filter(isOAuthProvider).find((id) => !done.includes(id));
    if (!next) {
      navigate("/onboarding/finish");
      return;
    }
    if (next === "google" && !(await google.confirm())) return;
    setBusy(true);
    try {
      const result = await api.integrations.connect(next, {}, window.location.pathname);
      if ("authorization_url" in result) {
        window.location.assign(result.authorization_url);
        return;
      }
      await connectNext(queue, [...done, next]);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  /* ─── Возврат с OAuth ─────────────────────────────── */
  // Бэкенд сам обменивает code на токен и редиректит сюда
  // с ?connected=<provider> или ?error=<сообщение>.
  React.useEffect(() => {
    const connectedParam = searchParams.get("connected") as Provider | null;
    const errorParam = searchParams.get("error");
    if (!connectedParam && !errorParam) return;

    const next = new URLSearchParams(searchParams);
    next.delete("connected");
    next.delete("error");
    next.delete("resume");
    setSearchParams(next, { replace: true });

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }
    if (connectedParam) {
      const queue = selected.includes(connectedParam) ? selected : [...selected, connectedParam];
      setSelected(queue);
      update("integrations", queue);
      setBusy(true);
      // Сверяемся с бэкендом, чтобы не запускать OAuth повторно для уже подключённых,
      // и продолжаем цепочку: подключаем следующий выбранный сервис.
      void loadConnected().then((fromServer) => {
        const done = [...new Set([...fromServer, connectedParam])];
        setConnected(done);
        return connectNext(queue, done);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ─── Возврат после регистрации или входа ─────────── */
  // ?resume=1: аккаунт появился — подключаем выбранные сервисы.
  React.useEffect(() => {
    if (!searchParams.has("resume") || searchParams.has("connected") || searchParams.has("error")) return;
    if (!isAuthenticated) return;
    const next = new URLSearchParams(searchParams);
    next.delete("resume");
    setSearchParams(next, { replace: true });
    setBusy(true);
    void loadConnected().then((fromServer) => {
      setConnected(fromServer);
      return connectNext(selected, fromServer);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isAuthenticated]);

  /* ─── Без аккаунта ─────────────────────────────── */
  // Google или Яндекс ID создают аккаунт по своему email. Яндекс сразу подключается;
  // Google — только аккаунт (без проверки Google), а его календарь подключается следом, если он отмечен;
  // остальные сервисы подключатся после обычной регистрации — выбор сохранён в онбординге.
  const createAccount = async () => {
    if (signUpWith) {
      if (!consentGiven || !termsAccepted) {
        setError(tr("Чтобы создать аккаунт, примите пользовательское соглашение и дайте согласие на обработку персональных данных", "To create an account, accept the terms of use and consent to the processing of personal data"));
        return;
      }
      if (signUpWith.id === "google" && !(await google.confirm())) return;
      setBusy(true);
      try {
        const { authorization_url } = await api.auth.oauthStart(signUpWith.id, {
          mode: "signup",
          return_to: RESUME_PATH,
          timezone: data.timezone,
          consent: true,
        });
        window.location.assign(authorization_url);
      } catch (err) {
        setError(errorText(err));
        setBusy(false);
      }
      return;
    }
    const next = selected.some(isOAuthProvider) ? RESUME_PATH : "/onboarding/finish";
    navigate(`/register?next=${encodeURIComponent(next)}`);
  };

  const handleNext = async () => {
    setError(null);
    // manual-провайдеры сохраняются сразу — они подключаются в настройках
    update("integrations", selected);
    if (needsAccount) {
      await createAccount();
      return;
    }
    await connectNext(selected, connected);
  };

  const pending = selected.filter((id) => isOAuthProvider(id) && !connected.includes(id));

  return (
    <>
      {google.notice}
      <OnboardingLayout
        step={2}
        totalSteps={TOTAL}
        title={tr("Что подключим?", "What shall we connect?")}
        onBack={() => navigate("/onboarding/field-of-activity")}
        onNext={handleNext}
        nextDisabled={busy}
        onSkip={() => navigate("/onboarding/finish")}
        nextLabel={
          busy
            ? tr("Подключаем…", "Connecting…")
            : needsAccount && signUpWith
              ? `${tr("Продолжить с", "Continue with")} ${signUpWith.name}`
              : needsAccount
                ? tr("Далее", "Next")
                : pending.length > 0
              ? `${tr("Подключить", "Connect")}${pending.length > 1 ? ` (${pending.length})` : ""}`
              : tr("Далее", "Next")
        }
      >
        <div className="relative space-y-4 sm:space-y-5">
          {/* ─── Eyebrow ─────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span
              className={cn(
                "relative inline-flex items-center gap-1.5 overflow-hidden",
                "px-2.5 py-1 rounded-full",
                GLASS_BODY,
                "text-[11px] uppercase tracking-widest font-medium",
                "text-gray-600 dark:text-gray-300"
              )}
            >
              <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
              <Link2 size={11} aria-hidden="true" className="relative" />
              <span className="relative">{tr("Интеграции", "Integrations")}</span>
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className={cn(
                "rounded-xl px-3 py-2 text-sm",
                "bg-red-500/10 dark:bg-red-500/10",
                "text-red-700 dark:text-red-300",
                "ring-1 ring-red-400/40"
              )}
            >
              {error}
            </div>
          )}

          {/* ─── Сетка интеграций ─────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INTEGRATIONS.map((i) => {
              const active = selected.includes(i.id);

              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggle(i.id)}
                  disabled={i.soon}
                  aria-pressed={active}
                  className={cn(
                    "group relative overflow-hidden text-left",
                    "rounded-2xl p-3.5 sm:p-4",
                    GLASS_BODY,
                    "transition-transform duration-300",
                    i.soon ? "cursor-default opacity-60" : "hover:-translate-y-0.5"
                  )}
                  style={active ? { boxShadow: ACTIVE_RING_SKY } : undefined}
                >
                  <span aria-hidden="true" className={GLASS_SHEEN} />

                  <div className="relative flex items-center gap-3">
                    <div
                      className={cn(
                        "relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
                        "overflow-hidden transition-all duration-300",
                        "backdrop-blur-xl ring-1",
                        "bg-white/[0.06] dark:bg-white/[0.02]",
                        active ? "ring-sky-400/60" : "ring-white/30 dark:ring-white/10"
                      )}
                      style={
                        active
                          ? {
                              backgroundColor: "rgba(56,189,248,0.15)",
                              boxShadow:
                                "0 4px 14px rgba(56,189,248,0.30), inset 0 1px 0 rgba(255,255,255,0.6)",
                            }
                          : undefined
                      }
                    >
                      <img
                        src={i.src}
                        alt={i.name}
                        style={{ width: i.w, height: "auto" }}
                        className="relative max-h-7 object-contain select-none pointer-events-none"
                        loading="lazy"
                        draggable={false}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white leading-snug">
                        {i.name}
                      </p>
                      {i.soon && !connected.includes(i.id) && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {tr("Скоро", "Coming soon")}
                        </p>
                      )}
                      {connected.includes(i.id) && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                          <Check size={12} aria-hidden="true" />
                          {tr("Подключено", "Connected")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ─── Аккаунт через Google / Яндекс ID ─── */}
          {needsAccount && signUpWith && (
            <div className="space-y-2.5">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
                {tr(
                  `Аккаунт Dayla создадим по email вашего аккаунта ${signUpWith.name} — пароль не нужен. Остальные выбранные сервисы подключим следом.`,
                  `We'll create your Dayla account with your ${signUpWith.name} email — no password needed. The other chosen services will be connected next.`
                )}
              </p>
              <ConsentCheckbox id="onboarding-consent" checked={consentGiven} onChange={setConsentGiven}>
                {tr(
                  "Я даю согласие на обработку моих персональных данных (имя, email) в целях регистрации и предоставления доступа к сервису. С",
                  "I consent to the processing of my personal data (name, email) for registration and access to the service. I have read and agree to the"
                )}{" "}
                <Link
                  to="/personal-data-consent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                >
                  {tr("условиями обработки ПД", "personal data terms")}
                </Link>{" "}
                {tr("ознакомлен(а) и согласен(а), с", "and the")}{" "}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                >
                  {tr("политикой конфиденциальности", "privacy policy")}
                </a>{tr(" — тоже.", ".")}
              </ConsentCheckbox>
              <ConsentCheckbox id="onboarding-terms" checked={termsAccepted} onChange={setTermsAccepted}>
                {tr("Я принимаю условия", "I accept the")}{" "}
                <Link
                  to="/terms-of-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
                >
                  {tr("пользовательского соглашения", "terms of use")}
                </Link>{" "}
                {tr("и обязуюсь их соблюдать.", "and agree to follow them.")}
              </ConsentCheckbox>
            </div>
          )}

          {needsAccount && !signUpWith && selected.some(isOAuthProvider) && (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-snug">
              {tr("Сначала создадим аккаунт, затем подключим выбранные сервисы.", "First we'll create the account, then connect the chosen services.")}
            </p>
          )}

        </div>
      </OnboardingLayout>
    </>
  );
};