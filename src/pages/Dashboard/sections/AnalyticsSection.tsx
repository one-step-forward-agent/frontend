// src/pages/Dashboard/sections/AnalyticsSection.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRecommendations, getStats } from "@/api/dayla";
import { fromISODate, WEEKDAYS_SHORT } from "@/utils/dates";
import { useReload } from "../components/useEvents";

const PERIODS = { week: 7, month: 30 } as const;

export const AnalyticsSection: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = React.useState<keyof typeof PERIODS>("week");
  const stats = useReload(() => getStats(PERIODS[period]), [period]);
  const recommendations = useReload(getRecommendations);

  const chart = (stats?.days ?? []).map((day) => {
    const date = fromISODate(day.date);
    return {
      label: period === "week" ? WEEKDAYS_SHORT[(date.getDay() + 6) % 7] : `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}`,
      Выполнено: day.done,
      "Не выполнено": day.total - day.done,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(Object.keys(PERIODS) as (keyof typeof PERIODS)[]).map((p) => (
          <Button key={p} size="sm" variant={period === p ? "default" : "secondary"} onClick={() => setPeriod(p)}>
            {p === "week" ? "Неделя" : "Месяц"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">Выполнено задач</p>
            <p className="text-2xl font-semibold mt-1">{stats ? `${stats.done} из ${stats.total}` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">Доля выполненных</p>
            <p className="text-2xl font-semibold mt-1">{stats ? `${stats.percent}%` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">Сегодня</p>
            <p className="text-2xl font-semibold mt-1">{stats ? `${stats.today.done} из ${stats.today.total}` : "—"}</p>
            {stats && stats.streak >= 2 && <p className="text-xs text-gray-500 mt-1">Серия: {stats.streak} дн. подряд всё выполнено 🔥</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Выполнение по дням</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
                <Tooltip cursor={{ fillOpacity: 0.05 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Выполнено" stackId="tasks" fill="#2563eb" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Не выполнено" stackId="tasks" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {recommendations?.[0] && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{recommendations[0].title}.</span> {recommendations[0].text}
            </p>
            <Button size="sm" variant="secondary" onClick={() => navigate("/dashboard/chat")}>
              Обсудить в чате
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
