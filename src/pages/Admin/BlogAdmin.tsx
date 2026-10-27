import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Copy, Trash2, ExternalLink, Pencil } from "lucide-react";
import { blogApi } from "@/app/lib/blogApi";
import type { BlogPost } from "@/types/blog";
import BlogEditor from "@/app/components/blog/BlogEditor";
import { BLOG_HEADING_GRADIENT } from "@/app/components/blog/BlogRenderer";
import { cn } from "@/utils/cn";

function BlogAdminList() {
  const navigate = useNavigate();
  const [posts, setPosts] = React.useState<BlogPost[]>(() => blogApi.list());

  React.useEffect(() => {
    const on = () => setPosts(blogApi.list());
    window.addEventListener("blog:changed", on);
    return () => window.removeEventListener("blog:changed", on);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <h1 className={cn("text-3xl md:text-4xl font-semibold tracking-tight", BLOG_HEADING_GRADIENT, "inline-block")}>
            Блог
          </h1>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => {
              const p = blogApi.create({ title: "Новый пост" });
              navigate(`/dashboard/blog/${p.id}`);
            }}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm text-white bg-gradient-to-br from-blue-500 to-violet-500 shadow-md hover:brightness-110"
          >
            <Plus size={16} /> Новый пост
          </button>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Постов пока нет</p>
        ) : (
          <ul className="space-y-2">
            {posts.map((p) => (
              <li key={p.id}
                className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.title || "Без названия"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">/blog/{p.slug} · {p.status}</p>
                </div>
                <Link to={`/dashboard/blog/${p.id}`}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs bg-white dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/10">
                  <Pencil size={12} /> Редактировать
                </Link>
                {p.status === "published" && (
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs bg-white dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/10">
                    <ExternalLink size={12} /> Открыть
                  </a>
                )}
                <button type="button" onClick={() => blogApi.duplicate(p.id)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs bg-white dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/10">
                  <Copy size={12} /> Дублировать
                </button>
                <button type="button" onClick={() => { if (confirm("Удалить пост?")) blogApi.remove(p.id); }}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20">
                  <Trash2 size={12} /> Удалить
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function BlogAdmin() {
  const { id } = useParams();
  return id ? <BlogEditor id={id} /> : <BlogAdminList />;
}