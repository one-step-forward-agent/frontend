import * as React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Image as ImageIcon,
  Heading1, Heading2, Heading3, Quote, Info, Minus, Save, Eye,
  Copy, CheckCircle2, AlertTriangle, X, GripVertical,
} from "lucide-react";
import { Button } from "@/app/components/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { tr } from "@/i18n";
import { api } from "@/app/api/client";
import { makeSlug, newBlockId, toSave } from "@/app/lib/blogApi";
import type { BlogBlock, BlogBlockType, BlogPost } from "@/types/blog";
import { BLOG_HEADING_GRADIENT, renderBlocks } from "./BlogRenderer";

/* ─── Factory блоков ─── */
const makeBlock = (type: BlogBlockType): BlogBlock => {
  const id = newBlockId();
  switch (type) {
    case "heading":   return { id, type, level: 2, text: "Заголовок" };
    case "paragraph": return { id, type, text: "Новый текст…" };
    case "image":     return { id, type, src: "", alt: "" };
    case "quote":     return { id, type, text: "Цитата", author: "" };
    case "callout":   return { id, type, variant: "info", title: "", text: "Текст подсказки" };
    case "divider":   return { id, type };
  }
};

/* ─── UI-компоненты полей ─── */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</span>
    {children}
  </label>
);

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm " +
  "bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 " +
  "backdrop-blur-xl outline-none focus:ring-blue-400/60 " +
  "text-gray-900 dark:text-white placeholder:text-gray-400";

const textareaCls =
  "w-full min-h-[80px] p-3 rounded-xl text-sm " +
  "bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 " +
  "backdrop-blur-xl outline-none focus:ring-blue-400/60 " +
  "text-gray-900 dark:text-white placeholder:text-gray-400 resize-y";

/* ─── Картинка: ссылка или загруженный файл ─── */
const PictureInput = ({ value, onChange, placeholder }: { value: string; onChange: (url: string) => void; placeholder: string }) => {
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setProblem(null);
    try {
      onChange((await api.admin.uploadBlogImage(file)).url);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Не получилось загрузить");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="flex gap-2">
        <input className={inputCls} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        <label className={cn("shrink-0 inline-flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm cursor-pointer bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06]", busy && "opacity-50 pointer-events-none")}>
          <ImageIcon size={14} /> {busy ? "Загрузка…" : "Загрузить"}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </div>
      {problem && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{problem}</p>}
    </div>
  );
};

