// src/pages/Account.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { Integration, ReminderSettings, Source, Tag, TagColor, TelegramLink } from "../api/types";
import { LanguagePicker, ThemePicker } from "@/theme";
import { useAuth, useSignOut, useUser } from "../auth";
import { Icon } from "../components/icons";
import { Avatar } from "../components/Layout";
import { TimeField } from "@/components/ui/time-field";
import { restartTour } from "../components/Tour";
import { TAG_COLORS, TagChip } from "../components/tags";
import {
  Badge,
  Button,
  ConfirmButton,
  ErrorNote,
  Field,
  Loading,
  Switch,
  useErrorToast,
  useToast,
} from "../components/ui";
import {
  GlassCard,
  GlassNavItem,
  GlassPill,
  COMPACT_FIELD,
  COMPACT_CHIPS,
  COMPACT_INLINE_FORM,
  COMPACT_SELECT,
} from "@/components/dashboard/glass";
import { SOURCE_LABELS, browserTimezone, errorText, formatDateTime, formatLead } from "../lib/format";
import { notifyTagsChanged, useAction, useAsync, useMediaQuery, useTags } from "../lib/hooks";
import { Link, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { LOCALE, isEn, tr } from "@/i18n";

const SECTIONS = [
  { id: "profile", label: tr("Профиль", "Profile") },
  { id: "tags", label: tr("Теги", "Tags") },
  { id: "reminders", label: tr("Уведомления", "Notifications") },
  { id: "telegram", label: "Telegram" },
  { id: "appearance", label: tr("Оформление и язык", "Appearance & language") },
  { id: "integrations", label: tr("Интеграции", "Integrations") },
  { id: "security", label: tr("Безопасность", "Security") },
];

/** Раздел, который сейчас на экране: подсвечивается в меню. */
function useActiveSection(): string {
  const [active, setActive] = useState(SECTIONS[0].id);
  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) =>
          entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id)
        );
        const first = SECTIONS.find((section) => visible.has(section.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-25% 0px -55% 0px" }
    );
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

function goTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

export function AccountPage() {
  useTitle(tr("Аккаунт", "Account"));
  const user = useUser();
  const stats = useAsync(() => api.stats(7), []);
  const active = useActiveSection();
  const wide = useMediaQuery("(min-width: 960px)");

  useEffect(() => {
    const id =
      window.location.hash.slice(1) === "services"
        ? "integrations"
        : window.location.hash.slice(1);
    if (!id) return;
    const timer = window.setTimeout(
      () =>
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      150
    );
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative max-w-3xl mx-auto pt-[1.5vh]">
      {/* ─── Шапка аккаунта ──────────────────────────── */}
      <div className="mb-6">
        <GlassCard>
          <div className="-m-4 sm:-m-5 flex items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0 p-4 sm:p-5">
              <Avatar user={user} size={56} />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {user.name || tr("Аккаунт", "Account")}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {stats.data && stats.data.streak > 0 && (
              <GlassPill className="mr-4 sm:mr-5 text-amber-700 dark:text-amber-300 shrink-0">
                <Icon name="fire" size={14} />
                <span
                  className="tabular-nums"
                  title={`${tr("Лучшая серия", "Best streak")}: ${stats.data.best_streak} ${tr("дн.", "d")}`}
                >
                  {stats.data.streak} {tr("дн.", "d")}
                </span>
              </GlassPill>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ─── Layout: меню + секции ─────────────────── */}
      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-8">
        {wide ? (
          <nav className="sticky top-6 self-start space-y-1" aria-label={tr("Разделы аккаунта", "Account sections")}>
            {SECTIONS.map((section) => (
              <GlassNavItem
                key={section.id}
                href={`#${section.id}`}
                active={active === section.id}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(section.id);
                }}
              >
                {section.label}
              </GlassNavItem>
            ))}
          </nav>
        ) : (
          <label className="block">
            <select
              value={active}
              onChange={(event) => goTo(event.target.value)}
              className={COMPACT_SELECT}
            >
              {SECTIONS.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="space-y-6 min-w-0">
          <ProfileSection />
          <TagsSection />
          <RemindersSection />
          <TelegramSection />
          <AppearanceSection />
          <IntegrationsSection />
          <SecuritySection />
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const user = useUser();
  const { setUser } = useAuth();
  const [name, setName] = useState(user.name ?? "");
  const [timezone, setTimezone] = useState(user.timezone ?? browserTimezone());
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const reportError = useErrorToast();
  const zones = useMemo(() => {
    const list = Intl.supportedValuesOf("timeZone");
    return list.includes(timezone) ? list : [timezone, ...list];
  }, [timezone]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      setUser(await api.me.update({ name: name.trim() || null, timezone }));
      toast(tr("Профиль сохранён", "Profile saved"));
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="profile" className="anchor">
      <GlassCard
        title={tr("Профиль", "Profile")}
        actions={
          <button type="button" className="btn btn-ghost btn-sm h-8 px-3 text-xs" onClick={restartTour}>
            {tr("Как пользоваться Dayla", "How to use Dayla")}
          </button>
        }
      >
        <form className={cn("form", COMPACT_FIELD)} onSubmit={save}>
          <div className="form-row">
            <Field label={tr("Имя", "Name")}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                autoComplete="name"
              />
            </Field>
            <Field label="Email">
              <input value={user.email} disabled />
            </Field>
          </div>
          <Field
            label={tr("Часовой пояс", "Time zone")}
            hint={
              timezone !== browserTimezone()
                ? `${tr("На этом устройстве", "On this device")}: ${browserTimezone()}`
                : tr("Совпадает с этим устройством", "Same as this device")
            }
          >
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          <div className="form-actions">
            <Button size="sm" type="submit" variant="primary" busy={busy}>
              {tr("Сохранить", "Save")}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}

function TagsSection() {
  const { tags } = useTags();
  const [name, setName] = useState("");
  const [color, setColor] = useState<TagColor>("indigo");
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());

  const create = (event: FormEvent) => {
    event.preventDefault();
    run("create", async () => {
      const tag = await api.tags.create({ name: name.trim(), color });
      notifyTagsChanged([...tags, tag]);
      setName("");
      setColor(TAG_COLORS[(tags.length + 1) % TAG_COLORS.length]);
      toast(tr("Тег создан", "Tag created"));
    });
  };

  const recolor = (tag: Tag, next: TagColor) =>
    run(`color-${tag.id}`, async () => {
      const saved = await api.tags.update(tag.id, { color: next });
      notifyTagsChanged(tags.map((item) => (item.id === tag.id ? saved : item)));
    });

  const setCounts = (tag: Tag, counts: boolean) =>
    run(`counts-${tag.id}`, async () => {
      const saved = await api.tags.update(tag.id, { counts_progress: counts });
      notifyTagsChanged(tags.map((item) => (item.id === tag.id ? saved : item)));
      toast(
        counts
          ? tr(`«${tag.name}» снова считается в прогрессе`, `“${tag.name}” counts towards progress again`)
          : tr(`Задачи с тегом «${tag.name}» больше не влияют на прогресс`, `Tasks tagged “${tag.name}” no longer affect progress`)
      );
    });

  const remove = (tag: Tag) =>
    run(`delete-${tag.id}`, async () => {
      await api.tags.remove(tag.id);
      notifyTagsChanged(tags.filter((item) => item.id !== tag.id));
      toast(tr(`Тег «${tag.name}» удалён`, `Tag “${tag.name}” deleted`));
    });

  return (
    <div id="tags" className="anchor">
      <GlassCard title={tr("Теги", "Tags")}>
        <p className="muted small">
          {tr(
            "Отмечайте задачи тегами и фильтруйте по ним в «Задачах». В чате тег ставится так: «отчёт завтра #работа». Снимите «в прогрессе» у тегов вроде «прогулка» — такие задачи не будут влиять на процент и серию.",
            "Tag your tasks and filter by tags in Tasks. In the chat, add a tag like this: “report tomorrow #work”. Untick “in progress” for tags like “walk” — such tasks won't affect the percentage and the streak."
          )}
        </p>
        {tags.length > 0 && (
          <ul className="simple-list tag-manage">
            {tags.map((tag) => (
              <li key={tag.id}>
                <TagChip tag={tag} />
                <span
                  className="color-dots"
                  role="group"
                  aria-label={`${tr("Цвет тега", "Tag colour")} ${tag.name}`}
                >
                  {TAG_COLORS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`color-dot tag-${item} ${
                        tag.color === item ? "active" : ""
                      }`}
                      aria-label={item}
                      aria-pressed={tag.color === item}
                      onClick={() => tag.color !== item && recolor(tag, item)}
                    />
                  ))}
                </span>
                <label
                  className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none"
                  title={tr("Учитывать задачи с этим тегом в прогрессе и серии", "Count tasks with this tag towards progress and the streak")}
                >
                  <input
                    type="checkbox"
                    checked={tag.counts_progress !== false}
                    disabled={pending === `counts-${tag.id}`}
                    onChange={(event) => setCounts(tag, event.target.checked)}
                  />
                  {tr("в прогрессе", "in progress")}
                </label>
                <ConfirmButton
                  size="sm"
                  icon="trash"
                  label={`${tr("Удалить тег", "Delete tag")} ${tag.name}`}
                  confirmLabel={tr("Удалить?", "Delete?")}
                  busy={pending === `delete-${tag.id}`}
                  onConfirm={() => remove(tag)}
                />
              </li>
            ))}
          </ul>
        )}
        <form
          className={cn("inline-form", COMPACT_INLINE_FORM)}
          onSubmit={create}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tr("Новый тег, например «работа»", "New tag, e.g. “work”")}
            maxLength={40}
            aria-label={tr("Название тега", "Tag name")}
          />
          <span className="color-dots" role="group" aria-label={tr("Цвет", "Colour")}>
            {TAG_COLORS.map((item) => (
              <button
                key={item}
                type="button"
                className={`color-dot tag-${item} ${color === item ? "active" : ""}`}
                aria-label={item}
                aria-pressed={color === item}
                onClick={() => setColor(item)}
              />
            ))}
          </span>
          <Button
            size="sm"
            type="submit"
            icon="plus"
            busy={pending === "create"}
            disabled={!name.trim()}
          >
            {tr("Создать", "Create")}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

function AppearanceSection() {
  return (
    <div id="appearance" className="anchor">
      <GlassCard title={tr("Оформление и язык", "Appearance & language")}>
        <p className="muted small">
          {tr("Тема и язык сохраняются в этом браузере и действуют на всём сайте.", "The theme and language are saved in this browser and apply to the whole site.")}
        </p>
        <div style={{ marginTop: 12 }}>
          <ThemePicker />
        </div>
        {/* Named in both languages: whoever switched by mistake still finds the way back */}
        <p className="field-label" style={{ marginTop: 16 }}>Язык · Language</p>
        <div style={{ marginTop: 8 }}>
          <LanguagePicker />
        </div>
      </GlassCard>
    </div>
  );
}

// Offered until chosen; any other time is added by hand
const LEAD_SUGGESTIONS = [0, 15, 60, 1440];
const LEAD_UNITS = [
  { value: 1, label: tr("мин", "min") },
  { value: 60, label: tr("ч", "h") },
  { value: 1440, label: tr("дн", "days") },
];
const OWN_SOURCES: Source[] = ["local", "ai"];
// Services whose events can be filtered by: offered only once connected
const EXTERNAL_SOURCES: Source[] = ["google", "apple", "jira", "notion"];

function RemindersSection() {
  const settings = useAsync(() => api.reminders.get(), []);
  const integrations = useAsync(() => api.integrations.list(), []);
  const [draft, setDraft] = useState<ReminderSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const reportError = useErrorToast();

  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  const update = (patch: Partial<ReminderSettings>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));
  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const saved = await api.reminders.update({
        ...draft,
        lead_times: [...draft.lead_times].sort((a, b) => a - b),
        daily_digest_time: draft.daily_digest_time.slice(0, 5),
        checkin_time: draft.checkin_time.slice(0, 5),
        evening_time: draft.evening_time.slice(0, 5),
        quiet_hours_start: draft.quiet_hours_start.slice(0, 5),
        quiet_hours_end: draft.quiet_hours_end.slice(0, 5),
      });
      settings.setData(saved);
      toast(tr("Настройки уведомлений сохранены", "Notification settings saved"));
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const dirty =
    draft && settings.data && JSON.stringify(draft) !== JSON.stringify(settings.data);

  // Connected services, plus any chosen earlier so it can still be turned off
  const sources = [
    ...OWN_SOURCES,
    ...EXTERNAL_SOURCES.filter(
      (source) =>
        integrations.data?.some((item) => item.slug === source && item.connection) ||
        draft?.sources.includes(source),
    ),
  ];

  return (
    <div id="reminders" className="anchor">
      <GlassCard title={tr("Уведомления", "Notifications")}>
        {settings.error && (
          <ErrorNote message={settings.error} onRetry={settings.reload} />
        )}
        {!draft ? (
          settings.loading && <Loading />
        ) : (
          <div className={cn("form", COMPACT_FIELD, COMPACT_CHIPS)}>
            <Switch
              checked={draft.enabled}
              onChange={(enabled) => update({ enabled })}
              label={tr("Напоминать о событиях", "Remind me about events")}
              hint={tr("Сообщения приходят в Telegram-бота", "Messages come from the Telegram bot")}
            />

            <fieldset className="fieldset" disabled={!draft.enabled}>
              <legend className="field-label">{tr("Когда напоминать", "When to remind")}</legend>
              <LeadTimes
                value={draft.lead_times}
                onChange={(lead_times) => update({ lead_times })}
              />
              <span className="field-hint">
                {tr("Для отдельного события можно задать своё время в его настройках.", "A single event can have its own time in its settings.")}
              </span>
            </fieldset>

            <Switch
              checked={draft.daily_digest_enabled}
              onChange={(value) => update({ daily_digest_enabled: value })}
              label={tr("План дня по утрам", "Morning plan for the day")}
            />
            {draft.daily_digest_enabled && (
              <Field label={tr("Время плана", "Plan time")} className="field-inline">
                <TimeField value={draft.daily_digest_time.slice(0, 5)} onChange={(value) => update({ daily_digest_time: value })} label={tr("Время плана", "Plan time")} />
              </Field>
            )}

            <Switch
              checked={draft.checkin_enabled}
              onChange={(value) => update({ checkin_enabled: value })}
              label={tr("Проверка в середине дня", "Midday check-in")}
              hint={tr("Спрошу, успеваете ли вы, и предложу перенести часть задач на менее загруженный день", "I'll ask whether you're keeping up and offer to move some tasks to a lighter day")}
            />
            {draft.checkin_enabled && (
              <Field label={tr("Время проверки", "Check-in time")} className="field-inline">
                <TimeField value={draft.checkin_time.slice(0, 5)} onChange={(value) => update({ checkin_time: value })} label={tr("Время проверки", "Check-in time")} />
              </Field>
            )}

            <Switch
              checked={draft.evening_enabled}
              onChange={(value) => update({ evening_enabled: value })}
              label={tr("Итоги дня вечером", "Evening summary")}
              hint={tr("Прогресс за день, план на завтра и перенос невыполненного", "The day's progress, tomorrow's plan and moving what's left")}
            />
            {draft.evening_enabled && (
              <Field label={tr("Время итогов", "Summary time")} className="field-inline">
                <TimeField value={draft.evening_time.slice(0, 5)} onChange={(value) => update({ evening_time: value })} label={tr("Время итогов", "Summary time")} />
              </Field>
            )}

            <Switch
              checked={draft.deadline_enabled}
              onChange={(value) => update({ deadline_enabled: value })}
              label={tr("Приближение дедлайнов", "Upcoming deadlines")}
              hint={tr("За 3 дня, за день и за 2 часа до срока", "3 days, 1 day and 2 hours before the deadline")}
            />

            <Switch
              checked={draft.quiet_hours_enabled}
              onChange={(value) => update({ quiet_hours_enabled: value })}
              label={tr("Тихие часы", "Quiet hours")}
              hint={tr("Ничего не присылать в это время", "Send nothing during these hours")}
            />
            {draft.quiet_hours_enabled && (
              <div className="form-row">
                <Field label={tr("С", "From")}>
                  <TimeField value={draft.quiet_hours_start.slice(0, 5)} onChange={(value) => update({ quiet_hours_start: value })} label={tr("Тихие часы с", "Quiet hours from")} />
                </Field>
                <Field label={tr("До", "To")}>
                  <TimeField value={draft.quiet_hours_end.slice(0, 5)} onChange={(value) => update({ quiet_hours_end: value })} label={tr("Тихие часы до", "Quiet hours to")} />
                </Field>
              </div>
            )}

            <fieldset className="fieldset">
              <legend className="field-label">{tr("Источники", "Sources")}</legend>
              <div className="chips">
                {sources.map((source) => (
                  <button
                    key={source}
                    type="button"
                    className={`chip-toggle ${
                      draft.sources.includes(source) ? "active" : ""
                    }`}
                    aria-pressed={draft.sources.includes(source)}
                    onClick={() =>
                      update({ sources: toggle(draft.sources, source) })
                    }
                  >
                    {SOURCE_LABELS[source]}
                  </button>
                ))}
              </div>
              <span className="field-hint">
                {draft.sources.length
                  ? tr("Напоминания только для выбранных источников.", "Reminders only for the chosen sources.")
                  : tr("Ничего не выбрано — напоминания для всех событий.", "Nothing chosen — reminders for all events.")}
              </span>
            </fieldset>

            <div className="form-actions">
              <Button
                size="sm"
                variant="primary"
                busy={busy}
                disabled={!dirty}
                onClick={save}
              >
                {tr("Сохранить", "Save")}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

type ProfileRow = { slug: string; title: string; connection: Integration["connection"]; viaGoogle?: boolean };

// The profile lists only what works: the connected services, and Apple and Samsung Calendar once Google is
// connected (they show Dayla's tasks through the Google account). Connecting the rest is on the Integrations page
function connectedRows(items: Integration[]): ProfileRow[] {
  const rows: ProfileRow[] = items.filter((item) => item.connection);
  const google = items.some((item) => item.slug === "google" && item.connection?.status === "connected");
  if (!google) return rows;
  if (!rows.some((row) => row.slug === "apple")) rows.push({ slug: "apple", title: "Apple Calendar", connection: null, viaGoogle: true });
  rows.push({ slug: "samsung", title: "Samsung Calendar", connection: null, viaGoogle: true });
  return rows;
}

function IntegrationsSection() {
  const integrations = useAsync(() => api.integrations.list(), []);
  return (
    <div id="integrations" className="anchor">
      <GlassCard
        title={tr("Интеграции", "Integrations")}
        actions={
          <Link
            to="/integrations"
            className="btn btn-secondary btn-sm h-8 px-3 text-xs"
          >
            {tr("Управлять", "Manage")}
          </Link>
        }
      >
        <p className="muted small">
          {tr(
            "Google Calendar, Яндекс Календарь, Apple Calendar, Samsung Calendar, Jira и Notion: подключение, импорт и отправка задач.",
            "Google Calendar, Yandex Calendar, Apple Calendar, Samsung Calendar, Jira and Notion: connecting, importing and sending tasks."
          )}
        </p>
        {integrations.error && (
          <ErrorNote message={integrations.error} onRetry={integrations.reload} />
        )}
        {integrations.data &&
          (connectedRows(integrations.data).length ? (
            <ul className="simple-list">
              {connectedRows(integrations.data).map((item) => (
                <li key={item.slug}>
                  <span className="truncate">{item.title}</span>
                  {item.connection ? (
                    <Badge tone={item.connection.status === "error" ? "bad" : "ok"}>
                      {item.connection.status === "error" ? tr("ошибка", "error") : tr("подключено", "connected")}
                    </Badge>
                  ) : (
                    <Badge>{tr("через Google", "via Google")}</Badge>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">
              {tr("Пока ничего не подключено.", "Nothing is connected yet.")}{" "}
              <Link to="/integrations">{tr("Подключить календарь", "Connect a calendar")}</Link>
            </p>
          ))}
      </GlassCard>
    </div>
  );
}

function TelegramSection() {
  const status = useAsync(() => api.telegram.status(), []);
  const [link, setLink] = useState<TelegramLink | null>(null);
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());
  const { reload: reloadUser } = useAuth();

  const copy = (text: string) =>
    navigator.clipboard
      .writeText(text)
      .then(() => toast(tr("Скопировано", "Copied")))
      .catch(() => toast(tr("Не удалось скопировать", "Could not copy"), "error"));

  return (
    <div id="telegram" className="anchor">
      <GlassCard title="Telegram">
        {status.error && (
          <ErrorNote message={status.error} onRetry={status.reload} />
        )}
        {!status.data ? (
          status.loading && <Loading />
        ) : status.data.linked ? (
          <div className="form">
            <p>
              <Badge tone="ok">{tr("подключён", "connected")}</Badge>{" "}
              {status.data.username
                ? `@${status.data.username}`
                : tr("чат привязан", "chat linked")}
              <span className="muted">
                {" "}
                · {tr("с", "since")} {formatDateTime(status.data.linked_at)}
              </span>
            </p>
            <p className="muted small">
              {tr(
                "Пишите боту планы обычными словами, голосом или файлом PDF/DOCX — события появятся в календаре. Спросите «что у меня завтра?», чтобы увидеть план.",
                "Send the bot your plans in plain words, by voice or as a PDF/DOCX file — the events will appear in the calendar. Ask “what do I have tomorrow?” to see the plan."
              )}
            </p>
            <div className="button-row">
              <Button
                size="sm"
                icon="bell"
                busy={pending === "test"}
                onClick={() =>
                  run("test", async () => {
                    await api.reminders.test();
                    toast(tr("Тестовое уведомление отправлено", "Test notification sent"));
                  })
                }
              >
                {tr("Отправить тест", "Send a test")}
              </Button>
              <ConfirmButton
                size="sm"
                confirmLabel={tr("Отвязать?", "Unlink?")}
                busy={pending === "unlink"}
                onConfirm={() =>
                  run("unlink", async () => {
                    await api.telegram.unlink();
                    await Promise.all([status.reload(), reloadUser()]);
                  })
                }
              >
                {tr("Отвязать", "Unlink")}
              </ConfirmButton>
            </div>
          </div>
        ) : (
          <div className="form">
            <p className="muted">
              {tr(
                "Привяжите Telegram, чтобы планировать в чате с Dayla: пишите или надиктовывайте планы, спрашивайте о расписании и получайте напоминания и план на утро.",
                "Link Telegram to plan in a chat with Dayla: type or dictate plans, ask about your schedule and get reminders and a morning plan."
              )}
            </p>
            {link ? (
              <div className="link-code">
                {link.deep_link && (
                  <a
                    className="btn btn-primary btn-sm h-8 px-3 text-xs inline-flex items-center gap-1.5"
                    href={link.deep_link}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {tr("Открыть бота", "Open the bot")} <Icon name="external" size={14} />
                  </a>
                )}
                <p className="small">
                  {link.deep_link
                    ? tr("Или отправьте боту команду:", "Or send the bot this command:")
                    : tr("Отправьте боту команду:", "Send the bot this command:")}
                </p>
                <button
                  type="button"
                  className="code h-8 px-3 text-xs rounded-lg"
                  onClick={() => copy(`/start ${link.code}`)}
                  title={tr("Скопировать", "Copy")}
                >
                  /start {link.code}
                </button>
                <p className="muted small">
                  {tr("Код действует до", "The code is valid until")}{" "}
                  {new Date(link.expires_at).toLocaleTimeString(LOCALE, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  .
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="sync"
                  busy={status.loading}
                  onClick={status.reload}
                >
                  {tr("Я отправил — проверить", "I've sent it — check")}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="primary"
                busy={pending === "link"}
                onClick={() =>
                  run("link", async () => setLink(await api.telegram.link()))
                }
              >
                {tr("Подключить Telegram", "Connect Telegram")}
              </Button>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function SecuritySection() {
  const logout = useSignOut();
  const navigate = useNavigate();
  const errorToast = useErrorToast();
  const [deleting, setDeleting] = useState(false);

  // Everything goes: events, files, chat, integrations; Google's access to the calendar is revoked too
  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api.me.remove();
      useAuthStore.setState({ user: null, isAuthenticated: false, error: null });
      navigate("/", { replace: true });
    } catch (error) {
      errorToast(errorText(error));
      setDeleting(false);
    }
  };

  return (
    <div id="security" className="anchor">
      <GlassCard title={tr("Безопасность", "Security")}>
        <div className="flex flex-col gap-3">
          <div className="button-row">
            <Button size="sm" icon="logout" onClick={() => logout()}>
              {tr("Выйти", "Sign out")}
            </Button>
            <ConfirmButton
              size="sm"
              confirmLabel={tr("Выйти на всех устройствах?", "Sign out on all devices?")}
              onConfirm={() => logout(true)}
            >
              {tr("Выйти везде", "Sign out everywhere")}
            </ConfirmButton>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {tr(
              "Удаление аккаунта стирает все ваши задачи, файлы, переписку с ассистентом и подключения и отзывает доступ Dayla к Google Calendar. Отменить его нельзя. Подробнее — в",
              "Deleting the account erases all your tasks, files, chats with the assistant and connections, and revokes Dayla's access to Google Calendar. It cannot be undone. More in the"
            )}{" "}
            <a href="/privacy-policy" className="text-sky-600 dark:text-sky-400 hover:underline">
              {tr("политике конфиденциальности", "privacy policy")}
            </a>
            .
          </p>
          <div className="button-row">
            <ConfirmButton
              size="sm"
              icon="trash"
              busy={deleting}
              confirmLabel={tr("Удалить аккаунт навсегда?", "Delete the account for good?")}
              onConfirm={deleteAccount}
            >
              {tr("Удалить аккаунт", "Delete account")}
            </ConfirmButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
/* Reminder lead times: the chosen ones with ×, a few suggestions, and any time of one's own */
function LeadTimes({ value, onChange }: { value: number[]; onChange: (value: number[]) => void }) {
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState(1);
  const sorted = [...value].sort((a, b) => a - b);
  const label = (minutes: number) => (minutes === 0 ? tr("в момент начала", "at the start") : tr(`за ${formatLead(minutes)}`, `${formatLead(minutes)} before`));
  const add = (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 10080 || value.includes(minutes)) return;
    onChange([...value, minutes].slice(-10));
  };
  const addOwn = () => {
    const number = Number(amount.replace(",", "."));
    if (!number || number <= 0) return;
    add(Math.round(number * unit));
    setAmount("");
  };
  const suggestions = LEAD_SUGGESTIONS.filter((minutes) => !value.includes(minutes));

  return (
    <div className="space-y-2">
      <div className="chips">
        {sorted.length === 0 && <span className="field-hint">{tr("Пока не выбрано — добавьте время ниже.", "Nothing chosen yet — add a time below.")}</span>}
        {sorted.map((minutes) => (
          <span key={minutes} className="chip-toggle active inline-flex items-center gap-1">
            {label(minutes)}
            <button
              type="button"
              aria-label={tr(`Убрать «${label(minutes)}»`, `Remove “${label(minutes)}”`)}
              className="opacity-70 hover:opacity-100"
              onClick={() => onChange(value.filter((item) => item !== minutes))}
            >
              ×
            </button>
          </span>
        ))}
        {suggestions.map((minutes) => (
          <button key={minutes} type="button" className="chip-toggle" onClick={() => add(minutes)}>
            + {label(minutes)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 max-w-xs">
        {!isEn && <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">за</span>}
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          placeholder="20"
          aria-label={tr("Своё время напоминания", "Your own reminder time")}
          onChange={(event) => setAmount(event.target.value.replace(/[^\d.,]/g, "").slice(0, 4))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addOwn();
            }
          }}
          className="!w-20"
        />
        <select value={unit} onChange={(event) => setUnit(Number(event.target.value))} aria-label={tr("Единица", "Unit")} className="!w-24">
          {LEAD_UNITS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        {isEn && <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">before</span>}
        <Button size="sm" onClick={addOwn} disabled={!amount}>
          {tr("Добавить", "Add")}
        </Button>
      </div>
    </div>
  );
}
