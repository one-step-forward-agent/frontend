// src/components/onboarding/FieldOfActivity.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  GraduationCap,
  Dumbbell,
  Languages,
  HeartPulse,
  Home,
  Coffee,
  Users,
  BookOpen,
  Palette,
  Plus,
  X,
  GripVertical,
  Sparkles,
  Check,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding, Sphere } from "./OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const TOTAL = 10;

type Preset = {
  name: string;
  icon: LucideIcon;
  gradient: string;
};

const PRESETS: Preset[] = [
  { name: "Работа",        icon: Briefcase,     gradient: "from-blue-400 to-blue-600" },
  { name: "Учёба",         icon: GraduationCap, gradient: "from-emerald-400 to-teal-600" },
  { name: "Спорт",         icon: Dumbbell,      gradient: "from-orange-400 to-red-500" },
  { name: "Языки",         icon: Languages,     gradient: "from-violet-400 to-purple-600" },
  { name: "Здоровье",      icon: HeartPulse,    gradient: "from-rose-400 to-pink-600" },
  { name: "Дом и быт",     icon: Home,          gradient: "from-amber-400 to-orange-500" },
  { name: "Отдых",         icon: Coffee,        gradient: "from-cyan-400 to-sky-600" },
  { name: "Отношения",     icon: Users,         gradient: "from-fuchsia-400 to-pink-600" },
  { name: "Саморазвитие",  icon: BookOpen,      gradient: "from-indigo-400 to-blue-600" },
  { name: "Хобби",         icon: Palette,       gradient: "from-lime-400 to-green-500" },
];

// Мягкая палитра — 10 цветов, доступных для сфер
const PALETTE = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f97316", // orange-500
  "#8b5cf6", // violet-500
  "#14b8a6", // teal-500
  "#6366f1", // indigo-500
  "#ec4899", // pink-500
  "#a16207", // amber-700
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
];

const uid = () => Math.random().toString(36).slice(2, 9);

