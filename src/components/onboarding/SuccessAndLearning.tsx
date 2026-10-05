// src/components/onboarding/SuccessAndLearning.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  PartyPopper, Sun, MessageCircle, Settings2,
  Sparkles, Check, Target, Link2,
  ArrowRight, Rocket,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useAuthStore } from "@/store/authStore";
import { applyOnboarding, useOnboarding } from "./OnboardingContext";
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

type Highlight = {
  icon: LucideIcon;
  tint: string;
  tintRing: string;
};

const HIGHLIGHTS: Highlight[] = [
  {
    icon: Sun,
    tint: "text-amber-600 dark:text-amber-300",
    tintRing: "ring-amber-400/40 dark:ring-amber-400/30",
  },
  {
    icon: MessageCircle,
    tint: "text-sky-600 dark:text-sky-300",
    tintRing: "ring-sky-400/40 dark:ring-sky-400/30",
  },
  {
    icon: Settings2,
    tint: "text-emerald-600 dark:text-emerald-300",
    tintRing: "ring-emerald-400/40 dark:ring-emerald-400/30",
  },
];

export const SuccessAndLearning: React.FC = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const finish = async () => {
    if (isAuthenticated) {
      await applyOnboarding();
      navigate("/app", { replace: true });
    } else {
      navigate("/register", { replace: true });
    }
  };

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
      onBack={() => navigate("/onboarding/fast-tasks-enter")}
    >
      <div className="relative space-y-4 sm:space-y-5">
        {/* ─── Праздничный блок ─────────────────────── */}
        <div className={cn("relative overflow-hidden rounded-2xl", GLASS_BODY)}>
          <span aria-hidden="true" className={GLASS_SHEEN} />

          <div className="relative p-5 sm:p-8 text-center">
            <div className="relative flex justify-center mb-4 sm:mb-5">
              <div
                aria-hidden="true"
                className={cn(
                  "relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center overflow-hidden",
                  "bg-white/[0.06] dark:bg-white/[0.02]",
                  "backdrop-blur-3xl",
                  "ring-1 ring-white/30 dark:ring-white/10",
                  "text-sky-600 dark:text-sky-300",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                )}
              >
                <PartyPopper size={26} className="relative" />
              </div>
            </div>

            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white">
              Онбординг пройден
            </p>
          </div>
        </div>

        {/* ─── Что вас ждёт ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <div
                key={h.tint}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-3.5 sm:p-4",
                  GLASS_BODY
                )}
              >
                <span aria-hidden="true" className={GLASS_SHEEN} />

                <div className="relative flex items-center gap-3">
                  <div
                    className={cn(
                      "relative shrink-0 w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden",
                      "bg-white/[0.06] dark:bg-white/[0.02]",
                      "backdrop-blur-3xl",
                      "ring-1",
                      h.tintRing,
                      h.tint,
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={16} className="relative" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Сводка ───────────────────────────────── */}
        {summary.length > 0 && (
          <div className={cn("relative overflow-hidden rounded-2xl", GLASS_BODY)}>
            <span aria-hidden="true" className={GLASS_SHEEN} />

            <div className="relative p-3.5 sm:p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  aria-hidden="true"
                  className={cn(
                    "relative shrink-0 w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden",
                    "bg-white/[0.06] dark:bg-white/[0.02]",
                    "backdrop-blur-3xl",
                    "ring-1 ring-emerald-400/40 dark:ring-emerald-400/30",
                    "text-emerald-700 dark:text-emerald-300",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  )}
                >
                  <Check size={14} strokeWidth={3} className="relative" />
                </span>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  Ваш профиль настроен
                </p>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {summary.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li
                      key={s.label}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-2xl overflow-hidden",
                        GLASS_BODY
                      )}
                    >
                      <span aria-hidden="true" className={GLASS_SHEEN} />

                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden",
                          "bg-white/[0.06] dark:bg-white/[0.02]",
                          "backdrop-blur-3xl",
                          "ring-1 ring-white/30 dark:ring-white/10",
                          "text-gray-600 dark:text-gray-300",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                        )}
                      >
                        <Icon size={14} className="relative" />
                      </span>
                      <div className="relative min-w-0 flex-1">
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

              {data.spheres.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10">
                  <p className="text-[11px] uppercase tracking-widest font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Ваши сферы
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.spheres.map((s) => (
                      <span
                        key={s.id}
                        className={cn(
                          "relative inline-flex items-center gap-1.5 overflow-hidden",
                          "px-2.5 py-1 rounded-full",
                          "bg-white/[0.06] dark:bg-white/[0.02]",
                          "backdrop-blur-3xl",
                          "ring-1 ring-white/30 dark:ring-white/10",
                          "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
                          "text-xs font-medium text-gray-700 dark:text-gray-300",
                          "max-w-full"
                        )}
                      >
                        <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
                        <span
                          className="relative w-2 h-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: s.color,
                            boxShadow: `0 1px 2px ${s.color}66`,
                          }}
                          aria-hidden="true"
                        />
                        <span className="relative truncate">{s.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── CTA ───────────────────────────────────── */}
        <div className="pt-1 sm:pt-2">
          <button
            type="button"
            onClick={finish}
            className={cn(
              "group relative overflow-hidden w-full",
              "inline-flex items-center justify-center gap-2",
              "px-5 sm:px-6 py-3.5 sm:py-4 rounded-full",
              "text-base font-semibold",
              "text-sky-700 dark:text-sky-300",
              GLASS_BODY,
              "transition-transform duration-300",
              "hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            <span aria-hidden="true" className={GLASS_SHEEN_PILL} />

            <Rocket
              size={18}
              className="relative transition-transform duration-300 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
            <span className="relative">Начать</span>
            <ArrowRight
              size={18}
              className="relative transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>

          <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
            Настройки можно изменить в любой момент
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
};

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}