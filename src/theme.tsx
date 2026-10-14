import { Monitor, Moon, Sun } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { lang, setLang, tr, type Lang } from "@/i18n";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "dayla-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
  }
  return "system";
}

const resolve = (mode: ThemeMode) => (mode === "system" ? (window.matchMedia(DARK_QUERY).matches ? "dark" : "light") : mode);

function apply(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0b1020" : "#f7f8fc");
}

interface ThemeState {
  mode: ThemeMode;
  theme: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readMode);
  const [theme, setTheme] = useState<"light" | "dark">(() => resolve(readMode()));

  useEffect(() => {
    const update = () => {
      const next = resolve(mode);
      setTheme(next);
      apply(next);
    };
    update();
    if (mode !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
    }
  }, []);

  return <ThemeContext.Provider value={{ mode, theme, setMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const state = useContext(ThemeContext);
  if (!state) throw new Error("useTheme must be used inside ThemeProvider");
  return state;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setMode } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      className={cn("theme-toggle", className)}
      aria-label={next === "dark" ? tr("Включить тёмную тему", "Switch to dark theme") : tr("Включить светлую тему", "Switch to light theme")}
      title={next === "dark" ? tr("Тёмная тема", "Dark theme") : tr("Светлая тема", "Light theme")}
    >
      {theme === "dark" ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
    </button>
  );
}

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: tr("Светлая", "Light"), icon: Sun },
  { value: "dark", label: tr("Тёмная", "Dark"), icon: Moon },
  { value: "system", label: tr("Как в системе", "System"), icon: Monitor },
];

export function ThemePicker() {
  const { mode, setMode } = useTheme();
  return (
    <div className="segmented" role="radiogroup" aria-label={tr("Тема оформления", "Theme")}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button key={value} type="button" role="radio" aria-checked={mode === value} className={mode === value ? "active" : ""} onClick={() => setMode(value)}>
          <Icon size={16} strokeWidth={1.8} />
          {label}
        </button>
      ))}
    </div>
  );
}

/** The other language in one tap: for the public pages, where there are no settings */
export function LanguageToggle({ className }: { className?: string }) {
  const next: Lang = lang === "ru" ? "en" : "ru";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      className={cn("theme-toggle text-xs font-semibold tracking-wide", className)}
      aria-label={next === "en" ? "Switch to English" : "Переключить на русский"}
      title={next === "en" ? "English" : "Русский"}
      lang={next}
    >
      {next.toUpperCase()}
    </button>
  );
}

const LANGUAGES: { value: Lang; label: string }[] = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

export function LanguagePicker() {
  return (
    <div className="segmented" role="radiogroup" aria-label={tr("Язык", "Language")}>
      {LANGUAGES.map(({ value, label }) => (
        <button key={value} type="button" role="radio" lang={value} aria-checked={lang === value} className={lang === value ? "active" : ""} onClick={() => setLang(value)}>
          {label}
        </button>
      ))}
    </div>
  );
}
