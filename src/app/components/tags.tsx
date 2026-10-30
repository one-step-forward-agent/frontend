import { useState } from "react";
import { api } from "../api/client";
import type { Tag, TagColor } from "../api/types";
import { errorText } from "../lib/format";
import { notifyTagsChanged, useTags } from "../lib/hooks";
import { Icon } from "./icons";
import { useErrorToast } from "./ui";
import { tr } from "@/i18n";

export const TAG_COLORS: TagColor[] = ["indigo", "blue", "green", "amber", "red", "pink", "violet", "slate"];

const COLOR_NAMES: Record<TagColor, string> = {
  indigo: tr("Индиго", "Indigo"),
  blue: tr("Синий", "Blue"),
  green: tr("Зелёный", "Green"),
  amber: tr("Янтарный", "Amber"),
  red: tr("Красный", "Red"),
  pink: tr("Розовый", "Pink"),
  violet: tr("Фиолетовый", "Violet"),
  slate: tr("Серый", "Grey"),
};

/** How a task is coloured in the calendar: its own colour fills it, a tag only marks its edge. */
export function taskColor(event: { color?: TagColor | null; tag_ids?: number[] }, tagsById: Map<number, Tag>): { className?: string; own: boolean } {
  if (event.color) return { className: `tag-${event.color}`, own: true };
  const tag = event.tag_ids?.map((id) => tagsById.get(id)).find(Boolean);
  return { className: tag ? `tag-${tag.color}` : undefined, own: false };
}

/** The task's colour in its form: none (the usual) or one of the tag palette. */
export function ColorPicker({ value, onChange }: { value: TagColor | null; onChange: (color: TagColor | null) => void }) {
  const swatch = "w-7 h-7 rounded-full inline-flex items-center justify-center ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-shadow";
  return (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={tr("Цвет задачи", "Task colour")}>
      <button
        type="button"
        role="radio"
        aria-checked={value === null}
        title={tr("Без цвета", "No colour")}
        onClick={() => onChange(null)}
        className={`${swatch} border border-dashed border-gray-400 text-gray-500 ${value === null ? "ring-2 ring-sky-500" : ""}`}
      >
        <Icon name="close" size={12} />
      </button>
      {TAG_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          title={COLOR_NAMES[color]}
          aria-label={COLOR_NAMES[color]}
          onClick={() => onChange(color)}
          className={`tag-${color} ${swatch} ${value === color ? "ring-2 ring-[var(--dot)]" : ""}`}
          style={{ background: "var(--dot)" }}
        >
          {value === color && <Icon name="check" size={13} className="text-white" />}
        </button>
      ))}
    </div>
  );
}

export function TagChip({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span className={`tag tag-${tag.color}`}>
      #{tag.name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`${tr("Удалить тег", "Remove tag")} ${tag.name}`}>
          <Icon name="close" size={12} />
        </button>
      )}
    </span>
  );
}

/** Теги задачи по их id; неизвестные (удалённые) пропускаются. */
export function TagList({ ids }: { ids: number[] | undefined }) {
  const { byId } = useTags();
  const tags = (ids ?? []).map((id) => byId.get(id)).filter((tag): tag is Tag => !!tag);
  if (!tags.length) return null;
  return (
    <span className="tag-list">
      {tags.map((tag) => (
        <TagChip key={tag.id} tag={tag} />
      ))}
    </span>
  );
}

/** Выбор тегов в форме задачи; новый тег можно создать прямо здесь. */
export function TagPicker({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const { tags } = useTags();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  const create = async (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    const clean = name.trim().replace(/^#/, "");
    if (!clean) return;
    const existing = tags.find((tag) => tag.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      if (!value.includes(existing.id)) onChange([...value, existing.id]);
      setName("");
      return;
    }
    setBusy(true);
    try {
      const tag = await api.tags.create({ name: clean, color: TAG_COLORS[tags.length % TAG_COLORS.length] });
      notifyTagsChanged([...tags, tag]);
      onChange([...value, tag.id]);
      setName("");
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tag-picker">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className={`tag tag-${tag.color} tag-toggle ${value.includes(tag.id) ? "active" : ""}`}
          aria-pressed={value.includes(tag.id)}
          onClick={() => toggle(tag.id)}
        >
          #{tag.name}
        </button>
      ))}
      <input
        className="tag-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") create(e);
        }}
        onBlur={() => name.trim() && create()}
        placeholder={tags.length ? tr("+ новый", "+ new") : tr("+ новый тег", "+ new tag")}
        aria-label={tr("Новый тег", "New tag")}
        maxLength={40}
        disabled={busy}
      />
    </div>
  );
}
