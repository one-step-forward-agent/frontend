import * as React from "react";
import Markdown from "react-markdown";
import { ArrowRight } from "lucide-react";
import { cn } from "@/utils/cn";
import type { BlogBlock } from "@/types/blog";
import { tr } from "@/i18n";

export const BLOG_HEADING_GRADIENT =
  "bg-gradient-to-r from-purple-700 via-blue-600 to-emerald-600 bg-clip-text text-transparent";

export const BLOG_TAG_PILL =
  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] uppercase tracking-widest font-medium " +
  "bg-white/70 dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md " +
  "text-gray-700 dark:text-gray-200";

/* ───────── CTA-блок ───────── */

const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Иконка, летающая по Lissajous-траектории ВНУТРИ контейнера (boxW × boxH).
 * У каждой иконки — свой центр, амплитуда, частота и фазы → иконки
 * разлетаются по всей площади и не крутятся вокруг одной точки.
 */
const FloatingCtaIcon: React.FC<{
  src: string;
  seed: number;
  boxW: number;
  boxH: number;
}> = ({ src, seed, boxW, boxH }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || boxW <= 0 || boxH <= 0) return;

    const rnd = mulberry32(seed);

    // Центр иконки — от 20% до 80% ширины и от 25% до 75% высоты
    const cx = (0.20 + rnd() * 0.60) * boxW;
    const cy = (0.25 + rnd() * 0.50) * boxH;

    // Амплитуда — 4–10% ширины, 5–15% высоты (не выходит за края)
    const ax = (0.04 + rnd() * 0.06) * boxW;
    const ay = (0.05 + rnd() * 0.10) * boxH;

    const fx = 0.25 + rnd() * 0.55;
    const fy = 0.25 + rnd() * 0.55;
    const px = rnd() * Math.PI * 2;
    const py = rnd() * Math.PI * 2;
    const scaleBase = 0.75 + rnd() * 0.35;
    const opBase = 0.55 + rnd() * 0.45;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const x = cx + ax * Math.sin(t * fx + px);
      const y = cy + ay * Math.cos(t * fy + py);
      const s = scaleBase * (0.85 + 0.25 * Math.sin(t * 0.9 + px));
      const o = opBase * (0.70 + 0.30 * Math.sin(t * 1.1 + py));
      el.style.transform =
        `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) ` +
        `translate(-50%, -50%) scale(${s.toFixed(3)})`;
      el.style.opacity = o.toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seed, boxW, boxH]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-0 will-change-transform"
      style={{ transform: "translate(0,0)", opacity: 0 }}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_rgba(0,0,0,0.2)]">
        <img
          src={src}
          alt=""
          className="w-8 h-8 object-contain select-none pointer-events-none"
          loading="lazy"
          draggable={false}
        />
      </div>
    </div>
  );
};

export type CtaBgMode = "none" | "custom" | "gradient-blur" | "gradient-fade";

