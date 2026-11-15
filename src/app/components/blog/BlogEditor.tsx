import * as React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Image as ImageIcon,
  Heading2, Quote, Info, Minus, Save, Eye,
  CheckCircle2, AlertTriangle, X, GripVertical, List as ListIcon, Sparkles
} from "lucide-react";
import { Button } from "@/app/components/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { tr } from "@/i18n";
import { api } from "@/app/api/client";
import { makeSlug, newBlockId, toSave } from "@/app/lib/blogApi";
import type { BlogBlock, BlogBlockType, BlogPost, CtaBlock, CtaBgMode, ListBlock } from "@/types/blog";
import { BLOG_HEADING_GRADIENT, renderBlocks } from "./BlogRenderer";
import { createPortal } from "react-dom";
import { BlogCard } from "@/components/landing/BlogCard";

/* ════════════════════════════════════════════════════════════════════
   Общие типы блоков редактора и публичного рендера
   ════════════════════════════════════════════════════════════════════ */

type AnyBlock = BlogBlock;
type BlockType = BlogBlockType;

/* ════════════════════════════════════════════════════════════════════
   Фабрика блоков
   ════════════════════════════════════════════════════════════════════ */

const makeBlock = (type: BlockType): AnyBlock => {
  const id = newBlockId();
  switch (type) {
    case "heading":   return { id, type, level: 2, text: "Заголовок" };
    case "paragraph": return { id, type, text: "Новый текст…" };
    case "image":     return { id, type, src: "", alt: "" };
    case "quote":     return { id, type, text: "Цитата", author: "" };
    case "callout":   return { id, type, variant: "info", title: "", text: "Текст подсказки" };
    case "divider":   return { id, type };
    case "list":      return { id, type: "list", ordered: true, items: [tr("Пункт 1", "Item 1")] };
    case "cta":
  return {
    id,
    type: "cta",
    bgMode: "gradient-blur",
    text: tr("Начать бесплатно", "Start for free"),
    href: "/register",
    icons: undefined,
  };
  }
};

/* ════════════════════════════════════════════════════════════════════
   Программная установка значения textarea (совместимо с React)
   ════════════════════════════════════════════════════════════════════ */

const setNativeTextAreaValue = (el: HTMLTextAreaElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

/* ════════════════════════════════════════════════════════════════════
   Enter → авто-продолжение списков (1., 1.1., -, *, +)
   ════════════════════════════════════════════════════════════════════ */

const handleListContinuation = (
  e: React.KeyboardEvent<HTMLTextAreaElement>
): boolean => {
  if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
    return false;
  }
  const ta = e.currentTarget;
  const value = ta.value;
  const pos = ta.selectionStart;
  if (pos !== ta.selectionEnd) return false;

  const before = value.slice(0, pos);
  const after = value.slice(pos);
  const currentLine = before.split("\n").pop() ?? "";

  const numbered = currentLine.match(/^(\s*)(\d+(?:\.\d+)*)\.(\s+)(.*)$/);
  const bullet   = currentLine.match(/^(\s*)([-*+])(\s+)(.*)$/);
  const m = numbered ?? bullet;
  if (!m) return false;

  const [, indent, marker0, , rest] = m;

  // Пустой пункт → выйти из списка
  if (rest.trim() === "") {
    e.preventDefault();
    const cutFrom = before.length - currentLine.length;
    const newValue = before.slice(0, cutFrom) + after;
    setNativeTextAreaValue(ta, newValue);
    requestAnimationFrame(() => ta.setSelectionRange(cutFrom, cutFrom));
    return true;
  }

  let marker: string;
  if (numbered) {
    const parts = marker0.split(".");
    const last = parseInt(parts[parts.length - 1], 10) + 1;
    parts[parts.length - 1] = String(last);
    marker = parts.join(".") + ".";
  } else {
    marker = marker0;
  }

  e.preventDefault();
  const insertion = "\n" + indent + marker + " ";
  const newValue = before + insertion + after;
  setNativeTextAreaValue(ta, newValue);
  const newPos = pos + insertion.length;
  requestAnimationFrame(() => ta.setSelectionRange(newPos, newPos));
  return true;
};

