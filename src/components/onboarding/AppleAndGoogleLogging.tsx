// src/components/onboarding/AppleAndGoogleLogging.tsx
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Check, ChevronDown, ChevronUp,
  GraduationCap, Link2, Loader2,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { cn } from "@/utils/cn";

const TOTAL = 10;
const OAUTH_QUEUE_KEY = "onboarding:oauth-queue";
const OAUTH_SELECTED_KEY = "onboarding:selected-integrations";

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

type IntegrationKind = "oauth" | "manual";

type Integration = {
  id:
    | "google" | "apple" | "jira" | "notion" | "obsidian"
    | "telegram" | "slack" | "trueconf";
  name: string;
  hint: string;
  src: string;
  w: number;
  kind: IntegrationKind;
};

const INTEGRATIONS: Integration[] = [
  {
    id: "google",
    name: "Google Calendar",
    hint: "Учитываю занятые интервалы, когда предлагаю слоты",
    src: "/images/google-calendar.png",
    w: 40,
    kind: "oauth",
  },
  {
    id: "apple",
    name: "Apple Calendar",
    hint: "События из macOS и iPhone — в одном плане дня",
    src: `/images/${encodeURIComponent("Календарь_для_macOS.png")}`,
    w: 40,
    kind: "oauth",
  },
  {
    id: "jira",
    name: "Jira",
    hint: "Задачи из спринта попадают в календарь как обычные дела",
    src: "/images/Jira_Software_Logo.svg",
    w: 36,
    kind: "oauth",
  },
  {
    id: "notion",
    name: "Notion",
    hint: "Страницы и чек-листы — в едином ритме с задачами",
    src: "/images/Notion.png",
    w: 40,
    kind: "oauth",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    hint: "Идеи и заметки, которые стоит превратить в действия",
    src: "/images/Obsidian.png",
    w: 40,
    kind: "manual",
  },
  {
    id: "telegram",
    name: "Telegram",
    hint: "Сообщения и пересланные события — сразу в план дня",
    src: "/images/TelegramWB.png",
    w: 40,
    kind: "oauth",
  },
  {
    id: "slack",
    name: "Slack",
    hint: "Рабочие обсуждения превращаю в задачи и напоминания",
    src: "/images/slack.png",
    w: 40,
    kind: "oauth",
  },
  {
    id: "trueconf",
    name: "TrueConf",
    hint: "Созвоны и встречи попадают в календарь автоматически",
    src: "/images/tc_logo_square.png",
    w: 40,
    kind: "manual",
  },
];

const DEMO_MODE =
  !import.meta.env.VITE_GOOGLE_CLIENT_ID &&
  !import.meta.env.VITE_APPLE_CLIENT_ID &&
  !import.meta.env.VITE_JIRA_CLIENT_ID &&
  !import.meta.env.VITE_SLACK_CLIENT_ID;

const REDIRECT_URI = () =>
  `${window.location.origin}/onboarding/apple-google-logging`;

const buildOAuthUrl = (id: Integration["id"], state: string): string => {
  const redirect = REDIRECT_URI();
  switch (id) {
    case "google": {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
        redirect_uri: redirect,
        response_type: "code",
        scope: "https://www.googleapis.com/auth/calendar.readonly",
        access_type: "offline",
        prompt: "consent",
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }
    case "apple": {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_APPLE_CLIENT_ID ?? "",
        redirect_uri: redirect,
        response_type: "code",
        scope: "calendars",
        state,
      });
      return `https://appleid.apple.com/auth/authorize?${params}`;
    }
    case "jira": {
      const params = new URLSearchParams({
        audience: "api.atlassian.com",
        client_id: import.meta.env.VITE_JIRA_CLIENT_ID ?? "",
        scope: "read:jira-work read:jira-user offline_access",
        redirect_uri: redirect,
        state,
        response_type: "code",
        prompt: "consent",
      });
      return `https://auth.atlassian.com/authorize?${params}`;
    }
    case "notion": {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_NOTION_CLIENT_ID ?? "",
        redirect_uri: redirect,
        response_type: "code",
        owner: "user",
        state,
      });
      return `https://api.notion.com/v1/oauth/authorize?${params}`;
    }
    case "slack": {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_SLACK_CLIENT_ID ?? "",
        redirect_uri: redirect,
        scope: "channels:history,channels:read,users:read",
        state,
      });
      return `https://slack.com/oauth/v2/authorize?${params}`;
    }
    case "telegram":
    case "obsidian":
    case "trueconf":
      return "";
  }
};

const SectionDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-white/30 dark:bg-white/10" />
    <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
      {children}
    </span>
    <div className="h-px flex-1 bg-white/30 dark:bg-white/10" />
  </div>
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const AppleAndGoogleLogging: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data, update } = useOnboarding();

  const [selected, setSelected] = React.useState<string[]>(
    () => data.integrations ?? []
  );
  const [showGuide, setShowGuide] = React.useState(false);

  const [phase, setPhase] = React.useState<"idle" | "connecting">("idle");
  const [currentProvider, setCurrentProvider] = React.useState<Integration | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  React.useEffect(() => {
    if (DEMO_MODE) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code && !state) return;

    const queue: string[] = JSON.parse(
      sessionStorage.getItem(OAUTH_QUEUE_KEY) ?? "[]"
    );

    if (queue.length === 0) {
      const saved: string[] = JSON.parse(
        sessionStorage.getItem(OAUTH_SELECTED_KEY) ?? "[]"
      );
      sessionStorage.removeItem(OAUTH_QUEUE_KEY);
      sessionStorage.removeItem(OAUTH_SELECTED_KEY);
      update("integrations", saved);
      update("googleConnected", saved.includes("google"));
      navigate("/onboarding/sources-import", { replace: true });
      return;
    }

    const [next, ...rest] = queue;
    sessionStorage.setItem(OAUTH_QUEUE_KEY, JSON.stringify(rest));
    const provider = INTEGRATIONS.find((i) => i.id === next);
    if (!provider) return;

    const url = buildOAuthUrl(provider.id, JSON.stringify({ provider: provider.id }));
    if (url) window.location.href = url;
    else {
      update("integrations", []);
    }
  }, [searchParams, navigate, update]);

  const handleNext = async () => {
    if (selected.length === 0) {
      update("integrations", []);
      update("googleConnected", false);
      navigate("/onboarding/fast-tasks-enter");
      return;
    }

    const oauthQueue = selected.filter(
      (id) => INTEGRATIONS.find((i) => i.id === id)?.kind === "oauth"
    );

    if (DEMO_MODE) {
      setPhase("connecting");
      for (const id of selected) {
        const provider = INTEGRATIONS.find((i) => i.id === id);
        if (!provider) continue;
        setCurrentProvider(provider);
        await sleep(900);
      }
      setCurrentProvider(null);
      setPhase("idle");

      update("integrations", selected);
      update("googleConnected", selected.includes("google"));
      navigate("/onboarding/fast-tasks-enter");
      return;
    }

    if (oauthQueue.length === 0) {
      update("integrations", selected);
      update("googleConnected", selected.includes("google"));
      navigate("/onboarding/fast-tasks-enter");
      return;
    }

    sessionStorage.setItem(OAUTH_SELECTED_KEY, JSON.stringify(selected));
    sessionStorage.setItem(OAUTH_QUEUE_KEY, JSON.stringify(oauthQueue.slice(1)));

    const first = INTEGRATIONS.find((i) => i.id === oauthQueue[0]);
    if (!first) return;

    const url = buildOAuthUrl(first.id, JSON.stringify({ provider: first.id }));
    if (url) window.location.href = url;
  };

  return (
    <>
      <OnboardingLayout
        step={6}
        totalSteps={TOTAL}
        title="Что подключим?"
        onBack={() => navigate("/onboarding/existing-plans")}
        onNext={handleNext}
        onSkip={() => navigate("/onboarding/sources-import")}
        nextDisabled={phase === "connecting"}
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

          {/* ─── Сетка интеграций ─────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {INTEGRATIONS.map((i) => {
              const active = selected.includes(i.id);

              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggle(i.id)}
                  disabled={phase === "connecting"}
                  aria-pressed={active}
                  className={cn(
                    "group relative overflow-hidden text-left",
                    "rounded-2xl p-3.5 sm:p-4",
                    GLASS_BODY,
                    "transition-transform duration-300",
                    "hover:-translate-y-0.5",
                    "disabled:opacity-50 disabled:pointer-events-none"
                  )}
                  style={active ? { boxShadow: ACTIVE_RING_SKY } : undefined}
                >
                  <span aria-hidden="true" className={GLASS_SHEEN} />

                  <div className="relative flex items-start gap-3">
                    {/* Иконка-плашка */}
                    <div
                      className={cn(
                        "relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center",
                        "overflow-hidden transition-all duration-300",
                        "backdrop-blur-3xl ring-1",
                        "bg-white/[0.06] dark:bg-white/[0.02]",
                        active
                          ? "ring-sky-400/60"
                          : "ring-white/30 dark:ring-white/10"
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

                    {/* Текст */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white leading-snug">
                        {i.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {i.hint}
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
                    "bg-white/[0.06] dark:bg-white/[0.02]",
                    "backdrop-blur-3xl",
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
                <ol
                  className={cn(
                    "mt-4 sm:ml-12 space-y-2 text-sm text-gray-600 dark:text-gray-400",
                    "animate-in fade-in slide-in-from-top-1 duration-300"
                  )}
                >
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

      {/* ─── Оверлей подключения ─────────────────── */}
      {phase === "connecting" && currentProvider && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center px-4",
            "bg-white/60 dark:bg-gray-950/70 backdrop-blur-xl"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="oauth-title"
        >
          <div
            className={cn(
              "relative max-w-sm w-full overflow-hidden rounded-2xl",
              GLASS_BODY
            )}
          >
            <span aria-hidden="true" className={GLASS_SHEEN} />

            <div className="relative p-6 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute -inset-3 rounded-3xl bg-sky-400/30 dark:bg-sky-500/25 blur-2xl"
                  />

                  <div
                    className={cn(
                      "relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden",
                      "bg-white/[0.06] dark:bg-white/[0.02]",
                      "ring-1 ring-white/30 dark:ring-white/10",
                      "backdrop-blur-3xl",
                      "shadow-[0_8px_32px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.8)]",
                      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]"
                    )}
                  >
                    <img
                      src={currentProvider.src}
                      alt={currentProvider.name}
                      style={{ width: currentProvider.w + 6, height: "auto" }}
                      className="relative max-h-9 object-contain select-none pointer-events-none"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>

              <p
                id="oauth-title"
                className="mt-5 font-medium text-gray-900 dark:text-white"
              >
                Подключаем {currentProvider.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Это займёт пару секунд
              </p>

              <div
                className={cn(
                  "mt-5 h-1 w-full rounded-full overflow-hidden",
                  "bg-white/[0.06] dark:bg-white/[0.02]",
                  "ring-1 ring-white/30 dark:ring-white/10",
                  "shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]"
                )}
              >
                <div
                  className={cn(
                    "h-full w-full origin-left",
                    "bg-gradient-to-r from-sky-400 to-blue-500",
                    "animate-[oauth-progress_1.2s_ease-in-out]"
                  )}
                />
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                <span>Не закрывайте вкладку</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes oauth-progress {
          0%   { transform: scaleX(0); }
          60%  { transform: scaleX(0.85); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </>
  );
};