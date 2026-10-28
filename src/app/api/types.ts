export interface User {
  id: number;
  email: string;
  name: string | null;
  timezone: string | null;
  telegram_username: string | null;
  telegram_linked_at: string | null;
  profile?: Record<string, unknown>;
  /** Opens the admin dashboard at /dashboard */
  is_admin?: boolean;
  /** Points, levels and badges; off hides them here and in the evening summary */
  rewards_enabled?: boolean;
}

/** The note all admins share on the dashboard; one admin at a time edits it after locking it */
export interface ResearchQuestionAdmin {
  id: number;
  text: string;
  text_en: string | null;
  options: string[];
  options_en: string[];
  active: boolean;
  position: number;
  created_at: string | null;
}

export interface ResearchAnswerRow {
  user_id: number | null;
  answer: string | null;
  source: "option" | "text" | "chat" | "skip";
  channel: "web" | "telegram";
  created_at: string;
}

export interface ResearchSummary {
  questions: (ResearchQuestionAdmin & { asked: number; answered: number; counts: Record<string, number>; answers: ResearchAnswerRow[] })[];
  wishes: { user_id: number | null; wish: string; message: string | null; channel: "web" | "telegram"; created_at: string }[];
}

export type ResearchQuestionSave = Omit<ResearchQuestionAdmin, "id" | "created_at">;

export interface AdminNote {
  text: string;
  version: number;
  updated_at: string | null;
  updated_by: string | null;
  locked: boolean;
  locked_by: string | null;
  locked_by_me: boolean;
  lock_expires_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export type Priority = "low" | "medium" | "high" | "urgent";
export type Source = "local" | "ai" | "ics" | "google" | "apple" | "jira" | "notion";

/** What an .ics import added: `skipped` were already in the calendar (imported before) */
export interface IcsImportResult {
  created: number;
  skipped: number;
  found: number;
  event_ids: number[];
  text: string;
}

export interface Calendar {
  id: number;
  user_id: number;
  name: string;
  provider: string;
  integration_id: number | null;
  description: string | null;
  timezone: string;
  external_id: string | null;
  is_active: boolean;
}

export interface CalendarEvent {
  id: number;
  calendar_id: number;
  user_id: number;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  priority: Priority;
  location: string | null;
  all_day: boolean;
  reminder_minutes: number | null;
  status: string;
  source: Source | string;
  sync_status: string;
  external_id: string | null;
  series_id: string | null;
  recurrence_rule?: string | null;
  /** The repeat in words: «каждый день», «по будням» */
  recurrence?: string | null;
  completed_at: string | null;
  deadline_at: string | null;
  /** Нельзя переносить: подсказки и автоперенос планируют вокруг такой задачи. */
  is_fixed: boolean;
  tag_ids: number[];
}

export type TagColor = "indigo" | "blue" | "green" | "amber" | "red" | "pink" | "violet" | "slate";

export interface Tag {
  id: number;
  name: string;
  color: TagColor;
  /** false: its tasks are left out of the progress and the streak («прогулка» is not progress, «спортзал» is) */
  counts_progress?: boolean;
}

export interface EventCreate {
  title: string;
  start_at: string;
  end_at: string;
  calendar_id?: number;
  description?: string | null;
  timezone?: string;
  priority?: Priority;
  location?: string | null;
  all_day?: boolean;
  reminder_minutes?: number | null;
  recurrence_rule?: string | null;
  deadline_at?: string | null;
  is_fixed?: boolean;
  tag_ids?: number[];
}

export interface EventFile {
  id: number;
  filename: string;
  size: number;
  mime_type: string;
}

export interface EventLink {
  id: number;
  event_id: number;
  integration_id: number;
  external_id: string;
  url: string | null;
  provider: string;
}

/** A task the assistant proposes; it is saved only after the user confirms the draft.
 * With event_id it is a change of an existing task, and `before` is how that task looks now. */
export interface DraftItem {
  index: number;
  title: string;
  date: string;
  time: string | null;
  end_time: string | null;
  end_date: string | null;
  deadline: string | null;
  fixed: boolean;
  tag_ids?: number[];
  event_id?: number;
  before?: { title: string; date: string; time: string | null; end_time: string | null; end_date: string | null };
  rrule: string | null;
  recurrence: string | null;
  location: string | null;
  description: string | null;
  reminder_minutes: number | null;
  start: string;
  end: string;
  all_day: boolean;
}

export interface CalendarTarget {
  slug: string;
  title: string;
}

/** A task as the assistant shows it in answers. */
export interface AssistantEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  time: string | null;
  all_day: boolean;
  completed: boolean;
  location: string | null;
  recurrence: string | null;
  priority: Priority;
  end_date?: string | null;
  deadline?: string | null;
  fixed?: boolean;
  tag_ids?: number[];
}

export type AgendaScope = "today" | "tomorrow" | "week";

/** A question the team asks to learn where to take Deyla; it comes with a reply. `answer` / `skipped` after it. */
export interface ChatQuestion {
  id: number;
  text: string;
  options: string[];
  answer?: string | null;
  skipped?: boolean;
}

/** What the assistant answers; any kind may carry a team question and ready answers to send with one tap. */
export type AssistantReply = AssistantReplyBody & { question?: ChatQuestion; replies?: string[] };

