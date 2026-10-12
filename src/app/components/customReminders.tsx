import { useState, type FormEvent } from "react";
import { api, type CustomReminder, type CustomReminderBody } from "../api/client";
import { dayKey, errorText, openPicker } from "../lib/format";
import { useAsync } from "../lib/hooks";
import { Icon } from "./icons";
import { Button, ConfirmButton, ErrorNote, Field, Loading, useErrorToast, useToast } from "./ui";
import { TimeField } from "@/components/ui/time-field";
import { GlassCard } from "@/components/dashboard/glass";

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
  { value: "", label: "Один раз" },
  { value: "daily", label: "Каждый день" },
  { value: "weekdays", label: "По будням" },
  { value: "weekly", label: "Каждую неделю" },
  { value: "monthly", label: "Каждый месяц" },
  { value: "hours", label: "Каждые N часов" },
  { value: "minutes", label: "Каждые N минут" },
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
  if (!state.text.trim()) return "Напишите, о чём напомнить";
  if (!state.date || !state.time) return "Выберите день и время";
  // The day and time as this device shows them, with its offset: the same moment wherever the profile's time zone is
  const body: CustomReminderBody = { text: state.text.trim(), at: new Date(`${state.date}T${state.time}`).toISOString() };
  if (state.repeat === "hours" || state.repeat === "minutes") {
    const minutes = state.repeat === "hours" ? state.every * 60 : state.every;
    if (!(minutes >= 15 && minutes <= 24 * 60)) return "Повторять можно не чаще раза в 15 минут и не реже раза в сутки";
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
      toast(editing ? "Напоминание изменено" : "Напоминание поставлено");
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
      toast("Напоминание отменено");
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
        title="Мои напоминания"
        actions={
          !form && (
            <Button variant="secondary" size="sm" icon="plus" onClick={() => open()}>
              Новое
            </Button>
          )
        }
      >
        <p className="muted small">Приходят в Telegram. Можно поставить и в чате: «напоминай пить воду каждые 2 часа».</p>

        {form && (
          <form className="form" onSubmit={submit} style={{ marginTop: 12 }}>
            <Field label="О чём напомнить">
              <input value={form.text} onChange={(e) => set("text", e.target.value)} placeholder="Пить воду" maxLength={500} autoFocus required />
            </Field>
            <div className="form-row">
              <Field label={form.repeat ? "Первый раз" : "День"} className="picker-field">
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} onClick={(e) => openPicker(e.currentTarget)} required />
              </Field>
              <Field label="Время">
                <TimeField value={form.time} onChange={(value) => set("time", value)} label="Время напоминания" />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Повтор">
                <select value={form.repeat} onChange={(e) => set("repeat", e.target.value as RepeatChoice)}>
                  {REPEATS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              {(form.repeat === "hours" || form.repeat === "minutes") && (
                <Field label={form.repeat === "hours" ? "Каждые, часов" : "Каждые, минут"}>
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
                Отмена
              </Button>
              <Button type="submit" variant="primary" icon="check" busy={saving}>
                {editing ? "Сохранить" : "Поставить"}
              </Button>
            </div>
          </form>
        )}

        {list.error && <ErrorNote message={list.error} onRetry={list.reload} />}
        {!list.data ? (
          list.loading && <Loading />
        ) : list.data.length === 0 ? (
          !form && <p className="muted small" style={{ marginTop: 12 }}>Активных напоминаний нет.</p>
        ) : (
          <ul className="simple-list" style={{ marginTop: 12 }}>
            {list.data.map((item) => (
              <li key={item.id}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.text}</span>
                  <span className="muted small inline-flex items-center gap-1">
                    <Icon name={item.repeat ? "sync" : "bell"} size={12} />
                    {item.repeat ? `${item.repeat} · ближайшее ${item.label}` : item.label}
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => open(item)}>
                  Изменить
                </Button>
                <ConfirmButton size="sm" icon="trash" label="Отменить напоминание" confirmLabel="Отменить?" busy={removing === item.id} onConfirm={() => remove(item.id)} />
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
