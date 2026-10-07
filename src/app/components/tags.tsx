import { useState } from "react";
import { api } from "../api/client";
import type { Tag, TagColor } from "../api/types";
import { errorText } from "../lib/format";
import { notifyTagsChanged, useTags } from "../lib/hooks";
import { Icon } from "./icons";
import { useErrorToast } from "./ui";

export const TAG_COLORS: TagColor[] = ["indigo", "blue", "green", "amber", "red", "pink", "violet", "slate"];

export function TagChip({ tag, onRemove }: { tag: Tag; onRemove?: () => void }) {
  return (
    <span className={`tag tag-${tag.color}`}>
      #{tag.name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Удалить тег ${tag.name}`}>
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
        placeholder={tags.length ? "+ новый" : "+ новый тег"}
        aria-label="Новый тег"
        maxLength={40}
        disabled={busy}
      />
    </div>
  );
}
