import * as React from "react";
import { listEvents, type DaylaEvent } from "@/api/dayla";
import { useTasksStore } from "@/store/tasksStore";
import { getErrorMessage } from "@/utils/getErrorMessage";

/** Задачи в диапазоне [start, end); перезагружаются после любых изменений задач. */
export const useEvents = (start: Date, end: Date) => {
  const version = useTasksStore((state) => state.version);
  const [events, setEvents] = React.useState<DaylaEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const from = start.getTime();
  const to = end.getTime();

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    listEvents(new Date(from), new Date(to))
      .then((items) => {
        if (!active) return;
        // Бэкенд отдаёт пересекающиеся события; оставляем начинающиеся в диапазоне
        setEvents(items.filter((item) => new Date(item.start_at).getTime() >= from && new Date(item.start_at).getTime() < to));
        setError(null);
      })
      .catch((failure) => active && setError(getErrorMessage(failure, "Не удалось загрузить задачи")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [from, to, version]);

  return { events, loading, error };
};

/** Перезагружает асинхронные данные после изменений задач. */
export const useReload = <T,>(load: () => Promise<T>, deps: React.DependencyList = []) => {
  const version = useTasksStore((state) => state.version);
  const [data, setData] = React.useState<T | null>(null);
  React.useEffect(() => {
    let active = true;
    load().then((value) => active && setData(value)).catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);
  return data;
};
