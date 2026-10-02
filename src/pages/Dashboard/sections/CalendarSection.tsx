// src/pages/Dashboard/sections/CalendarSection.tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const CalendarSection: React.FC = () => {
  const [view, setView] = React.useState<"day" | "week" | "month">("week");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["day", "week", "month"] as const).map((v) => (
          <Button
            key={v}
            size="sm"
            variant={view === v ? "default" : "secondary"}
            onClick={() => setView(v)}
          >
            {v === "day" ? "День" : v === "week" ? "Неделя" : "Месяц"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Здесь — временная сетка ({view}), задачи продукта и внешние события Google Calendar,
            drag-and-drop, фильтр по сферам. Значок ✦ рядом с рекомендацией откроет чат с
            контекстом текущего периода.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};