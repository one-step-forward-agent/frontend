// src/pages/AssistantPage.tsx
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { ApiError, api } from "../api/client";
import { TelegramPrompt } from "../components/TelegramPrompt";
import type {
  AssistantEvent,
  CalendarEvent,
  AssistantReply,
  ChatFile,
  DraftItem,
  HistoryMessage,
  ReminderSettings,
  DeleteScope,
} from "../api/types";
import { DeleteScopeButtons } from "../components/events";
import { RecommendationList } from "../components/recommendations";
import { RichText } from "../components/RichText";
import { TagList } from "../components/tags";
import { Icon } from "../components/icons";
import { Badge, Button, Switch, useErrorToast } from "../components/ui";
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
  plural,
  relativeDay,
} from "../lib/format";
import { notifyTagsChanged, notifyTasksChanged, useTags } from "../lib/hooks";
import { Link, navigate, useLocation, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { TimeField } from "@/components/ui/time-field";
import { GLASS_BODY_FLAT, GLASS_ERROR, GLASS_PRIMARY, GLASS_CHIP } from "@/components/dashboard/glass";
import { LOCALE, isEn, pluralWord, tr } from "@/i18n";

const GLASS_BODY = GLASS_BODY_FLAT;

/* ─── Модель данных ──────────────────────────────────────── */

type Message =
  // `voice`: a voice message, shown as audio as in a messenger (the assistant gets what was said)
  | { id: number; role: "user"; text: string; file?: ChatFile; voice?: { src: string; duration: number } }
  | { id: number; role: "assistant"; reply: AssistantReply; serverId?: number; rating?: -1 | 1 | null }
  | { id: number; role: "error"; text: string };

// Everything else is asked in words; the day, the calendar and the stats have their own screens
const QUICK_ACTIONS: { label: string; fill?: string }[] = [
  { label: tr("Советы", "Advice") },
  { label: tr("Анализ недели", "Week analysis") },
];

const TOPIC_REPLIES = isEn
  ? ["How do I do it?", "Help me replan", "What can I move?"]
  : ["Как это сделать?", "Помоги перепланировать", "Что можно перенести?"];

// What the chat can do, said once on an empty chat: plain text, not buttons to press
const ABILITIES = isEn
  ? [
      ["Plans", "“team call tomorrow at 11 for an hour”, “gym every Friday #sport”"],
      ["Finds", "“what do I have on Friday?”, “when is the meeting with Olya?”"],
      ["Changes", "“move everything to tomorrow”, “delete the report”, “I've done the cleaning”"],
      ["Reminds in Telegram", "“remind me in 20 minutes to turn off the oven”"],
      ["Breaks into steps", "“break into steps: learn SQL by 1 December”"],
      ["Advises", "“how do I get everything done this week?”"],
    ]
  : [
      ["Планирует", "«созвон с командой завтра в 11 на час», «каждую пятницу спортзал #спорт»"],
      ["Находит", "«что у меня в пятницу?», «когда встреча с Олей?»"],
      ["Меняет", "«перенеси всё на завтра», «удали отчёт», «я сделала уборку»"],
      ["Напоминает в Telegram", "«напомни через 20 минут выключить духовку»"],
      ["Разбивает на шаги", "«разбей на шаги: выучить SQL до 1 декабря»"],
      ["Советует", "«как мне всё успеть на этой неделе?»"],
    ];

let messageId = 0;

function fromHistory(items: HistoryMessage[]): Message[] {
  return items.map((item) =>
    item.role === "user"
      ? item.reply?.kind === "file"
        ? { id: ++messageId, role: "user", text: item.reply.caption, file: item.reply.file }
        : item.reply?.kind === "voice"
          ? {
              id: ++messageId,
              role: "user",
              text: "",
              voice: { src: api.assistant.voiceUrl(item.reply.voice.id), duration: item.reply.voice.duration },
              file: item.reply.file,
            }
          : { id: ++messageId, role: "user", text: item.text }
      : {
          id: ++messageId,
          role: "assistant",
          reply: (item.reply as AssistantReply | null) ?? { kind: "answer", text: item.text },
          serverId: item.id,
          rating: item.rating,
        }
  );
}

/* ─── Страница ──────────────────────────────────────────── */

export function AssistantPage() {
  useTitle(tr("Ассистент", "Assistant"));
  return <AssistantChat />;
}

/**
 * The chat itself. On its page it fills the screen; as a panel it sits in the corner of every section.
 * Either way the messages scroll inside and the input stays at the bottom, always in view.
 */
export function AssistantChat({ panel = false, onClose }: { panel?: boolean; onClose?: () => void }) {
  const { query } = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  // Only the list scrolls: the page stays put and the input never leaves the screen.
  // The history opens at its last message at once, before it is painted; only new messages glide in.
  const placed = useRef(false);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !loaded) return;
    list.scrollTo({ top: list.scrollHeight, behavior: placed.current ? "smooth" : "auto" });
    placed.current = true;
  }, [messages, busy, loaded]);

  const [clearing, setClearing] = useState(false);
  const reportError = useErrorToast();
  const clearHistory = async () => {
    if (!messages.length || !window.confirm(tr("Очистить историю чата? Задачи в календаре останутся.", "Clear the chat history? The tasks in the calendar will stay."))) return;
    setClearing(true);
    try {
      await api.assistant.clearHistory();
      setMessages([]);
    } catch {
      reportError(TEMPORARY_ERROR);
    } finally {
      setClearing(false);
    }
  };
  const clearButton = (
    <button
      type="button"
      onClick={clearHistory}
      disabled={clearing || busy || !messages.length}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-gray-500/10 disabled:opacity-40 disabled:pointer-events-none"
      aria-label={tr("Очистить историю чата", "Clear chat history")}
      title={tr("Очистить историю", "Clear history")}
    >
      <Icon name="trash" size={15} />
    </button>
  );

  // A tag the assistant has just created is not in the list loaded before
  const { byId: tagsById } = useTags();

  const push = (message: Message) => setMessages((items) => [...items, message]);

  const send = async (input: string, attached: File | null = null) => {
    const value = input.trim();
    if ((!value && !attached) || busy) return;
    setText("");
    setFile(null);
    push({ id: ++messageId, role: "user", text: value, file: attached ? { name: attached.name, size: attached.size } : undefined });
    setBusy(true);
    try {
      const { message_id: serverId, ...reply } = attached ? await api.assistant.chatFile(attached, value) : await api.assistant.chat(value);
      push({ id: ++messageId, role: "assistant", reply: reply as AssistantReply, serverId });
      if (reply.kind === "completed") notifyTasksChanged();
      const events = "events" in reply && Array.isArray(reply.events) ? (reply.events as { tag_ids?: number[] }[]) : [];
      if (events.some((event) => event.tag_ids?.some((id) => !tagsById.has(id)))) notifyTagsChanged();
    } catch (error) {
      // A limit reached is not a failure to retry at once: the user is told when the assistant answers again
      // A limit reached, or a file that cannot be read: said in words, not as a failure to retry
      const told = error instanceof ApiError && [413, 422, 429].includes(error.status);
      push({ id: ++messageId, role: "error", text: told ? error.message : TEMPORARY_ERROR });
    } finally {
      setBusy(false);
    }
  };

  // A voice message goes at once, as in a messenger: the chat shows the recording, the server reads what was said
  // A file attached before recording goes with it, as with a typed message
  const sendVoice = async (audio: Blob, duration: number) => {
    if (busy) return;
    const attached = file;
    setFile(null);
    push({
      id: ++messageId,
      role: "user",
      text: "",
      voice: { src: URL.createObjectURL(audio), duration },
      file: attached ? { name: attached.name, size: attached.size } : undefined,
    });
    setBusy(true);
    try {
      const { message_id: serverId, ...reply } = await api.assistant.chatVoice(audio, duration, attached);
      push({ id: ++messageId, role: "assistant", reply: reply as AssistantReply, serverId });
      if (reply.kind === "completed") notifyTasksChanged();
    } catch (error) {
      // Speech that could not be made out or a limit reached is said in words, not as a failure to retry
      const told = error instanceof ApiError && [413, 422, 429].includes(error.status);
      push({ id: ++messageId, role: "error", text: told ? error.message : TEMPORARY_ERROR });
    } finally {
      setBusy(false);
    }
  };

  const initial = panel ? null : query.get("q");
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!loaded || !initial || handled.current === initial) return;
    handled.current = initial;
    navigate("/assistant", { replace: true });
    send(initial);
  }, [initial, loaded]);

  const topic = panel ? null : query.get("topic");
  const topicText = panel ? null : query.get("text");
  // ?ask=1: the recommendation's "Как это сделать?" button — the question is asked right away
  const askHow = query.get("ask") === "1";
  useEffect(() => {
    if (!loaded || !topic || !topicText || handled.current === `topic:${topic}`) return;
    handled.current = `topic:${topic}`;
    navigate("/assistant", { replace: true });
    api.assistant
      .topic(topic.slice(0, 120), topicText.slice(0, 600))
      .then((reply) => {
        setMessages((items) => {
          const last = items[items.length - 1];
          const same =
            last?.role === "assistant" &&
            last.reply.kind === "topic" &&
            JSON.stringify(last.reply) === JSON.stringify(reply);
          return same ? items : [...items, { id: ++messageId, role: "assistant", reply }];
        });
        if (askHow) void send(TOPIC_REPLIES[0]);
      })
      .catch(() => push({ id: ++messageId, role: "error", text: TEMPORARY_ERROR }));
  }, [topic, topicText, loaded]);

  const replace = (id: number, reply: AssistantReply) =>
    setMessages((items) =>
      items.map((item) =>
        item.id === id && item.role === "assistant" ? { ...item, reply } : item
      )
    );

  const quick = (action: (typeof QUICK_ACTIONS)[number]) => {
    if (!action.fill) return send(action.label);
    setText(action.fill);
    requestAnimationFrame(() => {
      const input = inputRef.current;
      input?.focus();
      input?.setSelectionRange(action.fill!.length, action.fill!.length);
    });
  };

  return (
    <div
      className={cn(
        "relative flex flex-col min-h-0",
        panel
          ? "h-full"
          : cn(
              "max-w-3xl mx-auto lg:h-[calc(100dvh-3rem)]",
              // On a phone the chat is pinned between the top bar and the tab bar: the page itself never scrolls,
              // so a swipe moves only the messages, not the input with an empty space under it
              "max-lg:fixed max-lg:inset-x-4 max-lg:top-16 max-lg:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] max-lg:z-10"
            )
      )}
    >
      {panel ? (
        <div className="shrink-0 flex items-center gap-2 px-4 pt-3 pb-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Dayla</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{tr("ассистент", "assistant")}</span>
          <span className="ml-auto flex items-center gap-1">
            <Link
              to="/events/new"
              className="inline-flex items-center gap-1 px-2 h-8 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-500/10"
              title={tr("Новая задача вручную", "New task by hand")}
            >
              <Icon name="plus" size={14} /> {tr("Задача", "Task")}
            </Link>
            {clearButton}
            <Link
              to="/assistant"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-500/10"
              aria-label={tr("Открыть чат на весь экран", "Open the chat full screen")}
              title={tr("На весь экран", "Full screen")}
            >
              <Icon name="external" size={15} />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-500/10"
              aria-label={tr("Свернуть чат", "Minimise chat")}
            >
              <Icon name="close" size={16} />
            </button>
          </span>
        </div>
      ) : (
        // Just the name and the bin: the screen belongs to the conversation
        <div className="shrink-0 flex items-center gap-2 px-1 sm:px-2 pb-2">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">{tr("Ассистент", "Assistant")}</h1>
          <span className="ml-auto">{clearButton}</span>
        </div>
      )}

      {/* ─── Чат: прокручивается только он ─────────── */}
      <div ref={listRef} role="log" aria-label={tr("Переписка с Dayla", "Conversation with Dayla")} className={cn("relative flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4", panel ? "px-3 py-2" : "p-1 sm:p-2")}>
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
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {tr("Напишите, что нужно, — своими словами", "Say what you need — in your own words")}
            </p>
            <ul className="w-full max-w-md space-y-1.5 text-left text-sm text-gray-600 dark:text-gray-300">
              {ABILITIES.map(([what, example]) => (
                <li key={what}>
                  <strong className="font-medium text-gray-900 dark:text-white">{what}:</strong> {example}
                </li>
              ))}
            </ul>
            <div className="w-full max-w-md mt-4">
              <TelegramPrompt place="chat" compact />
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
            aria-label={tr("Dayla думает", "Dayla is thinking")}
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
      </div>

      {/* ─── Быстрые команды + Composer: всегда внизу ─── */}
      <div className={cn("shrink-0 pt-2", panel && "px-3 pb-3")}>
        <div
          className="mb-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]"
          role="group"
          aria-label={tr("Быстрые команды", "Quick commands")}
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              className={cn(GLASS_CHIP, "shrink-0", action.fill && "text-sky-800 dark:text-sky-100")}
              disabled={busy}
              onClick={() => quick(action)}
            >
              <span className="relative whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
        <Composer value={text} onChange={setText} file={file} onFile={setFile} onSend={() => send(text, file)} onVoice={sendVoice} busy={busy} inputRef={inputRef} />
      </div>
    </div>
  );
}

