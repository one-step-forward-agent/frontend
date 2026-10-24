// Импорт событий из файла .ics: из настроек — весь файл, из календаря — только показанный месяц или выбранный день
import { useRef, useState } from "react";
import { api } from "../api/client";
import type { IcsImportResult } from "../api/types";
import { Button, useErrorToast, useToast } from "./ui";
import { errorText } from "../lib/format";
import { notifyTasksChanged } from "../lib/hooks";
import { tr } from "@/i18n";

const MAX_ICS_MB = 5;
export const ICS_ACCEPT = ".ics,text/calendar";

export function IcsImportButton({
  dateFrom,
  dateTo,
  label = tr("Импорт из .ics", "Import from .ics"),
  title,
  size = "md",
  variant = "secondary",
  showResult = false,
  className,
}: {
  /** Только события этих дней (YYYY-MM-DD, включительно); без них — весь файл */
  dateFrom?: string;
  dateTo?: string;
  label?: string;
  title?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "ghost";
  /** Итог и «Отменить» под кнопкой; иначе — только всплывающее сообщение */
  showResult?: boolean;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IcsImportResult | null>(null);
  const [undone, setUndone] = useState<string | null>(null);
  const toast = useToast();
  const reportError = useErrorToast();

  const pick = async (file: File | undefined) => {
    if (input.current) input.current.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".ics") && file.type !== "text/calendar") {
      reportError(tr("Нужен файл календаря .ics", "An .ics calendar file is needed"));
      return;
    }
    if (file.size > MAX_ICS_MB * 1024 * 1024) {
      reportError(tr(`Файл больше ${MAX_ICS_MB} МБ`, `The file is larger than ${MAX_ICS_MB} MB`));
      return;
    }
    setBusy(true);
    try {
      const imported = await api.calendars.importIcs(file, { dateFrom, dateTo });
      setResult(imported);
      setUndone(null);
      if (imported.created) notifyTasksChanged();
      toast(imported.text);
    } catch (err) {
      reportError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    if (!result) return;
    setBusy(true);
    try {
      const { deleted } = await api.assistant.undo(result.event_ids);
      notifyTasksChanged();
      setResult(null);
      setUndone(
        deleted
          ? tr(`Импорт отменён — удалила ${deleted}.`, `Import undone — removed ${deleted}.`)
          : tr("Эти события уже удалены.", "These events are already deleted.")
      );
    } catch (err) {
      reportError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input ref={input} type="file" accept={ICS_ACCEPT} hidden onChange={(event) => pick(event.target.files?.[0])} />
      <Button
        variant={variant}
        size={size}
        icon="upload"
        busy={busy}
        title={title}
        className={className}
        onClick={() => input.current?.click()}
      >
        {label}
      </Button>
      {showResult && (result || undone) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span>{result?.text ?? undone}</span>
          {result && result.created > 0 && (
            <Button variant="ghost" size="sm" icon="left" disabled={busy} onClick={undo}>
              {tr("Отменить", "Undo")}
            </Button>
          )}
        </div>
      )}
    </>
  );
}
