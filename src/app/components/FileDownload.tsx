import { useRef, useState } from "react";
import { downloadFile } from "../api/client";
import { errorText } from "../lib/format";
import { useErrorToast } from "./ui";

export function FileDownload({ path, filename, className }: {
  path: string; filename: string; className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const showError = useErrorToast();
  return <button type="button" className={className} disabled={busy} aria-busy={busy} onClick={async () => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try { await downloadFile(path, filename); }
    catch (error) { showError(errorText(error)); }
    finally { working.current = false; setBusy(false); }
  }}>{filename}</button>;
}
