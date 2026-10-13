import * as React from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * A time the way calendars do it: one field where the time is typed ("14:30", "1430", "9", "9.15") or picked
 * from a list that opens under it. Native <input type="time"> is not used: Firefox has no picker, the look
 * differs in every browser and phones show an empty box. The list is rendered in a portal, so modals and
 * scrolling forms do not clip it.
 */

interface TimeFieldProps {
  /** "HH:MM", or "" when there is no time (allowEmpty) */
  value: string;
  onChange: (value: string) => void;
  /** The field may stay without a time: emptying it or «Без времени» in the list clears it */
  allowEmpty?: boolean;
  disabled?: boolean;
  /** What the field is, for screen readers: «Начало работы», «Время плана» */
  label: string;
  className?: string;
  /** Minutes between the times in the list (any minute can still be typed) */
  step?: number;
  icon?: boolean;
}

const pad = (value: number) => String(value).padStart(2, "0");
const NONE = "";

/** "14:30", "14.30", "14 30", "1430", "930", "9" → "HH:MM"; null when it is not a time */
export function parseTime(raw: string): string | null {
  const text = raw.trim().toLowerCase().replace(/[^\d:. ]/g, "");
  if (!text) return null;
  let hours: number;
  let minutes = 0;
  const parts = text.split(/[:. ]+/).filter(Boolean);
  if (parts.length >= 2) {
    hours = Number(parts[0]);
    minutes = Number(parts[1].padEnd(2, "0").slice(0, 2));
  } else if (parts[0].length <= 2) {
    hours = Number(parts[0]);
  } else {
    const digits = parts[0].slice(0, 4);
    hours = Number(digits.slice(0, digits.length - 2));
    minutes = Number(digits.slice(-2));
  }
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) return null;
  return `${pad(hours)}:${pad(minutes)}`;
}

export function TimeField({ value, onChange, allowEmpty = false, disabled = false, label, className, step = 15, icon = true }: TimeFieldProps) {
  const current = parseTime(value || "") ?? "";
  const [text, setText] = React.useState(current);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const [place, setPlace] = React.useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const listId = React.useId();

  // A new value from outside (another field moved it) shows up unless the user is typing
  React.useEffect(() => {
    if (document.activeElement !== inputRef.current) setText(current);
  }, [current]);

  const options = React.useMemo(() => {
    const times: string[] = [];
    for (let minute = 0; minute < 24 * 60; minute += Math.max(1, step)) times.push(`${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
    if (current && !times.includes(current)) times.push(current);
    times.sort();
    return allowEmpty ? [NONE, ...times] : times;
  }, [step, current, allowEmpty]);

  // While typing, the list jumps to the first time that starts with what is typed ("14" → 14:00)
  const typedIndex = React.useMemo(() => {
    const parsed = parseTime(text);
    if (parsed) {
      const exact = options.indexOf(parsed);
      if (exact >= 0) return exact;
      const later = options.findIndex((option) => option && option >= parsed);
      if (later >= 0) return later;
    }
    return options.indexOf(current);
  }, [text, options, current]);

  const measure = React.useCallback(() => {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    const below = window.innerHeight - box.bottom;
    const up = below < 260 && box.top > below;
    setPlace({ left: box.left, top: up ? box.top - 6 : box.bottom + 6, width: Math.max(box.width, 120), up });
  }, []);

  const show = () => {
    if (disabled) return;
    measure();
    // An empty field opens at the morning, not at midnight
    setActive(current ? options.indexOf(current) : options.indexOf("09:00"));
    setOpen(true);
  };

  const commit = (next: string) => {
    setText(next);
    setOpen(false);
    if (next !== current) onChange(next);
  };

  // The typed text, when the field is left: a time, an empty field (when allowed), or back to what it was
  const settle = () => {
    if (!text.trim()) return commit(allowEmpty ? "" : current);
    commit(parseTime(text) ?? current);
  };

  React.useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (boxRef.current?.contains(target) || listRef.current?.contains(target)) return;
      settle();
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  });

  // The chosen or typed time is in view when the list opens or the text changes
  React.useEffect(() => {
    if (!open) return;
    const index = active >= 0 ? active : typedIndex;
    const item = listRef.current?.children[index] as HTMLElement | undefined;
    if (item) listRef.current!.scrollTop = item.offsetTop - listRef.current!.clientHeight / 2 + item.clientHeight / 2;
  }, [open, active, typedIndex]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return show();
      const from = active >= 0 ? active : typedIndex;
      setActive(Math.max(0, Math.min(options.length - 1, from + (event.key === "ArrowDown" ? 1 : -1))));
    } else if (event.key === "Enter") {
      if (!open) return;
      event.preventDefault();
      // A time picked with the arrows or the mouse wins; otherwise what is typed
      if (active >= 0) return commit(options[active]);
      settle();
    } else if (event.key === "Escape") {
      if (open) event.stopPropagation();
      setText(current);
      setOpen(false);
    } else if (event.key === "Tab") {
      settle();
    }
  };

  const list =
    open && place
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className={cn(
              "fixed z-[1000] max-h-60 overflow-y-auto overscroll-contain rounded-xl py-1",
              "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
              "ring-1 ring-black/10 dark:ring-white/10 shadow-xl tabular-nums text-sm"
            )}
            style={{ left: place.left, width: place.width, ...(place.up ? { bottom: window.innerHeight - place.top } : { top: place.top }) }}
          >
            {options.map((option, index) => {
              const highlighted = index === (active >= 0 ? active : typedIndex);
              return (
                <li
                  key={option || "none"}
                  role="option"
                  aria-selected={option === current}
                  // mousedown, not click: the input keeps focus and does not settle the old text first
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commit(option);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "cursor-pointer px-3 py-1.5",
                    highlighted && "bg-indigo-50 dark:bg-white/10",
                    option === current && "font-semibold text-indigo-600 dark:text-indigo-300",
                    !option && "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {option || "Без времени"}
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div
      ref={boxRef}
      className={cn("time-field", disabled && "is-disabled", className)}
      onMouseDown={(event) => {
        // A click anywhere on the box (the icon, the padding) opens the list
        if (disabled || event.target === inputRef.current) return;
        event.preventDefault();
        inputRef.current?.focus();
        show();
      }}
    >
      {icon && <Clock size={14} aria-hidden="true" className="time-field-icon" />}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        placeholder={allowEmpty ? "--:--" : "чч:мм"}
        value={text}
        disabled={disabled}
        maxLength={5}
        onFocus={(event) => {
          event.target.select();
          show();
        }}
        onClick={() => !open && show()}
        onChange={(event) => {
          setText(event.target.value);
          setActive(-1);
          if (!open) show();
        }}
        onBlur={() => open || settle()}
        onKeyDown={onKeyDown}
      />
      {list}
    </div>
  );
}