const TagsInput = ({
  value, onChange, suggestions = [],
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) => {
  const [draft, setDraft] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  const commit = (raw: string) => {
    // Запятая = разделитель, пробелы ВНУТРИ тега сохраняются
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const seen = new Set(value);
    const merged = [...value];
    for (const p of parts) if (!seen.has(p)) { seen.add(p); merged.push(p); }
    onChange(merged);
  };

  const removeAt = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const available = suggestions.filter((s) => !value.includes(s));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200/60 dark:ring-blue-800/50"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/60 p-0.5"
              aria-label={tr("Удалить тег", "Remove tag")}
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>

      <input
        className={inputCls}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          // запятая сразу коммитит, всё до неё — теги
          if (v.includes(",")) {
            const lastComma = v.lastIndexOf(",");
            commit(v.slice(0, lastComma));
            setDraft(v.slice(lastComma + 1));
          } else {
            setDraft(v);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit(draft);
            setDraft("");
          } else if (e.key === "Backspace" && draft === "" && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => {
          commit(draft);
          setDraft("");
          setFocused(false);
        }}
        onFocus={() => setFocused(true)}
        placeholder={tr(
          "Введите тег (можно словосочетание) и нажмите Enter",
          "Type a tag (phrases allowed) and press Enter"
        )}
      />

      {focused && available.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
            {tr("Уже в коллекции:", "Already in collection:")}
          </span>
          {available.map((s) => (
            <button
              key={s}
              type="button"
              // preventDefault — иначе input теряет фокус до click
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onChange([...value, s])}
              className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-700 dark:text-gray-200"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   SmartTextarea — авто-растёт + Enter-континуация списков
   ════════════════════════════════════════════════════════════════════ */

const SmartTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { minRows?: number }
>(({ minRows = 1, className, onChange, onKeyDown, value, ...props }, ref) => {
  const inner = React.useRef<HTMLTextAreaElement | null>(null);
  React.useImperativeHandle(ref, () => inner.current as HTMLTextAreaElement);

  const resize = React.useCallback(() => {
    const el = inner.current;
    if (!el) return;
    el.style.height = "auto";
    const min = minRows * 24 + 24;
    el.style.height = Math.max(min, el.scrollHeight) + "px";
  }, [minRows]);

  React.useLayoutEffect(resize, [value, resize]);

  return (
    <textarea
      {...props}
      ref={inner}
      value={value}
      rows={minRows}
      onChange={(e) => { onChange?.(e); requestAnimationFrame(resize); }}
      onKeyDown={(e) => {
        if (handleListContinuation(e)) return;
        onKeyDown?.(e);
      }}
      className={cn(className, "overflow-hidden")}
    />
  );
});
SmartTextarea.displayName = "SmartTextarea";

/* ════════════════════════════════════════════════════════════════════
   UI-обёртки полей
   ════════════════════════════════════════════════════════════════════ */

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const labelId = React.useId();
  const control = React.isValidElement(children) &&
    (typeof children.type === "string" || children.type === SmartTextarea)
    ? React.cloneElement(children as React.ReactElement<{ "aria-labelledby"?: string }>, { "aria-labelledby": labelId })
    : children;
  return (
    <label className="block">
      <span id={labelId} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</span>
      {control}
    </label>
  );
};

const inputCls =
  "w-full h-10 px-3 rounded-xl text-sm " +
  "bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 " +
  "-xl outline-none focus:ring-blue-400/60 " +
  "text-gray-900 dark:text-white placeholder:text-gray-400";

const textareaCls =
  "w-full min-h-[80px] p-3 rounded-xl text-sm " +
  "bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 " +
  "-xl outline-none focus:ring-blue-400/60 " +
  "text-gray-900 dark:text-white placeholder:text-gray-400";

/* ════════════════════════════════════════════════════════════════════
   Загрузка картинки
   ════════════════════════════════════════════════════════════════════ */

const PictureInput = ({
  value, onChange, placeholder,
}: { value: string; onChange: (url: string) => void; placeholder: string }) => {
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
        <input
          className={inputCls}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <label
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm cursor-pointer " +
            "bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 " +
            "hover:bg-gray-100 dark:hover:bg-white/[0.06]",
            busy && "opacity-50 pointer-events-none"
          )}
        >
          <ImageIcon size={14} /> {busy ? "Загрузка…" : "Загрузить"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <div className="mt-2">
            <img
              src={
                /^(https?:|data:|blob:|\/)/i.test(value.trim())
                  ? value.trim()
                  : "/" + value.trim().replace(/^\.?\//, "")
              }
              alt=""
              className="max-h-40 rounded-xl ring-1 ring-black/10"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                // eslint-disable-next-line no-console
                console.error("[PictureInput] failed to load:", value);
              }}
            />
          </div>
        )}
      </div>
      {problem && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{problem}</p>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Меню добавления блоков
   ════════════════════════════════════════════════════════════════════ */

const AddBlockMenu = ({
  onAdd, compact,
}: { onAdd: (t: BlockType) => void; compact?: boolean }) => {
  const [open, setOpen] = React.useState(false);
  const items: { type: BlockType; label: string; icon: React.ReactNode }[]=[
    { type: "heading",   label: tr("Заголовок", "Heading"),     icon: <Heading2 size={14} /> },
    { type: "paragraph", label: tr("Текст", "Paragraph"),       icon: <Info size={14} /> },
    { type: "list",      label: tr("Список", "List"),           icon: <ListIcon size={14} /> },
    { type: "image",     label: tr("Картинка", "Image"),        icon: <ImageIcon size={14} /> },
    { type: "quote",     label: tr("Цитата", "Quote"),          icon: <Quote size={14} /> },
    { type: "callout",   label: tr("Callout", "Callout"),       icon: <Info size={14} /> },
    { type: "divider",   label: tr("Разделитель", "Divider"),   icon: <Minus size={14} /> },
    { type: "cta", label: tr("Кнопка CTA", "CTA button"), icon: <Sparkles size={14} /> },
  ];
  return (
    <div className="relative inline-block">
      <Button variant="secondary" icon="plus" onClick={() => setOpen((v) => !v)}>
        {compact ? tr("Вложить блок", "Add nested block") : tr("Добавить блок", "Add block")}
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

/* ════════════════════════════════════════════════════════════════════
   Редактор блока «Список»
   ════════════════════════════════════════════════════════════════════ */

const ListBlockEditor = ({
  block, onChange,
}: { block: ListBlock; onChange: (b: ListBlock) => void }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const updateItem = (idx: number, text: string) => {
    const next = block.items.slice();
    next[idx] = text;
    onChange({ ...block, items: next });
  };

  const addItem = (afterIdx: number) => {
    const next = block.items.slice();
    next.splice(afterIdx + 1, 0, "");
    onChange({ ...block, items: next });
    requestAnimationFrame(() => {
      const inputs = containerRef.current?.querySelectorAll<HTMLInputElement>("input[data-list-item]");
      inputs?.[afterIdx + 1]?.focus();
    });
  };

  const removeItem = (idx: number) => {
    if (block.items.length <= 1) return;
    const next = block.items.filter((_, i) => i !== idx);
    onChange({ ...block, items: next });
    requestAnimationFrame(() => {
      const inputs = containerRef.current?.querySelectorAll<HTMLInputElement>("input[data-list-item]");
      inputs?.[Math.max(0, idx - 1)]?.focus();
    });
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={block.ordered}
          onChange={(e) => onChange({ ...block, ordered: e.target.checked })}
        />
        {tr("Нумерованный список", "Ordered list")}
      </label>

      <div ref={containerRef} className="space-y-1.5">
        {block.items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <span className="w-8 text-right text-sm text-gray-400 tabular-nums select-none">
              {block.ordered ? `${idx + 1}.` : "•"}
            </span>
            <input
              data-list-item
              className={inputCls}
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addItem(idx);
                } else if (e.key === "Backspace" && item === "" && block.items.length > 1) {
                  e.preventDefault();
                  removeItem(idx);
                }
              }}
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              disabled={block.items.length <= 1}
              className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => addItem(block.items.length - 1)}
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-300 hover:underline"
      >
        <Plus size={14} /> {tr("Добавить пункт", "Add item")}
      </button>
    </div>
  );
};

const CtaBlockEditor = ({
  block, onChange,
}: { block: CtaBlock; onChange: (b: CtaBlock) => void }) => {
  const update = (patch: Partial<CtaBlock>) => onChange({ ...block, ...patch });
  const bgMode: CtaBgMode =
    block.bgMode ?? (block.variant === "finalcta-mobile" ? "gradient-fade" : "gradient-blur");

  return (
    <div className="space-y-3">
      <Field label={tr("Вариант фона", "Background variant")}>
  <select
    className={inputCls}
    value={bgMode}
    onChange={(e) => update({ bgMode: e.target.value as CtaBgMode })}
  >
    <option value="none">{tr("Без фона (чистая кнопка)", "No background (plain)")}</option>
    <option value="gradient-blur">{tr("Градиентная кнопка", "Gradient button")}</option>
    <option value="custom">{tr("Свой фон / картинка", "Custom bg / image")}</option>
    <option value="gradient-fade">{tr("Градиент с растворением", "Gradient with fade")}</option>
  </select>
</Field>

<Field label={tr("Текст кнопки", "Button text")}>
  <input
    className={inputCls}
    value={block.text}
    onChange={(e) => update({ text: e.target.value })}
  />
</Field>

<Field label={tr("Ссылка", "Link")}>
  <input
    className={inputCls}
    value={block.href}
    onChange={(e) => update({ href: e.target.value })}
    placeholder="/register"
  />
</Field>

{bgMode === "custom" && (
  <>
    <Field label={tr("Цвет фона", "Background color")}>
      <div className="flex gap-2">
        <input
          type="color"
          className="h-10 w-12 rounded-lg ring-1 ring-black/10 dark:ring-white/10 cursor-pointer bg-transparent"
          value={block.bgColor || "#2563eb"}
          onChange={(e) => update({ bgColor: e.target.value })}
        />
        <input
          className={inputCls}
          value={block.bgColor ?? ""}
          onChange={(e) => update({ bgColor: e.target.value })}
          placeholder="#2563eb"
        />
      </div>
    </Field>
    <Field label={tr("Фоновое изображение (необязательно)", "Background image (optional)")}>
      <PictureInput
        placeholder="URL картинки"
        value={block.bgImage ?? ""}
        onChange={(bgImage) => update({ bgImage })}
      />
    </Field>
  </>
)}

{bgMode !== "none" && (
  <Field label={tr("Цвет текста (необязательно)", "Text color (optional)")}>
    <div className="flex gap-2">
      <input
        type="color"
        className="h-10 w-12 rounded-lg ring-1 ring-black/10 dark:ring-white/10 cursor-pointer bg-transparent"
        value={block.textColor || "#ffffff"}
        onChange={(e) => update({ textColor: e.target.value })}
      />
      <input
        className={inputCls}
        value={block.textColor ?? ""}
        onChange={(e) => update({ textColor: e.target.value })}
        placeholder={tr("по умолчанию", "default")}
      />
    </div>
  </Field>
)}

{bgMode === "none" && (
  <Field label={tr("Цвет текста", "Text color")}>
    <div className="flex gap-2">
      <input
        type="color"
        className="h-10 w-12 rounded-lg ring-1 ring-black/10 dark:ring-white/10 cursor-pointer bg-transparent"
        value={block.textColor || "#111827"}
        onChange={(e) => update({ textColor: e.target.value })}
      />
      <input
        className={inputCls}
        value={block.textColor ?? ""}
        onChange={(e) => update({ textColor: e.target.value })}
        placeholder={tr("по умолчанию — цвет темы", "default — theme color")}
      />
    </div>
  </Field>
)}

<div className="grid grid-cols-2 gap-2">
  <Field label={tr("Ширина кнопки, px", "Button width, px")}>
    <input
      type="number"
      min={0}
      className={inputCls}
      value={block.buttonWidth ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        update({ buttonWidth: v === "" ? undefined : Number(v) });
      }}
      placeholder={tr("авто", "auto")}
    />
  </Field>
  <Field label={tr("Высота кнопки, px", "Button height, px")}>
    <input
      type="number"
      min={0}
      className={inputCls}
      value={block.buttonHeight ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        update({ buttonHeight: v === "" ? undefined : Number(v) });
      }}
      placeholder={tr("авто", "auto")}
    />
  </Field>
</div>
      <Field label={tr("Летающие иконки (URL, по одной на строку)", "Floating icons (one image URL per line)")}>
        <textarea className={textareaCls} value={(block.icons ?? []).join("\n")}
          onChange={(e) => update({ icons: e.target.value.split("\n") })} />
      </Field>
    </div>
  );
};

