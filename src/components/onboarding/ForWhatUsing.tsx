import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, Bell, ListChecks, Scale, Target, Clock,
  Sparkles, ArrowRight, Check,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding } from "./OnboardingContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { glass } from "@/styles/glass";

const TOTAL = 10;

const G = glass.subtle;

type Option = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  tint: string;
  tintSoft: string;
  tintRing: string;
  tintActiveBg: string;
  tintActiveRing: string;
  tintActiveShadow: string;
  tintGlow: string;
};

const OPTIONS: Option[] = [
  {
    id: "productivity",
    label: "Повысить продуктивность",
    hint: "Успевать больше без выгорания",
    icon: Zap,
    tint:     "text-amber-600 dark:text-amber-300",
    tintSoft: "bg-amber-500/15 dark:bg-amber-400/15",
    tintRing: "ring-amber-400/40 dark:ring-amber-400/30",
    tintActiveBg:     "bg-amber-500/15 dark:bg-amber-400/15",
    tintActiveRing:   "ring-amber-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-amber-400/60 to-orange-500/40",
  },
  {
    id: "remember",
    label: "Не забывать",
    hint: "Держать всё под рукой",
    icon: Bell,
    tint:     "text-sky-600 dark:text-sky-300",
    tintSoft: "bg-sky-500/15 dark:bg-sky-400/15",
    tintRing: "ring-sky-400/40 dark:ring-sky-400/30",
    tintActiveBg:     "bg-sky-500/15 dark:bg-sky-400/15",
    tintActiveRing:   "ring-sky-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(14,165,233,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-sky-400/60 to-blue-500/40",
  },
  {
    id: "order",
    label: "Навести порядок в делах",
    hint: "Собрать всё в одном месте",
    icon: ListChecks,
    tint:     "text-emerald-600 dark:text-emerald-300",
    tintSoft: "bg-emerald-500/15 dark:bg-emerald-400/15",
    tintRing: "ring-emerald-400/40 dark:ring-emerald-400/30",
    tintActiveBg:     "bg-emerald-500/15 dark:bg-emerald-400/15",
    tintActiveRing:   "ring-emerald-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-emerald-400/60 to-teal-500/40",
  },
  {
    id: "balance",
    label: "Совмещать работу и личное",
    hint: "Баланс без перекосов",
    icon: Scale,
    tint:     "text-rose-600 dark:text-rose-300",
    tintSoft: "bg-rose-500/15 dark:bg-rose-400/15",
    tintRing: "ring-rose-400/40 dark:ring-rose-400/30",
    tintActiveBg:     "bg-rose-500/15 dark:bg-rose-400/15",
    tintActiveRing:   "ring-rose-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(244,63,94,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-rose-400/60 to-pink-500/40",
  },
  {
    id: "goals",
    label: "Двигаться к своим целям",
    hint: "Маленькими шагами каждый день",
    icon: Target,
    tint:     "text-violet-600 dark:text-violet-300",
    tintSoft: "bg-violet-500/15 dark:bg-violet-400/15",
    tintRing: "ring-violet-400/40 dark:ring-violet-400/30",
    tintActiveBg:     "bg-violet-500/15 dark:bg-violet-400/15",
    tintActiveRing:   "ring-violet-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(139,92,246,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-violet-400/60 to-purple-500/40",
  },
  {
    id: "time",
    label: "Понять, куда уходит время",
    hint: "Увидеть настоящую картину дня",
    icon: Clock,
    tint:     "text-cyan-600 dark:text-cyan-300",
    tintSoft: "bg-cyan-500/15 dark:bg-cyan-400/15",
    tintRing: "ring-cyan-400/40 dark:ring-cyan-400/30",
    tintActiveBg:     "bg-cyan-500/15 dark:bg-cyan-400/15",
    tintActiveRing:   "ring-cyan-400/70",
    tintActiveShadow: "shadow-[0_4px_14px_rgba(6,182,212,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]",
    tintGlow:         "from-cyan-400/60 to-sky-500/40",
  },
];

