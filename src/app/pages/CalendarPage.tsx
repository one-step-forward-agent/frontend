import { useCallback, useEffect, useMemo } from "react";
import { api } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { EventList } from "../components/events";
import { RecommendationList } from "../components/recommendations";
import { Icon } from "../components/icons";
import { Button, Card, Empty, ErrorNote, PageHeader } from "../components/ui";
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

function weekTitle(start: Date): string {
  const end = addDays(start, 6);
  const left = start.getMonth() === end.getMonth() ? String(start.getDate()) : formatDate(start, { day: "numeric", month: "long" });
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

const untimedFirst = (events: CalendarEvent[]) => [...events.filter((event) => event.all_day), ...events.filter((event) => !event.all_day)];

export function CalendarPage() {
  useTitle("Календарь");
  const { query } = useLocation();
  const today = startOfDay(new Date());
  const requested = query.get("view");
  const view: View = requested === "day" || requested === "week" || requested === "month" ? requested : storedView();
  const selected = parseDayKey(query.get("day")) ?? today;
  const month = parseDayKey(`${query.get("month") ?? ""}-01`) ?? startOfMonth(selected);

  const gridStart = view === "day" ? selected : view === "week" ? startOfWeek(selected) : startOfWeek(month);
  const length = view === "day" ? 1 : view === "week" ? 7 : 42;
  const days = useMemo(() => Array.from({ length }, (_, index) => addDays(gridStart, index)), [gridStart.getTime(), length]);
  const gridEnd = addDays(gridStart, length);

  const events = useAsync(
    () => api.events.list({ start: gridStart.toISOString(), end: gridEnd.toISOString(), limit: 1000 }),
    [gridStart.getTime(), length],
  );
  // Советы по расписанию — на неделю (в виде «день» и «неделя») или на месяц
  const scope = view === "month" ? "month" : "week";
  const anchor = view === "month" ? month : selected;
  const recommendations = useAsync(() => api.recommendations(scope, dayKey(anchor)), [scope, view === "month" ? dayKey(month) : dayKey(startOfWeek(selected))]);
  const reloadAll = useCallback(() => {
    events.reload();
    recommendations.reload();
  }, [events.reload, recommendations.reload]);
  useTasksChanged(reloadAll);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) map.set(dayKey(day), (events.data ?? []).filter((event) => occursOn(event, day)));
    return map;
  }, [days, events.data]);

  const go = (day: Date, nextView: View = view, nextMonth: Date = startOfMonth(day)) => {
    try {
      localStorage.setItem(VIEW_KEY, nextView);
    } catch {
      // вид просто не запомнится
    }
    navigate(`/calendar?view=${nextView}&month=${dayKey(nextMonth).slice(0, 7)}&day=${dayKey(day)}`, { replace: true });
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
    go(day, view, view === "month" && day.getMonth() === month.getMonth() ? month : startOfMonth(day));
  };
  const selectDay = (day: Date) => go(day, view, view === "month" && day.getMonth() === month.getMonth() ? month : startOfMonth(day));

  // ← и → листают так же, как стрелки в шапке
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.altKey || event.ctrlKey || event.metaKey || target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.key === "ArrowLeft") shift(-1);
      if (event.key === "ArrowRight") shift(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const selectedEvents = untimedFirst(byDay.get(dayKey(selected)) ?? (events.data ?? []).filter((event) => occursOn(event, selected)));
  const title = view === "day" ? dayTitle(selected) : view === "week" ? weekTitle(gridStart) : formatMonth(month);

  return (
    <div className="page page-wide">
      <PageHeader
        title={title}
        actions={
          <>
            <div className="segmented" role="tablist" aria-label="Вид календаря">
              {VIEWS.map((item) => (
                <button key={item.value} role="tab" aria-selected={view === item.value} className={view === item.value ? "active" : ""} onClick={() => go(selected, item.value)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="segmented">
              <Button variant="ghost" icon="left" aria-label={STEP_LABELS[view][0]} title={STEP_LABELS[view][0]} onClick={() => shift(-1)} />
              <Button variant="ghost" size="sm" onClick={() => go(today, view, startOfMonth(today))}>
                Сегодня
              </Button>
              <Button variant="ghost" icon="right" aria-label={STEP_LABELS[view][1]} title={STEP_LABELS[view][1]} onClick={() => shift(1)} />
            </div>
          </>
        }
      />

      {events.error && <ErrorNote message={events.error} onRetry={events.reload} />}

      <section className="recommendations" aria-label={view === "month" ? "Советы на месяц" : "Советы на неделю"}>
        <Icon name="assistant" />
        <RecommendationList items={recommendations.data} label={view === "month" ? "Dayla анализирует месяц…" : "Dayla анализирует неделю…"} />
      </section>

      {view === "day" ? (
        <Card className="day-view">
          <DayEvents day={selected} events={selectedEvents} loading={events.loading} />
        </Card>
      ) : (
        <div className="calendar-layout">
          <div className={`month ${view === "week" ? "week" : ""} ${events.loading ? "is-loading" : ""}`} role="grid" aria-label={title}>
            <div className="month-head" role="row">
              {WEEKDAYS.map((name) => (
                <span key={name} role="columnheader">
                  {name}
                </span>
              ))}
            </div>
            <div className="month-grid">
              {days.map((day) => {
                const items = untimedFirst(byDay.get(dayKey(day)) ?? []);
                const classes = [
                  "day-cell",
                  view === "month" && day.getMonth() !== month.getMonth() && "other-month",
                  sameDay(day, today) && "today",
                  sameDay(day, selected) && "selected",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={day.getTime()}
                    type="button"
                    role="gridcell"
                    className={classes}
                    onClick={() => selectDay(day)}
                    onDoubleClick={() => go(day, "day")}
                    aria-pressed={sameDay(day, selected)}
                    aria-label={`${formatDate(day, { day: "numeric", month: "long" })}, событий: ${items.length}`}
                  >
                    <span className="day-number">{day.getDate()}</span>
                    <span className="day-chips">
                      {items.slice(0, view === "week" ? items.length : MAX_CHIPS).map((event) => (
                        <span key={event.id} className={`chip priority-${event.priority} ${event.completed_at ? "chip-done" : ""} ${event.all_day ? "chip-untimed" : ""}`}>
                          {!event.all_day && <b>{new Date(event.start_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</b>} {event.title}
                        </span>
                      ))}
                      {view === "month" && items.length > MAX_CHIPS && <span className="chip-more">+{items.length - MAX_CHIPS}</span>}
                    </span>
                    {items.length > 0 && (
                      <span className="day-dots" aria-hidden="true">
                        {items.slice(0, 3).map((event) => (
                          <i key={event.id} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="day-panel">
            <div className="card-head day-panel-head">
              <Button variant="ghost" size="sm" icon="left" aria-label="Предыдущий день" title="Предыдущий день" onClick={() => shiftDay(-1)} />
              <h2>{dayTitle(selected)}</h2>
              <Button variant="ghost" size="sm" icon="right" aria-label="Следующий день" title="Следующий день" onClick={() => shiftDay(1)} />
            </div>
            <DayEvents day={selected} events={selectedEvents} loading={events.loading} />
          </Card>
        </div>
      )}
    </div>
  );
}

function DayEvents({ day, events, loading }: { day: Date; events: CalendarEvent[]; loading: boolean }) {
  const untimed = events.filter((event) => event.all_day);
  const timed = events.filter((event) => !event.all_day);
  return (
    <>
      {events.length ? (
        <>
          {untimed.length > 0 && (
            <div className="day-group">
              <h3>Без времени</h3>
              <EventList events={untimed} />
            </div>
          )}
          {timed.length > 0 && (
            <div className="day-group">
              {untimed.length > 0 && <h3>По времени</h3>}
              <EventList events={timed} />
            </div>
          )}
        </>
      ) : (
        <Empty title="Нет задач">{loading ? "Загружаем…" : "Выберите другой день или добавьте задачу."}</Empty>
      )}
      <Link to={`/events/new?day=${dayKey(day)}`} className="btn btn-secondary btn-sm day-add">
        <Icon name="plus" size={16} />
        Задача на этот день
      </Link>
    </>
  );
}
