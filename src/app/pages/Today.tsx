import { useCallback, useState } from "react";
import { api } from "../api/client";
import type { CalendarEvent, Recommendation, Stats } from "../api/types";
import { useUser } from "../auth";
import { EventList } from "../components/events";
import { Icon } from "../components/icons";
import { RecommendationList } from "../components/recommendations";
import { Button, Card, Empty, ErrorNote, Loading, PageHeader, useErrorToast, useToast } from "../components/ui";
import { addDays, dayKey, dayTitle, errorText, eventTimeRange, formatWeekday, occursOn, parseDayKey, plural, startOfDay } from "../lib/format";
import { notifyTasksChanged, useAsync, useTasksChanged } from "../lib/hooks";
import { Link, useTitle } from "../router";

const LOOK_BACK_DAYS = 7;
// С этого часа незавершённые задачи дня предлагается перенести на завтра
const EVENING_HOUR = 18;

function greeting(hour: number) {
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

/** Задача, которую можно перенести: разовая, без времени, не выполнена и не помечена «нельзя переносить». */
const movable = (event: CalendarEvent) => event.all_day && !event.completed_at && !event.series_id && !event.is_fixed;

export function TodayPage() {
  useTitle("Сегодня");
  const user = useUser();
  const now = new Date();
  const today = startOfDay(now);
  const events = useAsync(
    () => api.events.list({ start: addDays(today, -LOOK_BACK_DAYS).toISOString(), end: addDays(today, 1).toISOString(), limit: 500 }),
    [today.getTime()],
  );
  const stats = useAsync(() => api.stats(7), []);
  const recommendations = useAsync(() => loadRecommendations(user.id), [user.id]);
  const telegram = useAsync(() => api.telegram.status(), []);
  const reloadAll = useCallback(() => {
    events.reload();
    stats.reload();
  }, [events.reload, stats.reload]);
  useTasksChanged(reloadAll);

  // В списке — только задачи текущего дня; оставшиеся с прошлых дней — отдельным предложением перенести
  const todays = (events.data ?? []).filter((event) => occursOn(event, today));
  const timed = todays.filter((event) => !event.all_day);
  const untimed = todays.filter((event) => event.all_day);
  const overdue = (events.data ?? []).filter((event) => movable(event) && new Date(event.end_at) <= today);
  const leftToday = now.getHours() >= EVENING_HOUR ? untimed.filter(movable) : [];
  const next = timed.find((event) => !event.completed_at && new Date(event.end_at) > now) ?? null;

  return (
    <div className="page">
      <PageHeader title={dayTitle(now)} subtitle={`${greeting(now.getHours())}${user.name ? `, ${user.name}` : ""}`} />

      <Recommendations items={recommendations.data} userId={user.id} />

      {events.error && <ErrorNote message={events.error} onRetry={events.reload} />}

      {(overdue.length > 0 || leftToday.length > 0) && <MoveSuggestion overdue={overdue} leftToday={leftToday} />}

      <div className="grid-2">
        <Card
          title={todays.length ? `Задачи · ${todays.filter((event) => event.completed_at).length}/${todays.length}` : "Задачи"}
          actions={
            <Link to={`/events/new?day=${dayKey(today)}`} className="btn btn-ghost btn-sm">
              <Icon name="plus" size={16} />
              Добавить
            </Link>
          }
        >
          {events.loading && !events.data ? (
            <Loading />
          ) : todays.length ? (
            <>
              {next && <NextUp event={next} now={now} />}
              {timed.length > 0 && <EventList events={timed} />}
              {untimed.length > 0 && (
                <div className="day-group">
                  <h3>Без времени</h3>
                  <EventList events={untimed} />
                </div>
              )}
            </>
          ) : (
            <Empty icon="today" title="На сегодня ничего">
              Свободный день — или самое время что-нибудь запланировать.
            </Empty>
          )}
        </Card>

        <div className="stack">
          <Card title="Прогресс" actions={<Link to="/tasks" className="btn btn-ghost btn-sm">Задачи</Link>}>
            {stats.data ? <Progress stats={stats.data} /> : <Loading />}
          </Card>

          {telegram.data && !telegram.data.linked && (
            <Card className="card-accent">
              <div className="hint-card">
                <Icon name="bell" size={22} />
                <div>
                  <strong>Telegram</strong>
                  <p className="muted">Напоминания, план утром, итоги дня вечером и дедлайны.</p>
                </div>
                <Link to="/account#telegram" className="btn btn-secondary btn-sm">
                  Подключить
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/** Предложение перенести незавершённое: оставшееся с прошлых дней — на сегодня или завтра, вечером — сегодняшнее на завтра. */
function MoveSuggestion({ overdue, leftToday }: { overdue: CalendarEvent[]; leftToday: CalendarEvent[] }) {
  const [busy, setBusy] = useState<"today" | "tomorrow" | null>(null);
  const toast = useToast();
  const reportError = useErrorToast();
  const items = [...overdue, ...leftToday];
  const today = startOfDay(new Date());

  const move = async (target: "today" | "tomorrow") => {
    const moving = target === "today" ? overdue : items;
    setBusy(target);
    try {
      const { moved } = await api.events.move(
        moving.map((event) => event.id),
        dayKey(target === "today" ? today : addDays(today, 1)),
      );
      toast(`Перенесено: ${moved}`);
      notifyTasksChanged();
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="move-suggestion" aria-label="Незавершённые задачи">
      <Icon name="clock" />
      <div className="move-suggestion-body">
        <strong>{overdue.length ? `Не завершено с прошлых дней: ${overdue.length}` : `Не успеваете? Осталось задач: ${leftToday.length}`}</strong>
        <p className="muted small">
          {items
            .slice(0, 4)
            .map((event) => event.title)
            .join(" · ")}
          {items.length > 4 ? ` и ещё ${items.length - 4}` : ""}
        </p>
      </div>
      <div className="button-row">
        {overdue.length > 0 && (
          <Button size="sm" variant="secondary" busy={busy === "today"} onClick={() => move("today")}>
            На сегодня
          </Button>
        )}
        <Button size="sm" variant="primary" busy={busy === "tomorrow"} onClick={() => move("tomorrow")}>
          На завтра
        </Button>
      </div>
    </section>
  );
}

const recommendationsKey = (userId: number) => `dayla-recommendations:${userId}`;

/** Shows the last recommendations at once; the server reuses them until the plan changes. */
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

function Recommendations({ items: loaded, userId }: { items: Recommendation[] | undefined; userId: number }) {
  const items = loaded ?? storedRecommendations(userId);
  return (
    <section className="recommendations" aria-label="Рекомендации Dayla">
      <Icon name="assistant" />
      <RecommendationList items={items?.slice(0, 2)} />
    </section>
  );
}

function Progress({ stats }: { stats: Stats }) {
  return (
    <div className="progress">
      <div className="progress-head">
        <p className="progress-today">
          <strong>{stats.today.done}</strong> из {stats.today.total} <span className="muted">выполнено сегодня</span>
        </p>
        {stats.streak > 0 && (
          <span className="streak-pill" title={`Дней подряд, когда выполнено всё запланированное. Лучшая серия: ${stats.best_streak}`}>
            <Icon name="fire" size={16} /> {stats.streak} {plural(stats.streak, "день", "дня", "дней")}
          </span>
        )}
      </div>
      <div className="progress-track" aria-hidden="true">
        <i style={{ width: `${stats.today.percent}%` }} />
      </div>
      <div className="progress-week" aria-label="Выполнение за 7 дней">
        {stats.days.map((day) => (
          <div key={day.date} title={`${day.done} из ${day.total}`} className={day.total && day.done === day.total ? "complete" : ""}>
            <span className="progress-bar">
              <i style={{ height: `${day.total ? Math.max(day.percent, 6) : 0}%` }} />
            </span>
            <span className="muted small">{formatWeekday(parseDayKey(day.date) ?? new Date(), "short")}</span>
          </div>
        ))}
      </div>
      <p className="muted small">
        За неделю выполнено {stats.done} из {stats.total}
        {stats.best_streak > stats.streak ? ` · лучшая серия ${stats.best_streak} дн.` : ""}
        {stats.streak === 0 ? " · выполните все задачи дня, чтобы начать серию" : ""}
      </p>
    </div>
  );
}

function NextUp({ event, now }: { event: CalendarEvent; now: Date }) {
  const start = new Date(event.start_at);
  const minutes = Math.round((start.getTime() - now.getTime()) / 60_000);
  const label = minutes <= 0 ? "Идёт сейчас" : minutes < 60 ? `Через ${minutes} мин` : `Через ${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
  return (
    <Link to={`/events/${event.id}`} className="next-up">
      <span className="next-up-label">{label}</span>
      <span className="next-up-title">{event.title}</span>
      <span className="muted">
        {eventTimeRange(event)}
        {event.location ? ` · ${event.location}` : ""}
      </span>
    </Link>
  );
}
