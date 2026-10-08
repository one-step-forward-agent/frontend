// src/components/Layout.tsx
import { Sparkles } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { ThemeToggle } from "@/theme";
import type { User } from "../api/types";
import { useAuth, useSignOut } from "../auth";
import { Link, navigate, useLocation } from "../router";
import { Icon, type IconName } from "./icons";
import { ErrorBoundary, useToast } from "./ui";
import { cn } from "@/utils/cn";
import React from "react";

type NavItem = { to: string; label: string; icon: IconName; main?: boolean };

const NAV: NavItem[] = [
  { to: "/", label: "Сегодня", icon: "today" },
  { to: "/calendar", label: "Календарь", icon: "calendar" },
  { to: "/assistant", label: "Ассистент", icon: "assistant", main: true },
  { to: "/tasks", label: "Задачи", icon: "tasks" },
];

const SIDEBAR: NavItem[] = [
  ...NAV.filter((item) => !item.main),
  { to: "/events/new", label: "Новая задача", icon: "plus" },
];

const TABS: NavItem[] = [
  NAV[0],
  NAV[1],
  NAV[2],
  NAV[3],
  { to: "/account", label: "Аккаунт", icon: "user" },
];

const NO_FAB = ["/assistant", "/events/new", "/account", "/settings", "/integrations"];
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

