import client, { REFRESH_KEY, TOKEN_KEY, clearTokens, saveTokens } from './client';
import { User } from './types';

// Ответ бэкенда после логина/регистрации
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Параметры регистрации (отправляются как JSON)
interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

// Параметры логина (отправляются как x-www-form-urlencoded, OAuth2 password flow)
interface LoginData {
  username: string; // email
  password: string;
}

const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
};

// Логин – отправляет form-urlencoded
export const login = async (data: LoginData): Promise<void> => {
  const formData = new URLSearchParams();
  formData.append('username', data.username.trim());
  formData.append('password', data.password);

  const response = await client.post<TokenResponse>('/auth/token', formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  saveTokens(response.data);
};

// Регистрация – бэкенд сразу возвращает токены
export const register = async (data: RegisterData): Promise<void> => {
  const response = await client.post<TokenResponse>('/auth/register', {
    email: data.email.trim(),
    password: data.password,
    name: data.name || undefined,
    timezone: browserTimezone(),
  });
  saveTokens(response.data);
};

// Выход – отзываем refresh-токен и удаляем токены
export const logout = (): void => {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (refreshToken) {
    client.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {});
  }
  clearTokens();
};

// Получение текущего пользователя (по токену)
export const getCurrentUser = async (): Promise<User> => {
  const response = await client.get<User>('/api/me');
  return response.data;
};

// Проверка, авторизован ли пользователь
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem(TOKEN_KEY);
};
