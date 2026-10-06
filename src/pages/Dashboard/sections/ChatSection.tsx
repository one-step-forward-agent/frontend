// src/pages/Dashboard/sections/ChatSection.tsx
import * as React from "react";
import { create } from "zustand";
import { Check, Repeat, Send, Trash2, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import {
  cancelDraft,
  confirmDraft,
  sendAssistantMessage,
  updateDraft,
  type AssistantReply,
  type DraftItem,
} from "@/api/dayla";
import { useTasksStore } from "@/store/tasksStore";
import { cn } from "@/utils/cn";
import { formatTime, fromISODate, relativeDay } from "@/utils/dates";
import { DateTimeField } from "../components/DateTimeField";

// Любая ошибка в чате — временная: подробности сервера пользователю не показываем
const TEMPORARY_ERROR = "Временная ошибка — попробуйте ещё раз через минуту.";

const QUICK_COMMANDS = [
  "Добавь задачу…",
  "Перенеси задачу…",
  "Найди свободное окно…",
  "Проанализируй мой календарь…",
  "Помоги сформулировать цель по SMART…",
];

type NewMessage = { role: "user"; text: string } | { role: "assistant"; reply: AssistantReply };
type ChatMessage = NewMessage & { id: number };

// История чата живёт, пока открыта вкладка, и не теряется при переходах между разделами
const useChatStore = create<{ messages: ChatMessage[]; push: (message: NewMessage) => void; replace: (id: number, reply: AssistantReply) => void }>((set) => ({
  messages: [],
  push: (message) => set((state) => ({ messages: [...state.messages, { ...message, id: Date.now() + Math.random() } as ChatMessage] })),
  replace: (id, reply) => set((state) => ({ messages: state.messages.map((message) => (message.id === id ? { ...message, reply } as ChatMessage : message)) })),
}));

export const ChatSection: React.FC = () => {
  const { messages, push } = useChatStore();
  const [text, setText] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottom = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottom.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (submit?: React.FormEvent) => {
    submit?.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    push({ role: "user", text: value });
    setText("");
    setSending(true);
    try {
      push({ role: "assistant", reply: await sendAssistantMessage(value) });
    } catch {
      push({ role: "assistant", reply: { kind: "answer", text: TEMPORARY_ERROR } });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card>
        <CardContent className="h-[60vh] overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <>
              <p className="font-medium">Чем помочь?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Напишите или надиктуйте. Любое изменение сначала показывается как предложение.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_COMMANDS.map((command) => (
                  <Button key={command} variant="secondary" size="sm" onClick={() => setText(command.replace("…", " "))}>
                    {command}
                  </Button>
                ))}
              </div>
            </>
          )}
          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-blue-600 text-white px-4 py-2 text-sm whitespace-pre-wrap">{message.text}</p>
              </div>
            ) : (
              <AssistantBubble key={message.id} id={message.id} reply={message.reply} />
            )
          )}
          {sending && <p className="text-sm text-gray-500 dark:text-gray-400">Dayla думает…</p>}
          <div ref={bottom} />
        </CardContent>
      </Card>

      <form onSubmit={send} className="flex gap-2">
        <Input placeholder="Сообщение ИИ…" aria-label="Сообщение ассистенту" value={text} onChange={(change) => setText(change.target.value)} maxLength={50000} />
        <Button type="submit" isLoading={sending} aria-label="Отправить">
          <Send size={16} className="sm:mr-1.5" />
          <span className="hidden sm:inline">Отправить</span>
        </Button>
      </form>
    </div>
  );
};

const Bubble: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("max-w-[90%] rounded-2xl rounded-bl-md bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm", className)}>{children}</div>
);

