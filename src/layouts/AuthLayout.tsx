// src/layouts/AuthLayout.tsx
import React from "react";
import { Check, Sparkles } from "lucide-react";
import { Outlet } from "react-router-dom";
import { cn } from "@/utils/cn";

// ---------- Маскот из лендинга ----------

const MascotWithPhone: React.FC = () => (
  <div
    className="relative w-full max-w-[380px] mx-auto"
    style={{
      // мягкое затухание низа, как в HeroScene на лендинге
      WebkitMaskImage:
        "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.35) 78%, transparent 95%)",
      maskImage:
        "linear-gradient(to bottom, black 0%, black 55%, rgba(0,0,0,0.35) 78%, transparent 95%)",
    }}
  >
    <img
      src="/images/MaskotWB.png"
      alt="Ассистент Dayla говорит по телефону"
      className="w-full h-auto select-none pointer-events-none"
      draggable={false}
      loading="lazy"
    />
  </div>
);

// ---------- Layout ----------

const AuthLayout: React.FC = () => {
  return (
    <div
      className={cn(
        "relative min-h-screen grid lg:grid-cols-2 overflow-hidden",
        // ─── Фон: нейтральные синие оттенки, без фиолетового ───
        "bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100",
        "dark:from-gray-950 dark:via-gray-950 dark:to-slate-950"
      )}
    >
      {/* Общие градиентные пятна — синие/голубые */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[28rem] h-[28rem] rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[34rem] h-[34rem] rounded-full bg-slate-400/15 blur-3xl" />
      </div>

      {/* ═══════════ ЛЕВАЯ КОЛОНКА — брендинг и маскот ═══════════ */}
      <div className="relative hidden lg:flex flex-col justify-center items-center p-12">
        <div className="relative max-w-md w-full text-center">
          {/* Логотип — синий градиент */}
          <div
            className={cn(
              "relative w-20 h-20 rounded-2xl mx-auto overflow-hidden",
              "bg-gradient-to-br from-sky-500 to-blue-600",
              "flex items-center justify-center text-white",
              "ring-1 ring-white/50",
              "shadow-[0_8px_32px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]"
            )}
          >
            {/* Спекулярный блик */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-2 top-1 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[1px]"
            />
            <Sparkles size={34} className="relative" aria-hidden="true" />
          </div>

          <h1 className="mt-6 text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dayla
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            Личный ИИ-ассистент, который планирует ваш день за минуту —
            от первого «надо не забыть».
          </p>

          {/* Преимущества */}
          <div className="mt-6 flex justify-center gap-x-5 gap-y-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span
                aria-hidden="true"
                className={cn(
                  "relative shrink-0 w-4 h-4 rounded-full overflow-hidden",
                  "bg-gradient-to-br from-sky-400 to-blue-500",
                  "flex items-center justify-center text-white",
                  "shadow-[0_1px_3px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]"
                )}
              >
                <Check size={10} strokeWidth={3.5} className="relative" />
              </span>
              Бесплатно
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span
                aria-hidden="true"
                className={cn(
                  "relative shrink-0 w-4 h-4 rounded-full overflow-hidden",
                  "bg-gradient-to-br from-blue-400 to-sky-600",
                  "flex items-center justify-center text-white",
                  "shadow-[0_1px_3px_rgba(59,130,246,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]"
                )}
              >
                <Check size={10} strokeWidth={3.5} className="relative" />
              </span>
              Для жизни и работы
            </div>
          </div>

          {/* ─── Маскот ──────────────────────────── */}
          <div className="relative mt-10 mx-auto w-full max-w-[420px]">
            {/* Мягкое свечение под маскотом — нейтральное, синее */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-sky-400/30 via-blue-400/20 to-slate-400/15 blur-3xl"
            />
            <MascotWithPhone />
          </div>
        </div>
      </div>

      {/* ═══════════ ПРАВАЯ КОЛОНКА — форма ═══════════ */}
      <div className="relative flex items-center justify-center p-6 lg:p-12">
        <div
          className={cn(
            "relative w-full max-w-md overflow-hidden rounded-3xl",
            // ─── Прозрачное стекло: без белой заливки ───
            "bg-white/10 dark:bg-white/[0.03]",
            "backdrop-blur-2xl",
            // ─── Тонкая грань ───
            "ring-1 ring-white/40 dark:ring-white/10",
            // ─── Верхний блик + нижний отблеск + мягкая тень ───
            "shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(255,255,255,0.15)]",
            "dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(255,255,255,0.02)]",
            "p-6 md:p-8"
          )}
        >
          {/* Спекулярный блик — верхняя треть карточки */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-1 h-1/3 rounded-full bg-gradient-to-b from-white/40 to-transparent opacity-70 blur-[1px]"
          />

          <div className="relative">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;