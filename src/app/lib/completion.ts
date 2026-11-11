export type CompletionTarget = { path: string; title: string };
export const COMPLETION_REPORT = "deyla:completion-report";
export const COMPLETION_SAVED = "deyla:completion-report-saved";

export function offerCompletionReport(target: CompletionTarget) {
  window.dispatchEvent(new CustomEvent(COMPLETION_REPORT, { detail: target }));
}

export const eventReportTarget = (id: number, title: string): CompletionTarget => ({ path: `/api/events/${id}/completion-report`, title });
export const teamReportTarget = (teamId: number, taskId: number, title: string): CompletionTarget => ({ path: `/api/teams/${teamId}/tasks/${taskId}/completion-report`, title });
