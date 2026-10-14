// src/pages/EventPage.tsx
import { useRef, useState } from "react";
import { api } from "../api/client";
import type { CalendarEvent, EventFile } from "../api/types";
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
import { tr } from "@/i18n";

const GLASS_BODY = GLASS_BODY_FLAT;

const FILE_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg";

/* ─── Общий контейнер страницы ──────────────────────────── */

const PAGE = "relative max-w-3xl mx-auto pt-[1.5vh]";

/* ─── NewEventPage ──────────────────────────────────────── */

export function NewEventPage() {
  useTitle(tr("Новая задача", "New task"));
  const { query } = useLocation();
  const calendars = useAsync(() => api.calendars.list(), []);
  const toast = useToast();

  return (
    <div className={PAGE}>
      <PageHeader title={tr("Новая задача", "New task")} />
      <GlassCard>
        <EventForm
          day={query.get("day")}
          calendars={calendars.data}
          onSaved={(event) => {
            toast(tr("Задача создана", "Task created"));
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
  useTitle(event.data?.title ?? tr("Событие", "Event"));

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
          {tr("К календарю", "To the calendar")}
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
      toast(scope === "series" ? tr("Серия удалена", "Series deleted") : tr("Удалено", "Deleted"));
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
        <PageHeader title={tr("Редактирование", "Editing")} />
        <GlassCard>
          <EventForm
            event={item}
            onSaved={(saved) => {
              event.setData(saved);
              setEditing(false);
              toast(tr("Сохранено", "Saved"));
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
        {tr("Календарь", "Calendar")}
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
              {item.completed_at ? tr("Выполнено", "Done") : tr("Отметить выполненной", "Mark as done")}
            </Button>
            <Button size="sm" icon="settings" onClick={() => setEditing(true)}>
              {tr("Изменить", "Edit")}
            </Button>
            <ConfirmButton
              size="sm"
              icon="trash"
              confirmLabel={tr("Удалить?", "Delete?")}
              busy={pending === "delete"}
              onConfirm={() => remove()}
            >
              {item.series_id ? tr("Удалить эту", "Delete this one") : tr("Удалить", "Delete")}
            </ConfirmButton>
            {item.series_id && (
              <ConfirmButton
                size="sm"
                icon="trash"
                confirmLabel={tr("Удалить серию?", "Delete the series?")}
                busy={pending === "delete-series"}
                onConfirm={() => remove("series")}
              >
                {tr("Удалить серию", "Delete series")}
              </ConfirmButton>
            )}
          </>
        }
      />

      <GlassCard>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <DetailRow icon="calendar" label={tr("Когда", "When")}>
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
            <DetailRow icon="flag" label={tr("Дедлайн", "Deadline")}>
              <Badge
                tone={item.completed_at ? "ok" : deadlineTone(item.deadline_at)}
              >
                {formatDeadline(item.deadline_at)}
              </Badge>
            </DetailRow>
          )}

          {item.recurrence && (
            <DetailRow icon="sync" label={tr("Повтор", "Repeat")}>
              {item.recurrence}
            </DetailRow>
          )}

          {item.location && (
            <DetailRow icon="location" label={tr("Где", "Where")}>
              {item.location}
            </DetailRow>
          )}

          <DetailRow icon="bell" label={tr("Напоминание", "Reminder")}>
            {item.reminder_minutes == null
              ? tr("По настройкам", "As in settings")
              : item.reminder_minutes === 0
              ? tr("В момент начала", "At the start")
              : tr(`За ${formatLead(item.reminder_minutes)}`, `${formatLead(item.reminder_minutes)} before`)}
          </DetailRow>

          <div className="sm:col-span-2">
            <dt className="text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              {tr("Детали", "Details")}
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
              {item.is_fixed && <Badge tone="accent">{tr("нельзя переносить", "can't be moved")}</Badge>}
              <TagList ids={item.tag_ids} />
              {item.sync_status === "synced" && (
                <Badge tone="ok">{tr("синхронизировано", "synced")}</Badge>
              )}
              {item.sync_status === "error" && (
                <Badge tone="bad">{tr("ошибка синхронизации", "sync error")}</Badge>
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
      setPreview({ name: file.filename, text: result.text || tr("Текст не найден.", "No text found.") });
    });

  return (
    <GlassCard
      title={tr("Файлы", "Files")}
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
            {tr("Прикрепить", "Attach")}
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
                  {tr("Текст", "Text")}
                </Button>
              )}
              <ConfirmButton
                size="sm"
                icon="trash"
                confirmLabel={tr("Удалить?", "Delete?")}
                busy={pending === `delete-${file.id}`}
                onConfirm={() =>
                  run(`delete-${file.id}`, async () => {
                    await api.files.remove(file.id);
                    await files.reload();
                  })
                }
                label={tr("Удалить файл", "Delete file")}
              />
            </li>
          ))}
        </ul>
      ) : (
        !files.loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {tr("PDF, Word, Excel или изображения — до 25 МБ.", "PDF, Word, Excel or images — up to 25 MB.")}
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
