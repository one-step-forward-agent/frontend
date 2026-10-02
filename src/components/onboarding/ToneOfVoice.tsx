// src/components/onboarding/ToneOfVoice.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Minus,
  Flame,
  ShieldAlert,
  Sparkles,
  Check,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding, OnboardingData } from "./OnboardingContext";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

const TOTAL = 10;

type Tone = NonNullable<OnboardingData["toneOfVoice"]>;

type ToneOption = {
  id: Tone;
  label: string;
  hint: string;
  example: string;
  icon: LucideIcon;
  gradient: string;
  ring: string;
};

const OPTIONS: ToneOption[] = [
  {
    id: "supportive",
    label: "Мягкий, поддерживающий",
    hint: "Бережно, без давления",
    example: "Есть свободное окно — можно использовать его для этой задачи, если удобно.",
    icon: Heart,
    gradient: "from-pink-400 to-rose-500",
    ring: "ring-pink-400/60",
  },
  {
    id: "neutral",
    label: "Нейтральный",
    hint: "Факты без эмоций",
    example: "Есть свободное окно 15:00–16:00. Поставить задачу сюда?",
    icon: Minus,
    gradient: "from-slate-400 to-slate-600",
    ring: "ring-slate-400/60",
  },
  {
    id: "motivating",
    label: "Мотивирующий",
    hint: "Чуть энергичнее, но без давления",
    example: "Нашлось удобное окно. Запланировать задачу и закрыть её сегодня?",
    icon: Flame,
    gradient: "from-amber-400 to-orange-500",
    ring: "ring-amber-400/60",
  },
  {
    id: "strict",
    label: "Строгий",
    hint: "Максимально деловой",
    example: "Свободно 15:00–16:00. Запланировать?",
    icon: ShieldAlert,
    gradient: "from-red-500 to-rose-600",
    ring: "ring-red-400/60",
  },
];

export const ToneOfVoice: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [selected, setSelected] = React.useState<Tone | null>(data.toneOfVoice);

  const handleNext = () => {
    if (!selected) return;
    update("toneOfVoice", selected);
    navigate("/onboarding/goals-and-habits");
  };

  return (
    <OnboardingLayout
      step={3}
      totalSteps={TOTAL}
      title="Как со мной общаться?"
      subtitle="Тон влияет только на формулировки. Правила планирования не меняются."
      onBack={() => navigate("/onboarding/field-of-activity")}
      onNext={handleNext}
      nextDisabled={!selected}
    >
      <div className="relative">
        {/* Мягкое свечение за карточками */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 pointer-events-none"
        >
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-pink-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-violet-400/15 blur-3xl" />
        </div>

        <div
          className="space-y-3"
          role="radiogroup"
          aria-label="Тон общения"
        >
          {OPTIONS.map((opt) => {
            const active = selected === opt.id;
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(opt.id)}
                className="group block w-full text-left"
              >
                <Card
                  className={cn(
                    "relative overflow-hidden p-0 transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-lg",
                    active
                      ? "border-transparent ring-2 ring-blue-500/60 shadow-md"
                      : "border-gray-200/70 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  {/* Декоративный градиент в углу — виден, когда выбрано */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl transition-opacity duration-500",
                      "bg-gradient-to-br",
                      opt.gradient,
                      active ? "opacity-30" : "opacity-0 group-hover:opacity-15"
                    )}
                  />

                  <CardContent className="relative p-4 md:p-5">
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
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white leading-snug">
                              {opt.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {opt.hint}
                            </p>
                          </div>

                          {/* Радио-индикатор */}
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

                        {/* Пример-бабл */}
                        <div
                          className={cn(
                            "mt-3 rounded-xl px-3 py-2.5",
                            "bg-gray-50/80 dark:bg-gray-800/50",
                            "border border-gray-100 dark:border-gray-800",
                            "transition-colors"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <MessageCircle
                              size={14}
                              className="shrink-0 mt-0.5 text-gray-400 dark:text-gray-500"
                              aria-hidden="true"
                            />
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-snug">
                              «{opt.example}»
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        {/* Подпись под списком */}
        {selected && (
          <div className="mt-5 flex items-center justify-center gap-2 animate-in fade-in duration-300">
            <Sparkles
              size={14}
              className="text-blue-500"
              aria-hidden="true"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Стиль общения можно поменять в настройках в любой момент
            </p>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};