import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { TelegramLink } from "../api/types";
import { useAuth } from "../auth";
import { Icon } from "./icons";
import { Button, useErrorToast } from "./ui";
import { errorText } from "../lib/format";
import { cn } from "@/utils/cn";
import { tr } from "@/i18n";

const HIDDEN_KEY = "deyla.telegram-prompt.hidden";
// After the bot is opened the card checks the account until the link arrives
const CHECK_EVERY_MS = 3000;
const CHECK_FOR_MS = 3 * 60 * 1000;

function hiddenHere(place: string): boolean {
  try {
    return window.localStorage.getItem(`${HIDDEN_KEY}.${place}`) === "1";
  } catch {
    return false;
  }
}

/**
 * "Подключите Telegram": reminders, the morning plan and planning by voice come through the bot, and nothing
 * else in the app says so. Shown only while Telegram is not linked; one button opens the bot with the code.
 * `place` names where it stands, so closing it there does not hide it elsewhere.
 */
export function TelegramPrompt({ place, compact = false, closable = true }: { place: string; compact?: boolean; closable?: boolean }) {
  const { user, reload } = useAuth();
  const [hidden, setHidden] = useState(() => closable && hiddenHere(place));
  const [link, setLink] = useState<TelegramLink | null>(null);
  const [busy, setBusy] = useState(false);
  const reportError = useErrorToast();

  useEffect(() => {
    if (!link) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started > CHECK_FOR_MS) window.clearInterval(timer);
      else void reload();
    }, CHECK_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [link, reload]);

  if (!user || user.telegram_linked_at || hidden) return null;

  const open = async () => {
    // The tab is opened before the request, or the browser blocks it as a pop-up
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    setBusy(true);
    try {
      const next = await api.telegram.link();
      setLink(next);
      if (next.deep_link && tab) tab.location.href = next.deep_link;
      else tab?.close();
    } catch (error) {
      tab?.close();
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const hide = () => {
    try {
      window.localStorage.setItem(`${HIDDEN_KEY}.${place}`, "1");
    } catch {
      // Without storage it shows again next time: harmless
    }
    setHidden(true);
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl text-left",
        "bg-sky-500/[0.08] dark:bg-sky-400/[0.08] ring-1 ring-sky-400/30",
        compact ? "p-3" : "p-4"
      )}
    >
      {closable && (
        <button
          type="button"
          onClick={hide}
          aria-label={tr("Скрыть", "Hide")}
          className="absolute top-2 right-2 w-7 h-7 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-500/10"
        >
          <Icon name="close" size={14} />
        </button>
      )}
      <div className="flex gap-3 pr-6">
        <span className="shrink-0 w-9 h-9 rounded-xl bg-[#229ED9] text-white inline-flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M21.9 4.3 18.6 19.8c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L6 13.4 1.1 11.9c-1.1-.3-1.1-1.1.2-1.6L20.5 2.9c.9-.3 1.7.2 1.4 1.4Z" />
          </svg>
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Подключите Telegram — это 1 минута", "Connect Telegram — it takes a minute")}</p>
          {!compact && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {tr(
                "В Telegram приходят напоминания и план на утро, а боту можно писать и надиктовывать задачи, пересылать билеты и документы.",
                "Telegram brings reminders and the morning plan, and you can type or dictate tasks to the bot and forward tickets and documents."
              )}
            </p>
          )}
          {link ? (
            <ol className="text-sm text-gray-600 dark:text-gray-300 list-decimal pl-4 space-y-0.5">
              <li>
                {tr("В открывшемся Telegram нажмите", "In Telegram, press")} <strong>{tr("«Запустить»", "Start")}</strong>{tr(" (Start).", ".")}
                {link.deep_link && (
                  <>
                    {" "}
                    {tr("Не открылся?", "Did not open?")}{" "}
                    <a href={link.deep_link} target="_blank" rel="noreferrer noopener" className="text-sky-700 dark:text-sky-300 underline">
                      {tr("Открыть бота", "Open the bot")}
                    </a>
                  </>
                )}
              </li>
              {!link.deep_link && (
                <li>
                  {tr("Отправьте боту:", "Send the bot:")} <code className="px-1 rounded bg-gray-500/10">/start {link.code}</code>
                </li>
              )}
              <li>{tr("Готово — эта карточка исчезнет сама.", "Done — this card will disappear by itself.")}</li>
            </ol>
          ) : (
            <Button size="sm" variant="primary" icon="external" busy={busy} onClick={open}>
              {tr("Подключить Telegram", "Connect Telegram")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
