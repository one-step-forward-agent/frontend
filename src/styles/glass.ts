// src/styles/glass.ts
export type GlassPreset = {
  surface: string;
  specular: string;
};

export const glass: Record<"subtle" | "medium" | "strong", GlassPreset> = {
  subtle: {
    surface:
      "bg-white/35 dark:bg-white/[0.04]"+          // тело: прозрачнее, фон просвечивает
      "backdrop-blur-xl"+                          // 24px — фон плавится, а не исчезает
      "ring-1 ring-white/50 dark:ring-white/10"+   // тонкая светлая грань
      "shadow-[0_8px_32px_rgba(15,23,42,0.08)," +  // внешняя мягкая тень — отрыв от фона
        "inset_0_1px_0_rgba(255,255,255,0.8)," +  // верхний блик — «мокрая» кромка
        "inset_0_-1px_0_rgba(255,255,255,0.2)]",  // нижний блик чуть слабее — объём
    specular:
      "pointer-events-none absolute inset-x-3 top-0.5 h-1/4 rounded-full " +
      "bg-gradient-to-b from-white/50 to-transparent opacity-50 blur-[1px]",
  },
  medium: {
    surface:
      "bg-white/55 dark:bg-gray-900/40 " +
      "backdrop-blur-2xl " +
      "ring-1 ring-white/60 dark:ring-white/10 " +
      "shadow-[0_8px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.75)] " +
      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
    specular:
      "pointer-events-none absolute inset-x-4 top-0.5 h-1/3 rounded-full " +
      "bg-gradient-to-b from-white/60 to-transparent opacity-60 blur-[1px]",
  },
  strong: {
    surface:
      "bg-white/40 dark:bg-gray-900/25 " +
      "backdrop-blur-3xl " +
      "ring-1 ring-white/70 dark:ring-white/15 " +
      "shadow-[0_12px_40px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.85)] " +
      "dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]",
    specular:
      "pointer-events-none absolute inset-x-4 top-1 h-1/3 rounded-full " +
      "bg-gradient-to-b from-white/70 to-transparent opacity-70 blur-[1px]",
  },
};