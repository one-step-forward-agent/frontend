import { useState } from "react";
import { api } from "../api/client";
import type { TeamDetail, TeamTask, TaskReassignment as Request } from "../api/types";
import { useAction } from "../lib/hooks";
import { Button, Field, useErrorToast } from "./ui";
import { tr } from "@/i18n";

export function TaskReassignment({ team, task, requests, onChanged }: { team: TeamDetail; task: TeamTask; requests: Request[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [proposed, setProposed] = useState("");
  const { pending, run } = useAction(useErrorToast());
  const request = requests.find(item => item.task_id === task.id);
  const admin = team.me.role === "admin";
  const canTransfer = admin || task.assignee_id === team.me.id;
  const candidates = team.members.filter(member => member.id !== task.assignee_id && (canTransfer || member.id === team.me.id));
  const send = async (force: boolean) => {
    const id = canTransfer ? Number(proposed) : team.me.id;
    if (!id) return;
    if (await run("send", () => api.teams.reassign(team.id, task.id, id, force))) { setOpen(false); setProposed(""); onChanged(); }
  };
  const respond = async (action: "accept" | "reject" | "cancel") => {
    if (request && await run(action, () => api.teams.respondReassignment(team.id, request.id, action))) onChanged();
  };
  if (task.status === "done") return null;
  return <div className="mt-2 space-y-2">
    {request && <div className="rounded-lg border border-amber-300/40 bg-amber-500/5 p-3 text-sm" role="status">
      <p>{tr(`${request.requester} предлагает назначить исполнителем: ${request.proposed}`, `${request.requester} proposes assigning this task to ${request.proposed}`)}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {request.can_respond && <><Button size="sm" variant="primary" busy={pending === "accept"} disabled={!!pending} onClick={() => respond("accept")}>{tr("Подтвердить смену", "Confirm reassignment")}</Button><Button size="sm" busy={pending === "reject"} disabled={!!pending} onClick={() => respond("reject")}>{tr("Отклонить", "Decline")}</Button></>}
        {request.can_cancel && <Button size="sm" disabled={!!pending} onClick={() => respond("cancel")}>{tr("Отменить запрос", "Cancel request")}</Button>}
      </div>
    </div>}
    {candidates.length > 0 && (!request || admin) && <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>{canTransfer ? tr("Сменить исполнителя", "Change performer") : tr("Предложить свою помощь", "Offer to take this task")}</Button>}
    {open && <div className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-white/10">
      {canTransfer && <Field label={tr("Новый исполнитель", "New performer")}><select value={proposed} onChange={event => setProposed(event.target.value)}><option value="">{tr("Выберите участника", "Choose a member")}</option>{candidates.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></Field>}
      <p className="text-xs text-gray-500">{canTransfer ? tr("Запрос передачи ждёт согласия нового исполнителя.", "A transfer request waits for the new performer's approval.") : tr("Текущий исполнитель подтвердит передачу вам. Если задача свободна, подтвердит администратор.", "The current performer approves handing the task to you. An admin approves unassigned tasks.")}</p>
      <div className="flex flex-wrap gap-2">
        {!request && <Button size="sm" disabled={!!pending || (canTransfer && !proposed)} busy={pending === "send"} onClick={() => send(false)}>{tr("Отправить запрос", "Send request")}</Button>}
        {admin && <Button size="sm" variant="primary" disabled={!!pending || !proposed} busy={pending === "send"} onClick={() => send(true)}>{tr("Назначить без подтверждения", "Assign without confirmation")}</Button>}
      </div>
    </div>}
  </div>;
}
