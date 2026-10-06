const COUNTER_ID = 113480066;

export function reachGoal(goal: string, params?: Record<string, unknown>): void {
  if (typeof window.ym === "function") {
    window.ym(COUNTER_ID, "reachGoal", goal, params);
  }
}

export function hitPage(url: string, title?: string, referer?: string): void {
  if (typeof window.ym === "function") {
    window.ym(COUNTER_ID, "hit", url, { title, referer });
  }
}