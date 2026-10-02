// src/pages/Dashboard/sections/TasksSection.tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const TasksSection: React.FC = () => {
  const [tab, setTab] = React.useState<"active" | "archive">("active");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={tab === "active" ? "default" : "secondary"}
          onClick={() => setTab("active")}
        >
          Активные
        </Button>
        <Button
          size="sm"
          variant={tab === "archive" ? "default" : "secondary"}
          onClick={() => setTab("archive")}
        >
          Выполненные и архив
        </Button>
      </div>

      <Card>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tab === "active"
              ? "Единый список активных задач с фильтрами по сферам, статусу, дате, срочности и важности."
              : "История выполненных и архивных задач."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};