// The admin dashboard's data logic, kept apart from the UI: sheets, the view of a sheet (sort, filters, UNIQUE),
// column functions, combining sheets by their foreign keys and CSV export.

export type ColumnType = "number" | "text" | "bool" | "datetime" | "date" | "time" | "json";
export type Cell = string | number | boolean | null | Record<string, unknown> | unknown[];

export interface Column {
  name: string;
  type: ColumnType;
  /** The table the column comes from: in a combined sheet the columns of several tables sit side by side */
  table: string;
}

export interface ForeignKey {
  column: string;
  table: string;
  target: string;
}

export interface TableInfo {
  name: string;
  rows: number;
  columns: { name: string; type: ColumnType }[];
  foreign_keys: ForeignKey[];
}

export interface TableData extends TableInfo {
  data: Cell[][];
  truncated: boolean;
}

export interface Sheet {
  id: string;
  title: string;
  columns: Column[];
  rows: Cell[][];
  /** Rows in the database: more than `rows` when the server cut the table */
  total: number;
  truncated: boolean;
  /** A sheet made by combining tables: it can be closed */
  combined: boolean;
}

export type Operator = "contains" | "not_contains" | "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "starts" | "ends" | "empty" | "not_empty";

export const OPERATORS: { value: Operator; label: string; needsValue: boolean }[] = [
  { value: "contains", label: "содержит (LIKE %…%)", needsValue: true },
  { value: "not_contains", label: "не содержит", needsValue: true },
  { value: "eq", label: "равно (=)", needsValue: true },
  { value: "neq", label: "не равно (≠)", needsValue: true },
  { value: "gt", label: "больше (>)", needsValue: true },
  { value: "gte", label: "больше или равно (≥)", needsValue: true },
  { value: "lt", label: "меньше (<)", needsValue: true },
  { value: "lte", label: "меньше или равно (≤)", needsValue: true },
  { value: "starts", label: "начинается с", needsValue: true },
  { value: "ends", label: "заканчивается на", needsValue: true },
  { value: "empty", label: "пусто (IS NULL)", needsValue: false },
  { value: "not_empty", label: "не пусто (IS NOT NULL)", needsValue: false },
];

export interface ColumnFilter {
  /** Values ticked in the list (display text); undefined: all of them */
  values?: string[];
  condition?: { op: Operator; value: string };
}

export interface View {
  sort: { column: number; dir: "asc" | "desc" } | null;
  filters: Record<number, ColumnFilter>;
  /** UNIQUE: one row per value of this column, the first one */
  unique: number | null;
  hidden: number[];
  search: string;
}

export const emptyView = (): View => ({ sort: null, filters: {}, unique: null, hidden: [], search: "" });

export const EMPTY_LABEL = "(пусто)";

const pad = (value: number) => String(value).padStart(2, "0");

/** What a cell shows and what filters, UNIQUE and CSV work with. */
export function display(cell: Cell, type: ColumnType): string {
  if (cell === null || cell === undefined || cell === "") return "";
  if (type === "bool" || typeof cell === "boolean") return cell ? "TRUE" : "FALSE";
  if (typeof cell === "object") return JSON.stringify(cell);
  if (type === "datetime" && typeof cell === "string") {
    const date = new Date(cell);
    if (Number.isNaN(date.getTime())) return cell;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }
  return String(cell);
}

const isEmpty = (cell: Cell) => cell === null || cell === undefined || cell === "";

/** A comparable number for numbers and dates; null for the rest */
function numeric(cell: Cell, type: ColumnType): number | null {
  if (isEmpty(cell)) return null;
  if (type === "number") return typeof cell === "number" ? cell : Number(cell);
  if ((type === "datetime" || type === "date") && typeof cell === "string") {
    const time = Date.parse(cell);
    return Number.isNaN(time) ? null : time;
  }
  if (type === "bool") return cell ? 1 : 0;
  return null;
}

/** The value typed in a filter, read the way the column holds values */
function parseInput(value: string, type: ColumnType): number | null {
  const text = value.trim();
  if (!text) return null;
  if (type === "number") {
    const number = Number(text.replace(",", "."));
    return Number.isNaN(number) ? null : number;
  }
  if (type === "datetime" || type === "date") {
    const time = Date.parse(text.length === 10 ? `${text}T00:00:00` : text.replace(" ", "T"));
    return Number.isNaN(time) ? null : time;
  }
  return null;
}

const collator = new Intl.Collator("ru", { numeric: true, sensitivity: "base" });

export function compare(a: Cell, b: Cell, type: ColumnType): number {
  // Empty values go last, whichever way the column is sorted (see sortRows)
  const left = numeric(a, type);
  const right = numeric(b, type);
  if (left !== null && right !== null) return left - right;
  return collator.compare(display(a, type), display(b, type));
}

