// src/components/onboarding/ExistingPlans.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, Clock, Globe, Sparkles, Copy,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding, type DayShort } from "./OnboardingContext";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";

const TOTAL = 10;

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_SHEEN =
  "pointer-events-none absolute inset-0 rounded-2xl " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const GLASS_SHEEN_PILL =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const DAYS: { short: DayShort; full: string }[] = [
  { short: "Пн", full: "Понедельник" },
  { short: "Вт", full: "Вторник" },
  { short: "Ср", full: "Среда" },
  { short: "Чт", full: "Четверг" },
  { short: "Пт", full: "Пятница" },
  { short: "Сб", full: "Суббота" },
  { short: "Вс", full: "Воскресенье" },
];

const PRESETS = [
  { id: "classic", label: "Классика",    days: ["Пн", "Вт", "Ср", "Чт", "Пт"] as DayShort[], from: "09:00", to: "18:00" },
  { id: "early",   label: "Ранний",      days: ["Пн", "Вт", "Ср", "Чт", "Пт"] as DayShort[], from: "07:00", to: "16:00" },
  { id: "short",   label: "Сокращённый", days: ["Пн", "Вт", "Ср", "Чт"]       as DayShort[], from: "10:00", to: "18:00" },
];

const SectionDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3">
    <div className="h-px flex-1 bg-white/30 dark:bg-white/10" />
    <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
      {children}
    </span>
    <div className="h-px flex-1 bg-white/30 dark:bg-white/10" />
  </div>
);

const hoursBetween = (from: string, to: string): number => {
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  return Math.max(0, (th * 60 + tm - fh * 60 - fm) / 60);
};