export function Brand({ to = "/assistant" }: { to?: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-gray-900 dark:text-white"
      aria-label="Dayla — Ассистент"
    >
      <span
        aria-hidden="true"
        className="relative w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-400 to-violet-500 text-white shadow-[0_2px_8px_rgba(56,189,248,0.35)]"
      >
        <Sparkles size={14} strokeWidth={2} />
      </span>
      Dayla
    </Link>
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
  const assistantActive = isActive("/assistant", path);

  const connected = query.get("connected");
  useEffect(() => {
    if (connected === "google") {
      toast("Google Calendar подключён");
      navigate("/integrations", { replace: true });
    }
  }, [connected, toast]);

  const hiddenTopbar = useHideOnScroll(80);

  return (
    <>
      {/* ─── Стиль кнопки «Dayla · Ассистент» ─────────────── */}
      <style>{`
        .glass-brand-border {
          position: relative;
          isolation: isolate;
          background: transparent;
          border: none;
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.35),
            0 0 20px 3px rgba(56, 189, 248, 0.14),
            0 0 42px 12px rgba(139, 92, 246, 0.10);
          transition: box-shadow 220ms;
        }
        .glass-brand-border::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          backdrop-filter: blur(16px) saturate(150%);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          pointer-events: none;
          z-index: -1;
        }
        .glass-brand-border::after {
          content: "";
          position: absolute;
          inset: -12px;
          border-radius: 24px;
          backdrop-filter: blur(6px) saturate(130%);
          -webkit-backdrop-filter: blur(6px) saturate(130%);
          -webkit-mask-image: radial-gradient(
            ellipse 72% 72% at 50% 50%,
            transparent 36%,
            rgba(0, 0, 0, 0.55) 54%,
            rgba(0, 0, 0, 0.25) 74%,
            transparent 100%
          );
          mask-image: radial-gradient(
            ellipse 72% 72% at 50% 50%,
            transparent 36%,
            rgba(0, 0, 0, 0.55) 54%,
            rgba(0, 0, 0, 0.25) 74%,
            transparent 100%
          );
          pointer-events: none;
          z-index: -2;
        }
        .glass-brand-border > .glass-dots {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          background:
            radial-gradient(circle 5px at 24% 32%, rgba(56, 189, 248, 0.75), transparent 55%),
            radial-gradient(circle 4px at 76% 66%, rgba(139, 92, 246, 0.70), transparent 55%),
            radial-gradient(circle 3px at 52% 20%, rgba(59, 130, 246, 0.65), transparent 55%),
            radial-gradient(circle 4px at 82% 28%, rgba(139, 92, 246, 0.60), transparent 55%),
            radial-gradient(circle 3px at 38% 82%, rgba(56, 189, 248, 0.55), transparent 55%),
            radial-gradient(circle 2.5px at 64% 78%, rgba(99, 102, 241, 0.55), transparent 55%);
          filter: blur(1.5px);
        }
        .glass-brand-border > * {
          position: relative;
          z-index: 1;
        }
        .glass-brand-border:hover {
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.30),
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            0 0 26px 5px rgba(56, 189, 248, 0.22),
            0 0 54px 18px rgba(139, 92, 246, 0.14);
        }
        .dark .glass-brand-border {
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.10),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 0 20px 3px rgba(56, 189, 248, 0.14),
            0 0 42px 12px rgba(139, 92, 246, 0.10);
        }
        .dark .glass-brand-border:hover {
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.12),
            0 0 26px 5px rgba(56, 189, 248, 0.20),
            0 0 54px 18px rgba(139, 92, 246, 0.14);
        }
        .dark .glass-brand-border > .glass-dots {
          background:
            radial-gradient(circle 5px at 24% 32%, rgba(56, 189, 248, 0.65), transparent 55%),
            radial-gradient(circle 4px at 76% 66%, rgba(139, 92, 246, 0.60), transparent 55%),
            radial-gradient(circle 3px at 52% 20%, rgba(59, 130, 246, 0.55), transparent 55%),
            radial-gradient(circle 4px at 82% 28%, rgba(139, 92, 246, 0.52), transparent 55%),
            radial-gradient(circle 3px at 38% 82%, rgba(56, 189, 248, 0.48), transparent 55%),
            radial-gradient(circle 2.5px at 64% 78%, rgba(99, 102, 241, 0.48), transparent 55%);
        }
      `}</style>

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
          <div className="px-3 pt-3 pb-2">
            <Link
              to="/assistant"
              aria-current={assistantActive ? "page" : undefined}
              aria-label="Dayla — Ассистент"
              className="glass-brand-border relative flex items-center gap-2.5 px-3 h-11 rounded-xl text-sm text-gray-900 dark:text-white"
            >
              <span className="glass-dots" aria-hidden="true" />
              <span
                aria-hidden="true"
                className="relative w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-sky-400 to-violet-500 text-white shadow-[0_2px_8px_rgba(56,189,248,0.4)]"
              >
                <Sparkles size={14} strokeWidth={2} />
              </span>
              <span className="relative font-semibold tracking-tight">Dayla</span>
              <span className="relative ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
                Ассистент
              </span>
            </Link>
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
                    active
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
            <Brand to="/assistant" />
            <ThemeToggle />
          </header>

          <main
            className="flex-1 min-w-0 px-4 sm:px-6 py-4 pb-28 lg:pb-8"
            id="content"
          >
            <ErrorBoundary key={path}>{children}</ErrorBoundary>
          </main>
        </div>

        {/* ═══ FAB ═══ */}
        {!NO_FAB.some(
          (prefix) => path === prefix || path.startsWith(`${prefix}/`)
        ) && (
          <Link
            to="/events/new"
            aria-label="Новая задача"
            className={cn(
              "lg:hidden fixed right-5 z-30 bottom-[5.5rem]",
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-white/[0.06] dark:bg-white/[0.03] backdrop-blur-xl",
              "ring-1 ring-sky-400/40 dark:ring-sky-400/30",
              "text-sky-800 dark:text-sky-100",
              "shadow-[0_8px_24px_rgba(56,189,248,0.20),inset_0_1px_0_rgba(255,255,255,0.55)]",
              "dark:shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]",
              "transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            <Icon name="plus" size={22} />
          </Link>
        )}

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
                        "glass-brand-border",
                        "flex items-center justify-center",
                        "w-12 h-12 rounded-xl",
                        "text-gray-900 dark:text-white",
                        "transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                      )}
                    >
                      <span className="glass-dots" aria-hidden="true" />
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