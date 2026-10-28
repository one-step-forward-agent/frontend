export type BlogBlockType =
  | "heading" | "paragraph" | "image" | "quote" | "callout" | "divider";

interface BlogBlockBase { id: string; type: BlogBlockType; }

export interface HeadingBlock extends BlogBlockBase {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
}
export interface ParagraphBlock extends BlogBlockBase {
  type: "paragraph";
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
  text: string;
  author?: string;
}
export interface CalloutBlock extends BlogBlockBase {
  type: "callout";
  variant: "info" | "tip" | "warning";
  title?: string;
  text: string;
}
export interface DividerBlock extends BlogBlockBase {
  type: "divider";
}

export type BlogBlock =
  | HeadingBlock | ParagraphBlock | ImageBlock
  | QuoteBlock | CalloutBlock | DividerBlock;

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
export type BlogPostSave = Omit<BlogPost, "id" | "publishedAt" | "createdAt" | "updatedAt">;

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
  posts: (BlogReadStats & { id: number; title: string; slug: string; status: BlogPost["status"]; views_7d: number })[];
  daily: { date: string; views: number; readers: number }[];
  sources: { source: string; views: number }[];
  depth: { label: string; views: number }[];
}