type AssistantReplyBody =
  | {
      kind: "proposal";
      draft_id: number;
      events: DraftItem[];
      answer: string | null;
      note: string | null;
      /** Connected calendars the new tasks can also go to, and the ticked ones (empty: Deyla only) */
      targets?: CalendarTarget[];
      calendars?: string[];
    }
  | {
      kind: "created" | "updated";
      events: AssistantEvent[];
      event_ids: number[];
      /** "Перенесла «…» на …" after the move buttons */
      text?: string;
      /** "Добавлено в Яндекс Календарь" or why it was not */
      note?: string | null;
      /** A task moved with the buttons: "Вернуть" moves it back to `from` */
      moved?: { event_id: number; from: string; to: string; from_label: string };
    }
  | { kind: "topic"; title: string; text: string }
  | { kind: "delete_proposal"; draft_id: number; count: number; title: string; events: AssistantEvent[]; series?: boolean; answer: string | null }
  | { kind: "deleted"; count: number; text: string }
  | { kind: "completed"; events: AssistantEvent[]; event_ids: number[]; text: string }
  | {
      kind: "agenda";
      title: string;
      scope?: AgendaScope;
      mark?: boolean;
      days: { date: string; label: string; events: AssistantEvent[] }[];
      /** The assistant's comment on the found tasks */
      answer?: string | null;
    }
  | ({ kind: "stats"; previous_percent?: number | null; habits?: StatsHabits } & Stats)
  | { kind: "help"; sections: { title: string; examples: string[] }[] }
  | { kind: "advice"; items: Recommendation[] }
  | { kind: "reminders"; settings: ReminderSettings }
  /** Reminders the assistant set ("напомни через 10 минут …"); the bot sends them to Telegram */
  | {
      kind: "reminder";
      text: string;
      /** repeat: "каждый день в 09:00", "каждые 2 часа"; label: when the (first) one comes */
      /** file: the name of the file the bot sends with it ("пришли этот файл в 21:00") */
      reminders: { id: number; text: string; at: string; label: string; repeat?: string | null; file?: string | null }[];
    }
  | { kind: "answer" | "not_found" | "edit_error" | "cancelled"; text: string }
  | { kind: "nothing" };

/** A file sent with a message: the chat shows its name, the server has read it. */
export interface ChatFile {
  name: string;
  size: number;
  mime?: string;
}

export interface HistoryMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  /** A user message with a file keeps { kind: "file", caption, file } here, a voice message { kind: "voice", voice } */
  reply:
    | AssistantReply
    | { kind: "file"; caption: string; file: ChatFile }
    | { kind: "voice"; voice: { id: string; duration: number }; transcript: string; file?: ChatFile }
    | null;
  rating: -1 | 1 | null;
  created_at: string;
}

export interface DayStats {
  date: string;
  total: number;
  done: number;
  percent: number;
}

export interface Stats {
  today: DayStats;
  days: DayStats[];
  total: number;
  done: number;
  percent: number;
  streak: number;
  best_streak: number;
}

/** A challenge in an onboarding sphere: `goal` ticked tasks with the sphere's tag. */
export interface RewardBadge {
  sphere: string;
  goal: number;
  name: string;
  name_en: string;
  done: number;
  earned: boolean;
}

/** Points, level and badges, counted by the server from the ticked tasks and completed days. */
export interface Rewards {
  points: number;
  today_points: number;
  level: number;
  level_start: number;
  next_level_at: number;
  badges: RewardBadge[];
  next_badge: (RewardBadge & { left: number }) | null;
}

/** What the last weeks say about the user, as plain sentences from the server. */
export interface StatsHabits {
  done_per_day?: number;
  planned_per_day?: number;
  spheres_done?: string[];
  most_done?: string;
  weak_weekday?: string;
  slipping?: string[];
}

export interface Recommendation {
  kind: "info" | "warning" | "success";
  title: string;
  text: string;
}

export interface IntegrationField {
  name: string;
  label: string;
  type: "text" | "password" | "url" | "checkbox" | "select";
  secret: boolean;
  required: boolean;
  placeholder: string;
  default: unknown;
  help: string;
}

export interface IntegrationConnection {
  id: number;
  provider: string;
  account_email: string | null;
  status: "connected" | "error" | string;
  last_sync_at: string | null;
  last_sync_error: string | null;
  config: Record<string, unknown>;
}

export interface Integration {
  slug: string;
  title: string;
  description: string;
  auth_type: "oauth" | "credentials";
  supports_push: boolean;
  fields: IntegrationField[];
  connection: IntegrationConnection | null;
}

/** How much of a repeated task a deletion takes: just the chosen day, it and the later ones, or the whole series. */
export type DeleteScope = "one" | "following" | "all";

export interface SyncResult {
  fetched: number;
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
}

export interface ReminderSettings {
  enabled: boolean;
  lead_times: number[];
  daily_digest_enabled: boolean;
  daily_digest_time: string;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  sources: Source[];
  checkin_enabled: boolean;
  checkin_time: string;
  evening_enabled: boolean;
  evening_time: string;
  deadline_enabled: boolean;
}

export interface ReminderHistoryItem {
  id: number;
  kind: string;
  status: string;
  text: string;
  scheduled_for: string;
  sent_at: string | null;
  error: string | null;
}

export interface TelegramStatus {
  linked: boolean;
  username: string | null;
  linked_at: string | null;
  bot_username: string | null;
}

export interface TelegramLink {
  code: string;
  expires_at: string;
  deep_link: string | null;
}

export type AiChatSourceStatus =
  | "pending"     // только что добавлен, ждёт обработки
  | "parsing"     // идёт разбор
  | "ready"       // разбор завершён, данные применены
  | "error";      // не удалось распарсить

export type AiChatSource = {
  id: string;
  url: string;
  host: string;                 // chatgpt.com, claude.ai и т.д.
  spheres: string[];
  notes: string[];
  comment: string;
  status: AiChatSourceStatus;
  error: string | null;         // сообщение, если status === "error"
  added_at: string;             // ISO datetime
  parsed_at: string | null;     // ISO datetime
};