// Time fields of a draft card: the same glass as its date field
const DRAFT_TIME =
  "h-9 px-3 text-sm rounded-lg bg-white/[0.05] dark:bg-white/[0.02] ring-1 ring-white/20 dark:ring-white/10 " +
  "focus-within:ring-sky-400/50 text-gray-900 dark:text-white";

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
          {message.file && <FileChip file={message.file} />}
          {message.voice && (
            <div className={cn(message.file && "mt-1.5")}>
              <VoiceBubble src={message.voice.src} duration={message.voice.duration} />
            </div>
          )}
          {message.text && <p className={cn("relative whitespace-pre-wrap", message.file && "mt-1.5")}>{message.text}</p>}
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
            {tr("Рекомендация", "Recommendation")}
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
                {reply.kind === "updated" ? reply.text ?? tr("Изменила", "Updated") : tr("Добавила в календарь", "Added to the calendar")}
              </p>
              {reply.note && <p className="text-xs text-gray-500 dark:text-gray-400">{reply.note}</p>}
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
                {tr(
                  "Пишите как другу — текстом, голосом или документом. Всё, что меняет календарь, я сначала покажу на подтверждение.",
                  "Write as you would to a friend — by text, voice or document. Anything that changes the calendar I'll show you to confirm first."
                )}
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
          {reply.kind === "advice" && <AdviceReply items={reply.items} onAppend={onAppend} send={send} />}
          {reply.kind === "reminders" && <RemindersReply initial={reply.settings} />}
          {reply.kind === "reminder" && (
            <ReminderReply reply={reply} onDone={(text) => onReply(message.id, { kind: "cancelled", text })} />
          )}
          {reply.kind === "agenda" && (
            <AgendaReply reply={reply} onReply={(next) => onReply(message.id, next)} onAppend={onAppend} />
          )}
          {(reply.kind === "answer" ||
            reply.kind === "not_found" ||
            reply.kind === "edit_error" ||
            reply.kind === "cancelled") && <RichText text={reply.text} />}
          {reply.kind === "nothing" && (
            <p>
              {tr(
                "Я лучше всего помогаю с планами: добавить задачу, перенести встречу, напомнить о деле. Напишите, например, «созвон с Олей завтра в 15:00» или «что у меня на завтра?».",
                "I'm best at plans: adding a task, moving a meeting, reminding you of something. Try “call with Olya tomorrow at 3 pm” or “what do I have tomorrow?”."
              )}
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
  const [moving, setMoving] = useState(false);
  const busy = false;

  const count = reply.days.reduce((sum, day) => sum + day.events.length, 0);

  return (
    <div className="space-y-3">
      {reply.answer && <RichText text={reply.answer} />}
      <p>
        {count
          ? reply.mark
            ? `${tr("Отметьте выполненное", "Tick what's done")} · ${reply.title}`
            : moving
              ? `${tr("Что перенести?", "What to move?")} · ${reply.title}`
              : reply.title
          : tr("Ничего не запланировано.", "Nothing planned.")}
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
            <AssistantEvents events={day.events} showDay={false} />
          )}
        </div>
      ))}
      {reply.scope && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            to="/calendar?view=week"
            className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-xs font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-500/10"
          >
            <Icon name="calendar" size={13} /> {tr("Неделя в календаре", "Week in the calendar")}
          </Link>
          {count > 0 && !reply.mark && (
            <Button variant="ghost" size="sm" icon={moving ? "left" : "sync"} disabled={busy} onClick={() => setMoving((value) => !value)}>
              {moving ? tr("Готово", "Done") : tr("Перенести", "Move")}
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
            aria-label={done[event.id] ? `${tr("Снять отметку", "Unmark")}: ${event.title}` : `${tr("Выполнено", "Done")}: ${event.title}`}
            className={cn(
              "relative shrink-0 w-5 h-5 rounded-md flex items-center justify-center overflow-hidden",
              "border-2 transition-colors",
              // An empty box has to be visible on the light glass too
              done[event.id]
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-white/70 dark:bg-white/[0.04] border-gray-400 dark:border-gray-500 hover:border-sky-500"
            )}
            onClick={() => toggle(event)}
          >
            {done[event.id] && <Icon name="check" size={12} />}
          </button>
          <span
            className={cn(
              "flex-1 min-w-0 flex items-baseline gap-2 text-sm transition-opacity",
              done[event.id] && "opacity-45"
            )}
          >
            {!event.all_day && (
              <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                {formatTime(new Date(event.start))}
              </span>
            )}
            <span className="truncate text-gray-900 dark:text-white">{event.title}</span>
            <TagList ids={event.tag_ids} />
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
    { label: tr("Сегодня", "Today"), day: dayKey(today) },
    { label: tr("Завтра", "Tomorrow"), day: dayKey(addDays(today, 1)) },
    { label: tr("Послезавтра", "Day after tomorrow"), day: dayKey(addDays(today, 2)) },
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
  if (!open.length) return <p className="text-sm text-gray-500 dark:text-gray-400">{tr("Переносить нечего.", "Nothing to move.")}</p>;

  return (
    <ul className="space-y-2">
      {open.map((event) => {
        const current = event.start.slice(0, 10);
        const done = movedTo[event.id];
        return (
          <li key={event.id} className={cn("relative rounded-xl px-3 py-2 space-y-1.5", GLASS_BODY)}>
            <span className="flex items-baseline gap-2 text-sm">
              {!event.all_day && (
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
                  {formatTime(new Date(event.start))}
                </span>
              )}
              <span className={cn("truncate text-gray-900 dark:text-white", done && "text-gray-400 dark:text-gray-500")}>
                {event.title}
              </span>
            </span>
            {done ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {tr("Перенесено на", "Moved to")} {relativeDay(parseDayKey(done) ?? today).toLowerCase()}
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
                  <Icon name="calendar" size={12} /> {tr("Другой день", "Another day")}
                  <input
                    type="date"
                    aria-label={tr(`Другой день для «${event.title}»`, `Another day for “${event.title}”`)}
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
        {tr("Вернуть на", "Move back to")} {moved.from_label}
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
      onDone(
        deleted
          ? tr(`Отменено — удалила добавленное (${deleted}).`, `Undone — removed what was added (${deleted}).`)
          : tr("Эти задачи уже удалены или изменены.", "These tasks have already been deleted or changed.")
      );
    } catch {
      reportError(TEMPORARY_ERROR);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button variant="ghost" size="sm" icon="left" busy={busy} onClick={undo}>
        {tr("Отменить", "Undo")}
      </Button>
    </div>
  );
}

/* ─── ReminderReply ──────────────────────────────────────── */

function ReminderReply({
  reply,
  onDone,
}: {
  reply: Extract<AssistantReply, { kind: "reminder" }>;
  onDone: (text: string) => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const reportError = useErrorToast();

  const cancel = async (id: number) => {
    setBusy(id);
    try {
      const result = await api.assistant.cancelReminder(id);
      onDone(result.kind === "cancelled" ? result.text : tr("Напоминание отменено", "Reminder cancelled"));
    } catch {
      reportError(tr("Напоминание уже пришло или отменено", "The reminder has already come or been cancelled"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      {reply.reminders.map((item) => (
        <div key={item.id} className="flex items-start gap-2 text-sky-700 dark:text-sky-300">
          <Icon name={item.repeat ? "sync" : "bell"} size={16} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium break-words">{item.text}</p>
            <p className="text-sm">
              {item.repeat ? (
                <>
                  {tr("Повтор", "Repeat")}: {item.repeat}
                  <span className="text-gray-500 dark:text-gray-400"> · {tr("первое", "first")} — {item.label}</span>
                </>
              ) : (
                <>{tr("Напомню", "I'll remind you")} {item.label}</>
              )}
            </p>
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-500 dark:text-gray-400">{tr("Напоминание придёт в Telegram.", "The reminder will come to Telegram.")}</p>
      <div className="flex flex-wrap gap-1.5">
        {reply.reminders.map((item) => (
          <Button key={item.id} variant="ghost" size="sm" icon="close" busy={busy === item.id} onClick={() => cancel(item.id)}>
            {reply.reminders.length > 1
              ? tr(`Отменить «${item.text}»`, `Cancel “${item.text}”`)
              : item.repeat
                ? tr("Отменить повтор", "Cancel the repeat")
                : tr("Отменить", "Cancel")}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ─── StatsReply ─────────────────────────────────────────── */

function StatsReply({ stats }: { stats: Extract<AssistantReply, { kind: "stats" }> }) {
  const max = Math.max(1, ...stats.days.map((day) => day.total));
  const todayKey = stats.today.date;
  const delta = stats.previous_percent == null || !stats.total ? null : stats.percent - stats.previous_percent;
  const habits = stats.habits ?? {};
  const noticed = [
    habits.done_per_day != null &&
      tr(
        `Обычно вы выполняете ${habits.done_per_day} ${plural(Math.round(habits.done_per_day), "задачу", "задачи", "задач")} в день${
          habits.planned_per_day ? `, а планируете ${habits.planned_per_day}` : ""
        }.`,
        `You usually complete ${habits.done_per_day} ${habits.done_per_day === 1 ? "task" : "tasks"} a day${
          habits.planned_per_day ? ` and plan ${habits.planned_per_day}` : ""
        }.`
      ),
    habits.most_done && tr(`Вы ${habits.most_done}.`, `You: ${habits.most_done}.`),
    habits.weak_weekday && `${tr("Слабее всего день", "Weakest day")} — ${habits.weak_weekday}.`,
    ...(habits.slipping ?? []).slice(0, 2).map((text) => `${tr("Откладывается", "Keeps slipping")}: ${text}.`),
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {/* ─── Итог недели и сравнение с прошлой ─── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {tr("Выполнено за 7 дней", "Done in 7 days")}
          </p>
          <p className="text-3xl font-semibold tabular-nums leading-tight">{stats.percent}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {stats.done} {tr("из", "of")} {stats.total} {pluralWord(stats.total, ["задачи", "задач", "задач"], ["task", "tasks"])}
          </p>
        </div>
        {delta !== null && (
          <span
            className={cn(
              "inline-flex items-center px-2.5 h-7 rounded-full text-xs font-medium",
              delta >= 0
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
            )}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% {tr("к прошлой неделе", "vs last week")}
          </span>
        )}
      </div>

      {/* ─── По дням: синее — сделано, красное — не сделано ─── */}
      <div>
        <div className="flex items-end gap-1.5 h-28" aria-label={tr("Выполнение по дням", "Completion by day")}>
          {stats.days.map((day) => {
            const isToday = day.date === todayKey;
            const missed = day.total - day.done;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 h-full min-w-0">
                <span className="text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
                  {day.total ? `${day.done}/${day.total}` : "—"}
                </span>
                <span className="relative flex-1 w-full flex flex-col justify-end">
                  <span
                    className="w-full flex flex-col rounded-md overflow-hidden"
                    style={{ height: `${(day.total / max) * 100}%` }}
                    title={`${day.done} ${tr("из", "of")} ${day.total}`}
                  >
                    {missed > 0 && (
                      <span
                        className={isToday ? "bg-gray-400/35" : "bg-rose-400/70"}
                        style={{ flexGrow: missed }}
                      />
                    )}
                    {day.done > 0 && <span className="bg-blue-500/85" style={{ flexGrow: day.done }} />}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    isToday ? "font-semibold text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  {isToday
                    ? tr("сег.", "today")
                    : (parseDayKey(day.date) ?? new Date()).toLocaleDateString(LOCALE, { weekday: "short" })}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center gap-1">
            <i className="w-2 h-2 rounded-sm bg-blue-500/85" /> {tr("сделано", "done")}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="w-2 h-2 rounded-sm bg-rose-400/70" /> {tr("не сделано", "not done")}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="w-2 h-2 rounded-sm bg-gray-400/35" /> {tr("сегодня ещё впереди", "still ahead today")}
          </span>
        </p>
      </div>

      <p className="text-sm">
        {tr("Сегодня", "Today")}: <strong className="font-semibold">{stats.today.done}</strong> {tr("из", "of")} {stats.today.total}
        {stats.streak > 0 && (
          <span className="text-gray-500 dark:text-gray-400">
            {" "}· 🔥 {stats.streak} {pluralWord(stats.streak, ["день", "дня", "дней"], ["day", "days"])}{" "}
            {tr("подряд всё выполнено", "in a row with everything done")}
            {stats.best_streak > stats.streak ? ` (${tr("рекорд", "record")} — ${stats.best_streak})` : ""}
          </span>
        )}
      </p>

      {/* ─── По сферам ─── */}
      {habits.spheres_done && habits.spheres_done.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {tr("По сферам за 4 недели", "By area over 4 weeks")}
          </p>
          {habits.spheres_done.map((line) => {
            const [name, rest] = line.split(": ");
            const percent = Number(/(\d+)%/.exec(rest ?? "")?.[1] ?? 0);
            return (
              <div key={line} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
                <span className="truncate">{name}</span>
                <span className="h-1.5 rounded-full bg-gray-500/15 overflow-hidden">
                  <span
                    className={cn("block h-full rounded-full", percent >= 50 ? "bg-blue-500/85" : "bg-rose-400/80")}
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="tabular-nums text-right text-gray-500 dark:text-gray-400">{percent}%</span>
              </div>
            );
          })}
        </div>
      )}

      {noticed.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">{tr("Что я заметила", "What I noticed")}</p>
          <ul className="space-y-1 text-sm">
            {noticed.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="text-sky-600 dark:text-sky-300">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── AdviceReply ────────────────────────────────────────── */

function AdviceReply({
  items,
  onAppend,
  send,
}: {
  items: Extract<AssistantReply, { kind: "advice" }>["items"];
  onAppend: (reply: AssistantReply) => void;
  send?: (text: string) => void;
}) {
  const reportError = useErrorToast();
  if (!items.length) return <p>{tr("Пока советовать нечего — план в порядке.", "Nothing to advise yet — the plan looks fine.")}</p>;

  // "Как это сделать?": the recommendation becomes the topic and the question is asked at once
  const discuss = async (index: number) => {
    try {
      onAppend(await api.assistant.topic(items[index].title, items[index].text));
      send?.(TOPIC_REPLIES[0]);
    } catch {
      reportError(TEMPORARY_ERROR);
    }
  };

  return (
    <>
      <p>{tr("Советы на сегодня:", "Tips for today:")}</p>
      <RecommendationList items={items} full onDiscuss={discuss} />
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
      <p>{tr("Напоминания приходят в Telegram.", "Reminders come to Telegram.")}</p>
      <Switch
        checked={settings.enabled}
        onChange={(enabled) => toggle({ enabled })}
        label={tr("Напоминать о событиях", "Remind me about events")}
      />
      <Switch
        checked={settings.daily_digest_enabled}
        onChange={(value) => toggle({ daily_digest_enabled: value })}
        label={`${tr("Утренний план", "Morning plan")} · ${settings.daily_digest_time.slice(0, 5)}`}
      />
      <Switch
        checked={settings.evening_enabled}
        onChange={(value) => toggle({ evening_enabled: value })}
        label={`${tr("Итоги дня", "Evening summary")} · ${settings.evening_time.slice(0, 5)}`}
      />
      <Switch
        checked={settings.deadline_enabled}
        onChange={(value) => toggle({ deadline_enabled: value })}
        label={tr("Приближение дедлайнов", "Upcoming deadlines")}
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
        <span className="relative">{tr("Время и остальные настройки", "Times and other settings")}</span>
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
      reportError(tr("Не удалось сохранить оценку", "Could not save the rating"));
    }
  };

  return (
    <div
      className="flex items-center gap-1 pt-1"
      role="group"
      aria-label={tr("Оцените ответ", "Rate the answer")}
    >
      {([1, -1] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          aria-label={v === 1 ? tr("Хороший ответ", "Good answer") : tr("Плохой ответ", "Bad answer")}
          title={v === 1 ? tr("Хороший ответ", "Good answer") : tr("Плохой ответ", "Bad answer")}
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
  const [busy, setBusy] = useState<DeleteScope | "cancel" | null>(null);
  const reportError = useErrorToast();

  const run = async (kind: DeleteScope | "cancel") => {
    setBusy(kind);
    try {
      const result =
        kind === "cancel"
          ? await api.assistant.cancelDraft(reply.draft_id)
          : await api.assistant.confirmDraft(reply.draft_id, kind);
      if (result.kind === "deleted") notifyTasksChanged();
      onReply(result);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
        onReply({ kind: "cancelled", text: tr("Этот запрос уже обработан или устарел.", "This request has already been handled or is out of date.") });
      } else {
        reportError(TEMPORARY_ERROR);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2.5">
      <RichText text={reply.answer ?? tr(`Удалить ${reply.count}?`, `Delete ${reply.count}?`)} />
      <AssistantEvents events={reply.events} />
      {reply.count > reply.events.length && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {tr("…и ещё", "…and")} {reply.count - reply.events.length}{tr("", " more")}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {reply.series ? (
          // A repeated task: just the found days, them and the later ones, or the whole series
          <DeleteScopeButtons
            several={reply.count > 1}
            busy={busy === "cancel" ? null : busy}
            onPick={(scope) => run(scope)}
          />
        ) : (
          <Button
            variant="danger"
            size="sm"
            icon="trash"
            busy={busy === "one"}
            onClick={() => run("one")}
          >
            {tr("Удалить", "Delete")} ({reply.count})
          </Button>
        )}
        <Button variant="ghost" size="sm" busy={busy === "cancel"} onClick={() => run("cancel")}>
          {tr("Не удалять", "Keep")}
        </Button>
      </div>
    </div>
  );
}

/* ─── AssistantEvents ────────────────────────────────────── */

function AssistantEvents({ events, showDay = true }: { events: AssistantEvent[]; showDay?: boolean }) {
  const today = dayKey(new Date());
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
              event.completed && "opacity-45"
            )}
          >
            <span className="relative flex flex-col shrink-0 min-w-[2.75rem] text-xs tabular-nums">
              <span
                className={cn(
                  "font-semibold",
                  event.completed
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-sky-700 dark:text-sky-300"
                )}
              >
                {event.all_day ? "" : formatTime(new Date(event.start))}
              </span>
              {showDay && event.start.slice(0, 10) !== today && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {relativeDay(new Date(event.start))}
                </span>
              )}
            </span>
            <span className="relative min-w-0 flex-1">
              <span
                className={cn(
                  "block text-sm text-gray-900 dark:text-white truncate",
                )}
              >
                {event.title}
              </span>
              {(event.recurrence || event.location || event.deadline || multiDay(event) || !!event.tag_ids?.length) && (
                <span className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {multiDay(event) && (
                    <span>
                      {tr("по", "until")}{" "}
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
                  <TagList ids={event.tag_ids} />
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

/** The end a task gets when none was said: an hour after the start, as the server does. */
function hourLater(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const total = (hours * 60 + minutes + 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function describeBefore(before: NonNullable<DraftItem["before"]>): string {
  const day = parseDayKey(before.date);
  const when = day ? relativeDay(day).toLowerCase() : before.date;
  return [
    when,
    before.time ? `${before.time}${before.end_time ? `–${before.end_time}` : ""}` : tr("без времени", "no time"),
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
  const [calendars, setCalendars] = useState<string[]>(reply.calendars ?? []);
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
        onReply({ kind: "cancelled", text: tr("Этот черновик уже обработан или устарел.", "This draft has already been handled or is out of date.") });
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
  const targets = reply.targets ?? [];
  // Several new tasks (steps of a big one): first how they fit the calendar, editing on demand
  const plan = !isChange && items.length >= 3;
  const [editing, setEditing] = useState(!plan);

  // Saved at once: the choice is also the default for the next drafts
  const toggleCalendar = async (slug: string) => {
    const previous = calendars;
    const next = calendars.includes(slug) ? calendars.filter((item) => item !== slug) : [...calendars, slug];
    setCalendars(next);
    try {
      await api.assistant.setDraftCalendars(reply.draft_id, next);
    } catch (error) {
      setCalendars(previous);
      reportError(errorText(error));
    }
  };

  return (
    <div className="space-y-3">
      <RichText
        text={
          reply.answer ??
          (items.length > 1
            ? tr("Вот что я поняла — проверьте задачи и добавьте:", "Here is what I understood — check the tasks and add them:")
            : tr("Вот что я поняла — проверьте и добавьте:", "Here is what I understood — check and add it:"))
        }
      />
      {reply.note && <p className="text-xs text-gray-500 dark:text-gray-400">{reply.note}</p>}

      {plan && <DraftPreview items={items} />}
      {plan && (
        <Button variant="ghost" size="sm" icon={editing ? "left" : "settings"} onClick={() => setEditing(!editing)}>
          {editing ? tr("Свернуть правку", "Close editing") : tr("Поправить шаги", "Edit the steps")}
        </Button>
      )}

      {editing && items.map((item, index) => (
        <div
          key={index}
          className={cn("relative overflow-hidden rounded-xl p-3 space-y-2", GLASS_BODY)}
        >
          {item.before && (
            <span className="relative block text-[11px] text-gray-500 dark:text-gray-400">
              {tr("Было", "Was")}: {item.before.title !== item.title ? tr(`«${item.before.title}», `, `“${item.before.title}”, `) : ""}
              {describeBefore(item.before)}
            </span>
          )}

          <input
            value={item.title}
            onChange={(e) => patch(index, { title: e.target.value })}
            aria-label={tr("Название", "Title")}
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
                {tr("Дата", "Date")}
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
                {tr("Время", "Time")}
              </span>
              <TimeField
                value={item.time ?? ""}
                onChange={(value) =>
                  patch(index, {
                    time: value || null,
                    end_time: value ? item.end_time : null,
                  })
                }
                allowEmpty
                label={tr("Время", "Time")}
                className={DRAFT_TIME}
              />
            </label>
            {item.time && (
              <label className="flex-1 min-w-[7rem]">
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                  {tr("До", "To")}
                </span>
                <TimeField
                  value={item.end_time ?? hourLater(item.time)}
                  onChange={(value) => patch(index, { end_time: value || null })}
                  label={tr("Время окончания", "End time")}
                  className={cn(DRAFT_TIME, !item.end_time && "text-gray-500 dark:text-gray-400")}
                />
              </label>
            )}
            {item.end_date && (
              <label className="flex-1 min-w-[7rem]">
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                  {tr("По", "Until")}
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
                {tr("Без времени", "No time")}
              </Button>
            ) : null}
          </div>

          {(item.deadline || item.fixed || !!item.tag_ids?.length) && (
            <div className="relative flex flex-wrap items-center gap-1.5">
              <TagList ids={item.tag_ids} />
              {item.deadline && (
                <Badge tone={deadlineTone(item.deadline)}>
                  {tr("дедлайн", "deadline")} {formatDeadline(item.deadline).replace(/^(до|by) /, "")}
                </Badge>
              )}
              {item.fixed && <Badge tone="accent">{tr("нельзя переносить", "can't be moved")}</Badge>}
            </div>
          )}

          {(item.recurrence || items.length > 1) && (
            <div className="relative flex items-center justify-between gap-2">
              {item.recurrence && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                  <Icon name="sync" size={11} /> {item.recurrence}, {tr("с", "from")}{" "}
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
                  {tr("Убрать", "Remove")}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}

      {!isChange && targets.length > 0 && (
        <fieldset className="space-y-1.5">
          <legend className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <Icon name="calendar" size={13} />
            {tr("Добавить также в", "Also add to")}
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {targets.map((option) => {
              const checked = calendars.includes(option.slug);
              return (
                <label
                  key={option.slug}
                  className={cn(
                    "inline-flex items-center gap-2 h-8 px-3 rounded-lg cursor-pointer select-none",
                    "text-sm ring-1 transition-colors",
                    checked
                      ? "bg-sky-500/15 ring-sky-400/50 text-gray-900 dark:text-white"
                      : "bg-white/[0.05] dark:bg-white/[0.02] ring-white/20 dark:ring-white/10 text-gray-600 dark:text-gray-300"
                  )}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleCalendar(option.slug)} />
                  {option.title}
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {calendars.length ? tr("И, как всегда, в Dayla.", "And, as always, to Dayla.") : tr("Только в Dayla.", "Dayla only.")}
          </p>
        </fieldset>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="primary"
          size="sm"
          icon={isChange ? "check" : "plus"}
          busy={busy === "confirm"}
          disabled={!items.length || items.some((item) => !item.title.trim())}
          onClick={confirm}
        >
          {isChange ? tr("Сохранить", "Save") : tr("Добавить", "Add")} {items.length > 1 ? `(${items.length})` : ""}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          busy={busy === "cancel"}
          onClick={() => run("cancel", () => api.assistant.cancelDraft(reply.draft_id))}
        >
          {tr("Отмена", "Cancel")}
        </Button>
      </div>
    </div>
  );
}

/* ─── DraftPreview: how new tasks fit the calendar ───────── */

function DraftPreview({ items }: { items: DraftItem[] }) {
  const days = [...new Set(items.map((item) => item.date))].sort();
  const first = parseDayKey(days[0]);
  const last = parseDayKey(days[days.length - 1]);
  const [existing, setExisting] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!first || !last) return;
    let active = true;
    api.events
      .list({ start: first.toISOString(), end: addDays(last, 1).toISOString(), limit: 500 })
      .then((events) => active && setExisting(events))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [days[0], days[days.length - 1]]);

  return (
    <div className={cn("relative rounded-xl p-3 space-y-2.5", GLASS_BODY)} aria-label={tr("Как это будет в календаре", "How it will look in the calendar")}>
      <p className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">{tr("В календаре", "In the calendar")}</p>
      {days.map((key) => {
        const day = parseDayKey(key) ?? new Date();
        const fresh = items.filter((item) => item.date === key);
        const taken = existing.filter(
          (event) => !event.completed_at && dayKey(new Date(event.start_at)) === key
        );
        const rows = [
          ...taken.map((event) => ({
            key: `e${event.id}`,
            time: event.all_day ? "" : formatTime(new Date(event.start_at)),
            title: event.title,
            fresh: false,
          })),
          ...fresh.map((item, index) => ({
            key: `n${index}`,
            time: item.time ?? "",
            title: item.title,
            fresh: true,
          })),
        ].sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
        return (
          <div key={key} className="space-y-1">
            <span className="block text-xs font-semibold text-gray-700 dark:text-gray-200 capitalize-first">
              {relativeDay(day)}
            </span>
            <ul className="space-y-1 min-w-0">
              {rows.map((row) => (
                <li
                  key={row.key}
                  className={cn(
                    "flex items-baseline gap-2 px-2 py-1 rounded-lg text-xs min-w-0",
                    row.fresh
                      ? "bg-sky-500/15 ring-1 ring-sky-400/40 text-gray-900 dark:text-white font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  <span className="tabular-nums shrink-0 w-9">{row.time || "—"}</span>
                  <span className="truncate">{row.title}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        {tr("Выделены новые шаги, серым — то, что уже есть в эти дни.", "New steps are highlighted; what's already on those days is grey.")}
      </p>
    </div>
  );
}

/* ─── Composer ───────────────────────────────────────────── */

function fileSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} ${tr("КБ", "KB")}`
    : `${(bytes / 1024 / 1024).toFixed(1)} ${tr("МБ", "MB")}`;
}

/** A file in a message, the way messengers show one: its icon, name and size. */
const clock = (seconds: number) => {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

/** A voice message in the chat, as in a messenger: play/pause, progress and length. */
function VoiceBubble({ src, duration }: { src: string; duration: number }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  // A recording that is gone (the chat was cleared elsewhere) says so instead of a silent button
  const [missing, setMissing] = useState(false);
  const length = duration || audio.current?.duration || 0;

  const toggle = () => {
    const element = audio.current;
    if (!element) return;
    if (playing) element.pause();
    else void element.play().catch(() => setMissing(true));
  };

  return (
    <div className="relative flex items-center gap-2.5 min-w-[11rem]">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setPosition(0);
        }}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onError={() => setMissing(true)}
      />
      <button
        type="button"
        onClick={toggle}
        disabled={missing}
        aria-label={playing ? tr("Пауза", "Pause") : tr("Прослушать голосовое сообщение", "Play the voice message")}
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/25 hover:bg-white/35 disabled:opacity-50 transition-colors"
      >
        <Icon name={playing ? "pause" : "play"} size={14} />
      </button>
      <span className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden" aria-hidden="true">
        <span className="block h-full bg-current transition-[width]" style={{ width: `${length ? Math.min(100, (position / length) * 100) : 0}%` }} />
      </span>
      <span className="shrink-0 text-xs tabular-nums opacity-80">
        {missing ? tr("запись удалена", "recording removed") : clock(playing || position ? position : length)}
      </span>
    </div>
  );
}

function FileChip({ file, onRemove }: { file: ChatFile; onRemove?: () => void }) {
  return (
    <span className="relative inline-flex items-center gap-2 max-w-full rounded-xl bg-white/15 dark:bg-white/10 px-2.5 py-1.5 text-xs">
      <Icon name="file" size={15} />
      <span className="truncate min-w-0">{file.name}</span>
      {file.size > 0 && <span className="shrink-0 opacity-70">{fileSize(file.size)}</span>}
      {onRemove && (
        <button type="button" className="shrink-0 opacity-70 hover:opacity-100" aria-label={tr("Убрать файл", "Remove the file")} onClick={onRemove}>
          <Icon name="close" size={13} />
        </button>
      )}
    </span>
  );
}

// Files the server reads: documents, tables, text and photos
const CHAT_FILES = ".pdf,.docx,.xlsx,.csv,.tsv,.txt,.md,.ics,.jpg,.jpeg,.png,.webp,.gif";

function Composer({
  value,
  onChange,
  file,
  onFile,
  onSend,
  onVoice,
  busy,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  file: File | null;
  onFile: (file: File | null) => void;
  onSend: () => void;
  /** A finished recording: sent at once as a voice message */
  onVoice: (audio: Blob, duration: number) => void;
  busy: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const reportError = useErrorToast();
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const textarea = inputRef ?? ownRef;
  // A narrow screen gets a short placeholder: a wrapped one showed half of its second line under the field
  const [narrow, setNarrow] = useState(() => window.matchMedia("(max-width: 639px)").matches);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setNarrow(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // The field grows with the text (up to max-h-32, then it scrolls) instead of cutting lines off
  useLayoutEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  }, [value, narrow, textarea]);

  // Recording works as a voice message in a messenger: stopping it sends the recording itself
  const toggleRecording = async () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const media = new MediaRecorder(stream);
      let started = 0;
      media.ondataavailable = (event) => chunks.push(event.data);
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const audio = new Blob(chunks, { type: media.mimeType });
        if (audio.size) onVoice(audio, (Date.now() - started) / 1000);
      };
      recorder.current = media;
      media.start();
      started = Date.now();
      setRecording(true);
    } catch {
      reportError(tr("Нет доступа к микрофону", "No access to the microphone"));
    }
  };

  const pickFile = (picked: File | undefined) => {
    if (picked) onFile(picked);
    if (fileInput.current) fileInput.current.value = "";
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
    <div className="space-y-1.5">
    {file && (
      <div className="flex">
        <FileChip file={{ name: file.name, size: file.size }} onRemove={() => onFile(null)} />
      </div>
    )}
    <form
      onSubmit={submit}
      // A screenshot pasted or a file dropped on the field is attached, as in any messenger
      onPaste={(event) => {
        const pasted = event.clipboardData.files[0];
        if (pasted) {
          event.preventDefault();
          onFile(pasted);
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const dropped = event.dataTransfer.files[0];
        if (dropped) {
          event.preventDefault();
          onFile(dropped);
        }
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl flex items-end gap-1 p-1.5",
        GLASS_BODY
      )}
    >
      <input
        ref={fileInput}
        type="file"
        accept={CHAT_FILES}
        hidden
        onChange={(e) => pickFile(e.target.files?.[0])}
      />
      <Button
        variant="ghost"
        icon="clip"
        aria-label={tr("Прикрепить файл или фото", "Attach a file or photo")}
        title={tr("Файл или фото с планами: PDF, Word, Excel, CSV, текст, картинка", "A file or photo with plans: PDF, Word, Excel, CSV, text, image")}
        disabled={busy}
        onClick={() => fileInput.current?.click()}
      />
      <textarea
        ref={textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={recording ? tr("Говорите…", "Speak…") : narrow ? tr("Напишите Dayla…", "Message Dayla…") : tr("Запланировать, найти, перенести…", "Plan, find, move…")}
        aria-label={tr("Сообщение", "Message")}
        maxLength={50000}
        className={cn(
          "relative flex-1 min-w-0 resize-none",
          "appearance-none",
          "border-0 outline-none focus:outline-none focus:ring-0",
          "bg-transparent",
          "shadow-none",
          // 16px on a phone: a smaller field makes iOS zoom the page in on focus
          "px-2 py-2 text-base leading-6 sm:text-sm sm:leading-5",
          "text-gray-900 dark:text-white",
          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
          "max-h-32 overflow-y-auto"
        )}
        style={{
          background: "transparent",
          border: "none",
          outline: "none",
          boxShadow: "none",
          resize: "none",
          // Mobile browsers drew a scroll corner as a dot in the field's corner
          scrollbarWidth: "none",
        }}
      />
      {"MediaRecorder" in window && (
        <Button
          variant={recording ? "danger" : "ghost"}
          icon={recording ? "stop" : "mic"}
          aria-label={recording ? tr("Остановить и отправить", "Stop and send") : tr("Записать голосовое сообщение", "Record a voice message")}
          disabled={busy && !recording}
          onClick={toggleRecording}
        />
      )}
      <Button
        type="submit"
        variant="primary"
        icon="send"
        aria-label={tr("Отправить", "Send")}
        disabled={(!value.trim() && !file) || busy}
      />
    </form>
    </div>
  );
}