// src/components/onboarding/Start.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Send, Calendar, BarChart3,
  Mic, Zap, Target, ArrowRight, Check,
} from "lucide-react";

import { Button, InteractiveButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

// ---------- Время, уделённое задачам по приоритетам ----------

type PriorityTime = {
  priority: Priority;
  minutes: number;
};

const PRIORITY_TIME: PriorityTime[] = [
  { priority: "A", minutes: 4 * 60 + 30 },   // 4 ч 30 мин
  { priority: "B", minutes: 3 * 60 + 15 },   // 3 ч 15 мин
];

const formatMinutes = (m: number): string => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${min} мин`;
  if (min === 0) return `${h} ч`;
  return `${h} ч ${min} мин`;
};

// ---------- Круговой прогресс ----------

interface ProgressRingProps {
  value: number;   // 0–100
  size?: number;
  stroke?: number;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 56,
  stroke = 6,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Выполнено ${value}%`}
      role="img"
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-200 dark:stroke-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-blue-500 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">
        {value}%
      </span>
    </div>
  );
};

// ---------- Плитка метрики ----------

interface MetricTileProps {
  label: string;
  value: string | number;
  hint?: string;
  tone: "success" | "warning" | "danger" | "neutral";
}

const METRIC_TONE: Record<MetricTileProps["tone"], string> = {
  success: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger:  "text-red-600 dark:text-red-400",
  neutral: "text-gray-800 dark:text-gray-200",
};

const MetricTile: React.FC<MetricTileProps> = ({ label, value, hint, tone }) => (
  <Card className="p-4">
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p
      className={cn(
        "text-2xl font-semibold mt-1 tabular-nums",
        METRIC_TONE[tone],
      )}
    >
      {value}
    </p>
    {hint && (
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
        {hint}
      </p>
    )}
  </Card>
);

type Priority = "A" | "B" | "C" | "D" | "E" | "F";

const PRIORITY_STYLES: Record<
  Priority,
  { bg: string; solid: string; text: string; ring: string }
> = {
  A: { bg: "bg-red-100 dark:bg-red-900/40",       solid: "bg-red-500",     text: "text-red-700 dark:text-red-300",       ring: "ring-red-300/60 dark:ring-red-700/60" },
  B: { bg: "bg-orange-100 dark:bg-orange-900/40", solid: "bg-orange-500",  text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-300/60 dark:ring-orange-700/60" },
  C: { bg: "bg-amber-100 dark:bg-amber-900/40",   solid: "bg-amber-500",   text: "text-amber-700 dark:text-amber-300",   ring: "ring-amber-300/60 dark:ring-amber-700/60" },
  D: { bg: "bg-blue-100 dark:bg-blue-900/40",     solid: "bg-blue-500",    text: "text-blue-700 dark:text-blue-300",     ring: "ring-blue-300/60 dark:ring-blue-700/60" },
  E: { bg: "bg-slate-100 dark:bg-slate-800/60",   solid: "bg-slate-400",   text: "text-slate-600 dark:text-slate-300",   ring: "ring-slate-300/60 dark:ring-slate-700/60" },
  F: { bg: "bg-slate-50 dark:bg-slate-800/40",    solid: "bg-slate-300",   text: "text-slate-500 dark:text-slate-400",   ring: "ring-slate-200/60 dark:ring-slate-700/40" },
};

// ---------- Корень ----------

export const Start: React.FC = () => {
  const navigate = useNavigate();
  const start = () => navigate("/onboarding/for-what-using");

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-hidden">
      <BackgroundPulses />

      <Hero onStart={start} />
      <Benefits />
      <HowItWorks />
      <FinalCTA onStart={start} />

      <LandingFooter />
    </div>
  );
};


// ---------- Данные для секции аналитики ----------

type SphereStat = {
  name: string;
  color: string;
  tasks: number;
  done: number;
};

const SPHERE_STATS: SphereStat[] = [
  { name: "Работа",   color: "#1a73e8", tasks: 24, done: 18 },
  { name: "Учёба",    color: "#bdfd46", tasks: 12, done: 7  },
  { name: "Спорт",    color: "#188038", tasks: 6,  done: 5  },
  { name: "Личное",   color: "#e91e63", tasks: 9,  done: 8  },
];

// Активность по дням: понедельник → воскресенье.
// Значение 0–4 — условная «загруженность» дня.
const WEEK_ACTIVITY: Array<{ day: string; level: number }> = [
  { day: "Пн", level: 3 },
  { day: "Вт", level: 4 },
  { day: "Ср", level: 2 },
  { day: "Чт", level: 4 },
  { day: "Пт", level: 3 },
  { day: "Сб", level: 1 },
  { day: "Вс", level: 0 },
];

