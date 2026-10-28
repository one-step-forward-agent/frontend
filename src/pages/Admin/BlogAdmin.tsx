import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Copy, ExternalLink, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { ApiError, api } from "@/app/api/client";
import { draftPost, forgetLocalPosts, localPosts, makeSlug } from "@/app/lib/blogApi";
import type { BlogPost, BlogStats } from "@/types/blog";
import BlogEditor from "@/app/components/blog/BlogEditor";
import { BLOG_HEADING_GRADIENT } from "@/app/components/blog/BlogRenderer";
import { cn } from "@/utils/cn";

/** deyla.tech/dashboard/blog: the posts with how they are read, the editor (/dashboard/blog/:id) and one post's
 * analytics (/dashboard/blog/:id/stats). Views, unique readers, reading time and scroll depth come from the post
 * pages (app/lib/blogApi.ts trackReading). */

const PERIODS = [7, 30, 90] as const;
const action =
  "inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs bg-white dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50";
const panel = "rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10";
// One series per chart: one hue, the text stays in ink colors
const BAR = "bg-blue-500 dark:bg-blue-400";

function message(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) return "Раздел только для администраторов";
  if (error instanceof ApiError && error.status === 404) return "На сервере ещё нет блога — обновите бэкенд";
  return error instanceof Error ? error.message : "Не получилось — попробуйте ещё раз";
}

const duration = (seconds: number) => (seconds >= 60 ? `${Math.floor(seconds / 60)} мин ${seconds % 60} с` : `${seconds} с`);
const shortDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={panel}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

