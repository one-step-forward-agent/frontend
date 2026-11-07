import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { TeamTaskCard } from "../api/types";
import { Button, Field, useErrorToast } from "./ui";
import { notifyTasksChanged } from "../lib/hooks";
import { errorText } from "../lib/format";
import { useAuthStore } from "@/store/authStore";
import { tr } from "@/i18n";

const INPUT = "w-full min-w-0 rounded-lg border border-gray-300 bg-white/70 px-2 py-1.5 text-sm dark:border-white/15 dark:bg-white/5 dark:text-white";

export function TeamTaskAccept({ taskId, suggested, onAccepted }: { taskId: number; suggested?: string | null; onAccepted: (card: TeamTaskCard) => void }) {
  const timezone = useAuthStore(state => state.user?.timezone) || "Europe/Moscow";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(suggested && suggested.slice(0, 10) >= today ? suggested.slice(0, 10) : today);
  const [clock, setClock] = useState(suggested?.includes("T") ? suggested.slice(11, 16) : "");
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();
  const accept = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const card = await api.teams.act(taskId, "accept", { day, start_time: clock || null });
      onAccepted(card);
      notifyTasksChanged();
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  if (!open) return <Button size="sm" variant="primary" icon="calendar" onClick={() => setOpen(true)}>{tr("Принять и выбрать день", "Accept and choose a day")}</Button>;
  return <form onSubmit={accept} className="w-full space-y-2 rounded-lg border border-sky-400/30 p-2">
    <p className="text-xs text-gray-500 dark:text-gray-400">{tr("Когда вы будете делать задачу? Срок автора сохраняется.", "When will you work on this task? The original deadline stays unchanged.")}</p>
    <div className="grid grid-cols-2 gap-2">
      <Field label={tr("День выполнения", "Work day")}><input type="date" required min={today} value={day} onChange={event => setDay(event.target.value)} className={INPUT} /></Field>
      <Field label={tr("Время (необязательно)", "Time (optional)")}><input type="time" value={clock} onChange={event => setClock(event.target.value)} className={INPUT} /></Field>
    </div>
    <p className="text-xs text-gray-500">{timezone}</p>
    <div className="flex gap-2"><Button size="sm" variant="primary" type="submit" busy={busy}>{tr("Принять задачу", "Accept task")}</Button><Button size="sm" disabled={busy} onClick={() => setOpen(false)}>{tr("Назад", "Back")}</Button></div>
  </form>;
}
