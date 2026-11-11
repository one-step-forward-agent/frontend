import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { api } from "../api/client";
import type { CompletionReport as Report } from "../api/types";
import { COMPLETION_REPORT, COMPLETION_SAVED, offerCompletionReport, type CompletionTarget } from "../lib/completion";
import { errorText, formatSize } from "../lib/format";
import { useAsync } from "../lib/hooks";
import { Button, ConfirmButton, Dialog, ErrorNote, Field, Loading } from "./ui";
import { TaskFilePicker } from "./TaskFilePicker";
import { tr } from "@/i18n";

export function CompletionReportProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<CompletionTarget[]>([]);
  useEffect(() => {
    const open = (event: Event) => {
      const target = (event as CustomEvent<CompletionTarget>).detail;
      setQueue(current => current.some(item => item.path === target.path) ? current : [...current, target]);
    };
    window.addEventListener(COMPLETION_REPORT, open);
    return () => window.removeEventListener(COMPLETION_REPORT, open);
  }, []);
  const target = queue[0];
  const close = () => setQueue(current => current.slice(1));
  return <>{children}
    <Dialog open={!!target} title={tr("Итоги выполнения", "Completion report")} onClose={close}>
      {target && <ReportEditor key={target.path} target={target} onClose={close} />}
    </Dialog>
  </>;
}

function ReportFiles({ files, onRemove, busy }: { files: Report["files"]; onRemove?: (id: number) => void; busy?: boolean }) {
  return <ul className="space-y-2">{files.map(file => <li key={file.id} className="flex min-w-0 items-center gap-2 text-sm">
    <a href={`/api/completion-files/${file.id}`} download className="min-w-0 flex-1 break-all text-sky-700 underline dark:text-sky-300">{file.filename}</a>
    <span className="shrink-0 text-xs text-gray-500">{formatSize(file.size)}</span>
    {onRemove && <ConfirmButton icon="trash" size="sm" label={tr("Удалить файл", "Delete file")} busy={busy} onConfirm={() => onRemove(file.id)} />}
  </li>)}</ul>;
}

function ReportEditor({ target, onClose }: { target: CompletionTarget; onClose: () => void }) {
  const loaded = useAsync(() => api.completion.get(target.path), [target.path]);
  const [tools, setTools] = useState("");
  const [conclusions, setConclusions] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (!loaded.data || initialized.current) return;
    initialized.current = true;
    setTools(loaded.data.tools); setConclusions(loaded.data.conclusions); setNote(loaded.data.note);
  }, [loaded.data]);
  const saved = () => window.dispatchEvent(new Event(COMPLETION_SAVED));
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (working.current) return;
    working.current = true; setBusy(true); setError("");
    let textSaved = false;
    try {
      loaded.setData(await api.completion.save(target.path, { tools, conclusions, note }));
      textSaved = true; saved();
      for (const file of files) {
        loaded.setData(await api.completion.upload(target.path, file));
        setFiles(current => current.filter(item => item !== file));
        saved();
      }
      onClose();
    } catch (failure) {
      setError((textSaved ? tr("Текст сохранён. Не все файлы прикреплены; повторите загрузку или уберите их из списка. ", "Text saved. Some files were not attached; retry or remove them from the list. ") : "") + errorText(failure));
    } finally { working.current = false; setBusy(false); }
  };
  const remove = async (id: number) => {
    if (working.current) return;
    working.current = true; setBusy(true); setError("");
    try { await api.completion.removeFile(id); await loaded.reload(); saved(); }
    catch (failure) { setError(errorText(failure)); }
    finally { working.current = false; setBusy(false); }
  };
  return <div className="max-h-[65dvh] overflow-y-auto pr-1">
    <p className="mb-2 break-words font-medium">{target.title}</p>
    <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">{tr("Задача уже выполнена. Отчёт необязателен — можно закрыть окно и добавить итоги позже.", "The task is already completed. This report is optional; close it and add the results later if you prefer.")}</p>
    {loaded.loading && !loaded.data ? <Loading /> : loaded.error ? <ErrorNote message={loaded.error} onRetry={loaded.reload} /> : loaded.data && <form onSubmit={save} className="form">
      <fieldset disabled={busy || !loaded.data.can_edit} className="space-y-3">
        <Field label={tr("Использованные инструменты", "Tools used")}><textarea rows={2} maxLength={4000} value={tools} onChange={e => setTools(e.target.value)} placeholder={tr("Программы, методы или материалы", "Software, methods or resources")} /></Field>
        <Field label={tr("Результаты и выводы", "Results and conclusions")}><textarea rows={3} maxLength={10000} value={conclusions} onChange={e => setConclusions(e.target.value)} /></Field>
        <Field label={tr("Пояснительная записка", "Explanatory note")}><textarea rows={3} maxLength={10000} value={note} onChange={e => setNote(e.target.value)} /></Field>
      </fieldset>
      <ReportFiles files={loaded.data.files} busy={busy} onRemove={loaded.data.can_edit ? remove : undefined} />
      {loaded.data.can_edit && <TaskFilePicker files={files} onChange={setFiles} onError={setError} disabled={busy} uploadedCount={loaded.data.files.length} />}
      {error && <ErrorNote message={error} />}
      <div className="flex flex-wrap gap-2">
        {loaded.data.can_edit && <Button type="submit" variant="primary" busy={busy}>{tr("Сохранить итоги", "Save report")}</Button>}
        <Button onClick={onClose} disabled={busy}>{tr("Пропустить", "Skip")}</Button>
      </div>
    </form>}
  </div>;
}

export function CompletionReportSection({ target }: { target: CompletionTarget }) {
  const report = useAsync(() => api.completion.get(target.path), [target.path]);
  useEffect(() => {
    window.addEventListener(COMPLETION_SAVED, report.reload);
    return () => window.removeEventListener(COMPLETION_SAVED, report.reload);
  }, [report.reload]);
  return <section className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-white/10">
    <h3 className="font-medium">{tr("Итоги выполнения", "Completion report")}</h3>
    {report.loading && !report.data && <Loading />}
    {report.error && <ErrorNote message={report.error} onRetry={report.reload} />}
    {report.data && <>
      {([ [tr("Инструменты", "Tools"), report.data.tools], [tr("Результаты и выводы", "Results and conclusions"), report.data.conclusions], [tr("Пояснительная записка", "Explanatory note"), report.data.note] ] as const).filter(([, text]) => !!text).map(([label, text]) => <div key={label}><p className="text-xs text-gray-500">{label}</p><p className="whitespace-pre-wrap break-words text-sm">{text}</p></div>)}
      {!report.data.tools && !report.data.conclusions && !report.data.note && !report.data.files.length && <p className="text-sm text-gray-500">{tr("Итоги пока не добавлены", "No report added yet")}</p>}
      <ReportFiles files={report.data.files} />
      {report.data.can_edit && <Button size="sm" onClick={() => offerCompletionReport(target)}>{tr("Дополнить итоги", "Add or edit report")}</Button>}
    </>}
  </section>;
}

export function CompletionReportDetails({ target }: { target: CompletionTarget }) {
  const [open, setOpen] = useState(false);
  return <details className="mt-2" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer text-sm text-sky-700 dark:text-sky-300">{tr("Итоги выполнения", "Completion report")}</summary>
    {open && <CompletionReportSection target={target} />}
  </details>;
}
