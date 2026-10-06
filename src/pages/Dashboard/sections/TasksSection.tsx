// src/pages/Dashboard/sections/TasksSection.tsx — задачи без времени
import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { createEvent, type DaylaEvent } from "@/api/dayla";
import { useTasksStore } from "@/store/tasksStore";
import { addDays, localTimezone, relativeDay, startOfDay, taskBounds, toISODate } from "@/utils/dates";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { TaskItem } from "../components/TaskItem";
import { useEvents } from "../components/useEvents";

const PAST_DAYS = 30;
const AHEAD_DAYS = 90;

export const TasksSection: React.FC = () => {
  const [tab, setTab] = React.useState<"active" | "archive">("active");
  const [searchParams, setSearchParams] = useSearchParams();
  const { openNew, changed } = useTasksStore();
  const today = startOfDay(new Date());
  const { events, loading, error } = useEvents(addDays(today, -PAST_DAYS), addDays(today, AHEAD_DAYS));
  const [title, setTitle] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  // Старые ссылки «Добавить задачу» вели сюда с ?new=1
  React.useEffect(() => {
    if (searchParams.get("new")) {
      openNew(toISODate(today), true);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const untimed = events.filter((event) => event.all_day);
  const todayIso = toISODate(today);
  const tomorrowIso = toISODate(addDays(today, 1));
  const day = (event: DaylaEvent) => toISODate(new Date(event.start_at));
  const active = untimed.filter((event) => !event.completed_at);
  const groups: { title: string; items: DaylaEvent[]; overdue?: boolean }[] = [
    { title: "Просроченные", items: active.filter((event) => day(event) < todayIso), overdue: true },
    { title: "Сегодня", items: active.filter((event) => day(event) === todayIso) },
    { title: "Завтра", items: active.filter((event) => day(event) === tomorrowIso) },
    { title: "Позже", items: active.filter((event) => day(event) > tomorrowIso) },
  ];
  const archive = untimed.filter((event) => event.completed_at).sort((a, b) => b.start_at.localeCompare(a.start_at));

  const quickAdd = async (submit: React.FormEvent) => {
    submit.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const { start, end } = taskBounds(todayIso, null, null);
      await createEvent({ title: title.trim(), start_at: start, end_at: end, all_day: true, timezone: localTimezone() });
      setTitle("");
      changed();
    } catch (failure) {
      setAddError(getErrorMessage(failure));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant={tab === "active" ? "default" : "secondary"} onClick={() => setTab("active")}>
          Активные
        </Button>
        <Button size="sm" variant={tab === "archive" ? "default" : "secondary"} onClick={() => setTab("archive")}>
          Выполненные
        </Button>
      </div>

      {tab === "active" && (
        <form onSubmit={quickAdd} className="flex gap-2">
          <Input placeholder="Новая задача без времени на сегодня…" aria-label="Новая задача" value={title} onChange={(change) => setTitle(change.target.value)} maxLength={300} />
          <Button type="submit" isLoading={adding} aria-label="Добавить задачу без времени">
            <Plus size={16} />
          </Button>
        </form>
      )}
      {addError && <p className="text-sm text-red-600">{addError}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {tab === "active" ? (
        <>
          {groups.filter((group) => group.items.length).map((group) => (
            <Card key={group.title}>
              <CardContent>
                <h2 className={group.overdue ? "text-sm font-medium text-red-600 dark:text-red-400 mb-2" : "text-sm font-medium text-gray-500 dark:text-gray-400 mb-2"}>
                  {group.title} · {group.items.length}
                </h2>
                <div className="space-y-0.5">
                  {group.items.map((event) => (
                    <TaskItem
                      key={event.id}
                      event={event}
                      overdue={group.overdue}
                      meta={group.title === "Позже" || group.overdue ? relativeDay(new Date(event.start_at), today) : undefined}
                      showMoveTomorrow={day(event) <= todayIso}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && active.length === 0 && (
            <Card>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Задач без времени нет. Добавьте их здесь или напишите в чат: «купить продукты завтра».
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent>
            {archive.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Выполненных задач без времени пока нет.</p>}
            <div className="space-y-0.5">
              {archive.map((event) => (
                <TaskItem key={event.id} event={event} meta={relativeDay(new Date(event.start_at), today)} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
