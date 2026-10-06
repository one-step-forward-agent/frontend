// src/components/onboarding/AppleAndGoogleLogging.tsx
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Check, ChevronDown, ChevronUp,
  GraduationCap, Link2, Info, Loader2, ShieldCheck,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;
const OAUTH_QUEUE_KEY = "onboarding:oauth-queue";
const OAUTH_SELECTED_KEY = "onboarding:selected-integrations";

/** Уровень Liquid Glass — одна строка меняет всю страницу */
const G = glass.strong;

/* ─── Спекулярный блик поверх стекла ─────────────────────── */
const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

// ---------- Интеграции ----------

type IntegrationKind = "oauth" | "manual";

type Integration = {
  id:
    | "google" | "apple" | "jira" | "notion"
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

// ---------- Режим работы ----------

/**
 * Demo-режим включается, когда не заданы OAuth-ключи.
 * В этом случае редиректа на провайдера нет — показываем оверлей и
 * «подключаем» сервисы последовательно.
 */
const DEMO_MODE =
  !import.meta.env.VITE_GOOGLE_CLIENT_ID &&
  !import.meta.env.VITE_APPLE_CLIENT_ID &&
  !import.meta.env.VITE_JIRA_CLIENT_ID &&
  !import.meta.env.VITE_SLACK_CLIENT_ID;

// ---------- OAuth URL-строители (для real-mode) ----------

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
    case "trueconf":
      // В MVP не имеют классического OAuth-редиректа: Telegram — через bot-login,
      // TrueConf — on-prem подключение.
      return "";
  }
};

/* ─── Стеклянный разделитель ───────────────────────────── */
const SectionDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-white/60 dark:bg-white/10" />
    <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
      {children}
    </span>
    <div className="h-px flex-1 bg-white/60 dark:bg-white/10" />
  </div>
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------- Компонент ----------

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

  // ─── Возврат из OAuth (real-mode) ─────────────────
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
      // Провайдер без OAuth — сразу к следующему в очереди
      update("integrations", []);
    }
  }, [searchParams, navigate, update]);

  // ─── Клик «Далее» ─────────────────────────────────
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
      navigate("/onboarding/sources-import");
      return;
    }

    if (oauthQueue.length === 0) {
      update("integrations", selected);
      update("googleConnected", selected.includes("google"));
      navigate("/onboarding/sources-import");
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
        <div className="relative space-y-5">
          {/* ─── Eyebrow ─────────────────────────────── */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "relative inline-flex items-center gap-1.5",
                "px-2.5 py-1 rounded-full",
                G.surface,
                "text-[11px] uppercase tracking-widest font-medium",
                "text-gray-600 dark:text-gray-300"
              )}
            >
              <Link2 size={11} aria-hidden="true" />
              Интеграции
            </span>
          </div>

          {/* ─── Сетка интеграций ──────────────────── */}
          <div className="grid sm:grid-cols-2 gap-2.5">
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
                    "group relative isolate overflow-hidden text-left",
                    "rounded-2xl p-4",
                    G.surface,
                    // ─── Синий акцент в active ───
                    active && [
                      "ring-2 ring-blue-500/60 dark:ring-blue-400/60",
                      "shadow-[0_12px_40px_rgba(59,130,246,0.20),inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(255,255,255,0.4)]",
                    ],
                    "transition-all duration-300",
                    "hover:-translate-y-0.5",
                    "hover:bg-white/70 dark:hover:bg-gray-900/55",
                    "disabled:opacity-50 disabled:pointer-events-none"
                  )}
                >
                  <SpecularHighlight className="opacity-90" />

                  {/* Ореол за активной карточкой */}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute -inset-4 -z-10 rounded-full blur-2xl opacity-25 bg-gradient-to-br from-blue-400/60 to-indigo-500/40"
                    />
                  )}

                  <div className="relative flex items-start gap-3">
                    {/* Стеклянная плашка иконки — нейтральная */}
                    <div
                      className={cn(
                        "relative shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                        "overflow-hidden transition-all duration-300",
                        "backdrop-blur-md ring-1",
                        active
                          ? [
                              "bg-blue-500/15 dark:bg-blue-500/15",
                              "ring-blue-400/60",
                              "shadow-[0_4px_14px_rgba(59,130,246,0.30),inset_0_1px_0_rgba(255,255,255,0.6)]",
                            ]
                          : [
                              "bg-white/60 dark:bg-white/[0.06]",
                              "ring-white/70 dark:ring-white/10",
                              "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.06)]",
                              "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.35)]",
                            ]
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[0.5px]"
                      />
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

                    {/* Индикатор — стеклянная капсула, в active — синяя */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center",
                        "transition-all duration-300",
                        active
                          ? [
                              "bg-blue-500 border border-blue-400/70 text-white",
                              "shadow-[0_2px_8px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]",
                              "scale-100",
                            ]
                          : [
                              "border border-white/70 dark:border-white/15",
                              "bg-white/40 dark:bg-white/[0.05]",
                              "backdrop-blur-sm",
                              "scale-95",
                            ]
                      )}
                    >
                      {active && (
                        <Check size={12} strokeWidth={3} className="relative" />
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>


          {/* ─── Гайд для ВШЭ ────────────────────────── */}
          <div className={cn("relative overflow-hidden rounded-2xl", G.surface)}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-1 h-14 rounded-full bg-gradient-to-b from-white/60 to-transparent opacity-60 blur-md"
            />

            <div className="relative p-4 md:p-5">
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
                    "bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                    "ring-1 ring-emerald-400/40 dark:ring-emerald-400/30",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(15,23,42,0.05)]"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent blur-[0.5px]"
                  />
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
                    "mt-4 ml-12 space-y-2 text-sm text-gray-600 dark:text-gray-400",
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
                          "bg-emerald-500/15 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
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

          {/* ─── Подсказка про пропуск ─────────────── */}
          {selected.length === 0 && (
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Можно пропустить — подключите интеграции позже в настройках
              </p>
            </div>
          )}
        </div>
      </OnboardingLayout>

      {/* ─── Оверлей подключения — Liquid Glass ─── */}
      {phase === "connecting" && currentProvider && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center",
            "bg-white/60 dark:bg-gray-950/70 backdrop-blur-xl"
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="oauth-title"
        >
          <div className={cn("relative max-w-sm w-full mx-4 overflow-hidden rounded-2xl", G.surface)}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-1 h-16 rounded-full bg-gradient-to-b from-white/60 to-transparent opacity-70 blur-md"
            />

            <div className="relative p-6 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  {/* Ореол вокруг логотипа */}
                  <span
                    aria-hidden="true"
                    className="absolute -inset-3 rounded-3xl bg-blue-400/40 dark:bg-blue-500/30 blur-2xl"
                  />

                  {/* Стеклянная плашка логотипа */}
                  <div
                    className={cn(
                      "relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden",
                      "bg-white/60 dark:bg-white/[0.06]",
                      "ring-1 ring-white/70 dark:ring-white/10",
                      "backdrop-blur-md",
                      "shadow-[0_8px_32px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]",
                      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-2 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/80 to-transparent blur-[1px]"
                    />
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

              {/* Прогресс-полоска в стекле */}
              <div
                className={cn(
                  "mt-5 h-1 w-full rounded-full overflow-hidden",
                  "bg-white/40 dark:bg-white/[0.05]",
                  "ring-1 ring-white/60 dark:ring-white/10",
                  "shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]"
                )}
              >
                <div
                  className={cn(
                    "h-full w-full origin-left",
                    "bg-gradient-to-r from-blue-500 to-indigo-500",
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