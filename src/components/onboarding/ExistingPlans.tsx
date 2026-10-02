// src/components/onboarding/ExistingPlans.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Globe,
  Briefcase,
  Sun,
  Moon,
  Info,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Input } from "@/components/ui/form-field";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const TOTAL = 10;

const DAYS = [
  { short: "Пн", full: "Понедельник" },
  { short: "Вт", full: "Вторник" },
  { short: "Ср", full: "Среда" },
  { short: "Чт", full: "Четверг" },
  { short: "Пт", full: "Пятница" },
  { short: "Сб", full: "Суббота" },
  { short: "Вс", full: "Воскресенье" },
];

// Быстрые пресеты графика
const PRESETS = [
  { id: "classic", label: "Классика", days: ["Пн", "Вт", "Ср", "Чт", "Пт"], from: "09:00", to: "18:00" },
  { id: "early",   label: "Ранний",   days: ["Пн", "Вт", "Ср", "Чт", "Пт"], from: "07:00", to: "16:00" },
  { id: "short",   label: "Сокращённый", days: ["Пн", "Вт", "Ср", "Чт"],    from: "10:00", to: "18:00" },
];

export const ExistingPlans: React.FC = () => {
  const navigate = useNavigate();
  const { data, patch } = useOnboarding();
  const [days, setDays] = React.useState<string[]>(data.workDays);
  const [from, setFrom] = React.useState(data.workHoursFrom);
  const [to, setTo] = React.useState(data.workHoursTo);
  const [tz, setTz] = React.useState(data.timezone);

  const toggleDay = (d: string) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setDays(p.days);
    setFrom(p.from);
    setTo(p.to);
  };

  const handleNext = () => {
    patch({
      workDays: days,
      workHoursFrom: from,
      workHoursTo: to,
      timezone: tz,
    });
    navigate("/onboarding/apple-google-logging");
  };

  // Сколько часов в неделю, если каждый рабочий день — от from до to
  const weeklyHours = React.useMemo(() => {
    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = to.split(":").map(Number);
    const perDay = (th * 60 + tm - fh * 60 - fm) / 60;
    return Math.max(0, perDay * days.length);
  }, [from, to, days]);

  return (
    <OnboardingLayout
      step={5}
      totalSteps={TOTAL}
      title="Укажите свой обычный график"
      subtitle="Так я буду знать, когда рабочая задача уместна, а когда лучше оставить её на потом. Изменить график можно в настройках в любой момент."
      onBack={() => navigate("/onboarding/goals-and-habits")}
      onNext={handleNext}
      nextDisabled={days.length === 0}
      nextLabel={`Далее${weeklyHours > 0 ? ` · ${Math.round(weeklyHours)} ч/нед` : ""}`}
    >
      <div className="relative space-y-4">
        {/* Мягкое свечение на фоне */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 pointer-events-none"
        >
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-violet-400/15 blur-3xl" />
        </div>

        {/* ─── Быстрые пресеты ───────────────────────────── */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Быстрый выбор
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const active =
                days.length === p.days.length &&
                days.every((d) => p.days.includes(d)) &&
                from === p.from &&
                to === p.to;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                    "hover:-translate-y-0.5",
                    active
                      ? "bg-blue-500 border-blue-500 text-white shadow-sm"
                      : "bg-white/70 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-sm"
                  )}
                >
                  {p.label} · {p.from}–{p.to}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Рабочие дни ───────────────────────────────── */}
        <Card className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-3xl"
          />

          <CardContent className="relative space-y-5">
            {/* Заголовок блока */}
            <div className="flex items-start gap-3">
              <div
                aria-hidden="true"
                className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white shadow-sm"
              >
                <CalendarDays size={16} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Рабочие дни
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Кликните, чтобы добавить или убрать день
                </p>
              </div>
            </div>

            {/* Плитки дней недели */}
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS.map((d) => {
                const active = days.includes(d.short);
                return (
                  <button
                    key={d.short}
                    type="button"
                    onClick={() => toggleDay(d.short)}
                    aria-pressed={active}
                    aria-label={d.full}
                    title={d.full}
                    className={cn(
                      "group relative flex flex-col items-center justify-center",
                      "h-14 rounded-xl transition-all duration-200",
                      "border",
                      active
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-transparent shadow-md ring-2 ring-blue-400/30"
                        : "bg-white/70 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                  >
                    <span className="text-sm font-semibold">{d.short}</span>
                    <span className={cn(
                      "mt-0.5 w-1 h-1 rounded-full transition-all",
                      active ? "bg-white" : "bg-transparent"
                    )} aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            {/* Разделитель */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
                Рабочие часы
              </span>
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>

            {/* Рабочие часы */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <Sun size={12} aria-hidden="true" />
                  Начало
                </span>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    type="time"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </label>

              <label className="block">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <Moon size={12} aria-hidden="true" />
                  Конец
                </span>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    type="time"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </label>
            </div>

            {/* Разделитель */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
              <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
                Часовой пояс
              </span>
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>

            {/* Часовой пояс */}
            <label className="block">
              <div className="relative">
                <Globe
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                  placeholder="Europe/Moscow"
                  className="pl-9"
                />
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <Info size={11} aria-hidden="true" />
                Определили автоматически — можно изменить
              </p>
            </label>
          </CardContent>
        </Card>

        {/* ─── Превью недели ────────────────────────────── */}
        <Card className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-violet-400/20 to-pink-500/20 blur-3xl"
          />

          <CardContent className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  aria-hidden="true"
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white shadow-sm"
                >
                  <Briefcase size={13} />
                </div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  Ваша рабочая неделя
                </p>
              </div>
              <Badge variant="default">
                <span className="tabular-nums">{Math.round(weeklyHours)} ч</span>
              </Badge>
            </div>

            {/* Полоса недели: будни / выходные */}
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d) => {
                const active = days.includes(d.short);
                return (
                  <div
                    key={`preview-${d.short}`}
                    className={cn(
                      "h-2 rounded-full transition-colors",
                      active
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                        : "bg-gray-100 dark:bg-gray-800"
                    )}
                    title={d.full}
                  />
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>
                {days.length > 0
                  ? `${days.length} ${plural(days.length, "день", "дня", "дней")} · ${from}–${to}`
                  : "Ни один день не выбран"}
              </span>
              {weeklyHours > 0 && (
                <span className="tabular-nums">
                  ≈ {Math.round(weeklyHours)} ч в неделю
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
};

// Утилита для склонения «день / дня / дней»
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}