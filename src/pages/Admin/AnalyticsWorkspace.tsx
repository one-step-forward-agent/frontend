import { useEffect, useRef, useState } from "react";
import { Download, Play, Square } from "lucide-react";
import { tr } from "@/i18n";
import { AnalyticsChart, AnalyticsTable, downloadAnalytics } from "./AnalyticsCharts";
import type { AnalysisResult, AnalyticsResponse } from "./analyticsTypes";

const examples = {
  sql: `-- These tables already reflect the selected dates and timezone.\nSELECT date, extended_dau, llm_requests, total_users\nFROM daily\nWHERE date BETWEEN :start_date AND :end_date\nORDER BY date;`,
  python: `# pd is pandas; tables contains the aggregated analytics tables.\nresult = daily[["date", "extended_dau", "llm_requests"]].copy()\nresult["requests_per_user"] = (\n    result["llm_requests"] / result["extended_dau"].replace(0, float("nan"))\n).round(2)`,
};
const control = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-gray-900";

export function AnalyticsWorkspace({ data }: { data: AnalyticsResponse }) {
  const [language, setLanguage] = useState<"sql" | "python">("sql");
  const [code, setCode] = useState(examples.sql);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [x, setX] = useState(""); const [ys, setYs] = useState<string[]>([]);
  const [kind, setKind] = useState<"line" | "bar">("line");
  const [status, setStatus] = useState("");
  const worker = useRef<Worker | null>(null), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stop = () => { worker.current?.terminate(); worker.current = null; clearTimeout(timer.current); setBusy(false); };
  useEffect(() => () => { worker.current?.terminate(); clearTimeout(timer.current); }, []);
  useEffect(() => { stop(); setResult(null); setError(""); setStatus(""); }, [data]);
  const run = () => {
    stop(); setBusy(true); setError(""); setResult(null); setStatus(tr("Загрузка Python и pandas…", "Loading Python and pandas…"));
    // A fresh worker per run clears data and Python globals; Stop terminates infinite loops.
    const instance = new Worker("/analytics-worker.js", { type: "module" }); worker.current = instance;
    timer.current = setTimeout(() => { stop(); setError(tr("Выполнение остановлено через 120 секунд. Сократите запрос или повторите после загрузки среды.", "Stopped after 120 seconds. Reduce your query or retry after the runtime is cached.")); }, 120000);
    instance.onerror = () => { stop(); setError(tr("Не удалось загрузить среду. Проверьте подключение и повторите.", "Could not load the runtime. Check your connection and retry.")); };
    instance.onmessage = ({ data: message }) => {
      if (message.status) return;
      stop(); setStatus("");
      if (message.error) { setError(String(message.error)); return; }
      const output = message.result as AnalysisResult;
      if (!output || !Array.isArray(output.rows) || !Array.isArray(output.columns) || output.rows.length > 10000) { setError(tr("Неверный результат", "Invalid result")); return; }
      setResult(output); setX(output.columns[0] || "");
      setYs(output.columns.filter(key => output.rows.some(row => typeof row[key] === "number")).slice(0, 1));
    };
    instance.postMessage({ language, code, columns: schemas, start_date: data.start_date, end_date: data.end_date, timezone: data.timezone,
      tables: { daily: data.daily, model_daily: data.model_daily, goals: data.goals, goals_daily: data.goals_daily, purposes: data.purposes } });
  };
  const schemas = { daily: Object.keys(data.daily[0] || {}), model_daily: ["date", "model", "requests", "prompt_tokens", "completion_tokens", "cached_tokens", "total_tokens"], goals: ["goal", "category", "actions", "unique_users"], goals_daily: ["date", "goal", "unique_users"], purposes: ["purpose", "requests"] };
  return <section aria-labelledby="workspace-title" className="space-y-5"><div><h2 id="workspace-title" className="text-lg font-semibold">{tr("Python и SQL · графики по вашим данным", "Python & SQL · charts from your data")}</h2><p className="mt-2 text-sm text-gray-500">{tr("Выберите период выше, выполните код и задайте оси графика. Доступны агрегированные таблицы без персональных данных.", "Choose the period above, run code, and select chart axes. Aggregated tables contain no personal data.")}</p></div><div className="grid gap-5 lg:grid-cols-[1fr_260px]"><div className="min-w-0"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><select className={control} aria-label={tr("Язык кода", "Code language")} value={language} onChange={e => { const lang = e.target.value as "sql" | "python"; setLanguage(lang); setCode(examples[lang]); }}><option value="sql">SQL · SQLite</option><option value="python">Python · pandas</option></select><button className={control} onClick={() => setCode(examples[language])}>{tr("Пример", "Load example")}</button></div><textarea aria-label={tr("Код анализа", "Analysis code")} value={code} onChange={e => setCode(e.target.value)} spellCheck={false} className="min-h-72 w-full resize-y rounded-xl border border-gray-700 bg-gray-950 p-4 font-mono text-xs leading-6 text-emerald-100 outline-offset-2 focus:outline focus:outline-2 focus:outline-emerald-500" onKeyDown={e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); if (!busy) run(); }
      if (e.key === "Tab") { e.preventDefault(); const el = e.currentTarget, start = el.selectionStart, end = el.selectionEnd; setCode(code.slice(0, start) + "    " + code.slice(end)); requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4; }); }
    }} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-gray-500" role="status">{busy ? status : tr("Выполнение в браузере · Ctrl+Enter · SQL только для чтения", "Runs in your browser · Ctrl+Enter · read-only SQL")}</span><div className="flex gap-2">{busy && <button className={control + " inline-flex items-center gap-2"} onClick={() => { stop(); setStatus(""); }}><Square size={13} />{tr("Остановить", "Stop")}</button>}<button disabled={busy} onClick={run} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"><Play size={14} />{tr("Выполнить", "Run analysis")}</button></div></div></div><aside className="max-h-96 overflow-auto rounded-xl bg-gray-50 p-4 text-xs dark:bg-gray-950"><h3 className="mb-3 font-semibold">{tr("Доступные таблицы", "Available tables")}</h3>{Object.entries(schemas).map(([name, columns]) => <details key={name} className="mb-3"><summary className="cursor-pointer font-mono text-emerald-600 dark:text-emerald-400">{name}</summary><p className="mt-2 break-words font-mono leading-5 text-gray-500">{columns.join(", ")}</p></details>)}<p className="mt-4 leading-5 text-gray-500">{tr("Python: pd, tables, start_date, end_date, timezone. Результат — DataFrame в result. SQL: :start_date, :end_date, :timezone.", "Python: pd, tables, start_date, end_date, timezone. Assign a DataFrame to result. SQL: :start_date, :end_date, :timezone.")}</p><p className="mt-3 leading-5 text-gray-500">{tr("Среда загружается при первом запуске. Код не выполняется на сервере. Лимит: 10 000 строк, 5 МБ, 120 секунд.", "The runtime downloads on first use. Code never runs on the server. Limits: 10,000 rows, 5 MB, 120 seconds.")}</p></aside></div>{error && <pre role="alert" className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-red-50 p-4 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</pre>}{result && <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-medium">{tr("Результат", "Result")} · {result.rows.length} {tr("строк", "rows")}</h3><button className={control + " inline-flex items-center gap-2"} onClick={() => downloadAnalytics(result.rows, "analytics-result.csv")}><Download size={14} />CSV</button></div>{result.rows.length > 0 && <><div className="flex flex-wrap items-start gap-4"><label className="text-xs">X<select className={control + " ml-2"} aria-label="X axis" value={x} onChange={e => setX(e.target.value)}>{result.columns.map(c => <option key={c}>{c}</option>)}</select></label><fieldset className="flex flex-wrap gap-3 text-xs"><legend className="mb-2">Y</legend>{result.columns.filter(c => result.rows.some(row => typeof row[c] === "number")).map(c => <label key={c} className="inline-flex items-center gap-1.5"><input type="checkbox" checked={ys.includes(c)} onChange={e => setYs(e.target.checked ? [...ys, c] : ys.filter(y => y !== c))} />{c}</label>)}</fieldset><select className={control} aria-label={tr("Тип графика", "Chart type")} value={kind} onChange={e => setKind(e.target.value as "line" | "bar")}><option value="line">{tr("Линии", "Line")}</option><option value="bar">{tr("Столбцы", "Bar")}</option></select></div>{ys.length > 0 && <AnalyticsChart rows={result.rows} xKey={x} series={ys.map(key => ({ key, label: key }))} kind={kind} label={tr("График результата анализа", "Analysis result chart")} />}</>}<AnalyticsTable rows={result.rows} columns={result.columns} /></div>}</section>;
}
