import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: any[]) => void;
  }
}

const COUNTER_ID = 113480066;

export function YandexMetrika() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.ym === 'function') {
      window.ym(COUNTER_ID, 'hit', window.location.href, {
        title: document.title,
        referer: document.referrer,
      });
    }
  }, [location.pathname, location.search]);

  return null;
}