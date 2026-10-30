// src/components/Layout.tsx
import { Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "@/theme";
import type { User } from "../api/types";
import { useAuth, useSignOut } from "../auth";
import { Link, navigate, useLocation } from "../router";
import { Icon, type IconName } from "./icons";
import { ErrorBoundary, useToast } from "./ui";
import { AssistantChat } from "../pages/Assistant";
import { Tour } from "./Tour";
import { api } from "../api/client";
import type { TeamSummary } from "../api/types";
import { useTeamsChanged } from "../pages/Teams";
import { cn } from "@/utils/cn";
import React from "react";
import { tr, LOCALE } from "@/i18n";

type NavItem = { to: string; label: string; icon: IconName; main?: boolean };

const NAV: NavItem[] = [
  { to: "/", label: tr("Сегодня", "Today"), icon: "today" },
  { to: "/calendar", label: tr("Календарь", "Calendar"), icon: "calendar" },
  { to: "/assistant", label: tr("Ассистент", "Assistant"), icon: "assistant", main: true },
  { to: "/tasks", label: tr("Задачи", "Tasks"), icon: "tasks" },
];

// Ассистент — первый пункт списка и выделен цветом; «Deyla» над списком — просто логотип
const SIDEBAR: NavItem[] = [
  NAV[2],
  NAV[0],
  NAV[1],
  NAV[3],
  { to: "/events/new", label: tr("Новая задача", "New task"), icon: "plus" },
  { to: "/teams", label: tr("Команды", "Teams"), icon: "user" },
];

const TABS: NavItem[] = [
  NAV[0],
  NAV[1],
  NAV[2],
  NAV[3],
  { to: "/account", label: tr("Аккаунт", "Account"), icon: "user" },
];

// Where the corner chat would only get in the way: the chat page itself and the task form with its buttons
const NO_DOCK = ["/assistant", "/events/new"];
const ACCOUNT_PATHS = ["/account", "/settings", "/integrations", "/friends"];

// The first-visit hints point at these (see Tour.tsx)
const TOUR_IDS: Record<string, string> = {
  "/": "today",
  "/calendar": "calendar",
  "/assistant": "assistant",
  "/tasks": "tasks",
  "/events/new": "new",
  "/account": "account",
  "/teams": "teams",
};

// Relationships among the top three spheres of the onboarding: the tour stresses planning with friends
const RELATIONSHIPS = ["отношения", "relationships", "семья", "family", "друзья", "friends"];
function relationshipsFirst(user: User): boolean {
  const spheres = Array.isArray(user.profile?.spheres) ? (user.profile.spheres as { name?: unknown; priority?: unknown }[]) : [];
  return spheres.some(
    (sphere) =>
      typeof sphere?.name === "string" &&
      RELATIONSHIPS.includes(sphere.name.trim().toLowerCase()) &&
      (typeof sphere.priority !== "number" || sphere.priority < 3)
  );
}

const isActive = (to: string, path: string) =>
  to === "/"
    ? path === "/"
    : path === to ||
      path.startsWith(`${to}/`) ||
      (to === "/account" && ACCOUNT_PATHS.some((item) => path.startsWith(item)));

/* ─── Прозрачный Liquid Glass ───────────────────────────── */

/** Мобильные плашки — почти невидимое стекло */
const GLASS_MOBILE =
  "bg-white/[0.015] dark:bg-white/[0.008] backdrop-blur-2xl " +
  "ring-1 ring-white/15 dark:ring-white/8 " +
  "shadow-[0_8px_32px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.4)] " +
  "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]";

/** Очень прозрачное тело стекла. Сквозь него видно фон страницы, размытый. */
const GLASS_SURFACE =
  "bg-white/[0.03] dark:bg-white/[0.015] backdrop-blur-xl " +
  "ring-1 ring-white/20 dark:ring-white/10 " +
  "shadow-[0_8px_32px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.55)] " +
  "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]";

/** Активный пункт — чуть плотнее, но всё ещё прозрачный. */
const GLASS_ACTIVE =
  "bg-white/[0.06] dark:bg-white/[0.03] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/12 " +
  "shadow-[0_4px_20px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] " +
  "dark:shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]";

/** Маленькая круглая кнопка (тема, выход). */
const GLASS_ICON_BTN =
  "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center " +
  "bg-white/[0.03] dark:bg-white/[0.015] backdrop-blur-xl " +
  "ring-1 ring-white/20 dark:ring-white/10 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_8px_rgba(15,23,42,0.04)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.35)] " +
  "text-gray-700 dark:text-gray-300 " +
  "transition-transform duration-200 hover:-translate-y-0.5";

/* ─── Brand ─────────────────────────────────────────────── */

export function Brand() {
  return (
    <span className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-gray-900 dark:text-white select-none">
      <span
        aria-hidden="true"
        className={cn(
          "relative w-7 h-7 rounded-lg inline-flex items-center justify-center overflow-hidden",
          // ─── Liquid Glass body — как в LandingHeader ───
          "bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl",
          "ring-1 ring-white/30 dark:ring-white/10",
          "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]",
          "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]"
        )}
      >
        {/* Brand tint — тот же blue→violet, но как полупрозрачный слой поверх стекла */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/35 via-violet-500/30 to-purple-500/35"
        />
        {/* Sheen — тот же блик, что и в header */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.08)_25%,transparent_45%,transparent_75%,rgba(255,255,255,0.12)_100%)]"
        />
        {/* Иконка поверх всего стекла */}
        <Sparkles
          size={15}
          strokeWidth={2}
          className="relative text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.4)]"
        />
      </span>
      Deyla
    </span>
  );
}

