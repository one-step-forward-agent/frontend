// src/pages/TasksPage.tsx
import { useCallback, useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { EventList } from "../components/events";
import {
  Button,
  Empty,
  ErrorNote,
  Loading,
  PageHeader,
  useErrorToast,
} from "../components/ui";
import {
  addDays,
  browserTimezone,
  dayKey,
  dayTitle,
  errorText,
  parseDayKey,
  startOfDay,
  taskBounds,
} from "../lib/format";
import { notifyTasksChanged, useAsync, useTags, useTasksChanged } from "../lib/hooks";
import { useTitle } from "../router";
import { cn } from "@/utils/cn";
import { GlassCard, GLASS_BODY_FLAT } from "@/components/dashboard/glass";

const GLASS_BODY = GLASS_BODY_FLAT;

const PAST_DAYS = 30;
const AHEAD_DAYS = 90;
const DAY_GROUPS = 7;
type Filter = "all" | "untimed" | "deadline";

/* ─── Общие стили ───────────────────────────────────────── */

const PAGE = "relative max-w-3xl mx-auto pt-[1.5vh]";

const SEGMENTED =
  "relative inline-flex items-center gap-1 p-1 rounded-full overflow-hidden " + GLASS_BODY;
const SEGMENTED_TAB =
  "relative px-3.5 h-7 rounded-full text-xs font-medium transition-colors duration-200 outline-none";
const SEGMENTED_TAB_ACTIVE =
  "bg-sky-500/20 text-sky-800 dark:text-sky-100 ring-1 ring-sky-400/40";
const SEGMENTED_TAB_IDLE =
  "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200";

const CHIP =
  "relative inline-flex items-center gap-1.5 overflow-hidden px-3 h-7 rounded-full text-xs font-medium " +
  GLASS_BODY +
  " text-gray-700 dark:text-gray-300 transition-colors";

const CHIP_ACTIVE =
  "bg-sky-500/20 text-sky-800 dark:text-sky-100 ring-1 ring-sky-400/40";

/* ─── TasksPage ─────────────────────────────────────────── */

export function TasksPage() {
  const today = startOfDay(new Date());
  const [tab, setTab] = useState<"active" | "done">("active");
  const [filter, setFilter] = useState<Filter>("all");
  const [tagId, setTagId] = useState<number | null>(null);
  const { tags } = useTags();

  const events = useAsync(
    () =>
      api.events.list({
        start: addDays(today, -PAST_DAYS).toISOString(),
        end: addDays(today, AHEAD_DAYS).toISOString(),
        limit: 1000,
      }),
    [today.getTime()]
  );
  useTasksChanged(useCallback(() => events.reload(), [events.reload]));

  const day = (event: CalendarEvent) => dayKey(new Date(event.start_at));
  const todayKey = dayKey(today);

  const visible = (events.data ?? []).filter(
    (event) =>
      (filter === "all" ||
        (filter === "untimed" ? event.all_day : !!event.deadline_at)) &&
      (tagId === null || event.tag_ids?.includes(tagId))
  );

  const active = visible.filter(
    (event) =>
      !event.completed_at &&
      (day(event) >= todayKey || (event.all_day && !event.series_id))
  );

  const groups: {
    title: string;
    items: CalendarEvent[];
    showDate?: boolean;
  }[] = [
    {
      title: "Просроченные",
      items: active.filter((event) => day(event) < todayKey),
      showDate: true,
    },
  ];

  for (let offset = 0; offset < DAY_GROUPS; offset++) {
    const key = dayKey(addDays(today, offset));
    groups.push({
      title: dayTitle(parseDayKey(key) ?? today),
      items: active.filter((event) => day(event) === key),
    });
  }

  const laterKey = dayKey(addDays(today, DAY_GROUPS));
  groups.push({
    title: "Позже",
    items: active.filter((event) => day(event) >= laterKey),
    showDate: true,
  });

  const shown = groups
    .map((group) => ({
      ...group,
      items: [
        ...group.items.filter((event) => event.all_day),
        ...group.items.filter((event) => !event.all_day),
      ],
    }))
    .filter((group) => group.items.length);

  const done = visible
    .filter((event) => event.completed_at)
    .sort((a, b) => b.start_at.localeCompare(a.start_at));

  return (
    <div className={PAGE}>
      <PageHeader
        title="Задачи"
        actions={
          <div className={SEGMENTED} role="tablist" aria-label="Список">
            {(
              [
                ["active", "Активные"],
                ["done", "Выполненные"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={cn(
                  SEGMENTED_TAB,
                  tab === value ? SEGMENTED_TAB_ACTIVE : SEGMENTED_TAB_IDLE
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {/* ─── Фильтры ─────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-1.5" role="group" aria-label="Фильтр задач">
        {(
          [
            ["all", "Все"],
            ["untimed", "Без времени"],
            ["deadline", "С дедлайном"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={cn(CHIP, filter === value && CHIP_ACTIVE)}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}

        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={cn(CHIP, `tag-${tag.color}`, tagId === tag.id && CHIP_ACTIVE)}
            aria-pressed={tagId === tag.id}
            onClick={() => setTagId(tagId === tag.id ? null : tag.id)}
          >
            {/* One pill per filter: the tag colour is a dot, not a chip inside the chip */}
            <i aria-hidden="true" className="tag-dot" />
            {tag.name}
          </button>
        ))}
      </div>

      {tab === "active" && <QuickAdd day={todayKey} tagId={tagId} />}
      {events.error && (
        <div className="mb-4">
          <ErrorNote message={events.error} onRetry={events.reload} />
        </div>
      )}

      {events.loading && !events.data ? (
        <Loading />
      ) : tab === "active" ? (
        shown.length ? (
          <div className="space-y-6">
            {shown.map((group) => (
              <GlassCard
                key={group.title}
                title={`${group.title} · ${group.items.length}`}
              >
                <EventList
                  events={group.items}
                  showDate={group.showDate}
                  extra={(event) =>
                    day(event) <= todayKey &&
                    event.all_day &&
                    !event.is_fixed && <MoveTomorrow event={event} />
                  }
                />
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard>
            <Empty
              icon="check"
              title={
                filter === "all" && tagId === null
                  ? "Задач нет"
                  : "Ничего не найдено"
              }
            >
              Добавьте задачу выше или напишите ассистенту: «купить продукты
              завтра».
            </Empty>
          </GlassCard>
        )
      ) : (
        <GlassCard>
          {done.length ? (
            <EventList events={done} showDate />
          ) : (
            <Empty icon="check" title="Пока ничего не выполнено" />
          )}
        </GlassCard>
      )}
    </div>
  );
}

/* ─── QuickAdd ─────────────────────────────────────────── */

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
    <form
      onSubmit={submit}
      className={cn(
        "relative overflow-hidden rounded-2xl flex items-center gap-1 p-1.5 mb-6",
        GLASS_BODY
      )}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Задача на сегодня"
        aria-label="Задача на сегодня"
        maxLength={300}
        className={cn(
          "relative flex-1 min-w-0 h-9 px-3 text-sm rounded-lg",
          "bg-transparent border-0 outline-none focus:ring-0 shadow-none",
          "text-gray-900 dark:text-white",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500"
        )}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          boxShadow: "none",
        }}
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        icon="plus"
        aria-label="Добавить задачу"
        busy={busy}
        disabled={!title.trim()}
      />
    </form>
  );
}

/* ─── MoveTomorrow ─────────────────────────────────────── */

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
    <Button
      variant="ghost"
      size="sm"
      icon="forward"
      busy={busy}
      onClick={move}
      className="move-tomorrow"
      aria-label={`Перенести «${event.title}» на завтра`}
      title="На завтра"
    >
      <span className="move-label">На завтра</span>
    </Button>
  );
}