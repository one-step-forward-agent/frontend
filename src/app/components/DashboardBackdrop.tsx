// src/components/DashboardBackdrop.tsx
import * as React from "react";

/**
 * Фон для дашборда: градиент + брендовые блобы + шум.
 * Слой absolute, под всем контентом. Не мешает кликам (pointer-events-none).
 */
export const DashboardBackdrop: React.FC = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
  >
    {/* ─── 1. Базовый градиент ─── */}
    <div
      className="absolute inset-0
                 bg-gradient-to-b
                 from-slate-50 via-white to-slate-100
                 dark:from-gray-950 dark:via-gray-950 dark:to-slate-950"
    />

    {/* ─── 2. Брендовые блобы ─── */}
    <div
      className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full
                 bg-sky-400/10 dark:bg-sky-500/[0.07]
                 blur-[120px]
                 animate-[blob-drift-1_28s_ease-in-out_infinite]"
    />
    <div
      className="absolute -top-20 right-[-10rem] w-[36rem] h-[36rem] rounded-full
                 bg-violet-400/10 dark:bg-violet-500/[0.07]
                 blur-[120px]
                 animate-[blob-drift-2_32s_ease-in-out_infinite]"
    />
    <div
      className="absolute bottom-[-12rem] left-1/3 w-[42rem] h-[42rem] rounded-full
                 bg-blue-400/[0.08] dark:bg-blue-500/[0.06]
                 blur-[130px]
                 animate-[blob-drift-3_36s_ease-in-out_infinite]"
    />

    {/* ─── 3. Шум (grain) ─── */}
    <div
      className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] mix-blend-overlay"
      style={{
        backgroundImage:
          `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
        backgroundRepeat: "repeat",
      }}
    />

    {/* ─── 4. Тонкая сетка — опционально, поверх шума ─── */}
    <div
      className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
      style={{
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        color: "#000",
        maskImage:
          "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)",
      }}
    />

    {/* ─── 5. Keyframes ─── */}
    <style>{`
      @keyframes blob-drift-1 {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50%      { transform: translate3d(4%, 6%, 0) scale(1.08); }
      }
      @keyframes blob-drift-2 {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50%      { transform: translate3d(-5%, 3%, 0) scale(1.06); }
      }
      @keyframes blob-drift-3 {
        0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
        50%      { transform: translate3d(3%, -4%, 0) scale(1.1); }
      }
      @media (prefers-reduced-motion: reduce) {
        [class*="animate-[blob-drift"] { animation: none !important; }
      }
    `}</style>
  </div>
);