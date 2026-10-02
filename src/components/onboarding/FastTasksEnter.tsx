// src/components/onboarding/FastTasksEnter.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  PenLine,
  Sparkles,
  Bell,
  BellOff,
  Clock,
  AlarmClock,
  Sunrise,
  CalendarDays,
  Check,
  Tag,
  Info,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";

const TOTAL = 10;

type ReminderOption = {
  id: "off" | "10m" | "30m" | "1h" | "1d";
  label: string;
  short: string;
  hint: string;
  icon: LucideIcon;
  gradient: string;
};

const REMINDER_OPTIONS: ReminderOption[] = [
  {
    id: "off",
    label: "Без напоминания",
    short: "Выкл",
    hint: "Напомню, если попросите",
    icon: BellOff,
    gradient: "from-slate-400 to-slate-600",
  },
  {
    id: "10m",
    label: "За 10 минут",
    short: "10 мин",
    hint: "Прямо перед началом",
    icon: Clock,
    gradient: "from-cyan-400 to-sky-600",
  },
  {
    id: "30m",
    label: "За 30 минут",
    short: "30 мин",
    hint: "Время собраться",
    icon: AlarmClock,
    gradient: "from-blue-400 to-indigo-600",
  },
  {
    id: "1h",
    label: "За час",
    short: "1 час",
    hint: "Успеть переключиться",
    icon: Bell,
    gradient: "from-violet-400 to-purple-600",
  },
  {
    id: "1d",
    label: "За день",
    short: "1 день",
    hint: "Накануне, вечером",
    icon: Sunrise,
    gradient: "from-amber-400 to-orange-500",
  },
];

export const FastTasksEnter: React.FC = () => {
  const navigate = useNavigate();
  const { data, patch } = useOnboarding();
  const [title, setTitle] = React.useState(data.firstTask.title);
  const [sphereId, setSphereId] = React.useState<string | null>(
    data.firstTask.sphereId ?? data.spheres[0]?.id ?? null
  );
  const [reminder, setReminder] = React.useState(data.firstTask.reminder);

  const activeSphere = data.spheres.find((s) => s.id === sphereId) ?? null;
  const activeReminder = REMINDER_OPTIONS.find((r) => r.id === reminder) ?? null;
  const canContinue = title.trim().length > 0;

  const handleNext = () => {
    if (!canContinue) return;
    patch({
      firstTask: { title: title.trim(), sphereId, reminder },
    });
    navigate("/onboarding/lets-plan-tomorrow");
  };

  return (
    <OnboardingLayout
      step={8}
      totalSteps={TOTAL}
      title="Создайте первую задачу"
      subtitle="Пока без даты и времени — их можно будет добавить позже. Это первые 30 секунд вашей новой привычки."
      onBack={() => navigate("/onboarding/sources-import")}
      onNext={handleNext}
      nextDisabled={!canContinue}
    >
      <div className="relative space-y-5">
        {/* Мягкое свечение на фоне */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 pointer-events-none"
        >
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl" />
        </div>

        {/* ─── Название задачи ──────────────────────────── */}
        <div>
          <label
            htmlFor="first-task-title"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            <PenLine
              size={14}
              className="text-blue-500 dark:text-blue-400"
              aria-hidden="true"
            />
            Название задачи
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <Input
            id="first-task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: подготовить отчёт"
            autoFocus
          />
        </div>

        {/* ─── Сфера ────────────────────────────────────── */}
        {data.spheres.length > 0 && (
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
              <Tag
                size={14}
                className="text-blue-500 dark:text-blue-400"
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
                      "group inline-flex items-center gap-2",
                      "px-3 py-2 rounded-full text-sm font-medium",
                      "border transition-all duration-200",
                      "hover:-translate-y-0.5",
                      active
                        ? "bg-white dark:bg-gray-800 border-transparent shadow-md ring-2"
                        : "bg-white/70 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
                    )}
                    style={active ? { boxShadow: `0 0 0 2px ${s.color}40`, borderColor: s.color } : undefined}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: s.color }}
                      aria-hidden="true"
                    />
                    <span className="text-gray-900 dark:text-white">{s.name}</span>
                    {active && (
                      <Check
                        size={13}
                        strokeWidth={3}
                        className="text-emerald-500"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Напоминание ──────────────────────────────── */}
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">
            <Bell
              size={14}
              className="text-blue-500 dark:text-blue-400"
              aria-hidden="true"
            />
            Напоминание
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
                    "group relative flex flex-col items-center gap-1.5",
                    "px-2 py-3 rounded-2xl",
                    "bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm",
                    "border transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-md",
                    active
                      ? "border-transparent ring-2 ring-blue-500/60 shadow-md"
                      : "border-gray-200/70 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm",
                      "bg-gradient-to-br transition-transform duration-300",
                      "group-hover:scale-105",
                      opt.gradient
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={16} />
                  </div>
                  <span className="text-[11px] font-medium text-gray-800 dark:text-gray-100 leading-tight text-center">
                    {opt.short}
                  </span>

                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm"
                    >
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {reminder !== "off" && !data.telegramConnected && (
            <Alert variant="info" className="mt-3">
              Напоминания приходят в Telegram. Подключить бота можно на
              следующем шаге.
            </Alert>
          )}
        </div>

        {/* ─── Превью задачи ────────────────────────────── */}
        <Card className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-blue-400/20 to-amber-500/20 blur-3xl"
          />

          <CardContent className="relative p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div
                aria-hidden="true"
                className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
              >
                <Sparkles size={13} />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Так задача появится у вас
              </p>
            </div>

            {/* Строка-предпросмотр — как в календаре */}
            <div
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl",
                "bg-white dark:bg-gray-800",
                "border border-gray-200/70 dark:border-gray-700/60 shadow-sm"
              )}
            >
              {/* Цветная полоса сферы */}
              <span
                className="w-1 self-stretch rounded shrink-0"
                style={{
                  backgroundColor: activeSphere?.color ?? "#9ca3af",
                }}
                aria-hidden="true"
              />

              {/* Название */}
              <span
                className={cn(
                  "flex-1 min-w-0 text-sm truncate",
                  title.trim()
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500 italic"
                )}
              >
                {title.trim() || "Название задачи"}
              </span>

              {/* Сфера-бейдж */}
              {activeSphere && (
                <Badge
                  variant="neutral"
                  className="shrink-0 gap-1.5"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activeSphere.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate max-w-[100px]">{activeSphere.name}</span>
                </Badge>
              )}

              {/* Напоминание */}
              {activeReminder && activeReminder.id !== "off" && (
                <span
                  className="shrink-0 hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400"
                  title={activeReminder.hint}
                >
                  <Bell size={11} aria-hidden="true" />
                  {activeReminder.short}
                </span>
              )}
            </div>

            {/* Подпись */}
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              <Info size={11} className="shrink-0 mt-0.5" aria-hidden="true" />
              Дата и время появятся позже — их можно будет добавить в один клик
              или через чат.
            </p>
          </CardContent>
        </Card>
      </div>
    </OnboardingLayout>
  );
};