// src/pages/AssistantPage.tsx
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ApiError, api } from "../api/client";
import type {
  AgendaScope,
  AssistantEvent,
  AssistantReply,
  DraftItem,
  HistoryMessage,
  ReminderSettings,
} from "../api/types";
import { RecommendationList } from "../components/recommendations";
import { RichText } from "../components/RichText";
import { Icon } from "../components/icons";
import { Badge, Button, PageHeader, Switch, useErrorToast } from "../components/ui";
import {
  TEMPORARY_ERROR,
  dayKey,
  deadlineTone,
  errorText,
  formatDate,
  formatDeadline,
  formatTime,
  openPicker,
  parseDayKey,
  relativeDay,
} from "../lib/format";
import { notifyTasksChanged } from "../lib/hooks";
import { Link, navigate, useLocation, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { GLASS_BODY_FLAT, GLASS_ERROR, GLASS_PRIMARY, GLASS_CHIP } from "@/components/dashboard/glass";

const GLASS_BODY = GLASS_BODY_FLAT;

/* ─── Модель данных ──────────────────────────────────────── */

type Mode = "plan" | "search";

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; reply: AssistantReply; serverId?: number; rating?: -1 | 1 | null }
  | { id: number; role: "error"; text: string };

const QUICK_ACTIONS = [
  "Сегодня",
  "Завтра",
  "Неделя",
  "Выполнено",
  "Статистика",
  "Советы",
  "Анализ недели",
  "Помощь",
];
const SCOPES: { value: AgendaScope; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "tomorrow", label: "Завтра" },
  { value: "week", label: "Неделя" },
];

const TOPIC_REPLIES = ["Как это сделать?", "Помоги перепланировать", "Что можно перенести?"];

const EXAMPLES: Record<Mode, string[]> = {
  plan: [
    "Проанализируй мою неделю",
    "Созвон с командой завтра в 11:00 на час",
    "Каждую пятницу в 18:00 спортзал, напомни за 30 минут",
    "Отчёт, дедлайн в пятницу 18:00",
    "Перенеси созвон с командой на послезавтра",
  ],
  search: ["Что у меня на этой неделе?", "Когда встреча с Олей?", "Что у меня в следующую пятницу?"],
};

let messageId = 0;

function fromHistory(items: HistoryMessage[]): Message[] {
  return items.map((item) =>
    item.role === "user"
      ? { id: ++messageId, role: "user", text: item.text }
      : {
          id: ++messageId,
          role: "assistant",
          reply: item.reply ?? { kind: "answer", text: item.text },
          serverId: item.id,
          rating: item.rating,
        }
  );
}

/* ─── Страница ──────────────────────────────────────────── */

