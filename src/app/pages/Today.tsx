// src/pages/TodayPage.tsx
import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { TelegramPrompt } from "../components/TelegramPrompt";
import type { CalendarEvent, Recommendation, Stats } from "../api/types";
import { useUser } from "../auth";
import { EventList, EventRow } from "../components/events";
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
  formatTime,
  formatWeekday,
  occursOn,
  parseDayKey,
  startOfDay,
} from "../lib/format";
import { notifyTasksChanged, useAsync, useCalendarSync, useNow, useTasksChanged, useToday } from "../lib/hooks";
import { Link, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { GlassCard, GLASS_BODY_FLAT } from "@/components/dashboard/glass";
import { pluralWord, tr } from "@/i18n";

const GLASS_BODY = GLASS_BODY_FLAT;

const LOOK_BACK_DAYS = 7;
const EVENING_HOUR = 18;

const PAGE = "relative max-w-5xl mx-auto pt-[1.5vh]";

const movable = (event: CalendarEvent) =>
  event.all_day && !event.completed_at && !event.series_id && !event.is_fixed;

// Meetings from other calendars cannot be ticked here: once over, they simply happened
const EXTERNAL_SOURCES = ["google", "apple", "jira", "notion"];

/** A one-off task of the user's from a past day, not ticked — with or without a time. */
const unfinished = (event: CalendarEvent) =>
  !event.completed_at && !event.series_id && !event.is_fixed && !EXTERNAL_SOURCES.includes(event.source);

/* ─── TodayPage ─────────────────────────────────────────── */

const calendarLink = (view: "day" | "week", day: Date) =>
  `/calendar?view=${view}&month=${dayKey(day).slice(0, 7)}&day=${dayKey(day)}`;

export function TodayPage() {
  useTitle(tr("Сегодня", "Today"));
  const user = useUser();
  const now = new Date();
  const today = useToday();

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

  // Tips change with the tasks too: "Незакрытые задачи" goes away once they are done
  const reloadAll = useCallback(() => {
    events.reload();
    stats.reload();
    recommendations.reload();
  }, [events.reload, stats.reload, recommendations.reload]);
  useTasksChanged(reloadAll);

  useCalendarSync();

  const todays = (events.data ?? []).filter((event) => occursOn(event, today));
  const untimed = todays.filter((event) => event.all_day);
  const overdue = (events.data ?? []).filter(
    (event) => unfinished(event) && new Date(event.end_at) <= today
  );
  const leftToday =
    now.getHours() >= EVENING_HOUR ? untimed.filter(movable) : [];

  return (
    <div className="relative max-w-3xl mx-auto pt-[1.5vh]">
    <div className={PAGE}>
      <PageHeader
        title={
          <span className="inline-block first-letter:uppercase">
            {dayTitle(now).replace(/^(Сегодня|Today),?\s*/i, "")}
          </span>
        }
        actions={
          // Tomorrow and this week open in the calendar: the day itself and its week
          <>
            <Link to={calendarLink("day", addDays(now, 1))} className="chip-toggle inline-flex items-center gap-1.5">
              <Icon name="right" size={14} /> {tr("Завтра", "Tomorrow")}
            </Link>
            <Link to={calendarLink("week", now)} className="chip-toggle inline-flex items-center gap-1.5">
              <Icon name="calendar" size={14} /> {tr("Неделя", "Week")}
            </Link>
          </>
        }
      />

      <div className="mb-4">
        <TelegramPrompt place="today" />
      </div>

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
        {/* ─── Задачи дня по времени; по часам — в календаре ─── */}
        <div className="min-w-0">
        <GlassCard
          title={
            todays.length
              ? `${tr("Задачи", "Tasks")} · ${todays.filter((event) => event.completed_at).length}/${todays.length}`
              : tr("Задачи", "Tasks")
          }
          actions={
            <Link to={calendarLink("day", now)} className="text-xs font-medium text-sky-700 dark:text-sky-300 hover:underline">
              {tr("По часам", "By the hour")}
            </Link>
          }
        >
          {events.loading && !events.data ? (
            <Loading />
          ) : todays.length ? (
            <DaySchedule events={todays} />
          ) : (
            <Empty icon="today" title={tr("На сегодня ничего", "Nothing for today")}>
              {tr("Свободный день — или самое время что-нибудь запланировать.", "A free day — or a good time to plan something.")}
            </Empty>
          )}
        </GlassCard>

        <Recommendations items={recommendations.data} userId={user.id} />
        </div>

        {/* ─── Правая колонка ───────────────────── */}
        <div className="space-y-6">
          <GlassCard title={tr("Прогресс", "Progress")}>
            {stats.data ? <Progress stats={stats.data} /> : <Loading />}
          </GlassCard>

        </div>
      </div>
    </div>
  </div>
  );
}

/* ─── DaySchedule ───────────────────────────────────────── */

/** Today's tasks as cards: the timed ones in order of their start with a red line at the current time
 * (between the tasks already begun and the ones still ahead), then the ones without a time. */
function DaySchedule({ events }: { events: CalendarEvent[] }) {
  const now = useNow();
  const timed = events
    .filter((event) => !event.all_day)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const untimed = events.filter((event) => event.all_day);
  const ahead = timed.findIndex((event) => new Date(event.start_at) > now);
  const nowAt = ahead < 0 ? timed.length : ahead;

  const nowLine = (
    <li key="now" className="schedule-now" aria-label={`${tr("Сейчас", "Now")} ${formatTime(now)}`}>
      <span className="schedule-now-dot" />
      <span className="schedule-now-line" />
      <span className="schedule-now-time">{formatTime(now)}</span>
    </li>
  );

  return (
    <div className="space-y-5">
      {timed.length > 0 && (
        <section>
          <h3 className="schedule-heading">{tr("Расписание", "Schedule")}</h3>
          <ul className="event-list is-cards">
            {timed.flatMap((event, index) =>
              index === nowAt ? [nowLine, <EventRow key={event.id} event={event} />] : [<EventRow key={event.id} event={event} />]
            )}
            {nowAt === timed.length && nowLine}
          </ul>
        </section>
      )}
      {untimed.length > 0 && (
        <section>
          <h3 className="schedule-heading">{tr("Без времени", "No time")}</h3>
          <ul className="event-list is-cards">
            {untimed.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        </section>
      )}
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
      toast(`${tr("Перенесено", "Moved")}: ${moved}`);
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
      toast(`${tr("Отмечено выполненными", "Marked done")}: ${items.length}`);
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
    toast(tr("Хорошо, не напоминаю о них. Они остались в «Задачах».", "OK, no more reminders about them. They are still in Tasks."));
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 mb-6",
        GLASS_BODY
      )}
      aria-label={tr("Незавершённые задачи", "Unfinished tasks")}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
            "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-xl",
            "ring-1 ring-white/30 dark:ring-white/10",
            "text-amber-600 dark:text-amber-300"
          )}
        >
          <Icon name="clock" size={16} className="relative" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {overdue.length
              ? `${tr("Не завершено с прошлых дней", "Unfinished from previous days")}: ${overdue.length}`
              : `${tr("Не успеваете? Осталось задач", "Running late? Tasks left")}: ${leftToday.length}`}
          </p>

          {expanded ? (
            <>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {tr(
                  "Отметьте сделанное галочкой — или всё сразу кнопкой «Всё сделано». Остальное можно перенести.",
                  "Tick what you have done — or everything at once with “All done”. The rest can be moved."
                )}
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
                    {tr(`и ещё ${items.length - 4} — показать все`, `and ${items.length - 4} more — show all`)}
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
                    {tr("открыть список", "open the list")}
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant="primary"
          icon="check"
          busy={busy === "done"}
          onClick={markAll}
        >
          {items.length > 1 ? `${tr("Всё сделано", "All done")} (${items.length})` : tr("Сделано", "Done")}
        </Button>
        {overdue.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            busy={busy === "today"}
            onClick={() => move("today")}
          >
            {tr("На сегодня", "To today")}
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          busy={busy === "tomorrow"}
          onClick={() => move("tomorrow")}
        >
          {tr("На завтра", "To tomorrow")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={dismiss}
          title={tr("Скрыть: задачи останутся в разделе «Задачи»", "Hide: the tasks stay in Tasks")}
        >
          {tr("Не надо", "Dismiss")}
        </Button>
        {expanded && (
          <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>
            {tr("Свернуть", "Collapse")}
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
    <div className="mt-6">
      <GlassCard>
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
              "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-xl",
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
      <p className="text-base">
        <strong className="font-semibold">{stats.today.done}</strong> {tr("из", "of")}{" "}
        {stats.today.total}{" "}
        <span className="text-gray-500 dark:text-gray-400">
          {tr("выполнено сегодня", "done today")}
        </span>
      </p>

      <div
        className={cn(
          "relative h-2 rounded-full overflow-hidden",
          "bg-gray-500/10 dark:bg-white/[0.04]",
          "ring-1 ring-gray-500/10 dark:ring-white/10"
        )}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-blue-500"
          style={{ width: `${stats.today.percent}%` }}
        />
      </div>

      {/* The week as bars: deep blue — the whole day done, light — part of it */}
      <div className="flex items-end gap-1.5 h-16" aria-label={tr("Выполнение за 7 дней", "Completion over 7 days")}>
        {stats.days.map((day) => (
          <div
            key={day.date}
            title={`${day.done} ${tr("из", "of")} ${day.total}`}
            className="flex-1 flex flex-col items-center gap-1 h-full"
          >
            <span
              className={cn(
                "relative flex-1 w-full rounded-md overflow-hidden",
                "bg-gray-500/10 dark:bg-white/[0.04]",
                "ring-1 ring-gray-500/10 dark:ring-white/10"
              )}
            >
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 rounded-md",
                  day.total && day.done === day.total
                    ? "bg-blue-500/80"
                    : "bg-sky-400/50"
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

      <Link
        to={`/assistant?q=${encodeURIComponent(tr("Статистика", "Statistics"))}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-300 hover:underline"
      >
        {tr("Подробнее в чате", "More in the chat")} <Icon name="right" size={12} />
      </Link>

      {/* The week's numbers are in the bars above; below them only the streak */}
      {stats.streak > 0 ? (
        <span
          title={`${tr("Дней подряд, когда выполнено всё запланированное. Лучшая серия", "Days in a row with everything planned done. Best streak")}: ${stats.best_streak}`}
          className={cn(
            "relative inline-flex items-center gap-1.5 overflow-hidden",
            "px-2.5 h-7 rounded-full text-xs font-medium",
            GLASS_BODY,
            "text-amber-700 dark:text-amber-300"
          )}
        >
          <Icon name="fire" size={13} className="relative" />
          <span className="relative tabular-nums">
            {stats.streak} {pluralWord(stats.streak, ["день", "дня", "дней"], ["day", "days"])} {tr("подряд", "in a row")}
          </span>
        </span>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {tr("Выполните все задачи дня, чтобы начать серию", "Finish all of a day's tasks to start a streak")}
        </p>
      )}
    </div>
  );
}
