// src/components/onboarding/SuccessAndLearning.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  PartyPopper,
  Sun,
  MessageCircle,
  Settings2,
  Sparkles,
  Check,
  CalendarDays,
  Target,
  Link2,
  Clock,
  ArrowRight,
  Rocket,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { InteractiveButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const TOTAL = 10;

type Highlight = {
  icon: LucideIcon;
  gradient: string;
  title: string;
  text: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    icon: Sun,
    gradient: "from-amber-400 to-orange-500",
    title: "Экран «Сегодня»",
    text: "Каждое утро — понятный план дня и прогресс.",
  },
  {
    icon: MessageCircle,
    gradient: "from-blue-400 to-indigo-600",
    title: "Чат с Deyla",
    text: "Добавляйте, переносите и уточняйте задачи прямо словами.",
  },
  {
    icon: Settings2,
    gradient: "from-violet-400 to-purple-600",
    title: "Настройки под вас",
    text: "Сферы, тон общения, интеграции — всё можно поменять.",
  },
];

export const SuccessAndLearning: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  const finish = () => {
    // TODO: await api.completeOnboarding(data);
    navigate("/dashboard", { replace: true });
  };

  // Собираем короткие фразы для сводки — показываем только то, что заполнено
  const summary = React.useMemo(() => {
    const items: { icon: LucideIcon; label: string; value: string }[] = [];

    if (data.spheres.length > 0) {
      items.push({
        icon: Target,
        label: "Сферы",
        value: `${data.spheres.length} ${plural(data.spheres.length, "сфера", "сферы", "сфер")}`,
      });
    }

    if (data.goals.length > 0) {
      items.push({
        icon: Sparkles,
        label: "Намерения",
        value: `${data.goals.length} ${plural(data.goals.length, "цель", "цели", "целей")}`,
      });
    }

    if (data.workDays.length > 0) {
      items.push({
        icon: CalendarDays,
        label: "Рабочих дней",
        value: `${data.workDays.length} · ${data.workHoursFrom}–${data.workHoursTo}`,
      });
    }

    if ((data.integrations ?? []).length > 0) {
      items.push({
        icon: Link2,
        label: "Интеграции",
        value: `${data.integrations.length} ${plural(data.integrations.length, "сервис", "сервиса", "сервисов")}`,
      });
    }

    return items;
  }, [data]);

  return (
    <OnboardingLayout
      step={TOTAL}
      totalSteps={TOTAL}
      title="Всё готово!"
      subtitle="Дальше — только вы и ваш план. Я рядом."
      onBack={() => navigate("/onboarding/lets-plan-tomorrow")}
    >
      <div className="relative space-y-5">
        {/* ─── Праздничный бэкграунд ─────────────────────── */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 pointer-events-none"
        >
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute top-1/3 -right-6 w-64 h-64 rounded-full bg-pink-400/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-violet-400/20 blur-3xl" />
        </div>

        {/* ─── Главный праздничный блок ──────────────────── */}
        <Card className="relative overflow-hidden">
          {/* Градиентная подложка */}
          <div
            aria-hidden="true"
            className="
              absolute inset-0
              bg-gradient-to-br
              from-blue-500/10 via-purple-500/5 to-pink-500/10
              dark:from-blue-500/15 dark:via-purple-500/10 dark:to-pink-500/15
            "
          />

          <CardContent className="relative p-6 md:p-8 text-center">
            {/* Иконка праздника */}
            <div className="relative flex justify-center mb-5">
              {/* Пузырьки вокруг */}
              <span
                aria-hidden="true"
                className="absolute -top-1 left-1/4 w-2 h-2 rounded-full bg-amber-400 animate-pulse"
              />
              <span
                aria-hidden="true"
                className="absolute top-2 right-1/4 w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-1/3 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"
                style={{ animationDelay: "600ms" }}
              />

              <div
                aria-hidden="true"
                className="
                  relative w-16 h-16 rounded-2xl
                  bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600
                  flex items-center justify-center text-white
                  shadow-lg ring-4 ring-white/60 dark:ring-gray-900/60
                "
              >
                <PartyPopper size={28} />
              </div>
            </div>

            <p className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
              Онбординг пройден
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Чем больше мы планируем вместе, тем точнее становятся мои
              рекомендации. Вы подтверждаете любые изменения — финальное решение
              всегда за вами.
            </p>
          </CardContent>
        </Card>

        {/* ─── Что вас ждёт ──────────────────────────────── */}
        <div>
          <p className="text-xs uppercase tracking-widest font-medium text-gray-500 dark:text-gray-400 mb-3">
            Что вас ждёт
          </p>

          <div className="grid md:grid-cols-3 gap-3">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <Card
                  key={h.title}
                  className="relative overflow-hidden group hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm",
                        "bg-gradient-to-br transition-transform duration-300",
                        "group-hover:scale-105",
                        h.gradient
                      )}
                      aria-hidden="true"
                    >
                      <Icon size={18} />
                    </div>
                    <p className="mt-3 font-medium text-gray-900 dark:text-white text-sm">
                      {h.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-snug">
                      {h.text}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ─── Сводка по вашим ответам ───────────────────── */}
        {summary.length > 0 && (
          <Card className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-400/20 to-sky-500/20 blur-3xl"
            />

            <CardContent className="relative p-5">
              <div className="flex items-center gap-2 mb-4">
                <div
                  aria-hidden="true"
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-sm"
                >
                  <Check size={13} strokeWidth={3} />
                </div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  Ваш профиль настроен
                </p>
              </div>

              <ul className="grid sm:grid-cols-2 gap-2.5">
                {summary.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li
                      key={s.label}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                        "bg-gray-50/70 dark:bg-gray-800/40",
                        "border border-gray-100 dark:border-gray-800"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="shrink-0 w-8 h-8 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300"
                      >
                        <Icon size={14} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {s.label}
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                          {s.value}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Сферы — если выбраны, показываем их цветными бейджами */}
              {data.spheres.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] uppercase tracking-widest font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Ваши сферы
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.spheres.map((s) => (
                      <Badge
                        key={s.id}
                        variant="neutral"
                        className="gap-1.5"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                          aria-hidden="true"
                        />
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── CTA ───────────────────────────────────────── */}
        <div className="pt-2">
          <InteractiveButton
            type="button"
            onClick={finish}
            className="w-full"
            scaleAmount={1.2}
          >
            <Rocket size={18} className="mr-2" aria-hidden="true" />
            Начать
            <ArrowRight size={18} className="ml-2" aria-hidden="true" />
          </InteractiveButton>

          <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
            Настройки можно изменить в любой момент
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
};

// ─── Утилита склонения ───────────────────────────────────

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}