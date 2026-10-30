import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import type { CalendarEvent } from "../api/types";
import { occursOn, sameDay, startOfDay } from "../lib/format";
import { taskColor } from "./tags";
import { useNow, useTags } from "../lib/hooks";
import { Link } from "../router";
import { cn } from "@/utils/cn";
import { LOCALE, tr } from "@/i18n";

/**
 * Days by the hour, as in Google Calendar: the hours down the side, one column per day (one for the day view,
 * seven for the week), timed tasks as blocks in their place, overlapping ones side by side, tasks without a time
 * in a row above, and a red line at the current time in today's column that moves every minute.
 * A click on an empty half hour asks for a new task at that time of that day. With the mouse, a timed task is dragged
 * to another time (and, in the week, another day) keeping its length, or stretched by its top or bottom edge; a task
 * without a time is dragged from the row above onto an hour and gets a time. Every drag goes by 15 minutes.
 */

const HOUR_PX = 48;
const MIN_BLOCK_PX = 22;
const GUTTER_PX = 48;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const DAY_MINUTES = 24 * 60;
// A click asks for a new task on a whole or half hour
const SLOT_MINUTES = 30;
// Dragged and stretched tasks land on quarters of an hour
const DRAG_MINUTES = 15;
// A task without a time dropped on the hours lasts an hour
const PLACED_MINUTES = 60;
const SLOT_PX = (SLOT_MINUTES / 60) * HOUR_PX;
// Less than this is a click that opens the task, not a drag
const DRAG_THRESHOLD_PX = 4;

const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();
const clock = (date: Date) => date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
const clockOf = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
// A time of day for minutes that may be below 0 or past midnight
const wrap = (minutes: number) => ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;

type Placed = { event: CalendarEvent; top: number; height: number; lane: number; lanes: number };
// move: the whole task; top / bottom: one edge stretched; place: a task without a time dropped onto the hours
type Mode = "move" | "top" | "bottom" | "place";
// `start` is minutes from the column day's midnight: below 0 for a task that began the day before
type Drag = { mode: Mode; event: CalendarEvent; column: number; start: number; length: number; x: number; y: number; moved: boolean };
type Spot = { id: number; title: string; column: number; start: number; length: number };

const snap = (minutes: number) => Math.round(minutes / DRAG_MINUTES) * DRAG_MINUTES;

/** Any task with a time moves (a 24-hour one and one past midnight too); a task without a time is placed when it is one day */
function draggable(event: CalendarEvent): boolean {
  if (!event.all_day) return true;
  return sameDay(new Date(event.start_at), new Date(new Date(event.end_at).getTime() - 1));
}

