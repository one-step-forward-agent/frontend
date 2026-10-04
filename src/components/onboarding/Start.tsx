// src/components/onboarding/Start.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Send, Calendar, BarChart3,
  Mic, Zap, Target, ArrowRight, Check,
  Reply,       
  Copy,        
  Download,    
  Pin,         
  Forward,     
  Trash2,
  ArrowDown,     // ← добавить
  Hash,          // ← добавить (Slack)
  Video,         // ← добавить (TrueConf)
  ListChecks,
  type LucideIcon,
} from "lucide-react";

import {
  getPerspectiveMatrix,
  usePerspectiveTransform,
  type Point,
} from "@/utils/perspective";

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
      <UserCase /> 
      <UserCaseFinance />
      <UserCaseGTD />
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

// ---------- Контекстное меню (как при long-press в Telegram) ----------

type MenuItem = {
  label: string;
  icon: LucideIcon;
  tone?: "default" | "danger";
};

const CONTEXT_MENU_ITEMS: MenuItem[] = [
  { label: "Ответить",         icon: Reply },
  { label: "Скопировать",      icon: Copy },
  { label: "Сохранить фото",   icon: Download },
  { label: "Переслать Dayla",        icon: Forward },
  { label: "Удалить",          icon: Trash2, tone: "danger" },
];

