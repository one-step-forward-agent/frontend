import { useEffect, useRef } from "react";
import { addTaskFiles, EVENT_FILE_TYPES, pasteFiles } from "../lib/files";
import { formatSize } from "../lib/format";
import { Button } from "./ui";
import { Icon } from "./icons";
import { tr } from "@/i18n";

export function TaskFilePicker({ files, onChange, onError, disabled, uploadedCount = 0, recurring = false, label }: {
  files: File[];
  onChange: (files: File[]) => void;
  onError: (error: string) => void;
  disabled: boolean;
  uploadedCount?: number;
  recurring?: boolean;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const select = (selected: FileList | null) => {
    onChange(addTaskFiles(files, Array.from(selected ?? []), onError));
    if (input.current) input.current.value = "";
  };
  const container = useRef<HTMLDivElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = container.current?.closest("form");
    if (!form) return;
    const paste = (event: ClipboardEvent) => {
      if (disabled || !event.clipboardData || (event.target instanceof Element && event.target.matches(":disabled, [readonly]"))) return;
      pasteFiles({ clipboardData: event.clipboardData, preventDefault: () => event.preventDefault() }, selected => onChange(addTaskFiles(files, selected, onError)));
    };
    form.addEventListener("paste", paste);
    return () => form.removeEventListener("paste", paste);
  }, [disabled, files, onChange, onError]);
  return <div ref={container} className="space-y-2">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label ?? tr("Файлы к задаче", "Task attachments")}</p>
    <input ref={input} type="file" accept={EVENT_FILE_TYPES} multiple hidden disabled={disabled} onChange={event => select(event.target.files)} />
    <input ref={gallery} type="file" accept="image/png,image/jpeg" multiple hidden disabled={disabled} onChange={event => { select(event.target.files); event.target.value = ""; }} />
    <Button type="button" variant="ghost" icon="image" disabled={disabled} onClick={() => gallery.current?.click()}>{tr("Галерея", "Gallery")}</Button>
    <Button type="button" variant="ghost" icon="clip" disabled={disabled} onClick={() => input.current?.click()}>{tr("Прикрепить файлы", "Attach files")}</Button>
    <p className="text-xs text-gray-500 dark:text-gray-400">{tr("PDF, Word, Excel или изображения.", "PDF, Word, Excel or images.")}</p>
    {recurring && files.length > 0 && <p className="text-xs text-gray-500 dark:text-gray-400">{tr("Файлы прикрепятся к первому вхождению повторяющейся задачи.", "Files will be attached to the first occurrence of this recurring task.")}</p>}
    {uploadedCount > 0 && <p className="text-xs text-gray-500" role="status">{tr("Прикреплено файлов", "Files attached")}: {uploadedCount}</p>}
    {files.length > 0 && <ul className="space-y-2" aria-label={tr("Выбранные файлы", "Selected files")}>
      {files.map((file, index) => <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-300 p-2 dark:border-white/15">
        <Icon name="file" size={16} className="shrink-0" />
        <span className="min-w-0 flex-1 break-all text-sm">{file.name}</span>
        <span className="shrink-0 text-xs text-gray-500">{formatSize(file.size)}</span>
        <Button type="button" size="sm" variant="ghost" icon="close" disabled={disabled} aria-label={tr(`Убрать ${file.name}`, `Remove ${file.name}`)} onClick={() => { onChange(files.filter((_, item) => item !== index)); onError(""); }} />
      </li>)}
    </ul>}
  </div>;
}
