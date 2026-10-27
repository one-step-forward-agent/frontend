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
  id: string;
  slug: string;
  status: "draft" | "published";
  title: string;
  excerpt: string;
  coverImage?: string;
  coverAlt?: string;
  tags: string[];
  author?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  seo: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
  };
  blocks: BlogBlock[];
}