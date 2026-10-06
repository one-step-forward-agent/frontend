import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Базовый URL бэкенда Dayla (берётся из переменных окружения)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Ключи для хранения токенов в localStorage
export const TOKEN_KEY = 'access_token';
export const REFRESH_KEY = 'refresh_token';

export const saveTokens = (data: { access_token: string; refresh_token?: string }) => {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
};

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

// Создаём экземпляр Axios
const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 5 * 60000, // 5 минут
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик запроса – добавляем токен авторизации
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Access-токен живёт 15 минут: при 401 один раз обновляем его refresh-токеном и повторяем запрос
let refreshing: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
    saveTokens(response.data);
    return response.data.access_token;
  } catch {
    clearTokens();
    return null;
  }
};

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing = refreshing ?? refreshAccessToken().finally(() => { refreshing = null; });
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      }
      clearTokens();
      window.dispatchEvent(new Event('dayla:logout'));
    }
    return Promise.reject(error);
  },
);

export default client;
