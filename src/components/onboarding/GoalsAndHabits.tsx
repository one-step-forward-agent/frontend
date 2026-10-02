// src/components/onboarding/GoalsAndHabits.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Sparkles,
  Trophy,
  Rocket,
  Heart,
  Star,
  Flag,
  Flame,
  Plus,
  X,
  Lightbulb,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const TOTAL = 10;

// Список иконок и градиентов — циклически присваиваем каждой новой цели
const GOAL_VISUALS: { icon: LucideIcon; gradient: string }[] = [
  { icon: Target,  gradient: "from-blue-400 to-indigo-600" },
  { icon: Sparkles, gradient: "from-violet-400 to-purple-600" },
  { icon: Trophy,  gradient: "from-amber-400 to-orange-500" },
  { icon: Rocket,  gradient: "from-cyan-400 to-sky-600" },
  { icon: Heart,   gradient: "from-pink-400 to-rose-500" },
  { icon: Star,    gradient: "from-yellow-400 to-amber-500" },
  { icon: Flag,    gradient: "from-emerald-400 to-teal-600" },
  { icon: Flame,   gradient: "from-red-400 to-orange-500" },
];

// Быстрые подсказки — клик добавляет цель сразу
const SUGGESTIONS = [
  "Заниматься спортом 3 раза в неделю",
  "Учить английский по 20 минут",
  "Читать каждый день",
  "Больше гулять",
  "Рано вставать",
  "Медитировать",
];

export const GoalsAndHabits: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [goal, setGoal] = React.useState("");
  const [goals, setGoals] = React.useState<string[]>(data.goals);

  const add = (value?: string) => {
    const v = (value ?? goal).trim();
    if (!v) return;
    if (goals.some((g) => g.toLowerCase() === v.toLowerCase())) {
      setGoal("");
      return;
    }
    setGoals((prev) => [...prev, v]);
    setGoal("");
  };

  const remove = (value: string) => {
    setGoals((prev) => prev.filter((g) => g !== value));
  };

  const handleNext = () => {
    update("goals", goals);
    navigate("/onboarding/existing-plans");
  };

  const handleSkip = () => {
    update("goals", []);
    navigate("/onboarding/existing-plans");
  };

  return (
    <OnboardingLayout
      step={4}
      totalSteps={TOTAL}
      title="Что вы хотите встроить в свою жизнь?"
      subtitle="Например: «Заниматься спортом 3 раза в неделю», «Учить английский», «Больше читать». Пока это просто намерения — детали поможем уточнить позже."
      onBack={() => navigate("/onboarding/tone-of-voice")}
      onNext={handleNext}
      onSkip={handleSkip}
      nextLabel={`Далее${goals.length > 0 ? ` · ${goals.length}` : ""}`}
    >
      <div className="relative">
        {/* Мягкое свечение за карточками */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 pointer-events-none"
        >
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-blue-400/15 blur-3xl" />
        </div>

        {/* ─── Поле ввода ────────────────────────────────── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Target
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            />
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Например: бегать 3 раза в неделю"
              aria-label="Новое намерение"
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            onClick={() => add()}
            disabled={!goal.trim()}
            className="shrink-0"
          >
            <Plus size={16} className="mr-1" aria-hidden="true" />
            Добавить
          </Button>
        </div>

        {/* ─── Быстрые подсказки ─────────────────────────── */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb
              size={14}
              className="text-amber-500"
              aria-hidden="true"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Или выберите из готовых
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => {
              const already = goals.some(
                (g) => g.toLowerCase() === s.toLowerCase()
              );
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => add(s)}
                  disabled={already}
                  className={cn(
                    "group inline-flex items-center gap-1.5",
                    "px-3 py-1.5 rounded-full text-xs font-medium",
                    "border transition-all duration-200",
                    already
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 cursor-default"
                      : "bg-white/70 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-sm"
                  )}
                >
                  <Plus
                    size={12}
                    className={cn(
                      "transition-transform",
                      !already && "group-hover:rotate-90"
                    )}
                    aria-hidden="true"
                  />
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Список добавленных целей ─────────────────── */}
        {goals.length > 0 && (
          <Card className="mt-6 relative overflow-hidden">
            {/* Декоративный градиент */}
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/20 to-rose-500/20 blur-3xl"
            />

            <CardContent className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    aria-hidden="true"
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm"
                  >
                    <Sparkles size={13} />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Ваши намерения
                  </p>
                </div>
                <Badge variant="default">
                  <span className="tabular-nums">{goals.length}</span>
                </Badge>
              </div>

              <ul className="space-y-2">
                {goals.map((g, i) => {
                  const visual = GOAL_VISUALS[i % GOAL_VISUALS.length];
                  const Icon = visual.icon;
                  return (
                    <li
                      key={g}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-3 rounded-xl",
                        "bg-gray-50/70 dark:bg-gray-800/40",
                        "border border-gray-100 dark:border-gray-800",
                        "hover:bg-white hover:dark:bg-gray-800/70 hover:shadow-sm",
                        "transition-all",
                        "animate-in fade-in slide-in-from-bottom-1 duration-300"
                      )}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {/* Иконка с градиентом */}
                      <div
                        className={cn(
                          "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm",
                          "bg-gradient-to-br",
                          visual.gradient
                        )}
                        aria-hidden="true"
                      >
                        <Icon size={16} />
                      </div>

                      {/* Текст цели */}
                      <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-gray-100">
                        {g}
                      </span>

                      {/* Удалить */}
                      <button
                        type="button"
                        onClick={() => remove(g)}
                        className={cn(
                          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                          "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40",
                          "transition-colors",
                          "opacity-0 group-hover:opacity-100 focus:opacity-100"
                        )}
                        title="Убрать"
                        aria-label={`Убрать цель «${g}»`}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* CTA-подсказка снизу карточки */}
              <button
                type="button"
                onClick={handleNext}
                className={cn(
                  "mt-4 w-full flex items-center justify-between px-3 py-2.5 rounded-xl",
                  "bg-blue-50/70 dark:bg-blue-950/30",
                  "border border-blue-100 dark:border-blue-900/60",
                  "text-sm font-medium text-blue-700 dark:text-blue-300",
                  "hover:bg-blue-100/70 dark:hover:bg-blue-950/50 transition-colors"
                )}
              >
                <span>Продолжить</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </CardContent>
          </Card>
        )}

        {/* ─── Пустое состояние ─────────────────────────── */}
        {goals.length === 0 && (
          <div className="mt-6 flex flex-col items-center text-center py-8">
            <div
              aria-hidden="true"
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center mb-3"
            >
              <Target
                size={24}
                className="text-blue-500 dark:text-blue-400"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Добавьте хотя бы одно намерение — или пропустите шаг, если пока не готовы формулировать.
            </p>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};