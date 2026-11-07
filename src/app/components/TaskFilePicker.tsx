import { useRef } from "react";
import { EVENT_FILE_TYPES } from "../lib/files";
import { formatSize } from "../lib/format";
import { Button } from "./ui";
import { Icon } from "./icons";
import { tr } from "@/i18n";

export function TaskFilePicker({ files, onChange, onError, disabled, uploadedCount = 0, recurring = false }: {
  files: File[];
  onChange: (files: File[]) => void;
  onError: (error: string) => void;
  disabled: boolean;
  uploadedCount?: number;
  recurring?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const select = (selected: FileList | null) => {
    const next = [...files];
    const unsupported: string[] = [];
    for (const file of Array.from(selected ?? [])) {
      const suffix = file.name.includes(".") ? `.${file.name.split(".").pop()!.toLowerCase()}` : "";
      if (!EVENT_FILE_TYPES.split(",").includes(suffix)) unsupported.push(file.name);
      else if (!next.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) next.push(file);
    }
    onChange(next);
    onError(unsupported.length ? tr(`Неподдерживаемый тип файла: ${unsupported.join(", ")}`, `Unsupported file type: ${unsupported.join(", ")}`) : "");
    if (input.current) input.current.value = "";
  };
  return <div className="space-y-2">
    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{tr("Файлы к задаче", "Task attachments")}</p>
    <input ref={input} type="file" accept={EVENT_FILE_TYPES} multiple hidden disabled={disabled} onChange={event => select(event.target.files)} />
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
