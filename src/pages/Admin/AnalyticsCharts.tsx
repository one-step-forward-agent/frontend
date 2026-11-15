import { useEffect, useRef, useState } from "react";
import { LOCALE, tr } from "@/i18n";
import type { AnalyticsRow } from "./analyticsTypes";

export const CHART_COLORS = ["#10b981", "#3b82f6", "#a78bfa", "#f59e0b", "#ec4899", "#06b6d4"];
export const metricNumber = (v: unknown) => v == null ? "—" : typeof v === "number" ? v.toLocaleString(LOCALE, { maximumFractionDigits: 1 }) : String(v);

export function AnalyticsTable({ rows, columns }: { rows: object[]; columns?: string[] }) {
  const keys = columns || Object.keys(rows[0] || {});
  if (!rows.length) return <p className="py-6 text-sm text-gray-500">{tr("Нет данных за выбранный период", "No data for the selected period")}</p>;
  return <><div className="max-h-96 overflow-auto rounded-lg border border-gray-200 dark:border-white/10"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="sticky top-0 z-10 bg-gray-100 text-gray-500 dark:bg-gray-900"><tr>{keys.map(key => <th key={key} className="px-3 py-3 font-medium">{key.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{rows.slice(0, 500).map((row, i) => <tr key={i} className="border-t border-gray-100 dark:border-white/5">{keys.map(key => <td key={key} className="px-3 py-2.5">{metricNumber((row as AnalyticsRow)[key])}</td>)}</tr>)}</tbody></table></div>{rows.length > 500 && <p className="mt-2 text-xs text-gray-500">{tr("Показаны первые 500 строк. Экспорт содержит все строки.", "Showing the first 500 rows. Export includes all rows.")}</p>}</>;
}

export function AnalyticsChart({ rows, xKey = "date", series, kind = "line", label }: {
  rows: object[]; xKey?: string; series: { key: string; label: string }[]; kind?: "line" | "bar"; label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(260, entries[0].contentRect.width)));
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const measured = rows.some(row => series.some(s => typeof (row as AnalyticsRow)[s.key] === "number"));
  const allData = rows as AnalyticsRow[];
  const limit = 1000;
  const data = allData.length <= limit ? allData : Array.from({ length: limit }, (_, i) => allData[Math.round(i * (allData.length - 1) / (limit - 1))]);
  const left = 48, right = 15, top = 20, height = 245, bottom = 40;
  let min = 0, maximum = 1;
  for (const row of data) for (const s of series) {
    if (typeof row[s.key] === "number") { min = Math.min(min, Number(row[s.key])); maximum = Math.max(maximum, Number(row[s.key])); }
  }
  const max = maximum * 1.1;
  const y = (value: number) => height - bottom - (value - min) / (max - min) * (height - top - bottom);
  const x = (i: number) => left + (data.length === 1 ? .5 : i / Math.max(1, data.length - 1)) * (width - left - right);
  const compact = (n: number) => Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1)}m` : Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1)}k` : metricNumber(n);
  return <div ref={ref} className="min-w-0">{allData.length > limit && <p className="mb-2 text-xs text-gray-500">{tr("На графике 1 000 равномерно выбранных строк. CSV содержит все строки.", "Chart samples 1,000 evenly spaced rows. CSV includes every row.")}</p>}{!measured ? <p className="flex h-60 items-center justify-center text-sm text-gray-500">{tr("Нет измеренных данных", "No measured data")}</p> : <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={label}><title>{label}</title>{Array.from({ length: 5 }, (_, i) => {
    const value = min + (max - min) * i / 4;
    return <g key={i}><line x1={left} x2={width - right} y1={y(value)} y2={y(value)} stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeDasharray="3 4" /><text x={left - 8} y={y(value) + 4} textAnchor="end" fill="currentColor" className="text-gray-500" fontSize={10}>{compact(value)}</text></g>;
  })}{data.map((row, i) => (i % Math.max(1, Math.ceil(data.length / (width < 450 ? 3 : 6))) === 0 || i === data.length - 1) && <text key={i} x={x(i)} y={height - 13} textAnchor="middle" fill="currentColor" className="text-gray-500" fontSize={10}>{String(row[xKey]).match(/^\d{4}-\d{2}-\d{2}$/) ? String(row[xKey]).slice(5) : String(row[xKey]).slice(0, 13)}</text>)}{series.map((s, index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const step = (width - left - right) / Math.max(1, data.length);
    let drawing = "";
    data.forEach((row, i) => { drawing += typeof row[s.key] === "number" ? `${i && typeof data[i - 1][s.key] === "number" ? "L" : "M"}${x(i)},${y(Number(row[s.key]))} ` : ""; });
    return <g key={s.key}>{kind === "line" && <path d={drawing} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />}{data.map((row, i) => {
      if (typeof row[s.key] !== "number") return null;
      const value = Number(row[s.key]), tooltip = `${row[xKey]} · ${s.label}: ${metricNumber(value)}`;
      return kind === "bar" ? <rect key={i} x={left + step * (i + .15) + index * step * .7 / series.length} y={Math.min(y(value), y(0))} width={Math.max(.2, step * .7 / series.length)} height={Math.abs(y(0) - y(value))} rx={2} fill={color}><title>{tooltip}</title></rect> : <circle key={i} cx={x(i)} cy={y(value)} r={data.length > 100 ? 1.5 : 3} fill={color}><title>{tooltip}</title></circle>;
    })}</g>;
  })}</svg>}<div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">{series.map((s, i) => <span key={s.key} className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />{s.label}</span>)}</div></div>;
}

export function downloadAnalytics(rows: object[], name: string) {
  if (!rows.length) return;
  const columns = Object.keys(rows[0]);
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const csv = [columns, ...rows.map(row => columns.map(key => (row as AnalyticsRow)[key]))].map(row => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
