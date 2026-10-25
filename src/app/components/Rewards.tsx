// Points, levels and sphere badges: the level bar under the progress on Today and the badges in Account.
// The server counts everything from the ticked tasks (GET /api/rewards); the page only shows it.

import { useEffect } from "react";
import type { Rewards } from "../api/types";
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
export function BadgeList({ rewards }: { rewards: Rewards }) {
  const spheres = [...new Set(rewards.badges.map((badge) => badge.sphere))];
  if (!spheres.length) {
    return (
      <p className="muted small">
        {tr("Выберите сферы жизни в онбординге — для каждой появятся свои значки.", "Choose your life areas in onboarding — each gets its own badges.")}
      </p>
    );
  }
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
