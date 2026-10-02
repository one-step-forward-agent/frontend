// src/pages/Dashboard/sections/ChatSection.tsx
import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";

const QUICK_COMMANDS = [
  "Добавь задачу…",
  "Перенеси задачу…",
  "Найди свободное окно…",
  "Проанализируй мой календарь…",
  "Помоги сформулировать цель по SMART…",
];

export const ChatSection: React.FC = () => (
  <div className="max-w-3xl mx-auto space-y-4">
    <Card>
      <CardContent className="h-[60vh] overflow-y-auto">
        <p className="font-medium">Чем помочь?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Напишите или надиктуйте. Любое изменение сначала показывается как предложение.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_COMMANDS.map((c) => (
            <Button key={c} variant="secondary" size="sm">
              {c}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>

    <div className="flex gap-2">
      <Input placeholder="Сообщение ИИ…" aria-label="Сообщение ассистенту" />
      <Button>Отправить</Button>
    </div>
  </div>
);