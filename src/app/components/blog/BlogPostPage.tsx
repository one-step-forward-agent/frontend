import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Sparkles, ArrowLeft, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LOCALE, tr } from "@/i18n";
import { cn } from "@/utils/cn";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { blogApi } from "@/app/lib/blogApi";
import type { BlogPost } from "@/types/blog";
import { BLOG_HEADING_GRADIENT, BLOG_TAG_PILL, renderBlocks } from "./BlogRenderer";

function useSeo(post: BlogPost | null) {
  React.useEffect(() => {
    if (!post) return;
    const prev = document.title;
    document.title = post.seo.title || post.title;

    const setMeta = (attr: "name" | "property", key: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    setMeta("name", "description", post.seo.description || post.excerpt || "");
    setMeta("property", "og:title", post.seo.title || post.title);
    setMeta("property", "og:description", post.seo.description || post.excerpt || "");
    setMeta("property", "og:type", "article");
    const ogImage = post.seo.ogImage || post.coverImage;
    if (ogImage) setMeta("property", "og:image", ogImage);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = post.seo.canonical || `${window.location.origin}/blog/${post.slug}`;

    return () => { document.title = prev; };
  }, [post]);
}

export default function BlogPostPage() {
  const { slug = "" } = useParams();
  const [post, setPost] = React.useState<BlogPost | null>(() => blogApi.getBySlug(slug));

  React.useEffect(() => {
    setPost(blogApi.getBySlug(slug));
    const on = () => setPost(blogApi.getBySlug(slug));
    window.addEventListener("blog:changed", on);
    return () => window.removeEventListener("blog:changed", on);
  }, [slug]);
  useSeo(post);

  if (!post || post.status !== "published") {
    return (
      <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
        <LandingHeader />
        <main className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 pt-32 pb-20 text-center">
          <p className="text-6xl font-semibold">404</p>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            {tr("Статья не найдена или не опубликована", "Post not found or not published")}
          </p>
          <Link to="/blog" className="mt-6 inline-flex items-center gap-2 text-blue-600 dark:text-blue-300 font-medium hover:underline">
            <ArrowLeft size={16} /> {tr("Все статьи", "All posts")}
          </Link>
        </main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white overflow-x-clip">
      <LandingHeader />
      <main className="relative z-10">
        <article className="max-w-3xl mx-auto px-4 md:px-6 pt-28 md:pt-36 pb-20">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8">
            <ArrowLeft size={14} /> {tr("Все статьи", "All posts")}
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="text-eyebrow">
              <Sparkles size={11} className="mr-1" aria-hidden="true" />
              {tr("Блог", "Blog")}
            </Badge>
            {post.tags.map((t) => <span key={t} className={BLOG_TAG_PILL}>{t}</span>)}
          </div>

          <h1 className={cn("text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]", BLOG_HEADING_GRADIENT, "inline-block")}>
            {post.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            {post.publishedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                {new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" }).format(new Date(post.publishedAt))}
              </span>
            )}
            {post.author && (
              <span className="inline-flex items-center gap-1.5"><User size={14} />{post.author}</span>
            )}
          </div>

          {post.coverImage && (
            <div className="mt-8 rounded-[24px] overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
              <img src={post.coverImage} alt={post.coverAlt || post.title} className="block w-full h-auto" />
            </div>
          )}

          {post.excerpt && (
            <p className="mt-8 text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="mt-8">{renderBlocks(post.blocks)}</div>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}