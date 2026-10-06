// src/components/onboarding/FieldOfActivity.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase, GraduationCap, Dumbbell, Languages, HeartPulse,
  Home, Coffee, Users, BookOpen, Palette,
  Plus, X, GripVertical, Sparkles, Check,
  ChevronUp, ChevronDown,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding, Sphere } from "./OnboardingContext";
import { Button } from "@/components/ui/button";
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

type Preset = {
  name: string;
  icon: LucideIcon;
  tint: string;
  tintSoft: string;
  tintRing: string;
};

const PRESETS: Preset[] = [
  { name: "Работа",       icon: Briefcase,     tint: "text-slate-600 dark:text-slate-300",   tintSoft: "bg-slate-500/15 dark:bg-slate-400/15",   tintRing: "ring-slate-400/40 dark:ring-slate-400/30" },
  { name: "Учёба",        icon: GraduationCap, tint: "text-teal-600 dark:text-teal-300",     tintSoft: "bg-teal-500/15 dark:bg-teal-400/15",     tintRing: "ring-teal-400/40 dark:ring-teal-400/30" },
  { name: "Спорт",        icon: Dumbbell,      tint: "text-orange-600 dark:text-orange-300", tintSoft: "bg-orange-500/15 dark:bg-orange-400/15", tintRing: "ring-orange-400/40 dark:ring-orange-400/30" },
  { name: "Языки",        icon: Languages,     tint: "text-violet-600 dark:text-violet-300", tintSoft: "bg-violet-500/15 dark:bg-violet-400/15", tintRing: "ring-violet-400/40 dark:ring-violet-400/30" },
  { name: "Здоровье",     icon: HeartPulse,    tint: "text-rose-600 dark:text-rose-300",     tintSoft: "bg-rose-500/15 dark:bg-rose-400/15",     tintRing: "ring-rose-400/40 dark:ring-rose-400/30" },
  { name: "Дом и быт",    icon: Home,          tint: "text-amber-600 dark:text-amber-300",   tintSoft: "bg-amber-500/15 dark:bg-amber-400/15",   tintRing: "ring-amber-400/40 dark:ring-amber-400/30" },
  { name: "Отдых",        icon: Coffee,        tint: "text-cyan-600 dark:text-cyan-300",     tintSoft: "bg-cyan-500/15 dark:bg-cyan-400/15",     tintRing: "ring-cyan-400/40 dark:ring-cyan-400/30" },
  { name: "Отношения",    icon: Users,         tint: "text-pink-600 dark:text-pink-300",     tintSoft: "bg-pink-500/15 dark:bg-pink-400/15",     tintRing: "ring-pink-400/40 dark:ring-pink-400/30" },
  { name: "Саморазвитие", icon: BookOpen,      tint: "text-indigo-600 dark:text-indigo-300", tintSoft: "bg-indigo-500/15 dark:bg-indigo-400/15", tintRing: "ring-indigo-400/40 dark:ring-indigo-400/30" },
  { name: "Хобби",        icon: Palette,       tint: "text-lime-600 dark:text-lime-300",     tintSoft: "bg-lime-500/15 dark:bg-lime-400/15",     tintRing: "ring-lime-400/40 dark:ring-lime-400/30" },
];

const PALETTE = [
  "#64748b", "#14b8a6", "#f97316", "#8b5cf6", "#f43f5e",
  "#f59e0b", "#06b6d4", "#ec4899", "#6366f1", "#84cc16",
];

const uid = () => Math.random().toString(36).slice(2, 9);

