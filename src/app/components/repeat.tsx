import { openPicker } from "../lib/format";
import { Field } from "./ui";
import { LOCALE, isEn, pluralWord, tr } from "@/i18n";

/**
 * The repeat of a task: how often (every N days, weeks on chosen weekdays, months, years) and until when
 * (never, a date, or a number of times). The series starts on the task's own date. Kept as an RRULE.
 */

export type Frequency = "" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface Repeat {
  freq: Frequency;
  interval: number;
  /** Weekly: the weekdays, 0 = Monday */
  days: number[];
  end: "never" | "until" | "count";
  /** end = until: the last day, YYYY-MM-DD */
  until: string;
  /** end = count: how many times in all */
  count: number;
}

const RRULE_DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const WEEKDAY_SHORT = isEn ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAY_FULL = isEn
  ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  : ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];
const MAX_COUNT = 500;
const MAX_INTERVAL = 99;

export const NO_REPEAT: Repeat = { freq: "", interval: 1, days: [], end: "never", until: "", count: 10 };

const weekdayOf = (day: Date) => (day.getDay() + 6) % 7;

export function parseRepeat(rule: string | null | undefined): Repeat {
  if (!rule) return NO_REPEAT;
  const parts = Object.fromEntries(
    rule
      .replace(/^RRULE:/i, "")
      .split(";")
      .map((part) => part.split("=") as [string, string])
  );
  const freq = (["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(parts.FREQ) ? parts.FREQ : "") as Frequency;
  const until = /^(\d{4})(\d{2})(\d{2})/.exec(parts.UNTIL ?? "");
  return {
    freq,
    interval: Math.max(1, Number(parts.INTERVAL) || 1),
    days: (parts.BYDAY ?? "")
      .split(",")
      .map((day) => RRULE_DAYS.indexOf(day))
      .filter((day) => day >= 0),
    end: parts.COUNT ? "count" : until ? "until" : "never",
    until: until ? `${until[1]}-${until[2]}-${until[3]}` : "",
    count: Number(parts.COUNT) || 10,
  };
}

/** The rule for a series starting on `start`; null when the task does not repeat. */
export function repeatRule(repeat: Repeat, start: Date): string | null {
  if (!repeat.freq) return null;
  const parts = [`FREQ=${repeat.freq}`];
  if (repeat.interval > 1) parts.push(`INTERVAL=${Math.min(repeat.interval, MAX_INTERVAL)}`);
  if (repeat.freq === "WEEKLY") {
    const days = repeat.days.length ? [...repeat.days].sort() : [weekdayOf(start)];
    parts.push(`BYDAY=${days.map((day) => RRULE_DAYS[day]).join(",")}`);
  }
  if (repeat.end === "until" && repeat.until) parts.push(`UNTIL=${repeat.until.replace(/-/g, "")}`);
  if (repeat.end === "count") parts.push(`COUNT=${Math.min(Math.max(1, repeat.count), MAX_COUNT)}`);
  return parts.join(";");
}

/** Two rules mean the same repeat (the server keeps the end date as the end of that day in UTC). */
export function sameRule(a: string | null | undefined, b: string | null | undefined): boolean {
  const normal = (rule: string | null | undefined) => (rule ?? "").toUpperCase().replace(/^RRULE:/, "").replace(/(UNTIL=\d{8})T\d{6}Z?/, "$1");
  return normal(a) === normal(b);
}

/** A check before saving; null when the repeat is fine. */
export function repeatError(repeat: Repeat, startDay: string): string | null {
  if (!repeat.freq) return null;
  if (repeat.end === "until") {
    if (!repeat.until) return tr("Укажите, до какого дня повторять", "Choose the day the repeat ends");
    if (startDay && repeat.until < startDay) return tr("Повтор заканчивается раньше, чем начинается", "The repeat ends before it starts");
  }
  if (repeat.end === "count" && !(repeat.count >= 1 && repeat.count <= MAX_COUNT)) return tr(`Повторений — от 1 до ${MAX_COUNT}`, `Repeats: from 1 to ${MAX_COUNT}`);
  if (!(repeat.interval >= 1 && repeat.interval <= MAX_INTERVAL)) return tr(`Интервал — от 1 до ${MAX_INTERVAL}`, `Interval: from 1 to ${MAX_INTERVAL}`);
  return null;
}

type Preset = "" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly" | "custom";

function presetOf(repeat: Repeat, start: Date): Preset {
  if (!repeat.freq) return "";
  if (repeat.interval !== 1) return "custom";
  const days = [...repeat.days].sort().join(",");
  if (repeat.freq === "DAILY") return "daily";
  if (repeat.freq === "WEEKLY" && days === "0,1,2,3,4") return "weekdays";
  if (repeat.freq === "WEEKLY" && (!days || days === String(weekdayOf(start)))) return "weekly";
  if (repeat.freq === "MONTHLY") return "monthly";
  if (repeat.freq === "YEARLY") return "yearly";
  return "custom";
}

function fromPreset(preset: Preset, current: Repeat, start: Date): Repeat {
  const keep = { end: current.end, until: current.until, count: current.count };
  switch (preset) {
    case "":
      return { ...NO_REPEAT };
    case "daily":
      return { ...keep, freq: "DAILY", interval: 1, days: [] };
    case "weekdays":
      return { ...keep, freq: "WEEKLY", interval: 1, days: [0, 1, 2, 3, 4] };
    case "weekly":
      return { ...keep, freq: "WEEKLY", interval: 1, days: [weekdayOf(start)] };
    case "monthly":
      return { ...keep, freq: "MONTHLY", interval: 1, days: [] };
    case "yearly":
      return { ...keep, freq: "YEARLY", interval: 1, days: [] };
    default:
      return current.freq ? { ...current, interval: Math.max(2, current.interval) } : { ...keep, freq: "WEEKLY", interval: 2, days: [weekdayOf(start)] };
  }
}

const UNITS: Record<Exclude<Frequency, "">, [string, string, string]> = {
  DAILY: ["день", "дня", "дней"],
  WEEKLY: ["неделю", "недели", "недель"],
  MONTHLY: ["месяц", "месяца", "месяцев"],
  YEARLY: ["год", "года", "лет"],
};
const EN_UNITS: Record<Exclude<Frequency, "">, [string, string]> = {
  DAILY: ["day", "days"],
  WEEKLY: ["week", "weeks"],
  MONTHLY: ["month", "months"],
  YEARLY: ["year", "years"],
};
const unit = (freq: Exclude<Frequency, "">, count: number) => pluralWord(count, UNITS[freq], EN_UNITS[freq]);

/** "Каждую неделю: пн, ср · 10 раз" — what the series will be, said in words. */
export function describeRepeat(repeat: Repeat, start: Date): string {
  if (!repeat.freq) return tr("Не повторяется", "Does not repeat");
  const one = unit(repeat.freq, 1);
  const every =
    repeat.interval === 1
      ? tr(`Каждый ${one}`.replace("Каждый неделю", "Каждую неделю"), `Every ${one}`)
      : tr(`Каждые ${repeat.interval} ${unit(repeat.freq, repeat.interval)}`, `Every ${repeat.interval} ${unit(repeat.freq, repeat.interval)}`);
  const days = repeat.freq === "WEEKLY" ? (repeat.days.length ? [...repeat.days].sort() : [weekdayOf(start)]) : [];
  const on = days.length ? `: ${days.map((day) => (isEn ? WEEKDAY_SHORT[day] : WEEKDAY_SHORT[day].toLowerCase())).join(", ")}` : "";
  const end =
    repeat.end === "count"
      ? ` · ${repeat.count} ${pluralWord(repeat.count, ["раз", "раза", "раз"], ["time", "times"])}`
      : repeat.end === "until" && repeat.until
        ? ` · ${tr("до", "until")} ${new Date(`${repeat.until}T00:00`).toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" })}`
        : "";
  return `${every}${on}${end}`;
}

export function RepeatEditor({ value, onChange, start, existing }: { value: Repeat; onChange: (value: Repeat) => void; start: Date; existing?: boolean }) {
  const preset = presetOf(value, start);
  const set = (changes: Partial<Repeat>) => onChange({ ...value, ...changes });
  const toggleDay = (day: number) => {
    const days = value.days.length ? value.days : [weekdayOf(start)];
    const next = days.includes(day) ? days.filter((item) => item !== day) : [...days, day];
    set({ days: next.length ? next : days });
  };

  return (
    <div className="form">
      <Field label={tr("Повтор", "Repeat")}>
        <select value={preset} onChange={(e) => onChange(fromPreset(e.target.value as Preset, value, start))}>
          <option value="">{tr("Не повторять", "Does not repeat")}</option>
          <option value="daily">{tr("Каждый день", "Every day")}</option>
          <option value="weekdays">{tr("По будням (пн–пт)", "Weekdays (Mon–Fri)")}</option>
          <option value="weekly">{tr("Каждую неделю", "Every week")} ({WEEKDAY_FULL[weekdayOf(start)]})</option>
          <option value="monthly">{tr(`Каждый месяц (${start.getDate()}-го)`, `Every month (day ${start.getDate()})`)}</option>
          <option value="yearly">{tr("Каждый год", "Every year")}</option>
          <option value="custom">{tr("Настроить…", "Custom…")}</option>
        </select>
      </Field>

      {value.freq && (
        <>
          {preset === "custom" && (
            <div className="form-row">
              <Field label={tr("Каждые", "Every")}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_INTERVAL}
                  value={value.interval}
                  onChange={(e) => set({ interval: Math.max(1, Math.min(MAX_INTERVAL, Number(e.target.value) || 1)) })}
                />
              </Field>
              <Field label={tr("Единица", "Unit")}>
                <select value={value.freq} onChange={(e) => set({ freq: e.target.value as Frequency, days: [] })}>
                  {(Object.keys(UNITS) as Exclude<Frequency, "">[]).map((freq) => (
                    <option key={freq} value={freq}>
                      {unit(freq, value.interval)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {value.freq === "WEEKLY" && (
            <div className="quick-days" role="group" aria-label={tr("Дни недели", "Days of the week")}>
              {WEEKDAY_SHORT.map((label, day) => {
                const active = (value.days.length ? value.days : [weekdayOf(start)]).includes(day);
                return (
                  <button key={label} type="button" className={`chip-toggle ${active ? "active" : ""}`} aria-pressed={active} aria-label={WEEKDAY_FULL[day]} onClick={() => toggleDay(day)}>
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="form-row">
            <Field label={tr("Окончание", "Ends")}>
              <select value={value.end} onChange={(e) => set({ end: e.target.value as Repeat["end"] })}>
                <option value="never">{tr("Никогда", "Never")}</option>
                <option value="until">{tr("В дату", "On a date")}</option>
                <option value="count">{tr("После N повторений", "After N times")}</option>
              </select>
            </Field>
            {value.end === "until" && (
              <Field label={tr("Последний день", "Last day")} className="picker-field">
                <input type="date" value={value.until} onChange={(e) => set({ until: e.target.value })} onClick={(e) => openPicker(e.currentTarget)} required />
              </Field>
            )}
            {value.end === "count" && (
              <Field label={tr("Сколько раз", "How many times")}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_COUNT}
                  value={value.count}
                  onChange={(e) => set({ count: Math.max(1, Math.min(MAX_COUNT, Number(e.target.value) || 1)) })}
                />
              </Field>
            )}
          </div>

          <p className="muted small">
            {describeRepeat(value, start)}, {tr("начиная с", "starting")} {start.toLocaleDateString(LOCALE, { day: "numeric", month: "long" })}.
            {existing && tr(" Изменение повтора применится к этой и следующим задачам серии.", " The change applies to this and the following tasks of the series.")}
          </p>
        </>
      )}
    </div>
  );
}
