import { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { Icon } from "./icons";
import { Button, useErrorToast, useToast } from "./ui";
import { errorText } from "../lib/format";
import { GlassCard } from "@/components/dashboard/glass";
import { cn } from "@/utils/cn";
import { tr } from "@/i18n";

/**
 * «Перенос из чатов с нейросетями» (it used to be an onboarding step): links to chats with ChatGPT, Claude,
 * Gemini and others, with the areas and kinds of notes Deyla may take and a comment. They are kept in the
 * profile (`aiChatSources`), and the assistant sees the topics and the comment when it plans.
 */

export type AiChatSource = {
  id: string;
  url: string;
  spheres: string[];
  notes: string[];
  comment: string;
};

const NOTE_KINDS: { id: string; label: string }[] = [
  { id: "goals", label: tr("Цели и планы", "Goals and plans") },
  { id: "personal", label: tr("Личные обстоятельства", "Personal circumstances") },
  { id: "constraints", label: tr("Ограничения и запреты", "Limits and no-gos") },
];

const CUSTOM_NOTE_PREFIX = "custom:";
const MAX_SOURCES = 20;

const isCustomNote = (id: string) => id.startsWith(CUSTOM_NOTE_PREFIX);
const labelForNote = (id: string) =>
  isCustomNote(id) ? id.slice(CUSTOM_NOTE_PREFIX.length) : NOTE_KINDS.find((n) => n.id === id)?.label ?? id;

const KNOWN_HOSTS: Record<string, string> = {
  "chat.openai.com": "ChatGPT",
  "chatgpt.com": "ChatGPT",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "bard.google.com": "Gemini",
  "chat.deepseek.com": "DeepSeek",
  "yandex.ru": "YandexGPT",
  "alice.yandex.ru": "Алиса",
  "giga.chat": "GigaChat",
  "gigachat.devices.sberbank.ru": "GigaChat",
  "copilot.microsoft.com": "Copilot",
};

const hostFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const isValidHttpUrl = (value: string) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const chipClass = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1 h-7 px-3 rounded-full text-xs font-medium leading-none transition-all ring-1",
    active
      ? "bg-violet-500/20 ring-violet-400/50 text-violet-800 dark:text-violet-200"
      : "bg-white/[0.04] dark:bg-white/[0.02] ring-white/30 dark:ring-white/10 text-gray-600 dark:text-gray-300 hover:bg-white/10"
  );

const FIELD =
  "w-full h-9 px-3 text-sm rounded-lg bg-white/[0.05] dark:bg-white/[0.02] ring-1 ring-white/20 dark:ring-white/10 " +
  "outline-none focus:ring-sky-400/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500";

function profileOf(user: { profile?: Record<string, unknown> } | null | undefined): Record<string, unknown> {
  return user?.profile && typeof user.profile === "object" ? user.profile : {};
}

