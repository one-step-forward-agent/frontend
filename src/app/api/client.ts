import { reachGoal } from "@/app/lib/metrics";
import type { BlogPost, BlogPostSave, BlogStats } from "@/types/blog";
import type { TableData, TableInfo } from "@/pages/Admin/sheet";
import type {
  AdminNote,
  Broadcasts,
  BroadcastSave,
  ResearchQuestionAdmin,
  ResearchQuestionSave,
  ResearchSummary,
  AgendaScope,
  AssistantReply,
  Calendar,
  CalendarEvent,
  EventCreate,
  EventFile,
  EventLink,
  DraftItem,
  Friend,
  Friends,
  FriendInviteCard,
  FriendTaskAction,
  FriendTaskCard,
  TeamChatMessage,
  TeamDetail,
  TeamInviteLink,
  TeamProject,
  TeamSummary,
  TeamTask,
  TeamTaskAction,
  TeamTaskCard,
  IcsImportResult,
  HistoryMessage,
  Integration,
  IntegrationConnection,
  Recommendation,
  ReminderHistoryItem,
  ReminderSettings,
  Rewards,
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

// The browser records webm (Chrome, Firefox) or mp4 (Safari); the server reads the format by the name
const voiceSuffix = (type: string): string =>
  type.includes("mp4") ? ".m4a" : type.includes("ogg") ? ".ogg" : type.includes("mpeg") ? ".mp3" : ".webm";

export const api = {
  auth: {
    register: (body: {
      email: string; password: string; name?: string | null; timezone?: string; website?: string; form_ms?: number;
      email_code?: string; email_token?: string;
    }) =>
      request<TokenResponse>("/auth/register", json("POST", body), "register_success"),
    // Mails a code that confirms the email; required false: the server has no mail set up and needs no code
    registerCode: (body: { email: string; website?: string }) =>
      request<{ required: boolean; email_token: string | null; expires_in: number | null }>(
        "/auth/register/code", json("POST", body), "register_code_sent",
      ),
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
    update: (body: { name?: string | null; timezone?: string; rewards_enabled?: boolean }) =>
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
    /** Events of an .ics file: all of them, or only those of the days dateFrom..dateTo (YYYY-MM-DD) */
    importIcs: (file: File, period: { dateFrom?: string; dateTo?: string } = {}) => {
      const init = upload("file", file);
      if (period.dateFrom) (init.body as FormData).append("date_from", period.dateFrom);
      if (period.dateTo) (init.body as FormData).append("date_to", period.dateTo);
      return request<IcsImportResult>("/api/calendar/import", init, "calendar_import");
    },
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
  rewards: () => request<Rewards>("/api/rewards"),
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
    /** A team question under a reply: an offered option, the user's own words or skip. */
    answerQuestion: (questionId: number, body: { option?: string; answer?: string; skip?: boolean; message_id?: number }) =>
      request<{ text: string; skipped: boolean }>(`/api/assistant/questions/${questionId}/answer`, json("POST", body), {
        name: "assistant_question_answer",
        params: { kind: body.skip ? "skip" : body.option ? "option" : "text" },
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
    /** A voice message, as in a messenger: the chat keeps the recording, the assistant answers what was said. */
    chatVoice: (audio: Blob, duration: number, file?: File | null) => {
      const init = upload("audio", audio, `voice${voiceSuffix(audio.type)}`);
      (init.body as FormData).append("duration", String(Math.round(duration * 10) / 10));
      // A file attached before recording goes with the voice message, as with a typed one
      if (file) (init.body as FormData).append("file", file, file.name);
      return request<AssistantReply & { message_id?: number }>("/api/assistant/chat/voice", init, "assistant_voice");
    },
    /** Where the chat plays a voice message from */
    voiceUrl: (id: string) => `/api/assistant/voice/${encodeURIComponent(id)}`,
    /** A message with a file (PDF, Word, Excel, CSV, text, photo): the server reads it and answers like any message. */
    chatFile: (file: File, text: string) => {
      const init = upload("file", file);
      (init.body as FormData).append("text", text);
      return request<AssistantReply & { message_id?: number }>("/api/assistant/chat/file", init, "assistant_file");
    },
  },
  friends: {
    list: () => request<Friends>("/api/friends"),
    invite: (email: string, nickname?: string) => request<Friend>("/api/friends", json("POST", { email, nickname: nickname || null }), "friend_invite"),
    update: (id: number, body: { nickname?: string | null; auto_accept?: boolean; unblock?: boolean }) =>
      request<Friend>(`/api/friends/${id}`, json("PATCH", body), "friend_update"),
    answer: (id: number, decision: "accept" | "decline") => request<FriendInviteCard>(`/api/friends/${id}/${decision}`, { method: "POST" }, `friend_${decision}`),
    remove: (id: number) => request<void>(`/api/friends/${id}`, { method: "DELETE" }, "friend_remove"),
    settings: (checkDefault: boolean) => request<{ check_default: boolean }>("/api/friends/settings", json("PUT", { check_default: checkDefault })),
    /** Friend cards that came to the chat after message `after` */
    inbox: (after: number) => request<HistoryMessage[]>(`/api/friends/inbox?after=${after}`),
    act: (taskId: number, action: FriendTaskAction) =>
      request<FriendTaskCard>(`/api/friend-tasks/${taskId}/${action}`, { method: "POST" }, { name: "friend_task", params: { action } }),
  },
  teams: {
    list: () => request<TeamSummary[]>("/api/teams"),
    create: (body: { name: string; tag?: string; my_name?: string }) => request<TeamDetail>("/api/teams", json("POST", body), "team_create"),
    get: (id: number) => request<TeamDetail>(`/api/teams/${id}`),
    update: (id: number, body: { name?: string; task_confirm?: "required" | "auto"; check_default?: boolean }) => request<TeamDetail>(`/api/teams/${id}`, json("PATCH", body), "team_update"),
    remove: (id: number) => request<void>(`/api/teams/${id}`, { method: "DELETE" }, "team_delete"),
    invites: (id: number) => request<TeamInviteLink[]>(`/api/teams/${id}/invites`),
    invite: (id: number, note?: string) => request<TeamInviteLink>(`/api/teams/${id}/invites`, json("POST", { note: note || null }), "team_invite"),
    revokeInvite: (id: number, inviteId: number) => request<void>(`/api/teams/${id}/invites/${inviteId}`, { method: "DELETE" }),
    inviteInfo: (token: string) =>
      request<{ team: { id: number; name: string; tag: string }; already_member: boolean; suggested_name: string; expires_at: string }>(`/api/teams/join/${encodeURIComponent(token)}`),
    join: (token: string, name: string) => request<TeamDetail>(`/api/teams/join/${encodeURIComponent(token)}`, json("POST", { name }), "team_join"),
    updateMember: (id: number, memberId: number, body: { name?: string; role?: "admin" | "member" }) => request<TeamDetail>(`/api/teams/${id}/members/${memberId}`, json("PATCH", body)),
    removeMember: (id: number, memberId: number) => request<void>(`/api/teams/${id}/members/${memberId}`, { method: "DELETE" }, "team_member_remove"),
    projects: (id: number) => request<TeamProject[]>(`/api/teams/${id}/projects`),
    saveProject: (id: number, body: { name?: string; description?: string | null; status?: "active" | "archived"; deadline_at?: string | null }, projectId?: number) =>
      request<TeamProject>(projectId ? `/api/teams/${id}/projects/${projectId}` : `/api/teams/${id}/projects`, json(projectId ? "PATCH" : "POST", body), "team_project_save"),
    removeProject: (id: number, projectId: number) => request<void>(`/api/teams/${id}/projects/${projectId}`, { method: "DELETE" }),
    tasks: (id: number) => request<TeamTask[]>(`/api/teams/${id}/tasks`),
    createTask: (
      id: number,
      body: { title: string; description?: string | null; assignee_id?: number | null; project_id?: number | null; deadline_at?: string | null; start_at?: string | null }
    ) => request<TeamTask>(`/api/teams/${id}/tasks`, json("POST", body), "team_task_create"),
    updateTask: (id: number, taskId: number, body: Partial<Pick<TeamTask, "title" | "description" | "assignee_id" | "project_id" | "deadline_at" | "start_at" | "status">>) =>
      request<TeamTask>(`/api/teams/${id}/tasks/${taskId}`, json("PATCH", body), "team_task_update"),
    removeTask: (id: number, taskId: number) => request<void>(`/api/teams/${id}/tasks/${taskId}`, { method: "DELETE" }),
    act: (taskId: number, action: TeamTaskAction) => request<TeamTaskCard>(`/api/team-tasks/${taskId}/${action}`, { method: "POST" }, { name: "team_task", params: { action } }),
    chat: (id: number) => request<TeamChatMessage[]>(`/api/teams/${id}/chat`),
    send: (id: number, text: string) => request<AssistantReply & { message_id?: number }>(`/api/teams/${id}/chat`, json("POST", { text }), "team_chat"),
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
    research: () => request<ResearchSummary>("/api/admin/research"),
    createQuestion: (question: ResearchQuestionSave) => request<ResearchQuestionAdmin>("/api/admin/research/questions", json("POST", question)),
    updateQuestion: (id: number, question: ResearchQuestionSave) => request<ResearchQuestionAdmin>(`/api/admin/research/questions/${id}`, json("PUT", question)),
    deleteQuestion: (id: number) => request<void>(`/api/admin/research/questions/${id}`, { method: "DELETE" }),
    broadcasts: () => request<Broadcasts>("/api/admin/broadcasts"),
    sendBroadcast: (broadcast: BroadcastSave) => request<{ batch: string; recipients: number }>("/api/admin/broadcasts", json("POST", broadcast)),
    blogPosts: () => request<BlogPost[]>("/api/admin/blog/posts"),
    blogPost: (id: number) => request<BlogPost>(`/api/admin/blog/posts/${id}`),
    createBlogPost: (post: BlogPostSave) => request<BlogPost>("/api/admin/blog/posts", json("POST", post)),
    saveBlogPost: (id: number, post: BlogPostSave) => request<BlogPost>(`/api/admin/blog/posts/${id}`, json("PUT", post)),
    duplicateBlogPost: (id: number) => request<BlogPost>(`/api/admin/blog/posts/${id}/duplicate`, { method: "POST" }),
    deleteBlogPost: (id: number) => request<void>(`/api/admin/blog/posts/${id}`, { method: "DELETE" }),
    resetBlogViews: (id: number) => request<void>(`/api/admin/blog/posts/${id}/views`, { method: "DELETE" }),
    uploadBlogImage: (file: File) => request<{ url: string }>("/api/admin/blog/images", upload("file", file)),
    blogStats: (days: number, postId?: number) =>
      request<BlogStats>(`/api/admin/blog/stats?days=${days}${postId ? `&post_id=${postId}` : ""}`),
  },
  /** The public blog: published posts and how they are read */
  blog: {
    posts: () => request<BlogPost[]>("/api/blog/posts"),
    post: (slug: string) => request<BlogPost>(`/api/blog/posts/${encodeURIComponent(slug)}`),
    startView: (slug: string, visitor: string, referrer: string | null) =>
      request<{ id: number | null; key: string | null }>(`/api/blog/posts/${encodeURIComponent(slug)}/views`, json("POST", { visitor, referrer })),
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

