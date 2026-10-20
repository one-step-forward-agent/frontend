import { reachGoal } from "@/app/lib/metrics";
import type { TableData, TableInfo } from "@/pages/Admin/sheet";
import type {
  AdminNote,
  AgendaScope,
  AssistantReply,
  Calendar,
  CalendarEvent,
  EventCreate,
  EventFile,
  EventLink,
  DraftItem,
  HistoryMessage,
  Integration,
  IntegrationConnection,
  Recommendation,
  ReminderHistoryItem,
  ReminderSettings,
  Stats,
  DeleteScope,
  SyncResult,
  Tag,
  TagColor,
  TelegramLink,
  TelegramStatus,
  TokenResponse,
  User,
  AiChatSource
} from "./types";
import { tr, lang } from "@/i18n";

/** A reminder the user asked for: once, or repeating (repeat says it in words) */
export interface CustomReminder {
  id: number;
  text: string;
  at: string;
  label: string;
  repeat: string | null;
  repeat_kind: "daily" | "weekdays" | "weekly" | "monthly" | null;
  every_minutes: number | null;
}

export interface CustomReminderBody {
  text: string;
  /** The moment, ISO with an offset (a bare "YYYY-MM-DDTHH:MM" is the profile's local time) */
  at: string;
  repeat?: "daily" | "weekdays" | "weekly" | "monthly";
  every_minutes?: number;
}

export type SignInProvider = "google" | "yandex" | "notion" | "jira";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// What the user sees when a request fails: never status texts, HTML of a proxy page or English internals
export const SERVER_ERROR = tr("Ошибка сервера. Попробуйте ещё раз позже.", "Server error. Please try again later.");
const NO_CONNECTION = tr("Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.", "No connection to the server. Check your internet and try again.");
const TOO_MANY_REQUESTS = tr("Слишком много запросов — подождите минуту.", "Too many requests — please wait a minute.");

let unauthorizedHandler: () => void = () => {};
export const onUnauthorized = (handler: () => void) => {
  unauthorizedHandler = handler;
};

let refreshing: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function send(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  let response: Response;
  try {
    // The chosen language goes along, so the server can answer in it
    const headers = new Headers(init.headers);
    headers.set("Accept-Language", lang);
    response = await fetch(path, { credentials: "same-origin", ...init, headers });
  } catch {
    throw new ApiError(0, NO_CONNECTION);
  }
  if (response.status === 401 && !path.startsWith("/auth/")) {
    if (retry && (await refreshSession())) return send(path, init, false);
    unauthorizedHandler();
  }
  return response;
}

async function errorFrom(response: Response): Promise<ApiError> {
  if (response.status >= 500) return new ApiError(response.status, SERVER_ERROR);
  // The server already words its errors for people; anything else (an nginx page, a list of fields) is not shown
  const data = await response.json().catch(() => ({}));
  const worded = typeof data.detail === "string" && data.detail.trim() ? data.detail : null;
  // The backend says which limit was reached and when it ends; nginx's own 429 has no such text
  if (response.status === 429) return new ApiError(429, worded ?? TOO_MANY_REQUESTS);
  const detail = worded ?? SERVER_ERROR;
  return new ApiError(response.status, detail);
}

type Goal = string | { name: string; params?: Record<string, unknown> };

function fireGoal(goal?: Goal): void {
  if (!goal) return;
  if (typeof goal === "string") reachGoal(goal);
  else reachGoal(goal.name, goal.params);
}

async function request<T>(path: string, init: RequestInit = {}, goal?: Goal): Promise<T> {
  const response = await send(path, init);
  if (!response.ok) throw await errorFrom(response);
  fireGoal(goal);
  if (response.status === 204) return undefined as T;
  return (await response.json().catch(() => undefined)) as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: body === undefined ? undefined : JSON.stringify(body),
});

const upload = (field: string, file: Blob, filename?: string): RequestInit => {
  const form = new FormData();
  form.append(field, file, filename ?? (file instanceof File ? file.name : "upload"));
  return { method: "POST", body: form };
};