export const FieldOfActivity: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [spheres, setSpheres] = React.useState<Sphere[]>(data.spheres);
  const [custom, setCustom] = React.useState("");
  const [showCustom, setShowCustom] = React.useState(false);

  const usedColors = new Set(spheres.map((s) => s.color));
  const nextColor = PALETTE.find((c) => !usedColors.has(c)) ?? PALETTE[0];

  const togglePreset = (name: string) => {
    const existing = spheres.find((s) => s.name === name);
    if (existing) {
      setSpheres((prev) =>
        prev.filter((s) => s.id !== existing.id).map((s, i) => ({ ...s, priority: i }))
      );
    } else {
      setSpheres((prev) => [
        ...prev,
        { id: uid(), name, color: nextColor, priority: prev.length },
      ]);
    }
  };

  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    if (spheres.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSpheres((prev) => [
      ...prev,
      { id: uid(), name, color: nextColor, priority: prev.length },
    ]);
    setCustom("");
    setShowCustom(false);
  };

  const removeSphere = (id: string) => {
    setSpheres((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, priority: i }))
    );
  };

  const cycleColor = (id: string) => {
    setSpheres((prev) => {
      const used = new Set(prev.filter((s) => s.id !== id).map((s) => s.color));
      const current = prev.find((s) => s.id === id);
      if (!current) return prev;
      const free = PALETTE.filter((c) => !used.has(c) && c !== current.color);
      if (free.length === 0) return prev;
      return prev.map((s) => (s.id === id ? { ...s, color: free[0] } : s));
    });
  };

  const handleNext = () => {
    if (spheres.length === 0) return;
    update("spheres", spheres);
    navigate("/onboarding/tone-of-voice");
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={TOTAL}
      title="Отметьте важные для вас сферы"
      subtitle="Я учту их и помогу не потерять важное из виду. Изменить сферы всегда можно в настройках."
      onBack={() => navigate("/onboarding/for-what-using")}
      onNext={handleNext}
      nextDisabled={spheres.length === 0}
      nextLabel={`Далее${spheres.length > 0 ? ` · ${spheres.length}` : ""}`}
    >
      <div className="relative">
        {/* Мягкое свечение за карточками */}
        <div
          aria-hidden="true"
          className="absolute -inset-8 -z-10 pointer-events-none"
        >
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-violet-400/15 blur-3xl" />
        </div>

        {/* ─── Сетка пресетов ───────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {PRESETS.map((p) => {
            const sphere = spheres.find((s) => s.name === p.name);
            const active = !!sphere;
            const Icon = p.icon;

            return (
              <button
                key={p.name}
                type="button"
                onClick={() => togglePreset(p.name)}
                aria-pressed={active}
                className={cn(
                  "group relative text-left",
                  "rounded-2xl p-3",
                  "bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm",
                  "border transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-lg",
                  active
                    ? "border-transparent ring-2 ring-blue-500/60 shadow-md"
                    : "border-gray-200/70 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {/* Иконка с градиентом */}
                  <div
                    className={cn(
                      "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm",
                      "bg-gradient-to-br transition-transform duration-300",
                      "group-hover:scale-105",
                      p.gradient
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </div>

                  {/* Название */}
                  <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-white truncate">
                    {p.name}
                  </span>

                  {/* Индикатор */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                      active
                        ? "bg-blue-500 border-blue-500 text-white scale-100"
                        : "border-gray-300 dark:border-gray-600 scale-90"
                    )}
                    style={active && sphere ? { backgroundColor: sphere.color, borderColor: sphere.color } : undefined}
                  >
                    {active && <Check size={12} strokeWidth={3} />}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Карточка «+ Своя сфера» */}
          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            aria-pressed={showCustom}
            className={cn(
              "group text-left",
              "rounded-2xl p-3",
              "border-2 border-dashed transition-all duration-300",
              "hover:-translate-y-0.5",
              showCustom
                ? "border-blue-500/60 bg-blue-50/50 dark:bg-blue-950/30"
                : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-sm",
                  "transition-transform duration-300 group-hover:scale-105"
                )}
                aria-hidden="true"
              >
                <Plus size={18} />
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Своя сфера
              </span>
            </div>
          </button>
        </div>

        {/* ─── Ввод своей сферы ─────────────────────────── */}
        {showCustom && (
          <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustom();
                if (e.key === "Escape") {
                  setShowCustom(false);
                  setCustom("");
                }
              }}
              placeholder="Например: Пилатес, Волонтёрство, Книги..."
              aria-label="Название новой сферы"
              autoFocus
            />
            <Button type="button" onClick={addCustom} disabled={!custom.trim()}>
              Добавить
            </Button>
          </div>
        )}

        {/* ─── Выбранные сферы ──────────────────────────── */}
        {spheres.length > 0 && (
          <Card className="mt-6 relative overflow-hidden">
            {/* Декоративный градиент в углу */}
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-3xl"
            />

            <CardContent className="relative">
              {/* Заголовок + метка */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    aria-hidden="true"
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
                  >
                    <Sparkles size={13} />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Ваши сферы
                  </p>
                </div>
                <Badge variant="default">
                  <span className="tabular-nums">{spheres.length}</span>
                </Badge>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Порядок = приоритет. Клик по цвету — сменить. Убрать — удалить.
              </p>

              {/* Список */}
              <ul className="space-y-1.5">
                {spheres.map((s, i) => (
                  <li
                    key={s.id}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      "bg-gray-50/70 dark:bg-gray-800/40",
                      "border border-gray-100 dark:border-gray-800",
                      "hover:bg-white hover:dark:bg-gray-800/70 hover:shadow-sm",
                      "transition-all"
                    )}
                  >
                    {/* Хват для перетаскивания (визуально) */}
                    <GripVertical
                      size={14}
                      className="text-gray-300 dark:text-gray-600 shrink-0"
                      aria-hidden="true"
                    />

                    {/* Номер приоритета */}
                    <span className="shrink-0 w-5 h-5 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-center tabular-nums">
                      {i + 1}
                    </span>

                    {/* Кружок цвета — клик меняет */}
                    <button
                      type="button"
                      onClick={() => cycleColor(s.id)}
                      className={cn(
                        "shrink-0 w-6 h-6 rounded-full",
                        "ring-2 ring-white/80 dark:ring-gray-900/80",
                        "shadow-sm hover:scale-110 transition-transform"
                      )}
                      style={{ backgroundColor: s.color }}
                      title="Сменить цвет"
                      aria-label={`Сменить цвет сферы ${s.name}`}
                    />

                    {/* Название */}
                    <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {s.name}
                    </span>

                    {/* Удалить */}
                    <button
                      type="button"
                      onClick={() => removeSphere(s.id)}
                      className={cn(
                        "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                        "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40",
                        "transition-colors",
                        "opacity-0 group-hover:opacity-100 focus:opacity-100"
                      )}
                      title="Убрать сферу"
                      aria-label={`Убрать сферу ${s.name}`}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ─── Подсказка, если ничего не выбрано ────────── */}
        {spheres.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Выберите хотя бы одну сферу, чтобы продолжить
          </p>
        )}
      </div>
    </OnboardingLayout>
  );
};