export function AssistantPage() {
  useTitle("Ассистент");
  const { query } = useLocation();
  const [mode, setMode] = useState<Mode>("plan");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    api.assistant
      .history()
      .then((items) => active && setMessages((current) => [...fromHistory(items), ...current]))
      .catch(() => undefined)
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: loaded ? "smooth" : "auto", block: "end" });
  }, [messages, busy, loaded]);

  const push = (message: Message) => setMessages((items) => [...items, message]);

  const send = async (input: string) => {
    const value = input.trim();
    if (!value || busy) return;
    setText("");
    push({ id: ++messageId, role: "user", text: value });
    setBusy(true);
    try {
      const { message_id: serverId, ...reply } = await api.assistant.chat(
        mode === "search" ? `найди ${value}` : value
      );
      push({ id: ++messageId, role: "assistant", reply: reply as AssistantReply, serverId });
      if (reply.kind === "completed") notifyTasksChanged();
    } catch {
      push({ id: ++messageId, role: "error", text: TEMPORARY_ERROR });
    } finally {
      setBusy(false);
    }
  };

  const initial = query.get("q");
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded || !initial || handled.current === initial) return;
    handled.current = initial;
    navigate("/assistant", { replace: true });
    send(initial);
  }, [initial, loaded]);

  const topic = query.get("topic");
  const topicText = query.get("text");
  useEffect(() => {
    if (!loaded || !topic || !topicText || handled.current === `topic:${topic}`) return;
    handled.current = `topic:${topic}`;
    navigate("/assistant", { replace: true });
    setMode("plan");
    api.assistant
      .topic(topic.slice(0, 120), topicText.slice(0, 600))
      .then((reply) =>
        setMessages((items) => {
          const last = items[items.length - 1];
          const same =
            last?.role === "assistant" &&
            last.reply.kind === "topic" &&
            JSON.stringify(last.reply) === JSON.stringify(reply);
          return same ? items : [...items, { id: ++messageId, role: "assistant", reply }];
        })
      )
      .catch(() => push({ id: ++messageId, role: "error", text: TEMPORARY_ERROR }));
  }, [topic, topicText, loaded]);

  const replace = (id: number, reply: AssistantReply) =>
    setMessages((items) =>
      items.map((item) =>
        item.id === id && item.role === "assistant" ? { ...item, reply } : item
      )
    );

  return (
    <div className="relative max-w-3xl mx-auto pt-[1.5vh]">
      <PageHeader
        title="Ассистент"
        subtitle="Пишите, говорите или пришлите документ — Dayla создаст или изменит задачи. Перед сохранением всё можно поправить."
        actions={
          <div
            className={cn(
              "relative inline-flex items-center gap-1 p-1 rounded-full overflow-hidden",
              GLASS_BODY
            )}
            role="tablist"
            aria-label="Режим"
          >
            {(["plan", "search"] as const).map((value) => (
              <button
                key={value}
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={cn(
                  "relative px-3.5 h-7 rounded-full text-xs font-medium transition-colors duration-200",
                  mode === value
                    ? "bg-sky-500/20 text-sky-800 dark:text-sky-100"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                {value === "plan" ? "Запланировать" : "Найти"}
              </button>
            ))}
          </div>
        }
      />

      {/* ─── Чат ──────────────────────────────────── */}
      <div className="relative p-4 sm:p-5 space-y-4 min-h-[320px]">
        {loaded && messages.length === 0 && (
          <div className="flex flex-col items-center text-center py-8">
            <span
              aria-hidden="true"
              className={cn(
                "relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden mb-3",
                "bg-white/[0.03] dark:bg-white/[0.01] backdrop-blur-xl",
                "ring-1 ring-white/30 dark:ring-white/10",
                "text-sky-600 dark:text-sky-300",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
              )}
            >
              <Icon name="assistant" size={26} className="relative" />
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              {mode === "plan" ? "Что запланируем?" : "Что найти в календаре?"}
            </p>

            <div className="flex flex-wrap justify-center gap-1.5 w-full max-w-2xl">
              {EXAMPLES[mode].map((example) => (
                <button
                  key={example}
                  type="button"
                  className={cn(GLASS_CHIP, "shrink-0")}
                  onClick={() => send(example)}
                >
                  <span className="relative whitespace-nowrap">{example}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, position) => (
          <ChatMessage
            key={message.id}
            message={message}
            onReply={replace}
            onAppend={(reply) => push({ id: ++messageId, role: "assistant", reply })}
            onSend={position === messages.length - 1 && !busy ? send : undefined}
            send={busy ? undefined : send}
          />
        ))}

        {busy && (
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl px-4 py-3 text-sm inline-flex items-center gap-1",
              GLASS_BODY,
              "text-gray-500 dark:text-gray-400"
            )}
            aria-label="Dayla думает"
          >
            <i className="relative w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            <i
              className="relative w-1.5 h-1.5 rounded-full bg-current animate-pulse"
              style={{ animationDelay: "150ms" }}
            />
            <i
              className="relative w-1.5 h-1.5 rounded-full bg-current animate-pulse"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ─── Быстрые команды + Composer ─────────────── */}
      <div className="sticky bottom-4">
        <div
          className="mb-2 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Быстрые команды"
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              className={GLASS_CHIP}
              disabled={busy}
              onClick={() => send(action)}
            >
              <span className="relative">{action}</span>
            </button>
          ))}
        </div>
        <Composer value={text} onChange={setText} onSend={() => send(text)} busy={busy} mode={mode} />
      </div>
    </div>
  );
}

/* ─── ChatMessage ────────────────────────────────────────── */

