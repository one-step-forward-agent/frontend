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

// The official Google "G": Google's branding rules allow neither other colours nor another shape
const GoogleMark: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const YandexMark: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
    <path fill="#fff" d="M13.3 6.2h-1.1c-2 0-3.1 1-3.1 2.6 0 1.8.8 2.6 2.3 3.6l1.3.9-3.7 5.5H6.3l3.3-4.9C7.7 12.6 6.6 11.3 6.6 9c0-2.8 2-4.8 5.6-4.8h3.6v13.6h-2.5V6.2z" />
  </svg>
);

// Google's button keeps Google's own look (white or #131314, grey outline), not the glass of the rest of the form
const GOOGLE_BODY =
  "bg-white text-[#1F1F1F] ring-1 ring-[#747775] hover:bg-[#F7F8F8] " +
  "dark:bg-[#131314] dark:text-[#E3E3E3] dark:ring-[#8E918F] dark:hover:bg-[#1F1F20]";

const PROVIDERS: { id: SignInProvider; label: string; Mark: React.FC; body: string }[] = [
  { id: 'google', label: 'Войти через Google', Mark: GoogleMark, body: GOOGLE_BODY },
  { id: 'yandex', label: 'Войти с Яндекс ID', Mark: YandexMark, body: cn("text-gray-800 dark:text-gray-100", GLASS_BODY) },
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
        {PROVIDERS.map(({ id, label, Mark, body }) => (
          <button
            key={id}
            type="button"
            onClick={() => signIn(id)}
            disabled={busy !== null}
            className={cn(
              "relative overflow-hidden h-11 rounded-full",
              "inline-flex items-center justify-center gap-2",
              "text-sm font-medium",
              body,
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