const SpecularHighlight: React.FC<{ className?: string }> = ({ className }) => (
  <span aria-hidden="true" className={cn(G.specular, className)} />
);

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
      title="Зачем Вам приложение?"
      subtitle="Выберите всё, что откликается — можно несколько вариантов."
      onBack={() => navigate("/")}
      onNext={handleNext}
      nextDisabled={selected.length === 0}
    >
      <div className="relative">
        <div className="mb-5 flex items-center gap-3">
          <span
            className={cn(
              "relative inline-flex items-center gap-1.5",
              "px-2.5 py-1 rounded-full",
              G.surface,
              "text-[11px] uppercase tracking-widest font-medium",
              "text-gray-600 dark:text-gray-300"
            )}
          >
            <Sparkles size={11} aria-hidden="true" />
            Ваша цель
          </span>

          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {selected.length > 0
              ? `Выбрано: ${selected.length}`
              : "Ничего не выбрано"}
          </span>
        </div>

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
                  "relative overflow-hidden text-left",
                  "rounded-2xl p-4",
                  // ─── Тело: почти прозрачное ───
                  "bg-white/[0.06] dark:bg-white/[0.02]",
                  "backdrop-blur-3xl",
                  // ─── Одна тонкая грань ───
                  "ring-1 ring-white/30 dark:ring-white/10",
                  // ─── Вся «стеклянность»: три линии по кромкам ───
                  "shadow-[",
                    "0_4px_24px_rgba(15,23,42,0.06),",      // очень мягкая внешняя тень
                    "inset_0_1px_0_rgba(255,255,255,0.7),", // яркая верхняя кромка
                    "inset_0_-1px_0_rgba(15,23,42,0.06)",    // тёмная нижняя — контраст
                  "]",
                  "dark:shadow-[",
                    "0_4px_24px_rgba(0,0,0,0.4),",
                    "inset_0_1px_0_rgba(255,255,255,0.15),",
                    "inset_0_-1px_0_rgba(0,0,0,0.3)",
                  "]",
                  "transition-all duration-300",
                  active && opt.tintActiveRing,
                  "hover:-translate-y-0.5"
                )}
              >
                {/* ─── Блик 1: диагональный sheen — свет сверху-слева, холодный оттенок снизу-справа ─── */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 25%, transparent 45%, transparent 75%, rgba(147,197,253,0.05) 100%)",
                  }}
                />

                <div className="relative flex items-start gap-3">
                  <div
                    className={cn(
                      "shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ring-1",
                      active
                        ? [opt.tintActiveBg, opt.tintActiveRing, "text-white"]
                        : [opt.tint, opt.tintSoft, opt.tintRing]
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white leading-snug">
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {opt.hint}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className={cn(
                      "shrink-0 w-5 h-5 rounded-full flex items-center justify-center ring-[0.5px] transition-all",
                      active
                        ? [opt.tintActiveBg, opt.tintActiveRing, "text-white"]
                        : "ring-white/60 dark:ring-white/15 bg-white/30 dark:bg-white/[0.05]"
                    )}
                  >
                    {active && <Check size={12} strokeWidth={3} />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && !confirmed && (
          <div className="mt-6 flex items-center justify-end gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              {selected.length} из {OPTIONS.length}
            </span>

            <button
              type="button"
              onClick={handleConfirm}
              className={cn(
                "relative overflow-hidden inline-flex items-center gap-1.5",
                "px-5 py-2.5 rounded-full",
                "text-sm font-semibold",
                "text-blue-700 dark:text-blue-300",
                // ─── Тело стекла ───
                "bg-white/25 dark:bg-white/[0.03]",
                "backdrop-blur-2xl",
                "ring-[0.5px] ring-white/60 dark:ring-white/15",
                // ─── Рёбра ───
                "shadow-[",
                  "0_8px_32px_rgba(15,23,42,0.08),",
                  "inset_0_1px_0_rgba(255,255,255,0.9),",
                  "inset_0_-1px_0_rgba(255,255,255,0.18),",
                  "inset_1px_0_0_rgba(255,255,255,0.35),",
                  "inset_-1px_0_0_rgba(255,255,255,0.12)",
                "]",
                "dark:shadow-[",
                  "0_8px_32px_rgba(0,0,0,0.4),",
                  "inset_0_1px_0_rgba(255,255,255,0.1),",
                  "inset_0_-1px_0_rgba(255,255,255,0.03),",
                  "inset_1px_0_0_rgba(255,255,255,0.06),",
                  "inset_-1px_0_0_rgba(255,255,255,0.02)",
                "]",
                "transition-all duration-300",
                "hover:-translate-y-0.5"
              )}
            >
              
              {/* ─── Блик 1: диагональный sheen — свет сверху-слева, холодный оттенок снизу-справа ─── */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 25%, transparent 45%, transparent 75%, rgba(147,197,253,0.05) 100%)",
                }}
              />

              <span className="relative inline-flex items-center gap-1.5">
                Подтвердить
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </button>
          </div>
        )}

        {confirmed && (
          <div
            className={cn(
              "mt-6 relative overflow-hidden rounded-2xl",
              "animate-in fade-in slide-in-from-bottom-2 duration-500",
              G.surface
            )}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-3 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent blur-[1px]"
            />

            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-3 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent blur-[1px]"
            />

          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};
