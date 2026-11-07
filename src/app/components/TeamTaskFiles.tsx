import { useState } from "react";
import { api } from "../api/client";
import { formatSize } from "../lib/format";
import { useAction, useAsync } from "../lib/hooks";
import { ConfirmButton, ErrorNote, Loading, useErrorToast } from "./ui";
import { tr } from "@/i18n";

export function TeamTaskFiles({ teamId, taskId, count, canManage, onChanged }: {
  teamId: number; taskId: number; count: number; canManage: boolean; onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const files = useAsync(() => open ? api.teams.taskFiles(teamId, taskId) : Promise.resolve([]), [teamId, taskId, open, count]);
  const { pending, run } = useAction(useErrorToast());
  return <details className="mt-2 text-sm" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer text-sky-700 dark:text-sky-300">{tr("Файлы", "Files")} · {count}</summary>
    {open && <div className="mt-2 space-y-2">
      {files.loading && <Loading />}
      {files.error && <ErrorNote message={files.error} onRetry={files.reload} />}
      {files.data?.map(file => <div key={file.id} className="flex min-w-0 items-center gap-2">
        <a className="min-w-0 flex-1 break-all underline" href={`/api/teams/${teamId}/tasks/${taskId}/files/${file.id}`} download>{file.filename}</a>
        <span className="shrink-0 text-xs text-gray-500">{formatSize(file.size)}</span>
        {canManage && <ConfirmButton size="sm" icon="trash" label={tr("Удалить файл", "Delete file")} busy={pending === String(file.id)} onConfirm={async () => {
          if (await run(String(file.id), async () => { await api.teams.removeTaskFile(teamId, taskId, file.id); return true; })) { files.reload(); onChanged(); }
        }} />}
      </div>)}
    </div>}
  </details>;
}
