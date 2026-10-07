import { useCallback, useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { EventList } from "../components/events";
import { TagChip } from "../components/tags";
import { Button, Card, Empty, ErrorNote, Loading, PageHeader, useErrorToast } from "../components/ui";
import { addDays, browserTimezone, dayKey, dayTitle, errorText, parseDayKey, startOfDay, taskBounds } from "../lib/format";
import { notifyTasksChanged, useAsync, useTags, useTasksChanged } from "../lib/hooks";
import { useTitle } from "../router";

const PAST_DAYS = 30;
const AHEAD_DAYS = 90;
const DAY_GROUPS = 7;
type Filter = "all" | "untimed" | "deadline";

/** Все задачи — со временем и без: отсутствие времени — обычное состояние задачи, а не отдельный список. */
export function TasksPage() {
  useTitle("Задачи");
  const today = startOfDay(new Date());
  const [tab, setTab] = useState<"active" | "done">("active");
  const [filter, setFilter] = useState<Filter>("all");
  const [tagId, setTagId] = useState<number | null>(null);
  const { tags } = useTags();
  const events = useAsync(
    () => api.events.list({ start: addDays(today, -PAST_DAYS).toISOString(), end: addDays(today, AHEAD_DAYS).toISOString(), limit: 1000 }),
    [today.getTime()],
  );
  useTasksChanged(useCallback(() => events.reload(), [events.reload]));

  const day = (event: CalendarEvent) => dayKey(new Date(event.start_at));
  const todayKey = dayKey(today);
  const visible = (events.data ?? []).filter(
    (event) =>
      (filter === "all" || (filter === "untimed" ? event.all_day : !!event.deadline_at)) && (tagId === null || event.tag_ids?.includes(tagId)),
  );
  // Прошедшие встречи просто состоялись; просроченными бывают только разовые задачи без времени
  const active = visible.filter((event) => !event.completed_at && (day(event) >= todayKey || (event.all_day && !event.series_id)));
  const groups: { title: string; items: CalendarEvent[]; showDate?: boolean }[] = [
    { title: "Просроченные", items: active.filter((event) => day(event) < todayKey), showDate: true },
  ];
  for (let offset = 0; offset < DAY_GROUPS; offset++) {
    const key = dayKey(addDays(today, offset));
    groups.push({ title: dayTitle(parseDayKey(key) ?? today), items: active.filter((event) => day(event) === key) });
  }
  const laterKey = dayKey(addDays(today, DAY_GROUPS));
  groups.push({ title: "Позже", items: active.filter((event) => day(event) >= laterKey), showDate: true });
  const shown = groups
    .map((group) => ({ ...group, items: [...group.items.filter((event) => event.all_day), ...group.items.filter((event) => !event.all_day)] }))
    .filter((group) => group.items.length);
  const done = visible.filter((event) => event.completed_at).sort((a, b) => b.start_at.localeCompare(a.start_at));

  return (
    <div className="page page-narrow">
      <PageHeader
        title="Задачи"
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

      <div className="filters" role="group" aria-label="Фильтр задач">
        {(
          [
            ["all", "Все"],
            ["untimed", "Без времени"],
            ["deadline", "С дедлайном"],
          ] as const
        ).map(([value, label]) => (
          <button key={value} type="button" className={`chip-toggle ${filter === value ? "active" : ""}`} aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={`tag-filter ${tagId === tag.id ? "active" : ""}`}
            aria-pressed={tagId === tag.id}
            onClick={() => setTagId(tagId === tag.id ? null : tag.id)}
          >
            <TagChip tag={tag} />
          </button>
        ))}
      </div>

      {tab === "active" && <QuickAdd day={todayKey} tagId={tagId} />}
      {events.error && <ErrorNote message={events.error} onRetry={events.reload} />}

      {events.loading && !events.data ? (
        <Loading />
      ) : tab === "active" ? (
        shown.length ? (
          shown.map((group) => (
            <Card key={group.title} title={`${group.title} · ${group.items.length}`}>
              <EventList
                events={group.items}
                showDate={group.showDate}
                extra={(event) => day(event) <= todayKey && event.all_day && !event.is_fixed && <MoveTomorrow event={event} />}
              />
            </Card>
          ))
        ) : (
          <Card>
            <Empty icon="check" title={filter === "all" && tagId === null ? "Задач нет" : "Ничего не найдено"}>
              Добавьте задачу выше или напишите ассистенту: «купить продукты завтра».
            </Empty>
          </Card>
        )
      ) : (
        <Card>{done.length ? <EventList events={done} showDate /> : <Empty icon="check" title="Пока ничего не выполнено" />}</Card>
      )}
    </div>
  );
}

function QuickAdd({ day, tagId }: { day: string; tagId: number | null }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const { start, end } = taskBounds(day, null, null);
      await api.events.create({
        title: title.trim().slice(0, 300),
        start_at: start,
        end_at: end,
        all_day: true,
        timezone: browserTimezone(),
        tag_ids: tagId === null ? [] : [tagId],
      });
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
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Задача на сегодня" aria-label="Задача на сегодня" maxLength={300} />
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
