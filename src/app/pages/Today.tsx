// src/pages/TodayPage.tsx
import { useCallback, useState } from "react";
import { api } from "../api/client";
import type { CalendarEvent, Recommendation, Stats } from "../api/types";
import { useUser } from "../auth";
import { EventList } from "../components/events";
import { Icon } from "../components/icons";
import { RecommendationList } from "../components/recommendations";
import {
  Button,
  Empty,
  ErrorNote,
  Loading,
  PageHeader,
  useErrorToast,
  useToast,
} from "../components/ui";
import {
  addDays,
  dayKey,
  dayTitle,
  errorText,
  eventTimeRange,
  formatWeekday,
  occursOn,
  parseDayKey,
  plural,
  startOfDay,
} from "../lib/format";
import { notifyTasksChanged, useAsync, useTasksChanged } from "../lib/hooks";
import { Link, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { GlassCard, GLASS_BODY_FLAT } from "@/components/dashboard/glass";

const GLASS_BODY = GLASS_BODY_FLAT;

const LOOK_BACK_DAYS = 7;
const EVENING_HOUR = 18;

const PAGE = "relative max-w-5xl mx-auto pt-[1.5vh]";

function greeting(hour: number) {
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

const movable = (event: CalendarEvent) =>
  event.all_day && !event.completed_at && !event.series_id && !event.is_fixed;

/* ─── TodayPage ─────────────────────────────────────────── */

export function TodayPage() {
  useTitle("Сегодня");
  const user = useUser();
  const now = new Date();
  const today = startOfDay(now);

  const events = useAsync(
    () =>
      api.events.list({
        start: addDays(today, -LOOK_BACK_DAYS).toISOString(),
        end: addDays(today, 1).toISOString(),
        limit: 500,
      }),
    [today.getTime()]
  );
  const stats = useAsync(() => api.stats(7), []);
  const recommendations = useAsync(() => loadRecommendations(user.id), [user.id]);
  const telegram = useAsync(() => api.telegram.status(), []);

  const reloadAll = useCallback(() => {
    events.reload();
    stats.reload();
  }, [events.reload, stats.reload]);
  useTasksChanged(reloadAll);

  const todays = (events.data ?? []).filter((event) => occursOn(event, today));
  const timed = todays.filter((event) => !event.all_day);
  const untimed = todays.filter((event) => event.all_day);
  const overdue = (events.data ?? []).filter(
    (event) => movable(event) && new Date(event.end_at) <= today
  );
  const leftToday =
    now.getHours() >= EVENING_HOUR ? untimed.filter(movable) : [];
  const next =
    timed.find(
      (event) => !event.completed_at && new Date(event.end_at) > now
    ) ?? null;

  return (
    <div className="relative max-w-3xl mx-auto pt-[1.5vh]">
    <div className={PAGE}>
      <PageHeader
        title={
          <span className="first-letter:uppercase">
            {dayTitle(now).replace(/^Сегодня,?\s*/i, "")}
          </span>
        }
        subtitle={`${greeting(now.getHours())}${user.name ? `, ${user.name}` : ""}`}
      />

      <Recommendations items={recommendations.data} userId={user.id} />

      {events.error && (
        <div className="mb-4">
          <ErrorNote message={events.error} onRetry={events.reload} />
        </div>
      )}

      <MoveSuggestion
        overdue={overdue}
        leftToday={leftToday}
        userId={user.id}
      />

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
        {/* ─── Задачи на сегодня ─────────────────── */}
        <GlassCard
          title={
            todays.length
              ? `Задачи · ${todays.filter((event) => event.completed_at).length}/${
                  todays.length
                }`
              : "Задачи"
          }
          actions={
            <Link
              to={`/events/new?day=${dayKey(today)}`}
              className={cn(
                "relative inline-flex items-center gap-1.5 overflow-hidden",
                "px-3 h-8 rounded-xl text-xs font-medium",
                GLASS_BODY,
                "text-gray-700 dark:text-gray-300",
                "transition-transform duration-200 hover:-translate-y-0.5"
              )}
            >
              <Icon name="plus" size={14} className="relative" />
              <span className="relative">Добавить</span>
            </Link>
          }
        >
          {events.loading && !events.data ? (
            <Loading />
          ) : todays.length ? (
            <div className="space-y-4">
              {next && <NextUp event={next} now={now} />}

              {timed.length > 0 && <EventList events={timed} />}

              {untimed.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Без времени
                  </h3>
                  <EventList events={untimed} />
                </div>
              )}
            </div>
          ) : (
            <Empty icon="today" title="На сегодня ничего">
              Свободный день — или самое время что-нибудь запланировать.
            </Empty>
          )}
        </GlassCard>

        {/* ─── Правая колонка ───────────────────── */}
        <div className="space-y-6">
          <GlassCard
            title="Прогресс"
            actions={
              <Link
                to="/tasks"
                className={cn(
                  "relative inline-flex items-center gap-1.5 overflow-hidden",
                  "px-3 h-8 rounded-xl text-xs font-medium",
                  GLASS_BODY,
                  "text-gray-700 dark:text-gray-300",
                  "transition-transform duration-200 hover:-translate-y-0.5"
                )}
              >
                Задачи
              </Link>
            }
          >
            {stats.data ? <Progress stats={stats.data} /> : <Loading />}
          </GlassCard>

          {telegram.data && !telegram.data.linked && (
            <GlassCard>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
                    "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-3xl",
                    "ring-1 ring-white/30 dark:ring-white/10",
                    "text-sky-600 dark:text-sky-300"
                  )}
                >
                  <Icon name="bell" size={16} className="relative" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Telegram
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Напоминания, план утром, итоги дня вечером и дедлайны.
                  </p>
                  <Link
                    to="/account#telegram"
                    className={cn(
                      "mt-2 inline-flex items-center gap-1.5 overflow-hidden",
                      "px-3 h-8 rounded-xl text-xs font-medium",
                      GLASS_BODY,
                      "text-gray-700 dark:text-gray-300",
                      "transition-transform duration-200 hover:-translate-y-0.5"
                    )}
                  >
                    Подключить
                  </Link>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

/* ─── MoveSuggestion ────────────────────────────────────── */

const dismissedKey = (userId: number) => `dayla-dismissed-leftovers:${userId}`;

function loadDismissed(userId: number): number[] {
  try {
    const raw = localStorage.getItem(dismissedKey(userId));
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function saveDismissed(userId: number, ids: number[]) {
  try {
    localStorage.setItem(dismissedKey(userId), JSON.stringify(ids.slice(-500)));
  } catch {
    // без хранилища предложение просто покажется снова
  }
}

function MoveSuggestion({
  overdue: allOverdue,
  leftToday: allLeftToday,
  userId,
}: {
  overdue: CalendarEvent[];
  leftToday: CalendarEvent[];
  userId: number;
}) {
  const [busy, setBusy] = useState<"today" | "tomorrow" | "done" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(() => loadDismissed(userId));
  const toast = useToast();
  const reportError = useErrorToast();

  const overdue = allOverdue.filter((event) => !dismissed.includes(event.id));
  const leftToday = allLeftToday.filter((event) => !dismissed.includes(event.id));
  const items = [...overdue, ...leftToday];
  const today = startOfDay(new Date());

  if (!items.length) return null;

  const move = async (target: "today" | "tomorrow") => {
    const moving = target === "today" ? overdue : items;
    setBusy(target);
    try {
      const { moved } = await api.events.move(
        moving.map((event) => event.id),
        dayKey(target === "today" ? today : addDays(today, 1))
      );
      toast(`Перенесено: ${moved}`);
      notifyTasksChanged();
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const markAll = async () => {
    setBusy("done");
    try {
      await Promise.all(items.map((event) => api.events.complete(event.id, true)));
      toast(`Отмечено выполненными: ${items.length}`);
      notifyTasksChanged();
    } catch (error) {
      reportError(errorText(error));
      notifyTasksChanged();
    } finally {
      setBusy(null);
    }
  };

  const dismiss = () => {
    const next = [...dismissed, ...items.map((event) => event.id)];
    saveDismissed(userId, next);
    setDismissed(next);
    toast("Хорошо, не напоминаю о них. Они остались в «Задачах».");
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 mb-6",
        GLASS_BODY
      )}
      aria-label="Незавершённые задачи"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
            "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-3xl",
            "ring-1 ring-white/30 dark:ring-white/10",
            "text-amber-600 dark:text-amber-300"
          )}
        >
          <Icon name="clock" size={16} className="relative" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {overdue.length
              ? `Не завершено с прошлых дней: ${overdue.length}`
              : `Не успеваете? Осталось задач: ${leftToday.length}`}
          </p>

          {expanded ? (
            <>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Отметьте то, что уже сделано, — остальное можно перенести.
              </p>
              <div className="mt-3">
                <EventList events={items} showDate />
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {items
                .slice(0, 4)
                .map((event) => event.title)
                .join(" · ")}
              {items.length > 4 ? (
                <>
                  {" "}
                  <button
                    type="button"
                    className="text-sky-700 dark:text-sky-300 hover:underline"
                    onClick={() => setExpanded(true)}
                  >
                    и ещё {items.length - 4} — показать все
                  </button>
                </>
              ) : (
                <>
                  {" "}
                  <button
                    type="button"
                    className="text-sky-700 dark:text-sky-300 hover:underline"
                    onClick={() => setExpanded(true)}
                  >
                    открыть список
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {overdue.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            busy={busy === "today"}
            onClick={() => move("today")}
          >
            На сегодня
          </Button>
        )}
        <Button
          size="sm"
          variant="primary"
          busy={busy === "tomorrow"}
          onClick={() => move("tomorrow")}
        >
          На завтра
        </Button>
        {expanded && (
          <Button
            size="sm"
            variant="secondary"
            icon="check"
            busy={busy === "done"}
            onClick={markAll}
          >
            Всё сделано
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={dismiss}
          title="Скрыть: задачи останутся в разделе «Задачи»"
        >
          Не надо
        </Button>
        {expanded && (
          <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>
            Свернуть
          </Button>
        )}
      </div>
    </section>
  );
}

/* ─── Recommendations ───────────────────────────────────── */

const recommendationsKey = (userId: number) => `dayla-recommendations:${userId}`;

function loadRecommendations(userId: number): Promise<Recommendation[]> {
  return api.recommendations().then((items) => {
    try {
      sessionStorage.setItem(recommendationsKey(userId), JSON.stringify(items));
    } catch {
      // storage unavailable — only the instant display is lost
    }
    return items;
  });
}

function storedRecommendations(userId: number): Recommendation[] | undefined {
  try {
    const raw = sessionStorage.getItem(recommendationsKey(userId));
    return raw ? (JSON.parse(raw) as Recommendation[]) : undefined;
  } catch {
    return undefined;
  }
}

function Recommendations({
  items: loaded,
  userId,
}: {
  items: Recommendation[] | undefined;
  userId: number;
}) {
  const items = loaded ?? storedRecommendations(userId);

  return (
    <div className="mb-6">
      <GlassCard>
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
              "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-3xl",
              "ring-1 ring-white/30 dark:ring-white/10",
              "text-sky-600 dark:text-sky-300"
            )}
          >
            <Icon name="assistant" size={16} className="relative" />
          </span>
          <div className="min-w-0 flex-1">
            <RecommendationList items={items?.slice(0, 2)} />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ─── Progress ─────────────────────────────────────────── */

function Progress({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base">
          <strong className="font-semibold">{stats.today.done}</strong> из{" "}
          {stats.today.total}{" "}
          <span className="text-gray-500 dark:text-gray-400">
            выполнено сегодня
          </span>
        </p>
        {stats.streak > 0 && (
          <span
            title={`Дней подряд, когда выполнено всё запланированное. Лучшая серия: ${stats.best_streak}`}
            className={cn(
              "relative inline-flex items-center gap-1.5 overflow-hidden",
              "px-2.5 h-7 rounded-full text-xs font-medium",
              GLASS_BODY,
              "text-amber-700 dark:text-amber-300"
            )}
          >
            <Icon name="fire" size={13} className="relative" />
            <span className="relative tabular-nums">
              {stats.streak} {plural(stats.streak, "день", "дня", "дней")}
            </span>
          </span>
        )}
      </div>

      <div
        className={cn(
          "relative h-2 rounded-full overflow-hidden",
          "bg-white/[0.06] dark:bg-white/[0.02]",
          "ring-1 ring-white/20 dark:ring-white/10"
        )}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-blue-500"
          style={{ width: `${stats.today.percent}%` }}
        />
      </div>

      <div className="flex items-end gap-1.5 h-16" aria-label="Выполнение за 7 дней">
        {stats.days.map((day) => (
          <div
            key={day.date}
            title={`${day.done} из ${day.total}`}
            className="flex-1 flex flex-col items-center gap-1 h-full"
          >
            <span
              className={cn(
                "relative flex-1 w-full rounded-md overflow-hidden",
                "bg-white/[0.06] dark:bg-white/[0.02]",
                "ring-1 ring-white/20 dark:ring-white/10"
              )}
            >
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 rounded-md",
                  day.total && day.done === day.total
                    ? "bg-emerald-500/60"
                    : "bg-sky-500/50"
                )}
                style={{ height: `${day.total ? Math.max(day.percent, 6) : 0}%` }}
              />
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {formatWeekday(parseDayKey(day.date) ?? new Date(), "short")}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        За неделю выполнено {stats.done} из {stats.total}
        {stats.best_streak > stats.streak
          ? ` · лучшая серия ${stats.best_streak} дн.`
          : ""}
        {stats.streak === 0
          ? " · выполните все задачи дня, чтобы начать серию"
          : ""}
      </p>
    </div>
  );
}

/* ─── NextUp ───────────────────────────────────────────── */

function NextUp({ event, now }: { event: CalendarEvent; now: Date }) {
  const start = new Date(event.start_at);
  const minutes = Math.round((start.getTime() - now.getTime()) / 60_000);
  const label =
    minutes <= 0
      ? "Идёт сейчас"
      : minutes < 60
      ? `Через ${minutes} мин`
      : `Через ${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;

  return (
    <Link
      to={`/events/${event.id}`}
      className={cn(
        "relative flex flex-col gap-1 overflow-hidden",
        "px-4 py-3 rounded-xl",
        "transition-transform duration-200 hover:-translate-y-0.5",
        GLASS_BODY
      )}
    >
      <span className="text-[11px] uppercase tracking-widest font-medium text-sky-700 dark:text-sky-300">
        {label}
      </span>
      <span className="text-base font-medium text-gray-900 dark:text-white truncate">
        {event.title}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
        {eventTimeRange(event)}
        {event.location ? ` · ${event.location}` : ""}
      </span>
    </Link>
  );
}