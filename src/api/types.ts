// src/api/types.ts
//
// Общие типы для API. Единый источник истины для доменных моделей,
// которые ходят между фронтом и бэком.

// ---------- Пользователь ----------

export interface User {
  id: number;
  email: string;
  name?: string | null;
  timezone?: string | null;
  telegram_username?: string | null;
  telegram_linked_at?: string | null;
  profile?: Record<string, unknown>;
}

// ---------- Аутентификация ----------

/** Ответ после логина (регистрация токен не возвращает). */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/** Параметры регистрации (отправляются как JSON). */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

/** Параметры логина (отправляются как x-www-form-urlencoded). */
export interface LoginData {
  username: string;
  password: string;
}

// ---------- Статус пользователя ----------

export interface UserStatusResponse {
  plan: "free" | "starter" | "business";
  usage: {
    tasks: number;
    integrations: number;
  };
  limits: {
    tasks: number;
    integrations: number;
  };
}