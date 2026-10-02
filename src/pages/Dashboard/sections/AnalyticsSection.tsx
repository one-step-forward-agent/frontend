// src/pages/Dashboard/sections/AnalyticsSection.tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const AnalyticsSection: React.FC = () => {
  const [period, setPeriod] = React.useState<"week" | "month" | "custom">("week");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["week", "month", "custom"] as const).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "default" : "secondary"}
            onClick={() => setPeriod(p)}
          >
            {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Период"}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">Задач по сферам</p>
            <p className="text-2xl font-semibold mt-1">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">Доля выполненных</p>
            <p className="text-2xl font-semibold mt-1">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">Переносы</p>
            <p className="text-2xl font-semibold mt-1">—</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Внизу — одна нейтральная рекомендация с переходом в чат.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};