import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * A time as two dropdowns, hours and minutes. Native <input type="time"> could not be picked from everywhere:
 * Firefox has no picker, our own styles hid Chrome's, and phones showed an empty field. A <select> opens the
 * system list or wheel on every device.
 */

interface TimeFieldProps {
  /** "HH:MM", or "" when there is no time (allowEmpty) */
  value: string;
  onChange: (value: string) => void;
  /** The field may stay without a time: "—" in the hours clears it */
  allowEmpty?: boolean;
  disabled?: boolean;
  /** What the field is, for screen readers: «Начало работы», «Время плана» */
  label: string;
  className?: string;
  /** Minutes offered: every 5 by default (the current value is kept even when it is not on the step) */
  step?: number;
  icon?: boolean;
}

const pad = (value: number) => String(value).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, hour) => pad(hour));

export function TimeField({ value, onChange, allowEmpty = false, disabled = false, label, className, step = 5, icon = true }: TimeFieldProps) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || "");
  const hours = match ? pad(Math.min(23, Number(match[1]))) : "";
  const minutes = match ? match[2] : "";
  const minuteOptions = React.useMemo(() => {
    const options = Array.from({ length: Math.ceil(60 / step) }, (_, index) => pad(index * step));
    if (minutes && !options.includes(minutes)) options.push(minutes);
    return options.sort();
  }, [step, minutes]);

  const setHours = (next: string) => {
    if (!next) return onChange("");
    onChange(`${next}:${minutes || "00"}`);
  };
  const setMinutes = (next: string) => onChange(`${hours || "09"}:${next}`);

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("time-field", disabled && "is-disabled", className)}
    >
      {icon && <Clock size={14} aria-hidden="true" className="time-field-icon" />}
      <select value={hours} onChange={(e) => setHours(e.target.value)} disabled={disabled} aria-label={`${label}: часы`}>
        {(allowEmpty || !hours) && <option value="">{allowEmpty ? "—" : "--"}</option>}
        {HOURS.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="time-field-colon">
        :
      </span>
      <select value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={disabled || (allowEmpty && !hours)} aria-label={`${label}: минуты`}>
        {!minutes && <option value="">{allowEmpty ? "—" : "--"}</option>}
        {minuteOptions.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>
    </div>
  );
}
