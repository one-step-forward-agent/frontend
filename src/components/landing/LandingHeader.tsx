import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { LanguageToggle, ThemeToggle } from "@/theme";
import { cn } from "@/utils/cn";
import { tr } from "@/i18n";

type NavItem =
  | { kind: "anchor"; href: string; label: string }
  | { kind: "route"; to: string; label: string };

const NAV_ITEMS: NavItem[] = [
];

const Logo: React.FC = () => (
  <span
    aria-hidden="true"
    className={cn(
      "relative w-7 h-7 rounded-lg inline-flex items-center justify-center overflow-hidden",
      // ─── Liquid Glass body — как у CTA ───
      "bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl",
      "ring-1 ring-white/30 dark:ring-white/10",
      "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]",
      "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]"
    )}
  >
    {/* Бренд-тинт: тот же blue→violet, но как полупрозрачный слой поверх стекла */}
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/35 via-violet-500/30 to-purple-500/35"
    />
    {/* Sheen — тот же приём, что у кнопки */}
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
);

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const goStart = () => {
    setMobileOpen(false);
    navigate(isAuthenticated ? "/app" : "/onboarding/field-of-activity");
  };

  const closeMobile = () => setMobileOpen(false);

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
    // Уже на главной — прокрутка к Hero (верху страницы), без перезагрузки
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    closeMobile();
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

        {!isAuthenticated && (
          <Link
            to="/login"
            className="hidden sm:inline-flex px-3 py-2 text-sm rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60 transition-colors"
          >
            {tr("Войти", "Sign in")}
          </Link>
        )}

        <button
  type="button"
  onClick={goStart}
  className={cn(
    "group relative z-10 inline-flex items-center justify-center overflow-hidden shrink-0",
    "px-4 sm:px-5 h-9 rounded-full",
    "text-sm font-semibold text-gray-900 dark:text-white",
    "transition-all duration-300 ease-out",
    "hover:-translate-y-0.5 active:translate-y-0",
    // ─── Стеклянные стили (точь-в-точь как в FinalCTA) ───
    "bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl",
    "ring-1 ring-white/30 dark:ring-white/10",
    "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]",
    "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]",
    "hover:bg-white/20 dark:hover:bg-white/[0.1]"
  )}
>
  {/* Блик для кнопки */}
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]"
  />

  <span className="relative inline-flex items-center">
    <span className="hidden sm:inline">
      {isAuthenticated
        ? tr("Открыть приложение", "Open the app")
        : tr("Начать бесплатно", "Start for free")}
    </span>
    <span className="sm:hidden">
      {isAuthenticated ? tr("Открыть", "Open") : tr("Начать", "Start")}
    </span>
  </span>
</button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? tr("Закрыть меню", "Close menu") : tr("Открыть меню", "Open menu")}
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-nav"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {mobileOpen && (
        <div
          id="landing-mobile-nav"
          className="md:hidden border-t border-gray-200/60 dark:border-gray-800/60 bg-white/95 dark:bg-gray-950/95 backdrop-blur"
        >
          <nav className="px-4 py-3 space-y-1" aria-label={tr("Мобильная навигация", "Mobile navigation")}>
            {NAV_ITEMS.map((item) =>
              item.kind === "anchor" ? (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className="block px-3 py-2 text-sm rounded text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className="block px-3 py-2 text-sm rounded text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {item.label}
                </Link>
              )
            )}

            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="block px-3 py-2 text-sm rounded text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {tr("Войти", "Sign in")}
                </Link>
              )}
              <button
  type="button"
  onClick={goStart}
  className={cn(
    "group relative z-10 inline-flex items-center justify-center overflow-hidden shrink-0",
    "px-4 sm:px-5 h-9 rounded-full",
    "text-sm font-semibold text-gray-900 dark:text-white",
    "transition-all duration-300 ease-out",
    "hover:-translate-y-0.5 active:translate-y-0",
    // ─── Стеклянные стили (точь-в-точь как в FinalCTA) ───
    "bg-white/10 dark:bg-white/[0.05] backdrop-blur-xl",
    "ring-1 ring-white/30 dark:ring-white/10",
    "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]",
    "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]",
    "hover:bg-white/20 dark:hover:bg-white/[0.1]"
  )}
>
  {/* Блик для кнопки */}
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]"
  />

  <span className="relative inline-flex items-center">
    <span className="hidden sm:inline">
      {isAuthenticated
        ? tr("Открыть приложение", "Open the app")
        : tr("Начать бесплатно", "Start for free")}
    </span>
    <span className="sm:hidden">
      {isAuthenticated ? tr("Открыть", "Open") : tr("Начать", "Start")}
    </span>
  </span>
</button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