export const ExistingPlans: React.FC = () => {
  const navigate = useNavigate();
  const { data, patch } = useOnboarding();

  const [days, setDays] = React.useState<string[]>(data.workDays);
  const [tz, setTz] = React.useState(data.timezone);

  const [uniformFrom, setUniformFrom] = React.useState(data.workHoursFrom);
  const [uniformTo, setUniformTo] = React.useState(data.workHoursTo);

  const [perDay, setPerDay] = React.useState<boolean>(
    Boolean(data.perDayWorkHours && Object.keys(data.perDayWorkHours).length)
  );

  const [dayTimes, setDayTimes] = React.useState<
    Record<DayShort, { from: string; to: string }>
  >(() => {
    const base = {} as Record<DayShort, { from: string; to: string }>;
    for (const d of DAYS) {
      base[d.short] = {
        from: data.perDayWorkHours?.[d.short]?.from ?? data.workHoursFrom,
        to:   data.perDayWorkHours?.[d.short]?.to   ?? data.workHoursTo,
      };
    }
    return base;
  });

  const toggleDay = (d: string) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setDays(p.days);
    setUniformFrom(p.from);
    setUniformTo(p.to);
    const next = {} as Record<DayShort, { from: string; to: string }>;
    for (const d of DAYS) next[d.short] = { from: p.from, to: p.to };
    setDayTimes(next);
  };

  const updateDayTime = (day: DayShort, key: "from" | "to", value: string) => {
    setDayTimes((prev) => ({
      ...prev,
      [day]: { ...prev[day], [key]: value },
    }));
  };

  const applyFirstToAll = () => {
    const first = days[0] as DayShort | undefined;
    if (!first) return;
    const src = dayTimes[first];
    const next = {} as Record<DayShort, { from: string; to: string }>;
    for (const d of DAYS) next[d.short] = { ...src };
    setDayTimes(next);
  };

  const handleNext = () => {
    if (perDay) {
      const perDayWorkHours: Partial<Record<DayShort, { from: string; to: string }>> = {};
      for (const d of days) {
        const key = d as DayShort;
        perDayWorkHours[key] = dayTimes[key];
      }
      patch({
        workDays: days,
        workHoursFrom: dayTimes[(days[0] as DayShort) ?? "Пн"].from,
        workHoursTo:   dayTimes[(days[0] as DayShort) ?? "Пн"].to,
        timezone: tz,
        perDayWorkHours,
      });
    } else {
      patch({
        workDays: days,
        workHoursFrom: uniformFrom,
        workHoursTo: uniformTo,
        timezone: tz,
        perDayWorkHours: undefined,
      });
    }
    navigate("/onboarding/integrations");
  };

  const weeklyHours = React.useMemo(() => {
    if (!perDay) {
      return hoursBetween(uniformFrom, uniformTo) * days.length;
    }
    let total = 0;
    for (const d of days) {
      const t = dayTimes[d as DayShort];
      if (t) total += hoursBetween(t.from, t.to);
    }
    return total;
  }, [perDay, uniformFrom, uniformTo, days, dayTimes]);

  const activeDays = DAYS.filter((d) => days.includes(d.short));

  return (
    <OnboardingLayout
      step={5}
      totalSteps={TOTAL}
      title="Укажите свой обычный график"
      onBack={() => navigate("/onboarding/goals-and-habits")}
      onNext={handleNext}
      nextDisabled={days.length === 0}
      nextLabel={`Далее${weeklyHours > 0 ? ` · ${Math.round(weeklyHours)} ч/нед` : ""}`}
    >
      <div className="relative space-y-4 sm:space-y-5">
        {/* ─── Eyebrow ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span
            className={cn(
              "relative inline-flex items-center gap-1.5 overflow-hidden",
              "px-2.5 py-1 rounded-full",
              GLASS_BODY,
              "text-[11px] uppercase tracking-widest font-medium",
              "text-gray-600 dark:text-gray-300"
            )}
          >
            <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
            <Sparkles size={11} aria-hidden="true" className="relative" />
            <span className="relative">Ваш график</span>
          </span>
        </div>

        {/* ─── Пресеты ─────────────────────────────── */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Быстрый выбор
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const active =
                days.length === p.days.length &&
                days.every((d) => p.days.includes(d as DayShort)) &&
                !perDay &&
                uniformFrom === p.from &&
                uniformTo === p.to;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "group relative inline-flex items-center overflow-hidden",
                    "px-3 py-1.5 rounded-full text-xs font-medium",
                    "transition-transform duration-200",
                    GLASS_BODY,
                    "text-gray-700 dark:text-gray-300",
                    "hover:-translate-y-0.5",
                    "max-w-full"
                  )}
                  style={
                    active
                      ? {
                          boxShadow:
                            "0 0 0 1.5px rgba(56,189,248,0.6), 0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)",
                        }
                      : undefined
                  }
                >
                  <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
                  <span className="relative truncate">
                    {p.label} · {p.from}–{p.to}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Карточка графика ─────────────────────── */}
        <div className={cn("relative overflow-hidden rounded-2xl", GLASS_BODY)}>
          <span aria-hidden="true" className={GLASS_SHEEN} />

          <div className="relative p-3.5 sm:p-5 space-y-4 sm:space-y-5">
            {/* Заголовок блока */}
            <div className="flex items-start gap-3">
              <div
                aria-hidden="true"
                className={cn(
                  "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden",
                  "bg-white/[0.06] dark:bg-white/[0.02]",
                  "backdrop-blur-xl",
                  "ring-1 ring-white/30 dark:ring-white/10",
                  "text-blue-600 dark:text-blue-300",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                )}
              >
                <CalendarDays size={16} className="relative" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Рабочие дни
                </p>
              </div>
            </div>

            {/* Плитки дней: 7 на всех, но компактнее на мобильном */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
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
                      "group relative flex flex-col items-center justify-center overflow-hidden",
                      "h-12 sm:h-14 rounded-lg sm:rounded-xl transition-transform duration-200",
                      GLASS_BODY,
                      "text-gray-500 dark:text-gray-400",
                      active && "text-white",
                      "hover:-translate-y-0.5"
                    )}
                    style={
                      active
                        ? {
                            boxShadow:
                              "0 0 0 1.5px rgba(56,189,248,0.6), 0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)",
                            backgroundColor: "rgba(56,189,248,0.22)",
                          }
                        : undefined
                    }
                  >
                    <span aria-hidden="true" className={GLASS_SHEEN} />
                    <span className="relative text-xs sm:text-sm font-semibold">
                      {d.short}
                    </span>
                    <span
                      className={cn(
                        "relative mt-0.5 w-1 h-1 rounded-full transition-all",
                        active ? "bg-white" : "bg-transparent"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>

            <SectionDivider>Рабочие часы</SectionDivider>

            {/* Switch — на узких экранах переносится под текст */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  Одинаковое время во все дни
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={!perDay}
                aria-label="Одинаковое время во все дни"
                onClick={() => setPerDay((v) => !v)}
                className={cn(
                  "relative shrink-0 w-11 h-6 rounded-full overflow-hidden transition-colors duration-200",
                  "ring-1 self-start sm:self-auto",
                  !perDay
                    ? [
                        "bg-sky-500/50 ring-sky-400/60",
                        "shadow-[0_4px_14px_rgba(56,189,248,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]",
                      ]
                    : [
                        "bg-white/[0.06] dark:bg-white/[0.02]",
                        "backdrop-blur-xl",
                        "ring-white/30 dark:ring-white/10",
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
                      ]
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white",
                    "shadow-[0_2px_6px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]",
                    "transition-transform duration-200",
                    !perDay ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Одинаковое время: одна колонка на мобильном */}
            {!perDay && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block min-w-0">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <Clock size={12} aria-hidden="true" />
                    Начало
                  </span>
                  <div className="relative min-w-0">
                    <Clock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                      aria-hidden="true"
                    />
                    <Input
                      type="time"
                      value={uniformFrom}
                      onChange={(e) => setUniformFrom(e.target.value)}
                      className="w-full min-w-0 pl-9"
                      style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
                    />
                  </div>
                </label>

                <label className="block min-w-0">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <Clock size={12} aria-hidden="true" />
                    Конец
                  </span>
                  <div className="relative min-w-0">
                    <Clock
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                      aria-hidden="true"
                    />
                    <Input
                      type="time"
                      value={uniformTo}
                      onChange={(e) => setUniformTo(e.target.value)}
                      className="w-full min-w-0 pl-9"
                      style={{ width: "100%", minWidth: 0, maxWidth: "100%" }}
                    />
                  </div>
                </label>
              </div>
            )}

            {/* Разное время по дням */}
            {perDay && (
              <div className="space-y-2">
                {activeDays.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
                    Сначала выберите хотя бы один рабочий день
                  </p>
                )}

                {activeDays.map((d) => {
                  const t = dayTimes[d.short];
                  return (
                    <div
                      key={d.short}
                      className={cn(
                        "relative overflow-hidden rounded-xl sm:rounded-2xl",
                        "p-2.5 sm:p-3",
                        GLASS_BODY
                      )}
                    >
                      <span aria-hidden="true" className={GLASS_SHEEN} />

                      <div className="relative flex items-center gap-2 min-w-0">
                        {/* День — фиксированная узкая метка */}
                        <span className="shrink-0 w-7 text-xs font-semibold text-gray-700 dark:text-gray-200">
                          {d.short}
                        </span>

                        {/* Два инпута: сетка 2 колонки, каждый сжимается */}
                        <div className="flex-1 min-w-0 grid grid-cols-2 gap-1.5">
                          <Input
                            type="time"
                            value={t.from}
                            onChange={(e) => updateDayTime(d.short, "from", e.target.value)}
                            aria-label={`Начало работы в ${d.full}`}
                            className="w-full min-w-0 px-2 text-xs sm:text-sm tabular-nums"
                            style={{
                              width: "100%",
                              minWidth: 0,
                              maxWidth: "100%",
                            }}
                          />
                          <Input
                            type="time"
                            value={t.to}
                            onChange={(e) => updateDayTime(d.short, "to", e.target.value)}
                            aria-label={`Конец работы в ${d.full}`}
                            className="w-full min-w-0 px-2 text-xs sm:text-sm tabular-nums"
                            style={{
                              width: "100%",
                              minWidth: 0,
                              maxWidth: "100%",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <SectionDivider>Часовой пояс</SectionDivider>

            <label className="block">
              <div className="relative">
                <Globe
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                  aria-hidden="true"
                />
                <Input
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                  placeholder="Europe/Moscow"
                  className="pl-9"
                />
              </div>
            </label>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}