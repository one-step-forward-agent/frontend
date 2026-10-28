import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import { ApiError, api } from "@/app/api/client";
import type { ResearchQuestionSave, ResearchSummary } from "@/app/api/types";
import { cn } from "@/utils/cn";

/** deyla.tech/dashboard/research: the hypotheses asked in the chat, their answers and the wishes for what Dayla
 * cannot do yet. A question goes with a chat answer and comes back after 2, 3, 4… days until the user answers. */

type Question = ResearchSummary["questions"][number];

const EMPTY: ResearchQuestionSave = { text: "", text_en: null, options: [], options_en: [], active: true, position: 0 };
const field = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-gray-900";
const button = "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-[13px] hover:bg-gray-100 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10";
const SOURCES: Record<string, string> = { option: "кнопка", text: "своими словами", chat: "в чате", skip: "пропуск" };

const lines = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);
const when = (value: string) => new Date(value).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function message(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) return "Раздел только для администраторов";
  // The site is newer than the server: the section's API is not deployed yet
  if (error instanceof ApiError && error.status === 404) return "На сервере ещё нет этого раздела — обновите бэкенд";
  return error instanceof Error ? error.message : "Не получилось — попробуйте ещё раз";
}

function QuestionForm({ initial, onSave, onCancel }: { initial: ResearchQuestionSave; onSave: (value: ResearchQuestionSave) => Promise<void>; onCancel?: () => void }) {
  const [text, setText] = React.useState(initial.text);
  const [textEn, setTextEn] = React.useState(initial.text_en ?? "");
  const [options, setOptions] = React.useState(initial.options.join("\n"));
  const [optionsEn, setOptionsEn] = React.useState(initial.options_en.join("\n"));
  const [position, setPosition] = React.useState(initial.position);
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave({ text: text.trim(), text_en: textEn.trim() || null, options: lines(options), options_en: lines(optionsEn), active: initial.active, position });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-1 text-[13px]">
        Вопрос
        <textarea className={field} rows={2} value={text} onChange={(event) => setText(event.target.value)} maxLength={500} required minLength={3} />
      </label>
      <label className="grid gap-1 text-[13px]">
        На английском (для английского сайта, можно пусто)
        <textarea className={field} rows={2} value={textEn} onChange={(event) => setTextEn(event.target.value)} maxLength={500} />
      </label>
      <label className="grid gap-1 text-[13px]">
        Варианты ответа — по одному в строке (пусто: только свой ответ)
        <textarea className={field} rows={3} value={options} onChange={(event) => setOptions(event.target.value)} />
      </label>
      <label className="grid gap-1 text-[13px]">
        Варианты на английском
        <textarea className={field} rows={3} value={optionsEn} onChange={(event) => setOptionsEn(event.target.value)} />
      </label>
      <div className="flex flex-wrap items-end gap-2 md:col-span-2">
        <label className="grid gap-1 text-[13px]">
          Порядок (меньше — раньше)
          <input type="number" className={cn(field, "w-28")} value={position} onChange={(event) => setPosition(Number(event.target.value) || 0)} />
        </label>
        <div className="flex-1" />
        {onCancel && (
          <button type="button" className={button} onClick={onCancel}>
            Отмена
          </button>
        )}
        <button type="submit" disabled={busy || text.trim().length < 3} className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 px-4 py-2 text-sm text-white shadow-md hover:brightness-110 disabled:opacity-50">
          {initial.text ? "Сохранить" : <><Plus size={16} /> Добавить гипотезу</>}
        </button>
      </div>
    </form>
  );
}

