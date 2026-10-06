// src/utils/onboardingSync.ts
//
// Онбординг проходят до входа в аккаунт: ответы хранятся в localStorage и
// после входа сохраняются в профиль на бэкенде (их анализирует ассистент:
// рабочие дни и часы, цели, тон общения).
import type { User } from '@/api/types';
import { createEvent, saveOnboarding } from '@/api/dayla';
import { useTasksStore } from '@/store/tasksStore';
import { localTimezone, taskBounds, toISODate } from '@/utils/dates';

export const ONBOARDING_KEY = 'dayla-onboarding';
const SYNCED_KEY = 'dayla-onboarding-synced';
const FIRST_TASK_KEY = 'dayla-first-task-created';
const PROFILE_FIELDS = [
  'purpose', 'spheres', 'toneOfVoice', 'goals', 'workDays', 'workHoursFrom', 'workHoursTo',
  'perDayWorkHours', 'timezone', 'integrations',
] as const;

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // приватный режим — синхронизируем в следующий раз
  }
};

export const loadOnboarding = <T>(): Partial<T> => {
  try {
    return JSON.parse(read(ONBOARDING_KEY) || '{}');
  } catch {
    return {};
  }
};

export const storeOnboarding = (data: unknown) => write(ONBOARDING_KEY, JSON.stringify(data));

/** Отправляет несохранённые ответы онбординга; возвращает обновлённого пользователя или null. */
export const syncOnboarding = async (): Promise<User | null> => {
  const raw = read(ONBOARDING_KEY);
  if (!raw || !read('access_token') || read(SYNCED_KEY) === raw) return null;
  let data: Record<string, any>;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const profile = Object.fromEntries(PROFILE_FIELDS.filter((key) => data[key] !== undefined).map((key) => [key, data[key]]));
  try {
    const user = await saveOnboarding(profile);
    write(SYNCED_KEY, raw);
    const title = data.firstTask?.title?.trim();
    if (title && read(FIRST_TASK_KEY) !== title) {
      const { start, end } = taskBounds(toISODate(new Date()), null, null);
      await createEvent({ title, start_at: start, end_at: end, all_day: true, timezone: localTimezone() });
      write(FIRST_TASK_KEY, title);
      useTasksStore.getState().changed();
    }
    return user;
  } catch {
    return null;
  }
};
