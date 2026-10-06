// src/api/dayla.ts
//
// Задачи, календарь, статистика, рекомендации и ассистент Dayla.
import client from './client';
import type { User } from './types';

// ---------- Задачи (события календаря) ----------

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface DaylaEvent {
  id: number;
  calendar_id: number;
  title: string;
  description?: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
  priority: Priority;
  location?: string | null;
  all_day: boolean;
  reminder_minutes?: number | null;
  recurrence_rule?: string | null;
  series_id?: string | null;
  completed_at?: string | null;
  source: string;
}

export interface EventInput {
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  timezone: string;
  description?: string | null;
  location?: string | null;
  priority?: Priority;
  reminder_minutes?: number | null;
  recurrence_rule?: string | null;
}

export const listEvents = async (start: Date, end: Date): Promise<DaylaEvent[]> => {
  const response = await client.get<DaylaEvent[]>('/api/events', {
    params: { start: start.toISOString(), end: end.toISOString(), limit: 1000 },
  });
  return response.data;
};

export const createEvent = async (data: EventInput): Promise<DaylaEvent> =>
  (await client.post<DaylaEvent>('/api/events', data)).data;

export const updateEvent = async (id: number, data: Partial<EventInput>): Promise<DaylaEvent> =>
  (await client.put<DaylaEvent>(`/api/events/${id}`, data)).data;

export const deleteEvent = async (id: number, scope: 'one' | 'series' = 'one'): Promise<void> => {
  await client.delete(`/api/events/${id}`, { params: { scope } });
};

export const setCompleted = async (id: number, completed: boolean): Promise<DaylaEvent> =>
  (await client.post<DaylaEvent>(`/api/events/${id}/complete`, { completed })).data;

export const moveEvents = async (eventIds: number[], date: string): Promise<number> =>
  (await client.post<{ moved: number }>('/api/events/move', { event_ids: eventIds, date })).data.moved;

// ---------- Статистика и рекомендации ----------

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
}

export const getStats = async (days = 7): Promise<Stats> =>
  (await client.get<Stats>('/api/stats', { params: { days } })).data;

export interface Recommendation {
  kind: 'info' | 'warning' | 'success';
  title: string;
  text: string;
}

export const getRecommendations = async (): Promise<Recommendation[]> =>
  (await client.get<{ items: Recommendation[] }>('/api/recommendations')).data.items;

// ---------- Ассистент ----------

export interface DraftItem {
  index: number;
  title: string;
  date: string;
  time: string | null;
  end_time: string | null;
  rrule: string | null;
  recurrence: string | null;
  location: string | null;
  description: string | null;
  reminder_minutes: number | null;
  start: string;
  end: string;
  all_day: boolean;
}

export interface AgendaEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  time: string | null;
  all_day: boolean;
  completed: boolean;
  location?: string | null;
  recurrence?: string | null;
}

export type AssistantReply =
  | { kind: 'proposal'; draft_id: number; events: DraftItem[]; answer: string | null; note: string | null }
  | { kind: 'created'; events: AgendaEvent[]; event_ids: number[] }
  | { kind: 'agenda'; title: string; days: { date: string; label: string; events: AgendaEvent[] }[] }
  | { kind: 'answer' | 'not_found' | 'edit_error' | 'cancelled'; text: string }
  | { kind: 'nothing' };

export const sendAssistantMessage = async (text: string): Promise<AssistantReply> =>
  (await client.post<AssistantReply>('/api/assistant/chat', { text })).data;

export const updateDraft = async (draftId: number, items: Partial<DraftItem>[]): Promise<AssistantReply> =>
  (await client.put<AssistantReply>(`/api/assistant/drafts/${draftId}`, { items })).data;

export const confirmDraft = async (draftId: number): Promise<AssistantReply> =>
  (await client.post<AssistantReply>(`/api/assistant/drafts/${draftId}/confirm`)).data;

export const cancelDraft = async (draftId: number): Promise<AssistantReply> =>
  (await client.delete<AssistantReply>(`/api/assistant/drafts/${draftId}`)).data;

// ---------- Профиль, Telegram, напоминания ----------

export const saveOnboarding = async (profile: Record<string, unknown>): Promise<User> =>
  (await client.put<User>('/api/me/onboarding', profile)).data;

export interface TelegramStatus {
  linked: boolean;
  username: string | null;
  bot_username: string | null;
}

export const getTelegramStatus = async (): Promise<TelegramStatus> =>
  (await client.get<TelegramStatus>('/api/telegram')).data;

export const createTelegramLink = async (): Promise<{ code: string; deep_link: string | null }> =>
  (await client.post<{ code: string; deep_link: string | null }>('/api/telegram/link')).data;

export const unlinkTelegram = async (): Promise<void> => {
  await client.delete('/api/telegram');
};

export interface ReminderSettings {
  enabled: boolean;
  lead_times: number[];
  daily_digest_enabled: boolean;
  daily_digest_time: string;
  checkin_enabled: boolean;
  checkin_time: string;
}

export const getReminderSettings = async (): Promise<ReminderSettings> =>
  (await client.get<ReminderSettings>('/api/reminders/settings')).data;

export const updateReminderSettings = async (values: Partial<ReminderSettings>): Promise<ReminderSettings> =>
  (await client.put<ReminderSettings>('/api/reminders/settings', values)).data;
