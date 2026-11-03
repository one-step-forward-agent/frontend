// Points, levels and sphere badges: the level bar under the progress on Today and the badges in Account.
// The server counts everything from the ticked tasks (GET /api/rewards); the page only shows it.

import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Rewards } from "../api/types";
import { useAuth, useUser } from "../auth";
import { errorText } from "../lib/format";
import { Button, useErrorToast } from "./ui";
import { Icon } from "./icons";
import { startTour } from "./Tour";
import { cn } from "@/utils/cn";
import { isEn, pluralWord, tr } from "@/i18n";

const points = (count: number) => pluralWord(count, ["очко", "очка", "очков"], ["point", "points"]);

/** The level, the bar to the next one and today's points; the first time it shows, so do the hints about awards */
export function LevelBar({ rewards }: { rewards: Rewards }) {
  useEffect(() => startTour("rewards", true), []);
  const span = rewards.next_level_at - rewards.level_start;
  const percent = span ? Math.round(((rewards.points - rewards.level_start) * 100) / span) : 0;
  const left = rewards.next_level_at - rewards.points;
  return (
    <div className="space-y-1.5" data-tour="level">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1 font-semibold text-violet-700 dark:text-violet-300">
          <Icon name="star" size={13} />
          {tr("Уровень", "Level")} {rewards.level}
        </span>
        {rewards.today_points > 0 && (
          <span className="tabular-nums text-gray-500 dark:text-gray-400">
            +{rewards.today_points} {tr("сегодня", "today")}
          </span>
        )}
      </div>
      <div className="h-1.5 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-violet-500/80 transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
        {tr(`До уровня ${rewards.level + 1} — ${left} ${points(left)}`, `${left} ${points(left)} to level ${rewards.level + 1}`)}
      </p>
    </div>
  );
}

/** The badges of each onboarding sphere: earned, the one in progress with its count, and the later ones */
export function BadgeList({ rewards, onSpheres }: { rewards: Rewards; onSpheres?: () => void }) {
  const spheres = [...new Set(rewards.badges.map((badge) => badge.sphere))];
  if (!spheres.length) return <SpherePicker onSaved={onSpheres} />;
  return (
    <ul className="space-y-3" data-tour="badges">
      {spheres.map((sphere) => {
        const badges = rewards.badges.filter((badge) => badge.sphere === sphere);
        const current = badges.find((badge) => !badge.earned);
        return (
          <li key={sphere} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{sphere}</span>
              {current && (
                <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                  {current.done} / {current.goal}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <span
                  key={badge.goal}
                  title={tr(`${badge.goal} выполненных задач с тегом #${sphere}`, `${badge.goal} done tasks tagged #${sphere}`)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 h-6 rounded-full text-xs font-medium",
                    badge.earned
                      ? "bg-amber-400/20 text-amber-800 dark:text-amber-300"
                      : badge === current
                        ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30"
                        : "bg-gray-200/60 text-gray-400 dark:bg-white/5 dark:text-gray-500"
                  )}
                >
                  <Icon name="award" size={12} />
                  {isEn ? badge.name_en : badge.name}
                </span>
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// The onboarding's presets; colours as in its palette
const SPHERE_PRESETS = [
  tr("Работа", "Work"),
  tr("Учёба", "Study"),
  tr("Спорт", "Sport"),
  tr("Языки", "Languages"),
  tr("Отдых", "Rest"),
  tr("Отношения", "Relationships"),
];
const SPHERE_COLORS = ["#64748b", "#14b8a6", "#f97316", "#8b5cf6", "#f43f5e", "#f59e0b", "#06b6d4", "#ec4899", "#6366f1", "#84cc16"];

/** No spheres yet (onboarding skipped): pick them right here. The server makes a tag of each, as onboarding does */
function SpherePicker({ onSaved }: { onSaved?: () => void }) {
  const user = useUser();
  const { setUser } = useAuth();
  const reportError = useErrorToast();
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (name: string) => setChosen((list) => (list.includes(name) ? list.filter((item) => item !== name) : [...list, name]));

  const save = async () => {
    setBusy(true);
    try {
      const spheres = chosen.map((name, index) => ({
        id: Math.random().toString(36).slice(2, 9),
        name,
        color: SPHERE_COLORS[index % SPHERE_COLORS.length],
        priority: index,
      }));
      setUser(await api.me.saveOnboarding({ ...(user.profile ?? {}), spheres }));
      onSaved?.();
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="muted small">
        {tr(
          "Выберите сферы жизни — для каждой появятся свои значки и тег.",
          "Choose your life areas — each gets its own badges and tag."
        )}
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={tr("Сферы жизни", "Life areas")}>
        {SPHERE_PRESETS.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={chosen.includes(name)}
            className={cn("chip-toggle", chosen.includes(name) && "active")}
            onClick={() => toggle(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <Button size="sm" variant="primary" busy={busy} disabled={!chosen.length} onClick={save}>
        {tr("Выбрать сферы", "Choose areas")}
        {chosen.length > 0 && ` · ${chosen.length}`}
      </Button>
    </div>
  );
}
