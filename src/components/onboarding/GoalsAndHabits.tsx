// src/components/onboarding/GoalsAndHabits.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Target, Sparkles, Trophy, Rocket, Heart, Star, Flag, Flame,
  Plus, X, Lightbulb, GripVertical, ChevronUp, ChevronDown,
  Link2, MessageSquare, Brain, Trash2, Pencil, Shield, Info,
  type LucideIcon,
} from "lucide-react";

import { OnboardingLayout } from "./OnboardingLayout";
import { useOnboarding, type Sphere } from "./OnboardingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";

const TOTAL = 10;

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_BODY_VIOLET =
  "bg-violet-500/[0.06] dark:bg-violet-400/[0.03] backdrop-blur-xl " +
  "ring-1 ring-violet-400/30 dark:ring-violet-400/15 " +
  "shadow-[0_4px_24px_rgba(139,92,246,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]";

const GLASS_SHEEN =
  "pointer-events-none absolute inset-0 rounded-2xl " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const GLASS_SHEEN_PILL =
  "pointer-events-none absolute inset-0 rounded-full " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

/* ─── Визуальные стили для целей ────────────────────────── */
type GoalVisual = {
  icon: LucideIcon;
  tint: string;
  tintSoft: string;
  tintRing: string;
};

const GOAL_VISUALS: GoalVisual[] = [
  { icon: Target,   tint: "text-blue-600 dark:text-blue-300",       tintSoft: "bg-blue-500/15 dark:bg-blue-400/15",       tintRing: "ring-blue-400/40 dark:ring-blue-400/30" },
  { icon: Sparkles, tint: "text-violet-600 dark:text-violet-300",   tintSoft: "bg-violet-500/15 dark:bg-violet-400/15",   tintRing: "ring-violet-400/40 dark:ring-violet-400/30" },
  { icon: Trophy,   tint: "text-amber-600 dark:text-amber-300",     tintSoft: "bg-amber-500/15 dark:bg-amber-400/15",     tintRing: "ring-amber-400/40 dark:ring-amber-400/30" },
  { icon: Rocket,   tint: "text-cyan-600 dark:text-cyan-300",       tintSoft: "bg-cyan-500/15 dark:bg-cyan-400/15",       tintRing: "ring-cyan-400/40 dark:ring-cyan-400/30" },
  { icon: Heart,    tint: "text-pink-600 dark:text-pink-300",       tintSoft: "bg-pink-500/15 dark:bg-pink-400/15",       tintRing: "ring-pink-400/40 dark:ring-pink-400/30" },
  { icon: Star,     tint: "text-yellow-600 dark:text-yellow-300",   tintSoft: "bg-yellow-500/15 dark:bg-yellow-400/15",   tintRing: "ring-yellow-400/40 dark:ring-yellow-400/30" },
  { icon: Flag,     tint: "text-emerald-600 dark:text-emerald-300", tintSoft: "bg-emerald-500/15 dark:bg-emerald-400/15", tintRing: "ring-emerald-400/40 dark:ring-emerald-400/30" },
  { icon: Flame,    tint: "text-rose-600 dark:text-rose-300",       tintSoft: "bg-rose-500/15 dark:bg-rose-400/15",       tintRing: "ring-rose-400/40 dark:ring-rose-400/30" },
];

const visualForGoal = (text: string): GoalVisual => {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0;
  }
  return GOAL_VISUALS[h % GOAL_VISUALS.length];
};

/* ─── Подсказки по сферам ───────────────────────────────── */
const SUGGESTIONS_BY_SPHERE: Record<string, string[]> = {
  "Работа": ["Наладить work-life balance", "Прокачать навык для карьеры", "Вести рабочий дневник"],
  "Учёба": ["Учиться 1 час в день", "Проходить новый курс каждую неделю", "Конспектировать прочитанное"],
  "Спорт": ["Заниматься спортом 3 раза в неделю", "Делать зарядку по утрам", "Пробегать 5 км"],
  "Языки": ["Учить английский по 20 минут", "Учить 10 новых слов в день", "Смотреть сериалы в оригинале"],
  "Здоровье": ["Спать 8 часов", "Пить 2 литра воды", "Медитировать"],
  "Дом и быт": ["Убираться 15 минут в день", "Готовить дома", "Разобрать шкаф"],
  "Отдых": ["Больше гулять", "Читать перед сном", "Устраивать выходные без экрана"],
  "Отношения": ["Проводить время с близкими", "Звонить родителям раз в неделю", "Писать друзьям"],
  "Саморазвитие": ["Читать каждый день", "Вести дневник", "Рано вставать"],
  "Хобби": ["Рисовать", "Играть на гитаре", "Учиться фотографии"],
};

