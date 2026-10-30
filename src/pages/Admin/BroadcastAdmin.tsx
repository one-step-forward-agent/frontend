import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FlaskConical, RefreshCw, Send } from "lucide-react";
import { ApiError, api } from "@/app/api/client";
import type { Broadcasts } from "@/app/api/types";

/** deyla.tech/dashboard/broadcast: a Telegram message from the team to every user with the bot linked. Each user gets
 * it in their site's language, not during their quiet hours, through the bot's usual queue (after the reminders). */

const MAX = 3500;
const field = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-gray-900";
const button = "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-[13px] hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10";

const when = (value: string) => new Date(value).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function message(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) return "Раздел только для администраторов";
  // The site is newer than the server: the section's API is not deployed yet
  if (error instanceof ApiError && error.status === 404) return "На сервере ещё нет этого раздела — обновите бэкенд";
  return error instanceof Error ? error.message : "Не получилось — попробуйте ещё раз";
}

export default function BroadcastAdmin() {
  const [data, setData] = React.useState<Broadcasts | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [text, setText] = React.useState("");
  const [textEn, setTextEn] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    setProblem(null);
    api.admin.broadcasts().then(setData).catch((error) => setProblem(message(error)));
  }, []);
  React.useEffect(load, [load]);

  const total = data ? data.recipients.ru + data.recipients.en : 0;

  const send = async (test: boolean) => {
    if (!test && !window.confirm(`Отправить сообщение всем пользователям с Telegram (${total})? Отменить рассылку будет нельзя.`)) return;
    setBusy(true);
    setProblem(null);
    setNotice(null);
    try {
      const result = await api.admin.sendBroadcast({ text: text.trim(), text_en: textEn.trim() || null, test });
      if (test) {
        setNotice("Тест поставлен в очередь — он придёт вам в Telegram в течение минуты.");
      } else {
        setNotice(`Рассылка поставлена в очередь: ${result.recipients} получателей.`);
        setText("");
        setTextEn("");
      }
      load();
    } catch (error) {
      setProblem(message(error));
    } finally {
      setBusy(false);
    }
  };

  const empty = !text.trim();

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/dashboard" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10" aria-label="К таблицам" title="К таблицам">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Рассылка в Telegram</h1>
          <div className="flex-1" />
          <button type="button" className={button} onClick={load} aria-label="Обновить">
            <RefreshCw size={14} /> Обновить
          </button>
        </div>
        <p className="mb-6 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
          Сообщение придёт от бота всем, кто привязал Telegram. Пользователи с английским сайтом получат английский текст (если он пустой — русский). Во время тихих часов пользователя сообщение
          подождёт их окончания; не доставленное за 2 дня — отбрасывается. Текст уходит как есть, без форматирования; ссылки Telegram сделает кликабельными сам.
        </p>
        {problem && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {problem}
          </div>
        )}
        {notice && (
          <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {notice}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-gray-200 p-4 dark:border-white/10">
          <h2 className="mb-3 font-semibold">Новое сообщение</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-[13px]">
              Текст
              <textarea className={field} rows={8} value={text} onChange={(event) => setText(event.target.value)} maxLength={MAX} />
              <span className="text-right text-[12px] text-gray-500 tabular-nums">{text.length}/{MAX}</span>
            </label>
            <label className="grid gap-1 text-[13px]">
              На английском (можно пусто)
              <textarea className={field} rows={8} value={textEn} onChange={(event) => setTextEn(event.target.value)} maxLength={MAX} />
              <span className="text-right text-[12px] text-gray-500 tabular-nums">{textEn.length}/{MAX}</span>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-[13px] text-gray-600 dark:text-gray-400">
              {data ? (
                <>
                  Получателей: <b>{total}</b> (русский — {data.recipients.ru}, английский — {data.recipients.en})
                </>
              ) : (
                "Считаем получателей…"
              )}
            </p>
            <div className="flex-1" />
            <button
              type="button"
              className={button}
              disabled={busy || empty || !data?.me_linked}
              onClick={() => send(true)}
              title={data && !data.me_linked ? "Привяжите свой Telegram в настройках, чтобы получать тесты" : "Отправить только себе"}
            >
              <FlaskConical size={14} /> Тест себе
            </button>
            <button
              type="button"
              disabled={busy || empty || total === 0}
              onClick={() => send(false)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 px-4 py-2 text-sm text-white shadow-md hover:brightness-110 disabled:opacity-50"
            >
              <Send size={16} /> Отправить всем
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Последние рассылки</h2>
          {data?.history.length === 0 && <p className="text-sm text-gray-500">Рассылок пока не было.</p>}
          <ul className="space-y-3">
            {data?.history.map((row) => (
              <li key={row.batch} className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                <p className="text-[12px] text-gray-500">
                  {when(row.created_at)}
                  {row.by && <> · {row.by}</>}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{row.text}</p>
                {row.text_en && <p className="mt-1 whitespace-pre-wrap break-words text-[13px] text-gray-500">{row.text_en}</p>}
                <p className="mt-2 text-[13px]">
                  Доставлено: <b>{row.sent}</b> из {row.total}
                  {row.queued > 0 && <> · в очереди: {row.queued}</>}
                  {row.failed > 0 && <span className="text-red-600 dark:text-red-400"> · не доставлено: {row.failed}</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
