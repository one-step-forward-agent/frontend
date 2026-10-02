// src/components/onboarding/AppleAndGoogleLogging.tsx
import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Link2,
  Info,
  Loader2,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const TOTAL = 10;
const OAUTH_QUEUE_KEY = "onboarding:oauth-queue";
const OAUTH_SELECTED_KEY = "onboarding:selected-integrations";

// ---------- Интеграции ----------

type IntegrationKind = "oauth" | "manual";

type Integration = {
  id: "google" | "apple" | "jira" | "notion" | "obsidian";
  name: string;
  hint: string;
  src: string;
  w: number;
  /** `oauth` — редирект на провайдера. `manual` — «подключается» без редиректа. */
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
    hint: "Страницы и чек-листы — в едином ритме с остальными задачами",
    src: "/images/Notion.png",
    w: 40,
    kind: "manual",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    hint: "Идеи и заметки, которые стоит превратить в действия",
    src: "/images/Obsidian.png",
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
  !import.meta.env.VITE_JIRA_CLIENT_ID;

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
    case "notion":
    case "obsidian":
      // Эти — без OAuth-редиректа в MVP.
      return "";
  }
};

// ---------- Вспомогательные ----------

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

  // Состояние процесса подключения
  const [phase, setPhase] = React.useState<"idle" | "connecting">("idle");
  const [currentProvider, setCurrentProvider] = React.useState<Integration | null>(
    null
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ─── Возврат из OAuth (real-mode) ─────────────────────
  React.useEffect(() => {
    if (DEMO_MODE) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code && !state) return;

    // Мы только что вернулись с OAuth-редиректа.
    // Забираем оставшуюся очередь и идём на следующего провайдера.
    const queue: string[] = JSON.parse(
      sessionStorage.getItem(OAUTH_QUEUE_KEY) ?? "[]"
    );

    if (queue.length === 0) {
      // Всё подключено — завершаем и идём дальше.
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

    window.location.href = buildOAuthUrl(
      provider.id,
      JSON.stringify({ provider: provider.id })
    );
  }, [searchParams, navigate, update]);

  // ─── Клик «Далее» ─────────────────────────────────────
  const handleNext = async () => {
    // 1. Ничего не выбрано — просто идём дальше.
    if (selected.length === 0) {
      update("integrations", []);
      update("googleConnected", false);
      navigate("/onboarding/sources-import");
      return;
    }

    // 2. Выбрано несколько — идём по очереди.
    const oauthQueue = selected.filter(
      (id) => INTEGRATIONS.find((i) => i.id === id)?.kind === "oauth"
    );

    if (DEMO_MODE) {
      // ─── Demo: симулируем подключение с оверлеем ────
      setPhase("connecting");
      for (const id of selected) {
        const provider = INTEGRATIONS.find((i) => i.id === id);
        if (!provider) continue;
        setCurrentProvider(provider);
        await sleep(1200);
      }
      setCurrentProvider(null);
      setPhase("idle");

      update("integrations", selected);
      update("googleConnected", selected.includes("google"));
      navigate("/onboarding/sources-import");
      return;
    }

    // ─── Real: если нет OAuth-очереди — просто идём дальше ────
    if (oauthQueue.length === 0) {
      update("integrations", selected);
      update("googleConnected", selected.includes("google"));
      navigate("/onboarding/sources-import");
      return;
    }

    // ─── Real: запускаем последовательный OAuth ────
    sessionStorage.setItem(OAUTH_SELECTED_KEY, JSON.stringify(selected));
    sessionStorage.setItem(
      OAUTH_QUEUE_KEY,
      JSON.stringify(oauthQueue.slice(1))
    );

    const first = INTEGRATIONS.find((i) => i.id === oauthQueue[0]);
    if (!first) return;

    window.location.href = buildOAuthUrl(
      first.id,
      JSON.stringify({ provider: first.id })
    );
  };

  return (
    <>
      <OnboardingLayout
        step={6}
        totalSteps={TOTAL}
        title="Что подключим?"
        subtitle="Deyla соединяет то, чем вы уже пользуетесь, в одну картину дня. Можно выбрать несколько — или пропустить и подключить позже в настройках."
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
        <div className="relative">
          {/* Мягкое свечение на фоне */}
          <div
            aria-hidden="true"
            className="absolute -inset-8 -z-10 pointer-events-none"
          >
            <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-violet-400/15 blur-3xl" />
          </div>

          {/* Шапка со счётчиком */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
              >
                <Link2 size={13} />
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                Интеграции
              </p>
            </div>

            {selected.length > 0 ? (
              <Badge variant="success">
                <Check size={11} className="mr-1" aria-hidden="true" />
                Выбрано: {selected.length}
              </Badge>
            ) : (
              <Badge variant="neutral">Ничего не выбрано</Badge>
            )}
          </div>

          {/* Сетка интеграций */}
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
                    "group relative text-left",
                    "rounded-2xl p-4",
                    "bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm",
                    "border transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-lg",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    active
                      ? "border-transparent ring-2 ring-blue-500/60 shadow-md"
                      : "border-gray-200/70 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300",
                      "bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />

                  <div className="relative flex items-start gap-3">
                    <div
                      className={cn(
                        "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                        "bg-white dark:bg-gray-800",
                        "border border-gray-200/70 dark:border-gray-700/60",
                        "shadow-sm",
                        "transition-transform duration-300 group-hover:scale-105"
                      )}
                    >
                      <img
                        src={i.src}
                        alt={i.name}
                        style={{ width: i.w, height: "auto" }}
                        className="max-h-7 object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white leading-snug">
                        {i.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {i.hint}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className={cn(
                        "shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                        active
                          ? "bg-blue-500 border-blue-500 text-white scale-100"
                          : "border-gray-300 dark:border-gray-600 scale-95"
                      )}
                    >
                      {active && <Check size={12} strokeWidth={3} />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Подсказка о приватности */}
          <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Deyla только читает занятые интервалы и задачи — ничего не публикует
              и не изменяет во внешних сервисах.
            </p>
          </div>

          {/* Инструкция для ВШЭ */}
          <Card className="mt-6 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 blur-3xl"
            />

            <CardContent className="relative p-4 md:p-5">
              <button
                type="button"
                onClick={() => setShowGuide((v) => !v)}
                aria-expanded={showGuide}
                className="w-full flex items-start gap-3 text-left"
              >
                <div
                  aria-hidden="true"
                  className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-sm"
                >
                  <GraduationCap size={16} />
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
                        className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center justify-center"
                      >
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {selected.length === 0 && (
            <div className="mt-5 flex items-center justify-center gap-2">
              <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Можно пропустить — подключите интеграции позже в настройках
              </p>
            </div>
          )}
        </div>
      </OnboardingLayout>

      {/* ─── Оверлей процесса подключения ──────────────── */}
      {phase === "connecting" && currentProvider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="oauth-title"
        >
          <Card className="max-w-sm w-full mx-4 overflow-hidden">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/40 to-purple-500/40 blur-xl"
                  />
                  <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 flex items-center justify-center shadow-md">
                    <img
                      src={currentProvider.src}
                      alt={currentProvider.name}
                      style={{ width: currentProvider.w + 6, height: "auto" }}
                      className="max-h-9 object-contain"
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

              {/* Прогресс-полоска */}
              <div className="mt-5 h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-blue-500 to-purple-600 origin-left animate-[oauth-progress_1.2s_ease-in-out]" />
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                <span>Не закрывайте вкладку</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* keyframes для прогресс-полоски оверлея */}
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