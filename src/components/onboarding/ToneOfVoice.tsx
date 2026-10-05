// src/components/onboarding/ToneOfVoice.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, Minus, Flame, ShieldAlert,
  Sparkles, Check,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding, OnboardingData } from "./OnboardingContext";
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

type Tone = NonNullable<OnboardingData["toneOfVoice"]>;

type ToneOption = {
  id: Tone;
  label: string;
  hint: string;
  icon: LucideIcon;
  tint: string;
  tintRing: string;
  tintActiveColor: string;   // hex — цвет активной заливки иконки/индикатора
  tintActiveGlow: string;    // rgba(...) для ring и тени
};

const OPTIONS: ToneOption[] = [
  {
    id: "supportive",
    label: "Мягкий, поддерживающий",
    hint: "Бережно, с заботой о состоянии",
    icon: Heart,
    tint: "text-pink-600 dark:text-pink-300",
    tintRing: "ring-pink-400/40 dark:ring-pink-400/30",
    tintActiveColor: "#ec4899",
    tintActiveGlow: "rgba(236,72,153,0.35)",
  },
  {
    id: "neutral",
    label: "Нейтральный",
    hint: "По делу, без лишних эмоций",
    icon: Minus,
    tint: "text-slate-600 dark:text-slate-300",
    tintRing: "ring-slate-400/40 dark:ring-slate-400/30",
    tintActiveColor: "#475569",
    tintActiveGlow: "rgba(71,85,105,0.35)",
  },
  {
    id: "motivating",
    label: "Мотивирующий",
    hint: "Бодро, с драйвом и целями",
    icon: Flame,
    tint: "text-amber-600 dark:text-amber-300",
    tintRing: "ring-amber-400/40 dark:ring-amber-400/30",
    tintActiveColor: "#f59e0b",
    tintActiveGlow: "rgba(245,158,11,0.35)",
  },
  {
    id: "strict",
    label: "Строгий",
    hint: "Чётко, дисциплинированно, без поблажек",
    icon: ShieldAlert,
    tint: "text-rose-600 dark:text-rose-300",
    tintRing: "ring-rose-400/40 dark:ring-rose-400/30",
    tintActiveColor: "#e11d48",
    tintActiveGlow: "rgba(225,29,72,0.35)",
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
      onBack={() => navigate("/onboarding/field-of-activity")}
      onNext={handleNext}
      nextDisabled={!selected}
    >
      <div className="relative">
        {/* ─── Eyebrow ─────────────────────────── */}
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
            <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
            <Sparkles size={11} aria-hidden="true" className="relative" />
            <span className="relative">Тон общения</span>
          </span>
        </div>

        {/* ─── Список опций ─────────────────────── */}
        <div className="space-y-3" role="radiogroup" aria-label="Тон общения">
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
                className={cn(
                  "group relative overflow-hidden block w-full text-left",
                  "rounded-2xl p-4 md:p-5",
                  GLASS_BODY,
                  "transition-transform duration-300",
                  "hover:-translate-y-0.5"
                )}
                style={
                  active
                    ? {
                        boxShadow: `0 0 0 1.5px ${opt.tintActiveColor}cc, 0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)`,
                      }
                    : undefined
                }
              >
                <span aria-hidden="true" className={GLASS_SHEEN} />

                <div className="relative flex items-start gap-3">
                  {/* ─── Иконка ─── */}
                  <div
                    className={cn(
                      "relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden",
                      "ring-1 transition-all duration-300",
                      "bg-white/[0.06] dark:bg-white/[0.02]",
                      "backdrop-blur-3xl",
                      !active && [
                        opt.tint,
                        opt.tintRing,
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
                        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
                      ],
                      active && "text-white ring-white/40"
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
                    <Icon size={20} className="relative" />
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

                  {/* ─── Индикатор ─── */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative shrink-0 w-5 h-5 rounded-full flex items-center justify-center overflow-hidden",
                      "ring-1 transition-all duration-300",
                      active
                        ? "text-white ring-white/40"
                        : "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-3xl ring-white/30 dark:ring-white/10"
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: `${opt.tintActiveColor}cc`,
                            boxShadow: `0 2px 8px ${opt.tintActiveGlow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
                          }
                        : undefined
                    }
                  >
                    {active && <Check size={12} strokeWidth={3} className="relative" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-5 flex items-center justify-center gap-2 animate-in fade-in duration-300">
            <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Стиль общения можно поменять в настройках в любой момент
            </p>
          </div>
        )}
      </div>
    </OnboardingLayout>
  );
};