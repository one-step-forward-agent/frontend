import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api } from "../api/client";
import type { Calendar, CalendarEvent, EventCreate, Priority } from "../api/types";
import { useAuth } from "../auth";
import {
  PRIORITIES,
  RECURRENCE_OPTIONS,
  addDays,
  browserTimezone,
  dayKey,
  deadlineTone,
  errorText,
  formatDate,
  formatDeadline,
  formatLead,
  formatTime,
  lastDay,
  openPicker,
  parseDayKey,
  recurrenceRule,
  sameDay,
  startOfDay,
} from "../lib/format";
import { notifyTasksChanged } from "../lib/hooks";
import { Link } from "../router";
import { Icon } from "./icons";
import { TagList, TagPicker } from "./tags";
import { Badge, Button, Field, Switch } from "./ui";

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

  // В списке — только то, что нужно, чтобы выбрать задачу; откуда она, повтор, место — в карточке
  const hasMeta = !!(multiDay || (event.deadline_at && !done) || event.tag_ids?.length);
  // Не выполнена, а время уже прошло — красная; выполненная — зелёная
  const missed = !done && new Date(event.end_at) <= new Date();
  const end = new Date(event.end_at);

  return (
    <li className={`event-item ${done ? "is-done" : missed ? "is-missed" : ""}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? `Снять отметку: ${event.title}` : `Выполнено: ${event.title}`}
        className={`event-check ${done ? "checked" : ""}`}
        disabled={busy}
        onClick={toggle}
      >
        {done && <Icon name="check" size={14} />}
      </button>
      <Link to={`/events/${event.id}`} className={`event-row priority-${event.priority} ${done ? "done" : ""}`}>
        <span className={`event-time ${event.all_day ? "untimed" : ""} ${showDate ? "with-date" : ""}`}>
          {showDate && <span className="event-date">{start.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>}
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
              {multiDay && <span>по {formatDate(last, { day: "numeric", month: "short" })}</span>}
              {event.deadline_at && !done && (
                <span className={`deadline deadline-${deadlineTone(event.deadline_at)}`}>
                  <Icon name="flag" size={13} /> {formatDeadline(event.deadline_at)}
                </span>
              )}
              <TagList ids={event.tag_ids} />
            </span>
          )}
        </span>
        {(event.priority === "high" || event.priority === "urgent") && (
          <span className="event-badge">
            <Badge tone={event.priority === "urgent" ? "bad" : "warn"}>{event.priority === "urgent" ? "срочно" : "важно"}</Badge>
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
  calendarId: string;
  priority: Priority;
  location: string;
  description: string;
  reminder: string;
  repeat: string;
}

const clock = (date: Date) => formatTime(date);

function initialState(event?: CalendarEvent, day?: string | null): FormState {
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
      calendarId: String(event.calendar_id),
      priority: event.priority,
      location: event.location ?? "",
      description: event.description ?? "",
      reminder: event.reminder_minutes == null ? "" : String(event.reminder_minutes),
      repeat: "",
    };
  }
  // Новая задача не получает текущие дату и время автоматически: дата — только если её выбрали (день в календаре)
  return {
    title: "",
    date: parseDayKey(day ?? null) ? (day as string) : "",
    time: "",
    endTime: "",
    endDate: "",
    multiDay: false,
    deadlineDate: "",
    deadlineTime: "",
    fixed: false,
    tagIds: [],
    calendarId: "",
    priority: "medium",
    location: "",
    description: "",
    reminder: "",
    repeat: "",
  };
}

function at(day: Date, value: string): Date {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}

function toPayload(state: FormState, timezone: string): EventCreate | string {
  const title = state.title.trim();
  if (!title) return "Введите название";
  const day = parseDayKey(state.date);
  if (!day) return "Выберите дату";
  const last = state.multiDay ? parseDayKey(state.endDate) ?? day : day;
  if (last < day) return "Последний день раньше первого";
  let start: Date;
  let end: Date;
  if (!state.time) {
    start = day;
    end = addDays(last, 1);
  } else {
    start = at(day, state.time);
    end = state.endTime ? at(last, state.endTime) : new Date(at(last, state.time).getTime() + 3_600_000);
    if (end <= start) return "Окончание должно быть позже начала";
  }
  const deadlineDay = parseDayKey(state.deadlineDate);
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
    recurrence_rule: recurrenceRule(state.repeat, start),
    deadline_at: deadlineDay ? at(deadlineDay, state.deadlineTime || "23:59").toISOString() : null,
    is_fixed: state.fixed,
    tag_ids: state.tagIds,
  };
}

export function EventForm({
  event,
  day,
  calendars = [],
  onSaved,
  onCancel,
}: {
  event?: CalendarEvent;
  day?: string | null;
  calendars?: Calendar[];
  onSaved: (event: CalendarEvent) => void;
  onCancel?: () => void;
}) {
  const { user } = useAuth();
  const [state, setState] = useState(() => initialState(event, day));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setState((current) => ({ ...current, [key]: value }));
  const today = startOfDay(new Date());
  const quickDays = [
    { label: "Сегодня", value: dayKey(today) },
    { label: "Завтра", value: dayKey(addDays(today, 1)) },
  ];
  const hasDetails = !!(event && (event.deadline_at || event.is_fixed || event.location || event.description || event.reminder_minutes != null || event.priority !== "medium"));

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
      const saved = event
        ? await api.events.update(event.id, changes)
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
      <Field label="Название">
        <input value={state.title} onChange={(e) => set("title", e.target.value)} placeholder="Что сделать?" maxLength={300} autoFocus required />
      </Field>

      <div className="form-row form-row-when">
        <Field label={state.multiDay ? "С" : "Дата"} className="picker-field">
          <input type="date" value={state.date} onChange={(e) => set("date", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} required />
        </Field>
        {state.multiDay ? (
          <Field label="По" className="picker-field">
            <input type="date" value={state.endDate} min={state.date} onChange={(e) => set("endDate", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} required />
          </Field>
        ) : (
          <div className="quick-days" role="group" aria-label="Быстрый выбор даты">
            {quickDays.map((item) => (
              <button key={item.value} type="button" className={`chip-toggle ${state.date === item.value ? "active" : ""}`} aria-pressed={state.date === item.value} onClick={() => set("date", item.value)}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-row form-row-time">
        <Field label="Время" className="picker-field">
          <input type="time" value={state.time} onChange={(e) => changeTime(e.target.value)} onClick={(e) => openPicker(e.currentTarget)} aria-label="Время начала" />
        </Field>
        <Field label="До" className="picker-field">
          <input type="time" value={state.endTime} disabled={!state.time} onChange={(e) => set("endTime", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} aria-label="Время окончания" />
        </Field>
        {state.time ? (
          <Button variant="ghost" size="sm" onClick={() => changeTime("")}>
            Без времени
          </Button>
        ) : (
          <span className="muted small no-time">Без времени</span>
        )}
      </div>

      <label className="check">
        <input type="checkbox" checked={state.multiDay} onChange={(e) => setState((current) => ({ ...current, multiDay: e.target.checked, endDate: e.target.checked ? current.endDate || current.date : "" }))} />
        Несколько дней
      </label>

      <Field label="Теги">
        <TagPicker value={state.tagIds} onChange={(ids) => set("tagIds", ids)} />
      </Field>

      <details className="more" open={hasDetails}>
        <summary>Дедлайн, повтор и детали</summary>
        <div className="form">
          <div className="form-row">
            <Field label="Дедлайн" className="picker-field">
              <input type="date" value={state.deadlineDate} onChange={(e) => set("deadlineDate", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} />
            </Field>
            <Field label="Время дедлайна" className="picker-field">
              <input type="time" value={state.deadlineTime} disabled={!state.deadlineDate} onChange={(e) => set("deadlineTime", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} />
            </Field>
          </div>

          <Switch checked={state.fixed} onChange={(value) => set("fixed", value)} label="Нельзя переносить" hint="Dayla будет планировать вокруг этой задачи" />

          <div className="form-row">
            {!event && (
              <Field label="Повтор">
                <select value={state.repeat} onChange={(e) => set("repeat", e.target.value)}>
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Приоритет">
              <select value={state.priority} onChange={(e) => set("priority", e.target.value as Priority)}>
                {PRIORITIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Напоминание">
              <select value={state.reminder} onChange={(e) => set("reminder", e.target.value)}>
                <option value="">По настройкам</option>
                {REMINDER_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes === 0 ? "В момент начала" : `За ${formatLead(minutes)}`}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {!event && localCalendars.length > 1 && (
            <Field label="Календарь">
              <select value={state.calendarId} onChange={(e) => set("calendarId", e.target.value)}>
                <option value="">Основной</option>
                {localCalendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Место">
            <input value={state.location} onChange={(e) => set("location", e.target.value)} placeholder="Адрес или ссылка" maxLength={500} />
          </Field>

          <Field label="Описание">
            <textarea value={state.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </Field>
        </div>
      </details>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" variant="primary" busy={saving} icon="check">
          {event ? "Сохранить" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
