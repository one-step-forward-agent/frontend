// src/components/onboarding/ForWhatUsing.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Bell,
  ListChecks,
  Scale,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Button, InteractiveButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const TOTAL = 10; // Start больше не в счётчике — начинается с ForWhatUsing

type Option = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  gradient: string;
  ring: string;
};

const OPTIONS: Option[] = [
  {
    id: "productivity",
    label: "Повысить продуктивность",
    hint: "Успевать больше без выгорания",
    icon: Zap,
    gradient: "from-amber-400 to-orange-500",
    ring: "ring-amber-400/40",
  },
  {
    id: "remember",
    label: "Не забывать",
    hint: "Держать всё под рукой",
    icon: Bell,
    gradient: "from-sky-400 to-blue-500",
    ring: "ring-sky-400/40",
  },
  {
    id: "order",
    label: "Навести порядок в делах",
    hint: "Собрать всё в одном месте",
    icon: ListChecks,
    gradient: "from-emerald-400 to-teal-500",
    ring: "ring-emerald-400/40",
  },
  {
    id: "balance",
    label: "Совмещать работу и личное",
    hint: "Баланс без перекосов",
    icon: Scale,
    gradient: "from-pink-400 to-rose-500",
    ring: "ring-pink-400/40",
  },
  {
    id: "goals",
    label: "Двигаться к своим целям",
    hint: "Маленькими шагами каждый день",
    icon: Target,
    gradient: "from-violet-400 to-purple-600",
    ring: "ring-violet-400/40",
  },
  {
    id: "time",
    label: "Понять, куда уходит время",
    hint: "Увидеть настоящую картину дня",
    icon: Clock,
    gradient: "from-cyan-400 to-indigo-500",
    ring: "ring-cyan-400/40",
  },
];

export const ForWhatUsing: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [selected, setSelected] = React.useState<string[]>(data.purpose);
  const [confirmed, setConfirmed] = React.useState(data.purpose.length > 0);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
    setConfirmed(false);
  };

  const handleConfirm = () => {
    update("purpose", selected);
    setConfirmed(true);
  };

  const handleNext = () => navigate("/onboarding/field-of-activity");

  return (
    <OnboardingLayout
      step={1}
      totalSteps={TOTAL}
      title="Зачем тебе приложение?"
      subtitle="Выберите всё, что откликается — можно несколько вариантов."
      onBack={() => navigate("/onboarding/start")}
      onNext={handleNext}
      nextDisabled={!confirmed || selected.length === 0}
      nextLabel={confirmed ? "Далее" : "Подтвердить"}
    >
      <div className="relative">
        {/* Мягкое свечение за карточками */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 pointer-events-none"
        >
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-purple-400/15 blur-3xl" />
        </div>

        {/* Сетка карточек с опциями */}
        <div className="grid sm:grid-cols-2 gap-3">
          {OPTIONS.map((opt) => {
            const active = selected.includes(opt.id);
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                aria-pressed={active}
                className={cn(
                  "group relative text-left",
                  "rounded-2xl p-4",
                  "bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm",
                  "border transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-lg",
                  active
                    ? "border-transparent ring-2 ring-blue-500/60 shadow-md"
                    : "border-gray-200/70 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Иконка с градиентом */}
                  <div
                    className={cn(
                      "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm",
                      "bg-gradient-to-br transition-transform duration-300",
                      "group-hover:scale-105",
                      opt.gradient
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </div>

                  {/* Текст */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white leading-snug">
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {opt.hint}
                    </p>
                  </div>

                  {/* Индикатор выбора */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      active
                        ? "bg-blue-500 border-blue-500 text-white scale-100"
                        : "border-gray-300 dark:border-gray-600 scale-90"
                    )}
                  >
                    {active && <Check size={12} strokeWidth={3} />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Счётчик выбранного */}
        {selected.length > 0 && !confirmed && (
          <div className="mt-5 flex items-center justify-between">
            <Badge variant="default">
              <Sparkles size={11} className="mr-1" aria-hidden="true" />
              Выбрано: {selected.length}
            </Badge>

            <Button type="button" onClick={handleConfirm}>
              Подтвердить
            </Button>
          </div>
        )}

        {/* Ответ Астер после подтверждения */}
        {confirmed && (
          <Card className="mt-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Декоративный градиент в углу */}
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/30 blur-3xl"
            />

            <CardContent className="relative">
              <div className="flex items-start gap-3">
                {/* Аватар Астер */}
                <div
                  aria-hidden="true"
                  className="
                    shrink-0 w-10 h-10 rounded-full
                    bg-gradient-to-br from-blue-500 to-purple-600
                    flex items-center justify-center text-white
                    shadow-md ring-2 ring-white/60 dark:ring-gray-900/60
                  "
                >
                  <Sparkles size={18} />
                </div>

                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Похоже, мы нашли друг друга!
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm">
                    Я — <span className="font-semibold">Deyla</span>. Буду рядом, чтобы помочь вам:
                  </p>

                  <ul className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                    <li className="flex items-start gap-2">
                      <Check size={14} className="shrink-0 mt-0.5 text-green-500" aria-hidden="true" />
                      собрать дела в понятный план на день;
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="shrink-0 mt-0.5 text-green-500" aria-hidden="true" />
                      не потеряться среди задач;
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="shrink-0 mt-0.5 text-green-500" aria-hidden="true" />
                      понять, что делать дальше.
                    </li>
                  </ul>

                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                    Чтобы мои рекомендации были точнее, мне нужно немного узнать о вас.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="default">Выбрано: {selected.length}</Badge>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleNext}
                      className="text-blue-600 dark:text-blue-400"
                    >
                      Начать
                      <ArrowRight size={14} className="ml-1" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OnboardingLayout>
  );
};