import { tr } from "@/i18n";

export const EVENT_FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

export function pasteFiles(event: { clipboardData: DataTransfer; preventDefault: () => void }, attach: (files: File[]) => void) {
  const files = Array.from(event.clipboardData.files);
  if (!files.length) return;
  // Keep mixed clipboard text available to the browser's normal paste behavior.
  if (!event.clipboardData.getData("text/plain")) event.preventDefault();
  attach(files);
}

export function addTaskFiles(current: File[], selected: File[], onError: (error: string) => void): File[] {
  const next = [...current];
  const unsupported: string[] = [];
  for (const file of selected) {
    const suffix = file.name.includes(".") ? `.${file.name.split(".").pop()!.toLowerCase()}` : "";
    if (!EVENT_FILE_TYPES.split(",").includes(suffix)) unsupported.push(file.name);
    else if (!next.some(item => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) next.push(file);
  }
  onError(unsupported.length ? tr(`Неподдерживаемый тип файла: ${unsupported.join(", ")}`, `Unsupported file type: ${unsupported.join(", ")}`) : "");
  return next;
}