const FALLBACK_SUGGESTIONS = [
  "Больше гулять", "Читать каждый день", "Рано вставать",
  "Медитировать", "Заниматься спортом 3 раза в неделю", "Учить английский по 20 минут",
];

/* ─── Источники из чатов с нейросетями ─────────────────── */

type AiChatSource = {
  id: string;
  url: string;
  spheres: string[];   // sphere names
  notes: string[];     // note kind ids
  comment: string;
};

const NOTE_KINDS: { id: string; label: string }[] = [
  { id: "goals",         label: "Цели и планы" },
  { id: "personal",      label: "Личные обстоятельства" },
  { id: "constraints",   label: "Ограничения и запреты" },
];

const CUSTOM_NOTE_PREFIX = "custom:";

const isCustomNote = (id: string): boolean =>
  id.startsWith(CUSTOM_NOTE_PREFIX);

const customNoteText = (id: string): string =>
  isCustomNote(id) ? id.slice(CUSTOM_NOTE_PREFIX.length) : "";

const labelForNote = (id: string): string => {
  if (isCustomNote(id)) return customNoteText(id);
  return NOTE_KINDS.find((n) => n.id === id)?.label ?? id;
};

const makeCustomNoteId = (text: string): string =>
  `${CUSTOM_NOTE_PREFIX}${text}`;

const KNOWN_HOSTS: Record<string, string> = {
  "chat.openai.com": "ChatGPT",
  "chatgpt.com": "ChatGPT",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "bard.google.com": "Gemini",
  "chat.deepseek.com": "DeepSeek",
  "yandex.ru": "YandexGPT",
  "gigachat.devices.sberbank.ru": "GigaChat",
  "copilot.microsoft.com": "Copilot",
};

const hostFromUrl = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const labelForHost = (host: string): string => KNOWN_HOSTS[host] ?? host;

