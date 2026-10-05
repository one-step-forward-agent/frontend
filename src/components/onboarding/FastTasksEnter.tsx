// src/components/onboarding/FastTasksEnter.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  PenLine, Sparkles, Bell, BellOff, Clock, AlarmClock,
  Sunrise, Check, Tag,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";

const TOTAL = 10;

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-3xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_SHEEN =
  "pointer-events-none absolute inset-0 rounded-2xl " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const GLASS_SHEEN_PILL =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

/* Полная формула box-shadow для active-ring с произвольным цветом */
const activeRingShadow = (color: string): string =>
  `0 0 0 1.5px ${color}cc, 0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)`;

type ReminderId = "off" | "10m" | "30m" | "1h" | "1d";

type ReminderOption = {
  id: ReminderId;
  label: string;
  short: string;
  hint: string;
  icon: LucideIcon;
  tint: string;
  tintRing: string;
  tintActiveColor: string;
  tintActiveGlow: string;
};

const REMINDER_OPTIONS: ReminderOption[] = [
  {
    id: "off",
    label: "Без напоминания",
    short: "Выкл",
    hint: "Напомню, если попросите",
    icon: BellOff,
    tint: "text-slate-600 dark:text-slate-300",
    tintRing: "ring-slate-400/40 dark:ring-slate-400/30",
    tintActiveColor: "#475569",
    tintActiveGlow: "rgba(71,85,105,0.35)",
  },
  {
    id: "10m",
    label: "За 10 минут",
    short: "10 мин",
    hint: "Прямо перед началом",
    icon: Clock,
    tint: "text-cyan-600 dark:text-cyan-300",
    tintRing: "ring-cyan-400/40 dark:ring-cyan-400/30",
    tintActiveColor: "#06b6d4",
    tintActiveGlow: "rgba(6,182,212,0.35)",
  },
  {
    id: "30m",
    label: "За 30 минут",
    short: "30 мин",
    hint: "Время собраться",
    icon: AlarmClock,
    tint: "text-blue-600 dark:text-blue-300",
    tintRing: "ring-blue-400/40 dark:ring-blue-400/30",
    tintActiveColor: "#3b82f6",
    tintActiveGlow: "rgba(59,130,246,0.35)",
  },
  {
    id: "1h",
    label: "За час",
    short: "1 час",
    hint: "Успеть переключиться",
    icon: Bell,
    tint: "text-violet-600 dark:text-violet-300",
    tintRing: "ring-violet-400/40 dark:ring-violet-400/30",
    tintActiveColor: "#8b5cf6",
    tintActiveGlow: "rgba(139,92,246,0.35)",
  },
  {
    id: "1d",
    label: "За день",
    short: "1 день",
    hint: "Накануне, вечером",
    icon: Sunrise,
    tint: "text-amber-600 dark:text-amber-300",
    tintRing: "ring-amber-400/40 dark:ring-amber-400/30",
    tintActiveColor: "#f59e0b",
    tintActiveGlow: "rgba(245,158,11,0.35)",
  },
];

