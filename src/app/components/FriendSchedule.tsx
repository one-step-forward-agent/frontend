import { useEffect, useState } from "react";
import type { Friend } from "../api/types";
import { api } from "../api/client";
import { addDays, dayKey, parseDayKey } from "../lib/format";
import { useAsync } from "../lib/hooks";
import { Button, ErrorNote, Field, Loading } from "./ui";
import { GlassCard } from "@/components/dashboard/glass";
import { tr } from "@/i18n";

export function FriendSchedule({ friends }: { friends: Friend[] }) {
  const accepted = friends.filter(friend => friend.status === "accepted");
  const [selected, setSelected] = useState("");
  const friend = accepted.find(friend => String(friend.id) === selected) ?? accepted[0];
  return <GlassCard title={tr("Расписание друзей", "Friends’ schedules")}>
    <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{tr("Только задачи, которыми друг поделился со всеми друзьями или лично с вами. Расписание доступно только для просмотра.", "Only tasks your friend shared with all friends or specifically with you. This schedule is read-only.")}</p>
    {accepted.length === 0 ? <p className="text-sm text-gray-500">{tr("Расписание появится после принятия приглашения в друзья.", "Schedules become available after a friend accepts your invitation.")}</p> : <>
      <Field label={tr("Друг", "Friend")}>
        <select value={friend?.id ?? ""} onChange={event => setSelected(event.target.value)}>
          {accepted.map(friend => <option key={friend.id} value={friend.id}>{friend.name}</option>)}
        </select>
      </Field>
      {friend && <Schedule key={friend.id} friend={friend} />}
    </>}
  </GlassCard>;
}

function Schedule({ friend }: { friend: Friend }) {
  const [first, setFirst] = useState(dayKey(new Date()));
  const start = parseDayKey(first);
  const last = start ? dayKey(addDays(start, 6)) : first;
  const schedule = useAsync(() => start ? api.friends.schedule(friend.id, first, last) : Promise.resolve(null), [friend.id, first, last]);
  useEffect(() => {
    const refresh = () => { void schedule.reload(); };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [schedule.reload]);
  const events = schedule.data?.events ?? [];
  const days = start ? Array.from({ length: 7 }, (_, offset) => dayKey(addDays(start, offset))) : [];
  return <div className="mt-3 space-y-3">
    <div className="flex flex-wrap items-end gap-2">
      <Button size="sm" aria-label={tr("Предыдущие 7 дней", "Previous 7 days")} disabled={!start} onClick={() => start && setFirst(dayKey(addDays(start, -7)))}>←</Button>
      <Field label={tr("Начало недели", "Week starting")} className="min-w-0 flex-1">
        <input type="date" value={first} onChange={event => setFirst(event.target.value)} />
      </Field>
      <Button size="sm" aria-label={tr("Следующие 7 дней", "Next 7 days")} disabled={!start} onClick={() => start && setFirst(dayKey(addDays(start, 7)))}>→</Button>
      <Button size="sm" onClick={() => { void schedule.reload(); }}>{tr("Обновить", "Refresh")}</Button>
    </div>
    {schedule.loading && <Loading />}
    {schedule.error && <ErrorNote message={schedule.error} onRetry={schedule.reload} />}
    {!schedule.loading && !schedule.error && schedule.data && <>
      <p className="text-xs text-gray-500">{first} — {last} · {tr("Часовой пояс друга", "Friend’s timezone")}: {schedule.data.timezone}</p>
      {events.length === 0 && <p className="text-sm text-gray-500">{tr("На этой неделе нет задач, видимых вам.", "No tasks shared with you this week.")}</p>}
      {days.map(day => {
        const items = events.filter(event => event.first_day <= day && event.last_day >= day);
        return items.length > 0 && <section key={day} className="space-y-1 border-t border-gray-200 pt-2 dark:border-white/10">
          <h3 className="text-sm font-medium">{day}</h3>
          <ul className="space-y-2">{items.map(event => <li key={event.id} className="text-sm break-words">
            <span className={event.completed ? "line-through opacity-60" : ""}>{event.title}</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {event.all_day ? tr("Без времени", "No time") : `${event.start_at.slice(0, 10)} ${event.start_at.slice(11, 16)} – ${event.end_at.slice(0, 10)} ${event.end_at.slice(11, 16)}`}
              {event.completed && ` · ${tr("Выполнена", "Done")}`}
              {event.deadline_at && ` · ${tr("Дедлайн", "Deadline")}: ${event.deadline_at.slice(0, 10)} ${event.deadline_at.slice(11, 16)}`}
            </p>
          </li>)}</ul>
        </section>;
      })}
      {schedule.data.truncated && <p className="text-xs text-amber-700 dark:text-amber-300">{tr("Показаны первые 1000 задач за период.", "Showing the first 1,000 tasks in this period.")}</p>}
    </>}
  </div>;
}
