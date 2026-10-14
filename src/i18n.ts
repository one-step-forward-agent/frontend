/**
 * The site's language: Russian or English, chosen in the account settings (or the RU/EN switch on public pages).
 * It is read once at start-up and a change reloads the page, so every text — including module-level lists and
 * dates formatted outside React — is in one language. Texts sit next to their code: tr("Сегодня", "Today").
 */

export type Lang = "ru" | "en";

const STORAGE_KEY = "dayla-lang";

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ru" || stored === "en") return stored;
  } catch {
    // no storage: fall back to the browser's language
  }
  // Russian for the browsers set to Russian or a neighbouring language, English for the rest
  const browser = (typeof navigator !== "undefined" ? navigator.language : "ru").toLowerCase();
  return /^(ru|uk|be|kk|uz|ky|tg|hy|az)\b/.test(browser) ? "ru" : "en";
}

export const lang: Lang = readLang();
export const isEn = lang === "en";

/** The text in the current language */
export const tr = (ru: string, en: string): string => (isEn ? en : ru);

/** For dates and numbers: toLocaleDateString(LOCALE, …) */
export const LOCALE = isEn ? "en-GB" : "ru-RU";

if (typeof document !== "undefined") document.documentElement.lang = lang;

export function setLang(next: Lang) {
  if (next === lang) return;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // without storage the choice lasts until the reload only
  }
  window.location.reload();
}

/** Russian and English plurals: plural(n, "день", "дня", "дней") in Russian, one/many in English */
export function pluralWord(count: number, ru: [string, string, string], en: [string, string]): string {
  if (isEn) return count === 1 ? en[0] : en[1];
  const tail = count % 100;
  if (tail >= 11 && tail <= 14) return ru[2];
  if (count % 10 === 1) return ru[0];
  if (count % 10 >= 2 && count % 10 <= 4) return ru[1];
  return ru[2];
}
