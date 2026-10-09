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
import { cn } from "@/utils/cn";
import React from "react";

type NavItem = { to: string; label: string; icon: IconName; main?: boolean };

const NAV: NavItem[] = [
  { to: "/", label: "Сегодня", icon: "today" },
  { to: "/calendar", label: "Календарь", icon: "calendar" },
  { to: "/assistant", label: "Ассистент", icon: "assistant", main: true },
  { to: "/tasks", label: "Задачи", icon: "tasks" },
];

// Ассистент — первый пункт списка и выделен цветом; «Dayla» над списком — просто логотип
const SIDEBAR: NavItem[] = [
  NAV[2],
  NAV[0],
  NAV[1],
  NAV[3],
  { to: "/events/new", label: "Новая задача", icon: "plus" },
];

const TABS: NavItem[] = [
  NAV[0],
  NAV[1],
  NAV[2],
  NAV[3],
  { to: "/account", label: "Аккаунт", icon: "user" },
];

// Where the corner chat would only get in the way: the chat page itself and the task form with its buttons
const NO_DOCK = ["/assistant", "/events/new"];
const ACCOUNT_PATHS = ["/account", "/settings", "/integrations"];

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
        className="relative w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-400 to-violet-500 text-white shadow-[0_2px_8px_rgba(56,189,248,0.35)]"
      >
        <Sparkles size={14} strokeWidth={2} />
      </span>
      Dayla
    </span>
  );
}

/* ─── Avatar ────────────────────────────────────────────── */

export function Avatar({
  user,
  size = 28,
}: {
  user: User | null | undefined;
  size?: number;
}) {
  return (
    <span
      className="relative shrink-0 rounded-full flex items-center justify-center bg-gradient-to-br from-sky-400 to-violet-500 text-white text-xs font-semibold ring-1 ring-white/30 dark:ring-white/10"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
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
      toast("Google Calendar подключён");
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
            aria-label="Разделы"
          >
            {SIDEBAR.map((item) => {
              const active = isActive(item.to, path);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2.5 overflow-hidden",
                    "px-3 h-9 rounded-xl text-sm font-medium",
                    "transition-colors duration-200 outline-none focus:outline-none",
                    item.main
                      ? cn(
                          "mb-1.5 text-white bg-gradient-to-br from-sky-400 to-violet-500",
                          "shadow-[0_4px_14px_rgba(99,102,241,0.35)] hover:brightness-105",
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
                  <Icon name={item.icon} size={16} className="relative shrink-0" />
                  <span className="relative truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 px-3 py-2.5 flex items-center gap-1.5">
            <Link
              to="/account"
              aria-current={accountActive ? "page" : undefined}
              title="Профиль, настройки и интеграции"
              className={cn(
                "group relative flex items-center gap-2.5 flex-1 min-w-0",
                "px-2 h-9 rounded-xl transition-colors duration-200",
                accountActive
                  ? cn(GLASS_ACTIVE, "text-sky-800 dark:text-sky-100")
                  : "hover:bg-white/[0.03] dark:hover:bg-white/[0.015]"
              )}
            >
              <Avatar user={user} size={26} />
              <span className="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                Профиль
              </span>
            </Link>

            <ThemeToggle />

            <button
              type="button"
              onClick={() => signOut()}
              aria-label="Выйти"
              title="Выйти"
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
            <ThemeToggle />
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

        {/* ═══ TABBAR (mobile) — парящий ═══ */}
        <nav
          className={cn(
            "lg:hidden fixed bottom-3 inset-x-3 z-20",
            "h-16 rounded-2xl overflow-hidden",
            GLASS_MOBILE
          )}
          aria-label="Разделы"
        >
          <ul className="grid grid-cols-5 h-full">
            {TABS.map((item) => {
              const active = isActive(item.to, path);

              if (item.main) {
                return (
                  <li key={item.to} className="flex items-center justify-center">
                    <Link
                      to={item.to}
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
                  </li>
                );
              }

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-0.5 h-full w-full",
                      "text-[10px] font-medium transition-colors duration-200",
                      active
                        ? "text-sky-800 dark:text-sky-100"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    )}
                  >
                    <Icon name={item.icon} size={20} />
                    <span>{item.label}</span>
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
        aria-label="Спросить Dayla"
        title="Спросить Dayla"
        className={cn(
          // On a phone the chat is the middle button of the tab bar: a second gradient button would only repeat it
          "hidden lg:flex fixed z-30 right-6 bottom-6",
          "items-center gap-2 h-14 pl-4 pr-5 justify-center rounded-full",
          "text-white bg-gradient-to-br from-sky-400 to-violet-500",
          "shadow-[0_8px_24px_rgba(99,102,241,0.45)]",
          "transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
        )}
      >
        <Icon name="assistant" size={24} />
        <span className="text-sm font-semibold">Спросить Dayla</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Чат с Dayla"
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