function ChatMessage({
  message,
  onReply,
  onAppend,
  onSend,
  send,
}: {
  message: Message;
  onReply: (id: number, reply: AssistantReply) => void;
  onAppend: (reply: AssistantReply) => void;
  onSend?: (text: string) => void;
  send?: (text: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl rounded-br-sm px-4 py-2.5 text-sm max-w-[85%]",
            GLASS_PRIMARY
          )}
        >
          <p className="relative whitespace-pre-wrap">{message.text}</p>
        </div>
      </div>
    );
  }

  if (message.role === "error") {
    return (
      <div className="flex justify-start">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm max-w-[85%]",
            GLASS_ERROR,
            "text-red-700 dark:text-red-200"
          )}
          role="alert"
        >
          <p className="relative">{message.text}</p>
        </div>
      </div>
    );
  }

  const reply = message.reply;
  const rating =
    message.serverId && reply.kind !== "topic" ? (
      <Rating messageId={message.serverId} initial={message.rating ?? null} />
    ) : null;

  if (reply.kind === "topic") {
    return (
      <div className="flex justify-start">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl rounded-bl-sm p-4 text-sm max-w-[92%]",
            GLASS_BODY,
            "text-gray-900 dark:text-white"
          )}
        >
          <span className="relative inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-medium text-sky-700 dark:text-sky-300 mb-2">
            <Icon name="assistant" size={12} />
            Рекомендация
          </span>
          <p className="relative">
            <strong className="font-semibold">{reply.title}.</strong>{" "}
            <RichText text={reply.text} inline />
          </p>
          {onSend && (
            <div className="relative mt-3 flex flex-wrap gap-1.5">
              {TOPIC_REPLIES.map((text) => (
                <button key={text} className={GLASS_CHIP} onClick={() => onSend(text)}>
                  <span className="relative">{text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl rounded-bl-sm p-4 text-sm max-w-[92%] w-full",
          GLASS_BODY,
          "text-gray-900 dark:text-white"
        )}
      >
        <div className="relative space-y-3">
          {reply.kind === "proposal" && (
            <Proposal reply={reply} onReply={(next) => onReply(message.id, next)} />
          )}
          {reply.kind === "delete_proposal" && (
            <DeleteProposal reply={reply} onReply={(next) => onReply(message.id, next)} />
          )}
          {reply.kind === "deleted" && (
            <p className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <Icon name="trash" size={16} /> {reply.text}
            </p>
          )}
          {reply.kind === "completed" && (
            <>
              <p className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <Icon name="check" size={16} /> {reply.text}
              </p>
              <AssistantEvents events={reply.events} />
            </>
          )}
          {(reply.kind === "created" || reply.kind === "updated") && (
            <>
              <p className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <Icon name="check" size={16} />{" "}
                {reply.kind === "updated" ? reply.text ?? "Изменила" : "Добавила в календарь"}
              </p>
              <AssistantEvents events={reply.events} />
              {reply.kind === "updated" && reply.moved && (
                <MoveBackButton moved={reply.moved} onDone={(next) => onReply(message.id, next)} />
              )}
              {reply.kind === "created" && reply.event_ids.length > 0 && (
                <UndoButton
                  eventIds={reply.event_ids}
                  onDone={(text) => onReply(message.id, { kind: "cancelled", text })}
                />
              )}
            </>
          )}
          {reply.kind === "stats" && <StatsReply stats={reply} />}
          {reply.kind === "help" && (
            <div className="space-y-3">
              <p>
                Пишите как другу — текстом, голосом или документом. Всё, что
                меняет календарь, я сначала покажу на подтверждение.
              </p>
              {reply.sections.map((section) => (
                <div key={section.title} className="space-y-1.5">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    {section.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {section.examples.map((example) => (
                      <button
                        key={example}
                        className={GLASS_CHIP}
                        disabled={!send}
                        onClick={() => send?.(example)}
                      >
                        <span className="relative">{example}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {reply.kind === "advice" && <AdviceReply items={reply.items} onAppend={onAppend} />}
          {reply.kind === "reminders" && <RemindersReply initial={reply.settings} />}
          {reply.kind === "agenda" && (
            <AgendaReply reply={reply} onReply={(next) => onReply(message.id, next)} onAppend={onAppend} />
          )}
          {(reply.kind === "answer" ||
            reply.kind === "not_found" ||
            reply.kind === "edit_error" ||
            reply.kind === "cancelled") && <RichText text={reply.text} />}
          {reply.kind === "nothing" && (
            <p>
              Не нашла в сообщении задач. Напишите, что и когда, — например:
              «созвон с Олей завтра в 15:00».
            </p>
          )}
          {rating}
        </div>
      </div>
    </div>
  );
}

/* ─── AgendaReply ────────────────────────────────────────── */

type AgendaReplyData = Extract<AssistantReply, { kind: "agenda" }>;

function AgendaReply({
  reply,
  onReply,
  onAppend,
}: {
  reply: AgendaReplyData;
  onReply: (reply: AssistantReply) => void;
  onAppend: (reply: AssistantReply) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [moving, setMoving] = useState(false);
  const reportError = useErrorToast();

  const show = async (scope: AgendaScope, mark = false) => {
    setBusy(true);
    try {
      onReply(await api.assistant.agenda(scope, mark));
    } catch {
      reportError(TEMPORARY_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const count = reply.days.reduce((sum, day) => sum + day.events.length, 0);

  return (
    <div className="space-y-3">
      <p>
        {count
          ? reply.mark
            ? `Отметьте выполненное · ${reply.title}`
            : moving
              ? `Что перенести? · ${reply.title}`
              : reply.title
          : "Ничего не запланировано."}
      </p>
      {reply.days.map((day) => (
        <div key={day.date} className="space-y-1.5">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            {day.label}
          </h3>
          {reply.mark ? (
            <MarkList events={day.events} />
          ) : moving ? (
            <MoveList events={day.events} onMoved={onAppend} />
          ) : (
            <AssistantEvents events={day.events} />
          )}
        </div>
      ))}
      {reply.scope && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div
            className={cn(
              "relative inline-flex items-center gap-1 p-1 rounded-full overflow-hidden",
              GLASS_BODY
            )}
          >
            {SCOPES.map((scope) => (
              <button
                key={scope.value}
                className={cn(
                  "relative px-3 h-7 rounded-full text-xs font-medium transition-colors",
                  reply.scope === scope.value && !reply.mark
                    ? "bg-sky-500/20 text-sky-800 dark:text-sky-100"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
                disabled={busy}
                onClick={() => show(scope.value)}
              >
                {scope.label}
              </button>
            ))}
          </div>
          {count > 0 && !reply.mark && (
            <Button
              variant="ghost"
              size="sm"
              icon="check"
              disabled={busy}
              onClick={() => show(reply.scope ?? "today", true)}
            >
              Отметить выполненные
            </Button>
          )}
          {count > 0 && !reply.mark && (
            <Button variant="ghost" size="sm" icon={moving ? "left" : "sync"} disabled={busy} onClick={() => setMoving((value) => !value)}>
              {moving ? "Готово" : "Перенести"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── MarkList ───────────────────────────────────────────── */

function MarkList({ events }: { events: AssistantEvent[] }) {
  const [done, setDone] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(events.map((event) => [event.id, event.completed]))
  );
  const reportError = useErrorToast();

  const toggle = async (event: AssistantEvent) => {
    const next = !done[event.id];
    setDone((current) => ({ ...current, [event.id]: next }));
    try {
      await api.events.complete(event.id, next);
      notifyTasksChanged();
    } catch {
      setDone((current) => ({ ...current, [event.id]: !next }));
      reportError(TEMPORARY_ERROR);
    }
  };

  return (
    <ul className="space-y-1.5">
      {events.map((event) => (
        <li key={event.id} className="flex items-center gap-2">
          <button
            type="button"
            role="checkbox"
            aria-checked={done[event.id]}
            aria-label={done[event.id] ? `Снять отметку: ${event.title}` : `Выполнено: ${event.title}`}
            className={cn(
              "relative shrink-0 w-5 h-5 rounded-md flex items-center justify-center overflow-hidden",
              "ring-1 transition-colors",
              done[event.id]
                ? "bg-emerald-500/70 ring-emerald-400/60 text-white"
                : cn(GLASS_BODY, "text-transparent hover:text-gray-400")
            )}
            onClick={() => toggle(event)}
          >
            {done[event.id] && <Icon name="check" size={12} />}
          </button>
          <span
            className={cn(
              "flex-1 min-w-0 flex items-baseline gap-2 text-sm",
              done[event.id] && "line-through text-gray-400 dark:text-gray-500"
            )}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
              {event.all_day ? "без времени" : formatTime(new Date(event.start))}
            </span>
            <span className="truncate text-gray-900 dark:text-white">{event.title}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ─── MoveList: «Перенести» под планом ───────────────────── */

const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

function MoveList({ events, onMoved }: { events: AssistantEvent[]; onMoved: (reply: AssistantReply) => void }) {
  const [movedTo, setMovedTo] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const reportError = useErrorToast();
  const today = new Date();
  const quick = [
    { label: "Сегодня", day: dayKey(today) },
    { label: "Завтра", day: dayKey(addDays(today, 1)) },
    { label: "Послезавтра", day: dayKey(addDays(today, 2)) },
  ];

  const move = async (event: AssistantEvent, day: string) => {
    if (!day) return;
    setBusy(event.id);
    try {
      const { message_id: _ignored, ...reply } = await api.assistant.move(event.id, day);
      if (reply.kind === "updated") {
        setMovedTo((current) => ({ ...current, [event.id]: day }));
        notifyTasksChanged();
      }
      onMoved(reply as AssistantReply);
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  const open = events.filter((event) => !event.completed);
  if (!open.length) return <p className="text-sm text-gray-500 dark:text-gray-400">Переносить нечего.</p>;

  return (
    <ul className="space-y-2">
      {open.map((event) => {
        const current = event.start.slice(0, 10);
        const done = movedTo[event.id];
        return (
          <li key={event.id} className={cn("relative rounded-xl px-3 py-2 space-y-1.5", GLASS_BODY)}>
            <span className="flex items-baseline gap-2 text-sm">
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                {event.all_day ? "без времени" : formatTime(new Date(event.start))}
              </span>
              <span className={cn("truncate text-gray-900 dark:text-white", done && "text-gray-400 dark:text-gray-500")}>
                {event.title}
              </span>
            </span>
            {done ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Перенесено на {relativeDay(parseDayKey(done) ?? today).toLowerCase()}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {quick
                  .filter((option) => option.day !== current)
                  .map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      disabled={busy !== null}
                      onClick={() => move(event, option.day)}
                      className={cn("relative px-2.5 h-7 rounded-full text-xs font-medium disabled:opacity-50", GLASS_CHIP)}
                    >
                      {option.label}
                    </button>
                  ))}
                <label className={cn("relative inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium cursor-pointer", GLASS_CHIP)}>
                  <Icon name="calendar" size={12} /> Другой день
                  <input
                    type="date"
                    aria-label={`Другой день для «${event.title}»`}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    min={dayKey(today)}
                    disabled={busy !== null}
                    onChange={(change) => move(event, change.target.value)}
                    onClick={(click) => openPicker(click.currentTarget)}
                  />
                </label>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MoveBackButton({
  moved,
  onDone,
}: {
  moved: { event_id: number; from: string; from_label: string };
  onDone: (reply: AssistantReply) => void;
}) {
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();

  const back = async () => {
    setBusy(true);
    try {
      const { message_id: _ignored, ...reply } = await api.assistant.move(moved.event_id, moved.from);
      notifyTasksChanged();
      onDone(reply as AssistantReply);
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button variant="ghost" size="sm" icon="left" busy={busy} onClick={back}>
        Вернуть на {moved.from_label}
      </Button>
    </div>
  );
}

/* ─── UndoButton ─────────────────────────────────────────── */

function UndoButton({
  eventIds,
  onDone,
}: {
  eventIds: number[];
  onDone: (text: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();

  const undo = async () => {
    setBusy(true);
    try {
      const { deleted } = await api.assistant.undo(eventIds);
      notifyTasksChanged();
      onDone(deleted ? `Отменено — удалила добавленное (${deleted}).` : "Эти задачи уже удалены или изменены.");
    } catch {
      reportError(TEMPORARY_ERROR);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button variant="ghost" size="sm" icon="left" busy={busy} onClick={undo}>
        Отменить
      </Button>
    </div>
  );
}

/* ─── StatsReply ─────────────────────────────────────────── */

function StatsReply({ stats }: { stats: Extract<AssistantReply, { kind: "stats" }> }) {
  return (
    <div className="space-y-3">
      <p className="text-base">
        <strong className="font-semibold">{stats.today.done}</strong> из {stats.today.total}{" "}
        <span className="text-gray-500 dark:text-gray-400">выполнено сегодня</span>
      </p>

      <div
        className={cn(
          "relative h-2 rounded-full overflow-hidden",
          "bg-white/[0.06] dark:bg-white/[0.02]",
          "ring-1 ring-white/20 dark:ring-white/10",
          "shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]"
        )}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-blue-500"
          style={{ width: `${stats.today.percent}%` }}
        />
      </div>

      <div className="flex items-end gap-1.5 h-16" aria-label="Выполнение за 7 дней">
        {stats.days.map((day) => (
          <div
            key={day.date}
            title={`${day.done} из ${day.total}`}
            className="flex-1 flex flex-col items-center gap-1 h-full"
          >
            <span className="relative flex-1 w-full rounded-md bg-white/[0.06] dark:bg-white/[0.02] ring-1 ring-white/20 dark:ring-white/10 overflow-hidden">
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 rounded-md",
                  day.total && day.done === day.total
                    ? "bg-emerald-500/60"
                    : "bg-sky-500/50"
                )}
                style={{ height: `${day.total ? Math.max(day.percent, 6) : 0}%` }}
              />
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {(parseDayKey(day.date) ?? new Date()).toLocaleDateString("ru-RU", {
                weekday: "short",
              })}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        За неделю {stats.done} из {stats.total} ({stats.percent}%)
        {stats.streak > 0 ? ` · 🔥 серия ${stats.streak} дн.` : ""}
        {stats.best_streak > stats.streak ? ` · лучшая ${stats.best_streak} дн.` : ""}
      </p>
    </div>
  );
}

/* ─── AdviceReply ────────────────────────────────────────── */

function AdviceReply({
  items,
  onAppend,
}: {
  items: Extract<AssistantReply, { kind: "advice" }>["items"];
  onAppend: (reply: AssistantReply) => void;
}) {
  const reportError = useErrorToast();
  if (!items.length) return <p>Пока советовать нечего — план в порядке.</p>;

  const discuss = async (index: number) => {
    try {
      onAppend(await api.assistant.topic(items[index].title, items[index].text));
    } catch {
      reportError(TEMPORARY_ERROR);
    }
  };

  return (
    <>
      <p>Советы на сегодня:</p>
      <RecommendationList items={items} onDiscuss={discuss} />
    </>
  );
}

/* ─── RemindersReply ─────────────────────────────────────── */

function RemindersReply({ initial }: { initial: ReminderSettings }) {
  const [settings, setSettings] = useState(initial);
  const reportError = useErrorToast();

  const toggle = async (patch: Partial<ReminderSettings>) => {
    const previous = settings;
    setSettings({ ...settings, ...patch });
    try {
      setSettings(await api.reminders.update(patch));
    } catch {
      setSettings(previous);
      reportError(TEMPORARY_ERROR);
    }
  };

  return (
    <div className="space-y-2.5">
      <p>Напоминания приходят в Telegram.</p>
      <Switch
        checked={settings.enabled}
        onChange={(enabled) => toggle({ enabled })}
        label="Напоминать о событиях"
      />
      <Switch
        checked={settings.daily_digest_enabled}
        onChange={(value) => toggle({ daily_digest_enabled: value })}
        label={`Утренний план · ${settings.daily_digest_time.slice(0, 5)}`}
      />
      <Switch
        checked={settings.evening_enabled}
        onChange={(value) => toggle({ evening_enabled: value })}
        label={`Итоги дня · ${settings.evening_time.slice(0, 5)}`}
      />
      <Switch
        checked={settings.deadline_enabled}
        onChange={(value) => toggle({ deadline_enabled: value })}
        label="Приближение дедлайнов"
      />
      <Link
        to="/account#reminders"
        className={cn(
          "relative inline-flex items-center gap-1.5 overflow-hidden",
          "px-3 h-8 rounded-xl text-xs font-medium",
          GLASS_BODY,
          "text-gray-700 dark:text-gray-300"
        )}
      >
        <span className="relative">Время и остальные настройки</span>
      </Link>
    </div>
  );
}

/* ─── Rating ─────────────────────────────────────────────── */

function Rating({ messageId, initial }: { messageId: number; initial: -1 | 1 | null }) {
  const [value, setValue] = useState<-1 | 1 | null>(initial);
  const reportError = useErrorToast();

  const rate = async (next: -1 | 1) => {
    const chosen = value === next ? null : next;
    const previous = value;
    setValue(chosen);
    try {
      await api.assistant.rate(messageId, chosen ?? 0);
    } catch {
      setValue(previous);
      reportError("Не удалось сохранить оценку");
    }
  };

  return (
    <div
      className="flex items-center gap-1 pt-1"
      role="group"
      aria-label="Оцените ответ"
    >
      {([1, -1] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          aria-label={v === 1 ? "Хороший ответ" : "Плохой ответ"}
          title={v === 1 ? "Хороший ответ" : "Плохой ответ"}
          onClick={() => rate(v)}
          className={cn(
            "w-7 h-7 rounded-full text-sm flex items-center justify-center transition-colors",
            value === v
              ? "bg-sky-500/20 ring-1 ring-sky-400/40"
              : "hover:bg-white/[0.06] dark:hover:bg-white/[0.03]"
          )}
        >
          {v === 1 ? "👍" : "👎"}
        </button>
      ))}
    </div>
  );
}

/* ─── DeleteProposal ─────────────────────────────────────── */

type DeleteReply = Extract<AssistantReply, { kind: "delete_proposal" }>;

function DeleteProposal({
  reply,
  onReply,
}: {
  reply: DeleteReply;
  onReply: (reply: AssistantReply) => void;
}) {
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const reportError = useErrorToast();

  const run = async (kind: "confirm" | "cancel") => {
    setBusy(kind);
    try {
      const result =
        kind === "confirm"
          ? await api.assistant.confirmDraft(reply.draft_id)
          : await api.assistant.cancelDraft(reply.draft_id);
      if (result.kind === "deleted") notifyTasksChanged();
      onReply(result);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
        onReply({ kind: "cancelled", text: "Этот запрос уже обработан или устарел." });
      } else {
        reportError(TEMPORARY_ERROR);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2.5">
      <RichText text={reply.answer ?? `Удалить ${reply.count}?`} />
      <AssistantEvents events={reply.events} />
      {reply.count > reply.events.length && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          …и ещё {reply.count - reply.events.length}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="danger"
          size="sm"
          icon="trash"
          busy={busy === "confirm"}
          onClick={() => run("confirm")}
        >
          Удалить ({reply.count})
        </Button>
        <Button variant="ghost" size="sm" busy={busy === "cancel"} onClick={() => run("cancel")}>
          Не удалять
        </Button>
      </div>
    </div>
  );
}

/* ─── AssistantEvents ────────────────────────────────────── */

function AssistantEvents({ events }: { events: AssistantEvent[] }) {
  return (
    <ul className="space-y-1.5">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            to={`/events/${event.id}`}
            className={cn(
              "relative flex items-start gap-2 overflow-hidden",
              "px-3 py-2 rounded-xl",
              "transition-transform duration-200 hover:-translate-y-0.5",
              GLASS_BODY,
              event.completed && "opacity-60"
            )}
          >
            <span className="relative flex flex-col shrink-0 text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">
              <span>{relativeDay(new Date(event.start))}</span>
              <span>{event.all_day ? "—" : formatTime(new Date(event.start))}</span>
            </span>
            <span className="relative min-w-0 flex-1">
              <span
                className={cn(
                  "block text-sm text-gray-900 dark:text-white truncate",
                  event.completed && "line-through text-gray-400 dark:text-gray-500"
                )}
              >
                {event.title}
              </span>
              {(event.recurrence || event.location || event.deadline || multiDay(event)) && (
                <span className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {multiDay(event) && (
                    <span>
                      по{" "}
                      {formatDate(parseDayKey(event.end_date ?? null) ?? new Date(), {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                  {event.deadline && !event.completed && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1",
                        event.deadline && `deadline-${deadlineTone(event.deadline)}`
                      )}
                    >
                      <Icon name="flag" size={11} /> {formatDeadline(event.deadline)}
                    </span>
                  )}
                  {event.recurrence && (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="sync" size={11} /> {event.recurrence}
                    </span>
                  )}
                  {event.location && (
                    <span className="inline-flex items-center gap-1">
                      <Icon name="location" size={11} /> {event.location}
                    </span>
                  )}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const multiDay = (event: { start: string; end_date?: string | null }) =>
  !!event.end_date && event.end_date > event.start.slice(0, 10);

/* ─── Proposal ───────────────────────────────────────────── */

function describeBefore(before: NonNullable<DraftItem["before"]>): string {
  const day = parseDayKey(before.date);
  const when = day ? relativeDay(day).toLowerCase() : before.date;
  return [
    when,
    before.time ? `${before.time}${before.end_time ? `–${before.end_time}` : ""}` : "без времени",
  ].join(", ");
}

type ProposalReply = Extract<AssistantReply, { kind: "proposal" }>;

function Proposal({
  reply,
  onReply,
}: {
  reply: ProposalReply;
  onReply: (reply: AssistantReply) => void;
}) {
  const [items, setItems] = useState<DraftItem[]>(reply.events);
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const reportError = useErrorToast();

  const dirty = JSON.stringify(items) !== JSON.stringify(reply.events);
  const patch = (index: number, values: Partial<DraftItem>) =>
    setItems((current) =>
      current.map((item, position) => (position === index ? { ...item, ...values } : item))
    );

  const run = async (kind: "confirm" | "cancel", action: () => Promise<AssistantReply>) => {
    setBusy(kind);
    try {
      const result = await action();
      if (result.kind === "created" || result.kind === "updated") notifyTasksChanged();
      onReply(result);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
        onReply({ kind: "cancelled", text: "Этот черновик уже обработан или устарел." });
      } else {
        reportError(TEMPORARY_ERROR);
      }
    } finally {
      setBusy(null);
    }
  };

  const confirm = () =>
    run("confirm", async () => {
      if (dirty) {
        const saved = await api.assistant.updateDraft(reply.draft_id, items);
        if (saved.kind !== "proposal") return saved;
      }
      return api.assistant.confirmDraft(reply.draft_id);
    });

  const isChange = items.some((item) => item.event_id);

  return (
    <div className="space-y-3">
      <RichText
        text={
          reply.answer ??
          (items.length > 1
            ? "Вот что я поняла — проверьте задачи и добавьте:"
            : "Вот что я поняла — проверьте и добавьте:")
        }
      />
      {reply.note && <p className="text-xs text-gray-500 dark:text-gray-400">{reply.note}</p>}

      {items.map((item, index) => (
        <div
          key={index}
          className={cn("relative overflow-hidden rounded-xl p-3 space-y-2", GLASS_BODY)}
        >
          {item.before && (
            <span className="relative block text-[11px] text-gray-500 dark:text-gray-400">
              Было: {item.before.title !== item.title ? `«${item.before.title}», ` : ""}
              {describeBefore(item.before)}
            </span>
          )}

          <input
            value={item.title}
            onChange={(e) => patch(index, { title: e.target.value })}
            aria-label="Название"
            maxLength={300}
            className={cn(
              "relative w-full h-9 px-3 text-sm rounded-lg",
              "bg-white/[0.05] dark:bg-white/[0.02]",
              "ring-1 ring-white/20 dark:ring-white/10",
              "outline-none focus:ring-sky-400/50",
              "text-gray-900 dark:text-white"
            )}
          />

          <div className="relative flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-[7rem]">
              <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                Дата
              </span>
              <input
                type="date"
                value={item.date}
                required
                onChange={(e) => e.target.value && patch(index, { date: e.target.value })}
                onClick={(e) => openPicker(e.currentTarget)}
                className={cn(
                  "w-full h-9 px-3 text-sm rounded-lg",
                  "bg-white/[0.05] dark:bg-white/[0.02]",
                  "ring-1 ring-white/20 dark:ring-white/10",
                  "outline-none focus:ring-sky-400/50",
                  "text-gray-900 dark:text-white"
                )}
              />
            </label>
            <label className="flex-1 min-w-[7rem]">
              <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                Время
              </span>
              <input
                type="time"
                value={item.time ?? ""}
                onChange={(e) =>
                  patch(index, {
                    time: e.target.value || null,
                    end_time: e.target.value ? item.end_time : null,
                  })
                }
                onClick={(e) => openPicker(e.currentTarget)}
                className={cn(
                  "w-full h-9 px-3 text-sm rounded-lg",
                  "bg-white/[0.05] dark:bg-white/[0.02]",
                  "ring-1 ring-white/20 dark:ring-white/10",
                  "outline-none focus:ring-sky-400/50",
                  "text-gray-900 dark:text-white"
                )}
              />
            </label>
            {item.end_date && (
              <label className="flex-1 min-w-[7rem]">
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                  По
                </span>
                <input
                  type="date"
                  value={item.end_date}
                  min={item.date}
                  onChange={(e) => patch(index, { end_date: e.target.value || null })}
                  onClick={(e) => openPicker(e.currentTarget)}
                  className={cn(
                    "w-full h-9 px-3 text-sm rounded-lg",
                    "bg-white/[0.05] dark:bg-white/[0.02]",
                    "ring-1 ring-white/20 dark:ring-white/10",
                    "outline-none focus:ring-sky-400/50",
                    "text-gray-900 dark:text-white"
                  )}
                />
              </label>
            )}
            {item.time ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => patch(index, { time: null, end_time: null })}
              >
                Без времени
              </Button>
            ) : (
              <span className="text-xs text-gray-500 dark:text-gray-400">без времени</span>
            )}
          </div>

          {(item.deadline || item.fixed) && (
            <div className="relative flex flex-wrap gap-1.5">
              {item.deadline && (
                <Badge tone={deadlineTone(item.deadline)}>
                  дедлайн {formatDeadline(item.deadline).replace(/^до /, "")}
                </Badge>
              )}
              {item.fixed && <Badge tone="accent">нельзя переносить</Badge>}
            </div>
          )}

          {(item.recurrence || items.length > 1) && (
            <div className="relative flex items-center justify-between gap-2">
              {item.recurrence && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <Icon name="sync" size={11} /> {item.recurrence}, с{" "}
                  {relativeDay(parseDayKey(item.date) ?? new Date()).toLowerCase()}
                </span>
              )}
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  onClick={() => setItems(items.filter((_, position) => position !== index))}
                >
                  Убрать
                </Button>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="primary"
          size="sm"
          icon={isChange ? "check" : "plus"}
          busy={busy === "confirm"}
          disabled={!items.length || items.some((item) => !item.title.trim())}
          onClick={confirm}
        >
          {isChange ? "Сохранить" : "Добавить"} {items.length > 1 ? `(${items.length})` : ""}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          busy={busy === "cancel"}
          onClick={() => run("cancel", () => api.assistant.cancelDraft(reply.draft_id))}
        >
          Отмена
        </Button>
      </div>
    </div>
  );
}

/* ─── Composer ───────────────────────────────────────────── */

function Composer({
  value,
  onChange,
  onSend,
  busy,
  mode,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  busy: boolean;
  mode: Mode;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [working, setWorking] = useState<"voice" | "file" | null>(null);
  const reportError = useErrorToast();

  const append = (extra: string) => onChange(value ? `${value}\n${extra}` : extra);

  const toggleRecording = async () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const media = new MediaRecorder(stream);
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setWorking("voice");
        try {
          const result = await api.assistant.transcribe(new Blob(chunks, { type: media.mimeType }));
          append(result.text);
        } catch (error) {
          reportError(errorText(error));
        } finally {
          setWorking(null);
        }
      };
      recorder.current = media;
      media.start();
      setRecording(true);
    } catch {
      reportError("Нет доступа к микрофону");
    }
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setWorking("file");
    try {
      const result = await api.assistant.readFile(file);
      append(result.text);
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setWorking(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSend();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "relative overflow-hidden rounded-2xl flex items-center gap-1 p-1.5",
        GLASS_BODY
      )}
    >
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.docx"
        hidden
        onChange={(e) => readFile(e.target.files?.[0])}
      />
      <Button
        variant="ghost"
        icon="clip"
        aria-label="Прочитать PDF или DOCX"
        title="PDF или DOCX"
        busy={working === "file"}
        onClick={() => fileInput.current?.click()}
      />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={recording ? "Говорите…" : mode === "plan" ? "Что запланировать?" : "Что найти?"}
        aria-label="Сообщение"
        maxLength={50000}
        className={cn(
          "relative flex-1 min-w-0 resize-none",
          "appearance-none",
          "border-0 outline-none focus:outline-none focus:ring-0",
          "bg-transparent",
          "shadow-none",
          "px-2 py-2 text-sm",
          "text-gray-900 dark:text-white",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          "max-h-32"
        )}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          boxShadow: "none",
        }}
      />
      {"MediaRecorder" in window && (
        <Button
          variant={recording ? "danger" : "ghost"}
          icon={recording ? "stop" : "mic"}
          aria-label={recording ? "Остановить запись" : "Записать голосом"}
          busy={working === "voice"}
          onClick={toggleRecording}
        />
      )}
      <Button
        type="submit"
        variant="primary"
        icon="send"
        aria-label="Отправить"
        disabled={!value.trim() || busy}
      />
    </form>
  );
}