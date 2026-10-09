// src/pages/TasksPage.tsx
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../api/client";
import type { CalendarEvent } from "../api/types";
import { EventList } from "../components/events";
import { Icon } from "../components/icons";
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
  dayKey,
  dayTitle,
  errorText,
  parseDayKey,
  startOfDay,
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
const FILTERS: [Filter, string][] = [
  ["all", "Все задачи"],
  ["untimed", "Без времени"],
  ["deadline", "С дедлайном"],
];

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
    overdue?: boolean;
  }[] = [
    {
      title: "Просроченные",
      items: active.filter((event) => day(event) < todayKey),
      showDate: true,
      overdue: true,
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

      {/* ─── Фильтры: два выпадающих списка, сколько бы ни было сфер ─── */}
      <div className="mb-6 flex flex-wrap gap-1.5" role="group" aria-label="Фильтр задач">
        <Dropdown
          label={filter === "all" ? "Фильтры" : FILTERS.find(([value]) => value === filter)?.[1] ?? "Фильтры"}
          active={filter !== "all"}
        >
          {(close) =>
            FILTERS.map(([value, label]) => (
              <DropdownOption
                key={value}
                selected={filter === value}
                onSelect={() => {
                  setFilter(value);
                  close();
                }}
              >
                {label}
              </DropdownOption>
            ))
          }
        </Dropdown>

        {tags.length > 0 && (
          <Dropdown
            label={tags.find((tag) => tag.id === tagId)?.name ?? "Сферы"}
            active={tagId !== null}
          >
            {(close) => (
              <>
                <DropdownOption
                  selected={tagId === null}
                  onSelect={() => {
                    setTagId(null);
                    close();
                  }}
                >
                  Все сферы
                </DropdownOption>
                {tags.map((tag) => (
                  <DropdownOption
                    key={tag.id}
                    selected={tagId === tag.id}
                    className={`tag-${tag.color}`}
                    onSelect={() => {
                      setTagId(tag.id);
                      close();
                    }}
                  >
                    <i aria-hidden="true" className="tag-dot" />
                    {tag.name}
                  </DropdownOption>
                ))}
              </>
            )}
          </Dropdown>
        )}
      </div>

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
                title={group.title}
                actions={group.overdue && group.items.length > 1 ? <CompleteAll events={group.items} /> : undefined}
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
              Добавьте задачу кнопкой в меню или напишите ассистенту: «купить
              продукты завтра».
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

/* ─── CompleteAll ──────────────────────────────────────── */

// Done but never marked: the usual reason for a long overdue list
function CompleteAll({ events }: { events: CalendarEvent[] }) {
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();

  const complete = async () => {
    setBusy(true);
    try {
      await Promise.all(events.map((event) => api.events.complete(event.id, true)));
    } catch (error) {
      reportError(errorText(error));
    } finally {
      notifyTasksChanged();
      setBusy(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" icon="check" busy={busy} onClick={complete}>
      Всё сделано
    </Button>
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
/* ─── Dropdown ─────────────────────────────────────────── */

// Своё меню, а не портал Radix: список остаётся внутри .fd-app и получает цвета сфер и тему
function Dropdown({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(CHIP, active && CHIP_ACTIVE)}
        onClick={() => setOpen(!open)}
      >
        <span className="max-w-[10rem] truncate">{label}</span>
        <Icon name="right" size={12} className={cn("transition-transform", open ? "-rotate-90" : "rotate-90")} />
      </button>
      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 top-full mt-1.5 z-30 min-w-[11rem] max-h-72 overflow-y-auto p-1 rounded-xl",
            "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
            "ring-1 ring-black/5 dark:ring-white/10 shadow-lg"
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function DropdownOption({
  selected,
  onSelect,
  className,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2 px-2.5 h-8 rounded-lg text-sm text-left",
        "text-gray-700 dark:text-gray-200 hover:bg-gray-500/10",
        selected && "font-medium text-sky-800 dark:text-sky-100",
        className
      )}
    >
      {children}
      {selected && <Icon name="check" size={14} className="ml-auto shrink-0" />}
    </button>
  );
}
