import type { CalendarEvent } from "../api/types";
import { EventList } from "./events";
import { Link } from "../router";
import { LOCALE, tr } from "@/i18n";
import { AssignedTaskSchedule } from "./AssignedTaskSchedule";

export function assignmentGroups(events: CalendarEvent[]) {
  const groups = new Map<string, { key: string; label: string; events: CalendarEvent[] }>();
  for (const event of events) {
    const origin = event.assignment;
    if (!origin) continue;
    const key = origin.kind === "friend" ? `friend:${origin.friend_id ?? origin.task_id}` : `team:${origin.team_id}:project:${origin.project_id ?? "none"}`;
    const label = origin.kind === "friend"
      ? tr(`Задачи от друга ${origin.friend_name ?? ""}`, `Tasks from friend ${origin.friend_name ?? ""}`).trim()
      : origin.project_name
        ? tr(`Задачи проекта «${origin.project_name}»`, `Tasks for project “${origin.project_name}”`)
        : tr(`Задачи команды «${origin.team_name ?? ""}»`, `Tasks from team “${origin.team_name ?? ""}”`);
    const group = groups.get(key) ?? { key, label, events: [] };
    group.events.push(event);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function AssignedTaskGroup({ events, compact = false }: { events: CalendarEvent[]; compact?: boolean }) {
  if (!events.length) return null;
  return <div className="min-w-0 space-y-2">{assignmentGroups(events).map(group => {
    const done = group.events.filter(event => event.completed_at).length;
    return <details key={group.key} className="min-w-0 rounded-lg border border-sky-400/30 bg-sky-500/5 p-2" data-assigned-group={group.key}>
      <summary className="cursor-pointer break-words text-xs font-medium text-sky-800 dark:text-sky-200">
        {group.label} · {group.events.length}{done ? ` · ${done} ${tr("выполнено", "done")}` : ""}
      </summary>
      <div className="mt-2 min-w-0">
        {compact ? <ul className="space-y-1">{group.events.map(event => <li key={event.id} className="flex min-w-0 items-start gap-1"><Link to={`/events/${event.id}`} className={`min-w-0 flex-1 break-words text-xs text-gray-800 dark:text-gray-200 hover:underline ${event.completed_at ? "line-through opacity-60" : ""}`}>{event.all_day ? "" : `${new Date(event.start_at).toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" })} · `}{event.title}</Link><AssignedTaskSchedule event={event} /></li>)}</ul> : <EventList events={group.events} />}
      </div>
    </details>;
  })}</div>;
}
