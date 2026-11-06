/* ════════════════════════════════════════════════════════════════════
   DEV-ONLY мок admin-API.
   Активируется при VITE_DEV_AUTH_BYPASS=true.
   Цель: дать админским страницам валидные ответы без бэкенда,
   чтобы они рендерились, а не падали с «Server error».
   ════════════════════════════════════════════════════════════════════ */

import type { BlogBlock, BlogPost, BlogStats } from "@/types/blog";

/* ────────────────────────────────────────────────────────────────────
   «Терпимый» мок — используется как fallback для неизвестных методов.
   Ведёт себя как функция, объект и пустой массив одновременно;
   НЕ thenable (иначе Promise.resolve попытается его развернуть).
   ──────────────────────────────────────────────────────────────────── */
function makeTolerantMock(): any {
  const target = function () { return makeTolerantMock(); };
  return new Proxy(target, {
    get(_t, prop) {
      if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
      if (prop === "toJSON") return () => ({});
      if (prop === Symbol.toPrimitive) return () => "";
      if (prop === Symbol.iterator) return function* () { /* пусто */ };
      if (prop === "length") return 0;
      if (prop === "toString") return () => "";
      if (prop === "valueOf") return () => 0;
      if (
        prop === "map" || prop === "filter" || prop === "forEach" ||
        prop === "flatMap" || prop === "slice" || prop === "concat" ||
        prop === "reduce" || prop === "some" || prop === "every"
      ) return () => [];
      return makeTolerantMock();
    },
    apply() { return makeTolerantMock(); },
  });
}

/* ────────────────────────────────────────────────────────────────────
   Мок-данные блога
   ──────────────────────────────────────────────────────────────────── */
const nowIso = new Date().toISOString();

const MOCK_BLOCK_HEADING: BlogBlock = {
  id: "b-h", type: "heading", level: 2, text: "Mock section",
};
const MOCK_BLOCK_PARAGRAPH: BlogBlock = {
  id: "b-p", type: "paragraph",
  text: "This is **mock** content with *markdown* support.",
};

const MOCK_POST: BlogPost = {
  id: 1,
  slug: "mock-post",
  status: "published",
  title: "Mock blog post",
  excerpt: "This is a mock post — nothing is saved to a server.",
  tags: ["mock", "dev"],
  author: "Dev Admin",
  publishedAt: nowIso,
  createdAt: nowIso,
  updatedAt: nowIso,
  seo: { title: "Mock blog post", description: "Dev-only mock" },
  blocks: [MOCK_BLOCK_HEADING, MOCK_BLOCK_PARAGRAPH],
};

const EMPTY_STATS: BlogStats = {
  days: 30,
  totals: { views: 0, readers: 0, avg_read_seconds: 0, avg_scroll: 0, read_through: 0 },
  posts: [],
  daily: [],
  sources: [],
  depth: [],
};

/* ────────────────────────────────────────────────────────────────────
   Сам мок
   ──────────────────────────────────────────────────────────────────── */
export function createMockAdminApi(): any {
  const posts = new Map<number, BlogPost>([[1, { ...MOCK_POST }]]);
  let nextId = 2;

  const ensurePost = (id: number): BlogPost => {
    if (!posts.has(id)) {
      posts.set(id, { ...MOCK_POST, id, publishedAt: null, status: "draft" });
    }
    return posts.get(id)!;
  };

  const known: Record<string, (...args: any[]) => Promise<any>> = {
    /* ── Блог ── */
    async blogPosts() {
      return Array.from(posts.values());
    },
    async blogList() {
      const items = Array.from(posts.values());
      return { items, total: items.length };
    },
    async blogPost(id: number) {
      return { ...ensurePost(Number(id)) };
    },
    async saveBlogPost(id: number, data: Partial<BlogPost>) {
      const updated = { ...ensurePost(Number(id)), ...data, updatedAt: new Date().toISOString() };
      posts.set(updated.id, updated);
      return { ...updated };
    },
    async createBlogPost(data: Partial<BlogPost>) {
      const id = nextId++;
      const created: BlogPost = {
        ...MOCK_POST, ...data, id,
        createdAt: nowIso, updatedAt: nowIso,
      } as BlogPost;
      posts.set(id, created);
      return { ...created };
    },
    async deleteBlogPost(id: number) {
      posts.delete(Number(id));
    },
    async uploadBlogImage(file: File) {
      // data URL — картинка реально отрендерится в превью
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      return { url };
    },
    async blogStats() {
      return EMPTY_STATS;
    },
    async postStats() {
      return EMPTY_STATS;
    },

    /* ── Дашборд ── */
    async stats() {
      return {
        users: { total: 0, new_7d: 0, active_7d: 0 },
        posts: { total: posts.size, published: 1, drafts: 0 },
      };
    },
    async users() {
      return { items: [], total: 0 };
    },
    async user() {
      return null;
    },
    async updateUser() {
      return null;
    },
    async deleteUser() {
      return null;
    },

    /* ── Research ── */
    async research() { return { items: [], total: 0 }; },
    async researches() { return { items: [], total: 0 }; },
    async researchResults() { return []; },

    /* ── Broadcast ── */
    async broadcasts() { return { items: [], total: 0 }; },
    async broadcast() { return null; },
    async createBroadcast() { return null; },
    async sendBroadcast() { return null; },
  };

  // Всё, чего нет в `known`, отдаём через «терпимый» мок
  return new Proxy(known, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      if (prop in target) return (target as any)[prop];
      return (...args: any[]) => {
        console.warn(`[DEV MOCK] api.admin.${prop}(${args.length} args) — нет мока, вернул пустой объект`);
        return Promise.resolve(makeTolerantMock());
      };
    },
  });
}

/* ────────────────────────────────────────────────────────────────────
   Установка: заменяет api.admin целиком.
   Если замена невозможна (getter-only) — переопределяет методы.
   ──────────────────────────────────────────────────────────────────── */
export function installAdminApiMock(api: any): void {
  if (!api || !api.admin) {
    console.warn("[DEV MOCK] api.admin не найден — мок не установлен");
    return;
  }
  const mock = createMockAdminApi();

  try {
    api.admin = mock;
    console.info("%c[DEV MOCK] api.admin → mock установлен", "color:#22c55e;font-weight:bold");
    return;
  } catch (err) {
    console.warn("[DEV MOCK] прямая замена api.admin не удалась, оверрайдим методы", err);
  }

  // Fallback: подменить существующие методы на месте
  try {
    Object.assign(api.admin, mock);
    console.info("%c[DEV MOCK] api.admin методы переопределены", "color:#22c55e;font-weight:bold");
  } catch (err) {
    console.error("[DEV MOCK] не удалось установить mock для api.admin", err);
  }
}