const WEEK_LEVEL_CLASSES = [
  "bg-gray-100 dark:bg-gray-800",
  "bg-blue-100 dark:bg-blue-900/40",
  "bg-blue-300 dark:bg-blue-700/60",
  "bg-blue-500 dark:bg-blue-500",
  "bg-blue-700 dark:bg-blue-400",
];


// ---------- Аналитика и прогресс ----------

// ---------- Анализ и прогресс ----------

const Analytics: React.FC = () => {
  const totalMinutes = PRIORITY_TIME.reduce((s, x) => s + x.minutes, 0);
  const maxMinutes = Math.max(...PRIORITY_TIME.map((x) => x.minutes));

  return (
    <section id="analytics" className="relative py-20 md:py-32 overflow-hidden">
      {/* Фоновый слой — декоративная визуализация.
          Именно за ней «сидит» заголовок. */}
      <AnalyticsBackdrop />

      {/* Передний слой — заголовок + карточка метрик */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6">
        {/* Заголовок поверх фона */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <Badge variant="default" className="mb-3">
            <BarChart3 size={12} className="mr-1" aria-hidden="true" />
            Аналитика
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Анализ и прогресс
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Смотрите, куда уходит время и как вы справляетесь с планами.
          </p>
        </div>

        {/* Карточка с метриками по времени для приоритетов A–F */}
        <Card className="p-6 md:p-8 backdrop-blur-md bg-white/85 dark:bg-gray-900/85 shadow-xl">
          {/* Шапка карточки */}
          <div className="flex items-baseline justify-between mb-6 md:mb-8">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                За последние 7 дней
              </p>
              <p className="font-medium">Время по приоритетам</p>
            </div>
            <div className="text-right">
              <p className="text-3xl md:text-4xl font-semibold tabular-nums">
                {formatMinutes(totalMinutes)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                всего запланировано
              </p>
            </div>
          </div>

          {/* Горизонтальные бары по приоритетам */}
          <div className="space-y-3 md:space-y-4">
            {PRIORITY_TIME.map((row) => {
              const pr = PRIORITY_STYLES[row.priority];
              const widthPct = (row.minutes / maxMinutes) * 100;
              const sharePct = Math.round((row.minutes / totalMinutes) * 100);

              return (
                <div key={row.priority} className="flex items-center gap-3">
                  {/* Буква приоритета */}
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center justify-center w-7 h-7 rounded text-[11px] font-bold ring-1",
                      pr.bg,
                      pr.text,
                      pr.ring,
                    )}
                    aria-label={`Приоритет ${row.priority}`}
                  >
                    {row.priority}
                  </span>

                  {/* Бар */}
                  <div className="relative flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all",
                        pr.solid,
                      )}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  {/* Время */}
                  <span className="shrink-0 w-20 text-right text-xs md:text-sm text-gray-700 dark:text-gray-200 tabular-nums">
                    {formatMinutes(row.minutes)}
                  </span>

                  {/* Доля */}
                  <span className="hidden sm:inline-block shrink-0 w-10 text-right text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                    {sharePct}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Итоговая полоска распределения */}
          <div className="mt-8">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Распределение
            </p>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
              {PRIORITY_TIME.map((row) => {
                const share = (row.minutes / totalMinutes) * 100;
                const pr = PRIORITY_STYLES[row.priority];
                return (
                  <div
                    key={row.priority}
                    className={cn("h-full", pr.bg)}
                    style={{ width: `${share}%` }}
                    title={`${row.priority}: ${Math.round(share)}%`}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
              {PRIORITY_TIME.map((row) => (
                <span key={row.priority} className="inline-flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-sm", PRIORITY_STYLES[row.priority].bg)} />
                  {row.priority}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

// ---------- Фон для секции аналитики ----------

const AnalyticsBackdrop: React.FC = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 z-0 pointer-events-none opacity-[0.18] dark:opacity-[0.14]"
  >
    <div className="max-w-6xl mx-auto h-full px-4 md:px-6 grid grid-cols-12 gap-4 items-center">
      {/* Кольцо прогресса — слева */}
      <div className="col-span-4 flex justify-center">
        <ProgressRing value={68} size={200} stroke={16} />
      </div>

      {/* Вертикальные бары — в центре */}
      <div className="col-span-5 flex items-end justify-between h-48 gap-2">
        {[40, 75, 55, 90, 30, 60, 45].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-blue-500"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      {/* Облако тегов — справа */}
      <div className="col-span-3 flex flex-wrap gap-2 content-center">
        {["Работа", "Учёба", "Спорт", "Личное", "Хобби", "Здоровье"].map((t) => (
          <span
            key={t}
            className="px-2 py-1 rounded bg-blue-500/40 text-blue-700 dark:text-blue-200 text-[10px]"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// ---------- Маскот со смартфоном ----------

const MascotWithPhone: React.FC = () => (
  <svg
    viewBox="0 0 260 340"
    className="w-full h-auto"
    role="img"
    aria-label="Человек говорит по телефону с голосовым ассистентом"
  >
    <defs>
      <linearGradient id="mq-head" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
      <linearGradient id="mq-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="mq-phone" x1="0" y1="0" x2="0" y2="1">
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
      fill="url(#mq-body)"
    />

    {/* Левая рука — опущена вниз */}
    <path
      d="M 90 205 Q 62 250 78 300"
      stroke="url(#mq-body)"
      strokeWidth="24"
      strokeLinecap="round"
      fill="none"
    />

    {/* Голова */}
    <circle cx="130" cy="115" r="55" fill="url(#mq-head)" />

    {/* Волосы */}
    <path
      d="M 75 110
         C 75 65, 100 50, 130 50
         C 160 50, 185 65, 185 110
         C 178 88, 158 80, 130 80
         C 102 80, 82 88, 75 110 Z"
      fill="#0f172a"
    />

    {/* Глаза — «улыбающиеся» дуги */}
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

    {/* Правая рука — поднята к телефону */}
    <path
      d="M 170 205 Q 205 190 195 150"
      stroke="url(#mq-body)"
      strokeWidth="24"
      strokeLinecap="round"
      fill="none"
    />

    {/* Смартфон у уха */}
    <rect x="186" y="96" width="26" height="48" rx="6" fill="#0f172a" />
    <rect x="190" y="101" width="18" height="38" rx="3" fill="url(#mq-phone)" />

    {/* Звуковые волны — ассистент слушает/отвечает */}
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

    {/* Искорки-акценты вокруг — «магия» ассистента */}
    <circle cx="60" cy="80" r="3" fill="#93c5fd" opacity="0.7" />
    <circle cx="52" cy="150" r="2" fill="#c4b5fd" opacity="0.6" />
    <circle cx="70" cy="40" r="2" fill="#a5f3fc" opacity="0.6" />
  </svg>
);

// ---------- Фоновые импульсы ----------

const BackgroundPulses: React.FC = () => (
  <>
    <style>{`
      /* Пульсации блобов */
      @keyframes blob-pulse {
        0%, 100% { opacity: 0.35; transform: scale(1)   translate(0, 0); }
        50%      { opacity: 0.70; transform: scale(1.18) translate(0, -8px); }
      }
      @keyframes blob-pulse-slow {
        0%, 100% { opacity: 0.30; transform: scale(1)   translate(0, 0); }
        50%      { opacity: 0.60; transform: scale(1.25) translate(0, 10px); }
      }
      .blob-pulse       { animation: blob-pulse      8s  ease-in-out infinite; }
      .blob-pulse-slow  { animation: blob-pulse-slow 14s ease-in-out infinite; }
      .blob-pulse-fast  { animation: blob-pulse      6s  ease-in-out infinite; }
      .blob-pulse-d-1   { animation-delay: 1.5s; }
      .blob-pulse-d-2   { animation-delay: 3s; }
      .blob-pulse-d-3   { animation-delay: 4.5s; }
      .blob-pulse-d-4   { animation-delay: 6s; }
      .blob-pulse-d-5   { animation-delay: 7.5s; }

      /* Медленный дрейф всего слоя блобов */
      @keyframes blobs-drift {
        0%   { transform: translate3d(0,    0,   0) rotate(0deg); }
        50%  { transform: translate3d(-24px, 16px, 0) rotate(1.2deg); }
        100% { transform: translate3d(0,    0,   0) rotate(0deg); }
      }
      .blobs-drift { animation: blobs-drift 26s ease-in-out infinite; }

      /* Кроссфейд AI-рекомендаций в мокапе.
         Обе версии накладываются друг на друга, но в каждый момент одна
         читается чётко, а вторая «эхом» растворяется рядом. */
      @keyframes ai-reco-a {
        0%, 42%   { opacity: 1;   filter: blur(0px); }
        55%, 92%  { opacity: 0;   filter: blur(3px); }
        100%      { opacity: 1;   filter: blur(0px); }
      }
      @keyframes ai-reco-b {
        0%, 42%   { opacity: 0;   filter: blur(3px); }
        55%, 92%  { opacity: 1;   filter: blur(0px); }
        100%      { opacity: 0;   filter: blur(3px); }
      }
      .ai-reco-a { animation: ai-reco-a 7s ease-in-out infinite; }
      .ai-reco-b { animation: ai-reco-b 7s ease-in-out infinite; }

      @media (prefers-reduced-motion: reduce) {
        .blob-pulse, .blob-pulse-slow, .blob-pulse-fast,
        .blobs-drift, .ai-reco-a, .ai-reco-b { animation: none; }
        .ai-reco-b { opacity: 0; }
      }
    `}</style>

    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-[-10%] blobs-drift">
        {/* Ряд 1 — верх */}
        <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-blue-500/25 blur-3xl blob-pulse" />
        <div className="absolute -top-24 right-[-10rem] w-[32rem] h-[32rem] rounded-full bg-purple-500/25 blur-3xl blob-pulse-slow blob-pulse-d-1" />
        <div className="absolute top-[-6rem] left-1/3 w-[20rem] h-[20rem] rounded-full bg-cyan-400/20 blur-3xl blob-pulse-fast blob-pulse-d-3" />

        {/* Ряд 2 — верх-центр */}
        <div className="absolute top-1/4 -left-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl blob-pulse-fast blob-pulse-d-2" />
        <div className="absolute top-1/3 right-[-8rem] w-[26rem] h-[26rem] rounded-full bg-pink-500/20 blur-3xl blob-pulse blob-pulse-d-3" />
        <div className="absolute top-[38%] left-[55%] w-[22rem] h-[22rem] rounded-full bg-violet-500/20 blur-3xl blob-pulse-slow blob-pulse-d-4" />

        {/* Ряд 3 — центр */}
        <div className="absolute top-[50%] left-1/4 w-80 h-80 rounded-full bg-sky-400/20 blur-3xl blob-pulse-slow" />
        <div className="absolute top-[58%] right-1/4 w-[18rem] h-[18rem] rounded-full bg-blue-400/20 blur-3xl blob-pulse-fast blob-pulse-d-5" />

        {/* Ряд 4 — низ */}
        <div className="absolute bottom-1/4 -right-20 w-[30rem] h-[30rem] rounded-full bg-fuchsia-500/20 blur-3xl blob-pulse-fast blob-pulse-d-1" />
        <div className="absolute bottom-[-6rem] left-[-4rem] w-[34rem] h-[34rem] rounded-full bg-blue-600/20 blur-3xl blob-pulse-slow blob-pulse-d-2" />
        <div className="absolute bottom-[-4rem] right-1/3 w-[24rem] h-[24rem] rounded-full bg-purple-600/20 blur-3xl blob-pulse blob-pulse-d-4" />
      </div>

      {/* Тонкая сетка */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          color: "#000",
        }}
      />
    </div>
  </>
);

// Контейнер: календарь + маскот + речь — единый адаптивный блок
const HeroScene: React.FC = () => (
  <div className="relative w-full">
    {/* Слой 0 — маскот: за календарём, затухает к низу туловища */}
    <div
      className="
        absolute z-0
        -top-24 md:-top-40 lg:-top-80
        -left-[10%] sm:-left-[25%] md:-left-[40%] lg:-left-[50%]
        w-[60%] sm:w-[70%] md:w-[80%] lg:w-[85%]
        min-w-[140px] max-w-[420px]
      "
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.35) 72%, transparent 92%)",
        maskImage:
          "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.35) 72%, transparent 92%)",
      }}
    >
      <MascotWithPhone />
    </div>

    {/* Слой 1 — календарь: поверх маскота */}
    <div className="relative z-10 w-full">
      <HeroMockup />
    </div>

    {/* Слой 2 — невидимый бокс под маскота, чтобы речь встала на уровне рта
        и оказалась поверх календаря */}
    <div
      className="
        absolute z-20 pointer-events-none
        -top-24 md:-top-40 lg:-top-80
        -left-[10%] sm:-left-[25%] md:-left-[40%] lg:-left-[50%]
        w-[60%] sm:w-[70%] md:w-[80%] lg:w-[85%]
        min-w-[140px] max-w-[420px]
        aspect-[260/340]
      "
    >
      <div className="relative w-full h-full">
        <div
          className="
            absolute left-full ml-3 md:ml-4
            top-[40%] -translate-y-1/2
            w-[130%] md:w-[140%]
            max-w-[340px] md:max-w-[400px]
            pointer-events-auto
          "
        >
          <SpeechBubble />
        </div>
      </div>
    </div>
  </div>
);

// ---------- Hero ----------

const Hero: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="relative">
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-28 md:pt-40 lg:pt-52 pb-4 md:pb-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
      <div className="text-eyebrow min-w-0">
        <Badge variant="default" className="mb-4">
          <Sparkles size={12} className="mr-1" aria-hidden="true" />
          Бесплатный персональный ИИ-ассистент
        </Badge>

        <h1 className="text-eyebrowtext-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          Планируйте день{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            за минуту
          </span>
        </h1>

        <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 max-w-xl">
          Скажите о своих планах — Deyla найдёт время в календаре, расставит
          приоритеты и напомнит. Вам не нужно вручную собирать задачи из
          заметок и чатов.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <InteractiveButton
            type="button"
            onClick={onStart}
            scaleAmount={1.2}
            className="text-eyebrow px-8"
          >
            Начать бесплатно
            <ArrowRight size={18} className="ml-1" aria-hidden="true" />
          </InteractiveButton>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              document.getElementById("benefits")?.scrollIntoView({ behavior: "smooth" })
            }
            className="dark:text-white dark"
          >
            <p className="text-eyebrow text-blue-600 dark:text-blue-400 mb-2">
                Как это работает
            </p>
          </Button>
        </div>

      </div>

      <div className="min-w-0">
        <HeroScene />
      </div>
    </div>
  </section>
);

// ---------- Голосовой сценарий ----------

//const VoiceQuery: React.FC = () => (
//  <section className="relative z-10 -mt-6 md:-mt-10 lg:-mt-16">
//    <div className="max-w-6xl mx-auto px-4 md:px-6">
//      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
//        {/* Левая колонка: заголовок + пояснения */}
//        <div className="space-y-5 lg:pt-24 xl:pt-28">
//          <div>
//            <Badge variant="default" className="mb-3">
//              <Mic size={12} className="mr-1" aria-hidden="true" />
//              Голосом — проще
//            </Badge>
//            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
//              Спросите — и Deyla подскажет, что делать дальше
//            </h2>
//            <p className="mt-3 text-gray-600 dark:text-gray-400">
//              Пока идёт день, планы меняются. Просто скажите, что сдвинулось, —
//              и получите конкретное действие вместо пустого слота.
//            </p>
//          </div>
//
//          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
//            <li className="flex gap-3">
//              <Sparkles size={18} className="text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
//              <span>Понимает свободный текст: перестроит план, если тренировка отменилась.</span>
//            </li>
//            <li className="flex gap-3">
//              <Sparkles size={18} className="text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
//              <span>Предлагает реальное действие под ваши цели, а не абстрактный совет.</span>
//            </li>
//            <li className="flex gap-3">
//              <Sparkles size={18} className="text-blue-500 shrink-0 mt-0.5" aria-hidden="true" />
//              <span>Ничего не меняет без подтверждения — вы решаете, что оставить в плане.</span>
//            </li>
//          </ul>
//        </div>
//
//        <div className="relative flex flex-col items-center">     
//          <div
//            className="relative z-20 w-full max-w-[340px]
//                       -mt-40 md:-mt-56 lg:-mt-72 xl:-mt-80
//                       lg:-ml-[130%]"                                    
//          >
//            <div
//              aria-hidden="true"
//              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-blue-400/35 via-indigo-400/25 to-purple-400/35 blur-3xl"
//            />
//            <MascotWithPhone />
//          </div>
//
//          <div className="mt-6 w-full max-w-[440px]">   
//            <SpeechBubble />
//          </div>
//        </div>
//      </div>
//    </div>
//  </section>
//);

// ---------- Речевой бабл ----------

const SpeechBubble: React.FC = () => (
  <Card className="relative p-5 md:p-5 shadow-lg">
    <CardContent className="p-0">
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        >
          <Mic size={16} className="text-white" />
        </div>

        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Голосовой запрос
          </p>
          <p className="text-base md:text-lg leading-snug text-gray-900 dark:text-white">
            «Deyla, что я могу сделать вместо тренировки в 15 часов?»
          </p>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Deyla подберёт альтернативу под ваши цели — например, созвон
            с контрагентом или лабораторную работу.
          </p>
        </div>
      </div>
    </CardContent>

    {/* Хвостик бабла — вверх, к маскоту */}
    <div
      aria-hidden="true"
      className= "absolute -left-2 top-[40%] -translate-y-1/2 w-4 h-4 rotate-45 bg-white dark:bg-gray-800"
    />
  </Card>
);

// ---------- Мокап календаря ----------

const MOCK_TASKS: Array<{
  time: string;
  title: string;
  tag: string;
  color: string;
  priority: Priority;
  checkpoints: { done: number; total: number };
  done?: boolean;
}> = [
  { time: "09:00", title: "Встреча с командой",        tag: "Работа", color: "#1a73e8", priority: "B", checkpoints: { done: 0, total: 1 } },
  { time: "11:30", title: "Ответить на письма",        tag: "Работа", color: "#1a73e8", priority: "D", checkpoints: { done: 3, total: 4 } },
  { time: "13:00", title: "Обед",                      tag: "Личное", color: "#e91e63", priority: "F", checkpoints: { done: 0, total: 1 } },
  { time: "15:00", title: "Тренировка",                tag: "Спорт",  color: "#188038", priority: "C", checkpoints: { done: 1, total: 1 }, done: true },
  { time: "18:30", title: "Лабораторная работа X",      tag: "Учёба",  color: "#bdfd46", priority: "A", checkpoints: { done: 2, total: 5 } },
  { time: "18:30", title: "Созвон с контрагентом Y",   tag: "Работа", color: "#1a73e8", priority: "A", checkpoints: { done: 0, total: 1 } },
];

// Две версии AI-рекомендации. Обе валидны, обе полезны — но попадают
// в разные аудитории (студент / специалист). Показываются наложенно.
const AI_RECOMMENDATION_STUDENT =
  "Перенести лабораторную работу X с 18:30 на 15:00?";
const AI_RECOMMENDATION_PRO =
  "Перенести онлайн-встречу с контрагентом Y с 18:30 на 15:00?";

const HeroMockup: React.FC = () => (
  <div className="relative w-full">
    <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/25 via-indigo-500/15 to-purple-500/25 rounded-3xl blur-2xl" />
    <Card className="relative w-full p-0 overflow-hidden shadow-xl">
      <div className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Сегодня</p>
          <p className="font-medium">понедельник, 14 октября</p>
        </div>
        <Badge variant="success">Выполнено 60%</Badge>
      </div>

      <ul className="p-3 space-y-1.5">
        {MOCK_TASKS.map((t) => {
          const pr = PRIORITY_STYLES[t.priority];
          const pct = Math.round((t.checkpoints.done / t.checkpoints.total) * 100);

          return (
            <li
              key={t.time + t.title}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/60",
                t.done && "opacity-60",
              )}
            >
              {/* Время */}
              <span className="text-xs text-gray-400 w-11 tabular-nums shrink-0">
                {t.time}
              </span>

              {/* Цветная полоса тега */}
              <span
                className="w-1 self-stretch rounded shrink-0"
                style={{ backgroundColor: t.color }}
                aria-hidden="true"
              />

              {/* Название */}
              <span
                className={cn(
                  "text-sm flex-1 min-w-0 truncate",
                  t.done && "line-through text-gray-400",
                )}
              >
                {t.title}
              </span>

              {/* Приоритет A–F */}
              <span
                className={cn(
                  "shrink-0 inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ring-1",
                  pr.bg,
                  pr.text,
                  pr.ring,
                )}
                title={`Приоритет ${t.priority}`}
                aria-label={`Приоритет ${t.priority}`}
              >
                {t.priority}
              </span>

              {/* Чекпоинты: мини-прогресс + N/M */}
              <span
                className="hidden sm:flex shrink-0 items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 tabular-nums"
                title={`Чекпоинты: ${t.checkpoints.done} из ${t.checkpoints.total}`}
                aria-label={`Чекпоинты: ${t.checkpoints.done} из ${t.checkpoints.total}`}
              >
                <span className="relative h-1 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-green-500"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span>{t.checkpoints.done}/{t.checkpoints.total}</span>
              </span>

              {/* Тег */}
              <span className="hidden md:inline-block shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                {t.tag}
              </span>
            </li>
          );
        })}

        {/* AI-рекомендация + подтверждение */}
        <li className="relative flex flex-col gap-2.5 p-3 rounded bg-blue-50/70 dark:bg-blue-900/20">
        {/* Верхняя строка: время, искра, текст рекомендации (кроссфейд) */}
        <div className="flex items-center gap-3">

            <span className="relative shrink-0">
            <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
            {/* Пульс — «ждёт подтверждения» */}
            <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
            />
            </span>

            <div className="relative flex-1 min-w-0 h-5" aria-label="Рекомендация ИИ">
            <span className="ai-reco-a absolute inset-0 flex items-center text-sm text-blue-800 dark:text-blue-200 whitespace-nowrap overflow-hidden text-ellipsis">
                {AI_RECOMMENDATION_STUDENT}
            </span>
            <span
                className="ai-reco-b absolute inset-0 flex items-center text-sm text-blue-800 dark:text-blue-200 whitespace-nowrap overflow-hidden text-ellipsis"
                aria-hidden="true"
            >
                {AI_RECOMMENDATION_PRO}
            </span>
            </div>
        </div>

        {/* Нижняя строка: кнопки подтверждения под текстом */}
        <div className="flex items-center">
            <button
            type="button"
            className="
                inline-flex items-center gap-1 px-2.5 h-6 rounded text-[11px] font-medium
                bg-blue-600 text-white hover:bg-blue-700 transition-colors
            "
            >
            Подтвердить
            </button>

            <button
            type="button"
            className="
                inline-flex items-center gap-1 px-2.5 h-6 rounded text-[11px] font-medium
                bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300
                hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors
            "
            >
            Изменить
            </button>

            <button
            type="button"
            className="
                inline-flex items-center px-2 h-6 rounded text-[11px] font-medium
                text-blue-700/70 dark:text-blue-300/70 hover:text-blue-900 dark:hover:text-blue-100
                transition-colors
            "
            >
            Позже
            </button>
        </div>
        </li>
      </ul>
    </Card>
  </div>
);
// ---------- Возможности ----------
const BENEFITS = [
  { icon: Mic, title: "Говорите как человеку", text: "Опишите задачу текстом или голосом — Deyla сам разберётся, куда её поставить." },
  { icon: Send, title: "Telegram-бот", text: "Перешлите сообщение в бот — задача появится в календаре." },
  { icon: Calendar, title: "Умные рекомендации", text: "Deyla находит свободные окна и подсказывает, что в них можно сделать." },
  { icon: BarChart3, title: "Анализ и прогресс", text: "Смотрите, куда уходит время и как вы справляетесь с планами." },
];

const Benefits: React.FC = () => (
  <section
    id="benefits"
    className="relative pt-20 pb-40 md:pt-28 md:pb-52 overflow-hidden"
  >
    {/* Фоновые декорации (кольцо, бары, теги) — правая половина */}
    <BenefitsBackdrop />

    {/* Передний план: заголовок + сетка карточек */}
    <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6">
      <div className="max-w-2xl mb-12">
        <Badge className="text-eyebrow">Возможности</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Меньше рутины — больше дня
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Всё, чтобы не терять задачи и не тратить полчаса на планирование.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <Card
            key={title}
            className="
              relative z-10
              group hover:shadow-lg transition-shadow
              backdrop-blur-sm bg-white/80 dark:bg-gray-900/70
            "
          >
            <CardContent>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 transition-transform group-hover:scale-110">
                <Icon size={20} aria-hidden="true" />
              </div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

        {/* ─── Прогресс-группа: кольцо + A–F + график ─────────
        Один ряд, растянутый по правому краю секции.
        gap-[25vw] = ¼ ширины окна между элементами (desktop).
        На мобилке — вертикальный стак с обычным gap. */}
    <div
    className="
        absolute z-0 pointer-events-none
        inset-x-0 bottom-44
        flex flex-col lg:flex-row
        items-center lg:items-end justify-end
        gap-10 lg:gap-[10vw]
        px-4 md:px-8 lg:px-12
        blur-[1.4px]
    "
    >
    {/* 1. Кольцо 68% */}
    <ProgressRing value={68} size={180} stroke={14} />

    {/* 2. Блок A–F */}
    <div
        className="
        w-[320px] md:w-[360px] shrink-0
        p-4 rounded-2xl
        bg-white/75 dark:bg-gray-900/75
        ring-1 ring-gray-200/80 dark:ring-gray-700/60
        backdrop-blur-sm
        space-y-4
        "
    >
        <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400">
        Время по приоритетам
        </p>

        {PRIORITY_TIME.map((row) => {
        const max = Math.max(...PRIORITY_TIME.map((x) => x.minutes));
        const widthPct = (row.minutes / max) * 100;
        return (
            <div key={row.priority} className="flex items-center gap-2.5">
            <span
                className={cn(
                "shrink-0 inline-flex items-center justify-center w-7 h-7 rounded text-[12px] font-bold ring-2 shadow-sm",
                PRIORITY_BADGE_SOLID[row.priority],
                )}
            >
                {row.priority}
            </span>

            <div className="relative flex-1 h-3.5 rounded-full bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden">
                <div
                className={cn(
                    "absolute inset-y-0 left-0 rounded-full shadow-sm",
                    PRIORITY_BAR_SOLID[row.priority],
                )}
                style={{ width: `${widthPct}%` }}
                />
            </div>

            <span className="text-[11px] w-16 text-right tabular-nums text-gray-900 dark:text-white font-semibold">
                {formatMinutes(row.minutes)}
            </span>
            </div>
        );
        })}
    </div>

    {/* 3. Вертикальный график по дням */}
    <div className="flex items-end h-40 gap-2 shrink-0">
        {[40, 75, 55, 90, 30, 60, 45].map((h, i) => (
        <div
            key={i}
            className="w-5 rounded-t bg-blue-500"
            style={{ height: `${h}%` }}
        />
        ))}
    </div>
    </div>
  </section>
);

// ---------- Фон для секции возможностей ----------
const PRIORITY_BADGE_SOLID: Record<Priority, string> = {
  A: "bg-red-500 text-white ring-red-600",
  B: "bg-orange-500 text-white ring-orange-600",
  C: "bg-amber-500 text-white ring-amber-600",
  D: "bg-blue-500 text-white ring-blue-600",
  E: "bg-slate-500 text-white ring-slate-600",
  F: "bg-slate-400 text-white ring-slate-500",
};

const PRIORITY_BAR_SOLID: Record<Priority, string> = {
  A: "bg-red-500",
  B: "bg-orange-500",
  C: "bg-amber-500",
  D: "bg-blue-500",
  E: "bg-slate-500",
  F: "bg-slate-400",
};

const BenefitsBackdrop: React.FC = () => (
  <div
    aria-hidden="true"
    className="
      absolute inset-y-0 right-0 left-1/2 z-0 pointer-events-none
      hidden md:block
    "
    style={{
      // Лёгкое затухание к центру — у левого края половины фон тает,
      // чтобы не спорить с колонкой текста.
      maskImage:
        "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 12%, black 30%, black 100%)",
      WebkitMaskImage:
        "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.55) 12%, black 30%, black 100%)",
    }}
  >
    <div className="relative w-full h-full opacity-[0.42] dark:opacity-[0.36]">
    </div>
  </div>
);

// ---------- Как это работает ----------

const STEPS = [
  { num: 1, icon: Target, title: "Расскажите о себе", text: "Ответьте на пару вопросов о целях, сферах и удобном графике." },
  { num: 2, icon: Zap, title: "Добавляйте задачи", text: "Через чат, голос или Telegram — как удобно." },
  { num: 3, icon: Sparkles, title: "Получайте план", text: "Deyla расставит задачи по слотам и напомнит о важном." },
];

const HowItWorks: React.FC = () => (
  <section className="relative py-16 md:py-24">
    <div className="max-w-6xl mx-auto px-4 md:px-6">
      <div className="max-w-2xl mb-12">
        <Badge variant="default" className="mb-3 text-eyebrow">Как это работает</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Три шага до спокойного дня
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-4 md:gap-6">
        {STEPS.map(({ num, icon: Icon, title, text }, i) => (
          <div key={num} className="relative">
            <Card className="h-full bg-white dark:bg-gray-900 shadow-lg">
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold flex items-center justify-center">
                    {num}
                  </span>
                  <Icon size={20} className="text-gray-400" aria-hidden="true" />
                </div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{text}</p>
              </CardContent>
            </Card>

            {i < STEPS.length - 1 && (
              <ArrowRight
                size={20}
                className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 text-gray-300 dark:text-gray-700 z-10"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------- Финальный CTA ----------

// ---------- Финальный CTA: интеграции ----------

const WHITE_GRADIENT_STOPS = [
  { offset: "0%",   color: "#ffffff" },
  { offset: "60%",  color: "#f8fafc" },
  { offset: "100%", color: "#e2e8f0" },
];

const INTEGRATIONS = [
  { src: "/images/google-calendar.png",      alt: "Google Calendar", w: 44 },
  { src: "/images/Календарь_для_macOS.png",  alt: "Apple Calendar",  w: 44 },
  { src: "/images/Jira_Software_Logo.svg",   alt: "Jira",            w: 40 },
  { src: "/images/Notion.png",               alt: "Notion",          w: 44 },
  { src: "/images/Obsidian.png",             alt: "Obsidian",        w: 44 },
];

const FinalCTA: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <section className="relative py-20 md:py-28">
    <div className="max-w-5xl mx-auto px-4 md:px-6">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-8 py-14 md:px-16 md:py-20 text-white">
        {/* Декоративные свечения */}
        <div className="absolute inset-0 opacity-25 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-10 left-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-10 right-1/4 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative">
          {/* ─── Заголовок ────────────────────────────────── */}
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-eyebrow text-white/70 mb-4">
              Один ритм вместо десяти приложений
            </p>

            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              Ваш день живёт в&nbsp;Google, Jira и&nbsp;блокноте.{" "}
              <span className="text-white/85">
                Deyla собирает его в&nbsp;одну картину.
              </span>
            </h2>

            <p className="mt-5 md:mt-6 text-base md:text-lg text-white/85 max-w-2xl mx-auto">
              Мы соединяем то, чем вы уже пользуетесь: календари, рабочие задачи,
              заметки и идеи. Без переносов вручную. Без копирования.
              Без «а где у меня это записано?».
            </p>
          </div>

          {/* ─── Логотипы интеграций ──────────────────────── */}
          <div className="mt-12 md:mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {INTEGRATIONS.map((i) => (
              <div
                key={i.alt}
                className="
                  flex items-center justify-center
                  h-14 w-14 md:h-16 md:w-16
                  rounded-2xl bg-white/10 backdrop-blur-sm
                  ring-1 ring-white/20
                  hover:bg-white/15 transition-colors
                "
                title={i.alt}
              >
                <img
                  src={i.src}
                  alt={i.alt}
                  style={{ width: i.w, height: "auto" }}
                  className="max-h-10 object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>


          {/* ─── CTA ─────────────────────────────────────── */}
          <div className="mt-12 md:mt-14 flex flex-col items-center text-center">
            <p className="text-lg md:text-xl font-medium">
              Личный ИИ-ассистент,
              который держит день в&nbsp;форме.
            </p>

            <div className="text-eyebrow mt-8 flex justify-center">
                <InteractiveButton
                    type="button"
                    onClick={onStart}
                    scaleAmount={1.3}
                    glowRadius="80%"
                    className="px-20 h-[13.75rem] min-w-[20rem] text-lg"
                    gradientStops={WHITE_GRADIENT_STOPS}
                    contentClassName="text-blue-700 text-lg md:text-xl font-semibold"
                >
                    Начать бесплатно
                    <ArrowRight size={24} className="ml-2" aria-hidden="true" />
                </InteractiveButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);