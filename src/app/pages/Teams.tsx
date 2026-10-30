// src/app/pages/Teams.tsx
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { AssistantReply, TeamDetail, TeamProject, TeamTask, TeamTaskStatus } from "../api/types";
import { Icon } from "../components/icons";
import { RichText } from "../components/RichText";
import { Badge, Button, ConfirmButton, ErrorNote, Field, Loading, PageHeader, Switch, useErrorToast, useToast } from "../components/ui";
import { formatDate, formatTime } from "../lib/format";
import { useAction, useAsync } from "../lib/hooks";
import { Link, navigate, useLocation, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { GlassCard, GLASS_CHIP } from "@/components/dashboard/glass";
import { tr } from "@/i18n";
import { TaskCard } from "./Assistant";

/**
 * Teams: a list of the user's teams and a form to create one; a team's page with its tasks, projects, members and
 * its own assistant; the page a one-time invitation link opens. The sidebar lists the teams (notifyTeamsChanged).
 */

const PAGE = "relative max-w-4xl mx-auto pt-[1.5vh]";
const INPUT =
  "w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 text-sm text-gray-900 dark:border-white/15 dark:bg-white/5 dark:text-white";
const TEAMS_CHANGED = "deyla:teams";

export function notifyTeamsChanged() {
  window.dispatchEvent(new Event(TEAMS_CHANGED));
}

export function useTeamsChanged(callback: () => void) {
  useEffect(() => {
    window.addEventListener(TEAMS_CHANGED, callback);
    return () => window.removeEventListener(TEAMS_CHANGED, callback);
  }, [callback]);
}

const STATUS_LABELS: Record<TeamTaskStatus, string> = {
  todo: tr("К выполнению", "To do"),
  in_progress: tr("В работе", "In progress"),
  done: tr("Готово", "Done"),
};

const when = (value: string | null) => {
  if (!value) return null;
  const moment = new Date(value);
  const day = formatDate(moment);
  return moment.getHours() === 23 && moment.getMinutes() === 59 ? day : `${day}, ${formatTime(moment)}`;
};

/* ─── The list of teams ─────────────────────────────────── */

export function TeamsPage() {
  useTitle(tr("Команды", "Teams"));
  const teams = useAsync(() => api.teams.list(), []);
  const reportError = useErrorToast();
  const { pending, run } = useAction(reportError);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [myName, setMyName] = useState("");

  const create = async (event: FormEvent) => {
    event.preventDefault();
    const team = await run("create", () => api.teams.create({ name: name.trim(), tag: tag.trim() || undefined, my_name: myName.trim() || undefined }));
    if (!team) return;
    notifyTeamsChanged();
    navigate(`/teams/${team.id}?tab=members`);
  };

  return (
    <div className={PAGE}>
      <PageHeader
        title={tr("Команды", "Teams")}
        subtitle={tr(
          "Общие проекты и задачи с ассистентом команды. Личный ассистент помогает вам, ассистент команды — распределяет работу.",
          "Shared projects and tasks with the team's assistant. Your personal assistant helps you; the team's one shares out the work."
        )}
      />
      <div className="space-y-4">
        {teams.error && <ErrorNote message={teams.error} onRetry={teams.reload} />}
        {!teams.data && teams.loading && <Loading />}
        {teams.data && teams.data.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {teams.data.map((team) => (
              <Link key={team.id} to={`/teams/${team.id}`} className="block">
                <GlassCard title={team.name}>
                  <p className="text-sm text-sky-700 dark:text-sky-300">@{team.tag}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {tr("Участников", "Members")}: {team.members} · {tr("ваших открытых задач", "your open tasks")}: {team.my_open_tasks}
                    {team.role === "admin" && <> · {tr("вы администратор", "you are the admin")}</>}
                  </p>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
        <GlassCard title={tr("Создать команду", "Create a team")}>
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-3 sm:items-end">
            <Field label={tr("Название", "Name")}>
              <input className={INPUT} required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder={tr("Разработка", "Development")} />
            </Field>
            <Field label={tr("Тег (для личного чата)", "Tag (for the personal chat)")} hint={tr("«В команде @Тег поручи …»", "“In the team @Tag assign …”")}>
              <input className={INPUT} maxLength={41} value={tag} onChange={(event) => setTag(event.target.value)} placeholder={`@${(name || tr("Разработка", "Development")).replace(/\s+/g, "_")}`} />
            </Field>
            <Field label={tr("Ваше имя в команде", "Your name in the team")}>
              <input className={INPUT} maxLength={60} value={myName} onChange={(event) => setMyName(event.target.value)} placeholder={tr("Анна", "Anna")} />
            </Field>
            <div className="sm:col-span-3">
              <Button type="submit" variant="primary" icon="plus" busy={pending === "create"} disabled={!name.trim()}>
                {tr("Создать", "Create")}
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

/* ─── A team ────────────────────────────────────────────── */

type Tab = "tasks" | "projects" | "members" | "chat";
const TABS: { id: Tab; label: string }[] = [
  { id: "tasks", label: tr("Задачи", "Tasks") },
  { id: "projects", label: tr("Проекты", "Projects") },
  { id: "chat", label: tr("Чат", "Chat") },
  { id: "members", label: tr("Участники", "Members") },
];

export function TeamPage({ id }: { id: number }) {
  const tab = useLocation().query.get("tab");
  const team = useAsync(() => api.teams.get(id), [id]);
  const current: Tab = TABS.some((item) => item.id === tab) ? (tab as Tab) : "tasks";
  useTitle(team.data?.name ?? tr("Команда", "Team"));

  return (
    <div className={PAGE}>
      <Link to="/teams" className="inline-flex items-center gap-1.5 mb-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
        <Icon name="left" size={14} /> {tr("Команды", "Teams")}
      </Link>
      {team.error && <ErrorNote message={team.error} onRetry={team.reload} />}
      {!team.data && team.loading && <Loading />}
      {team.data && (
        <>
          <PageHeader
            title={team.data.name}
            subtitle={`@${team.data.tag} · ${tr("вы", "you")}: ${team.data.me.name}`}
            actions={
              <div className="flex flex-wrap gap-1.5" role="tablist">
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={current === item.id}
                    onClick={() => navigate(`/teams/${id}?tab=${item.id}`, { replace: true })}
                    className={cn(GLASS_CHIP, current === item.id && "ring-2 ring-sky-400/60")}
                  >
                    <span className="relative">{item.label}</span>
                  </button>
                ))}
              </div>
            }
          />
          {current === "tasks" && <TasksTab team={team.data} />}
          {current === "projects" && <ProjectsTab team={team.data} />}
          {current === "chat" && <TeamChatTab team={team.data} />}
          {current === "members" && <MembersTab team={team.data} onChanged={team.reload} />}
        </>
      )}
    </div>
  );
}

function TasksTab({ team }: { team: TeamDetail }) {
  const tasks = useAsync(() => api.teams.tasks(team.id), [team.id]);
  const projects = useAsync(() => api.teams.projects(team.id), [team.id]);
  const reportError = useErrorToast();
  const { pending, run } = useAction(reportError);
  const [filter, setFilter] = useState<"all" | "mine" | number>("all");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [project, setProject] = useState("");
  const [deadline, setDeadline] = useState("");

  const shown = useMemo(
    () =>
      (tasks.data ?? []).filter((task) =>
        filter === "all" ? true : filter === "mine" ? task.assignee_id === team.me.id : task.assignee_id === filter
      ),
    [tasks.data, filter, team.me.id]
  );
  const open = (tasks.data ?? []).filter((task) => task.status !== "done").length;
  const done = (tasks.data ?? []).length - open;

  const create = async (event: FormEvent) => {
    event.preventDefault();
    const created = await run("create", () =>
      api.teams.createTask(team.id, {
        title: title.trim(),
        assignee_id: assignee ? Number(assignee) : null,
        project_id: project ? Number(project) : null,
        deadline_at: deadline ? new Date(`${deadline}T23:59`).toISOString() : null,
      })
    );
    if (!created) return;
    setTitle("");
    setDeadline("");
    tasks.reload();
  };

  const setStatus = async (task: TeamTask, status: TeamTaskStatus) => {
    if (await run(`status-${task.id}`, () => api.teams.updateTask(team.id, task.id, { status }))) tasks.reload();
  };

  return (
    <div className="space-y-4">
      <GlassCard title={tr("Новая задача", "New task")}>
        <form onSubmit={create} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
          <Field label={tr("Что сделать", "What to do")}>
            <input className={INPUT} required maxLength={300} value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label={tr("Исполнитель", "Performer")}>
            <select className={INPUT} value={assignee} onChange={(event) => setAssignee(event.target.value)}>
              <option value="">{tr("— никто —", "— nobody —")}</option>
              {team.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tr("Проект", "Project")}>
            <select className={INPUT} value={project} onChange={(event) => setProject(event.target.value)}>
              <option value="">—</option>
              {(projects.data ?? []).filter((item) => item.status === "active").map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tr("Срок", "Deadline")}>
            <input className={INPUT} type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </Field>
          <Button type="submit" variant="primary" icon="plus" busy={pending === "create"} disabled={!title.trim()}>
            {tr("Добавить", "Add")}
          </Button>
        </form>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {tr("Или напишите на вкладке «Чат»: «Поставь Ивану задачу подготовить презентацию к пятнице».", "Or write on the Chat tab: “Assign Ivan to prepare the slides by Friday”.")}
        </p>
      </GlassCard>

      <GlassCard
        title={`${tr("Задачи", "Tasks")} · ${open} ${tr("открыто", "open")}, ${done} ${tr("готово", "done")}`}
        actions={
          <select className={cn(INPUT, "w-auto py-1 text-xs")} value={String(filter)} onChange={(event) => setFilter(event.target.value === "all" || event.target.value === "mine" ? event.target.value : Number(event.target.value))}>
            <option value="all">{tr("Все участники", "All members")}</option>
            <option value="mine">{tr("Мои", "Mine")}</option>
            {team.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        }
      >
        {tasks.error && <ErrorNote message={tasks.error} onRetry={tasks.reload} />}
        {!tasks.data && tasks.loading && <Loading />}
        {tasks.data && shown.length === 0 && <p className="text-sm text-gray-500">{tr("Задач нет.", "No tasks.")}</p>}
        <ul className="divide-y divide-gray-200/70 dark:divide-white/10">
          {shown.map((task) => (
            <li key={task.id} className="py-2.5 flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium text-gray-900 dark:text-white", task.status === "done" && "line-through opacity-60")}>{task.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {task.assignee ?? tr("без исполнителя", "no performer")}
                  {task.project && <> · {task.project}</>}
                  {task.deadline_at && (
                    <span className={cn(task.overdue && "text-rose-600 dark:text-rose-400 font-medium")}>
                      {" "}
                      · {task.overdue ? tr("просрочена", "overdue") : tr("срок", "due")} {when(task.deadline_at)}
                    </span>
                  )}
                  {task.confirm === "pending" && <> · {tr("ждёт подтверждения", "awaiting confirmation")}</>}
                  {task.confirm === "rejected" && <span className="text-rose-600"> · {tr("отклонена", "declined")}</span>}
                </p>
              </div>
              <select
                className={cn(INPUT, "w-auto py-1 text-xs")}
                value={task.status}
                disabled={pending === `status-${task.id}`}
                onChange={(event) => setStatus(task, event.target.value as TeamTaskStatus)}
                aria-label={tr("Статус", "Status")}
              >
                {(Object.keys(STATUS_LABELS) as TeamTaskStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <ConfirmButton size="sm" icon="trash" onConfirm={async () => (await run(`remove-${task.id}`, async () => (await api.teams.removeTask(team.id, task.id), true))) && tasks.reload()} />
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

function ProjectsTab({ team }: { team: TeamDetail }) {
  const projects = useAsync(() => api.teams.projects(team.id), [team.id]);
  const reportError = useErrorToast();
  const { pending, run } = useAction(reportError);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<TeamProject | null>(null);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const body = { name: name.trim(), description: description.trim() || null };
    if (await run("save", () => api.teams.saveProject(team.id, body, editing?.id))) {
      setName("");
      setDescription("");
      setEditing(null);
      projects.reload();
    }
  };

  return (
    <div className="space-y-4">
      {projects.error && <ErrorNote message={projects.error} onRetry={projects.reload} />}
      {!projects.data && projects.loading && <Loading />}
      {projects.data?.map((project) => (
        <GlassCard
          key={project.id}
          title={project.name}
          actions={
            <span className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => (setEditing(project), setName(project.name), setDescription(project.description ?? ""))}>
                {tr("Изменить", "Edit")}
              </Button>
              <Button size="sm" variant="ghost" onClick={async () => (await run(`archive-${project.id}`, () => api.teams.saveProject(team.id, { status: project.status === "active" ? "archived" : "active" }, project.id))) && projects.reload()}>
                {project.status === "active" ? tr("В архив", "Archive") : tr("Вернуть", "Restore")}
              </Button>
            </span>
          }
        >
          {project.description && <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 whitespace-pre-wrap">{project.description}</p>}
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-gray-500/15 overflow-hidden" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${project.progress}%` }} />
            </div>
            <span className="text-xs tabular-nums text-gray-600 dark:text-gray-300">
              {project.done}/{project.tasks} · {project.progress}%
            </span>
            {project.status === "archived" && <Badge>{tr("архив", "archived")}</Badge>}
          </div>
        </GlassCard>
      ))}
      <GlassCard title={editing ? tr(`Проект «${editing.name}»`, `Project “${editing.name}”`) : tr("Новый проект", "New project")}>
        <form onSubmit={save} className="space-y-3">
          <Field label={tr("Название", "Name")}>
            <input className={INPUT} required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label={tr("Описание", "Description")}>
            <textarea className={INPUT} rows={3} maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" busy={pending === "save"} disabled={!name.trim()}>
              {editing ? tr("Сохранить", "Save") : tr("Создать проект", "Create project")}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={() => (setEditing(null), setName(""), setDescription(""))}>
                {tr("Отмена", "Cancel")}
              </Button>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function MembersTab({ team, onChanged }: { team: TeamDetail; onChanged: () => void }) {
  const admin = team.me.role === "admin";
  const invites = useAsync(() => (admin ? api.teams.invites(team.id) : Promise.resolve([])), [team.id, admin]);
  const reportError = useErrorToast();
  const toast = useToast();
  const { pending, run } = useAction(reportError);
  const [note, setNote] = useState("");
  const [myName, setMyName] = useState(team.me.name);

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    const link = await run("invite", () => api.teams.invite(team.id, note.trim()));
    if (!link) return;
    setNote("");
    invites.reload();
    const url = link.url.startsWith("http") ? link.url : `${window.location.origin}${link.url}`;
    try {
      await navigator.clipboard.writeText(url);
      toast(tr("Ссылка скопирована — она для одного человека и действует 24 часа", "Link copied — it is for one person and works for 24 hours"));
    } catch {
      toast(tr("Ссылка готова — скопируйте её из списка", "The link is ready — copy it from the list"));
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard title={`${tr("Участники", "Members")} · ${team.members.length}`}>
        <ul className="divide-y divide-gray-200/70 dark:divide-white/10">
          {team.members.map((member) => (
            <li key={member.id} className="py-2.5 flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
              {member.me && <Badge>{tr("вы", "you")}</Badge>}
              {member.role === "admin" && <Badge tone="accent">{tr("админ", "admin")}</Badge>}
              {/* The other teams you share with them */}
              {member.tags.map((tag) => (
                <span key={tag} className="text-xs text-sky-700 dark:text-sky-300">
                  @{tag}
                </span>
              ))}
              <span className="ml-auto flex gap-1.5">
                {admin && !member.me && (
                  <Button size="sm" variant="ghost" busy={pending === `role-${member.id}`} onClick={async () => (await run(`role-${member.id}`, () => api.teams.updateMember(team.id, member.id, { role: member.role === "admin" ? "member" : "admin" }))) && onChanged()}>
                    {member.role === "admin" ? tr("Снять админа", "Remove admin") : tr("Сделать админом", "Make admin")}
                  </Button>
                )}
                {(admin || member.me) && (
                  <ConfirmButton
                    size="sm"
                    icon="trash"
                    label={member.me ? tr("Выйти", "Leave") : tr("Удалить", "Remove")}
                    onConfirm={async () => {
                      if (!(await run(`remove-${member.id}`, async () => (await api.teams.removeMember(team.id, member.id), true)))) return;
                      notifyTeamsChanged();
                      if (member.me) navigate("/teams");
                      else onChanged();
                    }}
                  />
                )}
              </span>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex items-end gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            if (await run("name", () => api.teams.updateMember(team.id, team.me.id, { name: myName.trim() }))) onChanged();
          }}
        >
          <Field label={tr("Ваше имя в этой команде", "Your name in this team")} className="flex-1">
            <input className={INPUT} minLength={2} maxLength={60} value={myName} onChange={(event) => setMyName(event.target.value)} />
          </Field>
          <Button type="submit" busy={pending === "name"} disabled={myName.trim() === team.me.name || myName.trim().length < 2}>
            {tr("Сохранить", "Save")}
          </Button>
        </form>
      </GlassCard>

      {admin && (
        <GlassCard title={tr("Пригласить по ссылке", "Invite by link")}>
          <form onSubmit={invite} className="flex flex-wrap items-end gap-2">
            <Field label={tr("Для кого (заметка, необязательно)", "For whom (a note, optional)")} className="flex-1 min-w-[12rem]">
              <input className={INPUT} maxLength={100} value={note} onChange={(event) => setNote(event.target.value)} placeholder={tr("Иван из маркетинга", "Ivan from marketing")} />
            </Field>
            <Button type="submit" variant="primary" icon="plus" busy={pending === "invite"}>
              {tr("Создать ссылку", "Create a link")}
            </Button>
          </form>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {tr("Каждая ссылка — для одного человека и действует 24 часа. При вступлении участник сам выбирает имя в команде.", "Each link is for one person and works for 24 hours. A member chooses their own name in the team when joining.")}
          </p>
          {invites.data && invites.data.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {invites.data.map((item) => {
                const url = item.url.startsWith("http") ? item.url : `${window.location.origin}${item.url}`;
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge tone={item.state === "active" ? "ok" : undefined}>
                      {{ active: tr("действует", "active"), used: tr("использована", "used"), expired: tr("истекла", "expired"), revoked: tr("отозвана", "revoked") }[item.state]}
                    </Badge>
                    {item.note && <span className="font-medium">{item.note}</span>}
                    {item.state === "active" && (
                      <>
                        <code className="truncate max-w-[18rem] text-gray-600 dark:text-gray-300">{url}</code>
                        <button type="button" className="underline" onClick={() => navigator.clipboard.writeText(url).then(() => toast(tr("Скопировано", "Copied")))}>
                          {tr("Копировать", "Copy")}
                        </button>
                        <span className="text-gray-500">{tr("до", "until")} {when(item.expires_at)}</span>
                        <button type="button" className="underline text-rose-600" onClick={async () => (await run(`revoke-${item.id}`, async () => (await api.teams.revokeInvite(team.id, item.id), true))) && invites.reload()}>
                          {tr("Отозвать", "Revoke")}
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      )}

      {admin && (
        <GlassCard title={tr("Настройки задач", "Task settings")}>
          <div className="space-y-4">
            <Switch
              checked={team.task_confirm === "required"}
              onChange={async (value) => (await run("confirm", () => api.teams.update(team.id, { task_confirm: value ? "required" : "auto" }))) && onChanged()}
              label={tr("Исполнитель подтверждает задачу", "The performer confirms a task")}
              hint={tr("Выключено — задача сразу появляется у исполнителя, без подтверждения.", "Off — a task goes straight to the performer, without confirming.")}
            />
            <Switch
              checked={team.check_default}
              onChange={async (value) => (await run("check", () => api.teams.update(team.id, { check_default: value }))) && onChanged()}
              label={tr("Контроль выполнения по умолчанию", "Execution check by default")}
              hint={tr(
                "В начале задачи Deyla спросит исполнителя, начал ли он, и сообщит поставившему задачу. Для одной задачи: «… без контроля» / «… с контролем» или кнопка под задачей.",
                "At a task's start Deyla asks the performer whether they've begun and tells whoever set it. For one task: “… without check” / “… with check” or the button under the task."
              )}
            />
          </div>
          <div className="mt-4">
            <ConfirmButton
              icon="trash"
              label={tr("Удалить команду", "Delete the team")}
              onConfirm={async () => {
                if (await run("delete", async () => (await api.teams.remove(team.id), true))) {
                  notifyTeamsChanged();
                  navigate("/teams");
                }
              }}
            />
          </div>
        </GlassCard>
      )}
    </div>
  );
}

/* ─── The team's assistant: each member talks to it on their own ─── */

type ChatItem = { id: number; role: "user" | "assistant" | "error"; text: string; reply?: AssistantReply | null };
let chatId = 0;

function TeamChatTab({ team }: { team: TeamDetail }) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    api.teams
      .chat(team.id)
      .then((history) => active && setItems(history.map((item) => ({ id: ++chatId, role: item.role, text: item.text, reply: item.reply }))))
      .catch(() => undefined)
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [team.id]);

  useLayoutEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [items, busy, loaded]);

  const send = async (input: string) => {
    const value = input.trim();
    if (!value || busy) return;
    setText("");
    setItems((current) => [...current, { id: ++chatId, role: "user", text: value }]);
    setBusy(true);
    try {
      const reply = await api.teams.send(team.id, value);
      setItems((current) => [...current, { id: ++chatId, role: "assistant", text: reply.kind === "answer" ? reply.text : "", reply }]);
    } catch (error) {
      setItems((current) => [...current, { id: ++chatId, role: "error", text: error instanceof Error ? error.message : tr("Не получилось", "Didn't work") }]);
    } finally {
      setBusy(false);
    }
  };

  const replace = (id: number, reply: AssistantReply) => setItems((current) => current.map((item) => (item.id === id ? { ...item, reply } : item)));
  const lastAssistant = [...items].reverse().find((item) => item.role === "assistant")?.id;
  const examples = [
    tr("Поставь задачу подготовить презентацию к пятнице", "Set a task to prepare the slides by Friday"),
    tr("Кто сколько загружен?", "Who is busy?"),
    tr("Что просрочено?", "What is overdue?"),
    tr("Отчёт о прогрессе", "Progress report"),
    tr("Предложи перераспределение", "Suggest a reallocation"),
  ];

  return (
    <GlassCard title={tr(`Ассистент команды @${team.tag}`, `Assistant of the team @${team.tag}`)}>
      <div ref={listRef} className="max-h-[55vh] min-h-[16rem] overflow-y-auto space-y-3 pr-1">
        {loaded && items.length === 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p>{tr("Я работаю с задачами и проектами команды. Попробуйте:", "I work with the team's tasks and projects. Try:")}</p>
            <div className="flex flex-wrap gap-1.5">
              {examples.map((example) => (
                <button key={example} type="button" className={GLASS_CHIP} onClick={() => send(example)}>
                  <span className="relative">{example}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {items.map((item) =>
          item.role === "user" ? (
            <div key={item.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-sky-500/15 px-3.5 py-2 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{item.text}</p>
            </div>
          ) : item.role === "error" ? (
            <p key={item.id} className="text-sm text-rose-600" role="alert">
              {item.text}
            </p>
          ) : (
            <div key={item.id} className="max-w-[92%] rounded-2xl rounded-bl-sm bg-gray-500/[0.06] dark:bg-white/[0.04] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white space-y-2">
              {item.reply && item.reply.kind === "team_task" ? (
                <TaskCard reply={item.reply} onReply={(next) => replace(item.id, next)} />
              ) : (
                <RichText text={item.reply && "text" in item.reply && typeof item.reply.text === "string" ? item.reply.text : item.text} />
              )}
              {item.id === lastAssistant && item.reply?.replies && item.reply.replies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.reply.replies.map((option) => (
                    <button key={option} type="button" className={GLASS_CHIP} onClick={() => send(option)}>
                      <span className="relative">{option}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}
        {busy && <p className="text-sm text-gray-500">{tr("Думаю…", "Thinking…")}</p>}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
      >
        <input
          className={INPUT}
          value={text}
          maxLength={4000}
          onChange={(event) => setText(event.target.value)}
          placeholder={tr("Поставь Ивану задачу подготовить презентацию к пятнице", "Assign Ivan to prepare the slides by Friday")}
          aria-label={tr("Сообщение ассистенту команды", "Message to the team's assistant")}
        />
        <Button type="submit" variant="primary" icon="send" busy={busy} disabled={!text.trim()} aria-label={tr("Отправить", "Send")} />
      </form>
    </GlassCard>
  );
}

/* ─── Joining by a link ─────────────────────────────────── */

export function JoinTeamPage({ token }: { token: string }) {
  useTitle(tr("Вступить в команду", "Join a team"));
  const info = useAsync(() => api.teams.inviteInfo(token), [token]);
  const reportError = useErrorToast();
  const { pending, run } = useAction(reportError);
  const [name, setName] = useState("");
  useEffect(() => {
    if (info.data && !name) setName(info.data.suggested_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.data]);

  return (
    <div className="relative max-w-md mx-auto pt-[8vh]">
      {info.error && <ErrorNote message={info.error} />}
      {!info.data && info.loading && <Loading />}
      {info.data && (
        <GlassCard title={tr(`Команда «${info.data.team.name}»`, `The team “${info.data.team.name}”`)}>
          <p className="text-sm text-sky-700 dark:text-sky-300 mb-3">@{info.data.team.tag}</p>
          {info.data.already_member ? (
            <Link to={`/teams/${info.data.team.id}`}>{tr("Вы уже в этой команде — открыть", "You are already in this team — open it")}</Link>
          ) : (
            <form
              className="space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const team = await run("join", () => api.teams.join(token, name.trim()));
                if (team) {
                  notifyTeamsChanged();
                  navigate(`/teams/${team.id}?tab=chat`);
                }
              }}
            >
              <Field label={tr("Ваше имя в команде", "Your name in the team")} hint={tr("Должно отличаться от имён других участников: по нему вам будут ставить задачи.", "It must differ from the other members' names: tasks are given to you by it.")}>
                <input className={INPUT} required minLength={2} maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />
              </Field>
              <Button type="submit" variant="primary" busy={pending === "join"} disabled={name.trim().length < 2}>
                {tr("Вступить", "Join")}
              </Button>
            </form>
          )}
        </GlassCard>
      )}
    </div>
  );
}
