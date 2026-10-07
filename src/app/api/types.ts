export interface User {
  id: number;
  email: string;
  name: string | null;
  timezone: string | null;
  telegram_username: string | null;
  telegram_linked_at: string | null;
  profile?: Record<string, unknown>;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export type Priority = "low" | "medium" | "high" | "urgent";
export type Source = "local" | "ai" | "google" | "apple" | "jira" | "notion";

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
}

export type AgendaScope = "today" | "tomorrow" | "week";

export type AssistantReply =
  | { kind: "proposal"; draft_id: number; events: DraftItem[]; answer: string | null; note: string | null }
  | { kind: "created" | "updated"; events: AssistantEvent[]; event_ids: number[] }
  | { kind: "topic"; title: string; text: string }
  | { kind: "delete_proposal"; draft_id: number; count: number; title: string; events: AssistantEvent[]; answer: string | null }
  | { kind: "deleted"; count: number; text: string }
  | { kind: "completed"; events: AssistantEvent[]; event_ids: number[]; text: string }
  | {
      kind: "agenda";
      title: string;
      scope?: AgendaScope;
      mark?: boolean;
      days: { date: string; label: string; events: AssistantEvent[] }[];
    }
  | ({ kind: "stats" } & Stats)
  | { kind: "help"; sections: { title: string; examples: string[] }[] }
  | { kind: "advice"; items: Recommendation[] }
  | { kind: "reminders"; settings: ReminderSettings }
  | { kind: "answer" | "not_found" | "edit_error" | "cancelled"; text: string }
  | { kind: "nothing" };

export interface HistoryMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  reply: AssistantReply | null;
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

export interface Recommendation {
  kind: "info" | "warning" | "success";
  title: string;
  text: string;
}

export interface IntegrationField {
  name: string;
  label: string;
  type: "text" | "password" | "url" | "checkbox";
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

export interface SyncResult {
  fetched: number;
  created: number;
  updated: number;
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
