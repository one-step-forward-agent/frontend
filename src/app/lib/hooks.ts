import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { api } from "../api/client";
import type { Tag } from "../api/types";
import { errorText } from "./format";

export interface AsyncState<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
  setData: (data: T) => void;
}

export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const stableLoad = useCallback(load, deps);

  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    try {
      const result = await stableLoad();
      if (current === generation.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (current === generation.current) setError(errorText(err));
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [stableLoad]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

const TASKS_CHANGED = "dayla:tasks-changed";

/** Tells every screen that tasks changed (created, completed, moved), so lists and stats reload. */
export function notifyTasksChanged() {
  window.dispatchEvent(new Event(TASKS_CHANGED));
}

export function useTasksChanged(reload: () => void) {
  useEffect(() => {
    window.addEventListener(TASKS_CHANGED, reload);
    return () => window.removeEventListener(TASKS_CHANGED, reload);
  }, [reload]);
}

export function useAction(onError: (message: string) => void) {
  const [pending, setPending] = useState<string | null>(null);
  const run = useCallback(
    async <T,>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
      setPending(key);
      try {
        return await action();
      } catch (err) {
        onError(errorText(err));
        return undefined;
      } finally {
        setPending(null);
      }
    },
    [onError],
  );
  return { pending, run };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

const TAGS_CHANGED = "dayla:tags-changed";
let tagsCache: Tag[] | undefined;

export function notifyTagsChanged(tags?: Tag[]) {
  tagsCache = tags;
  window.dispatchEvent(new Event(TAGS_CHANGED));
}

/** Теги пользователя: загружаются один раз и обновляются везде, когда их меняют в аккаунте или в форме задачи. */
export function useTags(): { tags: Tag[]; byId: Map<number, Tag>; reload: () => Promise<void> } {
  const [tags, setTags] = useState<Tag[]>(tagsCache ?? []);
  const reload = useCallback(async () => {
    try {
      tagsCache = await api.tags.list();
      setTags(tagsCache);
    } catch {
      // без тегов страница продолжает работать
    }
  }, []);
  useEffect(() => {
    if (tagsCache) setTags(tagsCache);
    else reload();
    const onChange = () => (tagsCache ? setTags(tagsCache) : reload());
    window.addEventListener(TAGS_CHANGED, onChange);
    return () => window.removeEventListener(TAGS_CHANGED, onChange);
  }, [reload]);
  return { tags, byId: new Map(tags.map((tag) => [tag.id, tag])), reload };
}