function matches(cell: Cell, column: Column, condition: { op: Operator; value: string }): boolean {
  const { op, value } = condition;
  if (op === "empty") return isEmpty(cell);
  if (op === "not_empty") return !isEmpty(cell);
  const text = display(cell, column.type).toLowerCase();
  const wanted = value.toLowerCase();
  if (op === "contains") return text.includes(wanted);
  if (op === "not_contains") return !text.includes(wanted);
  if (op === "starts") return text.startsWith(wanted);
  if (op === "ends") return text.endsWith(wanted);
  const left = numeric(cell, column.type);
  const right = parseInput(value, column.type);
  // Numbers and dates compare as such; everything else as text
  const order = left !== null && right !== null ? left - right : isEmpty(cell) ? NaN : collator.compare(text, wanted);
  if (op === "eq") return order === 0;
  if (op === "neq") return order !== 0;
  if (Number.isNaN(order)) return false;
  if (op === "gt") return order > 0;
  if (op === "gte") return order >= 0;
  if (op === "lt") return order < 0;
  return order <= 0;
}

/** The rows a view shows, as indexes into sheet.rows, in the order shown. `except`: leave one column's filter out
 * (the column menu lists the values the other filters leave, as Excel does). */
export function viewRows(sheet: Sheet, view: View, except?: number): number[] {
  const filters = Object.entries(view.filters)
    .map(([index, filter]) => ({ index: Number(index), filter, allowed: filter.values ? new Set(filter.values) : null }))
    .filter(({ index }) => index !== except);
  const search = view.search.trim().toLowerCase();
  let rows: number[] = [];
  sheet.rows.forEach((row, rowIndex) => {
    for (const { index, filter, allowed } of filters) {
      const column = sheet.columns[index];
      if (allowed && !allowed.has(display(row[index], column.type) || EMPTY_LABEL)) return;
      if (filter.condition && !matches(row[index], column, filter.condition)) return;
    }
    if (search && !row.some((cell, index) => display(cell, sheet.columns[index].type).toLowerCase().includes(search))) return;
    rows.push(rowIndex);
  });
  if (view.unique !== null && except === undefined) {
    const seen = new Set<string>();
    const column = sheet.columns[view.unique];
    rows = rows.filter((rowIndex) => {
      const key = display(sheet.rows[rowIndex][view.unique!], column.type);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  if (view.sort) {
    const { column: index, dir } = view.sort;
    const type = sheet.columns[index].type;
    const sign = dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const left = sheet.rows[a][index];
      const right = sheet.rows[b][index];
      if (isEmpty(left) || isEmpty(right)) return isEmpty(left) === isEmpty(right) ? a - b : isEmpty(left) ? 1 : -1;
      return sign * compare(left, right, type) || a - b;
    });
  }
  return rows;
}

/** UNIQUE / GROUP BY: each value of a column with how many rows have it, most frequent first */
export function uniqueValues(sheet: Sheet, column: number, rows: number[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  const type = sheet.columns[column].type;
  for (const rowIndex of rows) {
    const value = display(sheet.rows[rowIndex][column], type) || EMPTY_LABEL;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || collator.compare(a.value, b.value));
}

export interface Stats {
  count: number;
  blank: number;
  unique: number;
  sum: number | null;
  avg: number | null;
  median: number | null;
  min: string | null;
  max: string | null;
}

/** The SQL aggregate functions over the rows shown: COUNT, COUNT(DISTINCT), SUM, AVG, MIN, MAX and the median */
export function columnStats(sheet: Sheet, column: number, rows: number[]): Stats {
  const { type } = sheet.columns[column];
  const distinct = new Set<string>();
  const numbers: number[] = [];
  let blank = 0;
  let min: Cell = null;
  let max: Cell = null;
  for (const rowIndex of rows) {
    const cell = sheet.rows[rowIndex][column];
    if (isEmpty(cell)) {
      blank += 1;
      continue;
    }
    distinct.add(display(cell, type));
    if (min === null || compare(cell, min, type) < 0) min = cell;
    if (max === null || compare(cell, max, type) > 0) max = cell;
    if (type === "number") numbers.push(Number(cell));
  }
  const sum = numbers.length ? numbers.reduce((total, value) => total + value, 0) : null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return {
    count: rows.length - blank,
    blank,
    unique: distinct.size,
    sum,
    avg: sum !== null ? sum / numbers.length : null,
    median: sorted.length ? (sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2) : null,
    min: min === null ? null : display(min, type),
    max: max === null ? null : display(max, type),
  };
}

export const formatNumber = (value: number | null) =>
  value === null ? "—" : value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

export function sheetFromTable(table: TableData): Sheet {
  return {
    id: table.name,
    title: table.name,
    columns: table.columns.map((column) => ({ ...column, table: table.name })),
    rows: table.data,
    total: table.rows,
    truncated: table.truncated,
    combined: false,
  };
}

export interface JoinStep {
  table: string;
  /** "events.user_id = users.id" */
  on: string;
  /** The column of the sheet built so far and the column of the joined table that must be equal */
  left: { table: string; column: string };
  right: string;
}

/** How tables combine, in the order chosen: each next table must point at one already in the sheet, or the other
 * way round. Returns the steps, or the table that has no link to the ones before it. */
export function joinPlan(order: string[], info: Record<string, TableInfo>): { steps: JoinStep[]; unlinked: string | null } {
  const steps: JoinStep[] = [];
  const joined = [order[0]];
  for (const table of order.slice(1)) {
    let step: JoinStep | null = null;
    for (const previous of joined) {
      const forward = info[table].foreign_keys.find((fk) => fk.table === previous);
      if (forward) {
        step = { table, on: `${table}.${forward.column} = ${previous}.${forward.target}`, left: { table: previous, column: forward.target }, right: forward.column };
        break;
      }
      const backward = info[previous].foreign_keys.find((fk) => fk.table === table);
      if (backward) {
        step = { table, on: `${previous}.${backward.column} = ${table}.${backward.target}`, left: { table: previous, column: backward.column }, right: backward.target };
        break;
      }
    }
    if (!step) return { steps, unlinked: table };
    steps.push(step);
    joined.push(table);
  }
  return { steps, unlinked: null };
}

const keyOf = (cell: Cell) => (isEmpty(cell) ? null : String(cell));

/** LEFT or INNER JOIN of the chosen tables along the plan; columns are named table.column */
export function combine(tables: TableData[], steps: JoinStep[], kind: "left" | "inner"): Sheet {
  const [first, ...rest] = tables;
  const columns: Column[] = first.columns.map((column) => ({ ...column, name: `${first.name}.${column.name}`, table: first.name }));
  let rows: Cell[][] = first.data.map((row) => [...row]);
  // Where each table's columns start in the combined row
  const offsets: Record<string, number> = { [first.name]: 0 };
  for (const step of steps) {
    const table = rest.find((item) => item.name === step.table)!;
    const leftTable = tables.find((item) => item.name === step.left.table)!;
    const leftIndex = offsets[step.left.table] + leftTable.columns.findIndex((column) => column.name === step.left.column);
    const rightIndex = table.columns.findIndex((column) => column.name === step.right);
    const index = new Map<string, Cell[][]>();
    for (const row of table.data) {
      const key = keyOf(row[rightIndex]);
      if (key !== null) index.set(key, [...(index.get(key) ?? []), row]);
    }
    const blank = table.columns.map(() => null);
    const next: Cell[][] = [];
    for (const row of rows) {
      const key = keyOf(row[leftIndex]);
      const found = key !== null ? index.get(key) : undefined;
      if (found) for (const match of found) next.push([...row, ...match]);
      else if (kind === "left") next.push([...row, ...blank]);
    }
    offsets[table.name] = columns.length;
    columns.push(...table.columns.map((column) => ({ ...column, name: `${table.name}.${column.name}`, table: table.name })));
    rows = next;
  }
  const names = tables.map((table) => table.name);
  return {
    id: `combined-${Date.now()}`,
    title: names.join(" + "),
    columns,
    rows,
    total: rows.length,
    truncated: tables.some((table) => table.truncated),
    combined: true,
  };
}

/** CSV of what is shown: the rows and columns of the view. A BOM so Excel reads UTF-8 (Cyrillic) correctly. */
export function toCsv(sheet: Sheet, rows: number[], columns: number[], separator: "," | ";"): string {
  const quote = (text: string) => (/[",;\n\r]/.test(text) || text !== text.trim() ? `"${text.replace(/"/g, '""')}"` : text);
  const lines = [columns.map((index) => quote(sheet.columns[index].name)).join(separator)];
  for (const rowIndex of rows) {
    lines.push(columns.map((index) => quote(display(sheet.rows[rowIndex][index], sheet.columns[index].type))).join(separator));
  }
  return "﻿" + lines.join("\r\n");
}

/** Excel's column letters: A … Z, AA, AB … */
export function columnLetter(index: number): string {
  let letters = "";
  for (let rest = index + 1; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    letters = String.fromCharCode(65 + ((rest - 1) % 26)) + letters;
  }
  return letters;
}
