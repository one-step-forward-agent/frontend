import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Combine, Download, Eye, NotebookPen, RefreshCw, Search, ShieldAlert, Sheet as SheetIcon, X } from "lucide-react";
import { ApiError, api } from "@/app/api/client";
import { errorText } from "@/app/lib/format";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/theme";
import { cn } from "@/utils/cn";
import { ColumnMenu } from "./ColumnMenu";
import { CombineDialog } from "./CombineDialog";
import { Grid } from "./Grid";
import { NotesPanel } from "./NotesPanel";
import {
  columnLetter,
  columnStats,
  combine,
  display,
  emptyView,
  formatNumber,
  joinPlan,
  sheetFromTable,
  toCsv,
  viewRows,
  type ColumnType,
  type Sheet,
  type TableData,
  type TableInfo,
  type View,
} from "./sheet";

const WIDTHS: Record<ColumnType, number> = { number: 96, bool: 84, datetime: 170, date: 116, time: 96, json: 260, text: 190 };

const defaultWidths = (sheet: Sheet) => sheet.columns.map((column) => Math.max(WIDTHS[column.type], Math.min(320, column.name.length * 8 + 56)));

const toolButton =
  "inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] text-gray-700 hover:bg-gray-50 disabled:opacity-50 " +
  "dark:border-white/15 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/10";

function FullScreen({ children }: { children: ReactNode }) {
  return <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-gray-50 px-4 text-center dark:bg-gray-950">{children}</div>;
}

/** dayla.tech/dashboard: the database as a workbook for admins. Each table is a sheet; sheets combine by their
 * links; each column sorts, filters and counts; what is shown exports to CSV. Beside it, the admins' shared note. */
