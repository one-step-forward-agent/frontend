// Блок выбора даты и времени: клик в любую часть блока открывает поле ввода.
import * as React from "react";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { fromISODate, relativeDay } from "@/utils/dates";

const openPicker = (input: HTMLInputElement | null) => {
  if (!input) return;
  input.focus();
  try {
    input.showPicker?.();
  } catch {
    // showPicker недоступен (старый браузер или iframe) — остаётся фокус на поле
  }
};

interface PickerBlockProps {
  icon: React.ElementType;
  label: string;
  value: string;
  placeholder: string;
  onOpen: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

const PickerBlock: React.FC<PickerBlockProps> = ({ icon: Icon, label, value, placeholder, onOpen, onClear, children }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen();
      }
    }}
    className={cn(
      "relative flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer select-none",
      "bg-white dark:bg-gray-800 hover:border-blue-400 focus-visible:border-blue-500 transition-colors"
    )}
  >
    <Icon size={18} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn("text-sm font-medium truncate", !value && "text-gray-400 dark:text-gray-500")}>{value || placeholder}</p>
    </div>
    {onClear && value && (
      <button
        type="button"
        aria-label="Без времени"
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        className="relative z-10 rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <X size={14} />
      </button>
    )}
    {children}
  </div>
);

// Прозрачное нативное поле накрывает весь блок: любой клик попадает в него и открывает выбор
// (на телефонах — системный пикер, на компьютере — showPicker)
const hiddenInput = "absolute inset-0 w-full h-full opacity-0 cursor-pointer border-0 p-0 rounded-xl";

interface DateTimeFieldProps {
  date: string;
  time: string | null;
  endTime?: string | null;
  onChange: (value: { date: string; time: string | null; endTime: string | null }) => void;
  withEndTime?: boolean;
}

export const DateTimeField: React.FC<DateTimeFieldProps> = ({ date, time, endTime = null, onChange, withEndTime = false }) => {
  const dateRef = React.useRef<HTMLInputElement>(null);
  const timeRef = React.useRef<HTMLInputElement>(null);
  const endRef = React.useRef<HTMLInputElement>(null);
  const update = (patch: Partial<{ date: string; time: string | null; endTime: string | null }>) =>
    onChange({ date, time, endTime, ...patch });

  return (
    <div className={cn("grid gap-3", withEndTime && time ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      <PickerBlock icon={CalendarIcon} label="Дата" value={date ? relativeDay(fromISODate(date)) : ""} placeholder="Выберите дату" onOpen={() => openPicker(dateRef.current)}>
        <input ref={dateRef} type="date" aria-label="Дата" value={date} required onChange={(event) => event.target.value && update({ date: event.target.value })} className={hiddenInput} tabIndex={-1} onClick={(event) => { event.stopPropagation(); openPicker(event.currentTarget); }} />
      </PickerBlock>
      <PickerBlock
        icon={Clock}
        label="Время"
        value={time ?? ""}
        placeholder="Без времени"
        onOpen={() => openPicker(timeRef.current)}
        onClear={() => update({ time: null, endTime: null })}
      >
        <input ref={timeRef} type="time" aria-label="Время" value={time ?? ""} onChange={(event) => update({ time: event.target.value || null })} className={hiddenInput} tabIndex={-1} onClick={(event) => { event.stopPropagation(); openPicker(event.currentTarget); }} />
      </PickerBlock>
      {withEndTime && time && (
        <PickerBlock icon={Clock} label="До" value={endTime ?? ""} placeholder="+1 час" onOpen={() => openPicker(endRef.current)} onClear={() => update({ endTime: null })}>
          <input ref={endRef} type="time" aria-label="Время окончания" value={endTime ?? ""} onChange={(event) => update({ endTime: event.target.value || null })} className={hiddenInput} tabIndex={-1} onClick={(event) => { event.stopPropagation(); openPicker(event.currentTarget); }} />
        </PickerBlock>
      )}
    </div>
  );
};
