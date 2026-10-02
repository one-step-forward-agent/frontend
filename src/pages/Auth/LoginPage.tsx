// src/pages/Auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Alert, Button, FormField, Input } from '@/components/ui';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(username, password);
      // После успеха `isAuthenticated` станет true → useEffect сделает редирект.
    } catch {
      // ошибка уже в сторе
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Вход в аккаунт
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField id="username" label="Имя пользователя" required>
          {(field) => (
            <Input
              {...field}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="Введите имя пользователя"
              required
            />
          )}
        </FormField>

        <FormField id="password" label="Пароль" required>
          {(field) => (
            <Input
              {...field}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Минимум 8 символов"
              required
            />
          )}
        </FormField>

        {error && <Alert variant="error">{error}</Alert>}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Войти
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Нет аккаунта?{' '}
        <Link
          to="/register"
          className="text-blue-600 hover:underline font-medium"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;