function QuestionCard({ question, onChanged, onError }: { question: Question; onChanged: () => void; onError: (text: string) => void }) {
  const [editing, setEditing] = React.useState(false);
  const save = (value: ResearchQuestionSave) =>
    api.admin
      .updateQuestion(question.id, value)
      .then(() => {
        setEditing(false);
        onChanged();
      })
      .catch((error) => onError(message(error)));
  const toggle = () => save({ ...question, active: !question.active });
  const remove = () => {
    if (!window.confirm("Удалить вопрос? Это можно, только пока на него никто не ответил.")) return;
    api.admin.deleteQuestion(question.id).then(onChanged).catch((error) => onError(message(error)));
  };
  const total = Object.values(question.counts).reduce((sum, count) => sum + count, 0);

  return (
    <article className={cn("rounded-2xl border p-4", question.active ? "border-gray-200 dark:border-white/10" : "border-dashed border-gray-300 opacity-70 dark:border-white/15")}>
      {editing ? (
        <QuestionForm initial={question} onSave={save} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-gray-500">
                #{question.id} · порядок {question.position} · {question.active ? "задаётся" : "выключен"}
              </p>
              <h2 className="text-base font-semibold">{question.text}</h2>
              {question.text_en && <p className="text-[13px] text-gray-500">{question.text_en}</p>}
            </div>
            <button type="button" className={button} onClick={() => setEditing(true)}>
              <Pencil size={14} /> Изменить
            </button>
            <button type="button" className={button} onClick={toggle}>
              <Power size={14} /> {question.active ? "Выключить" : "Включить"}
            </button>
            {question.answered === 0 && total === 0 && (
              <button type="button" className={cn(button, "text-red-600")} onClick={remove} aria-label="Удалить">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <p className="mt-2 text-[13px]">
            Спросили: <b>{question.asked}</b> · ответили: <b>{question.answered}</b>
            {question.asked > 0 && <> ({Math.round((question.answered * 100) / question.asked)}%)</>}
          </p>
          {total > 0 && (
            <ul className="mt-2 space-y-1">
              {Object.entries(question.counts)
                .sort((a, b) => b[1] - a[1])
                .map(([key, count]) => (
                  <li key={key} className="flex items-center gap-2 text-[13px]">
                    <span className="w-40 shrink-0 truncate" title={key}>{key.replace(/^—/, "")}</span>
                    <span className="h-2 rounded bg-sky-500/70" style={{ width: `${Math.max(4, (count * 100) / total)}%`, maxWidth: "60%" }} />
                    <span className="tabular-nums text-gray-500">{count}</span>
                  </li>
                ))}
            </ul>
          )}
          {question.answers.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[13px] text-sky-700 dark:text-sky-300">Последние ответы ({question.answers.length})</summary>
              <ul className="mt-2 divide-y divide-gray-100 text-[13px] dark:divide-white/5">
                {question.answers.map((row, index) => (
                  <li key={index} className="flex flex-wrap gap-x-3 py-1.5">
                    <span className="min-w-0 flex-1 break-words">{row.answer}</span>
                    <span className="text-gray-500">
                      {SOURCES[row.source]} · {row.channel === "telegram" ? "Telegram" : "сайт"} · user {row.user_id ?? "—"} · {when(row.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </article>
  );
}

export default function ResearchAdmin() {
  const [data, setData] = React.useState<ResearchSummary | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [formKey, setFormKey] = React.useState(0);

  const load = React.useCallback(() => {
    setProblem(null);
    api.admin.research().then(setData).catch((error) => setProblem(message(error)));
  }, []);
  React.useEffect(load, [load]);

  const create = (value: ResearchQuestionSave) =>
    api.admin
      .createQuestion(value)
      .then(() => {
        setFormKey((key) => key + 1);
        load();
      })
      .catch((error) => setProblem(message(error)));

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/dashboard" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10" aria-label="К таблицам" title="К таблицам">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Гипотезы</h1>
          <div className="flex-1" />
          <button type="button" className={button} onClick={load} aria-label="Обновить">
            <RefreshCw size={14} /> Обновить
          </button>
        </div>
        <p className="mb-6 max-w-3xl text-sm text-gray-600 dark:text-gray-400">
          Включённый вопрос уходит пользователю вместе с ответом ассистента — на сайте и в Telegram. Без ответа он вернётся через 2 дня, потом через 3, 4… Один пользователь получает не больше одного вопроса в день. Ответы и пожелания также лежат в таблицах <code>research_answers</code> и <code>feature_wishes</code>.
        </p>
        {problem && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {problem}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-gray-200 p-4 dark:border-white/10">
          <h2 className="mb-3 font-semibold">Новая гипотеза</h2>
          <QuestionForm key={formKey} initial={EMPTY} onSave={create} />
        </section>

        <section className="space-y-3">
          {data?.questions.length === 0 && <p className="text-sm text-gray-500">Гипотез пока нет.</p>}
          {data?.questions.map((question) => <QuestionCard key={question.id} question={question} onChanged={load} onError={setProblem} />)}
        </section>

        <section className="mt-10">
          <h2 className="mb-1 text-xl font-semibold">Пожелания</h2>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
            Что пользователи просили, а Dayla пока не умеет. Ассистент ответил им: «Я учту ваше пожелание и скоро смогу это для вас сделать».
          </p>
          {data && data.wishes.length === 0 && <p className="text-sm text-gray-500">Пока нет.</p>}
          <ul className="divide-y divide-gray-100 text-[13px] dark:divide-white/5">
            {data?.wishes.map((row, index) => (
              <li key={index} className="py-2">
                <p className="font-medium">{row.wish}</p>
                {row.message && row.message !== row.wish && <p className="text-gray-600 dark:text-gray-400">«{row.message}»</p>}
                <p className="text-gray-500">
                  {row.channel === "telegram" ? "Telegram" : "сайт"} · user {row.user_id ?? "—"} · {when(row.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
