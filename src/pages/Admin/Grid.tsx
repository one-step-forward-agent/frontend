import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDown, ArrowUp, ChevronDown, CopyMinus, Funnel } from "lucide-react";
import { cn } from "@/utils/cn";
import { columnLetter, display, type Sheet, type View } from "./sheet";

export const ROW_HEIGHT = 28;
const HEADER_HEIGHT = 46;
const NUMBER_WIDTH = 60;
// Rows drawn above and below the visible ones, so fast scrolling does not show gaps
const OVERSCAN = 10;

interface GridProps {
  sheet: Sheet;
  rows: number[];
  columns: number[];
  widths: number[];
  view: View;
  selectedColumn: number | null;
  selectedCell: { row: number; column: number } | null;
  onResize: (column: number, width: number) => void;
  onSelectColumn: (column: number) => void;
  onSelectCell: (row: number, column: number) => void;
  onOpenMenu: (column: number, anchor: DOMRect) => void;
}

/** A spreadsheet: letters and names on top, row numbers on the left, only the visible rows drawn. */
export function Grid({ sheet, rows, columns, widths, view, selectedColumn, selectedCell, onResize, onSelectColumn, onSelectCell, onOpenMenu }: GridProps) {
  const box = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.clientHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Another sheet: its top-left corner; other filters: back to the top
  useEffect(() => {
    box.current?.scrollTo({ top: 0, left: 0 });
    setScrollTop(0);
  }, [sheet.id]);
  useEffect(() => {
    box.current?.scrollTo({ top: 0 });
    setScrollTop(0);
  }, [rows.length]);

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(rows.length, Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN);
  const template = `${NUMBER_WIDTH}px ${columns.map((index) => `${widths[index]}px`).join(" ")}`;
  const width = NUMBER_WIDTH + columns.reduce((total, index) => total + widths[index], 0);

  const startResize = (event: ReactPointerEvent, column: number) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = widths[column];
    const move = (moved: PointerEvent) => onResize(column, Math.max(60, Math.min(800, startWidth + moved.clientX - startX)));
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  return (
    <div ref={box} className="relative h-full overflow-auto overscroll-contain" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
      <div className="relative" style={{ width, height: HEADER_HEIGHT + rows.length * ROW_HEIGHT }}>
        {/* ─── Header ─── */}
        <div
          className="sticky top-0 z-20 grid border-b border-gray-300 bg-gray-50 dark:border-white/15 dark:bg-gray-900"
          style={{ gridTemplateColumns: template, height: HEADER_HEIGHT, width }}
          role="row"
        >
          <div className="sticky left-0 z-10 border-r border-gray-300 bg-gray-100 dark:border-white/15 dark:bg-gray-800" />
          {columns.map((index) => {
            const column = sheet.columns[index];
            const sort = view.sort?.column === index ? view.sort.dir : null;
            const filtered = Boolean(view.filters[index]);
            return (
              <div
                key={index}
                role="columnheader"
                className={cn(
                  "group relative flex min-w-0 cursor-pointer select-none items-center gap-1 border-r border-gray-200 px-2 dark:border-white/10",
                  selectedColumn === index ? "bg-sky-100 dark:bg-sky-500/20" : "hover:bg-gray-100 dark:hover:bg-white/5",
                )}
                onClick={() => onSelectColumn(index)}
                title={`${column.name} · ${column.type}`}
              >
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{columnLetter(index)}</div>
                  <div className="truncate text-[13px] font-semibold text-gray-800 dark:text-gray-100">{column.name}</div>
                </div>
                {sort === "asc" && <ArrowUp size={13} className="shrink-0 text-sky-600" aria-label="ASC" />}
                {sort === "desc" && <ArrowDown size={13} className="shrink-0 text-sky-600" aria-label="DESC" />}
                {view.unique === index && <CopyMinus size={13} className="shrink-0 text-violet-600" aria-label="UNIQUE" />}
                {filtered && <Funnel size={13} className="shrink-0 fill-sky-600 text-sky-600" aria-label="Фильтр" />}
                <button
                  type="button"
                  aria-label={`Меню столбца ${column.name}`}
                  className={cn(
                    "shrink-0 rounded border border-gray-300 bg-white p-0.5 text-gray-600 hover:border-sky-500 hover:text-sky-700",
                    "dark:border-white/20 dark:bg-gray-800 dark:text-gray-300",
                    filtered && "border-sky-500 text-sky-700",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectColumn(index);
                    onOpenMenu(index, (event.currentTarget.parentElement as HTMLElement).getBoundingClientRect());
                  }}
                >
                  <ChevronDown size={13} />
                </button>
                <span
                  aria-hidden="true"
                  className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize hover:bg-sky-400/40"
                  onPointerDown={(event) => startResize(event, index)}
                  onClick={(event) => event.stopPropagation()}
                />
              </div>
            );
          })}
        </div>

        {/* ─── Rows ─── */}
        {rows.slice(first, last).map((rowIndex, offset) => {
          const position = first + offset;
          const row = sheet.rows[rowIndex];
          return (
            <div
              key={rowIndex}
              role="row"
              className="absolute left-0 grid border-b border-gray-200 bg-white text-[13px] hover:bg-sky-50/60 dark:border-white/10 dark:bg-gray-950 dark:hover:bg-white/5"
              style={{ top: HEADER_HEIGHT + position * ROW_HEIGHT, height: ROW_HEIGHT, gridTemplateColumns: template, width }}
            >
              <div className="sticky left-0 z-10 flex items-center justify-end border-r border-gray-300 bg-gray-50 px-2 text-[11px] tabular-nums text-gray-500 dark:border-white/15 dark:bg-gray-900 dark:text-gray-400">
                {position + 1}
              </div>
              {columns.map((index) => {
                const column = sheet.columns[index];
                const cell = row[index];
                const text = display(cell, column.type);
                const selected = selectedCell?.row === rowIndex && selectedCell.column === index;
                return (
                  <div
                    key={index}
                    role="gridcell"
                    onClick={() => onSelectCell(rowIndex, index)}
                    className={cn(
                      "flex min-w-0 items-center border-r border-gray-200 px-2 dark:border-white/10",
                      column.type === "number" && "justify-end tabular-nums",
                      column.type === "bool" && "justify-center text-[11px] font-medium",
                      column.type === "json" && "font-mono text-[12px] text-gray-500 dark:text-gray-400",
                      selectedColumn === index && "bg-sky-50/70 dark:bg-sky-500/10",
                      selected && "outline outline-2 -outline-offset-2 outline-emerald-600",
                      text === "" ? "text-gray-300" : "text-gray-800 dark:text-gray-100",
                    )}
                  >
                    <span className="truncate">{text}</span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="absolute inset-x-0 p-8 text-center text-sm text-gray-500 dark:text-gray-400" style={{ top: HEADER_HEIGHT }}>
            Нет строк: снимите часть фильтров
          </div>
        )}
      </div>
    </div>
  );
}
