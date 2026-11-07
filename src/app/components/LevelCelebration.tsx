import { useEffect, useState } from "react";
import { tr } from "@/i18n";
import { api } from "../api/client";
import { useUser } from "../auth";

// StrictMode remounts effects while the first request is still running. Share the
// response so only the mounted instance displays the server's one-time award.
const checks = new Map<number, Promise<{ level: number | null }>>();

export function LevelCelebration() {
  const user = useUser();
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    if (user.rewards_enabled === false) return;
    let active = true;
    let pending = false;
    let updateTimer: number | undefined;
    const check = async () => {
      if (pending || document.hidden) return;
      pending = true;
      const request = checks.get(user.id) ?? api.rewardCelebration();
      checks.set(user.id, request);
      try {
        const result = await request;
        if (active && result.level !== null) setLevel(result.level);
      } catch { /* Retry on focus or the next poll. */ }
      finally {
        if (checks.get(user.id) === request) checks.delete(user.id);
        pending = false;
      }
    };
    void check();
    const changed = () => {
      window.clearTimeout(updateTimer);
      updateTimer = window.setTimeout(check, 250);
    };
    const timer = window.setInterval(check, 30000);
    window.addEventListener("focus", check);
    window.addEventListener("deyla:progress-changed", changed);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.clearTimeout(updateTimer);
      window.removeEventListener("focus", check);
      window.removeEventListener("deyla:progress-changed", changed);
    };
  }, [user.id, user.rewards_enabled]);
  useEffect(() => {
    if (level === null) return;
    const timer = window.setTimeout(() => setLevel(null), 10000);
    return () => window.clearTimeout(timer);
  }, [level]);
  if (level === null || user.rewards_enabled === false) return null;
  return <div className="fd-level-celebration">
    <div className="fd-level-confetti" aria-hidden="true">{Array.from({ length: 48 }, (_, i) => <i key={i} style={{
      left: `${(i * 37) % 100}%`, backgroundColor: ["#a78bfa", "#34d399", "#fbbf24", "#60a5fa", "#f472b6"][i % 5],
      animationDelay: `${(i % 8) * .12}s`, animationDuration: `${2 + (i % 5) * .3}s`,
    }} />)}</div>
    <div className="fd-level-message bg-white dark:bg-gray-900 border border-violet-300 dark:border-violet-600 shadow-xl rounded-2xl p-5">
      <div role="status" aria-live="polite">
        <p className="text-lg font-semibold">🎉 {tr("Новый уровень", "Level up")} — {level}!</p>
        <p className="text-sm mt-2">{tr("Каждая выполненная задача имеет значение. Вы отлично продвигаетесь!", "Every completed task counts. You're making great progress!")}</p>
      </div>
      <button type="button" className="mt-3 text-sm underline" onClick={() => setLevel(null)}>{tr("Спасибо!", "Thanks!")}</button>
    </div>
  </div>;
}
