// src/layouts/AuthLayout.tsx
import React from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { ThemeToggle } from "@/theme";
import { MascotFade } from "@/components/MascotFade";
import { cn } from "@/utils/cn";

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-3xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_SHEEN_ROUND_3XL =
  "pointer-events-none absolute inset-0 rounded-3xl " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const GLASS_SHEEN_PILL =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const AuthLayout: React.FC = () => {
  return (
    <div
      className={cn(
        "relative min-h-screen grid lg:grid-cols-2 overflow-hidden",
        "bg-gradient-to-br from-sky-50 via-blue-50 to-slate-100",
        "dark:from-gray-950 dark:via-gray-950 dark:to-slate-950"
      )}
    >
      {/* ─── Фоновые пятна ──────────────────────────── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[28rem] h-[28rem] rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[34rem] h-[34rem] rounded-full bg-slate-400/15 blur-3xl" />
      </div>

      {/* ─── Верхняя навигация ──────────────────────── */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className={cn(
            "relative inline-flex items-center gap-1.5 overflow-hidden",
            "px-3 py-1.5 rounded-full",
            "text-sm font-medium text-gray-700 dark:text-gray-300",
            GLASS_BODY,
            "transition-transform duration-200",
            "hover:-translate-y-0.5",
            "max-w-[60%]"
          )}
        >
          <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
          <ArrowLeft size={16} className="relative shrink-0" aria-hidden="true" />
          <span className="relative truncate">На главную</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* ─── Левая колонка — брендинг и маскот ──────── */}
      <div className="relative hidden lg:flex flex-col justify-center items-center p-12">
        <div className="relative max-w-md w-full text-center">
          {/* ─── Маскот вместо квадратной иконки ─── */}
          <div className="relative mx-auto w-full max-w-[420px]">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-sky-400/30 via-blue-400/20 to-slate-400/15 blur-3xl"
            />
            <MascotFade
              src="/images/MaskotGirl.pdf"
              alt="Ассистент Dayla говорит по телефону"
              fadeStart={48}
              fadeLength={38}
              blend
              glow
            />
          </div>

          <h1 className="mt-2 text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dayla
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            Личный ИИ-ассистент, который планирует ваш день за минуту.
          </p>

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
        </div>
      </div>

      {/* ─── Правая колонка — форма ─────────────────── */}
      <div className="relative flex items-center justify-center px-4 py-20 sm:px-6 lg:p-12">
        <div
          className={cn(
            "relative w-full max-w-md overflow-hidden rounded-3xl",
            GLASS_BODY,
            "p-5 sm:p-6 md:p-8"
          )}
        >
          <span aria-hidden="true" className={GLASS_SHEEN_ROUND_3XL} />

          <div className="relative">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;