/* ─── Кнопка «добавить блок» ─── */
const AddBlockMenu = ({ onAdd }: { onAdd: (t: BlogBlockType) => void }) => {
  const [open, setOpen] = React.useState(false);
  const items: { type: BlogBlockType; label: string; icon: React.ReactNode }[] = [
    { type: "heading",   label: tr("Заголовок", "Heading"),  icon: <Heading2 size={14} /> },
    { type: "paragraph", label: tr("Текст", "Paragraph"),    icon: <Info size={14} /> },
    { type: "image",     label: tr("Картинка", "Image"),     icon: <ImageIcon size={14} /> },
    { type: "quote",     label: tr("Цитата", "Quote"),       icon: <Quote size={14} /> },
    { type: "callout",   label: tr("Callout", "Callout"),    icon: <Info size={14} /> },
    { type: "divider",   label: tr("Разделитель", "Divider"), icon: <Minus size={14} /> },
  ];
  return (
    <div className="relative">
      <Button
        variant="secondary"
        icon="plus"
        onClick={() => setOpen((v) => !v)}
      >
        {tr("Добавить блок", "Add block")}
      </Button>
      {open && (
        <div
          className="absolute z-30 mt-2 w-56 rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-black/10 dark:ring-white/10 shadow-2xl overflow-hidden"
          onMouseLeave={() => setOpen(false)}
        >
          {items.map((it) => (
            <button
              key={it.type}
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => { onAdd(it.type); setOpen(false); }}
            >
              {it.icon}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Редактор одного блока ─── */
const BlockCard = ({
  block, index, total, onChange, onRemove, onMove, onDragStart, onDragOver, onDrop,
}: {
  block: BlogBlock; index: number; total: number;
  onChange: (b: BlogBlock) => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) => {
  const update = (patch: Partial<BlogBlock>) =>
    onChange({ ...block, ...patch } as BlogBlock);

  return (
    <div
      className="rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 mb-3">
        <GripVertical size={16} className="text-gray-400 cursor-grab" />
        <Badge className="text-eyebrow">{block.type}</Badge>
        <div className="flex-1" />
        <button type="button" onClick={() => onMove(-1)} disabled={index === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
          <ArrowUp size={14} />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={index === total - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
          <ArrowDown size={14} />
        </button>
        <button type="button" onClick={onRemove}
          className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40">
          <Trash2 size={14} />
        </button>
      </div>

      {block.type === "heading" && (
        <div className="grid gap-2 sm:grid-cols-[100px_1fr]">
          <select className={inputCls} value={block.level}
            onChange={(e) => update({ level: Number(e.target.value) as 1 | 2 | 3 } as Partial<BlogBlock>)}>
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <input className={inputCls} value={block.text}
            onChange={(e) => update({ text: e.target.value } as Partial<BlogBlock>)} />
        </div>
      )}

      {block.type === "paragraph" && (
        <textarea className={textareaCls} value={block.text}
          onChange={(e) => update({ text: e.target.value } as Partial<BlogBlock>)} />
      )}

      {block.type === "image" && (
        <div className="space-y-2">
          <PictureInput placeholder="URL изображения" value={block.src}
            onChange={(src) => update({ src } as Partial<BlogBlock>)} />
          <input className={inputCls} placeholder="Alt-текст"
            value={block.alt}
            onChange={(e) => update({ alt: e.target.value } as Partial<BlogBlock>)} />
          <input className={inputCls} placeholder="Подпись (опционально)"
            value={block.caption ?? ""}
            onChange={(e) => update({ caption: e.target.value } as Partial<BlogBlock>)} />
          {block.src && (
            <img src={block.src} alt={block.alt} className="mt-2 max-h-40 rounded-xl ring-1 ring-black/10" />
          )}
        </div>
      )}

      {block.type === "quote" && (
        <div className="space-y-2">
          <textarea className={textareaCls} value={block.text}
            onChange={(e) => update({ text: e.target.value } as Partial<BlogBlock>)} />
          <input className={inputCls} placeholder="Автор (опционально)"
            value={block.author ?? ""}
            onChange={(e) => update({ author: e.target.value } as Partial<BlogBlock>)} />
        </div>
      )}

      {block.type === "callout" && (
        <div className="space-y-2">
          <select className={inputCls} value={block.variant}
            onChange={(e) => update({ variant: e.target.value as "info" | "tip" | "warning" } as Partial<BlogBlock>)}>
            <option value="info">info</option>
            <option value="tip">tip</option>
            <option value="warning">warning</option>
          </select>
          <input className={inputCls} placeholder="Заголовок (опционально)"
            value={block.title ?? ""}
            onChange={(e) => update({ title: e.target.value } as Partial<BlogBlock>)} />
          <textarea className={textareaCls} value={block.text}
            onChange={(e) => update({ text: e.target.value } as Partial<BlogBlock>)} />
        </div>
      )}

      {block.type === "divider" && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Визуальный разделитель</p>
      )}
    </div>
  );
};

/* ─── Основной редактор ─── */
const BlogEditor: React.FC<{ id: number }> = ({ id }) => {
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [preview, setPreview] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  // Unsaved edits: leaving asks first
  const [dirty, setDirty] = React.useState(false);
  const dragFrom = React.useRef<number | null>(null);

  React.useEffect(() => {
    setLoading(true);
    api.admin.blogPost(id).then(setPost).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (loading) return <p className="p-6 text-gray-500">Загрузка…</p>;
  if (!post) {
    return <p className="p-6 text-gray-500">Пост не найден. <Link className="text-blue-600" to="/dashboard/blog">Назад</Link></p>;
  }

  const patch = (p: Partial<BlogPost>) => {
    setDirty(true);
    setPost((prev) => prev ? { ...prev, ...p } : prev);
  };

  const save = async (status?: BlogPost["status"]) => {
    if (!post) return;
    setSaving(true);
    setProblem(null);
    try {
      const next = await api.admin.saveBlogPost(post.id, { ...toSave(post), ...(status ? { status } : {}) });
      setPost(next);
      setDirty(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Не получилось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: BlogBlockType) => {
    patch({ blocks: [...post.blocks, makeBlock(type)] });
  };
  const updateBlock = (b: BlogBlock) => {
    patch({ blocks: post.blocks.map((x) => (x.id === b.id ? b : x)) });
  };
  const removeBlock = (bid: string) => {
    patch({ blocks: post.blocks.filter((x) => x.id !== bid) });
  };
  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= post.blocks.length) return;
    const next = post.blocks.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    patch({ blocks: next });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link to="/dashboard/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <ArrowLeft size={14} /> {tr("К постам", "All posts")}
          </Link>
          <div className="flex-1" />
          <button
            type="button" onClick={() => setPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            <Eye size={14} /> {preview ? tr("Редактор", "Editor") : tr("Превью", "Preview")}
          </button>
          <button type="button" onClick={() => save()} disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50">
            <Save size={14} /> {tr("Сохранить", "Save")}{dirty ? " •" : ""}
          </button>
          {post.status === "published" && (
            <button type="button" onClick={() => save("draft")} disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50">
              <X size={14} /> {tr("Снять с публикации", "Unpublish")}
            </button>
          )}
          <button type="button" onClick={() => save("published")} disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm text-white bg-gradient-to-br from-blue-500 to-violet-500 shadow-md hover:brightness-110">
            <CheckCircle2 size={14} /> {tr("Опубликовать", "Publish")}
          </button>
        </div>

        {problem && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-red-500/10 ring-1 ring-red-400/30 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle size={14} /> {problem}
          </div>
        )}

        {saved && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/30 text-emerald-700 dark:text-emerald-300 text-sm">
            {tr("Сохранено", "Saved")}
          </div>
        )}

        {preview ? (
          <article className="max-w-3xl mx-auto">
            <h1 className={cn("text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]", BLOG_HEADING_GRADIENT, "inline-block mb-6")}>
              {post.title || "Без заголовка"}
            </h1>
            {post.coverImage && (
              <div className="mb-6 rounded-[24px] overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                <img src={post.coverImage} alt={post.coverAlt || post.title} className="block w-full h-auto" />
              </div>
            )}
            {post.excerpt && <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">{post.excerpt}</p>}
            {renderBlocks(post.blocks)}
          </article>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl space-y-3">
                <Field label={tr("Заголовок", "Title")}>
                  <input className={inputCls} value={post.title}
                    onChange={(e) => patch({ title: e.target.value, ...(post.publishedAt ? {} : { slug: makeSlug(e.target.value) }) })} />
                </Field>
                <Field label="Slug">
                  <input className={inputCls} value={post.slug}
                    onChange={(e) => patch({ slug: makeSlug(e.target.value) })} />
                </Field>
                <Field label={tr("Краткое описание", "Excerpt")}>
                  <textarea className={textareaCls} value={post.excerpt}
                    onChange={(e) => patch({ excerpt: e.target.value })} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={tr("Автор", "Author")}>
                    <input className={inputCls} value={post.author ?? ""}
                      onChange={(e) => patch({ author: e.target.value })} />
                  </Field>
                  <Field label={tr("Теги (через запятую)", "Tags (comma-separated)")}>
                    <input className={inputCls}
                      value={post.tags.join(", ")}
                      onChange={(e) => patch({ tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
                  </Field>
                </div>
                <Field label={tr("Обложка", "Cover")}>
                  <PictureInput placeholder="https://… или загрузите файл" value={post.coverImage ?? ""}
                    onChange={(coverImage) => patch({ coverImage })} />
                </Field>
                <Field label={tr("Alt обложки", "Cover alt")}>
                  <input className={inputCls} value={post.coverAlt ?? ""}
                    onChange={(e) => patch({ coverAlt: e.target.value })} />
                </Field>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Блоки</h2>
                <AddBlockMenu onAdd={addBlock} />
              </div>

              <div className="space-y-3">
                {post.blocks.map((b, i) => (
                  <BlockCard
                    key={b.id}
                    block={b} index={i} total={post.blocks.length}
                    onChange={updateBlock}
                    onRemove={() => removeBlock(b.id)}
                    onMove={(delta) => moveBlock(i, i + delta)}
                    onDragStart={() => { dragFrom.current = i; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragFrom.current !== null) moveBlock(dragFrom.current, i); dragFrom.current = null; }}
                  />
                ))}
              </div>
            </div>

            {/* SEO-панель */}
            <aside className="space-y-4">
              <div className="rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl">
                <h3 className="font-semibold mb-3">SEO</h3>
                <div className="space-y-3">
                  <Field label="SEO title">
                    <input className={inputCls} value={post.seo.title ?? ""}
                      onChange={(e) => patch({ seo: { ...post.seo, title: e.target.value } })} />
                  </Field>
                  <Field label="SEO description">
                    <textarea className={textareaCls} value={post.seo.description ?? ""}
                      onChange={(e) => patch({ seo: { ...post.seo, description: e.target.value } })} />
                  </Field>
                  <Field label="OG image">
                    <PictureInput placeholder="По умолчанию — обложка" value={post.seo.ogImage ?? ""}
                      onChange={(ogImage) => patch({ seo: { ...post.seo, ogImage } })} />
                  </Field>
                  <Field label="Canonical">
                    <input className={inputCls} value={post.seo.canonical ?? ""}
                      onChange={(e) => patch({ seo: { ...post.seo, canonical: e.target.value } })} />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-xl">
                <h3 className="font-semibold mb-2">Статус</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {post.status === "published" ? "Опубликован" : "Черновик"}
                  {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString()}`}
                </p>
                {post.status === "published" && (
                  <div className="flex flex-col gap-1">
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 dark:text-blue-300 hover:underline">
                      Открыть на сайте
                    </a>
                    <Link to={`/dashboard/blog/${post.id}/stats`} className="text-sm text-blue-600 dark:text-blue-300 hover:underline">
                      Статистика поста
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogEditor;