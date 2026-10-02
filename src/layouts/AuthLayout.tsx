// src/layouts/AuthLayout.tsx
import React from "react";
import { Check, Sparkles } from "lucide-react";
import { Outlet } from "react-router-dom";

// ---------- Маскот со смартфоном (перенос из Start.tsx) ----------

const MascotWithPhone: React.FC = () => (
  <svg
    viewBox="0 0 260 340"
    className="w-full h-auto"
    role="img"
    aria-label="Человек говорит по телефону с голосовым ассистентом"
  >
    <defs>
      <linearGradient id="auth-mq-head" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
      <linearGradient id="auth-mq-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="auth-mq-phone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
    </defs>

    {/* Тень на «полу» */}
    <ellipse cx="130" cy="320" rx="86" ry="10" fill="#0f172a" opacity="0.08" />

    {/* Торс */}
    <path
      d="M 88 190
         C 88 175, 105 165, 130 165
         C 155 165, 172 175, 172 190
         L 186 315
         L 74 315
         Z"
      fill="url(#auth-mq-body)"
    />

    {/* Левая рука */}
    <path
      d="M 90 205 Q 62 250 78 300"
      stroke="url(#auth-mq-body)"
      strokeWidth="24"
      strokeLinecap="round"
      fill="none"
    />

    {/* Голова */}
    <circle cx="130" cy="115" r="55" fill="url(#auth-mq-head)" />

    {/* Волосы */}
    <path
      d="M 75 110
         C 75 65, 100 50, 130 50
         C 160 50, 185 65, 185 110
         C 178 88, 158 80, 130 80
         C 102 80, 82 88, 75 110 Z"
      fill="#0f172a"
    />

    {/* Глаза */}
    <path d="M 105 118 Q 112 110 119 118" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M 141 118 Q 148 110 155 118" stroke="#0f172a" strokeWidth="3" fill="none" strokeLinecap="round" />

    {/* Улыбка */}
    <path
      d="M 115 138 Q 130 150 145 138"
      stroke="#0f172a"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />

    {/* Правая рука */}
    <path
      d="M 170 205 Q 205 190 195 150"
      stroke="url(#auth-mq-body)"
      strokeWidth="24"
      strokeLinecap="round"
      fill="none"
    />

    {/* Смартфон */}
    <rect x="186" y="96" width="26" height="48" rx="6" fill="#0f172a" />
    <rect x="190" y="101" width="18" height="38" rx="3" fill="url(#auth-mq-phone)" />

    {/* Волны звука */}
    <path
      d="M 220 108 Q 228 120 220 132"
      stroke="#60a5fa"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M 228 98 Q 240 120 228 142"
      stroke="#60a5fa"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
    <path
      d="M 236 88 Q 252 120 236 152"
      stroke="#60a5fa"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.4"
    />

    {/* Искорки */}
    <circle cx="60" cy="80" r="3" fill="#93c5fd" opacity="0.7" />
    <circle cx="52" cy="150" r="2" fill="#c4b5fd" opacity="0.6" />
    <circle cx="70" cy="40" r="2" fill="#a5f3fc" opacity="0.6" />
  </svg>
);

// ---------- Layout ----------

const AuthLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
      {/* Общие градиентные пятна на всю ширину страницы.
          Ключевое: они вне сетки колонок и лежат под всем layout,
          поэтому не обрываются по середине. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-blue-400/25 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[28rem] h-[28rem] rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[34rem] h-[34rem] rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      {/* ─── Левая колонка — брендинг ─────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-center items-center p-12">
        <div className="relative max-w-md w-full text-center">
          {/* Логотип */}
          <div
            className="
              w-20 h-20 rounded-2xl mx-auto shadow-lg
              bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600
              flex items-center justify-center text-white
              ring-4 ring-white/60 dark:ring-gray-900/60
            "
          >
            <Sparkles size={34} aria-hidden="true" />
          </div>

          <h1 className="mt-6 text-4xl font-bold text-gray-900 dark:text-white">
            Deyla
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
                className="shrink-0 w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm"
              >
                <Check size={10} strokeWidth={3.5} />
              </span>
              Бесплатно
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span
                aria-hidden="true"
                className="shrink-0 w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
              >
                <Check size={10} strokeWidth={3.5} />
              </span>
              Для жизни и работы
            </div>
          </div>

          {/* ─── Маскот ──────────────────────────────────── */}
          <div className="relative mt-10 mx-auto w-full max-w-[260px]">
            {/* Свечение под маскотом */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-blue-400/40 via-indigo-400/30 to-purple-400/40 blur-3xl"
            />
            <MascotWithPhone />
          </div>
        </div>
      </div>

      {/* ─── Правая колонка — форма ───────────────────────── */}
      <div className="relative flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-apple dark:shadow-apple-dark p-8 border border-white/60 dark:border-gray-700/60">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;