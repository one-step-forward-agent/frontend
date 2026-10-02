// src/components/landing/LandingHeader.tsx
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

// ---------- Данные навигации ----------

type NavItem =
  | { kind: "anchor"; href: string; label: string }
  | { kind: "route"; to: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { kind: "anchor", href: "#benefits", label: "Возможности" },
  { kind: "anchor", href: "#how-it-works", label: "Как это работает" },
  { kind: "route", to: "/features", label: "Фичи" },
];

// ---------- Логотип ----------

const Logo: React.FC = () => (
  <span
    aria-hidden="true"
    className="w-7 h-7 rounded bg-gradient-to-br from-blue-500 to-purple-600 inline-block"
  />
);

// ---------- Компонент ----------

export const LandingHeader: React.FC = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const goStart = () => {
    setMobileOpen(false);
    navigate("/onboarding/for-what-using");
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
        {/* Логотип */}
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0"
          aria-label="Deyla — на главную"
        >
          <Logo />
          <span className="font-semibold">Deyla</span>
        </Link>

        {/* Навигация — desktop */}
        <nav
          className="hidden md:flex items-center gap-1 ml-6"
          aria-label="Основная навигация"
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

        {/* Правые действия — desktop */}
        <Link
          to="/login"
          className="hidden sm:inline-flex px-3 py-2 text-sm rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60 transition-colors"
        >
          Войти
        </Link>

        <Button
          type="button"
          size="sm"
          onClick={goStart}
          className="hidden sm:inline-flex"
        >
          Начать бесплатно
        </Button>

        {/* Гамбургер — mobile */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-nav"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Выпадающее меню — mobile */}
      {mobileOpen && (
        <div
          id="landing-mobile-nav"
          className="md:hidden border-t border-gray-200/60 dark:border-gray-800/60 bg-white/95 dark:bg-gray-950/95 backdrop-blur"
        >
          <nav className="px-4 py-3 space-y-1" aria-label="Мобильная навигация">
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
              <Link
                to="/login"
                onClick={closeMobile}
                className="block px-3 py-2 text-sm rounded text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Войти
              </Link>
              <Button type="button" onClick={goStart} className="w-full">
                Начать бесплатно
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;