import { useState, type FormEvent } from "react";
import { api, type CustomReminder, type CustomReminderBody } from "../api/client";
import { dayKey, errorText, openPicker } from "../lib/format";
import { useAsync } from "../lib/hooks";
import { Icon } from "./icons";
import { Button, ConfirmButton, ErrorNote, Field, Loading, useErrorToast, useToast } from "./ui";
import { TimeField } from "@/components/ui/time-field";
import { GlassCard } from "@/components/dashboard/glass";
import { tr } from "@/i18n";

/**
 * The reminders the user asked for ("напомни …"), made, changed and cancelled here as well as in the chat:
 * once, or again and again — every day, on weekdays, every week, every month or every N hours.
 */

type RepeatChoice = "" | "daily" | "weekdays" | "weekly" | "monthly" | "hours" | "minutes";

interface FormState {
  text: string;
  date: string;
  time: string;
  repeat: RepeatChoice;
  every: number;
}

const REPEATS: { value: RepeatChoice; label: string }[] = [
  { value: "", label: tr("Один раз", "Once") },
  { value: "daily", label: tr("Каждый день", "Every day") },
  { value: "weekdays", label: tr("По будням", "Weekdays") },
  { value: "weekly", label: tr("Каждую неделю", "Every week") },
  { value: "monthly", label: tr("Каждый месяц", "Every month") },
  { value: "hours", label: tr("Каждые N часов", "Every N hours") },
  { value: "minutes", label: tr("Каждые N минут", "Every N minutes") },
];

function nextHour(): { date: string; time: string } {
  const moment = new Date(Date.now() + 60 * 60 * 1000);
  return { date: dayKey(moment), time: `${String(moment.getHours()).padStart(2, "0")}:00` };
}

function blank(): FormState {
  return { text: "", ...nextHour(), repeat: "", every: 2 };
}

function fromReminder(item: CustomReminder): FormState {
  const at = new Date(item.at);
  const every = item.every_minutes ?? 0;
  return {
    text: item.text,
    date: dayKey(at),
    time: `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`,
    repeat: every ? (every % 60 === 0 ? "hours" : "minutes") : ((item.repeat_kind ?? "") as RepeatChoice),
    every: every ? (every % 60 === 0 ? every / 60 : every) : 2,
  };
}

function toBody(state: FormState): CustomReminderBody | string {
  if (!state.text.trim()) return tr("Напишите, о чём напомнить", "Write what to remind you about");
  if (!state.date || !state.time) return tr("Выберите день и время", "Choose a day and time");
  // The day and time as this device shows them, with its offset: the same moment wherever the profile's time zone is
  const body: CustomReminderBody = { text: state.text.trim(), at: new Date(`${state.date}T${state.time}`).toISOString() };
  if (state.repeat === "hours" || state.repeat === "minutes") {
    const minutes = state.repeat === "hours" ? state.every * 60 : state.every;
    if (!(minutes >= 15 && minutes <= 24 * 60)) return tr("Повторять можно не чаще раза в 15 минут и не реже раза в сутки", "Repeats can be from every 15 minutes to once a day");
    body.every_minutes = minutes;
  } else if (state.repeat) {
    body.repeat = state.repeat;
  }
  return body;
}

export function CustomRemindersSection() {
  const list = useAsync(() => api.customReminders.list(), []);
  const [form, setForm] = useState<FormState | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const toast = useToast();
  const reportError = useErrorToast();

  const open = (item?: CustomReminder) => {
    setError("");
    setEditing(item?.id ?? null);
    setForm(item ? fromReminder(item) : blank());
  };
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => (current ? { ...current, [key]: value } : current));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    const body = toBody(form);
    if (typeof body === "string") return setError(body);
    setSaving(true);
    try {
      if (editing) await api.customReminders.update(editing, body);
      else await api.customReminders.create(body);
      toast(editing ? tr("Напоминание изменено", "Reminder updated") : tr("Напоминание поставлено", "Reminder set"));
      setForm(null);
      setEditing(null);
      list.reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    setRemoving(id);
    try {
      await api.customReminders.remove(id);
      toast(tr("Напоминание отменено", "Reminder cancelled"));
      list.reload();
    } catch (err) {
      reportError(errorText(err));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div id="my-reminders" className="anchor">
      <GlassCard
        title={tr("Мои напоминания", "My reminders")}
        actions={
          !form && (
            <Button variant="secondary" size="sm" icon="plus" onClick={() => open()}>
              {tr("Новое", "New")}
            </Button>
          )
        }
      >
        <p className="muted small">{tr("Приходят в Telegram. Можно поставить и в чате: «напоминай пить воду каждые 2 часа».", "They come to Telegram. You can also set them in the chat: “remind me to drink water every 2 hours”.")}</p>

        {form && (
          <form className="form" onSubmit={submit} style={{ marginTop: 12 }}>
            <Field label={tr("О чём напомнить", "Remind me to")}>
              <input value={form.text} onChange={(e) => set("text", e.target.value)} placeholder={tr("Пить воду", "Drink water")} maxLength={500} autoFocus required />
            </Field>
            <div className="form-row">
              <Field label={form.repeat ? tr("Первый раз", "First time") : tr("День", "Day")} className="picker-field">
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} required />
              </Field>
              <Field label={tr("Время", "Time")}>
                <TimeField value={form.time} onChange={(value) => set("time", value)} label={tr("Время напоминания", "Reminder time")} />
              </Field>
            </div>
            <div className="form-row">
              <Field label={tr("Повтор", "Repeat")}>
                <select value={form.repeat} onChange={(e) => set("repeat", e.target.value as RepeatChoice)}>
                  {REPEATS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              {(form.repeat === "hours" || form.repeat === "minutes") && (
                <Field label={form.repeat === "hours" ? tr("Каждые, часов", "Every, hours") : tr("Каждые, минут", "Every, minutes")}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={form.repeat === "hours" ? 1 : 15}
                    max={form.repeat === "hours" ? 24 : 1440}
                    value={form.every}
                    onChange={(e) => set("every", Number(e.target.value) || 0)}
                  />
                </Field>
              )}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <Button variant="ghost" onClick={() => setForm(null)}>
                {tr("Отмена", "Cancel")}
              </Button>
              <Button type="submit" variant="primary" icon="check" busy={saving}>
                {editing ? tr("Сохранить", "Save") : tr("Поставить", "Set")}
              </Button>
            </div>
          </form>
        )}

        {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
        {!list.data ? (
          list.loading && <Loading />
        ) : list.data.length === 0 ? (
          !form && <p className="muted small" style={{ marginTop: 12 }}>{tr("Активных напоминаний нет.", "No active reminders.")}</p>
        ) : (
          <ul className="simple-list" style={{ marginTop: 12 }}>
            {list.data.map((item) => (
              <li key={item.id}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.text}</span>
                  <span className="muted small inline-flex items-center gap-1">
                    <Icon name={item.repeat ? "sync" : "bell"} size={12} />
                    {item.repeat ? `${item.repeat} · ${tr("ближайшее", "next")} ${item.label}` : item.label}
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => open(item)}>
                  {tr("Изменить", "Edit")}
                </Button>
                <ConfirmButton size="sm" icon="trash" label={tr("Отменить напоминание", "Cancel reminder")} confirmLabel={tr("Отменить?", "Cancel it?")} busy={removing === item.id} onConfirm={() => remove(item.id)} />
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
