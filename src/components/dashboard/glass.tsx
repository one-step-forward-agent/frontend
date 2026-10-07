// src/components/dashboard/glass.tsx
import * as React from "react";
import { cn } from "@/utils/cn";

/* ─── Liquid Glass — базовые константы ──────────────────── */

export const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-3xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

export const GLASS_BODY_FLAT =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-3xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]";

export const GLASS_SHEEN =
  "pointer-events-none absolute inset-0 rounded-2xl " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

export const GLASS_SHEEN_PILL =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

export const GLASS_ACTIVE_RING =
  "0 0 0 1.5px rgba(56,189,248,0.6), 0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)";

/* ─── Компактные стили для форм ─────────────────────────── */

export const COMPACT_FIELD = cn(
  "[&_input]:h-9 [&_input]:px-3 [&_input]:text-sm [&_input]:rounded-lg",
  "[&_select]:h-9 [&_select]:px-3 [&_select]:text-sm [&_select]:rounded-lg",
  "[&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:rounded-lg",
  "[&_input[type='time']]:w-[7.5rem]",
  "[&_input[type='date']]:w-[9rem]",
  "[&_input[type='number']]:w-[6rem]",
  "[&_.field-label]:text-[11px] [&_.field-label]:mb-1",
  "[&_.field-hint]:text-[11px] [&_.field-hint]:mt-1",
  "[&_.form-row]:gap-2",
  "[&_.form-actions]:gap-2 [&_.form-actions]:mt-3"
);

export const COMPACT_CHIPS = cn(
  "[&_.chip-toggle]:h-7 [&_.chip-toggle]:px-2.5 [&_.chip-toggle]:text-xs [&_.chip-toggle]:rounded-lg"
);

export const COMPACT_INLINE_FORM = cn(
  "[&_input]:h-8 [&_input]:px-2.5 [&_input]:text-sm [&_input]:rounded-lg",
  "gap-2"
);

export const COMPACT_SELECT = cn(
  "w-full h-9 appearance-none px-3 rounded-lg",
  "text-sm text-gray-900 dark:text-white",
  "bg-white/[0.04] dark:bg-white/[0.02]",
  "ring-1 ring-white/20 dark:ring-white/10",
  "outline-none focus:outline-none",
  "focus:bg-white/[0.06] dark:focus:bg-white/[0.03]"
);

/* ─── GlassSurface ──────────────────────────────────────── */

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  sheen?: boolean;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  className,
  sheen = true,
  ...rest
}) => (
  <div
    className={cn("relative overflow-hidden rounded-2xl", GLASS_BODY, className)}
    {...rest}
  >
    {sheen && <span aria-hidden="true" className={GLASS_SHEEN} />}
    <div className="relative">{children}</div>
  </div>
);

/* ─── GlassCard ─────────────────────────────────────────── */

interface GlassCardProps {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  title,
  actions,
  children,
  className,
}) => (
  <div className={cn("relative overflow-hidden rounded-2xl", GLASS_BODY, className)}>
    <div className="relative p-4 sm:p-5">
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h3 className="font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  </div>
);

/* ─── GlassPill ─────────────────────────────────────────── */

interface GlassPillProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

export const GlassPill: React.FC<GlassPillProps> = ({
  children,
  className,
  active,
}) => (
  <span
    className={cn(
      "relative inline-flex items-center gap-1.5 overflow-hidden",
      "px-3 py-1 rounded-full text-xs font-medium",
      GLASS_BODY,
      "text-gray-700 dark:text-gray-300",
      className
    )}
    style={active ? { boxShadow: GLASS_ACTIVE_RING } : undefined}
  >
    <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
    <span className="relative inline-flex items-center gap-1.5">{children}</span>
  </span>
);

/* ─── GlassIconBox ──────────────────────────────────────── */

type GlassIconShape = "square" | "circle";

interface GlassIconBoxProps {
  children: React.ReactNode;
  shape?: GlassIconShape;
  size?: number;
  className?: string;
  tint?: string;
}

export const GlassIconBox: React.FC<GlassIconBoxProps> = ({
  children,
  shape = "square",
  size = 36,
  className,
  tint = "text-sky-600 dark:text-sky-300",
}) => (
  <span
    className={cn(
      "relative shrink-0 flex items-center justify-center overflow-hidden",
      shape === "circle" ? "rounded-full" : "rounded-xl",
      GLASS_BODY,
      tint,
      className
    )}
    style={{ width: size, height: size }}
  >
    {shape === "circle" && (
      <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
    )}
    {shape === "square" && (
      <span aria-hidden="true" className={GLASS_SHEEN} />
    )}
    <span className="relative inline-flex items-center justify-center">
      {children}
    </span>
  </span>
);

/* ─── GlassNavItem ──────────────────────────────────────── */

interface GlassNavItemProps {
  children: React.ReactNode;
  active?: boolean;
  href?: string;
  onClick?: (event: React.MouseEvent) => void;
  className?: string;
}

export const GlassNavItem: React.FC<GlassNavItemProps> = ({
  children,
  active,
  href,
  onClick,
  className,
}) => {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      {...(href ? { href, onClick } : { type: "button" as const, onClick })}
      aria-current={active ? "true" : undefined}
      className={cn(
        "group relative flex items-center gap-2",
        "px-3.5 py-2.5 rounded-xl text-sm font-medium",
        "transition-colors duration-200",
        "bg-transparent",
        "outline-none focus:outline-none",
        "focus-visible:bg-white/[0.06] dark:focus-visible:bg-white/[0.03]",
        "hover:bg-white/[0.04] dark:hover:bg-white/[0.02] hover:text-gray-800 dark:hover:text-gray-200",
        "text-gray-600 dark:text-gray-400",
        className
      )}
    >
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </Tag>
  );
};

export const GLASS_ERROR =
  "bg-red-500/[0.08] dark:bg-red-500/[0.05] backdrop-blur-3xl " +
  "ring-1 ring-red-400/40 dark:ring-red-400/30 " +
  "shadow-[0_4px_24px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]";

export const GLASS_PRIMARY =
  "text-sky-800 dark:text-sky-100 " +
  "bg-sky-500/20 dark:bg-sky-400/15 backdrop-blur-3xl " +
  "ring-1 ring-sky-400/40 dark:ring-sky-400/30 " +
  "shadow-[0_4px_14px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] " +
  "dark:shadow-[0_4px_14px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]";

export const GLASS_CHIP =
  "relative inline-flex items-center gap-1.5 overflow-hidden " +
  "px-3 py-1.5 rounded-full text-xs font-medium " +
  GLASS_BODY +
  " text-gray-700 dark:text-gray-300 " +
  "transition-transform duration-200 hover:-translate-y-0.5 " +
  "disabled:opacity-50 disabled:pointer-events-none";