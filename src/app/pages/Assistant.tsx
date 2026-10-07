import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ApiError, api } from "../api/client";
import type { AgendaScope, AssistantEvent, AssistantReply, DraftItem, HistoryMessage, ReminderSettings } from "../api/types";
import { RecommendationList } from "../components/recommendations";
import { RichText } from "../components/RichText";
import { Icon } from "../components/icons";
import { Badge, Button, PageHeader, Switch, useErrorToast } from "../components/ui";
import { TEMPORARY_ERROR, deadlineTone, errorText, formatDate, formatDeadline, formatTime, openPicker, parseDayKey, relativeDay } from "../lib/format";
import { notifyTasksChanged } from "../lib/hooks";
import { Link, navigate, useLocation, useTitle } from "../router";

type Mode = "plan" | "search";

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; reply: AssistantReply; serverId?: number; rating?: -1 | 1 | null }
  | { id: number; role: "error"; text: string };

// Те же быстрые команды, что в меню Telegram-бота: сервер понимает их одинаково в обоих чатах
const QUICK_ACTIONS = ["Сегодня", "Завтра", "Неделя", "Выполнено", "Статистика", "Советы", "Анализ недели", "Помощь"];
const SCOPES: { value: AgendaScope; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "tomorrow", label: "Завтра" },
  { value: "week", label: "Неделя" },
];

// Быстрые ответы под рекомендацией, с которой пользователь пришёл в чат
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

/** Saved conversation (site and Telegram) as chat messages. */
function fromHistory(items: HistoryMessage[]): Message[] {
  return items.map((item) =>
    item.role === "user"
      ? { id: ++messageId, role: "user", text: item.text }
      : { id: ++messageId, role: "assistant", reply: item.reply ?? { kind: "answer", text: item.text }, serverId: item.id, rating: item.rating },
  );
}

