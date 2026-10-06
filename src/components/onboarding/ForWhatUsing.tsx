import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, Bell, ListChecks, Scale, Target, Clock,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;
const G = glass.subtle;

/* ─── Единый стиль стекла — один объект на весь файл ─── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-3xl " +
  "ring-1 ring-white/30 dark:ring-white/10";

const GLASS_SHADOW_LIGHT =
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]";

const GLASS_SHADOW_DARK =
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_SHEEN =
  "pointer-events-none absolute inset-0 rounded-2xl " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

type Option = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** hex — используется для inline box-shadow активной карточки и иконки */
  color: string;
  tint: string;
  tintSoft: string;
  tintRing: string;
};

const OPTIONS: Option[] = [
  {
    id: "productivity",
    label: "Повысить продуктивность",
    icon: Zap,
    color: "#f59e0b",
    tint:     "text-amber-600 dark:text-amber-300",
    tintSoft: "bg-amber-500/15 dark:bg-amber-400/15",
    tintRing: "ring-amber-400/40 dark:ring-amber-400/30",
  },
  {
    id: "remember",
    label: "Не забывать",
    icon: Bell,
    color: "#0ea5e9",
    tint:     "text-sky-600 dark:text-sky-300",
    tintSoft: "bg-sky-500/15 dark:bg-sky-400/15",
    tintRing: "ring-sky-400/40 dark:ring-sky-400/30",
  },
  {
    id: "order",
    label: "Навести порядок в делах",
    icon: ListChecks,
    color: "#10b981",
    tint:     "text-emerald-600 dark:text-emerald-300",
    tintSoft: "bg-emerald-500/15 dark:bg-emerald-400/15",
    tintRing: "ring-emerald-400/40 dark:ring-emerald-400/30",
  },
  {
    id: "balance",
    label: "Совмещать работу и личное",
    icon: Scale,
    color: "#f43f5e",
    tint:     "text-rose-600 dark:text-rose-300",
    tintSoft: "bg-rose-500/15 dark:bg-rose-400/15",
    tintRing: "ring-rose-400/40 dark:ring-rose-400/30",
  },
  {
    id: "goals",
    label: "Двигаться к своим целям",
    icon: Target,
    color: "#8b5cf6",
    tint:     "text-violet-600 dark:text-violet-300",
    tintSoft: "bg-violet-500/15 dark:bg-violet-400/15",
    tintRing: "ring-violet-400/40 dark:ring-violet-400/30",
  },
  {
    id: "time",
    label: "Понять, куда уходит время",
    icon: Clock,
    color: "#06b6d4",
    tint:     "text-cyan-600 dark:text-cyan-300",
    tintSoft: "bg-cyan-500/15 dark:bg-cyan-400/15",
    tintRing: "ring-cyan-400/40 dark:ring-cyan-400/30",
  },
];

const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

export const ForWhatUsing: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();
  const [selected, setSelected] = React.useState<string[]>(data.purpose);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selected.length === 0) return;
    update("purpose", selected);
    navigate("/onboarding/field-of-activity");
  };

  return (
    <OnboardingLayout
      step={1}
      totalSteps={TOTAL}
      title="Зачем Вам приложение?"
      onBack={() => navigate("/")}
      onNext={handleNext}
      nextDisabled={selected.length === 0}
    >
      <div className="relative">
        {/* ─── Eyebrow ─────────────────────────── */}
        <div className="mb-5 flex items-center gap-3">
          <span
            className={cn(
              "relative inline-flex items-center gap-1.5 overflow-hidden",
              "px-2.5 py-1 rounded-full",
              GLASS_BODY,
              GLASS_SHADOW_LIGHT,
              GLASS_SHADOW_DARK,
              "text-[11px] uppercase tracking-widest font-medium",
              "text-gray-600 dark:text-gray-300"
            )}
          >
            <span aria-hidden="true" className={cn(GLASS_SHEEN, "rounded-full")} />
            <Sparkles size={11} aria-hidden="true" className="relative" />
            <span className="relative">Ваша цель</span>
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {selected.length > 0
              ? `Выбрано: ${selected.length}`
              : "Ничего не выбрано"}
          </span>
        </div>

        {/* ─── Сетка опций ─────────────────────── */}
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
                  "group relative overflow-hidden text-left",
                  "rounded-2xl p-4",
                  GLASS_BODY,
                  GLASS_SHADOW_LIGHT,
                  GLASS_SHADOW_DARK,
                  "transition-all duration-300",
                  "hover:-translate-y-0.5",
                  active && "ring-[1.5px]"
                )}
                // ─── Active: цветной ring + цветной ореол в тон опции ───
                style={
                  active
                    ? {
                        boxShadow: `0 0 0 1.5px ${opt.color}cc, 0 4px 24px ${opt.color}33, inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)`,
                      }
                    : undefined
                }
              >
                <span aria-hidden="true" className={GLASS_SHEEN} />

                <div className="relative flex items-center gap-3">
                  {/* ─── Иконка: в покое — тонированная стеклянная, в active — залита цветом ─── */}
                  <div
                    className={cn(
                      "relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden",
                      "ring-1 transition-all duration-300",
                      "bg-white/[0.06] dark:bg-white/[0.02]",
                      "backdrop-blur-3xl",
                      !active && [
                        opt.tint,
                        opt.tintSoft,
                        opt.tintRing,
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
                      ],
                      active && "text-white ring-white/40"
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: `${opt.color}cc`,
                            boxShadow: `0 4px 14px ${opt.color}40, inset 0 1px 0 rgba(255,255,255,0.5)`,
                          }
                        : undefined
                    }
                    aria-hidden="true"
                  >
                    <Icon size={20} className="relative" />
                  </div>

                  {/* Название */}
                  <span className="min-w-0 text-sm font-semibold text-gray-900 dark:text-white">
                    {opt.label}
                  </span>

                  {/* ← Кружок с галочкой здесь УДАЛЁН */}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
};