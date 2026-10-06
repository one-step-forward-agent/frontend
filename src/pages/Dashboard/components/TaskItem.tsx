// Строка задачи: отметка выполнения, время, название и быстрые действия
import * as React from "react";
import { ArrowRight, Check, Repeat } from "lucide-react";

import { moveEvents, setCompleted, type DaylaEvent } from "@/api/dayla";
import { useTasksStore } from "@/store/tasksStore";
import { cn } from "@/utils/cn";
import { addDays, formatTime, toISODate } from "@/utils/dates";

interface TaskItemProps {
  event: DaylaEvent;
  meta?: string;
  overdue?: boolean;
  showMoveTomorrow?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ event, meta, overdue, showMoveTomorrow }) => {
  const { openEdit, changed } = useTasksStore();
  const [done, setDone] = React.useState(!!event.completed_at);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => setDone(!!event.completed_at), [event.completed_at]);

  const toggle = async () => {
    setBusy(true);
    setDone(!done);
    try {
      await setCompleted(event.id, !done);
      changed();
    } catch {
      setDone(done);
    } finally {
      setBusy(false);
    }
  };

  const moveTomorrow = async () => {
    setBusy(true);
    try {
      await moveEvents([event.id], toISODate(addDays(new Date(), 1)));
      changed();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-100/70 dark:hover:bg-gray-800/60">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? "Снять отметку" : "Отметить выполненной"}
        disabled={busy}
        onClick={toggle}
        className={cn(
          "shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors",
          done ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 dark:border-gray-600 hover:border-blue-500"
        )}
      >
        {done && <Check size={13} strokeWidth={3} />}
      </button>
      <button type="button" onClick={() => openEdit(event)} className="min-w-0 flex-1 text-left">
        <span className={cn("block text-sm truncate", done && "line-through text-gray-400 dark:text-gray-500")}>
          {!event.all_day && <span className="tabular-nums text-gray-500 dark:text-gray-400 mr-2">{formatTime(event.start_at)}</span>}
          {event.title}
          {event.series_id && <Repeat size={12} className="inline ml-1.5 text-gray-400" aria-label="Повторяется" />}
        </span>
        {meta && <span className={cn("block text-[11px]", overdue ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400")}>{meta}</span>}
      </button>
      {showMoveTomorrow && !done && (
        <button
          type="button"
          onClick={moveTomorrow}
          disabled={busy}
          className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
        >
          На завтра <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
};
