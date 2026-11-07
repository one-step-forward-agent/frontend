import { useEffect, useState } from "react";
import { tr } from "@/i18n";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { Button, ErrorNote } from "./ui";
import { errorText } from "../lib/format";

export function AssistantMemory() {
  const { setUser } = useAuth();
  const [notes, setNotes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    api.me.get().then(user => {
      if (active) setNotes(Array.isArray(user.profile?.assistant_memory) ? user.profile.assistant_memory.filter((x): x is string => typeof x === "string") : []);
    }).catch(e => { if (active) setError(errorText(e)); });
    return () => { active = false; };
  }, []);
  async function save() {
    if (!notes) return;
    setBusy(true); setError(""); setSaved(false);
    try {
      const user = await api.me.saveMemory(notes.filter(note => note.trim()));
      setUser(user);
      setNotes(user.profile?.assistant_memory as string[]);
      setSaved(true);
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  return <section className="mb-6 rounded-2xl border border-black/10 dark:border-white/10 p-4 sm:p-5" aria-labelledby="memory-title">
    <h2 id="memory-title" className="font-semibold">{tr("Что Deyla знает обо мне", "What Deyla knows about me")}</h2>
    <p className="text-sm text-gray-500 dark:text-gray-400 my-2">{tr(
      "Расскажите в чате о своём ритме, целях и предпочтениях. Deyla запомнит их для будущих планов, даже после очистки чата. Здесь можно изменить или удалить факты.",
      "Tell the assistant about your routine, goals and preferences. Deyla remembers them for future plans, even after clearing the chat. Edit or remove facts here."
    )}</p>
    {notes === null && !error && <p role="status">{tr("Загрузка…", "Loading…")}</p>}
    <fieldset disabled={busy} className="space-y-2">
      {notes?.map((note, index) => <div className="flex gap-2 items-start" key={index}>
        <textarea aria-label={`${tr("Факт", "Fact")} ${index + 1}`} value={note} maxLength={500} rows={2}
          className="min-w-0 w-full rounded-xl p-2 bg-transparent border border-gray-300 dark:border-gray-600 text-sm"
          onChange={e => { setNotes(notes.map((item, i) => i === index ? e.target.value : item)); setSaved(false); }} />
        <button type="button" className="p-2 text-sm underline" onClick={() => { setNotes(notes.filter((_, i) => i !== index)); setSaved(false); }}>{tr("Удалить", "Remove")}</button>
      </div>)}
      {notes !== null && <div className="flex flex-wrap gap-3 items-center">
        <Button type="button" disabled={notes.length >= 50} onClick={() => { setNotes([...notes, ""]); setSaved(false); }}>{tr("Добавить факт", "Add fact")}</Button>
        <Button type="button" onClick={save}>{busy ? tr("Сохранение…", "Saving…") : tr("Сохранить память", "Save memory")}</Button>
        {saved && <span role="status" className="text-sm">{tr("Память сохранена", "Memory saved")}</span>}
      </div>}
    </fieldset>
    {error && <ErrorNote message={error} />}
  </section>;
}
