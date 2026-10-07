// src/config/devAuth.ts
import type { User } from "@/app/api/types";

/**
 * Флаг активен ТОЛЬКО в dev-сборке Vite и только если явно включён
 * в .env.local. В прод-сборке import.meta.env.DEV === false,
 * поэтому даже случайно оставленный флаг не сработает.
 */
export const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

/**
 * Фейковый пользователь для dev-режима.
 * Обязательные поля — id, email; остальные по мере необходимости.
 */
export const DEV_USER: User = {
  email: "dev@localhost",
  name: "Dev User",
  timezone: "Europe/Moscow",
  // добавьте сюда остальные поля типа User, если они required
} as User;

console.warn(
  "[devAuth] DEV_AUTH_BYPASS активен — все auth-запросы пропускаются"
);