export function AiChatTransfer() {
  const { user, reload } = useAuth();
  const toast = useToast();
  const reportError = useErrorToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const profile = profileOf(user);
  const sources = (Array.isArray(profile.aiChatSources) ? profile.aiChatSources : []) as AiChatSource[];
  const spheres = (Array.isArray(profile.spheres) ? profile.spheres : [])
    .map((item) => (item && typeof item === "object" ? String((item as { name?: unknown }).name ?? "") : ""))
    .filter(Boolean);

  const save = async (next: AiChatSource[], message: string) => {
    setSaving(true);
    try {
      await api.me.saveOnboarding({ ...profile, aiChatSources: next });
      await reload();
      setEditingId(null);
      toast(message);
      return true;
    } catch (error) {
      reportError(errorText(error));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const upsert = (source: AiChatSource) => {
    const exists = sources.some((item) => item.id === source.id);
    const next = exists ? sources.map((item) => (item.id === source.id ? source : item)) : [...sources, source];
    return save(next, exists ? tr("Источник сохранён", "Source saved") : tr("Чат добавлен — Deyla учтёт его", "Chat added — Deyla will take it into account"));
  };

  const remove = (id: string) =>
    save(sources.filter((item) => item.id !== id), tr("Источник удалён", "Source removed"));

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden="true"
          className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center bg-violet-500/15 ring-1 ring-violet-400/40 text-violet-700 dark:text-violet-300"
        >
          <Icon name="assistant" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">
            {tr("Перенос из чатов с нейросетями", "Bring over chats with other AIs")}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">ChatGPT, Claude, Gemini, DeepSeek, GigaChat…</p>
        </div>
      </div>

      <p className="mb-2 text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
        {tr(
          "Вы уже рассказывали другому ассистенту о своих целях и планах? Пришлите ссылку на чат и коротко напишите, что из него важно, — Deyla учтёт это, когда будет планировать.",
          "Already told another assistant about your goals and plans? Share the chat link and say briefly what matters in it — Deyla will take it into account when planning."
        )}
      </p>
      <p className="mb-3 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
        {tr(
          "Ссылка: в чате нажмите «Поделиться» → «Скопировать ссылку». Deyla не станет использовать то, что вы не отметили.",
          "The link: in the chat press “Share” → “Copy link”. Deyla won't use anything you haven't ticked."
        )}
      </p>

      {sources.length > 0 && (
        <ul className="mb-3 space-y-2">
          {sources.map((source) =>
            editingId === source.id ? (
              <li key={source.id}>
                <SourceForm initial={source} spheres={spheres} busy={saving} onCancel={() => setEditingId(null)} onSave={upsert} />
              </li>
            ) : (
              <li key={source.id}>
                <SourceCard source={source} busy={saving} onEdit={() => setEditingId(source.id)} onRemove={() => remove(source.id)} />
              </li>
            )
          )}
        </ul>
      )}

      {editingId === null && sources.length < MAX_SOURCES && (
        <SourceForm initial={null} spheres={spheres} busy={saving} onSave={upsert} />
      )}
    </GlassCard>
  );
}

function SourceCard({
  source,
  busy,
  onEdit,
  onRemove,
}: {
  source: AiChatSource;
  busy: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const host = hostFromUrl(source.url);
  const topics = [...source.spheres, ...source.notes.map(labelForNote)];

  return (
    <div className="relative rounded-xl p-3 bg-violet-500/[0.06] ring-1 ring-violet-400/25">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{KNOWN_HOSTS[host] ?? host}</span>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-violet-700 dark:text-violet-300 hover:underline truncate max-w-[220px]"
              title={source.url}
            >
              {host}
            </a>
          </div>
          {topics.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {topics.map((topic) => (
                <span key={topic} className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-400/30">
                  {topic}
                </span>
              ))}
            </div>
          )}
          {source.comment.trim() ? (
            <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 italic">{tr("«", "“")}{source.comment.trim()}{tr("»", "”")}</p>
          ) : (
            topics.length === 0 && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {tr("Без уточнений — допишите, что из чата важно.", "No details yet — add what matters in the chat.")}
              </p>
            )
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <Button size="sm" variant="ghost" icon="settings" aria-label={tr("Изменить источник", "Edit source")} disabled={busy} onClick={onEdit} />
          <Button size="sm" variant="ghost" icon="trash" aria-label={tr("Удалить источник", "Remove source")} disabled={busy} onClick={onRemove} />
        </div>
      </div>
    </div>
  );
}

function SourceForm({
  initial,
  spheres,
  busy,
  onCancel,
  onSave,
}: {
  initial: AiChatSource | null;
  spheres: string[];
  busy: boolean;
  onCancel?: () => void;
  onSave: (source: AiChatSource) => Promise<boolean>;
}) {
  const [url, setUrl] = useState(initial?.url ?? "");
  const [pickedSpheres, setPickedSpheres] = useState<string[]>(initial?.spheres ?? []);
  const [pickedNotes, setPickedNotes] = useState<string[]>(initial?.notes ?? []);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [custom, setCustom] = useState("");
  const [showDetails, setShowDetails] = useState(Boolean(initial));
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const addCustom = () => {
    const value = custom.trim().slice(0, 40);
    setCustom("");
    if (!value) return;
    const id = `${CUSTOM_NOTE_PREFIX}${value}`;
    setPickedNotes((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const submit = async () => {
    const trimmed = url.trim();
    if (!isValidHttpUrl(trimmed)) {
      setError(tr("Вставьте полную ссылку, начинающуюся с https://", "Paste the full link starting with https://"));
      return;
    }
    setError(null);
    const saved = await onSave({
      id: initial?.id ?? newId(),
      url: trimmed.slice(0, 500),
      spheres: pickedSpheres,
      notes: pickedNotes,
      comment: comment.trim().slice(0, 500),
    });
    if (saved && !initial) {
      setUrl("");
      setPickedSpheres([]);
      setPickedNotes([]);
      setComment("");
      setShowDetails(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          placeholder="https://chatgpt.com/share/..."
          aria-label={tr("Ссылка на чат с нейросетью", "Link to an AI chat")}
          className={FIELD}
        />
        {error && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>

      {!showDetails ? (
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline"
        >
          {tr("Уточнить, что Deyla может взять", "Specify what Deyla may take")}
        </button>
      ) : (
        <div className="space-y-3 pt-1 border-t border-violet-400/20">
          {spheres.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label={tr("Сферы", "Areas")}>
              {spheres.map((name) => (
                <button key={name} type="button" aria-pressed={pickedSpheres.includes(name)} onClick={() => setPickedSpheres((prev) => toggle(prev, name))} className={chipClass(pickedSpheres.includes(name))}>
                  {name}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {NOTE_KINDS.map((note) => (
              <button key={note.id} type="button" aria-pressed={pickedNotes.includes(note.id)} onClick={() => setPickedNotes((prev) => toggle(prev, note.id))} className={chipClass(pickedNotes.includes(note.id))}>
                {note.label}
              </button>
            ))}
            {pickedNotes.filter(isCustomNote).map((id) => (
              <button key={id} type="button" aria-pressed title={tr("Убрать", "Remove")} onClick={() => setPickedNotes((prev) => prev.filter((x) => x !== id))} className={chipClass(true)}>
                {labelForNote(id)} <Icon name="close" size={11} />
              </button>
            ))}
            <input
              type="text"
              value={custom}
              maxLength={40}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              onBlur={addCustom}
              placeholder={tr("+ своя тема", "+ your own topic")}
              aria-label={tr("Своя тема", "Your own topic")}
              className="h-7 w-32 px-3 rounded-full text-xs bg-white/[0.06] dark:bg-white/[0.02] ring-1 ring-dashed ring-violet-400/40 outline-none text-gray-900 dark:text-white placeholder:text-violet-700/70 dark:placeholder:text-violet-300/70"
            />
          </div>
          <textarea
            value={comment}
            maxLength={500}
            rows={2}
            onChange={(e) => setComment(e.target.value)}
            placeholder={tr("Что из этого чата важно: например, «готовлюсь к IELTS к марту, по вечерам занят»", "What matters in this chat: e.g. “preparing for IELTS by March, busy in the evenings”")}
            aria-label={tr("Комментарий к чату", "A note about the chat")}
            className={cn(FIELD, "h-auto py-2 resize-none")}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>
            {tr("Отмена", "Cancel")}
          </Button>
        )}
        <Button size="sm" variant="primary" icon={initial ? "check" : "plus"} busy={busy} disabled={!url.trim()} onClick={() => void submit()}>
          {initial ? tr("Сохранить", "Save") : tr("Добавить чат", "Add chat")}
        </Button>
      </div>
    </div>
  );
}
