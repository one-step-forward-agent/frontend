import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEvent } from "../api/types";
import { Link } from "../router";
import { cn } from "@/utils/cn";

/**
 * Today as a time line: the hours down the side, timed tasks as blocks in their place, overlapping ones side by
 * side, tasks without a time above it, and a red line at the current time that moves every minute.
 */

const HOUR_PX = 44;
const MIN_BLOCK_PX = 22;
const DAY_FROM = 8;
const DAY_TO = 22;

const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();
const clock = (date: Date) => date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

type Placed = { event: CalendarEvent; top: number; height: number; lane: number; lanes: number };

/** Blocks with their place: overlapping tasks share the width in lanes */
function place(events: CalendarEvent[], day: Date, fromHour: number): Placed[] {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const spans = events
    .map((event) => {
      const start = Math.max(new Date(event.start_at).getTime(), dayStart);
      const end = Math.min(new Date(event.end_at).getTime(), dayStart + 24 * 3600_000);
      return { event, start: (start - dayStart) / 60_000, end: Math.max((end - dayStart) / 60_000, (start - dayStart) / 60_000 + 15) };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const placed: Placed[] = [];
  let group: (typeof placed)[number][] = [];
  let groupEnd = -1;
  const laneEnds: number[] = [];
  const close = () => {
    const lanes = Math.max(1, ...group.map((item) => item.lane + 1));
    group.forEach((item) => (item.lanes = lanes));
    group = [];
    laneEnds.length = 0;
  };
  for (const span of spans) {
    if (span.start >= groupEnd) close();
    let lane = laneEnds.findIndex((end) => end <= span.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = span.end;
    groupEnd = Math.max(groupEnd, span.end);
    const item = {
      event: span.event,
      top: ((span.start - fromHour * 60) / 60) * HOUR_PX,
      height: Math.max(((span.end - span.start) / 60) * HOUR_PX - 2, MIN_BLOCK_PX),
      lane,
      lanes: 1,
    };
    placed.push(item);
    group.push(item);
  }
  close();
  return placed;
}

export function DayTimeline({ events, day }: { events: CalendarEvent[]; day: Date }) {
  const [now, setNow] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const timed = events.filter((event) => !event.all_day);
  const allDay = events.filter((event) => event.all_day);
  const isToday = now.toDateString() === day.toDateString();

  // The working day, widened to the tasks and to the current hour
  const fromHour = Math.min(
    DAY_FROM,
    ...timed.map((event) => new Date(event.start_at).getHours()),
    isToday ? now.getHours() : DAY_FROM
  );
  const toHour = Math.max(
    DAY_TO,
    ...timed.map((event) => Math.min(24, new Date(event.end_at).getHours() + 1)),
    isToday ? Math.min(24, now.getHours() + 1) : DAY_TO
  );
  const hours = Array.from({ length: toHour - fromHour + 1 }, (_, index) => fromHour + index);
  const placed = useMemo(() => place(timed, day, fromHour), [timed, day, fromHour]);
  const nowTop = ((minutesOf(now) - fromHour * 60) / 60) * HOUR_PX;

  // Opened with the current time in view
  useEffect(() => {
    const box = scrollRef.current;
    if (box && isToday) box.scrollTop = Math.max(0, nowTop - box.clientHeight / 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {allDay.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Задачи без времени">
          {allDay.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs ring-1 ring-sky-400/30 bg-sky-500/10 text-sky-900 dark:text-sky-100",
                event.completed_at && "line-through opacity-60"
              )}
            >
              {event.title}
            </Link>
          ))}
        </div>
      )}
      <div ref={scrollRef} className="relative max-h-[420px] overflow-y-auto overscroll-contain pr-1" role="list" aria-label="Задачи по времени">
        <div className="relative" style={{ height: (toHour - fromHour) * HOUR_PX + 8 }}>
          {hours.map((hour) => (
            <div key={hour} className="absolute inset-x-0 flex items-start gap-2" style={{ top: (hour - fromHour) * HOUR_PX }}>
              <span className="w-10 shrink-0 -translate-y-1.5 text-right text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
                {String(hour % 24).padStart(2, "0")}:00
              </span>
              <span className="flex-1 border-t border-gray-500/10 dark:border-white/[0.06]" />
            </div>
          ))}

          <div className="absolute top-0 bottom-0 right-0" style={{ left: 48 }}>
            {placed.map(({ event, top, height, lane, lanes }) => {
              const start = new Date(event.start_at);
              const end = new Date(event.end_at);
              const past = end < now;
              return (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  role="listitem"
                  title={`${clock(start)}–${clock(end)} ${event.title}`}
                  className={cn(
                    "absolute overflow-hidden rounded-lg px-2 py-0.5 text-xs leading-tight",
                    "bg-indigo-500/15 dark:bg-indigo-400/15 ring-1 ring-indigo-400/30 text-gray-900 dark:text-white",
                    "hover:ring-indigo-400/60 transition-shadow",
                    (event.completed_at || past) && "opacity-55",
                    event.completed_at && "line-through"
                  )}
                  style={{
                    top,
                    height,
                    left: `calc(${(lane / lanes) * 100}% + 2px)`,
                    width: `calc(${100 / lanes}% - 4px)`,
                  }}
                >
                  <span className="font-medium">{event.title}</span>
                  {height >= 34 && (
                    <span className="block tabular-nums text-gray-500 dark:text-gray-400">
                      {clock(start)}–{clock(end)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {isToday && nowTop >= 0 && nowTop <= (toHour - fromHour) * HOUR_PX && (
            <div className="absolute right-0 z-10 flex items-center pointer-events-none" style={{ top: nowTop, left: 40 }} aria-label={`Сейчас ${clock(now)}`}>
              <span className="w-2.5 h-2.5 -ml-1 -mt-px rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" />
              <span className="flex-1 h-0.5 bg-red-500" />
              <span className="ml-1 -mt-px px-1 rounded text-[10px] font-semibold tabular-nums text-white bg-red-500">{clock(now)}</span>
            </div>
          )}
        </div>
      </div>
      {timed.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400">Задач со временем сегодня нет — день свободен.</p>}
    </div>
  );
}
