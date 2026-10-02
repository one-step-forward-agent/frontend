// src/pages/Dashboard/sections/TodaySection.tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const TodaySection: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Расписание
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Здесь появятся задачи выбранного дня с временем, линия текущего времени и чекбоксы
            выполнения.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Без времени
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Список задач без конкретного слота. Именно отсюда ИИ предлагает задачи для
            найденных свободных окон.
          </p>
        </CardContent>
      </Card>
    </div>

    <aside className="space-y-4">
      <Card>
        <CardContent>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Рекомендации ИИ
          </h2>
          <div className="space-y-2">
            <Badge variant="default">Найдено свободное окно</Badge>
            <Badge variant="warning">Плотный день</Badge>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Максимум 2 рекомендации. Под ними — кнопка «Обсудить с ИИ».
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            Мой прогресс
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Вечером здесь появятся итоги дня: выполнено / перенесено / не выполнено.
          </p>
        </CardContent>
      </Card>
    </aside>
  </div>
);