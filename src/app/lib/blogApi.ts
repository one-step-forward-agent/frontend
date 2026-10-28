import type { BlogBlock, BlogPost, BlogPostSave } from "@/types/blog";

/** The blog's posts live on the server (app/api/blog.py); this file keeps the editor's helpers and reports how a
 * post is read: its opening, then reading time and scroll depth as the reader goes and when they leave. */

const VISITOR_KEY = "deyla:blog:visitor";
// Where the blog kept its posts before it had a server: an admin's own browser
const LOCAL_POSTS_KEY = "deyla:blog:posts";
// How often the reading time is sent while the page is open, besides when it is hidden or closed
const PROGRESS_EVERY_MS = 15_000;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `b_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const newBlockId = uid;

export const makeSlug = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `post-${Date.now().toString(36)}`;

/** A new post as the editor starts it */
export const draftPost = (): BlogPostSave => ({
  slug: `post-${Date.now().toString(36)}`,
  status: "draft",
  title: "Новый пост",
  excerpt: "",
  tags: [],
  seo: {},
  blocks: [
    { id: uid(), type: "heading", level: 1, text: "Заголовок статьи" },
    { id: uid(), type: "paragraph", text: "Текст статьи…" },
  ] as BlogBlock[],
});

/** The fields the server takes from a post */
export const toSave = (post: BlogPost): BlogPostSave => ({
  slug: post.slug,
  status: post.status,
  title: post.title,
  excerpt: post.excerpt,
  coverImage: post.coverImage || undefined,
  coverAlt: post.coverAlt || undefined,
  tags: post.tags,
  author: post.author || undefined,
  seo: post.seo,
  blocks: post.blocks,
});

/** The posts written before the blog had a server, still in this browser */
export function localPosts(): (BlogPostSave & { publishedAt?: string })[] {
  try {
    const raw = localStorage.getItem(LOCAL_POSTS_KEY);
    const posts = raw ? JSON.parse(raw) : [];
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

export function forgetLocalPosts(): void {
  try {
    localStorage.removeItem(LOCAL_POSTS_KEY);
  } catch {
    // nothing to forget
  }
}

/** A random id of this browser, so a reader who comes back counts once; nothing about the person */
function visitorId(): string {
  try {
    const known = localStorage.getItem(VISITOR_KEY);
    if (known) return known;
    const fresh = uid();
    localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    return uid();
  }
}

/** How far the reader got through `article`, 0–100 */
function scrollDepth(article: HTMLElement | null): number {
  if (!article) return 0;
  const box = article.getBoundingClientRect();
  const seen = window.innerHeight - box.top;
  return Math.max(0, Math.min(100, Math.round((seen / Math.max(box.height, 1)) * 100)));
}

/** Counts the view of a published post and reports reading until the page closes; returns the cleanup. Only the
 * time the tab is visible counts as reading. */
export function trackReading(slug: string, startView: (slug: string, visitor: string, referrer: string | null) => Promise<{ id: number | null; key: string | null }>, article: () => HTMLElement | null): () => void {
  let view: { id: number; key: string } | null = null;
  let stopped = false;
  let readMs = 0;
  let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
  let deepest = 0;

  const elapsed = () => Math.round((readMs + (visibleSince ? Date.now() - visibleSince : 0)) / 1000);
  const send = () => {
    deepest = Math.max(deepest, scrollDepth(article()));
    if (!view) return;
    const body = JSON.stringify({ key: view.key, read_seconds: elapsed(), scroll: deepest });
    const url = `/api/blog/views/${view.id}`;
    // A closing page still delivers it
    if (!(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "application/json" })))) {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
    }
  };
  const onScroll = () => {
    deepest = Math.max(deepest, scrollDepth(article()));
  };
  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      if (visibleSince) readMs += Date.now() - visibleSince;
      visibleSince = 0;
      send();
    } else {
      visibleSince = Date.now();
    }
  };

  startView(slug, visitorId(), document.referrer || null)
    .then((started) => {
      if (!stopped && started.id && started.key) view = { id: started.id, key: started.key };
    })
    .catch(() => undefined);
  const timer = window.setInterval(send, PROGRESS_EVERY_MS);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", send);

  return () => {
    send();
    stopped = true;
    window.clearInterval(timer);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", send);
  };
}