const AssistantBubble: React.FC<{ id: number; reply: AssistantReply }> = ({ id, reply }) => {
  switch (reply.kind) {
    case "proposal":
      return <DraftCard id={id} reply={reply} />;
    case "created":
      return (
        <Bubble className="bg-green-50 dark:bg-green-950/40">
          <p className="font-medium mb-1">✨ Добавлено в календарь</p>
          {reply.events.map((event) => (
            <p key={event.id}>
              {event.title} · {relativeDay(new Date(event.start))}
              {!event.all_day && `, ${formatTime(event.start)}`}
              {event.recurrence && ` · ${event.recurrence}`}
            </p>
          ))}
        </Bubble>
      );
    case "agenda":
      return (
        <Bubble>
          <p className="font-medium mb-1">{reply.title}</p>
          {reply.days.length === 0 && <p className="text-gray-500">Ничего не запланировано.</p>}
          {reply.days.map((day) => (
            <div key={day.date} className="mt-1">
              <p className="text-xs text-gray-500">{day.label}</p>
              {day.events.map((event) => (
                <p key={event.id} className={cn(event.completed && "line-through text-gray-400")}>
                  <span className="tabular-nums text-gray-500 mr-2">{event.all_day ? "без времени" : formatTime(event.start)}</span>
                  {event.title}
                </p>
              ))}
            </div>
          ))}
        </Bubble>
      );
    case "not_found":
      return <Bubble className="bg-amber-50 dark:bg-amber-950/30">🔎 {reply.text}</Bubble>;
    case "nothing":
      return <Bubble>Не нашла в сообщении задач. Напишите, что и когда, например: «завтра в 15:00 созвон с Олей».</Bubble>;
    default:
      return <Bubble className="whitespace-pre-wrap">{reply.text}</Bubble>;
  }
};

type Proposal = Extract<AssistantReply, { kind: "proposal" }>;

const DraftCard: React.FC<{ id: number; reply: Proposal }> = ({ id, reply }) => {
  const replace = useChatStore((state) => state.replace);
  const changed = useTasksStore((state) => state.changed);
  const [items, setItems] = React.useState<DraftItem[]>(reply.events);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dirty = JSON.stringify(items) !== JSON.stringify(reply.events);

  const patch = (index: number, values: Partial<DraftItem>) =>
    setItems((current) => current.map((item, position) => (position === index ? { ...item, ...values } : item)));

  const run = async (action: () => Promise<AssistantReply>) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      replace(id, result);
      if (result.kind === "created") changed();
    } catch {
      setError(TEMPORARY_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () =>
    run(async () => {
      if (dirty) {
        const saved = await updateDraft(reply.draft_id, items);
        if (saved.kind !== "proposal") return saved;
      }
      return confirmDraft(reply.draft_id);
    });

  return (
    <Bubble className="w-full max-w-full space-y-3">
      <p className="font-medium">
        📝 Проверьте {items.length === 1 ? "задачу" : `задачи (${items.length})`} перед добавлением
      </p>
      {reply.answer && <p className="text-gray-600 dark:text-gray-300">{reply.answer}</p>}
      {items.map((item, index) => (
        <div key={index} className="rounded-xl bg-white dark:bg-gray-900 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input aria-label="Название" value={item.title} onChange={(change) => patch(index, { title: change.target.value })} className="py-2" />
            {items.length > 1 && (
              <Button variant="ghost" size="icon" aria-label="Убрать из списка" onClick={() => setItems(items.filter((_, position) => position !== index))}>
                <Trash2 size={15} />
              </Button>
            )}
          </div>
          <DateTimeField
            date={item.date}
            time={item.time}
            endTime={item.end_time}
            withEndTime
            onChange={(value) => patch(index, { date: value.date, time: value.time, end_time: value.endTime })}
          />
          {item.recurrence && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Repeat size={12} /> {item.recurrence}, начиная с {relativeDay(fromISODate(item.date)).toLowerCase()}
            </p>
          )}
        </div>
      ))}
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={confirm} isLoading={busy} disabled={!items.length || items.some((item) => !item.title.trim())}>
          <Check size={15} className="mr-1.5" /> {items.length > 1 ? `Добавить все (${items.length})` : "Добавить"}
        </Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => cancelDraft(reply.draft_id))}>
          <X size={15} className="mr-1.5" /> Отмена
        </Button>
      </div>
    </Bubble>
  );
};
