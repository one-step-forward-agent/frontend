import { reachGoal } from "@/app/lib/metrics";
import type {
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
  SyncResult,
  TelegramLink,
  TelegramStatus,
  TokenResponse,
  User,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

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
  const response = await fetch(path, { credentials: "same-origin", ...init });
  if (response.status === 401 && !path.startsWith("/auth/")) {
    if (retry && (await refreshSession())) return send(path, init, false);
    unauthorizedHandler();
  }
  return response;
}

async function errorFrom(response: Response): Promise<ApiError> {
  const data = await response.json().catch(() => ({}));
  const detail = Array.isArray(data.detail)
    ? data.detail.map((item: { msg: string }) => item.msg).join("; ")
    : data.detail;
  return new ApiError(response.status, detail || response.statusText || "Ошибка запроса");
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
    register: (body: { email: string; password: string; name?: string | null; timezone?: string }) =>
      request<TokenResponse>("/auth/register", json("POST", body), "register_success"),
    login: (email: string, password: string) =>
      request<TokenResponse>("/auth/login", json("POST", { email, password }), "login_success"),
    logout: () => request<{ status: string }>("/auth/logout", { method: "POST" }, "logout"),
    logoutAll: () => request<{ status: string }>("/auth/logout-all", { method: "POST" }, "logout_all"),
  },
  me: {
    get: () => request<User>("/api/me"),
    update: (body: { name?: string | null; timezone?: string }) =>
      request<User>("/api/me", json("PATCH", body), "me_update"),
    saveOnboarding: (profile: Record<string, unknown>) =>
      request<User>("/api/me/onboarding", json("PUT", profile), "onboarding_save"),
  },
  calendars: {
    list: () => request<Calendar[]>("/api/calendars"),
    create: (body: { name: string; description?: string | null; timezone?: string }) =>
      request<Calendar>("/api/calendars", json("POST", { provider: "local", ...body }), "calendar_create"),
    exportIcs: async () => {
      const response = await send("/api/calendar/export.ics");
      if (!response.ok) throw await errorFrom(response);
      reachGoal("calendar_export");
      return response.blob();
    },
  },
  events: {
    list: (params: { start?: string; end?: string; limit?: number } = {}) => {
      const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
      return request<CalendarEvent[]>(`/api/events?${query}`);
    },
    get: (id: number) => request<CalendarEvent>(`/api/events/${id}`),
    create: (body: EventCreate) =>
      request<CalendarEvent>("/api/events", json("POST", body), "event_create"),
    update: (id: number, body: Partial<EventCreate>) =>
      request<CalendarEvent>(`/api/events/${id}`, json("PUT", body), "event_update"),
    remove: (id: number, scope: "one" | "series" = "one") =>
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
  recommendations: () => request<{ items: Recommendation[] }>("/api/recommendations").then((result) => result.items),
  assistant: {
    chat: (text: string) => request<AssistantReply>("/api/assistant/chat", json("POST", { text }), "assistant_message"),
    history: () => request<HistoryMessage[]>("/api/assistant/history?limit=60"),
    updateDraft: (draftId: number, items: Partial<DraftItem>[]) =>
      request<AssistantReply>(`/api/assistant/drafts/${draftId}`, json("PUT", { items }), "assistant_draft_edit"),
    confirmDraft: (draftId: number) =>
      request<AssistantReply>(`/api/assistant/drafts/${draftId}/confirm`, { method: "POST" }, "assistant_confirm"),
    cancelDraft: (draftId: number) =>
      request<AssistantReply>(`/api/assistant/drafts/${draftId}`, { method: "DELETE" }, "assistant_cancel"),
    transcribe: (audio: Blob) =>
      request<{ text: string }>("/api/assistant/transcribe", upload("audio", audio, "voice.webm"), "assistant_transcribe"),
    readFile: (file: File) =>
      request<{ filename: string; text: string }>("/api/assistant/file", upload("file", file), "assistant_file_read"),
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
  },
  reminders: {
    get: () => request<ReminderSettings>("/api/reminders/settings"),
    update: (body: Partial<ReminderSettings>) =>
      request<ReminderSettings>("/api/reminders/settings", json("PUT", body), "reminder_settings_update"),
    test: () =>
      request<{ id: number; status: string }>("/api/reminders/test", { method: "POST" }, "reminder_test"),
    history: () => request<ReminderHistoryItem[]>("/api/reminders/history"),
  },
  telegram: {
    status: () => request<TelegramStatus>("/api/telegram"),
    link: () => request<TelegramLink>("/api/telegram/link", { method: "POST" }, "telegram_link"),
    unlink: () => request<void>("/api/telegram", { method: "DELETE" }, "telegram_unlink"),
  },
};