export const CtaBlockView: React.FC<{
  text: string;
  href: string;
  bgMode?: CtaBgMode;
  /** @deprecated — оставлено для старых постов; используйте bgMode */
  variant?: "button" | "finalcta-mobile";
  bgColor?: string;
  bgImage?: string;
  textColor?: string;
  buttonWidth?: number;
  buttonHeight?: number;
  icons?: string[];
}> = ({
  text,
  href,
  bgMode,
  variant,
  bgColor,
  bgImage,
  textColor,
  buttonWidth,
  buttonHeight,
  icons,
}) => {
  const mode: CtaBgMode =
    bgMode ??
    (variant === "finalcta-mobile" ? "gradient-fade" : "gradient-blur");

  const isExternal = /^https?:\/\//i.test(href);
  const list = React.useMemo(
    () => (Array.isArray(icons) ? icons.filter((s) => !!s && s.trim()) : []),
    [icons]
  );
  const hasIcons = list.length > 0;

  const boxRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState({ w: 0, h: 0 });

  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const sizeStyle: React.CSSProperties = {};
  if (typeof buttonWidth === "number" && buttonWidth > 0) sizeStyle.width = buttonWidth;
  if (typeof buttonHeight === "number" && buttonHeight > 0) sizeStyle.height = buttonHeight;

  // ── Кнопка ────────────────────────────────────────────
  let buttonEl: React.ReactNode;

  if (mode === "none") {
  // Liquid glass кнопка без фоновой карточки — стоит прямо на фоне страницы
  buttonEl = (
    <a
      href={href || "#"}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      className={cn(
        "group relative z-10 inline-flex items-center justify-center gap-2 px-8 h-14",
        "text-lg font-semibold rounded-full",
        "bg-white/15 dark:bg-white/[0.08] backdrop-blur-xl",
        "ring-1 ring-white/30 dark:ring-white/10",
        "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)]",
        "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]",
        "text-gray-900 dark:text-white",
        "transition-all duration-300",
        "hover:bg-white/25 dark:hover:bg-white/[0.15] hover:-translate-y-0.5 active:translate-y-0"
      )}
      style={{
        ...sizeStyle,
        ...(textColor ? { color: textColor } : {}),
      }}
    >
      <span>{text}</span>
      <ArrowRight
        size={18}
        className="transition-transform duration-300 group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </a>
  );
}
 else if (mode === "custom") {
    const trimmedImg = (bgImage ?? "").trim();
    const trimmedColor = (bgColor ?? "").trim();
    const style: React.CSSProperties = {
      ...sizeStyle,
      color: textColor || "#fff",
    };
    if (trimmedImg) style.background = `url(${trimmedImg}) center/cover no-repeat`;
    else style.background = trimmedColor || "#2563eb";

    buttonEl = (
      <a
        href={href || "#"}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        className="group relative z-10 inline-flex items-center justify-center gap-2 px-8 h-14 text-lg font-semibold rounded-full shadow-[0_8px_24px_-8px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
        style={style}
      >
        <span>{text}</span>
        <ArrowRight
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </a>
    );
  } else if (mode === "gradient-blur") {
    buttonEl = (
      <a
        href={href || "#"}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        className="group relative z-10 inline-flex items-center justify-center gap-2 px-8 h-14 text-lg font-semibold rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.6)] transition-all duration-300 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
        style={{
          ...sizeStyle,
          ...(textColor ? { color: textColor } : {}),
        }}
      >
        <span>{text}</span>
        <ArrowRight
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </a>
    );
  } else {
    // gradient-fade: стеклянная кнопка как в FinalCTA mobile
    buttonEl = (
      <a
        href={href || "#"}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        className="group relative z-10 inline-flex items-center justify-center gap-2 px-8 h-14 text-lg font-semibold text-gray-900 dark:text-white rounded-full bg-white/15 dark:bg-white/[0.08] backdrop-blur-xl ring-1 ring-white/30 dark:ring-white/10 shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] transition-all duration-300 hover:bg-white/25 dark:hover:bg-white/[0.15] hover:-translate-y-0.5 active:translate-y-0"
        style={{
          ...sizeStyle,
          ...(textColor ? { color: textColor } : {}),
        }}
      >
        <span>{text}</span>
        <ArrowRight
          size={20}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </a>
    );
  }

  // ── Чистая кнопка без карточки ────────────────────────
  // Режимы none и gradient-blur никогда не рисуют фон-подложку
  if (mode === "none" || mode === "gradient-blur") {
    if (!hasIcons) {
      return <div className="my-6 flex justify-center">{buttonEl}</div>;
    }
    return (
      <div className="my-8 relative overflow-hidden rounded-3xl">
        <div
          ref={boxRef}
          className="relative h-80 flex items-center justify-center p-6 md:p-10"
        >
          {box.w > 0 && box.h > 0 && (
            <div
              aria-hidden="true"
              className="absolute inset-0 overflow-hidden pointer-events-none"
            >
              {list.map((src, i) => (
                <FloatingCtaIcon
                  key={`${src}-${i}`}
                  src={src}
                  seed={i * 9301 + 49297 + src.length}
                  boxW={box.w}
                  boxH={box.h}
                />
              ))}
            </div>
          )}
          {buttonEl}
        </div>
      </div>
    );
  }

  // ── Карточка с фоном: custom и gradient-fade ─────────
  const cardBg: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  };

  if (mode === "gradient-fade") {
    cardBg.background =
      "linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)";
    cardBg.WebkitMaskImage =
      "radial-gradient(ellipse 88% 78% at center, black 22%, transparent 82%)";
    cardBg.maskImage =
      "radial-gradient(ellipse 88% 78% at center, black 22%, transparent 82%)";
  } else {
    // custom
    const trimmedImg = (bgImage ?? "").trim();
    const trimmedColor = (bgColor ?? "").trim();
    if (trimmedImg) {
      cardBg.background = `url(${trimmedImg}) center/cover no-repeat`;
      cardBg.opacity = 0.65;
    } else {
      cardBg.background = trimmedColor || "#2563eb";
      cardBg.opacity = 0.35;
    }
  }

  return (
    <div className="my-8 relative overflow-hidden rounded-3xl">
      <div aria-hidden="true" style={cardBg} />
      <div
        ref={boxRef}
        className="relative h-80 flex items-center justify-center p-6 md:p-10"
      >
        {hasIcons && box.w > 0 && box.h > 0 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none"
          >
            {list.map((src, i) => (
              <FloatingCtaIcon
                key={`${src}-${i}`}
                src={src}
                seed={i * 9301 + 49297 + src.length}
                boxW={box.w}
                boxH={box.h}
              />
            ))}
          </div>
        )}
        {buttonEl}
      </div>
    </div>
  );
};



