// src/pages/Dashboard/sections/CalendarSection.tsx
import * as React from "react";
import { ChevronLeft, ChevronRight, Plus, Repeat } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DaylaEvent } from "@/api/dayla";
import { useTasksStore } from "@/store/tasksStore";
import { cn } from "@/utils/cn";
import { MONTHS, MONTHS_GENITIVE, WEEKDAYS_SHORT, addDays, formatTime, sameDay, startOfDay, startOfWeek, toISODate } from "@/utils/dates";
import { useEvents } from "../components/useEvents";

type View = "week" | "month";
const MONTH_CHIPS = 3;

const byDay = (events: DaylaEvent[]) => {
  const days = new Map<string, DaylaEvent[]>();
  for (const event of [...events].sort((a, b) => Number(b.all_day) - Number(a.all_day) || a.start_at.localeCompare(b.start_at))) {
    const key = toISODate(new Date(event.start_at));
    days.set(key, [...(days.get(key) ?? []), event]);
  }
  return days;
};

const rangeTitle = (view: View, anchor: Date) => {
  if (view === "month") return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  const first = startOfWeek(anchor);
  const last = addDays(first, 6);
  const left = first.getMonth() === last.getMonth() ? `${first.getDate()}` : `${first.getDate()} ${MONTHS_GENITIVE[first.getMonth()]}`;
  return `${left} – ${last.getDate()} ${MONTHS_GENITIVE[last.getMonth()]} ${last.getFullYear()}`;
};

export const CalendarSection: React.FC = () => {
  const [view, setView] = React.useState<View>("week");
  const [anchor, setAnchor] = React.useState(() => startOfDay(new Date()));

  const first = view === "week" ? startOfWeek(anchor) : startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  const length = view === "week" ? 7 : 42;
  const { events, error } = useEvents(first, addDays(first, length));
  const days = React.useMemo(() => byDay(events), [events]);

  const shift = (direction: number) =>
    setAnchor((current) =>
      view === "week" ? addDays(current, 7 * direction) : new Date(current.getFullYear(), current.getMonth() + direction, 1)
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["week", "month"] as const).map((option) => (
          <Button key={option} size="sm" variant={view === option ? "default" : "secondary"} onClick={() => setView(option)}>
            {option === "week" ? "Неделя" : "Месяц"}
          </Button>
        ))}
        <div className="flex-1" />
        <Button size="icon" variant="ghost" aria-label="Назад" onClick={() => shift(-1)}>
          <ChevronLeft size={18} />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setAnchor(startOfDay(new Date()))}>
          Сегодня
        </Button>
        <Button size="icon" variant="ghost" aria-label="Вперёд" onClick={() => shift(1)}>
          <ChevronRight size={18} />
        </Button>
      </div>
      <h2 className="text-lg font-semibold">{rangeTitle(view, anchor)}</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {view === "week" ? (
        <WeekView first={first} days={days} />
      ) : (
        <MonthView
          first={first}
          month={anchor.getMonth()}
          days={days}
          onShowWeek={(day) => {
            setAnchor(day);
            setView("week");
          }}
        />
      )}
    </div>
  );
};

const EventChip: React.FC<{ event: DaylaEvent; compact?: boolean }> = ({ event, compact }) => {
  const openEdit = useTasksStore((state) => state.openEdit);
  const done = !!event.completed_at;
  return (
    <button
      type="button"
      onClick={(click) => {
        click.stopPropagation();
        openEdit(event);
      }}
      className={cn(
        "w-full text-left rounded-lg px-2 py-1 text-xs truncate transition-colors",
        event.all_day
          ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
          : "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-200",
        done && "line-through opacity-60"
      )}
      title={event.title}
    >
      {!event.all_day && <span className="tabular-nums mr-1 opacity-70">{formatTime(event.start_at)}</span>}
      {!compact && event.series_id && <Repeat size={10} className="inline mr-1 opacity-60" />}
      {event.title}
    </button>
  );
};

const WeekView: React.FC<{ first: Date; days: Map<string, DaylaEvent[]> }> = ({ first, days }) => {
  const openNew = useTasksStore((state) => state.openNew);
  const today = new Date();
  return (
    <Card className="p-0 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
        {Array.from({ length: 7 }, (_, offset) => {
          const day = addDays(first, offset);
          const key = toISODate(day);
          const items = days.get(key) ?? [];
          const isToday = sameDay(day, today);
          return (
            <div key={key} className="min-h-[7rem] md:min-h-[24rem] p-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-medium", isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")}>
                  {WEEKDAYS_SHORT[offset]}{" "}
                  <span className={cn("inline-flex items-center justify-center rounded-full w-6 h-6", isToday && "bg-blue-600 text-white")}>
                    {day.getDate()}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Добавить задачу на ${day.getDate()} ${MONTHS_GENITIVE[day.getMonth()]}`}
                  onClick={() => openNew(key)}
                  className="rounded-md p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <Plus size={14} />
                </button>
              </div>
              {items.map((event) => (
                <EventChip key={event.id} event={event} />
              ))}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const MonthView: React.FC<{ first: Date; month: number; days: Map<string, DaylaEvent[]>; onShowWeek: (day: Date) => void }> = ({
  first,
  month,
  days,
  onShowWeek,
}) => {
  const openNew = useTasksStore((state) => state.openNew);
  const today = new Date();
  return (
    <Card className="p-0 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800">
        {WEEKDAYS_SHORT.map((name) => (
          <div key={name} className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">{name}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 42 }, (_, offset) => {
          const day = addDays(first, offset);
          const key = toISODate(day);
          const items = days.get(key) ?? [];
          const isToday = sameDay(day, today);
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => openNew(key)}
              onKeyDown={(press) => press.key === "Enter" && openNew(key)}
              className={cn(
                "min-h-[5.5rem] p-1.5 flex flex-col gap-1 cursor-pointer border-gray-200 dark:border-gray-800",
                offset % 7 !== 6 && "border-r",
                offset < 35 && "border-b",
                day.getMonth() !== month && "bg-gray-50/60 dark:bg-gray-900/40 text-gray-400",
                "hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
              )}
            >
              <span className={cn("self-end inline-flex items-center justify-center rounded-full w-6 h-6 text-xs", isToday && "bg-blue-600 text-white")}>
                {day.getDate()}
              </span>
              <div className="hidden sm:flex flex-col gap-1">
                {items.slice(0, MONTH_CHIPS).map((event) => (
                  <EventChip key={event.id} event={event} compact />
                ))}
              </div>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={(click) => {
                    click.stopPropagation();
                    onShowWeek(day);
                  }}
                  className={cn("text-[11px] text-blue-600 hover:underline text-left", items.length <= MONTH_CHIPS && "sm:hidden")}
                >
                  <span className="sm:hidden">{items.length} зад.</span>
                  <span className="hidden sm:inline">+{items.length - MONTH_CHIPS} ещё</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