const ChatContextMenu: React.FC = () => (
  <div
    className="
      relative rounded-2xl overflow-visible
      bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
      ring-1 ring-gray-200/80 dark:ring-gray-700/60
      shadow-2xl
    "
    role="menu"
    aria-label="Действия с сообщением"
  >
    {CONTEXT_MENU_ITEMS.map(({ label, icon: Icon, tone }, i) => {
      const isDanger = tone === "danger";
      const isHighlighted = label === "Переслать Dayla";

      return (
        <React.Fragment key={label}>
          {isDanger && i > 0 && (
            <div className="h-px bg-gray-100 dark:bg-gray-800" />
          )}

          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className={cn(
                "relative isolate w-full flex items-center gap-2.5",
                "px-3 py-2 text-left text-[20px] font-medium",
                "transition-colors rounded-xl",
                isHighlighted ? "z-10" : "z-0",
                // Без bg-white на самой кнопке — белая заливка пойдёт отдельным слоем
                isDanger &&
                "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40",
                !isDanger &&
                !isHighlighted &&
                "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60"
            )}
            >
            {isHighlighted && (
                <>
                {/* ─── Слой 1 (z-0): радиальный градиент-ореол ─── */}
                <span
                    aria-hidden="true"
                    className="
                    absolute inset-[-30%] z-0 pointer-events-none
                    blur-xl rounded-full
                    "
                    style={{
                    background:
                        "radial-gradient(circle at center, rgba(59,130,246,0.75) 0%, rgba(99,102,241,0.45) 40%, rgba(139,92,246,0.2) 65%, transparent 90%)",
                    }}
                />

                {/* ─── Слой 2 (z-10): белая заливка кнопки ─── */}
                <span
                    aria-hidden="true"
                    className="
                    absolute inset-0 z-10 pointer-events-none
                    rounded-xl
                    bg-white dark:bg-gray-900
                    shadow-md
                    "
                />
                </>
            )}

            {/* ─── Слой 3 (z-20): контент поверх всего ─── */}
            <Icon
                size={13}
                className={cn(
                "shrink-0 relative z-20",
                isDanger && "text-red-500 dark:text-red-400",
                !isDanger && !isHighlighted && "text-gray-400 dark:text-gray-500"
                )}
                aria-hidden="true"
            />

            <span className="relative z-20 flex-1 truncate">{label}</span>
            </button>
        </React.Fragment>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────
// UserCaseGTD: систематизация задач по GTD
// ─────────────────────────────────────────────────────────────

const GTD_SOURCES = [
  { id: "jira",     name: "Jira",     icon: ListChecks, gradient: "from-blue-500 to-indigo-600",    count: 6 },
  { id: "trueconf", name: "TrueConf", icon: Video,      gradient: "from-emerald-500 to-teal-600",   count: 3 },
  { id: "slack",    name: "Slack",    icon: Hash,       gradient: "from-fuchsia-500 to-purple-600", count: 3 },
];

const GTDAggregation: React.FC = () => (
  <div className="relative w-full max-w-[460px]">
    <div
      aria-hidden="true"
      className="absolute inset-[-10%] -z-10 rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-purple-400/20 blur-3xl"
    />

    {/* Источники */}
    <div className="grid grid-cols-3 gap-3 mb-2">
      {GTD_SOURCES.map(({ id, name, icon: Icon, gradient, count }) => (
        <div
          key={id}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm ring-1 ring-gray-200/70 dark:ring-gray-700/60 shadow-sm"
        >
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md`}
          >
            <Icon size={24} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
            {count} задач
          </span>
        </div>
      ))}
    </div>

    {/* Сходящиеся стрелки */}
    <svg
      viewBox="0 0 400 40"
      className="w-full h-10 text-blue-400/60"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M72 0 Q72 22 200 22" />
      <path d="M200 0 L200 22" />
      <path d="M328 0 Q328 22 200 22" />
      <path d="M200 22 L200 38" />
    </svg>

    {/* Dayla + GTD */}
    <div className="flex justify-center mt-1">
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-700 shadow-lg">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <Sparkles size={15} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Dayla разложила по GTD
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            12 задач · 4 проекта · 3 источника
          </p>
        </div>
      </div>
    </div>

    {/* Стрелка вниз */}
    <div className="flex justify-center my-3">
      <ArrowDown size={20} className="text-blue-400" aria-hidden="true" />
    </div>

    {/* Google Calendar */}
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl">
        <Calendar size={20} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Внести в Google Calendar</p>
          <p className="text-[11px] text-white/80">
            Слоты подобраны по вашему графику
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Развёрнутый ответ Dayla ───

const GTD_RESPONSE = (
  <div className="space-y-3">
    <p>
      Собрала <strong className="font-semibold">12 задач</strong> за период 30.09–06.10
      из <strong>Jira</strong>, <strong>TrueConf</strong> и <strong>Slack</strong>.
      Разложила по GTD:
    </p>

    {/* Срочное */}
    <div>
      <p className="text-[11px] uppercase tracking-widest font-semibold text-red-500 dark:text-red-400 mb-1.5">
        🔥 Дедлайн сегодня
      </p>
      <ul className="space-y-1.5">
        <li className="flex items-start gap-2">
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
            Jira
          </span>
          <span className="flex-1">Ревью PR #482 — до 18:00</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300 font-medium">
            Slack
          </span>
          <span className="flex-1">Ответить клиенту по SSO — до 12:00</span>
        </li>
      </ul>
    </div>

    {/* На этой неделе */}
    <div>
      <p className="text-[11px] uppercase tracking-widest font-semibold text-amber-500 dark:text-amber-400 mb-1.5">
        📅 На этой неделе
      </p>
      <ul className="space-y-1.5">
        <li className="flex items-start gap-2">
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
            Jira
          </span>
          <span className="flex-1">Спринт-планирование Q4 — 03.10, 11:00</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
            TrueConf
          </span>
          <span className="flex-1">Созвон с продажами — 03.10, 15:00</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300 font-medium">
            Slack
          </span>
          <span className="flex-1">Согласовать бюджет на ноябрь — 04.10, до 17:00</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
            Jira
          </span>
          <span className="flex-1">Закрыть 3 задачи из Sprint 24 — 04.10</span>
        </li>
      </ul>
    </div>

    {/* Следующая неделя */}
    <div>
      <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
        🎯 На следующей неделе
      </p>
      <ul className="space-y-1.5">
        <li className="flex items-start gap-2">
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
            Jira
          </span>
          <span className="flex-1">Ретроспектива спринта — 08.10, 16:00</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
            TrueConf
          </span>
          <span className="flex-1">Демо для партнёров — 09.10, 14:00</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300 font-medium">
            Slack
          </span>
          <span className="flex-1">Квартальный отчёт — 10.10</span>
        </li>
      </ul>
    </div>

    {/* План по графику */}
    <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 p-3 ring-1 ring-blue-100 dark:ring-blue-900/60">
      <p className="text-[11px] uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400 mb-2">
        ⚡ План по вашему графику · Пн–Пт 09:00–18:00
      </p>
      <div className="space-y-2 text-[12px] leading-snug">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Чт, 03.10</p>
          <p className="text-gray-600 dark:text-gray-300">
            09:00–10:30 — Ревью PR #482 (🔥) · 11:00–12:00 — Планирование Q4 · 15:00–16:00 — Созвон с продажами
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Пт, 04.10</p>
          <p className="text-gray-600 dark:text-gray-300">
            09:00–10:00 — Ответить клиенту · 10:00–12:00 — Задачи Sprint 24 · 14:00–15:30 — Бюджет на ноябрь
          </p>
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Пн, 07.10</p>
          <p className="text-gray-600 dark:text-gray-300">
            10:00–11:00 — Разбор входящих · 14:00–15:00 — Подготовка к демо
          </p>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
        Добавила буферы 15 мин до и после каждого созвона. Обед 13:00–14:00 не тронут.
      </p>
    </div>

    {/* CTA */}
    <div className="pt-1 flex flex-wrap gap-1.5">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-sm transition-all hover:-translate-y-0.5"
      >
        <Check size={12} aria-hidden="true" />
        Внести в календарь
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all hover:-translate-y-0.5"
      >
        Изменить
      </button>
      <button
        type="button"
        className="inline-flex items-center text-xs font-medium px-3 py-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        Отмена
      </button>
    </div>
  </div>
);

const UserCaseGTD: React.FC = () => (
  <section id="usecase-gtd" className="relative py-20 md:py-28 overflow-hidden">
    <div className="max-w-6xl mx-auto px-4 md:px-6">
      {/* Заголовок */}
      <div className="max-w-2xl mb-12 md:mb-16">
        <Badge className="text-eyebrow mb-3">Систематизация по GTD</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Одна фраза — и всё разложено по полочкам
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Jira, TrueConf, Slack — Dayla соберёт задачи из всех источников,
          расставит дедлайны и впишет их в ваш календарь.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] gap-12 lg:gap-16 items-center">
        {/* Левая колонка: визуализация потока */}
        <div className="relative flex justify-center">
          <GTDAggregation />
        </div>

        {/* Правая колонка: чат с Dayla */}
        <div className="relative">
          <DaylaChatCard
            userMessage="Систематизируй задачи по Getting Things Done, которые мне прислали на этой неделе из Jira, TrueConf и Slack, в мой Гугл календарь"
            daylaMessage={GTD_RESPONSE}
          />
        </div>
      </div>

      {/* Подпись */}
      <div className="mt-12 md:mt-16 max-w-2xl mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
          Вы утверждаете план одним нажатием — Dayla сама внесёт всё в календарь
        </p>
      </div>
    </div>
  </section>
);

// ─────────────────────────────────────────────────────────────
// IPhoneScene — единый канвас, в котором лежат:
//   • PNG-рендер iPhone
//   • UI-чат на экране (через matrix3d)
//   • билет поверх
//   • контекстное меню поверх
//
// Все координаты — в % от PNG (IMG_W × IMG_H).
// Сцена целиком масштабируется через transform: scale().
// ─────────────────────────────────────────────────────────────

// ⚠️ ПОДСТАВЬ РЕАЛЬНЫЕ РАЗМЕРЫ СВОЕГО PNG (в пикселях)
const IMG_W = 396;
const IMG_H = 773;

// ⚠️ Логический размер UI на экране — пропорции экрана iPhone.
// 400×866 — для iPhone 14/15 (9:19.5). Подстрой под свой макет.
const UI_W = 400;
const UI_H = 866;

// ⚠️ Углы экрана iPhone на PNG, в % от (IMG_W, IMG_H).
// Порядок TL → TR → BR → BL (по часовой стрелке).
const IPHONE_SCREEN_CORNERS: [Point, Point, Point, Point] = [
  [37, -0.3],   // TL
  [98, 17.3],   // TR
  [97, 98],   // BR
  [7, 96],   // BL
];

const IPhoneScene: React.FC = () => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.4);

  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / IMG_W);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const matrix = React.useMemo(() => {
    const dst = IPHONE_SCREEN_CORNERS.map(([px, py]) => [
      (px / 100) * IMG_W,
      (py / 100) * IMG_H,
    ]) as [Point, Point, Point, Point];

    return getPerspectiveMatrix(
      [
        [0, 0],
        [UI_W, 0],
        [UI_W, UI_H],
        [0, UI_H],
      ],
      dst
    );
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: IMG_H * scale }}
    >
      {/* Единый канвас. Все координаты внутри — в пикселях PNG. */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
            width: IMG_W,
            height: IMG_H,
            transform: `scale(${scale})`,
            WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.25) 65%, transparent 78%, transparent 100%)",
            maskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.25) 65%, transparent 78%, transparent 100%)",
        }}
      >
        {/* 1. Рендер iPhone */}
        <img
          src="/images/iPhone.png"
          alt="iPhone"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          draggable={false}
        />

        {/* 2. ОДИН трансформированный слой: чат + билет + меню.
            Всё внутри получает одинаковое искажение через matrix3d. */}
        <div
          className="absolute top-0 left-0 overflow-hidden pointer-events-none select-none"
          style={{
            width: UI_W,
            height: UI_H,
            transformOrigin: "0 0",
            transform: matrix,
            borderRadius: 50,
          }}
        >
          {/* ── 2.1. UI чата (фон экрана) ──────────────── */}
          <div className="absolute inset-0 flex flex-col bg-white dark:bg-gray-950">
            {/* Шапка */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                АС
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">
                  Андрей Смирнов
                </p>
                <p className="text-[20px] text-emerald-500">онлайн</p>
              </div>
            </div>

            {/* Лента */}
            <div className="flex-1 p-3 space-y-2">
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5">
                  <p className="text-[25px] text-gray-800 dark:text-gray-200">
                    Привет! Не забудь про рейс ✈️
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2.2. Билет ─────────────────────────────── */}
          <img
            src="/images/airplaneTicketWB-mes.png"
            alt="Сообщение с авиабилетом"
            className="
              absolute left-[3%] top-[27%] z-20
              w-[84%] h-auto
              rounded-2xl shadow-lg
              pointer-events-none select-none
            "
            loading="lazy"
          />

          {/* ── 2.3. Меню «Переслать» ──────────────────── */}
          <div
            className="
              absolute left-[3%] top-[48%] z-30
              w-[53%]
              pointer-events-none select-none
            "
          >
            <ChatContextMenu />
          </div>
        </div>
      </div>
    </div>
  );
};
// ─── Карточка чата с Dayla (переиспользуется в двух секциях) ───

interface DaylaChatCardProps {
  /** Префикс над сообщением пользователя, например «Переслано от Андрея Смирнова» */
  forwardedFrom?: string;
  /** Текст самого сообщения пользователя */
  userMessage?: string;
  /** Ответ Dayla */
  daylaMessage: React.ReactNode;
}

const DaylaChatCard: React.FC<DaylaChatCardProps> = ({
  forwardedFrom,
  userMessage,
  daylaMessage,
}) => (
  <Card className="relative overflow-hidden p-0 shadow-2xl">
    <div
      aria-hidden="true"
      className="
        absolute -top-24 -right-24 w-64 h-64 rounded-full
        bg-gradient-to-br from-blue-400/20 to-purple-500/20
        blur-3xl pointer-events-none
      "
    />

    {/* Шапка */}
    <div className="relative flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div
        aria-hidden="true"
        className="w-9 h-9 rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
      >
        <Sparkles size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-900 dark:text-white">Dayla</p>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Онлайн
        </p>
      </div>
    </div>

    {/* Сообщения */}
    <div className="relative p-4 space-y-4 bg-gradient-to-b from-gray-50/60 to-white dark:from-gray-900/40 dark:to-gray-950">
      {/* Сообщение пользователя — рендерится только если есть хотя бы одно поле */}
        {(forwardedFrom || userMessage) && (
        <div className="flex justify-end">
            <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2.5 shadow-sm">
            {forwardedFrom && (
                <p className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
                {forwardedFrom}
                </p>
            )}
            {userMessage && (
                <p className="text-sm leading-snug">{userMessage}</p>
            )}
            </div>
        </div>
        )}

      {/* Ответ Dayla */}
      <div className="flex items-end gap-2">
        <div
          aria-hidden="true"
          className="w-7 h-7 rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
        >
          <Sparkles size={13} />
        </div>

        <div className="max-w-[86%] min-w-0">
          <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-900 dark:text-white leading-snug">
              {daylaMessage}
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Поле ввода */}
    <div className="relative px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60">
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Send size={14} aria-hidden="true" />
        <span>Сообщение Dayla…</span>
      </div>
    </div>
  </Card>
);
// ---------- UserCase: авиабилет из мессенджера ----------




const UserCase: React.FC = () => (
  <section id="usecase" className="relative py-20 md:py-28 overflow-hidden">
    <div className="max-w-5xl mx-auto px-4 md:px-6">
      {/* ─── Заголовок секции ─────────────────────────────── */}
      <div className="max-w-2xl mb-12 md:mb-16">
        <Badge className="text-eyebrow mb-3">Реальный сценарий</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Пересылайте события — Dayla всё спланирует
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Не нужно вручную копировать дату, время и место. Отправьте сообщение
          боту — Dayla разберётся сама.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* ═══════════ ЛЕВАЯ ЧАСТЬ: iPhone ═══════════ */}
        <div className="relative flex justify-center">
        <div className="relative w-full max-w-[400px]">
            <IPhoneScene />
        </div>
        </div>

        {/* ═══════════ ПРАВАЯ ЧАСТЬ: чат ═══════════ */}
        <div className="relative">
            <DaylaChatCard
                forwardedFrom="Переслано от Андрея Смирнова"
                userMessage="Авиабилет PD-205 · VKO → LED"
                daylaMessage={
                <>
                    Распознала авиабилет:{' '}
                    <strong className="font-semibold">дата — 05 апреля, 21:55</strong>,{' '}
                    <strong className="font-semibold">место посадки — Внуково, терминал A</strong>.
                    Куда добавить событие?
                </>
                }
            />
            </div>
      </div>

      {/* ─── Подпись под сценой ───────────────────────────── */}
      <div className="mt-12 md:mt-16 max-w-2xl mx-auto text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
          <Sparkles size={14} className="text-blue-500" aria-hidden="true" />
          Dayla ничего не меняет без подтверждения — вы решаете, что делать с&nbsp;событием
        </p>
      </div>
    </div>
  </section>
);

// ─── Mockup Excel-таблицы (финансовый отчёт) ───

const ExcelPreview: React.FC = () => (
  <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md">
    {/* Шапка файла */}
    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/60">
      <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
        X
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">
          Финансовый_отчёт_Q4.xlsx
        </p>
        <p className="text-[9px] text-gray-500 dark:text-gray-400">
          Excel · 24 КБ
        </p>
      </div>
    </div>

    {/* Таблица */}
    <div className="p-2.5">
      <table className="w-full text-[15px] leading-tight">
        <thead>
          <tr className="text-left text-gray-500 dark:text-gray-400">
            <th className="pb-1 font-medium">Статья</th>
            <th className="pb-1 text-right font-medium">План</th>
            <th className="pb-1 text-right font-medium">Факт</th>
            <th className="pb-1 text-right font-medium">Δ</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-gray-200">
          <tr>
            <td className="py-0.5">Выручка</td>
            <td className="py-0.5 text-right tabular-nums">2 400</td>
            <td className="py-0.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">2 580</td>
            <td className="py-0.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">+7,5%</td>
          </tr>
          <tr>
            <td className="py-0.5">Себестоимость</td>
            <td className="py-0.5 text-right tabular-nums">1 100</td>
            <td className="py-0.5 text-right tabular-nums text-red-500 dark:text-red-400">1 240</td>
            <td className="py-0.5 text-right tabular-nums text-red-500 dark:text-red-400">+12,7%</td>
          </tr>
          <tr className="border-t border-gray-100 dark:border-gray-800">
            <td className="py-1 font-medium">Маржа</td>
            <td className="py-1 text-right tabular-nums font-medium">1 300</td>
            <td className="py-1 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">1 340</td>
            <td className="py-1 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">+3,1%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);


// ─────────────────────────────────────────────────────────────
// MonitorScene — единый канвас для PNG монитора.
// Внутри — чат с сообщением «Не забудь подать», preview Excel
// и меню «Переслать». Всё трансформируется через matrix3d, как у iPhone.
// ─────────────────────────────────────────────────────────────

// ⚠️ ПОДСТАВЬ РЕАЛЬНЫЕ РАЗМЕРЫ Monitor.png (в пикселях)
const MON_IMG_W = 1144;
const MON_IMG_H = 938;

// Логический размер UI на экране монитора.
const MON_UI_W = 800;
const MON_UI_H = 400;

// ⚠️ Углы экрана монитора на PNG — в % от (MON_IMG_W, MON_IMG_H).
// Порядок TL → TR → BR → BL (по часовой).
const MONITOR_SCREEN_CORNERS: [Point, Point, Point, Point] = [
  [1, 1.7],     // TL
  [99, 3],     // TR
  [94, 74],    // BR
  [7.2, 60],    // BL
];

const MonitorScene: React.FC = () => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.5);

  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / MON_IMG_W);
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const matrix = React.useMemo(() => {
    const dst = MONITOR_SCREEN_CORNERS.map(([px, py]) => [
      (px / 100) * MON_IMG_W,
      (py / 100) * MON_IMG_H,
    ]) as [Point, Point, Point, Point];

    return getPerspectiveMatrix(
      [
        [0, 0],
        [MON_UI_W, 0],
        [MON_UI_W, MON_UI_H],
        [0, MON_UI_H],
      ],
      dst
    );
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: MON_IMG_H * scale }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: MON_IMG_W,
          height: MON_IMG_H,
          transform: `scale(${scale})`,
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0.25) 70%, transparent 87%, transparent 100%)",
            maskImage:
            "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0.25) 70%, transparent 87%, transparent 100%)",
        }}
      >
        {/* 1. PNG монитора */}
        <img
          src="/images/Monitor.png"
          alt="Монитор с финансовым отчётом"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          draggable={false}
        />

        {/* 2. UI на экране монитора */}
        <div
          className="absolute top-0 left-0 overflow-hidden pointer-events-none select-none"
          style={{
            width: MON_UI_W,
            height: MON_UI_H,
            transformOrigin: "0 0",
            transform: matrix,
            borderRadius: 16,
          }}
        >
          <div className="absolute inset-0 flex flex-col bg-white dark:bg-gray-950">
            {/* Шапка чата с Сергеем */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                СН
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[20px] font-medium text-gray-900 dark:text-white truncate">
                  Сергей Ненашев
                </p>
                <p className="text-[16px] text-emerald-500">онлайн</p>
              </div>
            </div>

            {/* Лента */}
            <div className="flex-1 p-5 space-y-3 overflow-hidden">

              {/* ─── System-pill: Dayla в диалоге ─────────── */}
              <div className="flex justify-center">
                <div
                  className="
                    px-3 py-1 rounded-full
                    bg-blue-50 dark:bg-blue-950/50
                    ring-1 ring-blue-100 dark:ring-blue-900/60
                    text-blue-700 dark:text-blue-300
                    text-[14px] font-medium
                    flex items-center gap-1.5
                  "
                >
                  <Sparkles size={13} aria-hidden="true" />
                  В этом диалоге сидит Dayla
                </div>
              </div>

              {/* ─── Сообщение Сергея + Excel ─────────────── */}
              <div className="flex justify-start">
                <div className="max-w-[60%] space-y-2.5">
                  <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-3.5 py-2">
                    <p className="text-[20px] text-gray-800 dark:text-gray-200">
                      Не забудьте подать отчётность к концу квартала
                    </p>
                  </div>

                  <ExcelPreview />
                </div>
              </div>

              {/* ─── Ответ Dayla ──────────────────────────── */}
              <div className="flex items-end gap-2">
                <div
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm"
                >
                  <Sparkles size={14} />
                </div>
                <div className="max-w-[70%] min-w-0">
                  <div className="rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-800 px-3.5 py-2">
                    <p className="text-[18px] text-gray-900 dark:text-white leading-snug">
                      Зафиксировала задачу <strong className="font-semibold">«Подать фин отчёт»</strong> на 30.09.2027 (конец квартала). Собираю ваши документы к концу отчётного периода.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserCaseFinance: React.FC = () => (
  <section
    id="usecase-finance"
    className="relative py-20 md:py-28 overflow-hidden"
  >
    <div className="max-w-5xl mx-auto px-4 md:px-6">
      {/* Заголовок */}
      <div className="max-w-2xl mb-12 md:mb-16">
        <Badge className="text-eyebrow mb-3">Из рабочего чата — в план</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Прислали файл? Dayla превратит его в задачу
        </h2>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Добавьте Dayla в чат.
          Она распознает, что к чему и когда это надо сдать.
        </p>
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-12 lg:gap-20 items-center">
        {/* Левая колонка: монитор */}
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-[2000px]">
            <MonitorScene />
          </div>
        </div>

        {/* Правая колонка: чат Dayla */}
        <div className="relative">
        <DaylaChatCard
            daylaMessage={
            <>
                Подтянула Финансовый_отчёт_Q4.xlsx
                Зафиксировала задачу{' '}
                <strong className="font-semibold">«Подать фин отчёт»</strong>{' '}
                на 30.09.2027 (конец квартала). Собираю ваши документы к концу
                отчётного периода.
            </>
            }
        />
        </div>
      </div>
    </div>
  </section>
);

// ─── Дизайн-канвас сцены ─────────────────────────────────────
// Все три элемента (маскот, календарь, речь) раскладываются внутри
// этого канваса в пикселях. На рендере канвас масштабируется целиком
// через transform: scale(), поэтому ничего не «разъезжается»
// и не скейлится по-разному.
const HERO_SCENE_W = 790;
const HERO_SCENE_H = 600;

const HeroScene: React.FC = () => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.5);

  // Синхронный замер ширины до первой отрисовки — чтобы не было «прыжка».
  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / HERO_SCENE_W);
    };

    update();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: HERO_SCENE_H * scale }}
      aria-label="Календарь и голосовой ассистент Dayla"
      role="img"
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: HERO_SCENE_W,
          height: HERO_SCENE_H,
          transform: `scale(${scale})`,
        }}
      >
        {/* ── Маскот: слева, затухает к низу туловища ──────── */}
        <div
        className="absolute z-0"
        style={{
            left: -80,
            top: -170,
            width: 825,
            height: 1000,
            WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.35) 72%, transparent 92%)",
            maskImage:
            "linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.35) 72%, transparent 92%)",
        }}
        >
        <img
            src="/images/MaskotWB.png"
            alt="Ассистент Dayla говорит по телефону"
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
            loading="lazy"
        />
        </div>

        {/* ── Календарь: справа, поверх маскота ────────────── */}
        <div
          className="absolute z-10"
          style={{ left: 250, top: 320, width: 500 }}
        >
          <HeroMockup />
        </div>

        {/* ── Речь: справа от маскота, на уровне рта ───────── */}
        <div
          className="absolute z-20"
          style={{ left: 441, top: 155, width: 595 }}
        >
          <SpeechBubble />
        </div>
      </div>
    </div>
  );
};

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
          Скажите о своих планах — Dayla найдёт время в календаре, расставит
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
            «Dayla, тренировка отменилась»
          </p>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Dayla подберёт альтернативу под ваши цели.
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
  { icon: Mic, title: "Говорите как человеку", text: "Опишите задачу текстом или голосом — Dayla сам разберётся, куда её поставить." },
  { icon: Send, title: "Telegram-бот", text: "Перешлите сообщение в бот — задача появится в календаре." },
  { icon: Calendar, title: "Умные рекомендации", text: "Dayla находит свободные окна и подсказывает, что в них можно сделать." },
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
                Dayla собирает его в&nbsp;одну картину.
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