export const api = {
  auth: {
    register: (body: { email: string; password: string; name?: string | null; timezone?: string; website?: string; form_ms?: number }) =>
      request<TokenResponse>("/auth/register", json("POST", body), "register_success"),
    login: (email: string, password: string) =>
      request<TokenResponse>("/auth/login", json("POST", { email, password }), "login_success"),
    logout: () => request<{ status: string }>("/auth/logout", { method: "POST" }, "logout"),
    logoutAll: () => request<{ status: string }>("/auth/logout-all", { method: "POST" }, "logout_all"),
    // Sign up or log in through Google or Yandex: the browser goes to the returned link, the callback starts the session
    oauthStart: (
      provider: SignInProvider,
      body: { mode: "signup" | "login"; return_to?: string; timezone?: string; consent?: boolean },
    ) =>
      request<{ authorization_url: string }>(
        `/auth/oauth/${provider}/start`,
        json("POST", body),
        { name: body.mode === "signup" ? "oauth_signup_start" : "oauth_login_start", params: { provider } },
      ),
  },
  me: {
    get: () => request<User>("/api/me"),
    update: (body: { name?: string | null; timezone?: string }) =>
      request<User>("/api/me", json("PATCH", body), "me_update"),
    saveOnboarding: (profile: Record<string, unknown>) =>
      request<User>("/api/me/onboarding", json("PUT", profile), "onboarding_save"),
    remove: () => request<void>("/api/me", { method: "DELETE" }, "account_delete"),
  },
  calendars: {
    list: () => request<Calendar[]>("/api/calendars"),
    create: (body: { name: string; description?: string | null; timezone?: string }) =>
      request<Calendar>("/api/calendars", json("POST", { provider: "local", ...body }), "calendar_create"),
    /** The private feed link (path) for Samsung Calendar and other apps; reset makes a new one */
    feed: (reset = false) =>
      request<{ path: string }>(`/api/calendar/feed${reset ? "?reset=true" : ""}`, { method: "POST" }, reset ? "calendar_feed_reset" : "calendar_feed"),
    exportIcs: async () => {
      const response = await send("/api/calendar/export.ics");
      if (!response.ok) throw await errorFrom(response);
      reachGoal("calendar_export");
      return response.blob();
    },
  },
  events: {
    list: (params: { start?: string; end?: string; limit?: number; tag?: number } = {}) => {
      const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
      return request<CalendarEvent[]>(`/api/events?${query}`);
    },
    get: (id: number) => request<CalendarEvent>(`/api/events/${id}`),
    create: (body: EventCreate) =>
      request<CalendarEvent>("/api/events", json("POST", body), "event_create"),
    update: (id: number, body: Partial<EventCreate>) =>
      request<CalendarEvent>(`/api/events/${id}`, json("PUT", body), "event_update"),
    remove: (id: number, scope: DeleteScope = "one") =>
      request<void>(`/api/events/${id}?scope=${scope}`, { method: "DELETE" }, "event_delete"),
    complete: (id: number, completed: boolean) =>
      request<CalendarEvent>(`/api/events/${id}/complete`, json("POST", { completed }), completed ? "event_complete" : "event_uncomplete"),
    move: (eventIds: number[], date: string) =>
      request<{ moved: number }>("/api/events/move", json("POST", { event_ids: eventIds, date }), "event_move"),
    syncGoogle: (id: number) =>
      request<CalendarEvent>(`/api/events/${id}/sync/google`, { method: "POST" }, "event_sync_google"),
    links: (id: number) => request<EventLink[]>(`/api/events/${id}/links`),
    files: (id: number) => request<EventFile[]>(`/api/events/${id}/files`),
    uploadFile: (id: number, file: File) =>
      request<{ id: number; filename: string; size: number }>(
        `/api/events/${id}/files`,
        upload("file", file),
        "event_file_upload",
      ),
  },
  files: {
    remove: (id: number) => request<void>(`/api/files/${id}`, { method: "DELETE" }, "file_delete"),
    text: (id: number) =>
      request<{ file_id: number; text: string }>(`/api/files/${id}/text`, { method: "POST" }, "file_text_extract"),
  },
  stats: (days = 7) => request<Stats>(`/api/stats?days=${days}`),
  recommendations: (scope: "today" | "week" | "month" = "today", day?: string) =>
    request<{ items: Recommendation[] }>(`/api/recommendations?scope=${scope}${day ? `&day=${day}` : ""}`).then((result) => result.items),
  tags: {
    list: () => request<Tag[]>("/api/tags"),
    create: (body: { name: string; color?: TagColor; counts_progress?: boolean }) => request<Tag>("/api/tags", json("POST", body), "tag_create"),
    update: (id: number, body: { name?: string; color?: TagColor; counts_progress?: boolean }) => request<Tag>(`/api/tags/${id}`, json("PATCH", body), "tag_update"),
    remove: (id: number) => request<void>(`/api/tags/${id}`, { method: "DELETE" }, "tag_delete"),
  },
  assistant: {
    /** Ответ ассистента и id сообщения, по которому его можно оценить. */
    chat: (text: string) =>
      request<AssistantReply & { message_id?: number }>("/api/assistant/chat", json("POST", { text }), "assistant_message"),
    /** Тот же план, что бот показывает под своими кнопками; mark — в виде списка для отметок. */
    agenda: (scope: AgendaScope, mark = false) => request<AssistantReply>(`/api/assistant/agenda/${scope}?mark=${mark}`),
    /** «Перенести» в списке задач: задача получает выбранный день и сохраняет время. */
    move: (eventId: number, date: string) =>
      request<AssistantReply & { message_id?: number }>(`/api/assistant/events/${eventId}/move`, json("POST", { date }), "assistant_move"),
    /** «Отменить» под напоминанием, которое поставил ассистент. */
    cancelReminder: (reminderId: number) =>
      request<AssistantReply>(`/api/assistant/reminders/${reminderId}`, { method: "DELETE" }, "assistant_reminder_cancel"),
    undo: (eventIds: number[]) => request<{ deleted: number }>("/api/assistant/undo", json("POST", { event_ids: eventIds }), "assistant_undo"),
    rate: (messageId: number, value: -1 | 0 | 1) =>
      request<{ id: number; rating: -1 | 1 | null }>(`/api/assistant/messages/${messageId}/rating`, json("POST", { value }), {
        name: "assistant_rating",
        params: { value },
      }),
    history: () => request<HistoryMessage[]>("/api/assistant/history?limit=60"),
    /** «Очистить историю»: переписка пропадает у пользователя и у ассистента. */
    clearHistory: () => request<{ cleared: number }>("/api/assistant/history", { method: "DELETE" }, "assistant_history_clear"),
    /** Открыть чат по рекомендации: ассистент запомнит её как контекст разговора. */
    topic: (title: string, text: string) =>
      request<AssistantReply>("/api/assistant/topic", json("POST", { title, text }), "assistant_topic"),
    updateDraft: (draftId: number, items: Partial<DraftItem>[]) =>
      request<AssistantReply>(`/api/assistant/drafts/${draftId}`, json("PUT", { items }), "assistant_draft_edit"),
    setDraftCalendars: (draftId: number, calendars: string[]) =>
      request<AssistantReply>(`/api/assistant/drafts/${draftId}/calendars`, json("POST", { calendars }), "assistant_draft_calendars"),
    confirmDraft: (draftId: number, scope: DeleteScope = "one") =>
      request<AssistantReply>(`/api/assistant/drafts/${draftId}/confirm?scope=${scope}`, { method: "POST" }, "assistant_confirm"),
    cancelDraft: (draftId: number) =>
      request<AssistantReply>(`/api/assistant/drafts/${draftId}`, { method: "DELETE" }, "assistant_cancel"),
    transcribe: (audio: Blob) =>
      request<{ text: string }>("/api/assistant/transcribe", upload("audio", audio, "voice.webm"), "assistant_transcribe"),
    /** A message with a file (PDF, Word, Excel, CSV, text, photo): the server reads it and answers like any message. */
    chatFile: (file: File, text: string) => {
      const init = upload("file", file);
      (init.body as FormData).append("text", text);
      return request<AssistantReply & { message_id?: number }>("/api/assistant/chat/file", init, "assistant_file");
    },
  },
  integrations: {
    list: () => request<Integration[]>("/api/integrations"),
    connect: async (slug: string, values: Record<string, unknown>, returnTo?: string) => {
      const result = await request<IntegrationConnection | { authorization_url: string }>(
        `/api/integrations/${slug}/connect`,
        json("POST", { values, return_to: returnTo }),
        { name: "integration_connect", params: { integration: slug } },
      );
      if ("authorization_url" in result) await refreshSession();
      return result;
    },
    test: (slug: string) =>
      request<{ status: string; account: string }>(
        `/api/integrations/${slug}/test`,
        { method: "POST" },
        { name: "integration_test", params: { integration: slug } },
      ),
    // Every connected calendar; "Сегодня" calls it on opening, the server skips it when it ran a minute ago
    syncAll: () => request<{ synced: string[]; changed: boolean }>("/api/integrations/sync", { method: "POST" }),
    sync: (slug: string) =>
      request<SyncResult>(
        `/api/integrations/${slug}/sync`,
        { method: "POST" },
        { name: "integration_sync", params: { integration: slug } },
      ),
    exportEvent: (slug: string, eventId: number) =>
      request<EventLink>(
        `/api/integrations/${slug}/export/${eventId}`,
        { method: "POST" },
        { name: "integration_export", params: { integration: slug } },
      ),
    disconnect: (slug: string, purge = false) =>
      request<void>(
        `/api/integrations/${slug}?purge=${purge}`,
        { method: "DELETE" },
        { name: "integration_disconnect", params: { integration: slug } },
      ),
    getCalendars: (slug: string, values: Record<string, unknown>) => 
      request<{ calendars: { id: string; name: string }[] }>(`/api/integrations/${slug}/calendars`, {
        method: "POST",
        body: JSON.stringify({ values, return_to: window.location.pathname }),
      }),
  },
  reminders: {
    get: () => request<ReminderSettings>("/api/reminders/settings"),
    update: (body: Partial<ReminderSettings>) =>
      request<ReminderSettings>("/api/reminders/settings", json("PUT", body), "reminder_settings_update"),
    test: () =>
      request<{ id: number; status: string }>("/api/reminders/test", { method: "POST" }, "reminder_test"),
    history: () => request<ReminderHistoryItem[]>("/api/reminders/history"),
  },
  customReminders: {
    list: () => request<CustomReminder[]>("/api/reminders/custom"),
    create: (body: CustomReminderBody) => request<CustomReminder>("/api/reminders/custom", json("POST", body), "custom_reminder_create"),
    update: (id: number, body: CustomReminderBody) =>
      request<CustomReminder>(`/api/reminders/custom/${id}`, json("PUT", body), "custom_reminder_update"),
    remove: (id: number) => request<void>(`/api/reminders/custom/${id}`, { method: "DELETE" }, "custom_reminder_delete"),
  },
  telegram: {
    status: () => request<TelegramStatus>("/api/telegram"),
    link: () => request<TelegramLink>("/api/telegram/link", { method: "POST" }, "telegram_link"),
    unlink: () => request<void>("/api/telegram", { method: "DELETE" }, "telegram_unlink"),
  },
  admin: {
    tables: () => request<TableInfo[]>("/api/admin/tables"),
    table: (name: string) => request<TableData>(`/api/admin/tables/${encodeURIComponent(name)}`),
    note: () => request<AdminNote>("/api/admin/notes"),
    lockNote: () => request<AdminNote>("/api/admin/notes/lock", { method: "POST" }),
    unlockNote: () => request<AdminNote>("/api/admin/notes/unlock", { method: "POST" }),
    saveNote: (text: string, version: number) => request<AdminNote>("/api/admin/notes", json("PUT", { text, version })),
  },
    aiSources: {
    list: () => request<AiChatSource[]>("/api/ai-sources"),

    add: (body: {
      url: string;
      spheres?: string[];
      notes?: string[];
      comment?: string;
    }) =>
      request<AiChatSource>(
        "/api/ai-sources",
        json("POST", body),
        { name: "ai_source_add" },
      ),

    update: (id: string, body: {
      url?: string;
      spheres?: string[];
      notes?: string[];
      comment?: string;
    }) =>
      request<AiChatSource>(
        `/api/ai-sources/${encodeURIComponent(id)}`,
        json("PUT", body),
        { name: "ai_source_update" },
      ),

    remove: (id: string) =>
      request<void>(
        `/api/ai-sources/${encodeURIComponent(id)}`,
        { method: "DELETE" },
        { name: "ai_source_remove" },
      ),

    reparse: (id: string) =>
      request<AiChatSource>(
        `/api/ai-sources/${encodeURIComponent(id)}/reparse`,
        { method: "POST" },
        { name: "ai_source_reparse" },
      ),

    status: (id: string) =>
      request<AiChatSource>(
        `/api/ai-sources/${encodeURIComponent(id)}/status`,
      ),
  },
};

