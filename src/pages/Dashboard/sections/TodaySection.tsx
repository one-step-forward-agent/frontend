// src/pages/Dashboard/sections/TodaySection.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecommendations, getStats } from "@/api/dayla";
import { useTasksStore } from "@/store/tasksStore";
import { addDays, formatTime, fromISODate, relativeDay, startOfDay, toISODate, WEEKDAYS_SHORT } from "@/utils/dates";
import { TaskItem } from "../components/TaskItem";
import { useEvents, useReload } from "../components/useEvents";

const BADGE = { info: "default", warning: "warning", success: "success" } as const;

const useNow = () => {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
};

export const TodaySection: React.FC = () => {
  const navigate = useNavigate();
  const openNew = useTasksStore((state) => state.openNew);
  const now = useNow();
  const today = startOfDay(now);
  const { events, loading, error } = useEvents(addDays(today, -14), addDays(today, 1));
  const stats = useReload(() => getStats(7));
  const recommendations = useReload(getRecommendations);

  const todayIso = toISODate(today);
  const todays = events.filter((event) => toISODate(new Date(event.start_at)) === todayIso);
  const timed = todays.filter((event) => !event.all_day).sort((a, b) => a.start_at.localeCompare(b.start_at));
  const untimed = todays.filter((event) => event.all_day);
  // Невыполненные задачи без времени с прошлых дней — тоже здесь, чтобы не потерялись
  const overdue = events.filter((event) => event.all_day && !event.completed_at && toISODate(new Date(event.start_at)) < todayIso);
  const nowIndex = timed.findIndex((event) => new Date(event.start_at) > now);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Расписание</h2>
              <Button variant="ghost" size="sm" onClick={() => openNew(todayIso)}>
                <Plus size={15} className="mr-1" /> Добавить
              </Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && timed.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">На сегодня нет задач со временем.</p>
            )}
            <div className="space-y-0.5">
              {timed.map((event, index) => (
                <React.Fragment key={event.id}>
                  {index === nowIndex && <NowLine now={now} />}
                  <TaskItem event={event} />
                </React.Fragment>
              ))}
              {timed.length > 0 && nowIndex === -1 && <NowLine now={now} />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Без времени</h2>
              <Button variant="ghost" size="sm" onClick={() => openNew(todayIso, true)}>
                <Plus size={15} className="mr-1" /> Задача
              </Button>
            </div>
            {!loading && untimed.length === 0 && overdue.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Задач без конкретного времени на сегодня нет.</p>
            )}
            <div className="space-y-0.5">
              {overdue.map((event) => (
                <TaskItem key={event.id} event={event} overdue meta={`Просрочено · ${relativeDay(new Date(event.start_at), now)}`} showMoveTomorrow />
              ))}
              {untimed.map((event) => (
                <TaskItem key={event.id} event={event} showMoveTomorrow />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardContent>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Рекомендации ИИ</h2>
            {!recommendations && <p className="text-sm text-gray-500 dark:text-gray-400">Анализирую ваш день…</p>}
            <div className="space-y-3">
              {recommendations?.slice(0, 2).map((item) => (
                <div key={item.title} className="space-y-1">
                  <Badge variant={BADGE[item.kind] ?? "default"}>{item.title}</Badge>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => navigate("/dashboard/chat")}>
              <MessageCircle size={15} className="mr-1.5" /> Обсудить с ИИ
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Мой прогресс</h2>
            {stats && (
              <>
                <p className="text-2xl font-semibold">
                  {stats.today.done} <span className="text-base font-normal text-gray-500">из {stats.today.total}</span>
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all" style={{ width: `${stats.today.percent}%` }} />
                </div>
                <div className="mt-4 flex items-end justify-between gap-1.5" aria-label="Выполнение за 7 дней">
                  {stats.days.map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1" title={`${day.done} из ${day.total}`}>
                      <div className="w-full h-12 flex items-end rounded bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div className="w-full bg-blue-500/80" style={{ height: `${day.total ? Math.max(day.percent, 6) : 0}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-500">{WEEKDAYS_SHORT[(fromISODate(day.date).getDay() + 6) % 7]}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  За неделю выполнено {stats.done} из {stats.total}
                  {stats.streak >= 2 ? ` · серия ${stats.streak} дн. 🔥` : ""}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
};

const NowLine: React.FC<{ now: Date }> = ({ now }) => (
  <div className="flex items-center gap-2 py-1" aria-label="Текущее время">
    <span className="text-[11px] font-medium tabular-nums text-red-500">{formatTime(now)}</span>
    <span className="h-px flex-1 bg-red-400/70" />
  </div>
);
