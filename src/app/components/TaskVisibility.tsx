import type { TaskVisibility as Visibility } from "../api/types";
import { api } from "../api/client";
import { useAsync } from "../lib/hooks";
import { ErrorNote, Field, Loading } from "./ui";
import { tr } from "@/i18n";

export function TaskVisibility({ value, friendIds, onChange }: {
  value: Visibility;
  friendIds: number[];
  onChange: (value: Visibility, friendIds: number[]) => void;
}) {
  const friends = useAsync(() => value === "selected" ? api.friends.list() : Promise.resolve(null), [value]);
  const accepted = friends.data?.friends.filter(friend => friend.status === "accepted") ?? [];
  return (
    <div className="space-y-2">
      <Field label={tr("Кто видит задачу", "Who can see this task")} hint={tr("Друзья видят название, время, дедлайн и отметку выполнения. Описание и вложения остаются скрытыми.", "Friends see the title, schedule, deadline, and completion. Description and attachments stay private.")}>
        <select aria-label={tr("Кто видит задачу", "Who can see this task")} value={value} onChange={event => onChange(event.target.value as Visibility, event.target.value === "selected" ? friendIds : [])}>
          <option value="private">{tr("Скрыта от друзей", "Hidden from friends")}</option>
          <option value="friends">{tr("Видна всем друзьям", "Visible to all friends")}</option>
          <option value="selected">{tr("Видна выбранным друзьям", "Visible to selected friends")}</option>
        </select>
      </Field>
      {value === "selected" && <fieldset className="space-y-2 rounded-lg border border-gray-300 p-3 dark:border-white/15">
        <legend className="px-1 text-xs">{tr("Выберите друзей", "Select friends")}</legend>
        {friends.loading && <Loading />}
        {friends.error && <ErrorNote message={friends.error} onRetry={friends.reload} />}
        {!friends.loading && !friends.error && accepted.length === 0 && <p className="text-sm text-gray-500">{tr("Сначала добавьте друга и дождитесь принятия приглашения.", "Add a friend and wait for them to accept the invitation first.")}</p>}
        {accepted.map(friend => <label key={friend.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={friendIds.includes(friend.id)} onChange={event => onChange(value, event.target.checked ? [...friendIds, friend.id] : friendIds.filter(id => id !== friend.id))} />
          {friend.name}
        </label>)}
      </fieldset>}
    </div>
  );
}
