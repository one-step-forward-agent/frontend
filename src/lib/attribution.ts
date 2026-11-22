const KEY = "deyla-campaign-attribution-v1";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_group", "utm_content", "utm_term"] as const;
type Touch = Partial<Record<(typeof UTM_KEYS)[number], string>> & { landed_at: string; landing_url: string };
type Attribution = { first_touch: Touch; last_touch: Touch };
let memory: Attribution | null = null;
let captured = "";

export function campaignAttribution(): Attribution | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null") as Attribution | null;
    return value?.first_touch?.landed_at && value.last_touch?.landed_at ? value : memory;
  } catch { return memory; }
}

export function captureCampaign(): void {
  if (captured === window.location.href) return;
  captured = window.location.href;
  const url = new URL(window.location.href);
  const params: Touch = { landed_at: new Date().toISOString(), landing_url: "" };
  const safeQuery = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = url.searchParams.get(key)?.trim().slice(0, key === "utm_term" ? 500 : 200);
    if (value) { params[key] = value; safeQuery.set(key, value); }
  }
  if (!safeQuery.size) return;
  // Advertising URL only: OAuth codes, auth return paths and fragments never enter storage.
  params.landing_url = `${url.origin}${url.pathname}?${safeQuery}`;
  const stored = campaignAttribution();
  memory = { first_touch: stored?.first_touch ?? params, last_touch: params };
  try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch { /* In-memory capture works when storage is blocked. */ }
}

// Capture before the first render or any registration/OAuth action.
captureCampaign();
