import { useState, type FormEvent } from "react";
import type { CalendarEvent } from "../api/types";
import { api } from "../api/client";
import { Button, Dialog, ErrorNote, Field } from "./ui";
import { notifyTasksChanged } from "../lib/hooks";
import { errorText } from "../lib/format";
import { tr } from "@/i18n";

export function AssignedTaskSchedule(props: { event: CalendarEvent } | { eventId: number; title: string }) {
  const event = "event" in props ? props.event : null;
  const eventId = event?.id ?? ("eventId" in props ? props.eventId : 0);
  const title = event?.title ?? ("title" in props ? props.title : "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [day, setDay] = useState("");
  const choose = async () => {
    setOpen(true);
    setBusy(true);
    setError("");
    try {
      const current = event ?? await api.events.get(eventId);
      setDay(new Intl.DateTimeFormat("en-CA", { timeZone: current.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(current.start_at)));
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.events.move([eventId], day);
      notifyTasksChanged();
      setOpen(false);
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  };
  return <>
    <Button size="sm" variant="ghost" icon="calendar" onClick={choose} title={`${tr("Выбрать дату", "Choose a date")}: ${title}`} aria-label={`${tr("Выбрать дату", "Choose a date")}: ${title}`} />
    <Dialog open={open} onClose={() => setOpen(false)} title={tr("Когда выполнить задачу?", "When will you do this task?")}>
      <form onSubmit={save} className="form">
        <p className="break-words text-sm">{title}</p>
        <Field label={tr("Дата в календаре", "Calendar date")}><input type="date" value={day} onChange={e => setDay(e.target.value)} required /></Field>
        <p className="text-xs text-gray-500 dark:text-gray-400">{tr("Время и срок сдачи сохранятся.", "The time and deadline will stay unchanged.")}</p>
        {error && <ErrorNote message={error} />}
        <Button type="submit" busy={busy} disabled={!day} variant="primary">{tr("Сохранить дату", "Save date")}</Button>
      </form>
    </Dialog>
  </>;
}
