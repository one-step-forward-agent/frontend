// Создание и редактирование задачи
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-field";
import { createEvent, deleteEvent, updateEvent, type Priority } from "@/api/dayla";
import { useTasksStore } from "@/store/tasksStore";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  RECURRENCE_OPTIONS,
  formatTime,
  localTimezone,
  recurrenceOption,
  recurrenceRule,
  taskBounds,
  toISODate,
} from "@/utils/dates";
import { DateTimeField } from "./DateTimeField";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Обычный" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочно" },
];

export const TaskDialog: React.FC = () => {
  const { dialog, close, changed } = useTasksStore();
  const event = dialog.event;
  const [title, setTitle] = React.useState("");
  const [when, setWhen] = React.useState<{ date: string; time: string | null; endTime: string | null }>({ date: toISODate(new Date()), time: null, endTime: null });
  const [repeat, setRepeat] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!dialog.open) return;
    setError(null);
    if (event) {
      setTitle(event.title);
      setWhen({
        date: toISODate(new Date(event.start_at)),
        time: event.all_day ? null : formatTime(event.start_at),
        endTime: event.all_day ? null : formatTime(event.end_at),
      });
      setRepeat(recurrenceOption(event.recurrence_rule));
      setPriority(event.priority ?? "medium");
    } else {
      setTitle("");
      setWhen({ date: dialog.date ?? toISODate(new Date()), time: null, endTime: null });
      setRepeat("");
      setPriority("medium");
    }
  }, [dialog.open, dialog.date, event]);

  const save = async (submit: React.FormEvent) => {
    submit.preventDefault();
    if (!title.trim()) {
      setError("Введите название задачи");
      return;
    }
    setSaving(true);
    setError(null);
    const { start, end } = taskBounds(when.date, when.time, when.endTime);
    const values = { title: title.trim(), start_at: start, end_at: end, all_day: !when.time, timezone: localTimezone(), priority };
    try {
      if (event) {
        await updateEvent(event.id, values);
      } else {
        await createEvent({ ...values, recurrence_rule: recurrenceRule(repeat, when.date) });
      }
      changed();
      close();
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (scope: "one" | "series") => {
    if (!event) return;
    setSaving(true);
    try {
      await deleteEvent(event.id, scope);
      changed();
      close();
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={dialog.open} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              {event ? "Редактировать задачу" : "Новая задача"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Закрыть">
                <X size={18} />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Название, дата, время и повтор задачи</Dialog.Description>

          <form onSubmit={save} className="space-y-4">
            <Input autoFocus placeholder="Что нужно сделать?" aria-label="Название" value={title} onChange={(change) => setTitle(change.target.value)} maxLength={300} />
            <DateTimeField date={when.date} time={when.time} endTime={when.endTime} onChange={setWhen} withEndTime />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="block text-xs text-gray-500 dark:text-gray-400">Повтор</span>
                <Select value={repeat} onChange={(change) => setRepeat(change.target.value)} disabled={!!event}>
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1.5">
                <span className="block text-xs text-gray-500 dark:text-gray-400">Приоритет</span>
                <Select value={priority} onChange={(change) => setPriority(change.target.value as Priority)}>
                  {PRIORITIES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </label>
            </div>
            {!when.time && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Без времени задача попадёт в список «Задачи» на выбранный день.</p>
            )}
            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {event ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => remove("one")} disabled={saving}>
                    <Trash2 size={15} className="mr-1.5" />
                    {event.series_id ? "Удалить эту" : "Удалить"}
                  </Button>
                  {event.series_id && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => remove("series")} disabled={saving}>
                      Удалить серию
                    </Button>
                  )}
                </div>
              ) : (
                <span />
              )}
              <Button type="submit" isLoading={saving}>{event ? "Сохранить" : "Добавить"}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
