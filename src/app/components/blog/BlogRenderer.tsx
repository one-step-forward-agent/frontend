import * as React from "react";
import Markdown from "react-markdown";
import { cn } from "@/utils/cn";
import type { BlogBlock } from "@/types/blog";

export const BLOG_HEADING_GRADIENT =
  "bg-gradient-to-r from-purple-700 via-blue-600 to-emerald-600 bg-clip-text text-transparent";

export const BLOG_TAG_PILL =
  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] uppercase tracking-widest font-medium " +
  "bg-white/70 dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md " +
  "text-gray-700 dark:text-gray-200";

const BODY = "text-[15px] leading-relaxed text-gray-700 dark:text-gray-300";
const MARKDOWN = "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400 [&_p]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-4";

const inline = (text: string) => <Markdown components={{ p: ({ children }) => <span>{children}</span> }}>{text}</Markdown>;

const renderContent = (block: BlogBlock): React.ReactNode => {
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
        <figure key={block.id} className="my-6">
          <div className="rounded-[24px] overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.2)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]">
            <img src={block.src} alt={block.alt} className="block w-full h-auto" loading="lazy" />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {inline(block.caption)}
            </figcaption>
          )}
        </figure>
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