const isValidHttpUrl = (value: string): boolean => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ─── Утилиты перестановки ─────────────────────────────── */
const reorder = (list: string[], from: number, to: number): string[] => {
  if (from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

const move = (list: string[], index: number, delta: number): string[] => {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
};

/* ─── Компонент ─────────────────────────────────────────── */

export const GoalsAndHabits: React.FC = () => {
  const navigate = useNavigate();
  const { data, update } = useOnboarding();

  /* ─── Цели ─────────────────────────────────────────── */
  const [goal, setGoal] = React.useState("");
  const [goals, setGoals] = React.useState<string[]>(data.goals);

  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null);
  const [overIdx, setOverIdx] = React.useState<number | null>(null);

  /* ─── Источники ─────────────────────────────────────── */
  const [sources, setSources] = React.useState<AiChatSource[]>(
    ((data as unknown as { aiChatSources?: AiChatSource[] }).aiChatSources) ?? []
  );
  const [editingId, setEditingId] = React.useState<string | null>(null);

  /* ─── Подсказки под выбранные сферы ─────────────────── */
  const selectedSpheres: Sphere[] = data.spheres ?? [];

  const suggestions = React.useMemo<string[]>(() => {
    const picked = selectedSpheres.flatMap(
      (s: Sphere) => SUGGESTIONS_BY_SPHERE[s.name] ?? []
    );
    const pool = picked.length > 0 ? picked : FALLBACK_SUGGESTIONS;
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of pool) {
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
      if (out.length >= 8) break;
    }
    return out;
  }, [selectedSpheres]);

  /* ─── Работа с целями ───────────────────────────────── */
  const addGoal = (value?: string) => {
    const v = (value ?? goal).trim();
    if (!v) return;
    if (goals.some((g) => g.toLowerCase() === v.toLowerCase())) {
      setGoal("");
      return;
    }
    setGoals((prev) => [...prev, v]);
    setGoal("");
  };

  const removeGoal = (value: string) => {
    setGoals((prev) => prev.filter((g) => g !== value));
  };

  /* ─── Навигация ─────────────────────────────────────── */
  const persist = (goalsValue: string[], sourcesValue: AiChatSource[]) => {
    update("goals", goalsValue);
    // aiChatSources должно быть зарегистрировано в OnboardingContext
    update("aiChatSources" as never, sourcesValue as never);
  };

  const handleNext = () => {
    persist(goals, sources);
    navigate("/onboarding/existing-plans");
  };

  const handleSkip = () => {
    persist([], []);
    navigate("/onboarding/existing-plans");
  };

  /* ─── Работа с источниками ──────────────────────────── */
  const upsertSource = (next: AiChatSource) => {
    setSources((prev) => {
      const i = prev.findIndex((s) => s.id === next.id);
      if (i === -1) return [...prev, next];
      const copy = [...prev];
      copy[i] = next;
      return copy;
    });
    setEditingId(null);
  };

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  /* ─── Drag&Drop для целей ───────────────────────────── */
  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (idx !== overIdx) setOverIdx(idx);
  };
  const onDragLeave = () => setOverIdx(null);
  const onDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const from = draggingIdx ?? Number(e.dataTransfer.getData("text/plain"));
    if (Number.isFinite(from) && from !== idx) {
      setGoals((prev) => reorder(prev, from, idx));
    }
    setDraggingIdx(null);
    setOverIdx(null);
  };
  const onDragEnd = () => {
    setDraggingIdx(null);
    setOverIdx(null);
  };

  return (
    <OnboardingLayout
      step={4}
      totalSteps={TOTAL}
      title="Что Dayla может о вас узнать?"
      onBack={() => navigate("/onboarding/field-of-activity")}
      onNext={handleNext}
      onSkip={handleSkip}
      nextLabel={`Далее${goals.length > 0 ? ` · ${goals.length}` : ""}`}
    >
      <div className="relative space-y-8">
        {/* ═══════════════════════════════════════════════ */}
        {/* 2. ИСТОЧНИКИ ИЗ ЧАТОВ С НЕЙРОСЕТЯМИ             */}
        {/* ═══════════════════════════════════════════════ */}
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "relative inline-flex items-center gap-1.5 overflow-hidden",
                "px-2.5 py-1 rounded-full",
                GLASS_BODY_VIOLET,
                "text-[11px] uppercase tracking-widest font-medium",
                "text-violet-700 dark:text-violet-300"
              )}
            >
              <span aria-hidden="true" className={GLASS_SHEEN_PILL} />
              <Brain size={11} aria-hidden="true" className="relative" />
              <span className="relative">Персонализация</span>
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
            Пришлите ссылки на чаты с ChatGPT, Claude, Gemini или другими ассистентами
          </p>

          {/* Плашка про приватность */}
          <div
            className={cn(
              "mt-4 relative overflow-hidden rounded-2xl p-3.5 sm:p-4",
              GLASS_BODY
            )}
          >
            <span aria-hidden="true" className={GLASS_SHEEN} />
            <div className="relative flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
                  "bg-emerald-500/15 ring-1 ring-emerald-400/40",
                  "text-emerald-700 dark:text-emerald-300"
                )}
              >
                <Shield size={16} />
              </span>
              <div className="min-w-0 flex-1 allign-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Dayla не станет читать то, что вы не отметили.
                </p>
              </div>
            </div>
          </div>

          {/* Список источников */}
          {sources.length > 0 && (
            <ul className="mt-4 space-y-2.5">
              {sources.map((src) => {
                if (editingId === src.id) {
                  return (
                    <li key={src.id}>
                      <SourceForm
                        initial={src}
                        spheres={selectedSpheres}
                        onCancel={() => setEditingId(null)}
                        onSave={upsertSource}
                      />
                    </li>
                  );
                }
                return (
                  <li key={src.id}>
                    <SourceCard
                      source={src}
                      onEdit={() => setEditingId(src.id)}
                      onRemove={() => removeSource(src.id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {/* Форма добавления */}
          {editingId === null && (
            <div className="mt-4">
              <SourceForm
                initial={null}
                spheres={selectedSpheres}
                onCancel={() => {}}
                onSave={upsertSource}
              />
            </div>
          )}
        </section>
      </div>
    </OnboardingLayout>
  );
};

/* ─── Карточка источника ────────────────────────────────── */

const SourceCard: React.FC<{
  source: AiChatSource;
  onEdit: () => void;
  onRemove: () => void;
}> = ({ source, onEdit, onRemove }) => {
  const host = hostFromUrl(source.url);
  const label = labelForHost(host);
  const noteLabels = source.notes.map((id) => labelForNote(id));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-3.5 sm:p-4",
        GLASS_BODY_VIOLET
      )}
    >
      <span aria-hidden="true" className={GLASS_SHEEN} />

      <div className="relative flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden",
            "bg-violet-500/15 ring-1 ring-violet-400/40",
            "text-violet-700 dark:text-violet-300"
          )}
        >
          <MessageSquare size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {label}
            </span>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-300 hover:underline truncate max-w-[240px]"
              title={source.url}
            >
              <Link2 size={11} aria-hidden="true" />
              <span className="truncate">{host}</span>
            </a>
          </div>

          {/* Сферы */}
          {source.spheres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {source.spheres.map((s) => (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                    "bg-blue-500/10 text-blue-700 dark:text-blue-300",
                    "ring-1 ring-blue-400/30"
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Типы заметок */}
          {noteLabels.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {noteLabels.map((label) => (
                <span
                  key={label}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                    "bg-violet-500/10 text-violet-700 dark:text-violet-300",
                    "ring-1 ring-violet-400/30"
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Комментарий */}
          {source.comment.trim() && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-snug italic">
              «{source.comment.trim()}»
            </p>
          )}

          {/* Пустое состояние */}
          {source.spheres.length === 0 && source.notes.length === 0 && !source.comment.trim() && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Без ограничений — Dayla возьмёт всё, что покажется полезным.
            </p>
          )}
        </div>

        <div className="relative shrink-0 flex items-center gap-0.5">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Изменить источник"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "text-gray-400 hover:text-violet-700 hover:bg-white/40",
              "dark:hover:text-violet-300 dark:hover:bg-white/[0.06]",
              "transition-colors"
            )}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Удалить источник"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "text-gray-400 hover:text-red-500 hover:bg-white/40",
              "dark:hover:bg-white/[0.06]",
              "transition-colors"
            )}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Форма добавления/редактирования источника ────────── */

const SourceForm: React.FC<{
  initial: AiChatSource | null;
  spheres: Sphere[];
  onCancel: () => void;
  onSave: (src: AiChatSource) => void;
}> = ({ initial, spheres, onCancel, onSave }) => {
  const [url, setUrl] = React.useState(initial?.url ?? "");
  const [pickedSpheres, setPickedSpheres] = React.useState<string[]>(
    initial?.spheres ?? []
  );
  const [pickedNotes, setPickedNotes] = React.useState<string[]>(
    initial?.notes ?? []
  );

  const [addingCustom, setAddingCustom] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");
  const [comment, setComment] = React.useState(initial?.comment ?? "");
  const [showAdvanced, setShowAdvanced] = React.useState(
    Boolean(initial && (initial.spheres.length || initial.notes.length || initial.comment))
  );
  const [error, setError] = React.useState<string | null>(null);

  const toggleSphere = (name: string) => {
    setPickedSpheres((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const toggleNote = (id: string) => {
    setPickedNotes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const commitCustomNote = () => {
    const v = customValue.trim();
    setCustomValue("");
    setAddingCustom(false);
    if (!v) return;
    const id = makeCustomNoteId(v);
    setPickedNotes((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const cancelCustomNote = () => {
    setCustomValue("");
    setAddingCustom(false);
  };

  const submit = () => {
    const trimmed = url.trim();
    if (!isValidHttpUrl(trimmed)) {
      setError("Вставьте полную ссылку, начинающуюся с https://");
      return;
    }
    setError(null);
    onSave({
      id: initial?.id ?? newId(),
      url: trimmed,
      spheres: pickedSpheres,
      notes: pickedNotes,
      comment: comment.trim(),
    });
    if (!initial) {
      setUrl("");
      setPickedSpheres([]);
      setPickedNotes([]);
      setComment("");
      setShowAdvanced(false);
    }
  };

  const isEditing = Boolean(initial);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-3.5 sm:p-4",
        GLASS_BODY_VIOLET
      )}
    >
      <span aria-hidden="true" className={GLASS_SHEEN} />

      <div className="relative space-y-3">
        {/* URL */}
        <div>
          <div className="relative">
            <Link2
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
              aria-hidden="true"
            />
            <Input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="https://chat.openai.com/share/..."
              aria-label="Ссылка на чат с нейросетью"
              className="pl-9"
            />
          </div>
          {error && (
            <p className="mt-1 text-[11px] text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Расширенные настройки */}
        {!showAdvanced ? (
          <button
            type="button"
            onClick={() => setShowAdvanced(true)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium",
              "text-violet-700 dark:text-violet-300 hover:underline"
            )}
          >
            <Info size={12} aria-hidden="true" />
            Уточнить, что Dayla может взять
          </button>
        ) : (
          <div className="space-y-3.5 pt-1 border-t border-violet-400/20">
            {/* Типы заметок */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                {pickedNotes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPickedNotes([])}
                    className="text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Сбросить
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Предопределённые */}
                {NOTE_KINDS.map((n) => {
                  const active = pickedNotes.includes(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => toggleNote(n.id)}
                      aria-pressed={active}
                      className={cn(
                        "inline-flex items-center h-6 px-2.5 rounded-full",
                        "text-[11px] font-medium leading-none transition-all",
                        "ring-1",
                        active
                          ? "bg-violet-500/20 ring-violet-400/50 text-violet-800 dark:text-violet-200"
                          : "bg-white/[0.04] dark:bg-white/[0.02] ring-white/30 dark:ring-white/10 text-gray-600 dark:text-gray-300 hover:bg-white/10"
                      )}
                    >
                      {n.label}
                    </button>
                  );
                })}

                {/* Кастомные, уже добавленные */}
                {pickedNotes.filter(isCustomNote).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleNote(id)}
                    aria-pressed
                    title="Убрать"
                    className={cn(
                      "group/custom inline-flex items-center gap-1 h-6 px-2.5 rounded-full",
                      "text-[11px] font-medium leading-none transition-all",
                      "ring-1",
                      "bg-violet-500/20 ring-violet-400/50 text-violet-800 dark:text-violet-200"
                    )}
                  >
                    <span>{customNoteText(id)}</span>
                    <X
                      size={11}
                      className="opacity-60 group-hover/custom:opacity-100 transition-opacity"
                      aria-hidden="true"
                    />
                  </button>
                ))}

                {/* Кнопка «Свой вариант» / поле ввода */}
                {addingCustom ? (
                  <input
                    autoFocus
                    type="text"
                    inputMode="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitCustomNote();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelCustomNote();
                      }
                    }}
                    onBlur={commitCustomNote}
                    placeholder="финансы"
                    aria-label="Свой вариант типа заметок"
                    maxLength={40}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className={cn(
                      "h-6 w-28 px-2.5 rounded-full",
                      "text-[11px] font-medium leading-none",
                      "bg-white/[0.06] dark:bg-white/[0.02]",
                      "ring-1 ring-violet-400/50",
                      "text-gray-900 dark:text-white",
                      "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                      "outline-none"
                    )}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingCustom(true)}
                    className={cn(
                      "inline-flex items-center gap-1 h-6 px-2.5 rounded-full",
                      "text-[11px] font-medium leading-none transition-all",
                      "ring-1 ring-dashed",
                      "bg-transparent ring-violet-400/40",
                      "text-violet-700 dark:text-violet-300",
                      "hover:bg-violet-500/10 hover:ring-violet-400/70"
                    )}
                  >
                    <Plus size={11} aria-hidden="true" />
                    Свой вариант
                  </button>
                )}
              </div>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={() => setShowAdvanced(false)}
                className="text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Свернуть уточнения
              </button>
            )}
          </div>
        )}

        {/* Кнопки */}
        <div className="flex items-center justify-end gap-2 pt-1">
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium",
                "text-gray-600 dark:text-gray-300",
                "hover:bg-white/40 dark:hover:bg-white/[0.05]",
                "transition-colors"
              )}
            >
              Отмена
            </button>
          )}
          <Button
            type="button"
            onClick={submit}
            disabled={!url.trim()}
            size="sm"
          >
            <Plus size={14} className="mr-1" aria-hidden="true" />
            {isEditing ? "Сохранить" : "Добавить источник"}
          </Button>
        </div>
      </div>
    </div>
  );
};