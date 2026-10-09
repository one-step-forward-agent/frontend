// src/pages/CalendarPage.tsx
import { useCallback, useEffect, useMemo } from "react";
import { api } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { EventList } from "../components/events";
import { RecommendationList } from "../components/recommendations";
import { Icon } from "../components/icons";
import { Empty, ErrorNote } from "../components/ui";
import {
  addDays,
  dayKey,
  formatDate,
  formatMonth,
  occursOn,
  parseDayKey,
  sameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "../lib/format";
import { useAsync, useTags, useTasksChanged } from "../lib/hooks";
import { navigate, useLocation, useTitle } from "../router";
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
  "relative flex-1 sm:flex-none px-2 sm:px-3.5 h-8 rounded-full text-sm font-medium transition-colors duration-200 outline-none";
const NAV_BUTTON =
  "relative shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full " +
  "text-gray-700 dark:text-gray-200 hover:bg-white/[0.12] dark:hover:bg-white/[0.06] transition-colors";
const TODAY_BUTTON =
  "relative shrink-0 inline-flex items-center h-10 px-3 sm:px-4 rounded-full text-sm font-medium " +
  "text-gray-700 dark:text-gray-200 transition-colors " +
  GLASS_BODY;
const SEGMENTED_TAB_ACTIVE =
  "bg-sky-500/20 text-sky-800 dark:text-sky-100 ring-1 ring-sky-400/40";
const SEGMENTED_TAB_IDLE =
  "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200";

// Как в списках задач: зелёная — выполнена, красная — время прошло, а не выполнена
const missed = (event: CalendarEvent, now: Date) =>
  !event.completed_at && new Date(event.end_at) <= now;
const statusDot = (event: CalendarEvent, now: Date) =>
  event.completed_at ? "bg-emerald-500" : missed(event, now) ? "bg-rose-500" : "bg-sky-500";
const statusChip = (event: CalendarEvent, now: Date) =>
  event.completed_at
    ? "bg-emerald-500/15 line-through text-gray-500 dark:text-gray-400"
    : missed(event, now)
    ? "bg-rose-500/15 text-gray-700 dark:text-gray-200"
    : "bg-white/[0.05] dark:bg-white/[0.03] text-gray-700 dark:text-gray-200";

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
  const now = new Date();
  const today = startOfDay(now);
  const requested = query.get("view");
  const view: View =
    requested === "day" || requested === "week" || requested === "month"
      ? requested
      : storedView();
  const selected = parseDayKey(query.get("day")) ?? today;
  const { byId: tagsById } = useTags();
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

  // Стрелки листают то, что выбрано: день, неделю или месяц
  const shift = (delta: number) => {
    if (view === "month") {
      const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
      go(sameDay(startOfMonth(today), next) ? today : next, view, next);
    } else {
      go(addDays(selected, (view === "week" ? 7 : 1) * delta));
    }
  };
  const selectDay = (day: Date) =>
    go(day, view, day.getMonth() === month.getMonth() ? month : startOfMonth(day));

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
      ? formatDate(selected, { weekday: "short", day: "numeric", month: "long" })
      : view === "week"
      ? weekTitle(gridStart)
      : formatMonth(month);
  // "Сегодня" only when today is off the screen: one way back, not a second "today"
  const showsToday =
    view === "month" ? sameDay(month, startOfMonth(today)) : days.some((day) => sameDay(day, today));

  return (
    <div className={cn("relative mx-auto pt-[1.5vh]", view === "month" ? "max-w-6xl 2xl:max-w-7xl" : "max-w-4xl")}>
      {/* ─── Шапка: период со стрелками внутри, под ней — вид ─── */}
      <header className="mb-6 space-y-3">
        <div className={cn("relative flex items-center gap-1 p-1 rounded-full", GLASS_BODY)}>
          <button
            type="button"
            className={NAV_BUTTON}
            aria-label={STEP_LABELS[view][0]}
            title={STEP_LABELS[view][0]}
            onClick={() => shift(-1)}
          >
            <Icon name="left" size={18} />
          </button>
          <h1 className="min-w-0 flex-1 text-center truncate !text-[20px] sm:!text-[24px] capitalize-first">
            {title}
          </h1>
          <button
            type="button"
            className={NAV_BUTTON}
            aria-label={STEP_LABELS[view][1]}
            title={STEP_LABELS[view][1]}
            onClick={() => shift(1)}
          >
            <Icon name="right" size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(SEGMENTED, "flex-1 min-w-0 sm:flex-none")}
            role="tablist"
            aria-label="Вид календаря"
          >
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
          {!showsToday && (
            <button
              type="button"
              className={TODAY_BUTTON}
              onClick={() => go(today, view, startOfMonth(today))}
            >
              Сегодня
            </button>
          )}
        </div>
      </header>

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
          <DayEvents events={selectedEvents} loading={events.loading} />
        </GlassCard>
      ) : view === "week" ? (
        /* Неделя — крупный план: каждый день раскрыт, задачи написаны целиком */
        <div className="space-y-3">
          {days.map((day) => {
            const items = untimedFirst(byDay.get(dayKey(day)) ?? []);
            const isToday = sameDay(day, today);
            return (
              <GlassCard key={day.getTime()} className={cn(isToday && "ring-1 ring-sky-400/50")}>
                <button
                  type="button"
                  className="mb-2 flex items-baseline gap-2 text-left hover:underline"
                  title="Открыть день"
                  onClick={() => go(day, "day")}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold capitalize-first",
                      isToday ? "text-sky-700 dark:text-sky-300" : "text-gray-900 dark:text-white"
                    )}
                  >
                    {formatDate(day, { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                  {isToday && (
                    <span className="text-xs text-sky-700 dark:text-sky-300">сегодня</span>
                  )}
                </button>
                {items.length ? (
                  <EventList events={items} />
                ) : (
                  <p className="px-3 text-sm text-gray-400 dark:text-gray-500">
                    {events.loading ? "Загружаем…" : "Свободно"}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <div className="grid 2xl:grid-cols-[minmax(0,1fr)_300px] gap-6">
          {/* ─── Сетка месяца ─────────────────────── */}
          <div
            className={cn("relative overflow-hidden rounded-2xl p-3 sm:p-4", GLASS_BODY)}
            role="grid"
            aria-label={title}
          >
            <div className="relative grid grid-cols-7 gap-1.5 mb-1.5" role="row">
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

            <div className="relative grid gap-1.5 grid-cols-7 grid-rows-6">
              {days.map((day) => {
                const items = untimedFirst(byDay.get(dayKey(day)) ?? []);
                const isToday = sameDay(day, today);
                const isSelected = sameDay(day, selected);
                const otherMonth = day.getMonth() !== month.getMonth();

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
                      "group relative overflow-hidden rounded-xl aspect-square sm:aspect-auto sm:min-h-[124px]",
                      "transition-colors duration-200",
                      "bg-white/[0.04] dark:bg-white/[0.02]",
                      "ring-1 ring-white/20 dark:ring-white/10",
                      "hover:bg-white/[0.08] dark:hover:bg-white/[0.04]",
                      "outline-none focus:outline-none focus-visible:ring-sky-400/50",
                      otherMonth && "opacity-40",
                      isToday &&
                        !isSelected &&
                        "ring-amber-400/50 bg-amber-500/[0.06] dark:bg-amber-500/[0.05]",
                      isSelected && "bg-sky-500/[0.12] dark:bg-sky-500/[0.10] ring-sky-400/50"
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

                      <span className="hidden sm:flex flex-col gap-0.5 min-w-0">
                        {items.slice(0, MAX_CHIPS).map((event) => {
                          const tag = event.tag_ids?.map((id) => tagsById.get(id)).find(Boolean);
                          const time = event.all_day
                            ? ""
                            : new Date(event.start_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
                          return (
                            <span
                              key={event.id}
                              title={[time, event.title, tag && `#${tag.name}`].filter(Boolean).join(" · ")}
                              className={cn(
                                "relative block min-w-0 line-clamp-2 break-words",
                                "pl-2 pr-1.5 py-0.5 rounded-md text-[11px] leading-[14px]",
                                statusChip(event, now),
                                tag && `tag-${tag.color}`
                              )}
                            >
                              {/* Сфера задачи — полоска её цвета, чтобы было видно, о чём задача */}
                              <span
                                aria-hidden="true"
                                className="absolute left-0 inset-y-0.5 w-[3px] rounded-full"
                                style={{ background: tag ? "var(--dot)" : "transparent" }}
                              />
                              {event.title}
                            </span>
                          );
                        })}

                        {items.length > MAX_CHIPS && (
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 px-1">
                            +{items.length - MAX_CHIPS}
                          </span>
                        )}
                      </span>

                      {items.length > 0 && (
                        <span
                          className="sm:hidden mt-auto flex flex-wrap items-center gap-0.5"
                          aria-hidden="true"
                        >
                          {items.slice(0, 3).map((event) => (
                            <i
                              key={event.id}
                              className={cn("w-1.5 h-1.5 rounded-full", statusDot(event, now))}
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

          {/* ─── Панель выбранного дня: без своих стрелок, листает шапка ─── */}
          <GlassCard className="h-fit lg:sticky lg:top-6">
            <h2 className="mb-4 text-sm font-medium text-gray-900 dark:text-white truncate capitalize-first">
              {formatDate(selected, { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            <DayEvents events={selectedEvents} loading={events.loading} />
          </GlassCard>
        </div>
      )}
    </div>
  );
}

/* ─── DayEvents ─────────────────────────────────────────── */

function DayEvents({ events, loading }: { events: CalendarEvent[]; loading: boolean }) {
  const untimed = events.filter((event) => event.all_day);
  const timed = events.filter((event) => !event.all_day);

  if (!events.length)
    return <Empty title="Нет задач">{loading ? "Загружаем…" : "Свободный день."}</Empty>;

  return (
    <div className="space-y-4">
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
    </div>
  );
}
