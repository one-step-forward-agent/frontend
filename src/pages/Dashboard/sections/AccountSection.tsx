// src/pages/Dashboard/sections/AccountSection.tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/authStore";
import {
  createTelegramLink,
  getReminderSettings,
  getTelegramStatus,
  unlinkTelegram,
  updateReminderSettings,
  type ReminderSettings,
  type TelegramStatus,
} from "@/api/dayla";
import { getErrorMessage } from "@/utils/getErrorMessage";

export const AccountSection: React.FC = () => {
  const { user } = useAuthStore();
  const [telegram, setTelegram] = React.useState<TelegramStatus | null>(null);
  const [settings, setSettings] = React.useState<ReminderSettings | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [linking, setLinking] = React.useState(false);

  const load = React.useCallback(() => {
    getTelegramStatus().then(setTelegram).catch(() => {});
    getReminderSettings().then(setSettings).catch(() => {});
  }, []);

  React.useEffect(load, [load]);

  // После подключения в Telegram вкладка снова становится активной — обновляем статус
  React.useEffect(() => {
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);

  const connect = async () => {
    setLinking(true);
    setError(null);
    try {
      const link = await createTelegramLink();
      if (link.deep_link) window.open(link.deep_link, "_blank", "noopener");
      else setError(`Отправьте боту Dayla команду: /start ${link.code}`);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setLinking(false);
    }
  };

  const disconnect = async () => {
    await unlinkTelegram().catch(() => {});
    load();
  };

  const toggle = async (key: "enabled" | "daily_digest_enabled" | "checkin_enabled", value: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    try {
      setSettings(await updateReminderSettings({ [key]: value }));
    } catch (failure) {
      setSettings(settings);
      setError(getErrorMessage(failure));
    }
  };

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
          <div className="flex items-center justify-between gap-3">
            <span>
              Telegram-бот
              {telegram?.linked && <span className="block text-xs text-gray-500">Подключён{telegram.username ? ` · @${telegram.username}` : ""}</span>}
            </span>
            {telegram?.linked ? (
              <Button variant="outline" size="sm" onClick={disconnect}>Отключить</Button>
            ) : (
              <Button variant="outline" size="sm" onClick={connect} isLoading={linking}>Подключить</Button>
            )}
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Настройки рекомендаций
          </p>
          <Switch
            id="tg-notify"
            checked={!!settings?.enabled}
            onCheckedChange={(value) => toggle("enabled", value)}
            label="Напоминания в Telegram"
            description="Уведомления о задачах и итогах дня"
          />
          <Switch
            id="tg-digest"
            checked={!!settings?.daily_digest_enabled}
            onCheckedChange={(value) => toggle("daily_digest_enabled", value)}
            label="Утренний план"
            description={`План на день в ${settings?.daily_digest_time?.slice(0, 5) ?? "09:00"}`}
          />
          <Switch
            id="tg-checkin"
            checked={!!settings?.checkin_enabled}
            onCheckedChange={(value) => toggle("checkin_enabled", value)}
            label="Проверка в середине дня"
            description={`В ${settings?.checkin_time?.slice(0, 5) ?? "13:00"} спрошу, успеваете ли вы, и предложу перенести часть задач`}
          />
        </CardContent>
      </Card>
    </div>
  );
};
