import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { api } from "../api/client";
import type { AssistantEvent, AssistantReply, DraftItem } from "../api/types";
import { Icon } from "../components/icons";
import { Button, PageHeader, useErrorToast } from "../components/ui";
import { TEMPORARY_ERROR, errorText, formatTime, openPicker, parseDayKey, relativeDay } from "../lib/format";
import { notifyTasksChanged } from "../lib/hooks";
import { Link, navigate, useLocation, useTitle } from "../router";

type Mode = "plan" | "search";

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; reply: AssistantReply }
  | { id: number; role: "error"; text: string };

const EXAMPLES: Record<Mode, string[]> = {
  plan: ["Созвон с командой завтра в 11:00 на час", "Каждую пятницу в 18:00 спортзал, напомни за 30 минут", "Купить продукты послезавтра"],
  search: ["Что у меня на этой неделе?", "Когда встреча с Олей?", "Что у меня в следующую пятницу?"],
};

let messageId = 0;

export function AssistantPage() {
  useTitle("Ассистент");
  const { query } = useLocation();
  const [mode, setMode] = useState<Mode>("plan");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const push = (message: Message) => setMessages((items) => [...items, message]);

  const send = async (input: string) => {
    const value = input.trim();
    if (!value || busy) return;
    setText("");
    push({ id: ++messageId, role: "user", text: value });
    setBusy(true);
    try {
      // В режиме поиска запрос всегда понимается как вопрос о расписании
      const reply = await api.assistant.chat(mode === "search" ? `найди ${value}` : value);
      push({ id: ++messageId, role: "assistant", reply });
    } catch {
      push({ id: ++messageId, role: "error", text: TEMPORARY_ERROR });
    } finally {
      setBusy(false);
    }
  };

  const initial = query.get("q");
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!initial || handled.current === initial) return;
    handled.current = initial;
    navigate("/assistant", { replace: true });
    send(initial);
  }, [initial]);

  const replace = (id: number, reply: AssistantReply) =>
    setMessages((items) => items.map((item) => (item.id === id && item.role === "assistant" ? { ...item, reply } : item)));

  return (
    <div className="page assistant-page">
      <PageHeader
        title="Ассистент"
        subtitle="Опишите планы своими словами, голосом или документом — Dayla превратит их в задачи. Перед добавлением всё можно поправить."
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
        {messages.length === 0 && (
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
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} onReply={replace} />
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

      <Composer value={text} onChange={setText} onSend={() => send(text)} busy={busy} mode={mode} />
    </div>
  );
}

function ChatMessage({ message, onReply }: { message: Message; onReply: (id: number, reply: AssistantReply) => void }) {
  if (message.role === "user") return <div className="bubble bubble-user">{message.text}</div>;
  if (message.role === "error") return <div className="bubble bubble-error" role="alert">{message.text}</div>;
  const reply = message.reply;
  return (
    <div className="bubble bubble-assistant">
      {reply.kind === "proposal" && <Proposal reply={reply} onReply={(next) => onReply(message.id, next)} />}
      {reply.kind === "created" && (
        <>
          <p className="ok">
            <Icon name="check" size={16} /> Добавила в календарь
          </p>
          <AssistantEvents events={reply.events} />
        </>
      )}
      {reply.kind === "agenda" && (
        <>
          <p>{reply.days.length ? reply.title : "Ничего не запланировано."}</p>
          {reply.days.map((day) => (
            <div key={day.date} className="day-group">
              <h3>{day.label}</h3>
              <AssistantEvents events={day.events} />
            </div>
          ))}
        </>
      )}
      {(reply.kind === "answer" || reply.kind === "not_found" || reply.kind === "edit_error" || reply.kind === "cancelled") && <p>{reply.text}</p>}
      {reply.kind === "nothing" && <p>Не нашла в сообщении задач. Напишите, что и когда, — например: «созвон с Олей завтра в 15:00».</p>}
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
              {(event.recurrence || event.location) && (
                <span className="event-meta">
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
      if (result.kind === "created") notifyTasksChanged();
      onReply(result);
    } catch {
      reportError(TEMPORARY_ERROR);
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

  return (
    <div className="proposal">
      <p>{reply.answer ?? (items.length > 1 ? "Вот что я поняла — проверьте задачи и добавьте:" : "Вот что я поняла — проверьте и добавьте:")}</p>
      {items.map((item, index) => (
        <div key={index} className="proposal-item proposal-edit">
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
            {item.time ? (
              <Button variant="ghost" size="sm" onClick={() => patch(index, { time: null, end_time: null })}>
                Без времени
              </Button>
            ) : (
              <span className="muted small">без времени</span>
            )}
          </div>
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
        <Button variant="primary" size="sm" icon="plus" busy={busy === "confirm"} disabled={!items.length || items.some((item) => !item.title.trim())} onClick={confirm}>
          Добавить {items.length > 1 ? `(${items.length})` : ""}
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