/** Скрывать верхнюю плашку при скролле вниз, показывать при скролле вверх. */
function useHideOnScroll(threshold = 80): boolean {
  const [hidden, setHidden] = React.useState(false);
  const lastY = React.useRef(0);

  React.useEffect(() => {
    lastY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (Math.abs(delta) < 4) return; // игнорируем микро-дёргания

      if (y < threshold) {
        setHidden(false);           // у самого верха всегда показываем
      } else if (delta > 0) {
        setHidden(true);            // скролл вниз
      } else {
        setHidden(false);           // скролл вверх
      }

      lastY.current = y;
    };

    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return hidden;
}

/* ─── Layout ────────────────────────────────────────────── */

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const signOut = useSignOut();
  const { path, query } = useLocation();
  const toast = useToast();
  const accountActive = isActive("/account", path);

  const connected = query.get("connected");
  useEffect(() => {
    if (connected === "google") {
      toast(tr("Google Calendar подключён", "Google Calendar connected"));
      navigate("/integrations", { replace: true });
    }
  }, [connected, toast]);

  const hiddenTopbar = useHideOnScroll(80);
  const docked = !NO_DOCK.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  return (
    <>
      <div className="relative min-h-screen flex">
        {/* ═══ САЙДБАР ═══ */}
        <aside
          className={cn(
            "hidden lg:flex flex-col w-60 shrink-0",
            "sticky top-3 self-start h-[calc(100vh-1.5rem)] ml-3",
            "rounded-2xl overflow-hidden",
            GLASS_SURFACE
          )}
        >
          <div className="px-3 pt-4 pb-2 pl-5">
            <Brand />
          </div>

          <nav
            className="flex-1 flex flex-col gap-1.5 px-3 py-2 overflow-y-auto"
            aria-label={tr("Разделы", "Sections")}
          >
            {SIDEBAR.map((item) => {
  const active = isActive(item.to, path);
  return (
    <Link
      key={item.to}
      to={item.to}
      data-tour={TOUR_IDS[item.to]}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2.5 overflow-hidden",
        "px-3 h-9 rounded-xl text-sm font-medium",
        "transition-colors duration-200 outline-none focus:outline-none",
        item.main
          ? cn(
              // ─── Liquid Glass — точь-в-точь как «Спросить Deyla» ───
              "mb-1.5 text-gray-900 dark:text-white",
              "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-2xl",
              "ring-1 ring-black/10 dark:ring-white/15",
              "shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(15,23,42,0.04)]",
              "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.3)]",
              "hover:bg-white/[0.08] dark:hover:bg-white/[0.04]",
              active && "ring-2 ring-white/60 dark:ring-white/30"
            )
          : active
          ? cn(GLASS_ACTIVE, "text-sky-800 dark:text-sky-100")
          : [
              "text-gray-600 dark:text-gray-400",
              "hover:bg-white/[0.03] dark:hover:bg-white/[0.015]",
              "hover:text-gray-900 dark:hover:text-white",
            ]
      )}
    >
      {/* Sheen — только для main-кнопки, тот же блик, что в ChatDock */}
      {item.main && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.03)_25%,transparent_45%,transparent_75%,rgba(255,255,255,0.05)_100%)]"
        />
      )}

      <Icon
        name={item.icon}
        size={16}
        className={cn(
          "relative shrink-0",
          item.main && "drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        )}
      />
      <span
        className={cn(
          "relative truncate",
          item.main && "drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
        )}
      >
        {item.label}
      </span>
    </Link>
  );
})}
            <SidebarTeams path={path} />
          </nav>

          <div className="shrink-0 px-3 py-2.5 flex items-center gap-1.5">
            <Link
              to="/account"
              data-tour="account"
              aria-current={accountActive ? "page" : undefined}
              title={tr("Профиль, настройки и интеграции", "Profile, settings and integrations")}
              className={cn(
                "group relative flex items-center gap-2.5 flex-1 min-w-0",
                "px-2 h-9 rounded-xl transition-colors duration-200",
                accountActive
                  ? cn(GLASS_ACTIVE, "text-sky-800 dark:text-sky-100")
                  : "hover:bg-white/[0.03] dark:hover:bg-white/[0.015]"
              )}
            >
              <Icon name="user" size={18} className="shrink-0 text-gray-500 dark:text-gray-400" />
              <span className="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                {tr("Профиль", "Profile")}
              </span>
            </Link>

            <ThemeToggle />

            <button
              type="button"
              onClick={() => signOut()}
              aria-label={tr("Выйти", "Sign out")}
              title={tr("Выйти", "Sign out")}
              className={cn(
                GLASS_ICON_BTN,
                "hover:text-red-600 dark:hover:text-red-400"
              )}
            >
              <Icon name="logout" size={16} className="relative" />
            </button>
          </div>
        </aside>

        {/* ═══ ОСНОВНАЯ КОЛОНКА ═══ */}
        <div className="relative flex-1 flex flex-col min-w-0">
          {/* ─── Topbar (mobile) ─── */}
          <header
            className={cn(
              "lg:hidden sticky top-2 z-20 mx-2 mt-2",
              "flex items-center justify-between",
              "px-3 h-12 shrink-0 rounded-2xl",
              GLASS_MOBILE,
              // ─── Прячется при скролле вниз ───
              "transition-all duration-300 ease-out",
              hiddenTopbar
                ? "-translate-y-[calc(100%+0.5rem)] opacity-0 pointer-events-none"
                : "translate-y-0 opacity-100"
            )}
          >
            <Brand />
            <span className="flex items-center gap-1.5">
              {path !== "/events/new" && (
                <Link
                  to="/events/new"
                  aria-label={tr("Новая задача", "New task")}
                  className="inline-flex items-center gap-1 h-9 pl-2.5 pr-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-indigo-500 shadow-sm active:scale-95 transition-transform"
                >
                  <Icon name="plus" size={16} /> {tr("Задача", "Task")}
                </Link>
              )}
              <ThemeToggle />
            </span>
          </header>

          <main
            className={cn(
              "flex-1 min-w-0 px-4 sm:px-6 py-4",
              // Room under the content for the corner chat button
              docked ? "pb-28 lg:pb-24" : "pb-28 lg:pb-8"
            )}
            id="content"
          >
            <ErrorBoundary key={path}>{children}</ErrorBoundary>
          </main>
        </div>

        {/* ═══ Чат в углу каждого раздела ═══ */}
        {docked && <ChatDock path={path} />}

        {/* ═══ Подсказки при первом входе ═══ */}
        {user && <Tour userId={user.id} relationships={relationshipsFirst(user)} />}

        {/* ═══ TABBAR (mobile) — парящий ═══ */}
        <nav
          className={cn(
            "lg:hidden fixed bottom-3 inset-x-3 z-20",
            "h-16 rounded-2xl overflow-hidden",
            GLASS_MOBILE
          )}
          aria-label={tr("Разделы", "Sections")}
        >
          <ul className="grid grid-cols-5 h-full">
            {TABS.map((item) => {
              const active = isActive(item.to, path);

              if (item.main) {
                return (
                  <li key={item.to} className="relative flex items-center justify-center">
                    <Link
                      to={item.to}
                      data-tour={TOUR_IDS[item.to]}
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                      className={cn(
                        "flex items-center justify-center",
                        "w-12 h-12 rounded-xl text-white",
                        "bg-gradient-to-br from-sky-400 to-violet-500",
                        "shadow-[0_4px_14px_rgba(99,102,241,0.4)]",
                        active && "ring-2 ring-white/60 dark:ring-white/30",
                        "transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                      )}
                    >
                      <Icon name={item.icon} size={22} className="relative" />
                    </Link>
                    {active && <ActiveDot />}
                  </li>
                );
              }

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    data-tour={TOUR_IDS[item.to]}
                    aria-current={active ? "page" : undefined}
                    aria-label={item.label}
                    title={item.label}
                    className={cn(
                      "relative flex items-center justify-center h-full w-full",
                      "transition-colors duration-200",
                      active
                        ? "text-sky-600 dark:text-sky-300"
                        : "text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    )}
                  >
                    {/* The section you are in: a tinted pill behind the icon and a dot under it, not only a colour */}
                    <span
                      className={cn(
                        "flex items-center justify-center w-12 h-10 rounded-xl transition-colors duration-200",
                        active && "bg-sky-500/15 ring-1 ring-sky-500/30 dark:bg-sky-400/20 dark:ring-sky-300/30"
                      )}
                    >
                      {item.to === "/" ? <TodayMark /> : <Icon name={item.icon} size={22} />}
                    </span>
                    {active && <ActiveDot />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
/* ─── ActiveDot ─────────────────────────────────────────── */

/** The mark under the tab of the section you are in. */
function ActiveDot() {
  return <span aria-hidden="true" className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-500 dark:bg-sky-300" />;
}

/* ─── TodayMark ─────────────────────────────────────────── */

/** The «Сегодня» tab as a tear-off calendar page: today's weekday and date instead of an icon. */
function TodayMark() {
  const now = new Date();
  const weekday = now.toLocaleDateString(LOCALE, { weekday: "short" });
  return (
    <span
      aria-hidden="true"
      className="flex flex-col items-center justify-center w-8 h-8 rounded-lg ring-[1.5px] ring-current leading-none"
    >
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-80">{weekday}</span>
      <span className="text-[14px] font-bold tabular-nums mt-px">{now.getDate()}</span>
    </span>
  );
}

/* ─── ChatDock ──────────────────────────────────────────── */

/** The assistant one tap away in every section, in the corner like a bank's support chat. */
function ChatDock({ path }: { path: string }) {
  const [open, setOpen] = useState(false);

  // Leaving the section (a task link in the chat, "Неделя в календаре") shows that section
  useEffect(() => setOpen(false), [path]);

  if (!open) {
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      data-tour="dock"
      aria-label={tr("Спросить Deyla", "Ask Deyla")}
      title={tr("Спросить Deyla", "Ask Deyla")}
      className={cn(
        "hidden lg:flex fixed z-30 right-6 bottom-6",
        "group overflow-hidden",
        "items-center gap-2 h-14 pl-4 pr-5 justify-center rounded-full",
        // Нейтральный цвет текста: тёмный на светлом, белый на тёмном
        "text-gray-900 dark:text-white",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 active:translate-y-0",
        // ─── Почти невидимое бесцветное стекло ───
        "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-2xl",
        "ring-1 ring-black/10 dark:ring-white/15",
        "shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(15,23,42,0.04)]",
        "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.3)]",
        "hover:bg-white/[0.08] dark:hover:bg-white/[0.04]"
      )}
    >
      {/* Только sheen — без brand-тинта, почти невидимый */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,rgba(255,255,255,0.03)_25%,transparent_45%,transparent_75%,rgba(255,255,255,0.05)_100%)]"
      />

      <Icon
        name="assistant"
        size={24}
        className="relative drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
      />
      <span className="relative text-sm font-semibold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {tr("Спросить Deyla", "Ask Deyla")}
      </span>
    </button>
  );
}

  return (
    <div
      role="dialog"
      aria-label={tr("Чат с Deyla", "Chat with Deyla")}
      className={cn(
        "fixed z-40 inset-x-2 top-2 bottom-[5.25rem]",
        "lg:inset-auto lg:right-6 lg:bottom-6 lg:w-[420px] lg:h-[min(660px,calc(100dvh-3rem))]",
        "flex flex-col overflow-hidden rounded-2xl",
        "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
        "ring-1 ring-black/5 dark:ring-white/10 shadow-[0_20px_60px_rgba(15,23,42,0.25)]"
      )}
    >
      <AssistantChat panel onClose={() => setOpen(false)} />
    </div>
  );
}

/** The user's teams under "Команды" in the sidebar: each opens its page (tasks, projects, chat). */
function SidebarTeams({ path }: { path: string }) {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const load = React.useCallback(() => {
    api.teams.list().then(setTeams).catch(() => undefined);
  }, []);
  useEffect(load, [load]);
  useTeamsChanged(load);
  if (!teams.length) return null;
  return (
    <div className="-mt-1 ml-6 flex flex-col gap-0.5" aria-label={tr("Ваши команды", "Your teams")}>
      {teams.map((team) => {
        const active = path === `/teams/${team.id}` || path.startsWith(`/teams/${team.id}?`);
        return (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 px-2 h-7 rounded-lg text-xs truncate",
              active ? "text-sky-800 dark:text-sky-100 bg-sky-500/10" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <span className="truncate">@{team.tag}</span>
            {team.my_open_tasks > 0 && <span className="ml-auto tabular-nums text-[10px] text-gray-500">{team.my_open_tasks}</span>}
          </Link>
        );
      })}
    </div>
  );
}
