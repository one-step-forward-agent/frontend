// src/components/onboarding/AppleAndGoogleLogging.tsx
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Check, ChevronDown, ChevronUp,
  GraduationCap, Link2,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { cn } from "@/utils/cn";

const TOTAL = 10;
const PENDING_KEY = "oauth:pending";

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-3xl " +
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
  | "google" | "apple" | "jira" | "notion" | "slack" | "telegram";

export type ManualProvider = "obsidian" | "trueconf";
export type Provider = OAuthProvider | ManualProvider;

type Integration = {
  id: Provider;
  name: string;
  src: string;
  w: number;
  kind: "oauth" | "manual";
};

const INTEGRATIONS: Integration[] = [
  { id: "google",   name: "Google Calendar", src: "/images/google-calendar.png",     w: 40, kind: "oauth" },
  { id: "apple",    name: "Apple Calendar",  src: `/images/${encodeURIComponent("Календарь_для_macOS.png")}`, w: 40, kind: "oauth" },
  { id: "jira",     name: "Jira",            src: "/images/Jira_Software_Logo.svg",  w: 36, kind: "oauth" },
  { id: "notion",   name: "Notion",          src: "/images/Notion.png",              w: 40, kind: "oauth" },
  { id: "slack",    name: "Slack",           src: "/images/slack.png",               w: 40, kind: "oauth" },
  { id: "telegram", name: "Telegram",        src: "/images/TelegramWB.png",          w: 40, kind: "oauth" },
  { id: "obsidian", name: "Obsidian",        src: "/images/Obsidian.png",            w: 40, kind: "manual" },
  { id: "trueconf", name: "TrueConf",        src: "/images/tc_logo_square.png",      w: 40, kind: "manual" },
];

const isOAuthProvider = (id: Provider): id is OAuthProvider =>
  INTEGRATIONS.find((i) => i.id === id)?.kind === "oauth";

/* ─── URL-строитель OAuth ────────────────────────────────── */

const buildOAuthUrl = (
  id: OAuthProvider,
  state: string,
  redirectUri: string
): string => {
  const params = (obj: Record<string, string>) =>
    new URLSearchParams(obj).toString();

  switch (id) {
    case "google":
      return `https://accounts.google.com/o/oauth2/v2/auth?${params({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        access_type: "offline",
        prompt: "consent",
        state,
      })}`;

    case "apple":
      return `https://appleid.apple.com/auth/authorize?${params({
        client_id: import.meta.env.VITE_APPLE_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "name email",
        response_mode: "form_post",
        state,
      })}`;

    case "jira":
      return `https://auth.atlassian.com/authorize?${params({
        audience: "api.atlassian.com",
        client_id: import.meta.env.VITE_JIRA_CLIENT_ID!,
        scope: "read:jira-work read:jira-user offline_access",
        redirect_uri: redirectUri,
        state,
        response_type: "code",
        prompt: "consent",
      })}`;

    case "notion":
      return `https://api.notion.com/v1/oauth/authorize?${params({
        client_id: import.meta.env.VITE_NOTION_CLIENT_ID!,
        redirect_uri: redirectUri,
        response_type: "code",
        owner: "user",
        state,
      })}`;

    case "slack":
      return `https://slack.com/oauth/v2/authorize?${params({
        client_id: import.meta.env.VITE_SLACK_CLIENT_ID!,
        redirect_uri: redirectUri,
        scope: "channels:history,channels:read,users:read",
        state,
      })}`;

    case "telegram":
      return `https://oauth.telegram.org/auth?${params({
        bot_id: import.meta.env.VITE_TELEGRAM_BOT_ID!,
        origin: window.location.origin,
        request_access: "write",
        return_to: `${redirectUri}?state=${encodeURIComponent(state)}`,
      })}`;
  }
};

const buildCallbackBase = (redirectUri: string) =>
  redirectUri.replace(/\/onboarding\/.*$/, "/api/oauth/callback");

/* ─── Pending-состояние OAuth-цепочки ───────────────────── */

type PendingOAuth = {
  selected: Provider[];
  queue: OAuthProvider[];
  startedAt: number;
};

/* ─── Компонент ─────────────────────────────────────────── */