export const FastTasksEnter: React.FC = () => {
  const navigate = useNavigate();
  const { data, patch } = useOnboarding();

  const [title, setTitle] = React.useState(data.firstTask.title);
  const [sphereId, setSphereId] = React.useState<string | null>(
    data.firstTask.sphereId ?? data.spheres[0]?.id ?? null
  );
  const [reminder, setReminder] = React.useState<ReminderId>(data.firstTask.reminder);

  const activeSphere = data.spheres.find((s) => s.id === sphereId) ?? null;
  const activeReminder = REMINDER_OPTIONS.find((r) => r.id === reminder) ?? null;
  const canContinue = title.trim().length > 0;

  const handleNext = () => {
    if (!canContinue) return;
    patch({
      firstTask: { title: title.trim(), sphereId, reminder },
    });
    navigate("/onboarding/success-and-learning");
  };

  return (
    <OnboardingLayout
      step={8}
      totalSteps={TOTAL}
      title="Создайте первую задачу"
      onBack={() => navigate("/onboarding/apple-google-logging")}
      onNext={handleNext}
      nextDisabled={!canContinue}
    >
      <div className="relative space-y-4 sm:space-y-5">
        {/* ─── Eyebrow ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span
            className={cn(
              "relative inline-flex items-center gap-1.5 overflow-hidden",
              "px-2.5 py-1 rounded-full",
              GLASS_BODY,
              "text-[11px] uppercase tracking-widest font-medium",
              "text-gray-600 dark:text-gray-300"
            )}
          >
            <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
            <Sparkles size={11} aria-hidden="true" className="relative" />
            <span className="relative">Первый шаг</span>
          </span>
        </div>

        {/* ─── Название задачи ──────────────────────── */}
        <div>
          <label
            htmlFor="first-task-title"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            <PenLine
              size={14}
              className="text-sky-500 dark:text-sky-400"
              aria-hidden="true"
            />
            Название задачи
            <span className="text-red-500" aria-hidden="true">*</span>
          </label>

          <Input
            id="first-task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: подготовить отчёт"
            autoFocus
          />
        </div>

        {/* ─── Сфера ────────────────────────────────── */}
        {data.spheres.length > 0 && (
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
              <Tag
                size={14}
                className="text-sky-500 dark:text-sky-400"
                aria-hidden="true"
              />
              Сфера
            </p>

            <div className="flex flex-wrap gap-2">
              {data.spheres.map((s) => {
                const active = sphereId === s.id;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSphereId(s.id)}
                    aria-pressed={active}
                    className={cn(
                      "group relative inline-flex items-center gap-2 overflow-hidden",
                      "px-3 py-2 rounded-full text-sm font-medium",
                      "transition-transform duration-200",
                      GLASS_BODY,
                      "text-gray-700 dark:text-gray-300",
                      "hover:-translate-y-0.5",
                      "max-w-full"
                    )}
                    style={active ? { boxShadow: activeRingShadow(s.color) } : undefined}
                  >
                    <span aria-hidden="true" className={GLASS_SHEEN_PILL} />

                    <span
                      className="relative w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: s.color,
                        boxShadow: `0 1px 2px ${s.color}66`,
                      }}
                      aria-hidden="true"
                    />
                    <span className="relative text-gray-900 dark:text-white truncate">
                      {s.name}
                    </span>
                    {active && (
                      <Check
                        size={13}
                        strokeWidth={3}
                        className="relative shrink-0 text-sky-600 dark:text-sky-300"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Напоминание ──────────────────────────── */}
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
            <Bell
              size={14}
              className="text-sky-500 dark:text-sky-400"
              aria-hidden="true"
            />
            Напоминание
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {REMINDER_OPTIONS.map((opt) => {
              const active = reminder === opt.id;
              const Icon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReminder(opt.id)}
                  aria-pressed={active}
                  title={opt.hint}
                  className={cn(
                    "group relative overflow-hidden flex flex-col items-center gap-1.5",
                    "px-2 py-3 rounded-2xl",
                    "transition-transform duration-200",
                    GLASS_BODY,
                    "hover:-translate-y-0.5"
                  )}
                  style={
                    active ? { boxShadow: activeRingShadow(opt.tintActiveColor) } : undefined
                  }
                >
                  <span aria-hidden="true" className={GLASS_SHEEN} />

                  {/* Иконка-плашка: стекло + цветной оттенок в обоих состояниях */}
                  <div
                    className={cn(
                      "relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden",
                      "ring-1 backdrop-blur-3xl transition-all duration-300",
                      "bg-white/[0.06] dark:bg-white/[0.02]",
                      active ? "text-white ring-white/40" : [opt.tint, opt.tintRing]
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: `${opt.tintActiveColor}cc`,
                            boxShadow: `0 4px 14px ${opt.tintActiveGlow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
                          }
                        : undefined
                    }
                    aria-hidden="true"
                  >
                    <Icon size={16} className="relative" />
                  </div>

                  <span className="relative text-[11px] font-medium text-gray-800 dark:text-gray-100 leading-tight text-center">
                    {opt.short}
                  </span>

                  {active && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white",
                        "ring-1 ring-white/60 dark:ring-white/20",
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                      )}
                      style={{ backgroundColor: `${opt.tintActiveColor}cc` }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};