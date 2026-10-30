import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api } from "../api/client";
import type { Calendar, CalendarEvent, DeleteScope, EventCreate, Priority, TagColor } from "../api/types";
import { useAuth } from "../auth";
import {
  PRIORITIES,
  addDays,
  browserTimezone,
  dayKey,
  deadlineTone,
  errorText,
  formatDate,
  formatDeadline,
  formatLead,
  formatTime,
  isHighPriority,
  lastDay,
  openPicker,
  plainPriority,
  parseDayKey,
  sameDay,
  startOfDay,
} from "../lib/format";
import { notifyTasksChanged } from "../lib/hooks";
import { Link } from "../router";
import { Icon } from "./icons";
import { NO_REPEAT, RepeatEditor, parseRepeat, repeatError, repeatRule, sameRule, type Repeat } from "./repeat";
import { ColorPicker, TagList, TagPicker } from "./tags";
import { TimeField } from "@/components/ui/time-field";
import { Badge, Button, Field, Switch } from "./ui";
import { LOCALE, tr } from "@/i18n";

export function EventRow({ event, showDate = false, extra }: { event: CalendarEvent; showDate?: boolean; extra?: ReactNode }) {
  const start = new Date(event.start_at);
  const last = lastDay(event);
  const multiDay = !sameDay(last, start);
  const [done, setDone] = useState(!!event.completed_at);
  const [busy, setBusy] = useState(false);
  useEffect(() => setDone(!!event.completed_at), [event.completed_at]);

  const toggle = async () => {
    setBusy(true);
    setDone(!done);
    try {
      await api.events.complete(event.id, !done);
      notifyTasksChanged();
    } catch {
      setDone(done);
    } finally {
      setBusy(false);
    }
  };

  // В списке — только то, что нужно, чтобы выбрать задачу, и повтор; откуда она и место — в карточке
  const hasMeta = !!(multiDay || (event.deadline_at && !done) || event.tag_ids?.length || event.recurrence);
  // Не выполнена, а время уже прошло — красная; выполненная — зелёная
  const missed = !done && new Date(event.end_at) <= new Date();
  const end = new Date(event.end_at);

  return (
    <li className={`event-item ${done ? "is-done" : missed ? "is-missed" : ""} ${isHighPriority(event.priority) ? "is-high" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `${tr("Снять отметку", "Unmark")}: ${event.title}` : `${tr("Выполнено", "Done")}: ${event.title}`}
        className={`event-check ${done ? "checked" : ""}`}
        disabled={busy}
        onClick={toggle}
      >
        {done && <Icon name="check" size={14} />}
      </button>
      <Link to={`/events/${event.id}`} className={`event-row priority-${event.priority} ${done ? "done" : ""}`}>
        <span className={`event-time ${event.all_day ? "untimed" : ""} ${showDate ? "with-date" : ""}`}>
          {showDate && <span className="event-date">{start.toLocaleDateString(LOCALE, { day: "numeric", month: "short" })}</span>}
          {/* No time: the column stays empty, the titles stay aligned */}
          {!event.all_day && (
            <>
              <span className="event-clock">{formatTime(start)}</span>
              {!multiDay && <span className="event-end">{formatTime(end)}</span>}
            </>
          )}
        </span>
        <span className="event-main">
          <span className="event-title">{event.title}</span>
          {hasMeta && (
            <span className="event-meta">
              {multiDay && <span>{tr("по", "until")} {formatDate(last, { day: "numeric", month: "short" })}</span>}
              {event.recurrence && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="sync" size={13} /> {event.recurrence}
                </span>
              )}
              {event.deadline_at && !done && (
                <span className={`deadline deadline-${deadlineTone(event.deadline_at)}`}>
                  <Icon name="flag" size={13} /> {formatDeadline(event.deadline_at)}
                </span>
              )}
              <TagList ids={event.tag_ids} />
            </span>
          )}
        </span>
        {isHighPriority(event.priority) && (
          <span className="event-badge">
            <Badge tone="warn">{tr("важно", "important")}</Badge>
          </span>
        )}
      </Link>
      {extra}
    </li>
  );
}

export function EventList({ events, showDate, extra }: { events: CalendarEvent[]; showDate?: boolean; extra?: (event: CalendarEvent) => ReactNode }) {
  return (
    <ul className="event-list">
      {events.map((event) => (
        <EventRow key={event.id} event={event} showDate={showDate} extra={extra?.(event)} />
      ))}
    </ul>
  );
}

/** The question a deletion of a repeated task asks: just this day, it and the later ones, or the whole series. */
export function DeleteScopeButtons({
  busy,
  several = false,
  onPick,
}: {
  busy: DeleteScope | null;
  several?: boolean;
  onPick: (scope: DeleteScope) => void;
}) {
  const options: { scope: DeleteScope; label: string }[] = [
    { scope: "one", label: several ? tr("Только эти", "Only these") : tr("Только эту", "Only this one") },
    { scope: "following", label: several ? tr("Эти и следующие", "These and following") : tr("Эту и следующие", "This and following") },
    { scope: "all", label: tr("Всю серию", "The whole series") },
  ];
  return (
    <>
      {options.map((option) => (
        <Button
          key={option.scope}
          size="sm"
          variant={option.scope === "all" ? "danger" : "secondary"}
          icon={option.scope === "all" ? "trash" : undefined}
          busy={busy === option.scope}
          disabled={busy !== null && busy !== option.scope}
          onClick={() => onPick(option.scope)}
        >
          {option.label}
        </Button>
      ))}
    </>
  );
}

const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 1440];

/** Дата и время — отдельные поля: пустое время — полноценная задача без времени, а не «весь день по умолчанию». */
interface FormState {
  title: string;
  date: string;
  time: string;
  endTime: string;
  endDate: string;
  multiDay: boolean;
  deadlineDate: string;
  deadlineTime: string;
  fixed: boolean;
  tagIds: number[];
  color: TagColor | null;
  calendarId: string;
  priority: Priority;
  location: string;
  description: string;
  reminder: string;
  repeat: Repeat;
}

const clock = (date: Date) => formatTime(date);

const CLOCK_VALUE = /^([01]\d|2[0-3]):[0-5]\d$/;

function initialState(event?: CalendarEvent, day?: string | null, time?: string | null): FormState {
  if (event) {
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);
    const last = lastDay(event);
    const deadline = event.deadline_at ? new Date(event.deadline_at) : null;
    return {
      title: event.title,
      date: dayKey(start),
      time: event.all_day ? "" : clock(start),
      endTime: event.all_day ? "" : clock(end),
      endDate: sameDay(last, start) ? "" : dayKey(last),
      multiDay: !sameDay(last, start),
      deadlineDate: deadline ? dayKey(deadline) : "",
      deadlineTime: deadline && !(deadline.getHours() === 23 && deadline.getMinutes() === 59) ? clock(deadline) : "",
      fixed: event.is_fixed,
      tagIds: event.tag_ids ?? [],
      color: event.color ?? null,
      calendarId: String(event.calendar_id),
      priority: plainPriority(event.priority),
      location: event.location ?? "",
      description: event.description ?? "",
      reminder: event.reminder_minutes == null ? "" : String(event.reminder_minutes),
      repeat: parseRepeat(event.recurrence_rule),
    };
  }
  // Новая задача не получает текущие дату и время автоматически: только выбранные в календаре (день, час в сетке)
  const date = parseDayKey(day ?? null) ? (day as string) : "";
  const start = date && time && CLOCK_VALUE.test(time) ? time : "";
  // Время из сетки — задача на час; с 23:00 окончание не ставим, иначе оно уйдёт на следующий день
  const end = start && start < "23:00" ? `${String(Number(start.slice(0, 2)) + 1).padStart(2, "0")}${start.slice(2)}` : "";
  return {
    title: "",
    date,
    time: start,
    endTime: end,
    endDate: "",
    multiDay: false,
    deadlineDate: "",
    deadlineTime: "",
    fixed: false,
    tagIds: [],
    color: null,
    calendarId: "",
    priority: "medium",
    location: "",
    description: "",
    reminder: "",
    repeat: NO_REPEAT,
  };
}

function at(day: Date, value: string): Date {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}

function toPayload(state: FormState, timezone: string): EventCreate | string {
  const title = state.title.trim();
  if (!title) return tr("Введите название", "Enter a title");
  const day = parseDayKey(state.date);
  if (!day) return tr("Выберите дату", "Pick a date");
  const last = state.multiDay ? parseDayKey(state.endDate) ?? day : day;
  if (last < day) return tr("Последний день раньше первого", "The last day is before the first");
  let start: Date;
  let end: Date;
  if (!state.time) {
    start = day;
    end = addDays(last, 1);
  } else {
    start = at(day, state.time);
    end = state.endTime ? at(last, state.endTime) : new Date(at(last, state.time).getTime() + 3_600_000);
    if (end <= start) return tr("Окончание должно быть позже начала", "The end must be after the start");
  }
  const deadlineDay = parseDayKey(state.deadlineDate);
  const repeatProblem = repeatError(state.repeat, state.date);
  if (repeatProblem) return repeatProblem;
  return {
    title,
    all_day: !state.time,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    timezone,
    priority: state.priority,
    location: state.location.trim() || null,
    description: state.description.trim() || null,
    reminder_minutes: state.reminder === "" ? null : Number(state.reminder),
    recurrence_rule: repeatRule(state.repeat, start),
    deadline_at: deadlineDay ? at(deadlineDay, state.deadlineTime || "23:59").toISOString() : null,
    is_fixed: state.fixed,
    tag_ids: state.tagIds,
    color: state.color,
  };
}

export function EventForm({
  event,
  day,
  time,
  calendars = [],
  onSaved,
  onCancel,
}: {
  event?: CalendarEvent;
  day?: string | null;
  time?: string | null;
  calendars?: Calendar[];
  onSaved: (event: CalendarEvent) => void;
  onCancel?: () => void;
}) {
  const { user } = useAuth();
  const [state, setState] = useState(() => initialState(event, day, time));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setState((current) => ({ ...current, [key]: value }));
  const today = startOfDay(new Date());
  const quickDays = [
    { label: tr("Сегодня", "Today"), value: dayKey(today) },
    { label: tr("Завтра", "Tomorrow"), value: dayKey(addDays(today, 1)) },
  ];
  const hasDetails = !!(event && (event.deadline_at || event.is_fixed || event.location || event.description || event.reminder_minutes != null || isHighPriority(event.priority)));

  const changeTime = (value: string) =>
    setState((current) => {
      if (!value) return { ...current, time: "", endTime: "" };
      // Длительность сохраняется при сдвиге начала
      if (current.time && current.endTime && !current.multiDay) {
        const shift = at(today, value).getTime() - at(today, current.time).getTime();
        const end = new Date(at(today, current.endTime).getTime() + shift);
        return { ...current, time: value, endTime: sameDay(end, today) ? clock(end) : "" };
      }
      return { ...current, time: value };
    });

  const submit = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    const payload = toPayload(state, event?.timezone ?? user?.timezone ?? browserTimezone());
    if (typeof payload === "string") return setError(payload);
    setError("");
    setSaving(true);
    try {
      const { recurrence_rule, ...changes } = payload;
      // An existing task sends its repeat only when it changed: then this and the later tasks of the series follow it
      const saved = event
        ? await api.events.update(event.id, sameRule(recurrence_rule, event.recurrence_rule) ? changes : { ...changes, recurrence_rule })
        : await api.events.create({ ...changes, recurrence_rule, ...(state.calendarId ? { calendar_id: Number(state.calendarId) } : {}) });
      notifyTasksChanged();
      onSaved(saved);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const localCalendars = calendars.filter((calendar) => calendar.provider === "local");

  return (
    <form className="form" onSubmit={submit}>
      <Field label={tr("Название", "Title")}>
        <input value={state.title} onChange={(e) => set("title", e.target.value)} placeholder={tr("Что сделать?", "What needs doing?")} maxLength={300} autoFocus required />
      </Field>

      <div className="form-row form-row-when">
        <Field label={state.multiDay ? tr("С", "From") : state.repeat.freq ? tr("Начало", "Starts") : tr("Дата", "Date")} className="picker-field">
          <input type="date" value={state.date} onChange={(e) => set("date", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} required />
        </Field>
        {state.multiDay ? (
          <Field label={tr("По", "Until")} className="picker-field">
            <input type="date" value={state.endDate} min={state.date} onChange={(e) => set("endDate", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} required />
          </Field>
        ) : (
          <div className="quick-days" role="group" aria-label={tr("Быстрый выбор даты", "Quick date choice")}>
            {quickDays.map((item) => (
              <button key={item.value} type="button" className={`chip-toggle ${state.date === item.value ? "active" : ""}`} aria-pressed={state.date === item.value} onClick={() => set("date", item.value)}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-row form-row-time">
        <Field label={tr("Время", "Time")} className="picker-field">
          <TimeField value={state.time} onChange={changeTime} allowEmpty label={tr("Время начала", "Start time")} />
        </Field>
        <Field label={tr("До", "To")} className="picker-field">
          <TimeField value={state.endTime} onChange={(value) => set("endTime", value)} allowEmpty disabled={!state.time} label={tr("Время окончания", "End time")} />
        </Field>
        {/* Empty time fields already say there is no time */}
        {state.time && (
          <Button variant="ghost" size="sm" onClick={() => changeTime("")}>
            {tr("Без времени", "No time")}
          </Button>
        )}
      </div>

      <label className="check">
        <input type="checkbox" checked={state.multiDay} onChange={(e) => setState((current) => ({ ...current, multiDay: e.target.checked, endDate: e.target.checked ? current.endDate || current.date : "" }))} />
        {tr("Несколько дней", "Several days")}
      </label>

      <RepeatEditor value={state.repeat} onChange={(repeat) => set("repeat", repeat)} start={parseDayKey(state.date) ?? today} existing={!!event?.recurrence_rule} />

      <Field label={tr("Теги", "Tags")}>
        <TagPicker value={state.tagIds} onChange={(ids) => set("tagIds", ids)} />
      </Field>

      <div>
        <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{tr("Цвет в календаре", "Colour in the calendar")}</span>
        <ColorPicker value={state.color} onChange={(color) => set("color", color)} />
      </div>

      <details className="more" open={hasDetails}>
        <summary>{tr("Дедлайн и детали", "Deadline and details")}</summary>
        <div className="form">
          <div className="form-row">
            <Field label={tr("Дедлайн", "Deadline")} className="picker-field">
              <input type="date" value={state.deadlineDate} onChange={(e) => set("deadlineDate", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} />
            </Field>
            <Field label={tr("Время дедлайна", "Deadline time")} className="picker-field">
              <TimeField value={state.deadlineTime} onChange={(value) => set("deadlineTime", value)} allowEmpty disabled={!state.deadlineDate} label={tr("Время дедлайна", "Deadline time")} />
            </Field>
          </div>

          <Switch checked={state.fixed} onChange={(value) => set("fixed", value)} label={tr("Нельзя переносить", "Can't be moved")} hint={tr("Deyla будет планировать вокруг этой задачи", "Deyla will plan around this task")} />

          <div className="form-row">
            <Field label={tr("Приоритет", "Priority")}>
              <select value={state.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
                {PRIORITIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={tr("Напоминание", "Reminder")}>
              <select value={state.reminder} onChange={(e) => set("reminder", e.target.value)}>
                <option value="">{tr("По настройкам", "As in settings")}</option>
                {REMINDER_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes === 0 ? tr("В момент начала", "At the start") : tr(`За ${formatLead(minutes)}`, `${formatLead(minutes)} before`)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {!event && localCalendars.length > 1 && (
            <Field label={tr("Календарь", "Calendar")}>
              <select value={state.calendarId} onChange={(e) => set("calendarId", e.target.value)}>
                <option value="">{tr("Основной", "Main")}</option>
                {localCalendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label={tr("Место", "Location")}>
            <input value={state.location} onChange={(e) => set("location", e.target.value)} placeholder={tr("Адрес или ссылка", "Address or link")} maxLength={500} />
          </Field>

          <Field label={tr("Описание", "Description")}>
            <textarea value={state.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </Field>
        </div>
      </details>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            {tr("Отмена", "Cancel")}
          </Button>
        )}
        <Button type="submit" variant="primary" busy={saving} icon="check">
          {event ? tr("Сохранить", "Save") : tr("Создать", "Create")}
        </Button>
      </div>
    </form>
  );
}