/** Blocks with their place in one day: overlapping tasks share the width in lanes */
function place(events: CalendarEvent[], day: Date): Placed[] {
  const dayStart = startOfDay(day).getTime();
  const spans = events
    .map((event) => {
      const start = (Math.max(new Date(event.start_at).getTime(), dayStart) - dayStart) / 60_000;
      const end = (Math.min(new Date(event.end_at).getTime(), dayStart + 24 * 3600_000) - dayStart) / 60_000;
      return { event, start, end: Math.max(end, start + 15) };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const placed: Placed[] = [];
  let group: Placed[] = [];
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
      top: (span.start / 60) * HOUR_PX,
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

export function TimeGrid({
  days,
  events,
  onOpenDay,
  onPickTime,
  onMove,
}: {
  days: Date[];
  events: CalendarEvent[];
  onOpenDay?: (day: Date) => void;
  /** `minutes` from midnight, on a whole or half hour */
  onPickTime?: (day: Date, minutes: number) => void;
  /** A new time for the task (a task without a time gets one) */
  onMove?: (event: CalendarEvent, start: Date, end: Date) => void;
}) {
  const now = useNow();
  const hoursRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  // The click that ends a drag must not open the task
  const dragged = useRef(false);
  const [spot, setSpot] = useState<Spot | null>(null);

  const spotOf = (current: Drag, pointer: PointerEvent): Spot | null => {
    const box = hoursRef.current?.getBoundingClientRect();
    const width = box ? (box.width - GUTTER_PX) / days.length : 1;
    const shift = ((pointer.clientY - current.y) / HOUR_PX) * 60;
    const spot = { id: current.event.id, title: current.event.title, column: current.column, start: current.start, length: current.length };
    const end = current.start + current.length;
    if (current.mode === "place") {
      // Over the row of tasks without a time nothing is placed yet
      if (!box || pointer.clientY < box.top) return null;
      const column = clamp(Math.floor((pointer.clientX - box.left - GUTTER_PX) / width), 0, days.length - 1);
      const start = clamp(snap(((pointer.clientY - box.top) / HOUR_PX) * 60 - DRAG_MINUTES), 0, DAY_MINUTES - DRAG_MINUTES);
      return { ...spot, column, start };
    }
    if (current.mode === "top") {
      const start = clamp(snap(current.start + shift), Math.min(0, current.start), end - DRAG_MINUTES);
      return { ...spot, start, length: end - start };
    }
    if (current.mode === "bottom") {
      const last = clamp(snap(end + shift), current.start + DRAG_MINUTES, Math.max(DAY_MINUTES, end));
      return { ...spot, length: last - current.start };
    }
    const column = clamp(current.column + Math.round((pointer.clientX - current.x) / width), 0, days.length - 1);
    // A long task may run past midnight: only a part of it has to stay on this day
    const start = clamp(snap(current.start + shift), -(current.length - DRAG_MINUTES), DAY_MINUTES - DRAG_MINUTES);
    return { ...spot, column, start };
  };

  const startDrag = (pointer: PointerEvent<HTMLElement>, event: CalendarEvent, column: number, mode: Mode = "move") => {
    // A finger scrolls the grid; dragging is for the mouse and the pen
    if (!onMove || pointer.button !== 0 || pointer.pointerType === "touch" || !draggable(event)) return;
    // An edge is part of the task: the task itself must not start a move as well
    if (mode !== "move") pointer.stopPropagation();
    const start = new Date(event.start_at);
    const dayStart = startOfDay(days[column]).getTime();
    drag.current = {
      mode: event.all_day ? "place" : mode,
      event,
      column,
      start: event.all_day ? 0 : Math.round((start.getTime() - dayStart) / 60_000),
      length: event.all_day ? PLACED_MINUTES : Math.round((new Date(event.end_at).getTime() - start.getTime()) / 60_000),
      x: pointer.clientX,
      y: pointer.clientY,
      moved: false,
    };
    // The task's element follows the pointer, also when one of its edges was taken
    const owner = (pointer.currentTarget.closest("[data-task]") as HTMLElement | null) ?? pointer.currentTarget;
    owner.setPointerCapture(pointer.pointerId);
  };

  const moveDrag = (pointer: PointerEvent) => {
    const current = drag.current;
    if (!current) return;
    if (!current.moved && Math.hypot(pointer.clientX - current.x, pointer.clientY - current.y) < DRAG_THRESHOLD_PX) return;
    current.moved = true;
    setSpot(spotOf(current, pointer));
  };

  const endDrag = (pointer: PointerEvent) => {
    const current = drag.current;
    drag.current = null;
    setSpot(null);
    if (!current?.moved) return;
    dragged.current = true;
    const target = spotOf(current, pointer);
    if (!target) return;
    if (current.mode !== "place" && target.column === current.column && target.start === current.start && target.length === current.length) return;
    const day = days[target.column];
    // Minutes below 0 or past 24 hours fall on the day before or after
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, target.start);
    onMove?.(current.event, start, new Date(start.getTime() + target.length * 60_000));
  };

  const cancelDrag = () => {
    drag.current = null;
    setSpot(null);
  };
  // The empty half hour under the pointer: a hint where a click puts the new task
  const [hovered, setHovered] = useState<{ column: number; minutes: number } | null>(null);
  // Only the column itself is an empty spot: a click on a task opens the task
  const slotAt = (mouse: MouseEvent<HTMLDivElement>) =>
    mouse.target === mouse.currentTarget
      ? clamp(Math.floor((mouse.clientY - mouse.currentTarget.getBoundingClientRect().top) / SLOT_PX), 0, DAY_MINUTES / SLOT_MINUTES - 1) * SLOT_MINUTES
      : null;
  const { byId: tagsById } = useTags();
  const scrollRef = useRef<HTMLDivElement>(null);
  const multi = days.length > 1;

  const columns = useMemo(
    () =>
      days.map((day) => {
        const own = events.filter((event) => occursOn(event, day));
        return {
          day,
          allDay: own.filter((event) => event.all_day),
          placed: place(own.filter((event) => !event.all_day), day),
        };
      }),
    [days, events]
  );
  const hasAllDay = columns.some((column) => column.allDay.length > 0);
  const todayIndex = days.findIndex((day) => sameDay(day, now));
  const nowTop = (minutesOf(now) / 60) * HOUR_PX;

  // Opened at the current time if today is on screen, otherwise at the first task (or the start of a working day)
  const firstTop = Math.min(8 * HOUR_PX, ...columns.flatMap((column) => column.placed.map((item) => item.top)));
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    box.scrollTop = Math.max(0, todayIndex >= 0 ? nowTop - box.clientHeight / 3 : firstTop - HOUR_PX / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days[0]?.getTime(), days.length]);

  const template = { gridTemplateColumns: `${GUTTER_PX}px repeat(${days.length}, minmax(0, 1fr))` };
  const STICKY_BG = "bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl";

  return (
    <div
      ref={scrollRef}
      className="relative max-h-[70vh] overflow-auto overscroll-contain rounded-xl"
      role="grid"
      aria-label={tr("Задачи по часам", "Tasks by the hour")}
    >
      {/* A week keeps readable columns on a phone: it scrolls sideways instead of squeezing */}
      <div className={cn(multi && "min-w-[640px]")}>
        {(multi || hasAllDay) && (
          <div className={cn("sticky top-0 z-20 border-b border-gray-500/10 dark:border-white/[0.06]", STICKY_BG)}>
            {multi && (
              <div className="grid" style={template} role="row">
                <span />
                {days.map((day, index) => {
                  const isToday = index === todayIndex;
                  return (
                    <button
                      key={day.getTime()}
                      type="button"
                      role="columnheader"
                      onClick={() => onOpenDay?.(day)}
                      title={tr("Открыть день", "Open the day")}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-lg hover:bg-gray-500/[0.06] dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <span
                        className={cn(
                          "text-[11px] uppercase tracking-widest",
                          isToday ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {day.toLocaleDateString(LOCALE, { weekday: "short" })}
                      </span>
                      <span
                        className={cn(
                          "w-8 h-8 inline-flex items-center justify-center rounded-full text-base font-semibold tabular-nums",
                          isToday ? "bg-red-500 text-white" : "text-gray-800 dark:text-gray-100"
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {hasAllDay && (
              <div className="grid py-1" style={template} role="row" aria-label={tr("Задачи без времени", "Tasks without a time")}>
                <span className="pr-1.5 pt-1 text-right text-[10px] leading-tight text-gray-400 dark:text-gray-500">
                  {tr("без времени", "no time")}
                </span>
                {columns.map(({ day, allDay }, index) => (
                  <div key={day.getTime()} className="min-w-0 flex flex-col gap-0.5 px-0.5">
                    {allDay.map((event) => {
                      const color = taskColor(event, tagsById);
                      const placeable = !!onMove && draggable(event);
                      return (
                        <Link
                          key={event.id}
                          to={`/events/${event.id}`}
                          title={placeable ? `${event.title} — ${tr("перетащите на нужный час", "drag it onto an hour")}` : event.title}
                          data-task=""
                          draggable={false}
                          onClick={(click) => {
                            if (!dragged.current) return;
                            dragged.current = false;
                            click.preventDefault();
                          }}
                          onPointerDown={(pointer) => startDrag(pointer, event, index)}
                          onPointerMove={moveDrag}
                          onPointerUp={endDrag}
                          onPointerCancel={cancelDrag}
                          className={cn(
                            "block truncate px-1.5 py-0.5 rounded-md text-[11px] leading-[16px]",
                            "bg-sky-500/15 ring-1 ring-sky-400/30 text-sky-950 dark:text-sky-50",
                            "hover:ring-sky-400/60 transition-shadow",
                            placeable && (spot?.id === event.id ? "cursor-grabbing opacity-40" : "cursor-grab"),
                            color.className,
                            event.completed_at && "line-through opacity-50"
                          )}
                          style={color.className ? { borderLeft: "3px solid var(--dot)", ...(color.own ? { background: "var(--tag-bg)" } : {}) } : undefined}
                        >
                          {event.title}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div ref={hoursRef} className={cn("relative grid", spot && "select-none")} style={{ ...template, height: 24 * HOUR_PX }}>
          {/* The hours: a label in the gutter and a line across all days */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute inset-x-0 flex items-start pointer-events-none"
              style={{ top: hour * HOUR_PX }}
            >
              <span
                className="shrink-0 pr-1.5 -translate-y-1.5 text-right text-[11px] tabular-nums text-gray-400 dark:text-gray-500"
                style={{ width: GUTTER_PX }}
              >
                {hour > 0 && `${String(hour).padStart(2, "0")}:00`}
              </span>
              <span className="flex-1 border-t border-gray-500/10 dark:border-white/[0.06]" />
            </div>
          ))}
          {/* Half hours: a fainter dashed line, no label */}
          {HOURS.map((hour) => (
            <span
              key={`half-${hour}`}
              aria-hidden="true"
              className="absolute right-0 border-t border-dashed border-gray-500/[0.07] dark:border-white/[0.04] pointer-events-none"
              style={{ top: hour * HOUR_PX + SLOT_PX, left: GUTTER_PX }}
            />
          ))}

          <span />
          {columns.map(({ day, placed }, index) => (
            <div
              key={day.getTime()}
              role="gridcell"
              className={cn(
                "relative min-w-0",
                onPickTime && "cursor-pointer",
                multi && "border-l border-gray-500/10 dark:border-white/[0.06]",
                multi && index === todayIndex && "bg-red-500/[0.03]"
              )}
              onClick={(mouse) => {
                const minutes = slotAt(mouse);
                if (minutes !== null) onPickTime?.(day, minutes);
              }}
              onMouseMove={(mouse) => {
                const minutes = slotAt(mouse);
                setHovered(minutes === null ? null : { column: index, minutes });
              }}
              onMouseLeave={() => setHovered(null)}
            >
              {onPickTime && hovered?.column === index && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0.5 rounded-md px-1.5 text-[11px] leading-[22px] tabular-nums pointer-events-none bg-sky-500/10 ring-1 ring-sky-400/30 text-sky-700 dark:text-sky-300"
                  style={{ top: (hovered.minutes / 60) * HOUR_PX + 1, height: SLOT_PX - 2 }}
                >
                  + {clockOf(hovered.minutes)}
                </span>
              )}
              {placed.map(({ event, top, height, lane, lanes }) => {
                const start = new Date(event.start_at);
                const end = new Date(event.end_at);
                const color = taskColor(event, tagsById);
                const movable = !!onMove && draggable(event);
                // Stretching by an edge: only an edge that is on this day
                const dayStart = startOfDay(day).getTime();
                const topEdge = movable && start.getTime() >= dayStart;
                const bottomEdge = movable && end.getTime() <= dayStart + DAY_MINUTES * 60_000;
                const edge = "absolute inset-x-0 h-2 z-[2] cursor-ns-resize";
                return (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    title={`${clock(start)}–${clock(end)} ${event.title}`}
                    data-task=""
                    draggable={false}
                    onClick={(click) => {
                      if (!dragged.current) return;
                      dragged.current = false;
                      click.preventDefault();
                    }}
                    onPointerDown={(pointer) => startDrag(pointer, event, index)}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={cancelDrag}
                    className={cn(
                      "absolute z-[1] overflow-hidden rounded-lg px-1.5 py-0.5 leading-tight",
                      multi ? "text-[11px]" : "text-xs",
                      "bg-indigo-500/15 dark:bg-indigo-400/15 ring-1 ring-indigo-400/30 text-gray-900 dark:text-white",
                      "backdrop-blur-sm hover:ring-indigo-400/60 hover:z-[2] transition-shadow",
                      movable && (spot?.id === event.id ? "cursor-grabbing" : "cursor-grab"),
                      color.className,
                      spot?.id === event.id ? "opacity-30" : (event.completed_at || end < now) && "opacity-55",
                      event.completed_at && "line-through"
                    )}
                    style={{
                      top,
                      height,
                      left: `calc(${(lane / lanes) * 100}% + 2px)`,
                      width: `calc(${100 / lanes}% - 4px)`,
                      ...(color.className ? { borderLeft: "3px solid var(--dot)" } : {}),
                      // A colour chosen for the task fills it; a tag only marks the edge
                      ...(color.own ? { background: "var(--tag-bg)" } : {}),
                    }}
                  >
                    {topEdge && (
                      <span
                        aria-hidden="true"
                        className={cn(edge, "top-0")}
                        title={tr("Потяните, чтобы изменить начало", "Drag to change the start")}
                        onPointerDown={(pointer) => startDrag(pointer, event, index, "top")}
                      />
                    )}
                    {bottomEdge && (
                      <span
                        aria-hidden="true"
                        className={cn(edge, "bottom-0")}
                        title={tr("Потяните, чтобы изменить окончание", "Drag to change the end")}
                        onPointerDown={(pointer) => startDrag(pointer, event, index, "bottom")}
                      />
                    )}
                    <span className="block font-medium break-words">{event.title}</span>
                    {height >= 34 && (
                      <span className="block tabular-nums text-gray-500 dark:text-gray-400">
                        {clock(start)}–{clock(end)}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Where the dragged task lands: its new time while the mouse is down */}
              {spot?.column === index && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0.5 z-[3] overflow-hidden rounded-lg px-1.5 py-0.5 leading-tight pointer-events-none",
                    multi ? "text-[11px]" : "text-xs",
                    "bg-sky-500/25 ring-2 ring-sky-400/70 text-gray-900 dark:text-white shadow-lg"
                  )}
                  style={{
                    top: (Math.max(spot.start, 0) / 60) * HOUR_PX,
                    height: Math.max(((Math.min(spot.start + spot.length, DAY_MINUTES) - Math.max(spot.start, 0)) / 60) * HOUR_PX - 2, MIN_BLOCK_PX),
                  }}
                >
                  <span className="block font-medium break-words">{spot.title}</span>
                  <span className="block tabular-nums font-semibold text-sky-700 dark:text-sky-300">
                    {clockOf(wrap(spot.start))}–{clockOf(wrap(spot.start + spot.length))}
                  </span>
                </span>
              )}

              {index === todayIndex && (
                <div
                  className="absolute inset-x-0 z-10 flex items-center pointer-events-none"
                  style={{ top: nowTop }}
                  aria-label={`${tr("Сейчас", "Now")} ${clock(now)}`}
                >
                  <span className="w-2.5 h-2.5 -ml-[5px] -my-[4px] rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]" />
                  <span className="flex-1 h-0.5 bg-red-500" />
                </div>
              )}
            </div>
          ))}

          {/* The current time in the gutter, over the hour label */}
          {todayIndex >= 0 && (
            <span
              className="absolute left-0 z-10 pr-1.5 -translate-y-1/2 text-right text-[10px] font-semibold tabular-nums text-red-600 dark:text-red-400 pointer-events-none"
              style={{ top: nowTop, width: GUTTER_PX }}
            >
              <span className={cn("px-0.5 rounded", "bg-white/90 dark:bg-gray-900/90")}>{clock(now)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