export default function AdminDashboard() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [state, setState] = useState<"loading" | "forbidden" | "error" | "ready">("loading");
  const [problem, setProblem] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [sheets, setSheets] = useState<Record<string, Sheet>>({});
  const [combined, setCombined] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [views, setViews] = useState<Record<string, View>>({});
  const [widths, setWidths] = useState<Record<string, number[]>>({});
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; column: number } | null>(null);
  const [menu, setMenu] = useState<{ column: number; anchor: DOMRect } | null>(null);
  const [notesOpen, setNotesOpen] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  const [combining, setCombining] = useState(false);
  const [combineBusy, setCombineBusy] = useState(false);
  const [combineError, setCombineError] = useState<string | null>(null);
  const [separator, setSeparator] = useState<"," | ";">(";");

  useEffect(() => {
    document.title = "Аналитика — Dayla";
  }, []);

  const loadTables = useCallback(async () => {
    try {
      const list = await api.admin.tables();
      setTables(list);
      setState("ready");
      setActive((current) => current ?? list.find((table) => table.name === "users")?.name ?? list[0]?.name ?? null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) setState("forbidden");
      else {
        setProblem(errorText(error));
        setState("error");
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadTables();
  }, [isAuthenticated, loadTables]);

  const addSheet = useCallback((sheet: Sheet) => {
    setSheets((current) => ({ ...current, [sheet.id]: sheet }));
    setViews((current) => (current[sheet.id] ? current : { ...current, [sheet.id]: emptyView() }));
    setWidths((current) => (current[sheet.id]?.length === sheet.columns.length ? current : { ...current, [sheet.id]: defaultWidths(sheet) }));
  }, []);

  const fetchTable = useCallback(async (name: string): Promise<TableData> => api.admin.table(name), []);

  // A table's rows load when its sheet opens
  useEffect(() => {
    if (!active || sheets[active] || combined.includes(active)) return;
    let cancelled = false;
    setLoadingSheet(true);
    fetchTable(active)
      .then((table) => !cancelled && addSheet(sheetFromTable(table)))
      .catch((error) => !cancelled && setProblem(errorText(error)))
      .finally(() => !cancelled && setLoadingSheet(false));
    return () => {
      cancelled = true;
    };
  }, [active, sheets, combined, fetchTable, addSheet]);

  const sheet = active ? sheets[active] : undefined;
  const view = (active && views[active]) || emptyView();
  const rows = useMemo(() => (sheet ? viewRows(sheet, view) : []), [sheet, view]);
  const visibleColumns = useMemo(() => (sheet ? sheet.columns.map((_, index) => index).filter((index) => !view.hidden.includes(index)) : []), [sheet, view.hidden]);
  const stats = useMemo(() => (sheet && selectedColumn !== null ? columnStats(sheet, selectedColumn, rows) : null), [sheet, selectedColumn, rows]);

  const changeView = (change: (view: View) => View) => {
    if (!active) return;
    setViews((current) => ({ ...current, [active]: change(current[active] ?? emptyView()) }));
  };

  const open = (id: string) => {
    setActive(id);
    setSelectedColumn(null);
    setSelectedCell(null);
    setMenu(null);
    setProblem(null);
  };

  const refresh = async () => {
    // Table sheets load again; combined sheets stay as they were made
    setSheets((current) => Object.fromEntries(Object.entries(current).filter(([id]) => combined.includes(id))));
    setProblem(null);
    await loadTables();
  };

  const makeCombined = async (order: string[], kind: "left" | "inner") => {
    setCombineBusy(true);
    setCombineError(null);
    try {
      const info = Object.fromEntries(tables.map((table) => [table.name, table]));
      const plan = joinPlan(order, info);
      if (plan.unlinked) throw new Error(`У таблицы «${plan.unlinked}» нет связи с выбранными`);
      const data = await Promise.all(order.map((name) => fetchTable(name)));
      const result = combine(data, plan.steps, kind);
      addSheet(result);
      setCombined((current) => [...current, result.id]);
      open(result.id);
      setCombining(false);
    } catch (error) {
      setCombineError(errorText(error));
    } finally {
      setCombineBusy(false);
    }
  };

  const closeCombined = (id: string) => {
    setCombined((current) => current.filter((item) => item !== id));
    setSheets((current) => {
      const { [id]: _removed, ...rest } = current;
      return rest;
    });
    if (active === id) open(tables[0]?.name ?? "");
  };

  const exportCsv = () => {
    if (!sheet) return;
    const blob = new Blob([toCsv(sheet, rows, visibleColumns, separator)], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sheet.title.replace(/[^\w.+-]+/g, "_")}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (isLoading) return <FullScreen><div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" /></FullScreen>;
  if (!isAuthenticated) return <Navigate to="/login?next=%2Fdashboard" replace />;
  if (state === "forbidden")
    return (
      <FullScreen>
        <ShieldAlert size={40} className="text-amber-500" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Раздел только для администраторов</h1>
        <p className="max-w-sm text-sm text-gray-600 dark:text-gray-400">У вашего аккаунта нет прав администратора. Если они нужны, обратитесь к администратору Dayla.</p>
        <Link to="/app" className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700">
          В приложение
        </Link>
      </FullScreen>
    );
  if (state === "error")
    return (
      <FullScreen>
        <p className="text-sm text-red-600 dark:text-red-400">{problem}</p>
        <button type="button" className={toolButton} onClick={() => loadTables()}>
          <RefreshCw size={14} /> Повторить
        </button>
      </FullScreen>
    );
  if (state === "loading") return <FullScreen><div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" /></FullScreen>;

  const viewChanged = view.sort || view.unique !== null || view.search || view.hidden.length || Object.keys(view.filters).length;
  const cellText = sheet && selectedCell ? display(sheet.rows[selectedCell.row][selectedCell.column], sheet.columns[selectedCell.column].type) : "";
  const cellName = sheet && selectedCell ? `${columnLetter(selectedCell.column)}${rows.indexOf(selectedCell.row) + 1}` : "";
  const tabs: { id: string; title: string; count: number; combined: boolean }[] = [
    ...tables.map((table) => ({ id: table.name, title: table.name, count: table.rows, combined: false })),
    ...combined.filter((id) => sheets[id]).map((id) => ({ id, title: sheets[id].title, count: sheets[id].rows.length, combined: true })),
  ];

  return (
    <div className="flex h-dvh flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* ─── Toolbar ─── */}
      <header className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-gray-900">
        <Link to="/app" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10" aria-label="В приложение" title="В приложение">
          <ArrowLeft size={18} />
        </Link>
        <SheetIcon size={20} className="text-emerald-600" aria-hidden="true" />
        <h1 className="mr-2 text-[15px] font-semibold">Dayla · Аналитика</h1>

        <div className="flex min-w-[180px] flex-1 items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2 dark:border-white/15 dark:bg-gray-950 sm:max-w-xs">
          <Search size={14} className="text-gray-400" />
          <input
            value={view.search}
            onChange={(event) => changeView((current) => ({ ...current, search: event.target.value }))}
            placeholder="Поиск по листу"
            aria-label="Поиск по листу"
            className="min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 dark:bg-transparent py-1.5 text-[13px] outline-none"
          />
        </div>

        {viewChanged ? (
          <button type="button" className={toolButton} onClick={() => changeView(() => emptyView())}>
            <X size={14} /> Сбросить вид
          </button>
        ) : null}
        <button type="button" className={toolButton} onClick={() => { setCombineError(null); setCombining(true); }}>
          <Combine size={14} /> Объединить таблицы
        </button>
        <div className="inline-flex">
          <button type="button" className={cn(toolButton, "rounded-r-none")} onClick={exportCsv} disabled={!sheet}>
            <Download size={14} /> Экспорт CSV
          </button>
          <select
            value={separator}
            onChange={(event) => setSeparator(event.target.value as "," | ";")}
            aria-label="Разделитель CSV"
            title="Разделитель: «;» открывается в русском Excel, «,» — стандартный CSV"
            className="rounded-r-md border border-l-0 border-gray-300 bg-white px-1.5 text-[13px] text-gray-700 dark:border-white/15 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value=";">;</option>
            <option value=",">,</option>
          </select>
        </div>
        <button type="button" className={toolButton} onClick={refresh} aria-label="Обновить данные" title="Обновить данные">
          <RefreshCw size={14} className={cn(loadingSheet && "animate-spin")} />
        </button>
        <button type="button" className={cn(toolButton, notesOpen && "border-sky-500 text-sky-700 dark:text-sky-300")} onClick={() => setNotesOpen((open) => !open)}>
          <NotebookPen size={14} /> Заметки
        </button>
        <ThemeToggle />
      </header>

      {/* ─── Formula bar: the whole value of the chosen cell ─── */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-1 text-[13px] dark:border-white/10">
        <span className="w-16 shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-center font-mono text-[12px] text-gray-600 dark:border-white/15 dark:text-gray-300">
          {cellName || "—"}
        </span>
        <span className="font-serif italic text-gray-400">fx</span>
        <input readOnly value={cellText} aria-label="Значение ячейки" className="min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 dark:bg-transparent py-0.5 font-mono text-[12px] outline-none" />
      </div>

      <div className="relative flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          {sheet?.truncated && (
            <div className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              В листе первые {sheet.rows.length.toLocaleString("ru-RU")} строк{sheet.combined ? " каждой таблицы" : ` из ${sheet.total.toLocaleString("ru-RU")}`}: функции и экспорт считают только их.
            </div>
          )}
          {problem && (
            <div role="alert" className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-[12px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {problem}
            </div>
          )}
          <div className="min-h-0 flex-1">
            {sheet ? (
              <Grid
                sheet={sheet}
                rows={rows}
                columns={visibleColumns}
                widths={widths[sheet.id] ?? defaultWidths(sheet)}
                view={view}
                selectedColumn={selectedColumn}
                selectedCell={selectedCell}
                onResize={(column, width) =>
                  setWidths((current) => {
                    const next = [...(current[sheet.id] ?? defaultWidths(sheet))];
                    next[column] = width;
                    return { ...current, [sheet.id]: next };
                  })
                }
                onSelectColumn={setSelectedColumn}
                onSelectCell={(row, column) => {
                  setSelectedCell({ row, column });
                  setSelectedColumn(column);
                }}
                onOpenMenu={(column, anchor) => setMenu({ column, anchor })}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
              </div>
            )}
          </div>

          {/* ─── Status bar ─── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 border-t border-gray-200 bg-gray-50 px-3 py-1 text-[12px] text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
            {sheet && (
              <span>
                Строк: <b className="tabular-nums">{rows.length.toLocaleString("ru-RU")}</b>
                {rows.length !== sheet.rows.length && <> из {sheet.rows.length.toLocaleString("ru-RU")}</>}
              </span>
            )}
            {view.hidden.length > 0 && (
              <button type="button" className="inline-flex items-center gap-1 text-sky-700 hover:underline dark:text-sky-400" onClick={() => changeView((current) => ({ ...current, hidden: [] }))}>
                <Eye size={12} /> Показать скрытые ({view.hidden.length})
              </button>
            )}
            {sheet && stats && selectedColumn !== null && (
              <span className="ml-auto flex flex-wrap gap-x-3 tabular-nums">
                <span className="font-medium">{sheet.columns[selectedColumn].name}:</span>
                <span>COUNT {formatNumber(stats.count)}</span>
                <span>UNIQUE {formatNumber(stats.unique)}</span>
                {stats.sum !== null && <span>SUM {formatNumber(stats.sum)}</span>}
                {stats.avg !== null && <span>AVG {formatNumber(stats.avg)}</span>}
                <span className="max-w-[220px] truncate">MIN {stats.min ?? "—"}</span>
                <span className="max-w-[220px] truncate">MAX {stats.max ?? "—"}</span>
              </span>
            )}
          </div>

          {/* ─── Sheets ─── */}
          <nav className="flex overflow-x-auto border-t border-gray-300 bg-gray-100 dark:border-white/15 dark:bg-gray-900" aria-label="Листы">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "flex shrink-0 items-center border-r border-gray-300 dark:border-white/10",
                  active === tab.id ? "bg-white font-semibold text-emerald-700 shadow-[inset_0_2px_0_#059669] dark:bg-gray-950 dark:text-emerald-400" : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-white/5",
                )}
              >
                <button type="button" onClick={() => open(tab.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px]" aria-current={active === tab.id ? "page" : undefined}>
                  {tab.combined && <Combine size={12} aria-hidden="true" />}
                  {tab.title}
                  <span className="tabular-nums font-normal text-gray-400">{tab.count.toLocaleString("ru-RU")}</span>
                </button>
                {tab.combined && (
                  <button type="button" onClick={() => closeCombined(tab.id)} aria-label={`Закрыть лист ${tab.title}`} className="mr-1 rounded p-0.5 text-gray-400 hover:bg-gray-300 hover:text-gray-700 dark:hover:bg-white/10">
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </nav>
        </main>

        {notesOpen && (
          <div className="absolute inset-0 z-30 lg:static lg:z-auto lg:w-96 lg:shrink-0">
            <NotesPanel onClose={() => setNotesOpen(false)} />
          </div>
        )}
      </div>

      {menu && sheet && (
        <ColumnMenu
          key={`${sheet.id}-${menu.column}`}
          sheet={sheet}
          view={view}
          column={menu.column}
          rows={rows}
          anchor={menu.anchor}
          onClose={() => setMenu(null)}
          onSort={(dir) => changeView((current) => ({ ...current, sort: dir ? { column: menu.column, dir } : null }))}
          onUnique={(on) => changeView((current) => ({ ...current, unique: on ? menu.column : null }))}
          onHide={() => {
            changeView((current) => ({ ...current, hidden: [...current.hidden, menu.column] }));
            setMenu(null);
          }}
          onFilter={(filter) =>
            changeView((current) => {
              const filters = { ...current.filters };
              if (filter) filters[menu.column] = filter;
              else delete filters[menu.column];
              return { ...current, filters };
            })
          }
        />
      )}

      {combining && <CombineDialog tables={tables} busy={combineBusy} error={combineError} onCombine={makeCombined} onClose={() => setCombining(false)} />}
    </div>
  );
}
