import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "@/app/api/client";
import type { ProactivityQuestion, ProactivityQuestionSave } from "@/app/api/types";
import { errorText } from "@/app/lib/format";
import { tr } from "@/i18n";

const EMPTY: ProactivityQuestionSave = { text: "", text_en: null, prompts: [], prompts_en: [], group_id: null, scenario: null, active: true, position: 0 };
const field = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-gray-900";
const button = "rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10";
const SCENARIOS = { study: tr("Учёба", "Study"), work: tr("Работа", "Work"), personal: tr("Личные дела", "Personal"), day: tr("Планирование дня", "Day planning") };

export default function ProactivityAdmin() {
  const [questions, setQuestions] = useState<ProactivityQuestion[]>([]);
  const [form, setForm] = useState<ProactivityQuestionSave>(EMPTY);
  const [editing, setEditing] = useState<number>();
  const [group, setGroup] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setLoading(true);
    try { setQuestions((await api.proactivity.catalog()).questions); setError(null); }
    catch (err) { setError(errorText(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try { await api.proactivity.save({ ...form, prompts: form.prompts.map((p) => p.trim()).filter(Boolean), prompts_en: form.prompts_en.map((p) => p.trim()).filter(Boolean) }, editing); setForm(EMPTY); setEditing(undefined); await load(); }
    catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  };
  const toggle = async (q: ProactivityQuestion) => {
    setBusy(true);
    try { await api.proactivity.save({ ...q, active: !q.active }, q.id); await load(); }
    catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  };
  const remove = async (q: ProactivityQuestion) => {
    if (!window.confirm(tr("Удалить этот вопрос?", "Delete this question?"))) return;
    setBusy(true);
    try { await api.proactivity.remove(q.id); if (editing === q.id) { setEditing(undefined); setForm(EMPTY); } await load(); }
    catch (err) { setError(errorText(err)); }
    finally { setBusy(false); }
  };
  return <main className="min-h-dvh bg-white px-4 py-6 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/dashboard" className="text-sm text-blue-600">← {tr("Дашборд", "Dashboard")}</Link>
      <header className="space-y-2"><h1 className="text-2xl font-semibold">{tr("Проактивность Дейлы", "Deyla proactivity")}</h1>
        <p className="text-sm text-gray-500">{tr("Дейла начинает диалог после регистрации. Вопрос для конкретной UTM-группы имеет приоритет, затем — сценарий по ключевой фразе Яндекса, затем — общий вопрос. Telegram Ads без группы использует общие вопросы.", "Deyla starts a dialogue after registration. An exact UTM group takes priority, followed by the Yandex keyword scenario, then a general question. Telegram Ads without a group uses general questions.")}</p>
        <p className="text-sm text-gray-500">{tr("Один и тот же вопрос задаётся один раз. Следующие вопросы приходят не чаще раза в день; вместе с предложениями — до трёх сообщений в день. Задачи добавляются после подтверждения черновика.", "Each question is asked once. Further questions arrive at most daily, with up to three proactive messages per day including suggestions. Tasks are added after draft confirmation.")}</p>
      </header>
      {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-rose-600">{error}</p>}
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-gray-200 p-4 dark:border-white/10 md:grid-cols-2">
        <h2 className="font-semibold md:col-span-2">{editing ? tr("Изменить вопрос", "Edit question") : tr("Новый вопрос", "New question")}</h2>
        <label className="grid gap-1 text-sm">{tr("Вопрос на русском", "Question in Russian")}<textarea className={field} required minLength={3} maxLength={500} rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></label>
        <label className="grid gap-1 text-sm">{tr("Вопрос на английском (необязательно)", "Question in English (optional)")}<textarea className={field} maxLength={500} rows={3} value={form.text_en ?? ""} onChange={(e) => setForm({ ...form, text_en: e.target.value || null })} /></label>
        <label className="grid gap-1 text-sm">{tr("Подсказки для инструментов после ответа (до 6, по одной в строке)", "Tool prompts after the answer (up to 6, one per line)")}<textarea className={field} rows={4} value={form.prompts.join("\n")} onChange={(e) => setForm({ ...form, prompts: e.target.value.split("\n") })} /><span className="text-xs text-gray-500">{tr("Пусто — Дейла предложит календарь, задачи, напоминания и команды", "Empty — Deyla offers calendar, tasks, reminders and teams")}</span></label>
        <label className="grid gap-1 text-sm">{tr("Подсказки на английском", "Tool prompts in English")}<textarea className={field} rows={4} value={form.prompts_en.join("\n")} onChange={(e) => setForm({ ...form, prompts_en: e.target.value.split("\n") })} /></label>
        <label className="grid gap-1 text-sm">{tr("ID рекламной группы (utm_group)", "Advertising group ID (utm_group)")}<input className={field} maxLength={200} placeholder={tr("Пусто — все группы", "Empty — all groups")} value={form.group_id ?? ""} onChange={(e) => setForm({ ...form, group_id: e.target.value.trim() || null })} /></label>
        <label className="grid gap-1 text-sm">{tr("Сценарий по utm_term", "Scenario from utm_term")}<select className={field} value={form.scenario ?? ""} onChange={(e) => setForm({ ...form, scenario: (e.target.value || null) as ProactivityQuestionSave["scenario"] })}><option value="">{tr("Любой", "Any")}</option>{Object.entries(SCENARIOS).map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label>
        <label className="grid gap-1 text-sm">{tr("Порядок (меньше — раньше)", "Order (lower comes first)")}<input className={field} type="number" min={-10000} max={10000} value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} /></label>
        <div className="flex flex-wrap items-end gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />{tr("Включён", "Enabled")}</label><button disabled={busy} className={button}>{tr("Сохранить", "Save")}</button>{editing && <button type="button" className={button} onClick={() => { setEditing(undefined); setForm(EMPTY); }}>{tr("Отмена", "Cancel")}</button>}</div>
      </form>
      <label className="grid max-w-sm gap-1 text-sm">{tr("Фильтр по группе", "Filter by group")}<input className={field} value={group} onChange={(e) => setGroup(e.target.value)} placeholder="utm_group" /></label>
      {loading ? <p role="status">{tr("Загрузка…", "Loading…")}</p> : <div className="grid gap-3">
        {questions.filter((q) => !group || q.group_id === group).map((q) => <article key={q.id} className="space-y-2 rounded-2xl border border-gray-200 p-4 dark:border-white/10">
          <p className="text-xs text-gray-500">#{q.id} · {q.group_id ? `utm_group=${q.group_id}` : tr("Все группы", "All groups")} · {q.scenario ? SCENARIOS[q.scenario] : tr("Любой сценарий", "Any scenario")} · {q.active ? tr("Включён", "Enabled") : tr("Выключен", "Disabled")} · {tr("Спросили", "Asked")}: {q.asked}</p>
          <p className="whitespace-pre-wrap break-words font-medium">{q.text}</p>{q.text_en && <p className="whitespace-pre-wrap break-words text-sm text-gray-500">{q.text_en}</p>}
          {q.prompts.length > 0 && <ul className="list-inside list-disc text-sm text-gray-500">{q.prompts.map((prompt, index) => <li key={index}>{prompt}</li>)}</ul>}
          <div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={() => { setEditing(q.id); setForm({ ...q }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{tr("Изменить", "Edit")}</button><button className={button} disabled={busy} onClick={() => toggle(q)}>{q.active ? tr("Выключить", "Disable") : tr("Включить", "Enable")}</button><button className={button} disabled={busy} onClick={() => remove(q)}>{tr("Удалить", "Delete")}</button></div>
        </article>)}
        {!questions.some((q) => !group || q.group_id === group) && <p className="text-sm text-gray-500">{tr("Для этой группы вопросов пока нет", "No questions for this group yet")}</p>}
      </div>}
    </div>
  </main>;
}