export const AppleAndGoogleLogging: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, update } = useOnboarding();

  // data.integrations — string[], но по факту это Provider[].
  // Приводим через filter+type guard, чтобы не гадать.
  const initialSelected: Provider[] = React.useMemo(
    () =>
      ((data.integrations ?? []) as string[]).filter((id): id is Provider =>
        INTEGRATIONS.some((i) => i.id === id)
      ),
    [data.integrations]
  );

  const [selected, setSelected] = React.useState<Provider[]>(initialSelected);
  const [showGuide, setShowGuide] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const toggle = (id: Provider) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError(null);
  };

  /* ─── Возврат с OAuth ─────────────────────────────── */
  React.useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const provider = searchParams.get("provider") as OAuthProvider | null;

    if (!code && !state) return;

    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;

    const pending: PendingOAuth = JSON.parse(raw);

    // CSRF-проверка: state должен совпадать с первым в очереди
    const expected = pending.queue[0] ?? null;
    if (!expected || state !== expected) {
      setError("Ошибка авторизации: несовпадение state.");
      sessionStorage.removeItem(PENDING_KEY);
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `${buildCallbackBase(import.meta.env.VITE_OAUTH_REDIRECT_URI!)}/${provider ?? "unknown"}`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, state }),
          }
        );
        if (!res.ok) throw new Error(await res.text());
      } catch {
        setError("Не удалось завершить подключение. Попробуйте ещё раз.");
        sessionStorage.removeItem(PENDING_KEY);
        return;
      }

      const [, ...rest] = pending.queue;

      if (rest.length === 0) {
        // Все провайдеры подключены
        sessionStorage.removeItem(PENDING_KEY);
        update("integrations", pending.selected);
        update("googleConnected", pending.selected.includes("google"));
        navigate("/onboarding/sources-import", { replace: true });
        return;
      }

      // Обновляем очередь и идём к следующему
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ ...pending, queue: rest } satisfies PendingOAuth)
      );

      const nextId = rest[0];
      const url = buildOAuthUrl(
        nextId,
        nextId,
        import.meta.env.VITE_OAUTH_REDIRECT_URI!
      );
      window.location.href = url;
    })();
  }, [searchParams, navigate, update]);

  /* ─── Старт OAuth-цепочки ─────────────────────────── */
  const handleNext = () => {
    setError(null);

    if (selected.length === 0) {
      update("integrations", []);
      update("googleConnected", false);
      navigate("/onboarding/sources-import");
      return;
    }

    const oauthQueue = selected.filter(isOAuthProvider);
    const manualOnly = selected.filter((id) => !isOAuthProvider(id));

    // manual-провайдеры сохраняются сразу — они подключаются в настройках
    update("integrations", [...manualOnly, ...oauthQueue]);
    update("googleConnected", selected.includes("google"));

    if (oauthQueue.length === 0) {
      navigate("/onboarding/sources-import");
      return;
    }

    const pending: PendingOAuth = {
      selected,
      queue: oauthQueue,
      startedAt: Date.now(),
    };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));

    const firstId = oauthQueue[0];
    const url = buildOAuthUrl(
      firstId,
      firstId,
      import.meta.env.VITE_OAUTH_REDIRECT_URI!
    );
    window.location.href = url;
  };

  return (
    <>
      <OnboardingLayout
        step={6}
        totalSteps={TOTAL}
        title="Что подключим?"
        onBack={() => navigate("/onboarding/existing-plans")}
        onNext={handleNext}
        onSkip={() => navigate("/onboarding/fast-tasks-enter")}
        nextLabel={
          selected.length > 0
            ? `Подключить${selected.length > 1 ? ` (${selected.length})` : ""}`
            : "Далее"
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
              <span className="relative">Интеграции</span>
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
                  aria-pressed={active}
                  className={cn(
                    "group relative overflow-hidden text-left",
                    "rounded-2xl p-3.5 sm:p-4",
                    GLASS_BODY,
                    "transition-transform duration-300",
                    "hover:-translate-y-0.5"
                  )}
                  style={active ? { boxShadow: ACTIVE_RING_SKY } : undefined}
                >
                  <span aria-hidden="true" className={GLASS_SHEEN} />

                  <div className="relative flex items-center gap-3">
                    <div
                      className={cn(
                        "relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
                        "overflow-hidden transition-all duration-300",
                        "backdrop-blur-3xl ring-1",
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
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ─── Гайд ВШЭ ─────────────────────────────── */}
          <div className={cn("relative overflow-hidden rounded-2xl", GLASS_BODY)}>
            <span aria-hidden="true" className={GLASS_SHEEN} />

            <div className="relative p-3.5 sm:p-5">
              <button
                type="button"
                onClick={() => setShowGuide((v) => !v)}
                aria-expanded={showGuide}
                className="w-full flex items-start gap-3 text-left"
              >
                <div
                  aria-hidden="true"
                  className={cn(
                    "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden",
                    "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-3xl",
                    "ring-1 ring-emerald-400/40 dark:ring-emerald-400/30",
                    "text-emerald-700 dark:text-emerald-300",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  )}
                >
                  <GraduationCap size={16} className="relative" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Студент Вышки?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Покажем, как импортировать расписание пар в Google Calendar.
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="shrink-0 mt-1 text-gray-400 dark:text-gray-500"
                >
                  {showGuide ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </button>

              {showGuide && (
                <ol className="mt-4 sm:ml-12 space-y-2 text-sm text-gray-600 dark:text-gray-400 animate-in fade-in slide-in-from-top-1 duration-300">
                  {[
                    "Откройте личный кабинет ВШЭ → раздел «Расписание».",
                    "Выгрузите расписание в формате ICS.",
                    "В Google Calendar выберите «Импорт» и загрузите файл.",
                    "Вернитесь сюда — выберите этот календарь в списке.",
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
                          "text-[11px] font-semibold",
                          "bg-emerald-500/15 dark:bg-emerald-500/15",
                          "text-emerald-700 dark:text-emerald-300",
                          "ring-1 ring-emerald-400/40 dark:ring-emerald-400/30"
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </OnboardingLayout>
    </>
  );
};