export function AssistantPage() {
  useTitle("Ассистент");
  const { query } = useLocation();
  const [mode, setMode] = useState<Mode>("plan");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // The chat is stored on the server: reloading the page keeps the conversation
  useEffect(() => {
    let active = true; // StrictMode runs effects twice in development: only one history is kept
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
      // В режиме поиска запрос всегда понимается как вопрос о расписании
      const { message_id: serverId, ...reply } = await api.assistant.chat(mode === "search" ? `найди ${value}` : value);
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

  // Пришли из рекомендации: она становится темой разговора и для чата, и для ассистента
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
          const same = last?.role === "assistant" && last.reply.kind === "topic" && JSON.stringify(last.reply) === JSON.stringify(reply);
          return same ? items : [...items, { id: ++messageId, role: "assistant", reply }];
        }),
      )
      .catch(() => push({ id: ++messageId, role: "error", text: TEMPORARY_ERROR }));
  }, [topic, topicText, loaded]);

  const replace = (id: number, reply: AssistantReply) =>
    setMessages((items) => items.map((item) => (item.id === id && item.role === "assistant" ? { ...item, reply } : item)));

  return (
    <div className="page assistant-page">
      <PageHeader
        title="Ассистент"
        subtitle="Пишите, говорите или пришлите документ — Dayla создаст или изменит задачи. Перед сохранением всё можно поправить."
        actions={
          <div className="segmented" role="tablist" aria-label="Режим">
            <button role="tab" aria-selected={mode === "plan"} className={mode === "plan" ? "active" : ""} onClick={() => setMode("plan")}>
              Запланировать
            </button>
            <button role="tab" aria-selected={mode === "search"} className={mode === "search" ? "active" : ""} onClick={() => setMode("search")}>
              Найти
            </button>
          </div>
        }
      />

      <div className="chat" aria-live="polite">
        {loaded && messages.length === 0 && (
          <div className="chat-empty">
            <Icon name="assistant" size={32} />
            <p>{mode === "plan" ? "Что запланируем?" : "Что найти в календаре?"}</p>
            <div className="examples">
              {EXAMPLES[mode].map((example) => (
                <button key={example} className="example" onClick={() => send(example)}>
                  {example}
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
          <div className="bubble bubble-assistant typing" aria-label="Dayla думает">
            <i />
            <i />
            <i />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="composer-wrap">
        <div className="quick-actions" role="group" aria-label="Быстрые команды">
          {QUICK_ACTIONS.map((action) => (
            <button key={action} type="button" className="example" disabled={busy} onClick={() => send(action)}>
              {action}
            </button>
          ))}
        </div>
        <Composer value={text} onChange={setText} onSend={() => send(text)} busy={busy} mode={mode} />
      </div>
    </div>
  );
}

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
  /** Только у последнего сообщения: быстрые ответы под темой. */
  onSend?: (text: string) => void;
  /** Отправка примера из справки — у любого сообщения. */
  send?: (text: string) => void;
}) {
  if (message.role === "user") return <div className="bubble bubble-user">{message.text}</div>;
  if (message.role === "error") return <div className="bubble bubble-error" role="alert">{message.text}</div>;
  const reply = message.reply;
  const rating = message.serverId && reply.kind !== "topic" ? <Rating messageId={message.serverId} initial={message.rating ?? null} /> : null;
  if (reply.kind === "topic") {
    return (
      <div className="bubble bubble-assistant bubble-topic">
        <span className="topic-label">
          <Icon name="assistant" size={14} /> Рекомендация
        </span>
        <p>
          <strong>{reply.title}.</strong> <RichText text={reply.text} inline />
        </p>
        {onSend && (
          <div className="examples examples-left">
            {TOPIC_REPLIES.map((text) => (
              <button key={text} className="example" onClick={() => onSend(text)}>
                {text}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="bubble bubble-assistant">
      {reply.kind === "proposal" && <Proposal reply={reply} onReply={(next) => onReply(message.id, next)} />}
      {reply.kind === "delete_proposal" && <DeleteProposal reply={reply} onReply={(next) => onReply(message.id, next)} />}
      {reply.kind === "deleted" && (
        <p className="ok">
          <Icon name="trash" size={16} /> {reply.text}
        </p>
      )}
      {reply.kind === "completed" && (
        <>
          <p className="ok">
            <Icon name="check" size={16} /> {reply.text}
          </p>
          <AssistantEvents events={reply.events} />
        </>
      )}
      {(reply.kind === "created" || reply.kind === "updated") && (
        <>
          <p className="ok">
            <Icon name="check" size={16} /> {reply.kind === "updated" ? "Изменила" : "Добавила в календарь"}
          </p>
          <AssistantEvents events={reply.events} />
          {reply.kind === "created" && reply.event_ids.length > 0 && <UndoButton eventIds={reply.event_ids} onDone={(text) => onReply(message.id, { kind: "cancelled", text })} />}
        </>
      )}
      {reply.kind === "stats" && <StatsReply stats={reply} />}
      {reply.kind === "help" && (
        <div className="help-reply">
          <p>Пишите как другу — текстом, голосом или документом. Всё, что меняет календарь, я сначала покажу на подтверждение.</p>
          {reply.sections.map((section) => (
            <div key={section.title}>
              <h3>{section.title}</h3>
              <div className="examples examples-left">
                {section.examples.map((example) => (
                  <button key={example} className="example" disabled={!send} onClick={() => send?.(example)}>
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {reply.kind === "advice" && <AdviceReply items={reply.items} onAppend={onAppend} />}
      {reply.kind === "reminders" && <RemindersReply initial={reply.settings} />}
      {reply.kind === "agenda" && <AgendaReply reply={reply} onReply={(next) => onReply(message.id, next)} />}
      {(reply.kind === "answer" || reply.kind === "not_found" || reply.kind === "edit_error" || reply.kind === "cancelled") && <RichText text={reply.text} />}
      {reply.kind === "nothing" && <p>Не нашла в сообщении задач. Напишите, что и когда, — например: «созвон с Олей завтра в 15:00».</p>}
      {rating}
    </div>
  );
}

type AgendaReplyData = Extract<AssistantReply, { kind: "agenda" }>;

/** План как в боте: переключение Сегодня / Завтра / Неделя и отметки выполненного прямо в сообщении. */
function AgendaReply({ reply, onReply }: { reply: AgendaReplyData; onReply: (reply: AssistantReply) => void }) {
  const [busy, setBusy] = useState(false);
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
    <div className="agenda-reply">
      <p>{count ? (reply.mark ? `Отметьте выполненное · ${reply.title}` : reply.title) : "Ничего не запланировано."}</p>
      {reply.days.map((day) => (
        <div key={day.date} className="day-group">
          <h3>{day.label}</h3>
          {reply.mark ? <MarkList events={day.events} /> : <AssistantEvents events={day.events} />}
        </div>
      ))}
      {reply.scope && (
        <div className="button-row">
          <div className="segmented">
            {SCOPES.map((scope) => (
              <button key={scope.value} className={reply.scope === scope.value && !reply.mark ? "active" : ""} disabled={busy} onClick={() => show(scope.value)}>
                {scope.label}
              </button>
            ))}
          </div>
          {count > 0 && !reply.mark && (
            <Button variant="ghost" size="sm" icon="check" disabled={busy} onClick={() => show(reply.scope ?? "today", true)}>
              Отметить выполненные
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function MarkList({ events }: { events: AssistantEvent[] }) {
  const [done, setDone] = useState<Record<number, boolean>>(() => Object.fromEntries(events.map((event) => [event.id, event.completed])));
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
    <ul className="event-list">
      {events.map((event) => (
        <li key={event.id} className="event-item">
          <button
            type="button"
            role="checkbox"
            aria-checked={done[event.id]}
            aria-label={done[event.id] ? `Снять отметку: ${event.title}` : `Выполнено: ${event.title}`}
            className={`event-check ${done[event.id] ? "checked" : ""}`}
            onClick={() => toggle(event)}
          >
            {done[event.id] && <Icon name="check" size={14} />}
          </button>
          <span className={`event-row priority-${event.priority ?? "medium"} ${done[event.id] ? "done" : ""}`}>
            <span className="event-time">{event.all_day ? "без времени" : formatTime(new Date(event.start))}</span>
            <span className="event-main">
              <span className="event-title">{event.title}</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** «Отменить» после добавления — как кнопка под ответом бота. */
function UndoButton({ eventIds, onDone }: { eventIds: number[]; onDone: (text: string) => void }) {
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
    <div className="button-row">
      <Button variant="ghost" size="sm" icon="left" busy={busy} onClick={undo}>
        Отменить
      </Button>
    </div>
  );
}

function StatsReply({ stats }: { stats: Extract<AssistantReply, { kind: "stats" }> }) {
  return (
    <div className="progress">
      <p className="progress-today">
        <strong>{stats.today.done}</strong> из {stats.today.total} <span className="muted">выполнено сегодня</span>
      </p>
      <div className="progress-track" aria-hidden="true">
        <i style={{ width: `${stats.today.percent}%` }} />
      </div>
      <div className="progress-week" aria-label="Выполнение за 7 дней">
        {stats.days.map((day) => (
          <div key={day.date} title={`${day.done} из ${day.total}`} className={day.total && day.done === day.total ? "complete" : ""}>
            <span className="progress-bar">
              <i style={{ height: `${day.total ? Math.max(day.percent, 6) : 0}%` }} />
            </span>
            <span className="muted small">{(parseDayKey(day.date) ?? new Date()).toLocaleDateString("ru-RU", { weekday: "short" })}</span>
          </div>
        ))}
      </div>
      <p className="muted small">
        За неделю {stats.done} из {stats.total} ({stats.percent}%)
        {stats.streak > 0 ? ` · 🔥 серия ${stats.streak} дн.` : ""}
        {stats.best_streak > stats.streak ? ` · лучшая ${stats.best_streak} дн.` : ""}
      </p>
    </div>
  );
}

/** Советы с «Обсудить»: рекомендация становится темой разговора прямо здесь, как в боте. */
function AdviceReply({ items, onAppend }: { items: Extract<AssistantReply, { kind: "advice" }>["items"]; onAppend: (reply: AssistantReply) => void }) {
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

/** Настройки напоминаний в чате — те же переключатели, что у бота. */
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
    <div className="form reminders-reply">
      <p>Напоминания приходят в Telegram.</p>
      <Switch checked={settings.enabled} onChange={(enabled) => toggle({ enabled })} label="Напоминать о событиях" />
      <Switch checked={settings.daily_digest_enabled} onChange={(value) => toggle({ daily_digest_enabled: value })} label={`Утренний план · ${settings.daily_digest_time.slice(0, 5)}`} />
      <Switch checked={settings.evening_enabled} onChange={(value) => toggle({ evening_enabled: value })} label={`Итоги дня · ${settings.evening_time.slice(0, 5)}`} />
      <Switch checked={settings.deadline_enabled} onChange={(value) => toggle({ deadline_enabled: value })} label="Приближение дедлайнов" />
      <Link to="/account#reminders" className="btn btn-ghost btn-sm">
        Время и остальные настройки
      </Link>
    </div>
  );
}

/** Маленькие 👍 / 👎 под ответом: по желанию, повторное нажатие снимает оценку. */
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
    <div className="rating" role="group" aria-label="Оцените ответ">
      <button type="button" className={value === 1 ? "active" : ""} aria-pressed={value === 1} aria-label="Хороший ответ" title="Хороший ответ" onClick={() => rate(1)}>
        👍
      </button>
      <button type="button" className={value === -1 ? "active" : ""} aria-pressed={value === -1} aria-label="Плохой ответ" title="Плохой ответ" onClick={() => rate(-1)}>
        👎
      </button>
    </div>
  );
}

type DeleteReply = Extract<AssistantReply, { kind: "delete_proposal" }>;

/** Удаление всегда подтверждается: ассистент показывает, что именно удалит. */
function DeleteProposal({ reply, onReply }: { reply: DeleteReply; onReply: (reply: AssistantReply) => void }) {
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const reportError = useErrorToast();
  const run = async (kind: "confirm" | "cancel") => {
    setBusy(kind);
    try {
      const result = kind === "confirm" ? await api.assistant.confirmDraft(reply.draft_id) : await api.assistant.cancelDraft(reply.draft_id);
      if (result.kind === "deleted") notifyTasksChanged();
      onReply(result);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 410)) onReply({ kind: "cancelled", text: "Этот запрос уже обработан или устарел." });
      else reportError(TEMPORARY_ERROR);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="proposal">
      <RichText text={reply.answer ?? `Удалить ${reply.count}?`} />
      <AssistantEvents events={reply.events} />
      {reply.count > reply.events.length && <p className="muted small">…и ещё {reply.count - reply.events.length}</p>}
      <div className="button-row">
        <Button variant="danger" size="sm" icon="trash" busy={busy === "confirm"} onClick={() => run("confirm")}>
          Удалить ({reply.count})
        </Button>
        <Button variant="ghost" size="sm" busy={busy === "cancel"} onClick={() => run("cancel")}>
          Не удалять
        </Button>
      </div>
    </div>
  );
}

function AssistantEvents({ events }: { events: AssistantEvent[] }) {
  return (
    <ul className="event-list">
      {events.map((event) => (
        <li key={event.id} className="event-item">
          <Link to={`/events/${event.id}`} className={`event-row priority-${event.priority ?? "medium"} ${event.completed ? "done" : ""}`}>
            <span className="event-time">
              <span className="event-date">{relativeDay(new Date(event.start))}</span>
              {event.all_day ? "без времени" : formatTime(new Date(event.start))}
            </span>
            <span className="event-main">
              <span className="event-title">{event.title}</span>
              {(event.recurrence || event.location || event.deadline || multiDay(event)) && (
                <span className="event-meta">
                  {multiDay(event) && <span>по {formatDate(parseDayKey(event.end_date ?? null) ?? new Date(), { day: "numeric", month: "short" })}</span>}
                  {event.deadline && !event.completed && (
                    <span className={`deadline deadline-${deadlineTone(event.deadline)}`}>
                      <Icon name="flag" size={13} /> {formatDeadline(event.deadline)}
                    </span>
                  )}
                  {event.recurrence && (
                    <span>
                      <Icon name="sync" size={13} /> {event.recurrence}
                    </span>
                  )}
                  {event.location && (
                    <span>
                      <Icon name="location" size={13} /> {event.location}
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

const multiDay = (event: { start: string; end_date?: string | null }) => !!event.end_date && event.end_date > event.start.slice(0, 10);

/** «сегодня 10:00», «пт, 9 окт» — как задача выглядела до изменения. */
function describeBefore(before: NonNullable<DraftItem["before"]>): string {
  const day = parseDayKey(before.date);
  const when = day ? relativeDay(day).toLowerCase() : before.date;
  return [when, before.time ? `${before.time}${before.end_time ? `–${before.end_time}` : ""}` : "без времени"].join(", ");
}

type ProposalReply = Extract<AssistantReply, { kind: "proposal" }>;

/** Черновик: название, дату и время можно поправить до добавления. */
function Proposal({ reply, onReply }: { reply: ProposalReply; onReply: (reply: AssistantReply) => void }) {
  const [items, setItems] = useState<DraftItem[]>(reply.events);
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const reportError = useErrorToast();
  const dirty = JSON.stringify(items) !== JSON.stringify(reply.events);
  const patch = (index: number, values: Partial<DraftItem>) =>
    setItems((current) => current.map((item, position) => (position === index ? { ...item, ...values } : item)));

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
    <div className="proposal">
      <RichText text={reply.answer ?? (items.length > 1 ? "Вот что я поняла — проверьте задачи и добавьте:" : "Вот что я поняла — проверьте и добавьте:")} />
      {reply.note && <p className="muted small">{reply.note}</p>}
      {items.map((item, index) => (
        <div key={index} className="proposal-item proposal-edit">
          {item.before && (
            <span className="muted small proposal-before">
              Было: {item.before.title !== item.title ? `«${item.before.title}», ` : ""}
              {describeBefore(item.before)}
            </span>
          )}
          <input value={item.title} onChange={(e) => patch(index, { title: e.target.value })} aria-label="Название" maxLength={300} />
          <div className="proposal-when">
            <label className="field picker-field">
              <span className="field-label">Дата</span>
              <input type="date" value={item.date} required onChange={(e) => e.target.value && patch(index, { date: e.target.value })} onClick={(e) => openPicker(e.currentTarget)} />
            </label>
            <label className="field picker-field">
              <span className="field-label">Время</span>
              <input type="time" value={item.time ?? ""} onChange={(e) => patch(index, { time: e.target.value || null, end_time: e.target.value ? item.end_time : null })} onClick={(e) => openPicker(e.currentTarget)} />
            </label>
            {item.end_date && (
              <label className="field picker-field">
                <span className="field-label">По</span>
                <input type="date" value={item.end_date} min={item.date} onChange={(e) => patch(index, { end_date: e.target.value || null })} onClick={(e) => openPicker(e.currentTarget)} />
              </label>
            )}
            {item.time ? (
              <Button variant="ghost" size="sm" onClick={() => patch(index, { time: null, end_time: null })}>
                Без времени
              </Button>
            ) : (
              <span className="muted small">без времени</span>
            )}
          </div>
          {(item.deadline || item.fixed) && (
            <div className="badges">
              {item.deadline && (
                <Badge tone={deadlineTone(item.deadline)}>
                  дедлайн {formatDeadline(item.deadline).replace(/^до /, "")}
                </Badge>
              )}
              {item.fixed && <Badge tone="accent">нельзя переносить</Badge>}
            </div>
          )}
          {(item.recurrence || items.length > 1) && (
            <div className="proposal-foot">
              {item.recurrence && (
                <span className="muted small">
                  <Icon name="sync" size={13} /> {item.recurrence}, с {relativeDay(parseDayKey(item.date) ?? new Date()).toLowerCase()}
                </span>
              )}
              {items.length > 1 && (
                <Button variant="ghost" size="sm" icon="trash" onClick={() => setItems(items.filter((_, position) => position !== index))}>
                  Убрать
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
      <div className="button-row">
        <Button variant="primary" size="sm" icon={isChange ? "check" : "plus"} busy={busy === "confirm"} disabled={!items.length || items.some((item) => !item.title.trim())} onClick={confirm}>
          {isChange ? "Сохранить" : "Добавить"} {items.length > 1 ? `(${items.length})` : ""}
        </Button>
        <Button variant="ghost" size="sm" busy={busy === "cancel"} onClick={() => run("cancel", () => api.assistant.cancelDraft(reply.draft_id))}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

function Composer({ value, onChange, onSend, busy, mode }: { value: string; onChange: (value: string) => void; onSend: () => void; busy: boolean; mode: Mode }) {
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
    <form className="composer" onSubmit={submit}>
      <input ref={fileInput} type="file" accept=".pdf,.docx" hidden onChange={(e) => readFile(e.target.files?.[0])} />
      <Button variant="ghost" icon="clip" aria-label="Прочитать PDF или DOCX" title="PDF или DOCX" busy={working === "file"} onClick={() => fileInput.current?.click()} />
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder={recording ? "Говорите…" : mode === "plan" ? "Что запланировать?" : "Что найти?"}
        aria-label="Сообщение"
        maxLength={50000}
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
      <Button type="submit" variant="primary" icon="send" aria-label="Отправить" disabled={!value.trim() || busy} />
    </form>
  );
}
