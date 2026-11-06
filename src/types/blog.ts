/* ════════════════════════════════════════════════════════════════════
   Блоки поста
   ────────────────────────────────────────────────────────────────────
   Любой блок может содержать вложенные блоки (`children`), которые
   рендерятся сразу после него. Это позволяет строить произвольные
   композиции: например, список с картинкой-иллюстрацией внутри,
   callout с подсказками-списками и т.п.

   Текстовые поля (`text`, `items`, `title`, `excerpt`) поддерживают
   Markdown: `**bold**`, `*italic*`, `` `code` ``, `[text](url)`,
   списки `1.` / `-`, цитаты `>`.
   ════════════════════════════════════════════════════════════════════ */

export type BlogBlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "quote"
  | "callout"
  | "divider"
  | "list";

interface BlogBlockBase {
  id: string;
  type: BlogBlockType;
  /** Вложенные блоки — отрисовываются сразу после текущего. */
  children?: BlogBlock[];
}

export interface HeadingBlock extends BlogBlockBase {
  type: "heading";
  level: 1 | 2 | 3;
  /** Markdown поддерживается (inline-разметка). */
  text: string;
}

export interface ParagraphBlock extends BlogBlockBase {
  type: "paragraph";
  /** Markdown: inline + блочные элементы (списки, цитаты). */
  text: string;
}

export interface ImageBlock extends BlogBlockBase {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
}

export interface QuoteBlock extends BlogBlockBase {
  type: "quote";
  /** Markdown поддерживается. */
  text: string;
  author?: string;
}

export interface CalloutBlock extends BlogBlockBase {
  type: "callout";
  variant: "info" | "tip" | "warning";
  title?: string;
  /** Markdown поддерживается. */
  text: string;
}

export interface DividerBlock extends BlogBlockBase {
  type: "divider";
}

export interface ListBlock extends BlogBlockBase {
  type: "list";
  /** true → `<ol>`, false → `<ul>`. */
  ordered: boolean;
  /** Пункты списка; каждый поддерживает inline-Markdown. */
  items: string[];
}

export type BlogBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | QuoteBlock
  | CalloutBlock
  | DividerBlock
  | ListBlock;

/* ════════════════════════════════════════════════════════════════════
   Пост
   ════════════════════════════════════════════════════════════════════ */

export interface BlogPost {
  id: number;
  slug: string;
  status: "draft" | "published";
  title: string;
  excerpt: string;
  coverImage?: string;
  coverAlt?: string;
  tags: string[];
  author?: string;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  seo: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
  };
  blocks: BlogBlock[];
}

/** What the editor sends: the post without the fields the server sets */
export type BlogPostSave = Omit<
  BlogPost,
  "id" | "publishedAt" | "createdAt" | "updatedAt"
>;

/* ════════════════════════════════════════════════════════════════════
   Статистика
   ════════════════════════════════════════════════════════════════════ */

export interface BlogReadStats {
  views: number;
  /** Unique readers (one browser counts once) */
  readers: number;
  avg_read_seconds: number;
  /** Average scroll depth through the article, % */
  avg_scroll: number;
  /** Share of views that scrolled to 90 % or further, % */
  read_through: number;
}

/** /api/admin/blog/stats: the blog or one post over the last `days` */
export interface BlogStats {
  days: number;
  totals: BlogReadStats;
  posts: (BlogReadStats & {
    id: number;
    title: string;
    slug: string;
    status: BlogPost["status"];
    views_7d: number;
  })[];
  daily: { date: string; views: number; readers: number }[];
  sources: { source: string; views: number }[];
  depth: { label: string; views: number }[];
}