const BlockCard = ({
  block, index, total, depth = 0,
  onChange, onRemove, onMove,
  onDragStart, onDragOver, onDrop,
}: {
  block: AnyBlock;
  index: number;
  total: number;
  depth?: number;
  onChange: (b: AnyBlock) => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) => {
  const update = (patch: Partial<AnyBlock>) =>
    onChange({ ...block, ...patch } as AnyBlock);

  const children = block.children ?? [];

  const addChild = (t: BlockType) => {
    onChange({ ...block, children: [...children, makeBlock(t)] } as AnyBlock);
  };
  const updateChild = (child: AnyBlock) => {
    onChange({
      ...block,
      children: children.map((c) => (c.id === child.id ? child : c)),
    } as AnyBlock);
  };
  const removeChild = (childId: string) => {
    onChange({
      ...block,
      children: children.filter((c) => c.id !== childId),
    } as AnyBlock);
  };
  const moveChild = (from: number, to: number) => {
    if (to < 0 || to >= children.length) return;
    const next = children.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange({ ...block, children: next } as AnyBlock);
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10",
        depth > 0 && "bg-white/40 dark:bg-white/[0.02]"
      )}
      draggable={depth === 0}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Шапка карточки */}
      <div className="flex items-center gap-2 mb-3">
        <GripVertical size={16} className="text-gray-400 cursor-grab" />
        <Badge className="text-eyebrow">{block.type}</Badge>
        <div className="flex-1" />
        <button
          type="button" onClick={() => onMove(-1)} disabled={index === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button" onClick={() => onMove(1)} disabled={index === total - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
        >
          <ArrowDown size={14} />
        </button>
        <button
          type="button" onClick={onRemove}
          className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Поля блока */}
      {block.type === "heading" && (
        <div className="grid gap-2 sm:grid-cols-[100px_1fr]">
          <select
            className={inputCls}
            value={block.level}
            onChange={(e) => update({ level: Number(e.target.value) as 1 | 2 | 3 })}
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
          </select>
          <SmartTextarea
            className={inputCls}
            minRows={1}
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
          />
        </div>
      )}

      {block.type === "paragraph" && (
        <SmartTextarea
          className={textareaCls}
          minRows={3}
          value={block.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder={tr(
            "Текст с поддержкой Markdown: **жирный**, *курсив*, `код`, - списки, 1. номера",
            "Markdown: **bold**, *italic*, `code`, - lists, 1. numbered"
          )}
        />
      )}

      {block.type === "image" && (
        <div className="space-y-2">
          <PictureInput
            placeholder="URL изображения"
            value={block.src}
            onChange={(src) => update({ src })}
          />
          <input
            className={inputCls}
            placeholder="Alt-текст"
            value={block.alt}
            onChange={(e) => update({ alt: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Подпись (опционально)"
            value={block.caption ?? ""}
            onChange={(e) => update({ caption: e.target.value })}
          />
          {block.src && (
            <img
              src={block.src}
              alt={block.alt}
              className="mt-2 max-h-40 rounded-xl ring-1 ring-black/10"
            />
          )}
        </div>
      )}

      {block.type === "quote" && (
        <div className="space-y-2">
          <SmartTextarea
            className={textareaCls}
            minRows={2}
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Автор (опционально)"
            value={block.author ?? ""}
            onChange={(e) => update({ author: e.target.value })}
          />
        </div>
      )}

      {block.type === "callout" && (
        <div className="space-y-2">
          <select
            className={inputCls}
            value={block.variant}
            onChange={(e) => update({ variant: e.target.value as "info" | "tip" | "warning" })}
          >
            <option value="info">info</option>
            <option value="tip">tip</option>
            <option value="warning">warning</option>
          </select>
          <input
            className={inputCls}
            placeholder="Заголовок (опционально)"
            value={block.title ?? ""}
            onChange={(e) => update({ title: e.target.value })}
          />
          <SmartTextarea
            className={textareaCls}
            minRows={2}
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
          />
        </div>
      )}

      {block.type === "divider" && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {tr("Визуальный разделитель", "Visual divider")}
        </p>
      )}

      {block.type === "cta" && (
  <CtaBlockEditor
    block={block as CtaBlock}
    onChange={(b) => onChange(b as AnyBlock)}
  />
)}

      {block.type === "list" && (
        <ListBlockEditor
          block={block}
          onChange={(b) => onChange(b as AnyBlock)}
        />
      )}

            {/* Кнопка «вложить блок» — всегда выше детей */}
      <div className="mt-3">
        <AddBlockMenu onAdd={addChild} compact />
      </div>

      {/* Вложенные блоки */}
      {children.length > 0 && (
        <div className="mt-3 ml-4 pl-3 border-l-2 border-gray-200 dark:border-white/10 space-y-2">
          {children.map((c, i) => (
            <BlockCard
              key={c.id}
              block={c}
              index={i}
              total={children.length}
              depth={depth + 1}
              onChange={updateChild}
              onRemove={() => removeChild(c.id)}
              onMove={(delta) => moveChild(i, i + delta)}
              onDragStart={() => {}}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════
   Preview: рендер блоков с Markdown и вложениями
   ════════════════════════════════════════════════════════════════════ */

const BlogEditor: React.FC<{ id: number }> = ({ id }) => {
  const [post, setPost] = React.useState<BlogPost | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [preview, setPreview] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const dragFrom = React.useRef<number | null>(null);

  const [allTags, setAllTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Пытаемся взять полный админ-список, иначе — публичный
    const load = async () => {
      try {
        const admin = api.admin as any;
        const list: BlogPost[] =
          typeof admin.blogPosts === "function"
            ? await admin.blogPosts()
            : await api.blog.posts();
        const set = new Set<string>();
        (list ?? []).forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
        setAllTags(Array.from(set).sort((a, b) => a.localeCompare(b)));
      } catch {
        setAllTags([]);
      }
    };
    load();
  }, []);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setDirty(false);
    setProblem(null);
    setSaved(false);
    api.admin.blogPost(id)
      .then((next) => { if (active) setPost(next); })
      .catch(() => { if (active) setPost(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (loading) return <p className="p-6 text-gray-500">Загрузка…</p>;
  if (!post) {
    return (
      <p className="p-6 text-gray-500">
        Пост не найден. <Link className="text-blue-600" to="/dashboard/blog">Назад</Link>
      </p>
    );
  }

  const blocks = post.blocks as unknown as AnyBlock[];

  const patch = (p: Omit<Partial<BlogPost>, "blocks"> & { blocks?: AnyBlock[] }) => {
    setDirty(true);
    setPost((prev) =>
      prev ? ({ ...prev, ...p } as unknown as BlogPost) : prev
    );
  };

  const save = async (status?: BlogPost["status"]) => {
    if (!post) return;
    setSaving(true);
    setProblem(null);
    try {
      const next = await api.admin.saveBlogPost(post.id, {
        ...toSave(post),
        ...(status ? { status } : {}),
      });
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

  const addBlock = (type: BlockType) => {
    patch({ blocks: [...blocks, makeBlock(type)] });
  };

  const updateBlock = (b: AnyBlock) => {
    patch({ blocks: blocks.map((x) => (x.id === b.id ? b : x)) });
  };

  const removeBlock = (bid: string) => {
    patch({ blocks: blocks.filter((x) => x.id !== bid) });
  };

  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const next = blocks.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    patch({ blocks: next });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Верхняя панель */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link
            to="/dashboard/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={14} /> {tr("К постам", "All posts")}
          </Link>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            <Eye size={14} /> {preview ? tr("Редактор", "Editor") : tr("Превью", "Preview")}
          </button>
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50"
          >
            <Save size={14} /> {tr("Сохранить", "Save")}{dirty ? " •" : ""}
          </button>
          {post.status === "published" && (
            <button
              type="button"
              onClick={() => save("draft")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-50"
            >
              <X size={14} /> {tr("Снять с публикации", "Unpublish")}
            </button>
          )}
          <button
            type="button"
            onClick={() => save("published")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm text-white bg-gradient-to-br from-blue-500 to-violet-500 shadow-md hover:brightness-110"
          >
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
            <h1
              className={cn(
                "text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]",
                BLOG_HEADING_GRADIENT,
                "inline-block mb-6"
              )}
            >
              {post.title || "Без заголовка"}
            </h1>
            {post.coverImage && (
              <div className="mb-6 rounded-[24px] overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                <img
                  src={post.coverImage}
                  alt={post.coverAlt || post.title}
                  className="block w-full h-auto"
                />
              </div>
            )}
            {post.excerpt && (
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                {post.excerpt}
              </p>
            )}
            {renderBlocks(blocks)}
          </article>
        ) : (
          <fieldset disabled={saving} className="grid min-w-0 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {/* Мета-поля */}
              <div className="rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 -xl space-y-3">
                <Field label={tr("Заголовок", "Title")}>
                  <input
                    className={inputCls}
                    value={post.title}
                    onChange={(e) =>
                      patch({
                        title: e.target.value,
                        ...(post.publishedAt ? {} : { slug: makeSlug(e.target.value) }),
                      })
                    }
                  />
                </Field>
                <Field label="Slug">
                  <input
                    className={inputCls}
                    value={post.slug}
                    onChange={(e) => patch({ slug: makeSlug(e.target.value) })}
                  />
                </Field>
                <Field label={tr("Краткое описание", "Excerpt")}>
                  <SmartTextarea
                    className={textareaCls}
                    minRows={2}
                    value={post.excerpt}
                    onChange={(e) => patch({ excerpt: e.target.value })}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={tr("Автор", "Author")}>
                    <input
                      className={inputCls}
                      value={post.author ?? ""}
                      onChange={(e) => patch({ author: e.target.value })}
                    />
                  </Field>
                  <Field label={tr("Теги", "Tags")}>
  <TagsInput
    value={post.tags}
    onChange={(tags) => patch({ tags })}
    suggestions={allTags}
  />
</Field>
                </div>
                <Field label={tr("Обложка", "Cover")}>
                  <PictureInput
                    placeholder="https://… или загрузите файл"
                    value={post.coverImage ?? ""}
                    onChange={(coverImage) => patch({ coverImage })}
                  />
                </Field>
                <Field label={tr("Alt обложки", "Cover alt")}>
                  <input
                    className={inputCls}
                    value={post.coverAlt ?? ""}
                    onChange={(e) => patch({ coverAlt: e.target.value })}
                  />
                </Field>
              </div>

              {/* Блоки */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Блоки</h2>
                <AddBlockMenu onAdd={addBlock} />
              </div>

              <div className="space-y-3">
                {blocks.map((b, i) => (
                  <BlockCard
                    key={b.id}
                    block={b}
                    index={i}
                    total={blocks.length}
                    onChange={updateBlock}
                    onRemove={() => removeBlock(b.id)}
                    onMove={(delta) => moveBlock(i, i + delta)}
                    onDragStart={() => { dragFrom.current = i; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragFrom.current !== null) moveBlock(dragFrom.current, i);
                      dragFrom.current = null;
                    }}
                  />
                ))}
              </div>
            </div>

            {/* SEO-панель */}
            <aside className="space-y-4">
              <div id="landing-card" className="rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 space-y-3">
                <h3 className="font-semibold">{tr("Карточка на главной", "Landing page card")}</h3>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={post.landing?.enabled ?? false}
                    onChange={(e) => patch({ landing: { position: 0, ...post.landing, enabled: e.target.checked } })} />
                  {tr("Показывать на главной", "Show on landing page")}
                </label>
                <p className="text-xs text-gray-500">{tr("На главной видны только опубликованные статьи. Пустые поля используют данные статьи. Меньший номер показывается первым.", "Only published articles appear. Empty fields use article details. Lower positions appear first.")}</p>
                <Field label={tr("Порядок", "Position")}>
                  <input type="number" min={0} max={10000} className={inputCls} value={post.landing?.position ?? 0}
                    onChange={(e) => patch({ landing: { enabled: false, ...post.landing, position: Number(e.target.value) } })} />
                </Field>
                {([
                  ["title", tr("Заголовок карточки", "Card title")],
                  ["description", tr("Описание карточки", "Card description")],
                  ["caption", tr("Подпись / категория", "Caption / category")],
                  ["imageAlt", tr("Описание изображения", "Image alt text")],
                  ["linkText", tr("Текст ссылки", "Link text")],
                ] as const).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <SmartTextarea className={textareaCls} value={post.landing?.[key] ?? ""}
                      onChange={(e) => patch({ landing: { enabled: false, position: 0, ...post.landing, [key]: e.target.value } })} />
                  </Field>
                ))}
                <Field label={tr("Изображение карточки", "Card image")}>
                  <PictureInput value={post.landing?.image ?? ""} placeholder={tr("По умолчанию — обложка", "Defaults to article cover")}
                    onChange={(image) => patch({ landing: { enabled: false, position: 0, ...post.landing, image } })} />
                </Field>
                <a href="/#blog" className="text-sm text-blue-600 dark:text-blue-300">{tr("Открыть главную", "Open landing page")}</a>
                <BlogCard post={post} preview />
              </div>
              <div className="rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 -xl">
                <h3 className="font-semibold mb-3">SEO</h3>
                <div className="space-y-3">
                  <Field label="SEO title">
                    <input
                      className={inputCls}
                      value={post.seo.title ?? ""}
                      onChange={(e) => patch({ seo: { ...post.seo, title: e.target.value } })}
                    />
                  </Field>
                  <Field label="SEO description">
                    <textarea
                      className={textareaCls}
                      value={post.seo.description ?? ""}
                      onChange={(e) => patch({ seo: { ...post.seo, description: e.target.value } })}
                    />
                  </Field>
                  <Field label="OG image">
                    <PictureInput
                      placeholder="По умолчанию — обложка"
                      value={post.seo.ogImage ?? ""}
                      onChange={(ogImage) => patch({ seo: { ...post.seo, ogImage } })}
                    />
                  </Field>
                  <Field label="Canonical">
                    <input
                      className={inputCls}
                      value={post.seo.canonical ?? ""}
                      onChange={(e) => patch({ seo: { ...post.seo, canonical: e.target.value } })}
                    />
                  </Field>
                </div>
              </div>

              <div className="rounded-2xl p-4 bg-white/70 dark:bg-white/[0.04] ring-1 ring-black/5 dark:ring-white/10 -xl">
                <h3 className="font-semibold mb-2">Статус</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {post.status === "published" ? "Опубликован" : "Черновик"}
                  {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString()}`}
                </p>
                {post.status === "published" && (
                  <div className="flex flex-col gap-1">
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-300 hover:underline"
                    >
                      Открыть на сайте
                    </a>
                    <Link
                      to={`/dashboard/blog/${post.id}/stats`}
                      className="text-sm text-blue-600 dark:text-blue-300 hover:underline"
                    >
                      Статистика поста
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </fieldset>
        )}
      </div>
    </div>
  );
};

export default BlogEditor;
