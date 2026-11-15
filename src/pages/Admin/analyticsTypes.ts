export type AnalyticsDefinition = "combined" | "charts" | "report";
export interface AnalyticsDay {
  date: string;
  extended_dau: number | null; product_dau: number | null; total_actions: number | null;
  new_users: number | null; total_users: number | null; llm_requests: number | null;
  prompt_tokens: number | null; completion_tokens: number | null; cached_tokens: number | null; total_tokens: number | null;
}
export interface AnalyticsModelDay {
  date: string; model: string; requests: number;
  prompt_tokens: number | null; completion_tokens: number | null; cached_tokens: number | null; total_tokens: number | null;
}
export interface AnalyticsResponse {
  start_date: string; end_date: string; timezone: string; definition: AnalyticsDefinition;
  daily: AnalyticsDay[]; model_daily: AnalyticsModelDay[];
  goals: { goal: string; category: string; actions: number; unique_users: number }[];
  goals_daily: { date: string; goal: string; unique_users: number }[];
  purposes: { purpose: string; requests: number }[];
  coverage: { goal: string; source: string | null; timestamp: string | null; status: "available" | "unavailable" | "not_in_definition" | "not_instrumented" }[];
  excluded: string[]; models: string[];
  summary: { active_users: number | null; users_now: number | null; requests_all_time: number | null;
    average_dau: number | null; new_users: number | null; llm_requests: number | null; total_tokens: number | null; total_actions: number | null };
  generated_at: string;
}
export type AnalyticsRow = Record<string, unknown>;
export interface AnalysisResult { columns: string[]; rows: AnalyticsRow[] }
