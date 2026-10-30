// src/app/pages/Friends.tsx
import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { Friend } from "../api/types";
import { Icon } from "../components/icons";
import { Badge, Button, ConfirmButton, ErrorNote, Field, Loading, PageHeader, Switch, useErrorToast, useToast } from "../components/ui";
import { useAction, useAsync } from "../lib/hooks";
import { Link, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { GlassCard } from "@/components/dashboard/glass";
import { tr } from "@/i18n";

/**
 * Friends: added here, given tasks in the assistant chat ("добавь Маше купить хлеб завтра в 18").
 * A friend's invitation and tasks come to the chat and to Telegram, with buttons to answer.
 */

const PAGE = "relative max-w-3xl mx-auto pt-[1.5vh]";
const INPUT =
  "w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 text-sm text-gray-900 dark:border-white/15 dark:bg-white/5 dark:text-white";

export const FRIEND_EXAMPLES = [
  tr("Добавь Маше купить хлеб завтра в 18:00", "Add Masha to buy bread tomorrow at 6 pm"),
  tr("Поручи Олегу подготовить отчёт к пятнице без контроля", "Ask Oleg to prepare the report on Friday without check"),
  tr("Запланируй нам с Машей кино в субботу в 19:00", "Plan the cinema for me and Masha on Saturday at 7 pm"),
];

export function FriendsPage() {
  useTitle(tr("Друзья", "Friends"));
  const data = useAsync(() => api.friends.list(), []);
  const reportError = useErrorToast();
  const toast = useToast();
  const { pending, run } = useAction(reportError);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");

  const friends = data.data?.friends ?? [];
  const incoming = friends.filter((item) => item.status === "incoming");
  const others = friends.filter((item) => item.status !== "incoming");

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    const added = await run("invite", () => api.friends.invite(email.trim(), nickname.trim()));
    if (!added) return;
    setEmail("");
    setNickname("");
    toast(
      added.status === "accepted"
        ? tr(`${added.name} теперь в друзьях`, `${added.name} is your friend now`)
        : tr("Приглашение отправлено — друг ответит в чате Deyla или в Telegram", "Invitation sent — your friend answers in the Deyla chat or in Telegram")
    );
    data.reload();
  };

  const setCheck = async (value: boolean) => {
    if (await run("check", () => api.friends.settings(value))) data.reload();
  };

  return (
    <div className={PAGE}>
      <Link
        to="/account#friends"
        className="inline-flex items-center gap-1.5 mb-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <Icon name="left" size={14} /> {tr("Аккаунт", "Account")}
      </Link>
      <PageHeader
        title={tr("Друзья", "Friends")}
        subtitle={tr(
          "Планируйте вместе: давайте друзьям задачи через ассистента, а они — вам.",
          "Plan together: give friends tasks through the assistant, and they give you theirs."
        )}
      />

      <div className="space-y-4">
        <GlassCard title={tr("Как дать задачу", "How to give a task")}>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {tr(
              "Напишите ассистенту — друг получит задачу в чате Deyla и в Telegram и сможет принять или отклонить её. Совместная задача («нам с …») после принятия появится в обоих календарях.",
              "Write to the assistant — your friend gets the task in the Deyla chat and in Telegram and can accept or decline it. A shared task (“me and …”) goes to both calendars once accepted."
            )}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FRIEND_EXAMPLES.map((example) => (
              <Link key={example} to={`/assistant?q=${encodeURIComponent(example)}`} className="rounded-full border border-gray-300 dark:border-white/15 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-500/10">
                «{example}»
              </Link>
            ))}
          </div>
        </GlassCard>

        <GlassCard title={tr("Добавить друга", "Add a friend")}>
          <form onSubmit={invite} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label={tr("Email в Deyla", "Email in Deyla")}>
              <input className={INPUT} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="friend@example.com" />
            </Field>
            <Field label={tr("Как вы его зовёте (необязательно)", "What you call them (optional)")}>
              <input className={INPUT} value={nickname} maxLength={100} onChange={(event) => setNickname(event.target.value)} placeholder={tr("Маша", "Masha")} />
            </Field>
            <Button type="submit" variant="primary" icon="plus" busy={pending === "invite"} disabled={!email.trim()}>
              {tr("Пригласить", "Invite")}
            </Button>
          </form>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {tr(
              "Друг должен быть зарегистрирован в Deyla. По имени, которое вы укажете, ассистент поймёт, кому задача.",
              "Your friend needs a Deyla account. The assistant knows whom a task is for by the name you give."
            )}
          </p>
        </GlassCard>

        {data.error && <ErrorNote message={data.error} onRetry={data.reload} />}
        {!data.data && data.loading && <Loading />}

        {incoming.length > 0 && (
          <GlassCard title={tr("Хотят добавить вас", "Want to add you")}>
            <ul className="space-y-2">
              {incoming.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{item.name}</span> <span className="text-xs text-gray-500">{item.email}</span>
                  </span>
                  <Button size="sm" variant="primary" icon="check" busy={pending === `accept-${item.id}`} onClick={async () => (await run(`accept-${item.id}`, () => api.friends.answer(item.id, "accept"))) && data.reload()}>
                    {tr("Принять", "Accept")}
                  </Button>
                  <Button size="sm" variant="ghost" busy={pending === `decline-${item.id}`} onClick={async () => (await run(`decline-${item.id}`, () => api.friends.answer(item.id, "decline"))) && data.reload()}>
                    {tr("Отклонить", "Decline")}
                  </Button>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {data.data && (
          <GlassCard title={tr("Ваши друзья", "Your friends")}>
            {others.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{tr("Пока никого — пригласите друга по email.", "No one yet — invite a friend by email.")}</p>
            ) : (
              <ul className="divide-y divide-gray-200/70 dark:divide-white/10">
                {others.map((item) => (
                  <FriendRow key={item.id} friend={item} onChanged={data.reload} />
                ))}
              </ul>
            )}
          </GlassCard>
        )}

        {data.data && (
          <GlassCard title={tr("Контроль выполнения", "Execution check")}>
            <Switch
              checked={data.data.check_default}
              onChange={setCheck}
              label={tr("Спрашивать друга, начал ли он задачу", "Ask a friend whether they have started a task")}
              hint={tr(
                "В начале задачи со временем Deyla спросит друга, начал ли он, и сообщит вам ответ — или что за 10 минут ответа не было. Для отдельной задачи: «… без контроля» или «… с контролем», либо кнопка под задачей в чате.",
                "When a task with a time starts, Deyla asks your friend whether they have started and tells you — or that there was no answer in 10 minutes. For one task: “… without check” or “… with check”, or the button under the task in the chat."
              )}
            />
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function FriendRow({ friend, onChanged }: { friend: Friend; onChanged: () => void }) {
  const reportError = useErrorToast();
  const { pending, run } = useAction(reportError);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(friend.nickname ?? "");
  const blocked = friend.blocked_until && new Date(friend.blocked_until) > new Date();

  const save = async (body: Parameters<typeof api.friends.update>[1], key: string) => {
    if (await run(key, () => api.friends.update(friend.id, body))) onChanged();
  };

  return (
    <li className="py-3 first:pt-0 last:pb-0 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              className="flex items-center gap-1.5"
              onSubmit={async (event) => {
                event.preventDefault();
                await save({ nickname: name.trim() || null }, "name");
                setEditing(false);
              }}
            >
              <input className={cn(INPUT, "py-1")} autoFocus value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder={friend.own_name ?? ""} />
              <Button size="sm" type="submit" icon="check" busy={pending === "name"} aria-label={tr("Сохранить", "Save")} />
            </form>
          ) : (
            <button type="button" className="text-left" onClick={() => setEditing(true)} title={tr("Переименовать", "Rename")}>
              <span className="font-medium text-gray-900 dark:text-white">{friend.name}</span>
              {friend.own_name && friend.own_name !== friend.name && <span className="text-xs text-gray-500"> · {friend.own_name}</span>}
              {friend.teams?.map((tag) => (
                <span key={tag} className="ml-1.5 text-xs text-sky-700 dark:text-sky-300">
                  @{tag}
                </span>
              ))}
            </button>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{friend.email}</p>
        </div>
        {friend.status === "requested" && <Badge>{tr("ждём ответа", "awaiting reply")}</Badge>}
        {friend.status === "accepted" && !friend.telegram && <Badge>{tr("без Telegram", "no Telegram")}</Badge>}
        <ConfirmButton
          size="sm"
          icon="trash"
          label={friend.status === "requested" ? tr("Отозвать", "Withdraw") : tr("Удалить", "Remove")}
          busy={pending === "remove"}
          onConfirm={async () => {
            if (await run("remove", async () => (await api.friends.remove(friend.id), true))) onChanged();
          }}
        />
      </div>
      {friend.status === "accepted" && (
        <Switch
          checked={friend.auto_accept}
          onChange={(value) => save({ auto_accept: value }, "auto")}
          label={tr("Принимать задачи от этого друга без подтверждения", "Accept this friend's tasks without confirming")}
          hint={tr("Задачи сразу появятся в вашем календаре.", "The tasks go straight to your calendar.")}
        />
      )}
      {blocked && (
        <p className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <Icon name="clock" size={14} />
          {tr("Задачи от друга на паузе до", "Tasks from this friend are paused until")}{" "}
          {new Date(friend.blocked_until!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          <button type="button" className="underline" onClick={() => save({ unblock: true }, "unblock")}>
            {tr("Снять паузу", "Unpause")}
          </button>
        </p>
      )}
    </li>
  );
}
