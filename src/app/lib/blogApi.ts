import type { BlogPost } from "@/types/blog";

const STORAGE_KEY = "deyla:blog:posts";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const makeSlug = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `post-${Date.now()}`;

const read = (): BlogPost[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const write = (posts: BlogPost[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  window.dispatchEvent(new CustomEvent("blog:changed"));
};

export const blogApi = {
  list: (): BlogPost[] =>
    read().sort((a, b) =>
      (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt)
    ),

  published: (): BlogPost[] =>
    read()
      .filter((p) => p.status === "published")
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")),

  getBySlug: (slug: string) => read().find((p) => p.slug === slug) ?? null,
  getById: (id: string) => read().find((p) => p.id === id) ?? null,

  create: (patch?: Partial<BlogPost>): BlogPost => {
    const now = new Date().toISOString();
    const post: BlogPost = {
      id: uid(),
      slug: patch?.slug || makeSlug(patch?.title || "new-post"),
      status: "draft",
      title: patch?.title || "Новый пост",
      excerpt: patch?.excerpt || "",
      coverImage: patch?.coverImage,
      coverAlt: patch?.coverAlt,
      tags: patch?.tags ?? [],
      author: patch?.author,
      createdAt: now,
      updatedAt: now,
      seo: { ...patch?.seo },
      blocks: patch?.blocks ?? [
        { id: uid(), type: "heading", level: 1, text: "Заголовок статьи" },
        { id: uid(), type: "paragraph", text: "Текст статьи…" },
      ],
    };
    write([post, ...read()]);
    return post;
  },

  update: (id: string, patch: Partial<BlogPost>): BlogPost | null => {
    const posts = read();
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const prev = posts[idx];
    const next: BlogPost = { ...prev, ...patch, id: prev.id, updatedAt: new Date().toISOString() };
    if (next.status === "published" && !next.publishedAt) {
      next.publishedAt = next.updatedAt;
    }
    if (next.status === "draft") next.publishedAt = undefined;
    posts[idx] = next;
    write(posts);
    return next;
  },

  remove: (id: string) => write(read().filter((p) => p.id !== id)),

  duplicate: (id: string): BlogPost | null => {
    const src = read().find((p) => p.id === id);
    if (!src) return null;
    const now = new Date().toISOString();
    const clone: BlogPost = {
      ...src,
      id: uid(),
      slug: `${src.slug}-copy-${Date.now().toString(36)}`,
      status: "draft",
      publishedAt: undefined,
      createdAt: now,
      updatedAt: now,
      blocks: src.blocks.map((b) => ({ ...b, id: uid() })),
    };
    write([clone, ...read()]);
    return clone;
  },
};

export const newBlockId = uid;