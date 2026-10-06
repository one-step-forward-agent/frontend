import { useCallback } from "react";
import { api } from "../api/client";
import type { CalendarEvent, Recommendation, Stats } from "../api/types";
import { useUser } from "../auth";
import { EventList } from "../components/events";
import { Icon } from "../components/icons";
import { Badge, Card, Empty, ErrorNote, Loading, PageHeader } from "../components/ui";
import { addDays, dayKey, eventTimeRange, formatDate, formatWeekday, occursOn, parseDayKey, startOfDay } from "../lib/format";
import { useAsync, useTasksChanged } from "../lib/hooks";
import { Link, useTitle } from "../router";

function greeting(hour: number) {
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

export function TodayPage() {
  useTitle("Сегодня");
  const user = useUser();
  const now = new Date();
  const today = startOfDay(now);
  // Две недели назад — чтобы не потерялись невыполненные задачи без времени
  const events = useAsync(
    () => api.events.list({ start: addDays(today, -14).toISOString(), end: addDays(today, 1).toISOString(), limit: 500 }),
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

  const todays = (events.data ?? []).filter((event) => occursOn(event, today));
  const timed = todays.filter((event) => !event.all_day);
  const untimed = todays.filter((event) => event.all_day);
  // Overdue = a one-off task without time left from a past day; past meetings simply happened
  const overdue = (events.data ?? []).filter((event) => event.all_day && !event.completed_at && !event.series_id && new Date(event.end_at) <= today);
  const next = timed.find((event) => !event.completed_at && new Date(event.end_at) > now) ?? null;

  return (
    <div className="page">
      <PageHeader
        title={`${greeting(now.getHours())}${user.name ? `, ${user.name}` : ""}`}
        subtitle={formatDate(now, { weekday: "long", day: "numeric", month: "long" })}
      />

      <Recommendations items={recommendations.data} userId={user.id} />

      {events.error && <ErrorNote message={events.error} onRetry={events.reload} />}

      <div className="grid-2">
        <Card title="Сегодня" actions={<Link to={`/events/new?day=${dayKey(today)}`} className="btn btn-ghost btn-sm"><Icon name="plus" size={16} />Добавить</Link>}>
          {events.loading && !events.data ? (
            <Loading />
          ) : todays.length || overdue.length ? (
            <>
              {next && <NextUp event={next} now={now} />}
              {timed.length > 0 && <EventList events={timed} />}
              {(untimed.length > 0 || overdue.length > 0) && (
                <div className="day-group">
                  <h3>Без времени</h3>
                  <EventList events={[...overdue, ...untimed]} extra={(event) => overdue.includes(event) && <Badge tone="bad">просрочено</Badge>} />
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
                  <strong>Напоминания в Telegram</strong>
                  <p className="muted">Подключите бота, чтобы получать напоминания, утренний план и проверку в середине дня.</p>
                </div>
                <Link to="/settings#telegram" className="btn btn-secondary btn-sm">Подключить</Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
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
      <div className="recommendations-list">
        {items === undefined ? (
          <p className="muted">Dayla анализирует ваш день…</p>
        ) : (
          items.slice(0, 2).map((item) => (
            <p key={item.title}>
              <Badge tone={item.kind === "warning" ? "warn" : item.kind === "success" ? "ok" : "accent"}>{item.title}</Badge> {item.text}
            </p>
          ))
        )}
      </div>
      <Link to="/assistant" className="btn btn-secondary btn-sm">
        Обсудить
      </Link>
    </section>
  );
}

function Progress({ stats }: { stats: Stats }) {
  return (
    <div className="progress">
      <p className="progress-today">
        <strong>{stats.today.done}</strong> из {stats.today.total} <span className="muted">выполнено сегодня</span>
      </p>
      <div className="progress-track" aria-hidden="true">
        <i style={{ width: `${stats.today.percent}%` }} />
      </div>
      <div className="progress-week" aria-label="Выполнение за 7 дней">
        {stats.days.map((day) => (
          <div key={day.date} title={`${day.done} из ${day.total}`}>
            <span className="progress-bar">
              <i style={{ height: `${day.total ? Math.max(day.percent, 6) : 0}%` }} />
            </span>
            <span className="muted small">{formatWeekday(parseDayKey(day.date) ?? new Date(), "short")}</span>
          </div>
        ))}
      </div>
      <p className="muted small">
        За неделю выполнено {stats.done} из {stats.total}
        {stats.streak >= 2 ? ` · серия ${stats.streak} дн. подряд` : ""}
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
