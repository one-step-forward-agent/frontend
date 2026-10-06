// src/components/MascotFade.tsx
import * as React from "react";
import { cn } from "@/utils/cn";

interface MascotFadeProps {
  src?: string;
  alt?: string;
  className?: string;
  wrapperClassName?: string;
  /** Верхняя граница затухания в % — до неё маскот полностью виден */
  fadeStart?: number;
  /** Длина зоны затухания в % */
  fadeLength?: number;
  /** Затухание слева в % — где начинается прозрачность от левого края */
  fadeLeft?: number;
  /** Затухание справа в % — где начинается прозрачность от правого края */
  fadeRight?: number;
  /** Убирает белый фон PNG на светлых подложках через multiply */
  blend?: boolean;
  /** Мягкое свечение под маскотом */
  glow?: boolean;
}

export const MascotFade: React.FC<MascotFadeProps> = ({
  src = "/images/MaskotWB.png",
  alt = "Ассистент Dayla",
  className,
  wrapperClassName,
  fadeStart = 42,
  fadeLength = 58,
  fadeLeft,
  fadeRight,
  blend = true,
  glow = true,
}) => {
  /** Все слои маски собираются в один CSS-list */
  const { maskImage, maskComposite } = React.useMemo(() => {
    const layers: string[] = [];

    // ─── Вертикальный слой (низ) ────────────────────────
    const s = Math.max(0, Math.min(100, fadeStart));
    const e = Math.min(100, s + fadeLength);
    const range = e - s;

    const vStops: string[] = [`black 0%`, `black ${s.toFixed(1)}%`];
    const STEPS = 8;
    for (let i = 1; i <= STEPS; i++) {
      const t = i / STEPS;
      const alpha = (1 + Math.cos(Math.PI * t)) / 2;
      const pos = s + range * t;
      vStops.push(`rgba(0,0,0,${alpha.toFixed(3)}) ${pos.toFixed(1)}%`);
    }
    layers.push(`linear-gradient(to bottom, ${vStops.join(", ")})`);

    // ─── Горизонтальный слой справа ─────────────────────
    if (fadeRight !== undefined) {
      const start = Math.max(0, Math.min(100, fadeRight));
      const rangeR = 100 - start;
      const rStops: string[] = [`black 0%`, `black ${start.toFixed(1)}%`];
      for (let i = 1; i <= STEPS; i++) {
        const t = i / STEPS;
        const alpha = (1 + Math.cos(Math.PI * t)) / 2;
        rStops.push(`rgba(0,0,0,${alpha.toFixed(3)}) ${(start + rangeR * t).toFixed(1)}%`);
      }
      layers.push(`linear-gradient(to right, ${rStops.join(", ")})`);
    }

    // ─── Горизонтальный слой слева ──────────────────────
    if (fadeLeft !== undefined) {
      const start = Math.max(0, Math.min(100, fadeLeft));
      const rangeL = 100 - start;
      const lStops: string[] = [`black 0%`, `black ${start.toFixed(1)}%`];
      for (let i = 1; i <= STEPS; i++) {
        const t = i / STEPS;
        const alpha = (1 + Math.cos(Math.PI * t)) / 2;
        lStops.push(`rgba(0,0,0,${alpha.toFixed(3)}) ${(start + rangeL * t).toFixed(1)}%`);
      }
      layers.push(`linear-gradient(to left, ${lStops.join(", ")})`);
    }

    return {
      maskImage: layers.join(", "),
      // Один слой → intersect не нужен, но с несколькими — обязателен
      maskComposite: layers.length > 1 ? "intersect" : "source-over",
    };
  }, [fadeStart, fadeLength, fadeLeft, fadeRight]);

  return (
    <div className={cn("relative", wrapperClassName)}>
      {glow && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[8%] bottom-[10%] h-[50%] rounded-full bg-sky-300/25 dark:bg-sky-500/15 blur-3xl"
        />
      )}

      <div
        className={cn(
          "relative",
          blend && "mix-blend-multiply dark:mix-blend-normal",
          className
        )}
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          maskComposite,
          WebkitMaskComposite:
            maskComposite === "intersect"
              ? "source-in" // Safari-префикс для intersect
              : "source-over",
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-auto select-none pointer-events-none"
          draggable={false}
          loading="lazy"
        />
      </div>
    </div>
  );
};