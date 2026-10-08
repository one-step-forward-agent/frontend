// src/pages/CalendarPage.tsx
import { useCallback, useEffect, useMemo } from "react";
import { api } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { EventList } from "../components/events";
import { RecommendationList } from "../components/recommendations";
import { Icon } from "../components/icons";
import { Button, Empty, ErrorNote, PageHeader } from "../components/ui";
import {
  addDays,
  dayKey,
  dayTitle,
  formatDate,
  formatMonth,
  occursOn,
  parseDayKey,
  sameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../lib/format";
import { useAsync, useTasksChanged } from "../lib/hooks";
import { Link, navigate, useLocation, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { GlassCard, GLASS_BODY_FLAT } from "@/components/dashboard/glass";

const GLASS_BODY = GLASS_BODY_FLAT;

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MAX_CHIPS = 3;
const VIEWS = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
] as const;
type View = (typeof VIEWS)[number]["value"];
const VIEW_KEY = "dayla-calendar-view";
const STEP_LABELS: Record<View, [string, string]> = {
  day: ["Предыдущий день", "Следующий день"],
  week: ["Предыдущая неделя", "Следующая неделя"],
  month: ["Предыдущий месяц", "Следующий месяц"],
};

/* ─── Стили стеклянных элементов ────────────────────────── */

const SEGMENTED =
  "relative inline-flex items-center gap-1 p-1 rounded-full overflow-hidden " + GLASS_BODY;
const SEGMENTED_TAB =
  "relative px-3.5 h-7 rounded-full text-xs font-medium transition-colors duration-200 outline-none";
const SEGMENTED_TAB_ACTIVE =
  "bg-sky-500/20 text-sky-800 dark:text-sky-100 ring-1 ring-sky-400/40";
const SEGMENTED_TAB_IDLE =
  "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200";

const PRIORITY_TINT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-sky-500",
  low: "bg-slate-400",
};

/* ─── Утилиты ───────────────────────────────────────────── */

function weekTitle(start: Date): string {
  const end = addDays(start, 6);
  const left =
    start.getMonth() === end.getMonth()
      ? String(start.getDate())
      : formatDate(start, { day: "numeric", month: "long" });
  return `${left} – ${formatDate(end, { day: "numeric", month: "long" })}`;
}

function storedView(): View {
  try {
    const value = localStorage.getItem(VIEW_KEY);
    return value === "day" || value === "week" || value === "month" ? value : "month";
  } catch {
    return "month";
  }
}

const untimedFirst = (events: CalendarEvent[]) => [
  ...events.filter((event) => event.all_day),
  ...events.filter((event) => !event.all_day),
];

/* ─── Страница ──────────────────────────────────────────── */