const reorderById = (list: Sphere[], fromId: string, toId: string): Sphere[] => {
  const from = list.findIndex((s) => s.id === fromId);
  const to = list.findIndex((s) => s.id === toId);
  if (from === -1 || to === -1 || from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((s, i) => ({ ...s, priority: i }));
};

const moveByIndex = (list: Sphere[], id: string, delta: number): Sphere[] => {
  const idx = list.findIndex((s) => s.id === id);
  const target = idx + delta;
  if (idx === -1 || target < 0 || target >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(idx, 1);
  next.splice(target, 0, moved);
  return next.map((s, i) => ({ ...s, priority: i }));
};

export const FieldOfActivity: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [spheres, setSpheres] = React.useState<Sphere[]>(data.spheres);
  const [custom, setCustom] = React.useState("");
  const [showCustom, setShowCustom] = React.useState(false);

  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

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

  const removeSphere = (id: string) =>
    setSpheres((prev) =>
      prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, priority: i }))
    );

  const cycleColor = (id: string) =>
    setSpheres((prev) => {
      const used = new Set(prev.filter((s) => s.id !== id).map((s) => s.color));
      const current = prev.find((s) => s.id === id);
      if (!current) return prev;
      const free = PALETTE.filter((c) => !used.has(c) && c !== current.color);
      if (free.length === 0) return prev;
      return prev.map((s) => (s.id === id ? { ...s, color: free[0] } : s));
    });

  const handleNext = () => {
    if (spheres.length === 0) return;
    update("spheres", spheres);
    navigate("/onboarding/goals-and-habits");
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };
  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== overId) setOverId(id);
  };
  const onDragLeave = () => setOverId(null);
  const onDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    const src = draggingId ?? e.dataTransfer.getData("text/plain");
    if (src && src !== id) setSpheres((prev) => reorderById(prev, src, id));
    setDraggingId(null);
    setOverId(null);
  };
  const onDragEnd = () => {
    setDraggingId(null);
    setOverId(null);
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={TOTAL}
      title="Отметьте важные для вас сферы"
      subtitle="Я учту их и помогу не потерять важное из виду."
      onBack={() => navigate("/")}
      onNext={handleNext}
      nextDisabled={spheres.length === 0}
      nextLabel={`Далее${spheres.length > 0 ? ` · ${spheres.length}` : ""}`}
    >
      <div className="relative">
        {/* ─── Eyebrow ─────────────────────────────── */}
        <div className="mb-5 flex items-center gap-3">
          <span
            className={cn(
              "relative inline-flex items-center gap-1.5 overflow-hidden",
              "px-2.5 py-1 rounded-full",
              GLASS_BODY,
              "text-[11px] uppercase tracking-widest font-medium",
              "text-gray-600 dark:text-gray-300"
            )}
          >
            <span aria-hidden="true" className={cn(GLASS_SHEEN, "rounded-full")} />
            <Sparkles size={11} aria-hidden="true" className="relative" />
            <span className="relative">Ваши сферы</span>
          </span>
        </div>

        {/* ─── Сетка пресетов ──────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  "group relative overflow-hidden text-left",
                  "rounded-2xl p-4",
                  GLASS_BODY,
                  "transition-all duration-300",
                  "hover:-translate-y-0.5",
                  active && sphere && `ring-[1.5px]`
                )}
                style={
                  active && sphere
                    ? { boxShadow: `0 0 0 1.5px ${sphere.color}cc, 0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)` }
                    : undefined
                }
              >
                <span aria-hidden="true" className={GLASS_SHEEN} />

                <div className="relative flex items-center gap-3">
                  {/* Иконка: тот же стиль, что у карточек */}
                  <div
                    className={cn(
                      "relative shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden",
                      "ring-1 transition-all duration-300",
                      "bg-white/[0.06] dark:bg-white/[0.02]",
                      "backdrop-blur-3xl",
                      !active && [
                        p.tint,
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
                        p.tintRing,
                      ],
                      active && "text-white ring-white/40"
                    )}
                    style={
                      active && sphere
                        ? {
                            backgroundColor: `${sphere.color}cc`,
                            boxShadow: `0 4px 14px ${sphere.color}40, inset 0 1px 0 rgba(255,255,255,0.5)`,
                          }
                        : undefined
                    }
                    aria-hidden="true"
                  >
                    <Icon size={18} className="relative" />
                  </div>

                  <span className="flex-1 min-w-0 text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {p.name}
                  </span>

                </div>
              </button>
            );
          })}

          {/* «Своя сфера» — стекло + dashed ring */}
          <button
            type="button"
            onClick={() => setShowCustom((v) => !v)}
            aria-pressed={showCustom}
            className={cn(
              "group relative overflow-hidden text-left rounded-2xl p-4",
              "transition-all duration-300",
              "hover:-translate-y-0.5",
              "bg-white/[0.06] dark:bg-white/[0.02]",
              "backdrop-blur-3xl",
              "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]",
              "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]",
              showCustom
                ? "ring-2 ring-blue-400/60"
                : "ring-1 ring-white/30 dark:ring-white/10"
            )}
          >
            <span aria-hidden="true" className={GLASS_SHEEN} />

            <div className="relative flex items-center gap-3">
              <div
                className={cn(
                  "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                  "bg-white/[0.06] dark:bg-white/[0.02]",
                  "backdrop-blur-3xl",
                  "ring-1 ring-white/30 dark:ring-white/10",
                  "text-gray-700 dark:text-gray-300",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
                  "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                )}
                aria-hidden="true"
              >
                <Plus size={18} />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Своя сфера
              </span>
            </div>
          </button>
        </div>

        {/* ─── Ввод своей сферы ──────────────────── */}
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

        {/* ─── Приоритеты ─────────────────────────── */}
        {spheres.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <span
                  className={cn(
                    "relative inline-flex items-center gap-1.5 overflow-hidden",
                    "px-2.5 py-1 rounded-full",
                    GLASS_BODY,
                    "text-[11px] uppercase tracking-widest font-medium",
                    "text-gray-600 dark:text-gray-300"
                  )}
                >
                  <span aria-hidden="true" className={cn(GLASS_SHEEN, "rounded-full")} />
                  <span className="relative">Приоритеты</span>
                </span>
              </div>
            </div>

            <div className={cn("relative overflow-hidden rounded-2xl", GLASS_BODY)}>
              <span aria-hidden="true" className={GLASS_SHEEN} />

              <div className="relative p-3 sm:p-4">
                <ul className="space-y-2">
                  {spheres.map((s, i) => {
                    const isDragging = draggingId === s.id;
                    const isOver = overId === s.id && draggingId && draggingId !== s.id;

                    return (
                      <li
                        key={s.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, s.id)}
                        onDragOver={(e) => onDragOver(e, s.id)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, s.id)}
                        onDragEnd={onDragEnd}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-3 rounded-2xl overflow-hidden",
                          GLASS_BODY,
                          "transition-all duration-200",
                          "cursor-grab active:cursor-grabbing",
                          isDragging && "opacity-40 cursor-grabbing",
                          isOver && "ring-2 ring-blue-400/60 -translate-y-1"
                        )}
                      >
                        <span aria-hidden="true" className={GLASS_SHEEN} />

                        {/* Хват */}
                        <GripVertical
                          size={16}
                          className="relative shrink-0 text-gray-400 dark:text-gray-500"
                          aria-hidden="true"
                        />

                        {/* Номер — стеклянный */}
                        <span
                          className={cn(
                            "relative shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold tabular-nums",
                            "bg-white/[0.06] dark:bg-white/[0.02]",
                            "backdrop-blur-3xl",
                            "ring-1 ring-white/30 dark:ring-white/10",
                            "text-gray-600 dark:text-gray-300",
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                          )}
                          aria-label={`Приоритет ${i + 1}`}
                        >
                          {i + 1}
                        </span>

                        {/* Кружок цвета — плоский, без блика */}
                        <button
                          type="button"
                          onClick={() => cycleColor(s.id)}
                          className={cn(
                            "relative shrink-0 w-7 h-7 rounded-full",
                            "ring-1 ring-white/40 dark:ring-white/20",
                            "hover:scale-110 active:scale-95 transition-transform"
                          )}
                          style={{ backgroundColor: s.color }}
                          title="Сменить цвет"
                          aria-label={`Сменить цвет сферы ${s.name}`}
                        />

                        <span className="relative flex-1 min-w-0 text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {s.name}
                        </span>

                        {/* Стрелки — стеклянные, без смены цвета */}
                        <div className="relative shrink-0 flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setSpheres((prev) => moveByIndex(prev, s.id, -1))}
                            disabled={i === 0}
                            aria-label={`Поднять ${s.name} выше`}
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center",
                              "text-gray-400 dark:text-gray-500",
                              "hover:text-gray-700 dark:hover:text-gray-200",
                              "disabled:opacity-30 disabled:cursor-not-allowed",
                              "transition-colors"
                            )}
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSpheres((prev) => moveByIndex(prev, s.id, 1))}
                            disabled={i === spheres.length - 1}
                            aria-label={`Опустить ${s.name} ниже`}
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center",
                              "text-gray-400 dark:text-gray-500",
                              "hover:text-gray-700 dark:hover:text-gray-200",
                              "disabled:opacity-30 disabled:cursor-not-allowed",
                              "transition-colors"
                            )}
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>

                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {spheres.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Выберите хотя бы одну сферу, чтобы продолжить
          </p>
        )}
      </div>
    </OnboardingLayout>
  );
};