const BODY = "text-[15px] leading-relaxed text-gray-700 dark:text-gray-300";
const MARKDOWN = "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 [&_p]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-4";

const inline = (text: string) => <Markdown components={{ p: ({ children }) => <span>{children}</span> }}>{text}</Markdown>;

export const BlogImage: React.FC<{
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
}> = ({ src, alt, caption, className }) => {
  const [failed, setFailed] = React.useState(false);
  const trimmed = (src ?? "").trim();

  const normalizedSrc = React.useMemo(() => {
    if (!trimmed) return "";
    // уже абсолютный или протокол-relative
    if (/^(https?:|data:|blob:|\/)/i.test(trimmed)) return trimmed;
    // относительный путь — добавим ведущий слэш
    return "/" + trimmed.replace(/^\.?\//, "");
  }, [trimmed]);

  React.useEffect(() => { setFailed(false); }, [normalizedSrc]);

  if (!normalizedSrc) {
    return (
      <figure className="my-6">
        <div className="rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-sm text-center py-8">
          {tr("Изображение не задано", "No image set")}
        </div>
      </figure>
    );
  }

  return (
    <figure className="my-6">
      {failed ? (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 text-sm break-all">
          {tr("Не удалось загрузить:", "Failed to load:")} {normalizedSrc}
        </div>
      ) : (
        <img
          src={normalizedSrc}
          alt={alt ?? ""}
          loading="lazy"
          className={
            className ??
            "block w-full h-auto rounded-2xl ring-1 ring-black/10 dark:ring-white/10"
          }
          onError={() => {
            // eslint-disable-next-line no-console
            console.error("[BlogImage] load failed:", normalizedSrc, alt);
            setFailed(true);
          }}
        />
      )}
      {caption && (
        <figcaption className="text-sm text-gray-500 mt-2 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

const renderContent = (block: BlogBlock): React.ReactNode => {
  if ((block as any).type === "cta") {
    const b = block as any;
    return (
      <CtaBlockView
        variant={b.variant ?? "button"}
        text={b.text ?? ""}
        href={b.href ?? "#"}
        icons={b.icons}
      />
    );
  }

  switch (block.type) {
    case "heading": {
        const Tag = (`h${block.level}`) as React.ElementType;
        const sizes = {
            1: "text-3xl md:text-4xl mt-10 mb-4",
            2: "text-2xl md:text-3xl mt-8 mb-3",
            3: "text-xl md:text-2xl mt-6 mb-2",
        };
        return (
            <Tag
            key={block.id}
            className={cn(sizes[block.level], "font-semibold tracking-tight", BLOG_HEADING_GRADIENT, "inline-block")}
            >
            {inline(block.text)}
            </Tag>
        );
    }
    case "paragraph":
      return <div key={block.id} className={cn(BODY, MARKDOWN, "my-4")}><Markdown>{block.text}</Markdown></div>;
    case "image":
      return (
        <BlogImage
          key={block.id}
          src={block.src}
          alt={block.alt}
          caption={block.caption}
          className="block w-full h-auto rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]"
        />
      );
    case "quote":
      return (
        <blockquote key={block.id} className="my-6 border-l-4 border-purple-400/60 pl-4 italic text-gray-700 dark:text-gray-300">
          <div className={MARKDOWN}><Markdown>{block.text}</Markdown></div>
          {block.author && <footer className="mt-2 not-italic text-sm text-gray-500 dark:text-gray-400">— {block.author}</footer>}
        </blockquote>
      );
    case "callout": {
      const tones = {
        info: "from-blue-500/10 to-indigo-500/10 ring-blue-400/30",
        tip: "from-emerald-500/10 to-teal-500/10 ring-emerald-400/30",
        warning: "from-amber-500/10 to-orange-500/10 ring-amber-400/30",
      };
      return (
        <div key={block.id} className={cn("my-6 p-4 rounded-2xl ring-1 backdrop-blur-md bg-gradient-to-br", tones[block.variant])}>
          {block.title && <p className="font-semibold text-gray-900 dark:text-white mb-1">{inline(block.title)}</p>}
          <div className={cn("text-sm text-gray-700 dark:text-gray-300", MARKDOWN)}><Markdown>{block.text}</Markdown></div>
        </div>
      );
    }
    case "divider":
      return <hr key={block.id} className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return <Tag className={cn(BODY, MARKDOWN, "my-4 pl-6 space-y-2", block.ordered ? "list-decimal" : "list-disc")}>
        {block.items.map((item, index) => <li key={index}>{inline(item)}</li>)}
      </Tag>;
    }
    default:
      return null;
  }
};

export const renderBlock = (block: BlogBlock): React.ReactNode => (
  <React.Fragment key={block.id}>
    {renderContent(block)}
    {block.children && renderBlocks(block.children)}
  </React.Fragment>
);

export const renderBlocks = (blocks: BlogBlock[]) => blocks.map(renderBlock);