export function CalendarPage() {
  useTitle("Календарь");
  const { query } = useLocation();
  const today = startOfDay(new Date());
  const requested = query.get("view");
  const view: View =
    requested === "day" || requested === "week" || requested === "month"
      ? requested
      : storedView();
  const selected = parseDayKey(query.get("day")) ?? today;
  const month = parseDayKey(`${query.get("month") ?? ""}-01`) ?? startOfMonth(selected);

  const gridStart =
    view === "day" ? selected : view === "week" ? startOfWeek(selected) : startOfWeek(month);
  const length = view === "day" ? 1 : view === "week" ? 7 : 42;
  const days = useMemo(
    () => Array.from({ length }, (_, index) => addDays(gridStart, index)),
    [gridStart.getTime(), length]
  );
  const gridEnd = addDays(gridStart, length);

  const events = useAsync(
    () =>
      api.events.list({
        start: gridStart.toISOString(),
        end: gridEnd.toISOString(),
        limit: 1000,
      }),
    [gridStart.getTime(), length]
  );

  const scope = view === "month" ? "month" : "week";
  const anchor = view === "month" ? month : selected;
  const recommendations = useAsync(
    () => api.recommendations(scope, dayKey(anchor)),
    [scope, view === "month" ? dayKey(month) : dayKey(startOfWeek(selected))]
  );

  const reloadAll = useCallback(() => {
    events.reload();
    recommendations.reload();
  }, [events.reload, recommendations.reload]);
  useTasksChanged(reloadAll);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days)
      map.set(
        dayKey(day),
        (events.data ?? []).filter((event) => occursOn(event, day))
      );
    return map;
  }, [days, events.data]);

  const go = (
    day: Date,
    nextView: View = view,
    nextMonth: Date = startOfMonth(day)
  ) => {
    try {
      localStorage.setItem(VIEW_KEY, nextView);
    } catch {
      // вид просто не запомнится
    }
    navigate(
      `/calendar?view=${nextView}&month=${dayKey(nextMonth).slice(0, 7)}&day=${dayKey(day)}`,
      { replace: true }
    );
  };

  const shift = (delta: number) => {
    if (view === "month") {
      const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
      go(sameDay(startOfMonth(today), next) ? today : next, view, next);
    } else {
      go(addDays(selected, (view === "week" ? 7 : 1) * delta));
    }
  };
  const shiftDay = (delta: number) => {
    const day = addDays(selected, delta);
    go(
      day,
      view,
      view === "month" && day.getMonth() === month.getMonth()
        ? month
        : startOfMonth(day)
    );
  };
  const selectDay = (day: Date) =>
    go(
      day,
      view,
      view === "month" && day.getMonth() === month.getMonth()
        ? month
        : startOfMonth(day)
    );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        target?.closest("input, textarea, select, [contenteditable]")
      )
        return;
      if (event.key === "ArrowLeft") shift(-1);
      if (event.key === "ArrowRight") shift(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const selectedEvents = untimedFirst(
    byDay.get(dayKey(selected)) ??
      (events.data ?? []).filter((event) => occursOn(event, selected))
  );
  const title =
    view === "day"
      ? dayTitle(selected)
      : view === "week"
      ? weekTitle(gridStart)
      : formatMonth(month);

  return (
    <div className="relative max-w-4xl mx-auto pt-[1.5vh]">
      <PageHeader
        title={title}
        actions={
          <>
            <div className={SEGMENTED} role="tablist" aria-label="Вид календаря">
              {VIEWS.map((item) => (
                <button
                  key={item.value}
                  role="tab"
                  aria-selected={view === item.value}
                  className={cn(
                    SEGMENTED_TAB,
                    view === item.value ? SEGMENTED_TAB_ACTIVE : SEGMENTED_TAB_IDLE
                  )}
                  onClick={() => go(selected, item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={SEGMENTED}>
              <Button
                variant="ghost"
                icon="left"
                aria-label={STEP_LABELS[view][0]}
                title={STEP_LABELS[view][0]}
                onClick={() => shift(-1)}
              />
              <button
                type="button"
                className={cn(SEGMENTED_TAB, SEGMENTED_TAB_IDLE)}
                onClick={() => go(today, view, startOfMonth(today))}
              >
                Сегодня
              </button>
              <Button
                variant="ghost"
                icon="right"
                aria-label={STEP_LABELS[view][1]}
                title={STEP_LABELS[view][1]}
                onClick={() => shift(1)}
              />
            </div>
          </>
        }
      />

      {events.error && <ErrorNote message={events.error} onRetry={events.reload} />}

      <div className="mb-6">
        <GlassCard>
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden",
                "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-xl",
                "ring-1 ring-white/30 dark:ring-white/10",
                "text-sky-600 dark:text-sky-300"
              )}
            >
              <Icon name="assistant" size={16} className="relative" />
            </span>
            <div className="min-w-0 flex-1">
              <RecommendationList
                items={recommendations.data}
                label={
                  view === "month"
                    ? "Dayla анализирует месяц…"
                    : "Dayla анализирует неделю…"
                }
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {view === "day" ? (
        <GlassCard>
          <DayEvents day={selected} events={selectedEvents} loading={events.loading} />
        </GlassCard>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
          {/* ─── Сетка календаря ─────────────────────── */}
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl p-3 sm:p-4",
              GLASS_BODY
            )}
            role="grid"
            aria-label={title}
          >
            <div
              className="relative grid grid-cols-7 gap-1.5 mb-1.5"
              role="row"
            >
              {WEEKDAYS.map((name) => (
                <span
                  key={name}
                  role="columnheader"
                  className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center py-1"
                >
                  {name}
                </span>
              ))}
            </div>

            <div
              className={cn(
                "relative grid gap-1.5",
                view === "week"
                  ? "grid-cols-7 grid-rows-1 min-h-[280px]"
                  : "grid-cols-7 grid-rows-6"
              )}
            >
              {days.map((day) => {
                const items = untimedFirst(byDay.get(dayKey(day)) ?? []);
                const isToday = sameDay(day, today);
                const isSelected = sameDay(day, selected);
                const otherMonth = view === "month" && day.getMonth() !== month.getMonth();
                const cellsToShow = view === "week" ? items.length : MAX_CHIPS;

                return (
                  <button
                    key={day.getTime()}
                    type="button"
                    role="gridcell"
                    onClick={() => selectDay(day)}
                    onDoubleClick={() => go(day, "day")}
                    aria-pressed={isSelected}
                    aria-label={`${formatDate(day, {
                      day: "numeric",
                      month: "long",
                    })}, событий: ${items.length}`}
                    className={cn(
                      "group relative overflow-hidden rounded-xl",
                      "aspect-square",
                      "transition-colors duration-200",
                      "bg-white/[0.04] dark:bg-white/[0.02]",
                      "ring-1 ring-white/20 dark:ring-white/10",
                      "hover:bg-white/[0.08] dark:hover:bg-white/[0.04]",
                      "outline-none focus:outline-none focus-visible:ring-sky-400/50",
                      otherMonth && "opacity-40",
                      isToday &&
                        !isSelected &&
                        "ring-amber-400/50 bg-amber-500/[0.06] dark:bg-amber-500/[0.05]",
                      isSelected &&
                        "bg-sky-500/[0.12] dark:bg-sky-500/[0.10] ring-sky-400/50"
                    )}
                  >
                    {/* ─── Абсолютный слой: не влияет на intrinsic height кнопки ─── */}
                    <span className="absolute inset-0 flex flex-col gap-1 p-1.5 sm:p-2 text-left">
                      <span className="flex items-center justify-between text-xs">
                        <span
                          className={cn(
                            "font-semibold tabular-nums",
                            isToday
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {day.getDate()}
                        </span>
                      </span>

                      <span className="flex flex-col gap-0.5 min-w-0">
                        {items.slice(0, cellsToShow).map((event) => (
                          <span
                            key={event.id}
                            className={cn(
                              "relative inline-flex items-center gap-1 min-w-0",
                              "px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px]",
                              "bg-white/[0.05] dark:bg-white/[0.03]",
                              "text-gray-700 dark:text-gray-200 truncate",
                              event.completed_at && "opacity-50 line-through"
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "shrink-0 w-1 h-1 rounded-full",
                                PRIORITY_TINT[event.priority ?? "medium"] ?? "bg-sky-500"
                              )}
                            />
                            {!event.all_day && (
                              <b className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400 font-medium">
                                {new Date(event.start_at).toLocaleTimeString("ru-RU", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </b>
                            )}
                            <span className="truncate">{event.title}</span>
                          </span>
                        ))}

                        {view === "month" && items.length > MAX_CHIPS && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 px-1">
                            +{items.length - MAX_CHIPS}
                          </span>
                        )}

                        {view === "week" && items.length === 0 && (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 px-1">
                            —
                          </span>
                        )}
                      </span>

                      {items.length > 0 && view === "month" && (
                        <span
                          className="mt-auto flex items-center gap-0.5"
                          aria-hidden="true"
                        >
                          {items.slice(0, 3).map((event) => (
                            <i
                              key={event.id}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                PRIORITY_TINT[event.priority ?? "medium"] ?? "bg-sky-500"
                              )}
                            />
                          ))}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Панель дня ──────────────────────────── */}
          <GlassCard className="h-fit lg:sticky lg:top-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon="left"
                aria-label="Предыдущий день"
                title="Предыдущий день"
                onClick={() => shiftDay(-1)}
              />
              <h2 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {dayTitle(selected)}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                icon="right"
                aria-label="Следующий день"
                title="Следующий день"
                onClick={() => shiftDay(1)}
              />
            </div>
            <DayEvents
              day={selected}
              events={selectedEvents}
              loading={events.loading}
            />
          </GlassCard>
        </div>
      )}
    </div>
  );
}

/* ─── DayEvents ─────────────────────────────────────────── */

function DayEvents({
  day,
  events,
  loading,
}: {
  day: Date;
  events: CalendarEvent[];
  loading: boolean;
}) {
  const untimed = events.filter((event) => event.all_day);
  const timed = events.filter((event) => !event.all_day);

  return (
    <div className="space-y-4">
      {events.length ? (
        <>
          {untimed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Без времени
              </h3>
              <EventList events={untimed} />
            </div>
          )}
          {timed.length > 0 && (
            <div className="space-y-2">
              {untimed.length > 0 && (
                <h3 className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  По времени
                </h3>
              )}
              <EventList events={timed} />
            </div>
          )}
        </>
      ) : (
        <Empty title="Нет задач">
          {loading ? "Загружаем…" : "Выберите другой день или добавьте задачу."}
        </Empty>
      )}

      <Link
        to={`/events/new?day=${dayKey(day)}`}
        className={cn(
          "relative inline-flex items-center justify-center gap-1.5 overflow-hidden",
          "w-full px-3 h-9 rounded-xl text-xs font-medium",
          "transition-transform duration-200 hover:-translate-y-0.5",
          GLASS_BODY,
          "text-gray-700 dark:text-gray-300"
        )}
      >
        <Icon name="plus" size={14} className="relative" />
        <span className="relative">Задача на этот день</span>
      </Link>
    </div>
  );
}