/** Views by day: a bar per day, the readers of that day in the tooltip */
function DailyChart({ daily }: { daily: BlogStats["daily"] }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const top = Math.max(1, ...daily.map((day) => day.views));
  const shown = hover === null ? null : daily[hover];
  return (
    <div className={panel}>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="font-semibold text-sm">Просмотры по дням</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums h-4">
          {shown ? `${shortDay(shown.date)}: ${shown.views} просм., ${shown.readers} чит.` : `максимум ${top} в день`}
        </p>
      </div>
      <div className="flex items-end gap-[2px] h-36 border-b border-gray-200 dark:border-white/10" onMouseLeave={() => setHover(null)}>
        {daily.map((day, index) => (
          <div
            key={day.date}
            className="relative flex-1 h-full flex items-end cursor-default"
            onMouseEnter={() => setHover(index)}
            aria-label={`${shortDay(day.date)}: ${day.views} просмотров, ${day.readers} читателей`}
          >
            <div
              className={cn("w-full rounded-t-[4px] transition-opacity", BAR, hover !== null && hover !== index && "opacity-40")}
              style={{ height: day.views ? `${Math.max(2, (day.views / top) * 100)}%` : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span>{daily[0] && shortDay(daily[0].date)}</span>
        <span>{daily.length > 0 && shortDay(daily[daily.length - 1].date)}</span>
      </div>
    </div>
  );
}

/** Horizontal bars for a ranked or ordered list: sources, scroll depth */
function BarList({ title, rows, empty }: { title: string; rows: { label: string; value: number }[]; empty: string }) {
  const top = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className={panel}>
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      {rows.every((row) => !row.value) ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="text-[13px]" title={`${row.label}: ${row.value}`}>
              <div className="flex justify-between gap-2">
                <span className="truncate">{row.label}</span>
                <span className="tabular-nums text-gray-600 dark:text-gray-300">{row.value}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06]">
                <div className={cn("h-full rounded-full", BAR)} style={{ width: `${(row.value / top) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Analytics({ stats }: { stats: BlogStats }) {
  const { totals } = stats;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <Tile label="Просмотры" value={String(totals.views)} />
        <Tile label="Читатели" value={String(totals.readers)} hint="уникальные браузеры" />
        <Tile label="Время чтения" value={duration(totals.avg_read_seconds)} hint="в среднем за просмотр" />
        <Tile label="Глубина" value={`${totals.avg_scroll}%`} hint="средняя прокрутка статьи" />
        <Tile label="Дочитывают" value={`${totals.read_through}%`} hint="прокрутили до 90% и дальше" />
      </div>
      <DailyChart daily={stats.daily} />
      <div className="grid gap-4 md:grid-cols-2">
        <BarList title="Откуда приходят" rows={stats.sources.map((row) => ({ label: row.source === "direct" ? "Прямые заходы и сам сайт" : row.source, value: row.views }))} empty="Пока нет просмотров" />
        <BarList title="Докуда дочитывают" rows={stats.depth.map((row) => ({ label: row.label, value: row.views }))} empty="Пока нет просмотров" />
      </div>
    </div>
  );
}

function PeriodPicker({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  return (
    <div className="inline-flex rounded-lg ring-1 ring-black/5 dark:ring-white/10 overflow-hidden" role="group" aria-label="Период">
      {PERIODS.map((period) => (
        <button key={period} type="button" onClick={() => onChange(period)}
          className={cn("px-3 h-8 text-xs", days === period ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "hover:bg-gray-100 dark:hover:bg-white/10")}>
          {period} дней
        </button>
      ))}
    </div>
  );
}

function BlogAdminList() {
  const navigate = useNavigate();
  const [posts, setPosts] = React.useState<BlogPost[] | null>(null);
  const [stats, setStats] = React.useState<BlogStats | null>(null);
  const [days, setDays] = React.useState(30);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    Promise.all([api.admin.blogPosts(), api.admin.blogStats(days)])
      .then(([list, numbers]) => {
        setPosts(list);
        setStats(numbers);
        setProblem(null);
      })
      .catch((error) => setProblem(message(error)));
  }, [days]);
  React.useEffect(load, [load]);

  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await work();
      load();
    } catch (error) {
      setProblem(message(error));
    } finally {
      setBusy(false);
    }
  };

  const numbers = new Map((stats?.posts ?? []).map((row) => [row.id, row]));
  const [leftInBrowser, setLeftInBrowser] = React.useState(() => localPosts());

  // Posts written before the blog had a server: moved there once, their addresses and statuses kept
  const moveLocal = () =>
    run(async () => {
      const failed: string[] = [];
      for (const post of leftInBrowser) {
        const body = {
          slug: makeSlug(post.slug || post.title || "post"),
          status: post.status === "published" ? ("published" as const) : ("draft" as const),
          title: post.title || "Без названия",
          excerpt: post.excerpt || "",
          coverImage: post.coverImage || undefined,
          coverAlt: post.coverAlt || undefined,
          tags: post.tags ?? [],
          author: post.author || undefined,
          seo: post.seo ?? {},
          blocks: post.blocks ?? [],
        };
        await api.admin.createBlogPost(body).catch((error) => failed.push(`«${body.title}»: ${message(error)}`));
      }
      if (failed.length) throw new Error(`Не перенеслись: ${failed.join("; ")}`);
      forgetLocalPosts();
      setLeftInBrowser([]);
    });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft size={14} /> Дашборд
          </Link>
          <h1 className={cn("text-3xl md:text-4xl font-semibold tracking-tight", BLOG_HEADING_GRADIENT, "inline-block")}>Блог</h1>
          <div className="flex-1" />
          <PeriodPicker days={days} onChange={setDays} />
          <button
            type="button"
            disabled={busy}
            onClick={() => run(async () => navigate(`/dashboard/blog/${(await api.admin.createBlogPost(draftPost())).id}`))}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm text-white bg-gradient-to-br from-blue-500 to-violet-500 shadow-md hover:brightness-110 disabled:opacity-50"
          >
            <Plus size={16} /> Новый пост
          </button>
        </div>

        {problem && <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-700 dark:text-red-300">{problem}</p>}
        {leftInBrowser.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-500/10 px-4 py-3 text-sm">
            <span className="flex-1 min-w-[220px]">
              В этом браузере остались посты, написанные до появления сервера: {leftInBrowser.length}. Их видели только вы.
            </span>
            <button type="button" className={action} disabled={busy} onClick={moveLocal}>Перенести на сервер</button>
          </div>
        )}
        {stats && <Analytics stats={stats} />}

        {posts === null ? (
          !problem && <p className="text-gray-500 dark:text-gray-400">Загрузка…</p>
        ) : posts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Постов пока нет</p>
        ) : (
          <div className={cn(panel, "p-0 overflow-x-auto")}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500 dark:text-gray-400">
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="px-4 py-3 font-medium">Пост</th>
                  <th className="px-3 py-3 font-medium text-right">Просмотры</th>
                  <th className="px-3 py-3 font-medium text-right">За 7 дней</th>
                  <th className="px-3 py-3 font-medium text-right">Читатели</th>
                  <th className="px-3 py-3 font-medium text-right">Время</th>
                  <th className="px-3 py-3 font-medium text-right">Дочитывают</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => {
                  const row = numbers.get(post.id);
                  return (
                    <tr key={post.id} className="border-b last:border-0 border-gray-100 dark:border-white/5 align-middle">
                      <td className="px-4 py-3 min-w-[220px]">
                        <p className="font-medium truncate max-w-[320px]">{post.title || "Без названия"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          <span className={cn("mr-1.5 inline-block rounded px-1.5 py-px", post.status === "published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-gray-500/10")}>
                            {post.status === "published" ? "опубликован" : "черновик"}
                          </span>
                          /blog/{post.slug}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{row?.views ?? 0}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{row?.views_7d ?? 0}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{row?.readers ?? 0}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{duration(row?.avg_read_seconds ?? 0)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{row?.read_through ?? 0}%</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Link to={`/dashboard/blog/${post.id}`} className={action} title="Редактировать"><Pencil size={12} /></Link>
                          <Link to={`/dashboard/blog/${post.id}/stats`} className={action} title="Статистика"><BarChart3 size={12} /></Link>
                          {post.status === "published" && (
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className={action} title="Открыть на сайте"><ExternalLink size={12} /></a>
                          )}
                          <button type="button" className={action} disabled={busy} title="Дублировать" onClick={() => run(() => api.admin.duplicateBlogPost(post.id))}>
                            <Copy size={12} />
                          </button>
                          <button type="button" disabled={busy} title="Удалить"
                            className={cn(action, "text-red-600 dark:text-red-400")}
                            onClick={() => { if (confirm(`Удалить «${post.title}» вместе со статистикой?`)) run(() => api.admin.deleteBlogPost(post.id)); }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BlogPostStats({ id }: { id: number }) {
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [stats, setStats] = React.useState<BlogStats | null>(null);
  const [days, setDays] = React.useState(30);
  const [problem, setProblem] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    Promise.all([api.admin.blogPost(id), api.admin.blogStats(days, id)])
      .then(([one, numbers]) => {
        setPost(one);
        setStats(numbers);
      })
      .catch((error) => setProblem(message(error)));
  }, [id, days]);
  React.useEffect(load, [load]);

  const reset = async () => {
    if (!confirm("Обнулить статистику этого поста? Например, после своих тестовых просмотров.")) return;
    try {
      await api.admin.resetBlogViews(id);
      load();
    } catch (error) {
      setProblem(message(error));
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/dashboard/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft size={14} /> Все посты
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight truncate max-w-full">{post?.title ?? "…"}</h1>
          <div className="flex-1" />
          <PeriodPicker days={days} onChange={setDays} />
          <Link to={`/dashboard/blog/${id}`} className={action}><Pencil size={12} /> Редактировать</Link>
          <button type="button" className={action} onClick={reset}><RotateCcw size={12} /> Обнулить</button>
        </div>
        {problem && <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-700 dark:text-red-300">{problem}</p>}
        {stats && <Analytics stats={stats} />}
      </div>
    </div>
  );
}

export default function BlogAdmin({ view = "edit" }: { view?: "edit" | "stats" }) {
  const { id } = useParams();
  const postId = Number(id);
  if (!id || !Number.isInteger(postId)) return <BlogAdminList />;
  return view === "stats" ? <BlogPostStats id={postId} /> : <BlogEditor id={postId} />;
}
