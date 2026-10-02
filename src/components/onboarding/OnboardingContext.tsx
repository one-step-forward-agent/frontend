// src/onboarding/OnboardingContext.tsx
import * as React from "react";

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
  workDays: string[];
  workHoursFrom: string;
  workHoursTo: string;
  timezone: string;
  googleConnected: boolean;
  telegramConnected: boolean;
  importedSources: string[];
  firstTask: FirstTask;
  tomorrowPlanned: boolean;
  integrations: string[];        // ← добавить
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

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = React.useState<OnboardingData>(defaultData);

  const update = React.useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const patch = React.useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
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