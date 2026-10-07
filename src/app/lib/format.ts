import type { CalendarEvent, Priority } from "../api/types";

const LOCALE = "ru-RU";

export const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const MINUTE = 60_000;
export const DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, date.getHours(), date.getMinutes());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() + 6) % 7));
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDayKey(value: string | null): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

export function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${dayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const formatTime = (date: Date) => date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
export const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) =>
  date.toLocaleDateString(LOCALE, options);
export const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString(LOCALE, { dateStyle: "medium", timeStyle: "short" }) : "—";
export const formatMonth = (date: Date) => {
  const text = date.toLocaleDateString(LOCALE, { month: "long", year: "numeric" }).replace(/\s*г\.$/, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
export const formatWeekday = (date: Date, style: "short" | "long" = "long") => date.toLocaleDateString(LOCALE, { weekday: style });

/** «Сегодня, среда, 7 октября», «Завтра, четверг, 8 октября», дальше — «Пятница, 9 октября». */
export function dayTitle(date: Date, now = new Date()): string {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY);
  const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
  if (date.getFullYear() !== now.getFullYear()) options.year = "numeric";
  const base = formatDate(date, options).replace(/\s*г\.$/, "");
  const relative = diff === 0 ? "Сегодня" : diff === 1 ? "Завтра" : diff === -1 ? "Вчера" : null;
  return relative ? `${relative}, ${base}` : base.charAt(0).toUpperCase() + base.slice(1);
}

/** Последний день события: задача без времени заканчивается в полночь следующего дня. */
export function lastDay(event: Pick<CalendarEvent, "start_at" | "end_at" | "all_day">): Date {
  const start = startOfDay(new Date(event.start_at));
  const end = new Date(event.end_at);
  const midnight = end.getTime() === startOfDay(end).getTime();
  const last = startOfDay(event.all_day || midnight ? new Date(end.getTime() - 1) : end);
  return last < start ? start : last;
}

/** «до 9 окт», «до сегодня 18:00»; без времени дедлайн — конец дня. */
export function formatDeadline(value: string, now = new Date()): string {
  const moment = new Date(value);
  const diff = Math.round((startOfDay(moment).getTime() - startOfDay(now).getTime()) / DAY);
  const day = diff === 0 ? "сегодня" : diff === 1 ? "завтра" : formatDate(moment, { day: "numeric", month: "short" });
  const endOfDay = moment.getHours() === 23 && moment.getMinutes() === 59;
  return endOfDay ? `до ${day}` : `до ${day} ${formatTime(moment)}`;
}

/** Насколько близок дедлайн: прошёл, меньше суток, меньше трёх дней. */
export function deadlineTone(value: string, now = new Date()): "bad" | "warn" | "neutral" {
  const left = new Date(value).getTime() - now.getTime();
  if (left < 0) return "bad";
  return left < 3 * DAY ? "warn" : "neutral";
}

export function relativeDay(date: Date, now = new Date()): string {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Завтра";
  if (diff === -1) return "Вчера";
  return formatDate(date, { weekday: "short", day: "numeric", month: "long" });
}

export function eventTimeRange(event: CalendarEvent): string {
  if (event.all_day) {
    const last = lastDay(event);
    return sameDay(last, new Date(event.start_at)) ? "Без времени" : `Без времени, по ${formatDate(last, { day: "numeric", month: "long" })}`;
  }
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  if (sameDay(start, end)) return `${formatTime(start)}–${formatTime(end)}`;
  return `${formatTime(start)} – ${formatDate(end, { day: "numeric", month: "short" })} ${formatTime(end)}`;
}

export function occursOn(event: CalendarEvent, day: Date): boolean {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + DAY;
  return new Date(event.start_at).getTime() < dayEnd && new Date(event.end_at).getTime() > dayStart;
}

export function formatLead(minutes: number): string {
  if (minutes === 0) return "в момент начала";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return [days && `${days} дн`, hours && `${hours} ч`, mins && `${mins} мин`].filter(Boolean).join(" ");
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Обычный" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочно" },
];

export const SOURCE_LABELS: Record<string, string> = {
  local: "Dayla",
  ai: "Ассистент",
  google: "Google",
  apple: "Apple",
  jira: "Jira",
  notion: "Notion",
};

export const RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Не повторять" },
  { value: "FREQ=DAILY", label: "Каждый день" },
  { value: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", label: "По будням" },
  { value: "WEEKLY", label: "Каждую неделю" },
  { value: "FREQ=MONTHLY", label: "Каждый месяц" },
];

const RRULE_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

/** «Каждую неделю» повторяется в день недели первой даты. */
export function recurrenceRule(option: string, day: Date): string | null {
  if (!option) return null;
  if (option === "WEEKLY") return `FREQ=WEEKLY;BYDAY=${RRULE_DAYS[(day.getDay() + 6) % 7]}`;
  return option;
}

/** Начало и конец задачи; задача без времени занимает весь день. */
export function taskBounds(date: string, time: string | null, endTime: string | null): { start: string; end: string } {
  const day = parseDayKey(date) ?? startOfDay(new Date());
  if (!time) return { start: day.toISOString(), end: addDays(day, 1).toISOString() };
  const at = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
  };
  const start = at(time);
  const end = endTime && at(endTime) > start ? at(endTime) : new Date(start.getTime() + 60 * MINUTE);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Открывает системный выбор даты или времени по клику на любую часть поля. */
export function openPicker(input: HTMLInputElement) {
  try {
    input.showPicker?.();
  } catch {
    // старый браузер или iframe — остаётся обычный ввод
  }
}

export function plural(count: number, one: string, few: string, many: string): string {
  const tail = count % 100;
  if (tail >= 11 && tail <= 14) return many;
  if (count % 10 === 1) return one;
  if (count % 10 >= 2 && count % 10 <= 4) return few;
  return many;
}

export const TEMPORARY_ERROR = "Временная ошибка — попробуйте ещё раз через минуту.";

export const stripTags = (text: string) =>
  text.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

export const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));
