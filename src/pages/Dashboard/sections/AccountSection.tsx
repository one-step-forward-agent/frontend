// src/pages/Dashboard/sections/AccountSection.tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/authStore";

export const AccountSection: React.FC = () => {
  const { user } = useAuthStore();
  const [tgEnabled, setTgEnabled] = React.useState(false);

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Аккаунт</p>
          <p className="font-medium">{user?.name || "Без имени"}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Подключения</p>
          <div className="flex items-center justify-between">
            <span>Google Calendar</span>
            <Button variant="outline" size="sm">Подключить</Button>
          </div>
          <div className="flex items-center justify-between">
            <span>Telegram-бот</span>
            <Button variant="outline" size="sm">Подключить</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Настройки рекомендаций
          </p>
          <Switch
            id="tg-notify"
            checked={tgEnabled}
            onCheckedChange={setTgEnabled}
            label="Напоминания в Telegram"
            description="Уведомления о задачах и итогах дня"
          />
        </CardContent>
      </Card>
    </div>
  );
};