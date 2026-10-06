// src/utils/dates.ts — даты задач в часовом поясе браузера
export const MONTHS_GENITIVE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const localTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
  } catch {
    return 'Europe/Moscow';
  }
};

const pad = (value: number) => String(value).padStart(2, '0');

/** YYYY-MM-DD в локальном времени. */
export const toISODate = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromISODate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const startOfDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Понедельник недели, в которую попадает дата. */
export const startOfWeek = (date: Date): Date => addDays(startOfDay(date), -((date.getDay() + 6) % 7));

export const sameDay = (a: Date, b: Date) => toISODate(a) === toISODate(b);

export const formatTime = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatDayLong = (date: Date): string =>
  date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

export const formatDayShort = (date: Date): string => `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`;

export const relativeDay = (date: Date, today = new Date()): string => {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(today).getTime()) / 86400000);
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Завтра';
  if (diff === -1) return 'Вчера';
  return `${WEEKDAYS_SHORT[(date.getDay() + 6) % 7]}, ${formatDayShort(date)}`;
};

/** Начало и конец задачи в ISO; задача без времени занимает весь день. */
export const taskBounds = (date: string, time: string | null, endTime: string | null): { start: string; end: string } => {
  const day = fromISODate(date);
  if (!time) return { start: day.toISOString(), end: addDays(day, 1).toISOString() };
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
  let end = new Date(start.getTime() + 60 * 60000);
  if (endTime) {
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endHours, endMinutes);
    if (candidate > start) end = candidate;
  }
  return { start: start.toISOString(), end: end.toISOString() };
};

/** Локальная дата начала события (у задач без времени — их день). */
export const eventDay = (event: { start_at: string }): string => toISODate(new Date(event.start_at));

export const RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Не повторять' },
  { value: 'FREQ=DAILY', label: 'Каждый день' },
  { value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', label: 'По будням' },
  { value: 'WEEKLY', label: 'Каждую неделю' },
  { value: 'FREQ=MONTHLY', label: 'Каждый месяц' },
];

const RRULE_DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

/** «Каждую неделю» повторяется в день недели выбранной даты. */
export const recurrenceRule = (option: string, date: string): string | null => {
  if (!option) return null;
  if (option === 'WEEKLY') return `FREQ=WEEKLY;BYDAY=${RRULE_DAYS[(fromISODate(date).getDay() + 6) % 7]}`;
  return option;
};

export const recurrenceOption = (rule: string | null | undefined): string => {
  if (!rule) return '';
  if (/^FREQ=WEEKLY;BYDAY=[A-Z]{2}$/.test(rule)) return 'WEEKLY';
  return RECURRENCE_OPTIONS.some((option) => option.value === rule) ? rule : '';
};
