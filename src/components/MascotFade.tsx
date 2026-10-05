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
  /**
   * Убирает белый фон PNG на светлых подложках через multiply.
   * В тёмной теме автоматически отключается.
   */
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
  blend = true,
  glow = true,
}) => {
  /**
   * Многоточечная маска с easing.
   * alpha(t) = (1 + cos(π·t)) / 2   →  1 на старте, 0 в конце.
   * 8 стопов вместо 3 — интерполяция почти невидима глазом.
   */
  const maskImage = React.useMemo(() => {
    const s = Math.max(0, Math.min(100, fadeStart));
    const e = Math.min(100, s + fadeLength);
    const range = e - s;

    const stops: string[] = [`black 0%`, `black ${s.toFixed(1)}%`];
    const STEPS = 8;

    for (let i = 1; i <= STEPS; i++) {
      const t = i / STEPS;
      const alpha = (1 + Math.cos(Math.PI * t)) / 2; // 1 → 0, ease-in-out
      const pos = s + range * t;
      stops.push(`rgba(0,0,0,${alpha.toFixed(3)}) ${pos.toFixed(1)}%`);
    }
    return `linear-gradient(to bottom, ${stops.join(", ")})`;
  }, [fadeStart, fadeLength]);

  return (
    <div className={cn("relative", wrapperClassName)}>
      {/* Мягкое свечение под маскотом — сливает его с фоном */}
      {glow && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[8%] bottom-[10%] h-[50%] rounded-full bg-sky-300/25 dark:bg-sky-500/15 blur-3xl"
        />
      )}

      <div
        className={cn(
          "relative",
          // multiply убирает белый фон PNG на светлых подложках,
          // в тёмной теме отключаем — там он даст грязь
          blend && "mix-blend-multiply dark:mix-blend-normal",
          className
        )}
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
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