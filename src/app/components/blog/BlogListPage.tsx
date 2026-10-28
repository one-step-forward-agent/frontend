import * as React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LOCALE, tr } from "@/i18n";
import { cn } from "@/utils/cn";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { api } from "@/app/api/client";
import type { BlogPost } from "@/types/blog";
import { BLOG_HEADING_GRADIENT, BLOG_TAG_PILL } from "./BlogRenderer";

export default function BlogListPage() {
  const [posts, setPosts] = React.useState<BlogPost[] | null>(null);

  React.useEffect(() => {
    document.title = tr("Блог — Deyla", "Blog — Deyla");
    api.blog.posts().then(setPosts).catch(() => setPosts([]));
  }, []);

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-clip">
      <LandingHeader />
      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-32 md:pt-40 pb-20">
        <div className="mb-4">
            <Badge className="text-eyebrow">
            <Sparkles size={12} className="mr-1" aria-hidden="true" />
            {tr("Блог", "Blog")}
            </Badge>
        </div>
        <h1 className={cn("text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]", BLOG_HEADING_GRADIENT, "inline-block")}>
          {tr("Идеи, кейсы и обновления", "Ideas, stories, and updates")}
        </h1>
        <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          {tr("Что нового в Deyla и как её используют команды",
              "What's new in Deyla, how we build the assistant, and how teams use it")}
        </p>

        {posts === null ? (
          <p className="mt-16 text-gray-500 dark:text-gray-400">{tr("Загрузка…", "Loading…")}</p>
        ) : posts.length === 0 ? (
          <p className="mt-16 text-gray-500 dark:text-gray-400">
            {tr("Скоро", "No published posts yet")}
          </p>
        ) : (
          <ul className="mt-12 grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/blog/${p.slug}`}
                  className="group block h-full rounded-2xl p-5 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  {p.coverImage && (
                    <div className="mb-4 -mx-1 rounded-xl overflow-hidden">
                      <img src={p.coverImage} alt={p.coverAlt || p.title} className="block w-full h-48 object-cover" />
                    </div>
                  )}
                  <h2 className={cn("text-xl md:text-2xl font-semibold tracking-tight", BLOG_HEADING_GRADIENT, "inline-block")}>
                    {p.title}
                  </h2>
                  {p.excerpt && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{p.excerpt}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => <span key={t} className={BLOG_TAG_PILL}>{t}</span>)}
                  </div>
                  {p.publishedAt && (
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" }).format(new Date(p.publishedAt))}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}