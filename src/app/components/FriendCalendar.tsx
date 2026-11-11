import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { Friend, FriendTaskCard, SendDraftCard } from "../api/types";
import { Badge, Button, ConfirmButton, ErrorNote, Field, Loading, useErrorToast, useToast } from "./ui";
import { notifyTasksChanged, useAction, useAsync, useTasksChanged } from "../lib/hooks";
import { GlassCard } from "@/components/dashboard/glass";
import { useAuthStore } from "@/store/authStore";
import { tr } from "@/i18n";
import { cn } from "@/utils/cn";
import { AssignedTaskSchedule } from "./AssignedTaskSchedule";
import { Link } from "../router";

const INPUT = "w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 text-sm text-gray-900 dark:border-white/15 dark:bg-white/5 dark:text-white";
const iso = (day: Date) => `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString(tr("ru-RU", "en-US"), { day: "numeric", month: "long", year: "numeric" });
const statusLabel = (status: string) => ({ pending: tr("Ждёт принятия", "Awaiting acceptance"), accepted: tr("Принята", "Accepted"), rejected: tr("Отклонена", "Declined"), cancelled: tr("Отменена", "Cancelled") }[status] ?? status);

export function FriendCalendar({ friends }: { friends: Friend[] }) {
  const [chosen, setChosen] = useState("");
  const accepted = friends.filter(friend => friend.status === "accepted");
  const friend = accepted.find(item => String(item.id) === chosen) ?? accepted[0];
  if (!friend) return null;
  return <GlassCard title={tr("Календарь друзей", "Friends calendar")}>
    <Field label={tr("Друг", "Friend")}><select aria-label={tr("Друг", "Friend")} className={INPUT} value={friend.id} onChange={event => setChosen(event.target.value)}>
      {accepted.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select></Field>
    <p className="my-3 text-xs text-gray-500 dark:text-gray-400">{tr("Задачи, которыми вы обменялись, и ваши планы, открытые друг другу. Личные задачи без общего доступа здесь не отображаются.", "Tasks you exchanged and plans you shared with each other. Private tasks are not shown here.")}</p>
    <FriendSchedule key={friend.id} friend={friend} />
  </GlassCard>;
}

function FriendSchedule({ friend }: { friend: Friend }) {
  const [kind, setKind] = useState<"tasks" | "reminders">("tasks");
  const timezone = useAuthStore(state => state.user?.timezone) || "Europe/Moscow";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [month, setMonth] = useState(() => new Date(`${today.slice(0, 7)}-01T12:00:00`));
  const [selected, setSelected] = useState<string | null>(null);
  const [direction, setDirection] = useState("all");
  const [status, setStatus] = useState("active");
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState<FriendTaskCard | null>(null);
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(today);
  const [clock, setClock] = useState("");
  const [reminder, setReminder] = useState(false);
  const [shared, setShared] = useState(false);
  const [draft, setDraft] = useState<SendDraftCard | null>(null);
  const reportError = useErrorToast();
  const toast = useToast();
  const { pending, run } = useAction(reportError);
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  first.setDate(first.getDate() - (first.getDay() + 6) % 7);
  const days = Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + index, 12));
  const data = useAsync(async () => {
    const [tasks, schedule] = await Promise.all([
      api.friends.tasks(friend.id, iso(days[0]), iso(days[41])),
      api.friends.sharedSchedule(friend.id, iso(days[0]), iso(days[41])),
    ]);
    return { tasks, schedule };
  }, [friend.id, month.getTime()]);
  useTasksChanged(data.reload);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void data.reload(); };
    const timer = window.setInterval(refresh, 20000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [data.reload]);
  const rows = (data.loading || data.error ? [] : data.data?.tasks ?? []).filter(task =>
    (!!task.reminder === (kind === "reminders")) &&
    (direction === "all" || task.role === direction) &&
    (status === "all" || (status === "active" ? ["pending", "accepted"].includes(task.status) : task.status === status)));
  const onDay = (task: FriendTaskCard, value: string) => task.start.slice(0, 10) <= value && (task.all_day && task.end ? task.end.slice(0, 10) > value : task.start.slice(0, 10) === value);
  const visible = rows.filter(task => selected ? onDay(task, selected) : task.start.slice(0, 7) === iso(month).slice(0, 7));
  const assignedIds = new Set((data.data?.tasks ?? []).map(task => task.calendar_event_id));
  const sharedRows = (data.loading || data.error || kind !== "tasks" ? [] : data.data?.schedule.events ?? []).filter(event =>
    !assignedIds.has(event.id) && (direction === "all" || event.role === direction) &&
    (status === "all" || (status === "completed" ? event.completed : ["active", "accepted"].includes(status) && !event.completed)));
  const sharedOnDay = (event: typeof sharedRows[number], value: string) => event.first_day <= value && event.last_day >= value;
  const sharedVisible = sharedRows.filter(event => selected ? sharedOnDay(event, selected) : event.first_day <= iso(new Date(month.getFullYear(), month.getMonth() + 1, 0, 12)) && event.last_day >= iso(month));
  const changed = () => { void data.reload(); notifyTasksChanged(); };
  const open = (task?: FriendTaskCard) => {
    setEditing(task ?? null); setTitle(task?.title ?? ""); setDay(task?.start.slice(0, 10) ?? selected ?? today);
    setClock(task && !task.all_day ? task.start.slice(11, 16) : ""); setReminder(task ? !!task.reminder : kind === "reminders"); setShared(!!task?.shared); setForm(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const body = { title: title.trim(), date: day, time: clock || null, reminder, shared };
    if (editing) {
      if (await run("save", () => api.friends.editTask(editing.task_id, body))) {
        setForm(false); changed(); toast(reminder ? tr("Напоминание обновлено", "Reminder updated") : tr("Задача обновлена", "Task updated"));
      }
    } else {
      const result = await run("save", () => api.friends.createTask(friend.id, body));
      if (result) { setDraft(result); setForm(false); }
    }
  };
  const draftAction = async (action: "send" | "cancel") => {
    if (!draft) return;
    if (await run("draft", () => api.sendDrafts.act(draft.draft_id, action))) {
      setDraft(null); changed(); toast(action === "send" ? tr("Отправлено другу", "Sent to your friend") : tr("Черновик отменён", "Draft cancelled"));
    }
  };
  return <div className="space-y-3">
    <div role="tablist" aria-label={tr("Задачи и напоминания", "Tasks and reminders")} className="flex gap-2">
      {(["tasks", "reminders"] as const).map(value => <Button key={value} role="tab" aria-selected={kind === value} variant={kind === value ? "primary" : "secondary"} disabled={form || !!draft} onClick={() => setKind(value)}>{value === "tasks" ? tr("Задачи", "Tasks") : tr("Напоминания", "Reminders")}</Button>)}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" aria-label={tr("Предыдущий месяц", "Previous month")} onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12)); setSelected(null); }}>‹</Button>
      <span className="flex-1 text-center font-medium">{month.toLocaleDateString(tr("ru-RU", "en-US"), { month: "long", year: "numeric" })}</span>
      <Button size="sm" aria-label={tr("Следующий месяц", "Next month")} onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12)); setSelected(null); }}>›</Button>
      <Button size="sm" onClick={() => { setMonth(new Date(`${today.slice(0, 7)}-01T12:00:00`)); setSelected(today); }}>{tr("Сегодня", "Today")}</Button>
    </div>
    <div className="grid grid-cols-7 gap-1">
      {tr("Пн Вт Ср Чт Пт Сб Вс", "Mon Tue Wed Thu Fri Sat Sun").split(" ").map(label => <span key={label} className="text-center text-xs text-gray-500">{label}</span>)}
      {days.map(value => {
        const key = iso(value), count = rows.filter(task => onDay(task, key)).length + sharedRows.filter(event => sharedOnDay(event, key)).length;
        return <button key={key} type="button" aria-pressed={selected === key} aria-label={`${dateLabel(key)}: ${count} ${tr("задач", "tasks")}`} onClick={() => setSelected(selected === key ? null : key)} className={cn("min-h-12 rounded-lg border text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500", selected === key ? "border-sky-500 bg-sky-500/15" : "border-gray-200 dark:border-white/10", value.getMonth() !== month.getMonth() && "opacity-40", key === today && "font-bold text-sky-600 dark:text-sky-300")}>
          {value.getDate()}<span className="block h-4 text-[10px] text-sky-600 dark:text-sky-300">{count || ""}</span>
        </button>;
      })}
    </div>
    <p className="text-xs text-gray-500">{tr("Часовой пояс", "Time zone")}: {timezone}</p>
    <div className="grid gap-2 sm:grid-cols-2">
      <Field label={tr("Направление", "Direction")}><select aria-label={tr("Направление", "Direction")} className={INPUT} value={direction} onChange={event => setDirection(event.target.value)}><option value="all">{tr("Все направления", "All directions")}</option><option value="sender">{tr("От меня другу", "From me to friend")}</option><option value="performer">{tr("От друга мне", "From friend to me")}</option></select></Field>
      <Field label={tr("Статус", "Status")}><select aria-label={tr("Статус", "Status")} className={INPUT} value={status} onChange={event => setStatus(event.target.value)}><option value="active">{tr("Активные", "Active")}</option><option value="all">{tr("Все статусы", "All statuses")}</option><option value="completed">{tr("Выполнены", "Completed")}</option>{["pending", "accepted", "rejected", "cancelled"].map(value => <option key={value} value={value}>{kind === "reminders" && value === "accepted" ? tr("Запланировано", "Scheduled") : statusLabel(value)}</option>)}</select></Field>
    </div>
    <div className="flex flex-wrap gap-2 items-center"><span className="flex-1 text-sm">{selected ? dateLabel(selected) : tr("Весь месяц", "Whole month")}</span>{selected && <Button size="sm" onClick={() => setSelected(null)}>{tr("Весь месяц", "Whole month")}</Button>}<Button size="sm" variant="primary" icon="plus" disabled={!!draft || form} onClick={() => open()}>{kind === "reminders" ? tr("Напомнить другу", "Remind friend") : tr("Дать задачу", "Give a task")}</Button></div>
    {draft && <div className="rounded-lg border border-sky-400 p-3 space-y-2" role="status"><p className="font-medium">{draft.type === "friend_reminder" ? tr("Поставить напоминание другу", "Set a reminder for") : tr("Отправить задачу другу", "Send a task to")} {friend.name}?</p><p>{draft.title}</p><p className="text-sm">{draft.when}</p><p className="text-xs">{tr("Пока не отправлено", "Not sent yet")}</p><div className="flex gap-2"><Button variant="primary" busy={pending === "draft"} onClick={() => draftAction("send")}>{tr("Отправить", "Send")}</Button><Button disabled={!!pending} onClick={() => draftAction("cancel")}>{tr("Отмена", "Cancel")}</Button></div></div>}
    {form && <form onSubmit={save} className="rounded-lg border border-gray-300 dark:border-white/15 p-3 space-y-3">
      <Field label={reminder ? tr("О чём напомнить", "What to remind about") : tr("Задача", "Task")}><input autoFocus required maxLength={300} className={INPUT} value={title} onChange={event => setTitle(event.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2"><Field label={tr("День", "Day")}><input required type="date" className={INPUT} value={day} onChange={event => setDay(event.target.value)} /></Field><Field label={reminder ? tr("Время напоминания", "Reminder time") : tr("Время (необязательно)", "Time (optional)")}><input type="time" required={reminder} className={INPUT} value={clock} onChange={event => setClock(event.target.value)} /></Field></div>
      {!editing && !reminder && <label className="block text-sm"><input type="checkbox" checked={shared} onChange={event => setShared(event.target.checked)} /> {tr("Совместная задача", "Shared task")}</label>}
      {editing && <p className="text-xs text-gray-500">{tr("Друг получит обновлённую задачу. Принятую задачу потребуется принять заново, если не включено автоматическое принятие.", "Your friend receives the updated task. Accepted tasks need acceptance again unless automatic acceptance is enabled.")}</p>}
      <div className="flex gap-2"><Button type="submit" variant="primary" busy={pending === "save"} disabled={!title.trim()}>{editing ? tr("Сохранить и отправить", "Save and send") : tr("Продолжить", "Continue")}</Button><Button disabled={!!pending} onClick={() => setForm(false)}>{tr("Отмена", "Cancel")}</Button></div>
    </form>}
    {data.data?.schedule.truncated && <p className="text-xs text-amber-700 dark:text-amber-300">{tr("Показаны первые 1000 общих задач. Выберите более короткий период.", "Showing the first 1000 shared tasks. Choose a shorter period.")}</p>}
    {data.error && <ErrorNote message={data.error} onRetry={data.reload} />}
    {data.loading ? <Loading /> : !data.error && (visible.length || sharedVisible.length ? <ul className="space-y-2">{visible.map(task => <li key={task.task_id} className="rounded-lg border border-gray-200 dark:border-white/10 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2"><span className="font-medium break-words min-w-0 flex-1">{task.title}</span><Badge>{task.reminder && task.status === "accepted" ? tr("Запланировано", "Scheduled") : statusLabel(task.status)}</Badge></div>
      {task.calendar_event_id && <AssignedTaskSchedule eventId={task.calendar_event_id} title={task.title} />}
      <p className="text-xs text-gray-500 dark:text-gray-400">{task.role === "sender" ? tr("Вы →", "You →") : tr("Вам от", "To you from")} {friend.name} · {task.when}{task.reminder ? tr(" · напоминание", " · reminder") : ""}{task.shared ? tr(" · совместная", " · shared") : ""}</p>
      <div className="flex flex-wrap gap-2">{task.can_edit && <Button size="sm" disabled={!!pending || !!draft || form} onClick={() => open(task)}>{tr("Изменить", "Edit")}</Button>}{task.actions.map(action => action === "cancel" ? <ConfirmButton key={action} size="sm" icon="trash" label={tr("Отменить задачу", "Cancel task")} busy={pending === String(task.task_id)} onConfirm={async () => { if (await run(String(task.task_id), () => api.friends.act(task.task_id, action))) changed(); }} /> : <Button key={action} size="sm" busy={pending === String(task.task_id)} onClick={async () => { if (await run(String(task.task_id), () => api.friends.act(task.task_id, action))) changed(); }}>{({ accept: tr("Принять", "Accept"), reject: tr("Отклонить", "Decline"), start: tr("Начал", "Started"), check_on: tr("Включить контроль", "Enable check"), check_off: tr("Без контроля", "Disable check") })[action]}</Button>)}</div>
    </li>)}{sharedVisible.map(event => <li key={`shared-${event.id}`} className="rounded-lg border border-sky-300/40 bg-sky-500/5 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2"><span className="min-w-0 flex-1 break-words font-medium">{event.title}</span><Badge>{event.completed ? tr("Выполнено", "Completed") : tr("Общий доступ", "Shared")}</Badge></div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{event.owned ? tr("Вы поделились с", "You shared with") : tr("С вами поделился друг", "Shared with you by")} {friend.name} · {dateLabel(event.first_day)}{!event.all_day && ` · ${new Date(event.start_at).toLocaleTimeString(tr("ru-RU", "en-US"), { timeZone: timezone, hour: "2-digit", minute: "2-digit" })}`}</p>
      {event.owned && <Link className="text-sm text-sky-700 dark:text-sky-300 underline" to={`/events/${event.id}`}>{tr("Открыть задачу", "Open task")}</Link>}
    </li>)}</ul> : <p className="py-4 text-center text-sm text-gray-500">{tr("Задач за этот период нет", "No tasks in this period")}</p>)}
  </div>;
}
