import { useCallback, useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { EventList } from "../components/events";
import { Button, Card, Empty, ErrorNote, Loading, PageHeader, useErrorToast } from "../components/ui";
import { addDays, browserTimezone, dayKey, errorText, startOfDay, taskBounds } from "../lib/format";
import { notifyTasksChanged, useAsync, useTasksChanged } from "../lib/hooks";
import { useTitle } from "../router";

const PAST_DAYS = 30;
const AHEAD_DAYS = 90;

/** Задачи без времени: просроченные, на сегодня, завтра и позже. */
export function TasksPage() {
  useTitle("Задачи");
  const today = startOfDay(new Date());
  const [tab, setTab] = useState<"active" | "done">("active");
  const events = useAsync(
    () => api.events.list({ start: addDays(today, -PAST_DAYS).toISOString(), end: addDays(today, AHEAD_DAYS).toISOString(), limit: 1000 }),
    [today.getTime()],
  );
  useTasksChanged(useCallback(() => events.reload(), [events.reload]));

  const untimed = (events.data ?? []).filter((event) => event.all_day);
  const day = (event: CalendarEvent) => dayKey(new Date(event.start_at));
  const todayKey = dayKey(today);
  const tomorrowKey = dayKey(addDays(today, 1));
  const active = untimed.filter((event) => !event.completed_at);
  const groups = [
    // Missed days of a recurring task are not overdue — only one-off tasks are
    { title: "Просроченные", items: active.filter((event) => day(event) < todayKey && !event.series_id), showDate: true },
    { title: "Сегодня", items: active.filter((event) => day(event) === todayKey) },
    { title: "Завтра", items: active.filter((event) => day(event) === tomorrowKey) },
    { title: "Позже", items: active.filter((event) => day(event) > tomorrowKey), showDate: true },
  ].filter((group) => group.items.length);
  const done = untimed.filter((event) => event.completed_at).sort((a, b) => b.start_at.localeCompare(a.start_at));

  return (
    <div className="page page-narrow">
      <PageHeader
        title="Задачи"
        subtitle="Дела без конкретного времени"
        actions={
          <div className="segmented" role="tablist" aria-label="Список">
            <button role="tab" aria-selected={tab === "active"} className={tab === "active" ? "active" : ""} onClick={() => setTab("active")}>
              Активные
            </button>
            <button role="tab" aria-selected={tab === "done"} className={tab === "done" ? "active" : ""} onClick={() => setTab("done")}>
              Выполненные
            </button>
          </div>
        }
      />

      {tab === "active" && <QuickAdd day={todayKey} />}
      {events.error && <ErrorNote message={events.error} onRetry={events.reload} />}

      {events.loading && !events.data ? (
        <Loading />
      ) : tab === "active" ? (
        groups.length ? (
          groups.map((group) => (
            <Card key={group.title} title={`${group.title} · ${group.items.length}`}>
              <EventList
                events={group.items}
                showDate={group.showDate}
                extra={(event) => day(event) <= todayKey && <MoveTomorrow event={event} />}
              />
            </Card>
          ))
        ) : (
          <Card>
            <Empty icon="check" title="Задач без времени нет">
              Добавьте их выше или напишите ассистенту: «купить продукты завтра».
            </Empty>
          </Card>
        )
      ) : (
        <Card>
          {done.length ? <EventList events={done} showDate /> : <Empty icon="check" title="Пока ничего не выполнено" />}
        </Card>
      )}
    </div>
  );
}

function QuickAdd({ day }: { day: string }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const { start, end } = taskBounds(day, null, null);
      await api.events.create({ title: title.trim().slice(0, 300), start_at: start, end_at: end, all_day: true, timezone: browserTimezone() });
      setTitle("");
      notifyTasksChanged();
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="quick-ask" onSubmit={submit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Новая задача на сегодня, например «купить продукты»" aria-label="Задача без времени" maxLength={300} />
      <Button type="submit" variant="primary" size="sm" icon="plus" aria-label="Добавить задачу" busy={busy} disabled={!title.trim()} />
    </form>
  );
}

function MoveTomorrow({ event }: { event: CalendarEvent }) {
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();
  const move = async () => {
    setBusy(true);
    try {
      await api.events.move([event.id], dayKey(addDays(new Date(), 1)));
      notifyTasksChanged();
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button variant="ghost" size="sm" busy={busy} onClick={move} aria-label={`Перенести «${event.title}» на завтра`}>
      На завтра
    </Button>
  );
}
