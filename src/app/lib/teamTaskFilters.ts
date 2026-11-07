import type { TeamTask } from "../api/types";

export interface TeamTaskFilters {
  status: string;
  project: string;
  deadline: string;
  from: string;
  to: string;
  confirmation: string;
  search: string;
}

export const EMPTY_TEAM_FILTERS: TeamTaskFilters = { status: "all", project: "all", deadline: "all", from: "", to: "", confirmation: "all", search: "" };

export function filterTeamTasks(tasks: TeamTask[], filters: TeamTaskFilters, now = new Date(), timezone = "UTC"): TeamTask[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const last = new Date(`${today}T12:00:00Z`);
  last.setUTCDate(last.getUTCDate() + 6);
  const weekEnd = last.toISOString().slice(0, 10);
  const search = filters.search.trim().toLocaleLowerCase();
  return tasks.filter(task => {
    const due = task.deadline_at?.slice(0, 10);
    return (filters.status === "all" || task.status === filters.status)
      && (filters.project === "all" || (filters.project === "none" ? !task.project_id : task.project_id === Number(filters.project)))
      && (filters.confirmation === "all" || task.confirm === filters.confirmation)
      && (!search || task.title.toLocaleLowerCase().includes(search))
      && (filters.deadline === "all"
        || (filters.deadline === "overdue" && task.status !== "done" && !!task.deadline_at && new Date(task.deadline_at) < now)
        || (filters.deadline === "today" && due === today)
        || (filters.deadline === "week" && !!due && due >= today && due <= weekEnd)
        || (filters.deadline === "none" && !due))
      && (!filters.from || (!!due && due >= filters.from))
      && (!filters.to || (!!due && due <= filters.to));
  });
}
