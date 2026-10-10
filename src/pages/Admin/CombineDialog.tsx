import { useEffect, useState } from "react";
import { Combine, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { joinPlan, type TableInfo } from "./sheet";

interface CombineDialogProps {
  tables: TableInfo[];
  busy: boolean;
  error: string | null;
  onCombine: (order: string[], kind: "left" | "inner") => void;
  onClose: () => void;
}

/** Choose tables (the first one chosen is the base) and how to join them; the links come from foreign keys. */
export function CombineDialog({ tables, busy, error, onCombine, onClose }: CombineDialogProps) {
  const [order, setOrder] = useState<string[]>([]);
  const [kind, setKind] = useState<"left" | "inner">("left");
  const info = Object.fromEntries(tables.map((table) => [table.name, table]));
  const plan = order.length > 1 ? joinPlan(order, info) : null;

  useEffect(() => {
    const escape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose]);

  const toggle = (name: string) => setOrder((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  // Tables linked to the ones chosen: picking them next works
  const linked = new Set(
    order.length
      ? tables.filter((table) => !order.includes(table.name) && joinPlan([...order, table.name], info).unlinked === null).map((table) => table.name)
      : tables.map((table) => table.name),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-label="Объединить таблицы" className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 dark:border-white/10">
          <Combine size={18} className="text-sky-600" />
          <h2 className="flex-1 text-base font-semibold text-gray-900 dark:text-white">Объединить таблицы</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[13px] text-gray-600 dark:text-gray-300">
            Отметьте таблицы по порядку: первая — основная, к ней присоединяются следующие по связям (внешним ключам). Таблицы без связи с уже выбранными
            приглушены.
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {tables.map((table) => {
              const position = order.indexOf(table.name);
              const chosen = position >= 0;
              return (
                <button
                  key={table.name}
                  type="button"
                  onClick={() => toggle(table.name)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors",
                    chosen
                      ? "border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-500/15 dark:text-sky-100"
                      : "border-gray-200 text-gray-800 hover:bg-gray-50 dark:border-white/10 dark:text-gray-100 dark:hover:bg-white/5",
                    !chosen && !linked.has(table.name) && "opacity-40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                      chosen ? "bg-sky-600 text-white" : "border border-gray-300 dark:border-white/20",
                    )}
                  >
                    {chosen ? position + 1 : ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{table.name}</span>
                  <span className="tabular-nums text-[11px] text-gray-400">{table.rows}</span>
                </button>
              );
            })}
          </div>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-gray-500">Строки</legend>
            {(
              [
                ["left", "LEFT JOIN", "все строки первой таблицы, даже без пары"],
                ["inner", "INNER JOIN", "только строки, у которых есть пара во всех таблицах"],
              ] as const
            ).map(([value, label, hint]) => (
              <label key={value} className="flex cursor-pointer items-start gap-2 py-1 text-[13px] text-gray-800 dark:text-gray-100">
                <input type="radio" name="join" checked={kind === value} onChange={() => setKind(value)} className="mt-0.5 accent-sky-600" />
                <span>
                  <span className="font-mono text-[12px] font-semibold">{label}</span> — {hint}
                </span>
              </label>
            ))}
          </fieldset>

          {plan && (
            <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-[12px] text-gray-700 dark:bg-white/5 dark:text-gray-300">
              <div>FROM {order[0]}</div>
              {plan.steps.map((step) => (
                <div key={step.table}>
                  {kind === "left" ? "LEFT" : "INNER"} JOIN {step.table} ON {step.on}
                </div>
              ))}
              {plan.unlinked && <div className="mt-1 font-sans text-red-600 dark:text-red-400">У таблицы «{plan.unlinked}» нет связи с выбранными перед ней.</div>}
            </div>
          )}
          {error && (
            <p role="alert" className="mt-3 text-[13px] text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-white/10">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">
            Отмена
          </button>
          <button
            type="button"
            disabled={busy || order.length < 2 || Boolean(plan?.unlinked)}
            onClick={() => onCombine(order, kind)}
            className="rounded-md bg-sky-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {busy ? "Собираем…" : "Создать лист"}
          </button>
        </div>
      </div>
    </div>
  );
}
