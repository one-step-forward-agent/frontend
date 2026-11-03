// The year of ticked tasks as a grid of days, one column a week: all tasks, or the tasks of one tag.
// The server counts them (GET /api/stats/activity); the grid only lays the days out from Monday.

import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAsync, useTags } from "../lib/hooks";
import { ErrorNote, Loading } from "./ui";
import { cn } from "@/utils/cn";
import { LOCALE, pluralWord, tr } from "@/i18n";

const LEVELS = [
  "bg-gray-200/70 dark:bg-white/[0.06]",
  "bg-emerald-300/70 dark:bg-emerald-900",
  "bg-emerald-400/80 dark:bg-emerald-700",
  "bg-emerald-500 dark:bg-emerald-500",
  "bg-emerald-600 dark:bg-emerald-400",
];

const tasksWord = (count: number) => pluralWord(count, ["задача", "задачи", "задач"], ["task", "tasks"]);

// Relative to the busiest day, so a quiet year still shows its better days
function level(done: number, max: number): number {
  if (!done || !max) return 0;
  return Math.min(4, Math.ceil((done / max) * 4));
}

export function ActivityGrid() {
  const [tagId, setTagId] = useState<number | null>(null);
  const activity = useAsync(() => api.activity(tagId ?? undefined), [tagId]);
  const { byId } = useTags();
  const scroller = useRef<HTMLDivElement>(null);

  // The year is wider than a narrow card: open on the latest weeks, like GitHub, not on last year's
  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [activity.data]);

  if (activity.error) return <ErrorNote message={activity.error} onRetry={activity.reload} />;
  if (!activity.data) return <Loading />;

  const { days, total } = activity.data;
  const tags = activity.data.tags.filter((item) => byId.has(item.id));
  const max = Math.max(0, ...days.map((day) => day.done));
  // Monday first: empty cells before the first day so every column is one week
  const lead = (new Date(`${days[0].date}T12:00:00`).getDay() + 6) % 7;
  const cells: ({ date: string; done: number } | null)[] = [...Array(lead).fill(null), ...days];
  const weeks: (typeof cells)[] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));

  const dayLabel = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={tr("Показать задачи", "Show tasks")}>
          <button type="button" className={cn("chip-toggle", tagId === null && "active")} aria-pressed={tagId === null} onClick={() => setTagId(null)}>
            {tr("Все задачи", "All tasks")}
          </button>
          {tags.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("chip-toggle", tagId === item.id && "active")}
              aria-pressed={tagId === item.id}
              onClick={() => setTagId(item.id)}
            >
              #{byId.get(item.id)!.name} <span className="opacity-60 tabular-nums">{item.done}</span>
            </button>
          ))}
        </div>
      )}

      <div ref={scroller} className="overflow-x-auto pb-1">
        <div className="inline-flex gap-[3px]" role="img" aria-label={tr(`За год выполнено ${total} ${tasksWord(total)}`, `${total} ${tasksWord(total)} done in a year`)}>
          {weeks.map((week, column) => (
            <div key={column} className="flex flex-col gap-[3px]">
              {week.map((day, row) =>
                day ? (
                  <span
                    key={day.date}
                    className={cn("block size-[11px] rounded-[3px]", LEVELS[level(day.done, max)])}
                    title={`${dayLabel(day.date)}: ${day.done} ${tasksWord(day.done)}`}
                  />
                ) : (
                  <span key={`empty-${row}`} className="block size-[11px]" />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="tabular-nums">
          {tr(`${total} ${tasksWord(total)} за год`, `${total} ${tasksWord(total)} in the last year`)}
        </span>
        <span className="flex items-center gap-1" aria-hidden="true">
          {tr("меньше", "less")}
          {LEVELS.map((color) => (
            <span key={color} className={cn("block size-[11px] rounded-[3px]", color)} />
          ))}
          {tr("больше", "more")}
        </span>
      </div>

      {!tags.length && (
        <p className="muted small">
          {tr(
            "Ставьте задачам теги — например, «#Спорт», — и здесь можно будет посмотреть активность по каждому.",
            "Tag your tasks, like “#Sport”, to see the activity of each tag here."
          )}
        </p>
      )}
    </div>
  );
}
