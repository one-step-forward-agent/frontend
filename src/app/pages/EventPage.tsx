// src/pages/EventPage.tsx
import { useRef, useState } from "react";
import { api } from "../api/client";
import type { CalendarEvent, EventFile, Integration } from "../api/types";
import { EventForm } from "../components/events";
import { TagList } from "../components/tags";
import { Icon } from "../components/icons";
import {
  Badge,
  Button,
  ConfirmButton,
  Dialog,
  ErrorNote,
  Loading,
  PageHeader,
  useErrorToast,
  useToast,
} from "../components/ui";
import {
  PRIORITIES,
  SOURCE_LABELS,
  dayKey,
  deadlineTone,
  eventTimeRange,
  formatDate,
  formatDeadline,
  formatLead,
  formatSize,
} from "../lib/format";
import { notifyTasksChanged, useAction, useAsync } from "../lib/hooks";
import { Link, navigate, useLocation, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { GlassCard, GLASS_BODY_FLAT } from "@/components/dashboard/glass";

const GLASS_BODY = GLASS_BODY_FLAT;

const FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

/* ─── Общий контейнер страницы ──────────────────────────── */

const PAGE = "relative max-w-3xl mx-auto pt-[1.5vh]";

/* ─── NewEventPage ──────────────────────────────────────── */

export function NewEventPage() {
  useTitle("Новая задача");
  const { query } = useLocation();
  const calendars = useAsync(() => api.calendars.list(), []);
  const toast = useToast();

  return (
    <div className={PAGE}>
      <PageHeader title="Новая задача" />
      <GlassCard>
        <EventForm
          day={query.get("day")}
          calendars={calendars.data}
          onSaved={(event) => {
            toast("Задача создана");
            navigate(`/events/${event.id}`, { replace: true });
          }}
          onCancel={() => window.history.back()}
        />
      </GlassCard>
    </div>
  );
}

/* ─── EventPage ─────────────────────────────────────────── */

export function EventPage({ id }: { id: number }) {
  const event = useAsync(() => api.events.get(id), [id]);
  const [editing, setEditing] = useState(false);
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());
  useTitle(event.data?.title ?? "Событие");

  if (event.error) {
    return (
      <div className={PAGE}>
        <ErrorNote message={event.error} onRetry={event.reload} />
        <Link
          to="/calendar"
          className={cn(
            "mt-4 inline-flex items-center gap-1.5 text-sm",
            "text-sky-700 dark:text-sky-300",
            "hover:text-sky-900 dark:hover:text-sky-100 transition-colors"
          )}
        >
          <Icon name="left" size={14} />
          К календарю
        </Link>
      </div>
    );
  }
  if (!event.data) return <Loading />;
  const item = event.data;

  const remove = (scope: "one" | "series" = "one") =>
    run(scope === "series" ? "delete-series" : "delete", async () => {
      await api.events.remove(item.id, scope);
      notifyTasksChanged();
      toast(scope === "series" ? "Серия удалена" : "Удалено");
      navigate("/calendar", { replace: true });
    });

  const toggleDone = () =>
    run("done", async () => {
      event.setData(await api.events.complete(item.id, !item.completed_at));
      notifyTasksChanged();
    });

  if (editing) {
    return (
      <div className={PAGE}>
        <PageHeader title="Редактирование" />
        <GlassCard>
          <EventForm
            event={item}
            onSaved={(saved) => {
              event.setData(saved);
              setEditing(false);
              toast("Сохранено");
            }}
            onCancel={() => setEditing(false)}
          />
        </GlassCard>
      </div>
    );
  }

  const start = new Date(item.start_at);
  const priority = PRIORITIES.find((entry) => entry.value === item.priority);

  return (
    <div className={PAGE}>
      <Link
        to={`/calendar?day=${dayKey(start)}`}
        className={cn(
          "inline-flex items-center gap-1.5 mb-4 text-sm",
          "text-gray-500 dark:text-gray-400",
          "hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        )}
      >
        <Icon name="left" size={14} />
        Календарь
      </Link>

      <PageHeader
        title={item.title}
        actions={
          <>
            <Button
              size="sm"
              icon="check"
              variant={item.completed_at ? "primary" : "secondary"}
              busy={pending === "done"}
              onClick={toggleDone}
            >
              {item.completed_at ? "Выполнено" : "Отметить выполненной"}
            </Button>
            <Button size="sm" icon="settings" onClick={() => setEditing(true)}>
              Изменить
            </Button>
            <ConfirmButton
              size="sm"
              icon="trash"
              confirmLabel="Удалить?"
              busy={pending === "delete"}
              onConfirm={() => remove()}
            >
              {item.series_id ? "Удалить эту" : "Удалить"}
            </ConfirmButton>
            {item.series_id && (
              <ConfirmButton
                size="sm"
                icon="trash"
                confirmLabel="Удалить серию?"
                busy={pending === "delete-series"}
                onConfirm={() => remove("series")}
              >
                Удалить серию
              </ConfirmButton>
            )}
          </>
        }
      />

      <GlassCard>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <DetailRow icon="calendar" label="Когда">
            {formatDate(start, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            <br />
            <span className="text-gray-500 dark:text-gray-400">
              {eventTimeRange(item)}
            </span>
          </DetailRow>

          {item.deadline_at && (
            <DetailRow icon="flag" label="Дедлайн">
              <Badge
                tone={item.completed_at ? "ok" : deadlineTone(item.deadline_at)}
              >
                {formatDeadline(item.deadline_at)}
              </Badge>
            </DetailRow>
          )}

          {item.location && (
            <DetailRow icon="location" label="Где">
              {item.location}
            </DetailRow>
          )}

          <DetailRow icon="bell" label="Напоминание">
            {item.reminder_minutes == null
              ? "По настройкам"
              : item.reminder_minutes === 0
              ? "В момент начала"
              : `За ${formatLead(item.reminder_minutes)}`}
          </DetailRow>

          <div className="sm:col-span-2">
            <dt className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              Детали
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              <Badge
                tone={
                  item.priority === "urgent"
                    ? "bad"
                    : item.priority === "high"
                    ? "warn"
                    : "neutral"
                }
              >
                {priority?.label ?? item.priority}
              </Badge>
              <Badge>{SOURCE_LABELS[item.source] ?? item.source}</Badge>
              {item.is_fixed && <Badge tone="accent">нельзя переносить</Badge>}
              <TagList ids={item.tag_ids} />
              {item.sync_status === "synced" && (
                <Badge tone="ok">синхронизировано</Badge>
              )}
              {item.sync_status === "error" && (
                <Badge tone="bad">ошибка синхронизации</Badge>
              )}
            </dd>
          </div>
        </dl>

        {item.description && (
          <p
            className={cn(
              "mt-5 text-sm leading-relaxed",
              "text-gray-700 dark:text-gray-300",
              "whitespace-pre-wrap"
            )}
          >
            {item.description}
          </p>
        )}
      </GlassCard>

      <div className="mt-6 space-y-6">
        <EventFiles eventId={item.id} />
        <EventExport event={item} onChange={event.setData} />
      </div>
    </div>
  );
}

/* ─── DetailRow — единый блок пары dt/dd ────────────────── */

function DetailRow({
  icon,
  label,
  children,
}: {
  icon?: Parameters<typeof Icon>[0]["name"];
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
        {icon && <Icon name={icon} size={12} />}
        {label}
      </dt>
      <dd className="text-sm text-gray-900 dark:text-white leading-snug">
        {children}
      </dd>
    </div>
  );
}

/* ─── EventFiles ────────────────────────────────────────── */

function EventFiles({ eventId }: { eventId: number }) {
  const files = useAsync(() => api.events.files(eventId), [eventId]);
  const input = useRef<HTMLInputElement>(null);
  const { pending, run } = useAction(useErrorToast());
  const [preview, setPreview] = useState<{ name: string; text: string } | null>(
    null
  );

  const uploadFiles = (list: FileList | null) =>
    run("upload", async () => {
      for (const file of Array.from(list ?? []))
        await api.events.uploadFile(eventId, file);
      await files.reload();
    }).finally(() => {
      if (input.current) input.current.value = "";
    });

  const showText = (file: EventFile) =>
    run(`text-${file.id}`, async () => {
      const result = await api.files.text(file.id);
      setPreview({ name: file.filename, text: result.text || "Текст не найден." });
    });

  return (
    <GlassCard
      title="Файлы"
      actions={
        <>
          <input
            ref={input}
            type="file"
            accept={FILE_TYPES}
            multiple
            hidden
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <Button
            size="sm"
            variant="ghost"
            icon="clip"
            busy={pending === "upload"}
            onClick={() => input.current?.click()}
          >
            Прикрепить
          </Button>
        </>
      }
    >
      {files.error && (
        <ErrorNote message={files.error} onRetry={files.reload} />
      )}

      {files.data?.length ? (
        <ul className="space-y-1.5">
          {files.data.map((file) => (
            <li
              key={file.id}
              className={cn(
                "relative flex items-center gap-2 overflow-hidden",
                "px-3 py-2 rounded-xl",
                GLASS_BODY
              )}
            >
              <Icon
                name="file"
                size={16}
                className="shrink-0 text-gray-500 dark:text-gray-400"
              />
              <span className="truncate flex-1 min-w-0 text-sm text-gray-900 dark:text-white">
                {file.filename}
              </span>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                {formatSize(file.size)}
              </span>
              {/\.(pdf|docx)$/i.test(file.filename) && (
                <Button
                  size="sm"
                  variant="ghost"
                  busy={pending === `text-${file.id}`}
                  onClick={() => showText(file)}
                >
                  Текст
                </Button>
              )}
              <ConfirmButton
                size="sm"
                icon="trash"
                confirmLabel="Удалить?"
                busy={pending === `delete-${file.id}`}
                onConfirm={() =>
                  run(`delete-${file.id}`, async () => {
                    await api.files.remove(file.id);
                    await files.reload();
                  })
                }
                label="Удалить файл"
              />
            </li>
          ))}
        </ul>
      ) : (
        !files.loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            PDF, Word, Excel или изображения — до 20 МБ.
          </p>
        )
      )}

      <Dialog
        open={preview !== null}
        title={preview?.name ?? ""}
        onClose={() => setPreview(null)}
      >
        <pre
          className={cn(
            "text-xs leading-relaxed whitespace-pre-wrap break-words",
            "text-gray-800 dark:text-gray-200",
            "max-h-[60vh] overflow-y-auto"
          )}
        >
          {preview?.text}
        </pre>
      </Dialog>
    </GlassCard>
  );
}

/* ─── EventExport ───────────────────────────────────────── */

function EventExport({
  event,
  onChange,
}: {
  event: CalendarEvent;
  onChange: (event: CalendarEvent) => void;
}) {
  const integrations = useAsync(() => api.integrations.list(), []);
  const links = useAsync(() => api.events.links(event.id), [event.id]);
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());

  const connected = (integrations.data ?? []).filter((item) => item.connection);
  const google = connected.find((item) => item.slug === "google");
  const targets = connected.filter(
    (item: Integration) =>
      item.supports_push &&
      item.slug !== "google" &&
      item.slug !== event.source &&
      !links.data?.some((link) => link.provider === item.slug)
  );

  if (!connected.length && !links.data?.length) return null;

  return (
    <GlassCard title="Отправить в сервисы">
      {links.data && links.data.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {links.data.map((link) => (
            <li
              key={link.id}
              className={cn(
                "relative flex items-center gap-2 overflow-hidden",
                "px-3 py-2 rounded-xl",
                GLASS_BODY
              )}
            >
              <Badge tone="ok">
                {SOURCE_LABELS[link.provider] ?? link.provider}
              </Badge>
              {link.url ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cn(
                    "inline-flex items-center gap-1 text-sm",
                    "text-sky-700 dark:text-sky-300",
                    "hover:text-sky-900 dark:hover:text-sky-100 transition-colors"
                  )}
                >
                  Открыть <Icon name="external" size={12} />
                </a>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  экспортировано
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1.5">
        {google && event.source !== "google" && (
          <Button
            size="sm"
            icon="sync"
            busy={pending === "google"}
            onClick={() =>
              run("google", async () => {
                onChange(await api.events.syncGoogle(event.id));
                toast("Отправлено в Google Calendar");
              })
            }
          >
            {event.sync_status === "synced"
              ? "Обновить в Google"
              : "Google Calendar"}
          </Button>
        )}
        {targets.map((item) => (
          <Button
            key={item.slug}
            size="sm"
            icon="external"
            busy={pending === item.slug}
            onClick={() =>
              run(item.slug, async () => {
                await api.integrations.exportEvent(item.slug, event.id);
                await links.reload();
                toast(`Отправлено в ${item.title}`);
              })
            }
          >
            {item.title}
          </Button>
        ))}
      </div>
    </GlassCard>
  );
}