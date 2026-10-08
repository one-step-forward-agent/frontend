// src/pages/Auth/SignInButtons.tsx
import React, { useState } from 'react';

import { api, type SignInProvider } from '@/app/api/client';
import { errorText } from '@/app/lib/format';
import { cn } from '@/utils/cn';

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GoogleMark: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

const YandexMark: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
    <path fill="#fff" d="M13.3 6.2h-1.1c-2 0-3.1 1-3.1 2.6 0 1.8.8 2.6 2.3 3.6l1.3.9-3.7 5.5H6.3l3.3-4.9C7.7 12.6 6.6 11.3 6.6 9c0-2.8 2-4.8 5.6-4.8h3.6v13.6h-2.5V6.2z" />
  </svg>
);

const PROVIDERS: { id: SignInProvider; label: string; Mark: React.FC }[] = [
  { id: 'google', label: 'Google', Mark: GoogleMark },
  { id: 'yandex', label: 'Яндекс ID', Mark: YandexMark },
];

interface SignInButtonsProps {
  /** Where to land after logging in */
  returnTo?: string;
}

/** «Войти через Google / Яндекс ID»: for accounts that signed up through them or connected them once. */
export const SignInButtons: React.FC<SignInButtonsProps> = ({ returnTo }) => {
  const [busy, setBusy] = useState<SignInProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (provider: SignInProvider) => {
    setError(null);
    setBusy(provider);
    try {
      const { authorization_url } = await api.auth.oauthStart(provider, { mode: 'login', return_to: returnTo });
      window.location.assign(authorization_url);
    } catch (err) {
      setError(errorText(err));
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PROVIDERS.map(({ id, label, Mark }) => (
          <button
            key={id}
            type="button"
            onClick={() => signIn(id)}
            disabled={busy !== null}
            className={cn(
              "relative overflow-hidden h-11 rounded-full",
              "inline-flex items-center justify-center gap-2",
              "text-sm font-medium text-gray-800 dark:text-gray-100",
              GLASS_BODY,
              "transition-transform duration-300 hover:-translate-y-0.5",
              "disabled:opacity-60 disabled:pointer-events-none"
            )}
          >
            <Mark />
            {busy === id ? 'Переходим…' : label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};
