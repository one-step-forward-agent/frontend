import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/app/api/client";
import { tr } from "@/i18n";

export interface Sphere {
  id: string;
  name: string;
  color: string;
  priority: number;
}

export interface FirstTask {
  title: string;
  sphereId: string | null;
  reminder: "off" | "10m" | "30m" | "1h" | "1d";
}

export interface OnboardingData {
  purpose: string[];
  spheres: Sphere[];
  toneOfVoice: "neutral" | "supportive" | "motivating" | "strict" | null;
  goals: string[];
  googleConnected: boolean;
  telegramConnected: boolean;
  importedSources: string[];
  firstTask: FirstTask;
  tomorrowPlanned: boolean;
  integrations: string[];
  workDays: string[];
  workHoursFrom: string;
  workHoursTo: string;
  timezone: string;

  perDayWorkHours?: Partial<Record<DayShort, { from: string; to: string }>>;
}

const defaultData: OnboardingData = {
  purpose: [],
  spheres: [],
  toneOfVoice: null,
  goals: [],
  workDays: ["Пн", "Вт", "Ср", "Чт", "Пт"],
  workHoursFrom: "09:00",
  workHoursTo: "18:00",
  timezone:
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow"
      : "Europe/Moscow",
  googleConnected: false,
  telegramConnected: false,
  importedSources: [],
  firstTask: { title: "", sphereId: null, reminder: "off" },
  tomorrowPlanned: false,
  integrations: [],
};

interface OnboardingContextValue {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  patch: (partial: Partial<OnboardingData>) => void;
}

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null);

const STORAGE_KEY = "dayla-onboarding";

function loadStored(): OnboardingData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultData, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function store(data: OnboardingData): OnboardingData {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
  }
  return data;
}

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = React.useState<OnboardingData>(() => loadStored() ?? defaultData);

  // Stored at once, not after the render: the integrations step leaves onboarding right after choosing
  // (to the registration form or to Google), and the choice must survive it.
  const update = React.useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((prev) => store({ ...prev, [key]: value }));
    },
    []
  );

  const patch = React.useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => store({ ...prev, ...partial }));
  }, []);

  return (
    <OnboardingContext.Provider value={{ data, update, patch }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextValue => {
  const ctx = React.useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
};

export type DayShort = "Пн" | "Вт" | "Ср" | "Чт" | "Пт" | "Сб" | "Вс";

const REMINDER_MINUTES: Record<FirstTask["reminder"], number | null> = {
  off: null,
  "10m": 10,
  "30m": 30,
  "1h": 60,
  "1d": 1440,
};

// The default personal calendar is the account's first local one, so it is made before the areas' calendars:
// otherwise every new task would land in the first area's calendar.
const PERSONAL_CALENDAR = "Личный календарь";

/** A calendar for each area picked in onboarding, in priority order; ones that already exist are kept. */
async function createSphereCalendars(spheres: Sphere[], timezone: string): Promise<void> {
  if (spheres.length === 0) return;
  const existing = await api.calendars.list();
  const names = new Set(existing.map((calendar) => calendar.name.trim().toLowerCase()));
  if (!existing.some((calendar) => calendar.provider === "local")) {
    await api.calendars.create({ name: PERSONAL_CALENDAR, timezone });
    names.add(PERSONAL_CALENDAR.toLowerCase());
  }
  const ordered = [...spheres].sort((a, b) => a.priority - b.priority);
  for (const sphere of ordered) {
    const name = sphere.name.trim().slice(0, 100);
    if (!name || names.has(name.toLowerCase())) continue;
    names.add(name.toLowerCase());
    await api.calendars.create({ name, timezone });
  }
}

/** The end of onboarding, once there is an account: save the answers and open the app. */
export const FinishOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const started = React.useRef(false);

  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    void applyOnboarding().finally(() => navigate("/app", { replace: true }));
  }, [navigate]);

  return (
    <div className="flex h-dvh items-center justify-center bg-white dark:bg-gray-950" role="status" aria-label={tr("Готовим ваш календарь", "Preparing your calendar")}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
};

export async function applyOnboarding(): Promise<void> {
  const data = loadStored();
  if (!data) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
  }
  try {
    if (data.timezone) await api.me.update({ timezone: data.timezone });
    // Answers feed the midday check-in and the recommendations (work days and hours, goals, tone)
    await api.me.saveOnboarding({
      purpose: data.purpose,
      spheres: data.spheres,
      toneOfVoice: data.toneOfVoice,
      goals: data.goals,
      workDays: data.workDays,
      workHoursFrom: data.workHoursFrom,
      workHoursTo: data.workHoursTo,
      perDayWorkHours: data.perDayWorkHours ?? {},
      timezone: data.timezone,
      integrations: data.integrations,
    });
    await createSphereCalendars(data.spheres, data.timezone);
    const title = data.firstTask.title.trim();
    if (title) {
      const [hours, minutes] = (data.workHoursFrom || "09:00").split(":").map(Number);
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(hours || 9, minutes || 0, 0, 0);
      await api.events.create({
        title: title.slice(0, 300),
        start_at: start.toISOString(),
        end_at: new Date(start.getTime() + 60 * 60_000).toISOString(),
        timezone: data.timezone,
        reminder_minutes: REMINDER_MINUTES[data.firstTask.reminder] ?? null,
      });
    }
  } catch (error) {
    console.warn("Could not apply onboarding answers", error);
  }
}
