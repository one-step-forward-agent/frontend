import { useCallback, useEffect, useState } from "react";
import { Lock, LockOpen, Save, X } from "lucide-react";
import { api } from "@/app/api/client";
import type { AdminNote } from "@/app/api/types";
import { errorText } from "@/app/lib/format";
import { cn } from "@/utils/cn";

// While nobody edits here, the note is re-read: another admin's save or lock shows up
const POLL_MS = 20_000;

const time = (value: string | null) =>
  value ? new Date(value).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

/** The note all admins share. Editing: «Заблокировать» first (nobody else can change it meanwhile), then «Сохранить». */
export function NotesPanel({ onClose }: { onClose: () => void }) {
  const [note, setNote] = useState<AdminNote | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(note?.locked_by_me);

  const take = useCallback((next: AdminNote, keepDraft = false) => {
    setNote(next);
    if (!keepDraft) setDraft(next.text);
  }, []);

  useEffect(() => {
    api.admin.note().then((next) => take(next)).catch((err) => setError(errorText(err)));
  }, [take]);

  useEffect(() => {
    if (editing) return;
    const timer = window.setInterval(() => {
      api.admin.note().then((next) => take(next)).catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [editing, take]);

  const run = async (action: () => Promise<AdminNote>, keepDraft = false) => {
    setBusy(true);
    setError(null);
    try {
      take(await action(), keepDraft);
    } catch (err) {
      setError(errorText(err));
      // Someone else's lock or a newer version: show the note as it is now
      api.admin.note().then((next) => take(next, keepDraft)).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const lockedByOther = Boolean(note?.locked && !note.locked_by_me);
  const changed = editing && draft !== note?.text;

  return (
    <aside className="flex h-full w-full flex-col border-l border-gray-200 bg-white dark:border-white/10 dark:bg-gray-950" aria-label="Общие заметки администраторов">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-white/10">
        <h2 className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">Общие заметки</h2>
        <button type="button" onClick={onClose} aria-label="Скрыть заметки" className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">
          <X size={16} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]",
            editing
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
              : lockedByOther
                ? "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                : "bg-gray-50 text-gray-600 dark:bg-white/5 dark:text-gray-300",
          )}
          role="status"
        >
          {editing || lockedByOther ? <Lock size={14} /> : <LockOpen size={14} />}
          <span>
            {editing
              ? `Заблокировано вами до ${time(note!.lock_expires_at)} — другие не могут менять`
              : lockedByOther
                ? `Редактирует ${note!.locked_by} (до ${time(note!.lock_expires_at)})`
                : "Свободно: заблокируйте, чтобы редактировать"}
          </span>
        </div>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          readOnly={!editing}
          placeholder={editing ? "Заметки для всех администраторов…" : "Пока пусто"}
          aria-label="Текст общих заметок"
          className={cn(
            "min-h-0 flex-1 resize-none rounded-lg border p-3 text-[13px] leading-relaxed outline-none",
            editing
              ? "border-sky-400 bg-white text-gray-900 focus:ring-2 focus:ring-sky-400/40 dark:bg-gray-900 dark:text-gray-100"
              : "cursor-default border-gray-200 bg-gray-50 text-gray-700 dark:border-white/10 dark:bg-gray-900/60 dark:text-gray-300",
          )}
        />

        {note?.updated_at && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Изменено {time(note.updated_at)}
            {note.updated_by ? ` · ${note.updated_by}` : ""}
          </p>
        )}
        {error && (
          <p role="alert" className="text-[12px] text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          {editing ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => api.admin.unlockNote())}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10"
              title="Снять блокировку без сохранения"
            >
              <LockOpen size={15} /> Отменить
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !note || lockedByOther}
              onClick={() => run(() => api.admin.lockNote())}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-[13px] font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-white/15 dark:text-gray-100 dark:hover:bg-white/10"
            >
              <Lock size={15} /> Заблокировать
            </button>
          )}
          <button
            type="button"
            disabled={busy || !editing || !changed}
            onClick={() => run(() => api.admin.saveNote(draft, note!.version), true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            title={editing ? "Сохранить и снять блокировку" : "Сначала нажмите «Заблокировать»"}
          >
            <Save size={15} /> Сохранить
          </button>
        </div>
      </div>
    </aside>
  );
}
