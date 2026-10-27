import * as React from "react";
import { cn } from "@/utils/cn";
import type { BlogBlock } from "@/types/blog";

export const BLOG_HEADING_GRADIENT =
  "bg-gradient-to-r from-purple-700 via-blue-600 to-emerald-600 bg-clip-text text-transparent";

export const BLOG_TAG_PILL =
  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] uppercase tracking-widest font-medium " +
  "bg-white/70 dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md " +
  "text-gray-700 dark:text-gray-200";

const BODY = "text-[15px] leading-relaxed text-gray-700 dark:text-gray-300";

export const renderBlock = (block: BlogBlock): React.ReactNode => {
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
            {block.text}
            </Tag>
        );
    }
    case "paragraph":
      return <p key={block.id} className={cn(BODY, "my-4")}>{block.text}</p>;
    case "image":
      return (
        <figure key={block.id} className="my-6">
          <div className="rounded-[24px] overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]">
            <img src={block.src} alt={block.alt} className="block w-full h-auto" loading="lazy" />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "quote":
      return (
        <blockquote key={block.id} className="my-6 border-l-4 border-purple-400/60 pl-4 italic text-gray-700 dark:text-gray-300">
          <p>{block.text}</p>
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
          {block.title && <p className="font-semibold text-gray-900 dark:text-white mb-1">{block.title}</p>}
          <p className="text-sm text-gray-700 dark:text-gray-300">{block.text}</p>
        </div>
      );
    }
    case "divider":
      return <hr key={block.id} className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />;
    default:
      return null;
  }
};

export const renderBlocks = (blocks: BlogBlock[]) => blocks.map(renderBlock);