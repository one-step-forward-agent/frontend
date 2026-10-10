import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownAZ, ArrowDownZA, ArrowUpDown, CopyMinus, EyeOff, Funnel, FunnelX, Search, Sigma, X } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  OPERATORS,
  columnStats,
  formatNumber,
  uniqueValues,
  viewRows,
  type ColumnFilter,
  type Operator,
  type Sheet,
  type View,
} from "./sheet";

// Longer lists are cut: the value search finds the rest
const MAX_VALUES = 500;

interface ColumnMenuProps {
  sheet: Sheet;
  view: View;
  column: number;
  /** The rows the view shows now: the functions are computed over them */
  rows: number[];
  anchor: DOMRect;
  onSort: (dir: "asc" | "desc" | null) => void;
  onUnique: (on: boolean) => void;
  onHide: () => void;
  onFilter: (filter: ColumnFilter | undefined) => void;
  onClose: () => void;
}

const itemClass =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10";

/** Everything about one column, like Excel's filter menu: sorting, UNIQUE, the filter and the column's functions. */
export function ColumnMenu({ sheet, view, column, rows, anchor, onSort, onUnique, onHide, onFilter, onClose }: ColumnMenuProps) {
  const box = useRef<HTMLDivElement>(null);
  const current = view.filters[column];
  const info = sheet.columns[column];
  // The values the other filters leave, as Excel lists them
  const values = useMemo(() => uniqueValues(sheet, column, viewRows(sheet, view, column)), [sheet, view, column]);
  const stats = useMemo(() => columnStats(sheet, column, rows), [sheet, column, rows]);

  const [operator, setOperator] = useState<Operator>(current?.condition?.op ?? "contains");
  const [operand, setOperand] = useState(current?.condition?.value ?? "");
  const [checked, setChecked] = useState<Set<string>>(() => new Set(current?.values ?? values.map((item) => item.value)));
  const [find, setFind] = useState("");

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (box.current && !box.current.contains(event.target as Node)) onClose();
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", escape);
    };
  }, [onClose]);

  const shown = values.filter((item) => item.value.toLowerCase().includes(find.trim().toLowerCase()));
  const needsValue = OPERATORS.find((item) => item.value === operator)?.needsValue ?? true;

  const apply = () => {
    const filter: ColumnFilter = {};
    // Every value ticked is no filter on values
    if (checked.size < values.length) filter.values = [...checked];
    if (!needsValue || operand.trim()) filter.condition = { op: operator, value: operand.trim() };
    onFilter(filter.values || filter.condition ? filter : undefined);
    onClose();
  };

  const toggleShown = (on: boolean) => {
    const next = new Set(checked);
    for (const item of shown) (on ? next.add(item.value) : next.delete(item.value));
    setChecked(next);
  };

  // Under the column, kept inside the window
  const width = 330;
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - width - 8));
  const top = Math.min(anchor.bottom + 4, window.innerHeight - 200);

  const numeric = info.type === "number";
  const functions: [string, string, string][] = [
    ["COUNT", "непустых", formatNumber(stats.count)],
    ["COUNT DISTINCT", "уникальных", formatNumber(stats.unique)],
    ["COUNT NULL", "пустых", formatNumber(stats.blank)],
    ...(numeric
      ? ([
          ["SUM", "сумма", formatNumber(stats.sum)],
          ["AVG", "среднее", formatNumber(stats.avg)],
          ["MEDIAN", "медиана", formatNumber(stats.median)],
        ] as [string, string, string][])
      : []),
    ["MIN", "минимум", stats.min ?? "—"],
    ["MAX", "максимум", stats.max ?? "—"],
  ];

  return (
    <div
      ref={box}
      role="dialog"
      aria-label={`Столбец ${info.name}`}
      className="fixed z-50 flex max-h-[min(640px,calc(100vh-16px))] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/15 dark:bg-gray-900"
      style={{ left, top, width }}
    >
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-white/10">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white">{info.name}</span>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 dark:bg-white/10 dark:text-gray-400">{info.type}</span>
        <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">
          <X size={14} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {/* ─── Sorting, UNIQUE, hiding ─── */}
        <button type="button" className={cn(itemClass, view.sort?.column === column && view.sort.dir === "asc" && "bg-sky-50 dark:bg-sky-500/15")} onClick={() => onSort("asc")}>
          <ArrowDownAZ size={15} /> <span className="font-mono text-[11px] font-semibold">ASC</span> по возрастанию
        </button>
        <button type="button" className={cn(itemClass, view.sort?.column === column && view.sort.dir === "desc" && "bg-sky-50 dark:bg-sky-500/15")} onClick={() => onSort("desc")}>
          <ArrowDownZA size={15} /> <span className="font-mono text-[11px] font-semibold">DESC</span> по убыванию
        </button>
        {view.sort?.column === column && (
          <button type="button" className={itemClass} onClick={() => onSort(null)}>
            <ArrowUpDown size={15} /> Без сортировки
          </button>
        )}
        <button type="button" className={cn(itemClass, view.unique === column && "bg-violet-50 dark:bg-violet-500/15")} onClick={() => onUnique(view.unique !== column)}>
          <CopyMinus size={15} /> <span className="font-mono text-[11px] font-semibold">UNIQUE</span>
          {view.unique === column ? "снять: показать все строки" : "одна строка на значение"}
        </button>
        <button type="button" className={itemClass} onClick={onHide}>
          <EyeOff size={15} /> Скрыть столбец
        </button>

        {/* ─── Filter ─── */}
        <div className="mt-2 border-t border-gray-200 pt-2 dark:border-white/10">
          <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <Funnel size={12} /> Фильтр (WHERE)
          </div>
          <div className="flex gap-1.5 px-1">
            <select
              value={operator}
              onChange={(event) => setOperator(event.target.value as Operator)}
              className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-1.5 py-1 text-[12px] dark:border-white/15 dark:bg-gray-800 dark:text-gray-100"
              aria-label="Условие"
            >
              {OPERATORS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {needsValue && (
              <input
                value={operand}
                onChange={(event) => setOperand(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && apply()}
                placeholder={info.type === "datetime" || info.type === "date" ? "2026-10-01" : "значение"}
                className="w-28 rounded-md border border-gray-300 bg-white px-1.5 py-1 text-[12px] dark:border-white/15 dark:bg-gray-800 dark:text-gray-100"
                aria-label="Значение условия"
              />
            )}
          </div>

          <div className="mx-1 mt-2 flex items-center gap-1.5 rounded-md border border-gray-300 px-1.5 dark:border-white/15">
            <Search size={13} className="text-gray-400" />
            <input
              value={find}
              onChange={(event) => setFind(event.target.value)}
              placeholder="Найти значение"
              className="min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 dark:bg-transparent py-1 text-[12px] outline-none dark:text-gray-100"
              aria-label="Найти значение"
            />
          </div>
          <div className="mt-1 flex gap-3 px-1 text-[12px]">
            <button type="button" className="text-sky-700 hover:underline dark:text-sky-400" onClick={() => toggleShown(true)}>
              Выделить все
            </button>
            <button type="button" className="text-sky-700 hover:underline dark:text-sky-400" onClick={() => toggleShown(false)}>
              Снять все
            </button>
            <span className="ml-auto text-gray-400">{values.length} знач.</span>
          </div>
          <ul className="mx-1 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 py-1 dark:border-white/10">
            {shown.slice(0, MAX_VALUES).map((item) => (
              <li key={item.value}>
                <label className="flex cursor-pointer items-center gap-2 px-2 py-0.5 text-[12px] hover:bg-gray-50 dark:hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={checked.has(item.value)}
                    onChange={(event) => {
                      const next = new Set(checked);
                      if (event.target.checked) next.add(item.value);
                      else next.delete(item.value);
                      setChecked(next);
                    }}
                    className="accent-sky-600"
                  />
                  <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-100" title={item.value}>
                    {item.value}
                  </span>
                  <span className="tabular-nums text-gray-400">{item.count}</span>
                </label>
              </li>
            ))}
            {shown.length > MAX_VALUES && <li className="px-2 py-1 text-[11px] text-gray-400">…ещё {shown.length - MAX_VALUES}: уточните поиск</li>}
            {shown.length === 0 && <li className="px-2 py-1 text-[12px] text-gray-400">Ничего не найдено</li>}
          </ul>
          <div className="mt-2 flex gap-2 px-1">
            <button type="button" onClick={apply} className="flex-1 rounded-md bg-sky-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-sky-700">
              Применить
            </button>
            {current && (
              <button
                type="button"
                onClick={() => {
                  onFilter(undefined);
                  onClose();
                }}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10"
              >
                <FunnelX size={14} /> Сбросить
              </button>
            )}
          </div>
        </div>

        {/* ─── Functions ─── */}
        <div className="mt-2 border-t border-gray-200 pt-2 dark:border-white/10">
          <div className="mb-1 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <Sigma size={12} /> Функции по показанным строкам
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 px-1 text-[12px]">
            {functions.map(([name, hint, value]) => (
              <div key={name} className="contents">
                <dt className="font-mono text-[11px] font-semibold text-gray-600 dark:text-gray-300" title={hint}>
                  {name}
                </dt>
                <dd className="truncate text-right tabular-nums text-gray-900 dark:text-white" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
