import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { LanguageToggle, ThemeToggle } from "@/theme";
import { cn } from "@/utils/cn";
import { tr } from "@/i18n";

type NavItem =
  | { kind: "anchor"; href: string; label: string }
  | { kind: "route"; to: string; label: string };

const NAV_ITEMS: NavItem[] = [];

const Logo: React.FC = () => (
  <span
    aria-hidden="true"
    className={cn(
      "relative w-7 h-7 rounded-lg inline-flex items-center justify-center overflow-hidden",
      "bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl",
      "ring-1 ring-white/30 dark:ring-white/10",
      "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]",
      "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]"
    )}
  >
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/35 via-violet-500/30 to-purple-500/35"
    />
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.08)_25%,transparent_45%,transparent_75%,rgba(255,255,255,0.12)_100%)]"
    />
    <Sparkles
      size={15}
      strokeWidth={2}
      className="relative text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.4)]"
    />
  </span>
);

/* ── Общие стили CTA-кнопки (стекло, как у FinalCTA) ── */
const CTA_GLASS = cn(
  "group relative z-10 inline-flex items-center justify-center overflow-hidden shrink-0",
  "h-9 rounded-full",
  "text-sm font-semibold text-gray-900 dark:text-white",
  "transition-all duration-300 ease-out",
  "hover:-translate-y-0.5 active:translate-y-0",
  "bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl",
  "ring-1 ring-white/30 dark:ring-white/10",
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]",
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]",
  "hover:bg-white/20 dark:hover:bg-white/[0.1]"
);

const CTA_SHEEN =
  "pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // ── Mobile CTA: «Войти» для гостя, «Открыть» для авторизованного ──
  const onMobileCta = () => {
    navigate(isAuthenticated ? "/app" : "/login");
  };

  // ── Desktop CTA: как было — онбординг для гостя, /app для авторизованного ──
  const onDesktopCta = () => {
    navigate(isAuthenticated ? "/app" : "/onboarding/field-of-activity");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "backdrop-blur bg-white/70 dark:bg-gray-950/70",
        "border-b border-gray-200/60 dark:border-gray-800/60"
      )}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          aria-label={tr("Deyla — на главную", "Deyla — home")}
          onClick={(e) => {
            if (typeof window !== "undefined" && window.location.pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <Logo />
          <span className="font-semibold text-gray-900 dark:text-white">Deyla</span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-1 ml-6"
          aria-label={tr("Основная навигация", "Main navigation")}
        >
          {NAV_ITEMS.map((item) =>
            item.kind === "anchor" ? (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 text-sm rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60 transition-colors"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="flex-1" />

        <LanguageToggle />
        <ThemeToggle />

        {/* Desktop «Войти» — только md+; на мобилке роль этой кнопки выполняет CTA */}
        {!isAuthenticated && (
          <Link
            to="/login"
            className="hidden md:inline-flex px-3 py-2 text-sm rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60 transition-colors"
          >
            {tr("Войти", "Sign in")}
          </Link>
        )}

        {/* Mobile CTA: «Войти» / «Открыть». Видна только < md */}
        <button
          type="button"
          onClick={onMobileCta}
          className={cn(CTA_GLASS, "md:hidden px-4")}
        >
          <span aria-hidden="true" className={CTA_SHEEN} />
          <span className="relative inline-flex items-center">
            {isAuthenticated ? tr("Открыть", "Open") : tr("Войти", "Sign in")}
          </span>
        </button>

        {/* Desktop CTA: без изменений. Видна только md+ */}
        <button
          type="button"
          onClick={onDesktopCta}
          className={cn(CTA_GLASS, "hidden md:inline-flex px-5")}
        >
          <span aria-hidden="true" className={CTA_SHEEN} />
          <span className="relative inline-flex items-center">
            {isAuthenticated
              ? tr("Открыть приложение", "Open the app")
              : tr("Начать бесплатно", "Start for free")}
          </span>
        </button>
      </div>
      {/* Мобильный дропдаун полностью удалён */}
    </header>
  );
};

export default LandingHeader;