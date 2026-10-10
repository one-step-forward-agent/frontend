// src/pages/Account.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { ReminderSettings, Source, Tag, TagColor, TelegramLink } from "../api/types";
import { ThemePicker } from "@/theme";
import { useAuth, useSignOut, useUser } from "../auth";
import { Icon } from "../components/icons";
import { Avatar } from "../components/Layout";
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
import { SOURCE_LABELS, browserTimezone, errorText, formatDateTime, formatLead, stripTags } from "../lib/format";
import { notifyTagsChanged, useAction, useAsync, useMediaQuery, useTags } from "../lib/hooks";
import { Link, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

const SECTIONS = [
  { id: "profile", label: "Профиль" },
  { id: "tags", label: "Теги" },
  { id: "reminders", label: "Уведомления" },
  { id: "telegram", label: "Telegram" },
  { id: "appearance", label: "Оформление" },
  { id: "integrations", label: "Интеграции" },
  { id: "calendars", label: "Календари" },
  { id: "security", label: "Безопасность" },
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
  useTitle("Аккаунт");
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
                  {user.name || "Аккаунт"}
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
                  title={`Лучшая серия: ${stats.data.best_streak} дн.`}
                >
                  {stats.data.streak} дн.
                </span>
              </GlassPill>
            )}
          </div>
        </GlassCard>
      </div>

      {/* ─── Layout: меню + секции ─────────────────── */}
      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-8">
        {wide ? (
          <nav className="sticky top-6 self-start space-y-1" aria-label="Разделы аккаунта">
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
          <CalendarsSection />
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
      toast("Профиль сохранён");
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="profile" className="anchor">
      <GlassCard title="Профиль">
        <form className={cn("form", COMPACT_FIELD)} onSubmit={save}>
          <div className="form-row">
            <Field label="Имя">
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
            label="Часовой пояс"
            hint={
              timezone !== browserTimezone()
                ? `На этом устройстве: ${browserTimezone()}`
                : "Совпадает с этим устройством"
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
              Сохранить
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
      toast("Тег создан");
    });
  };

  const recolor = (tag: Tag, next: TagColor) =>
    run(`color-${tag.id}`, async () => {
      const saved = await api.tags.update(tag.id, { color: next });
      notifyTagsChanged(tags.map((item) => (item.id === tag.id ? saved : item)));
    });

  const remove = (tag: Tag) =>
    run(`delete-${tag.id}`, async () => {
      await api.tags.remove(tag.id);
      notifyTagsChanged(tags.filter((item) => item.id !== tag.id));
      toast(`Тег «${tag.name}» удалён`);
    });

  return (
    <div id="tags" className="anchor">
      <GlassCard title="Теги">
        <p className="muted small">
          Отмечайте задачи тегами и фильтруйте по ним в «Задачах». В чате тег
          ставится так: «отчёт завтра #работа».
        </p>
        {tags.length > 0 && (
          <ul className="simple-list tag-manage">
            {tags.map((tag) => (
              <li key={tag.id}>
                <TagChip tag={tag} />
                <span
                  className="color-dots"
                  role="group"
                  aria-label={`Цвет тега ${tag.name}`}
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
                <ConfirmButton
                  size="sm"
                  icon="trash"
                  label={`Удалить тег ${tag.name}`}
                  confirmLabel="Удалить?"
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
            placeholder="Новый тег, например «работа»"
            maxLength={40}
            aria-label="Название тега"
          />
          <span className="color-dots" role="group" aria-label="Цвет">
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
            Создать
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

function AppearanceSection() {
  return (
    <div id="appearance" className="anchor">
      <GlassCard title="Оформление">
        <p className="muted small">
          Тема сохраняется в этом браузере и действует на всём сайте.
        </p>
        <div style={{ marginTop: 12 }}>
          <ThemePicker />
        </div>
      </GlassCard>
    </div>
  );
}

const LEAD_PRESETS = [0, 5, 10, 15, 30, 60, 120, 1440];
const SOURCES: Source[] = ["local", "ai", "google", "apple", "jira", "notion"];

function RemindersSection() {
  const settings = useAsync(() => api.reminders.get(), []);
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
      toast("Настройки уведомлений сохранены");
    } catch (error) {
      reportError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const dirty =
    draft && settings.data && JSON.stringify(draft) !== JSON.stringify(settings.data);

  return (
    <div id="reminders" className="anchor">
      <GlassCard title="Уведомления">
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
              label="Напоминать о событиях"
              hint="Сообщения приходят в Telegram-бота"
            />

            <fieldset className="fieldset" disabled={!draft.enabled}>
              <legend className="field-label">Когда напоминать</legend>
              <div className="chips">
                {LEAD_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={`chip-toggle ${
                      draft.lead_times.includes(minutes) ? "active" : ""
                    }`}
                    aria-pressed={draft.lead_times.includes(minutes)}
                    onClick={() =>
                      update({
                        lead_times: toggle(draft.lead_times, minutes).slice(0, 10),
                      })
                    }
                  >
                    {minutes === 0
                      ? "в момент начала"
                      : `за ${formatLead(minutes)}`}
                  </button>
                ))}
              </div>
              <span className="field-hint">
                Для отдельного события можно задать своё время в его настройках.
              </span>
            </fieldset>

            <Switch
              checked={draft.daily_digest_enabled}
              onChange={(value) => update({ daily_digest_enabled: value })}
              label="План дня по утрам"
            />
            {draft.daily_digest_enabled && (
              <Field label="Время плана" className="field-inline">
                <input
                  type="time"
                  value={draft.daily_digest_time.slice(0, 5)}
                  onChange={(e) => update({ daily_digest_time: e.target.value })}
                />
              </Field>
            )}

            <Switch
              checked={draft.checkin_enabled}
              onChange={(value) => update({ checkin_enabled: value })}
              label="Проверка в середине дня"
              hint="Спрошу, успеваете ли вы, и предложу перенести часть задач на менее загруженный день"
            />
            {draft.checkin_enabled && (
              <Field label="Время проверки" className="field-inline">
                <input
                  type="time"
                  value={draft.checkin_time.slice(0, 5)}
                  onChange={(e) => update({ checkin_time: e.target.value })}
                />
              </Field>
            )}

            <Switch
              checked={draft.evening_enabled}
              onChange={(value) => update({ evening_enabled: value })}
              label="Итоги дня вечером"
              hint="Прогресс за день, план на завтра и перенос невыполненного"
            />
            {draft.evening_enabled && (
              <Field label="Время итогов" className="field-inline">
                <input
                  type="time"
                  value={draft.evening_time.slice(0, 5)}
                  onChange={(e) => update({ evening_time: e.target.value })}
                />
              </Field>
            )}

            <Switch
              checked={draft.deadline_enabled}
              onChange={(value) => update({ deadline_enabled: value })}
              label="Приближение дедлайнов"
              hint="За 3 дня, за день и за 2 часа до срока"
            />

            <Switch
              checked={draft.quiet_hours_enabled}
              onChange={(value) => update({ quiet_hours_enabled: value })}
              label="Тихие часы"
              hint="Ничего не присылать в это время"
            />
            {draft.quiet_hours_enabled && (
              <div className="form-row">
                <Field label="С">
                  <input
                    type="time"
                    value={draft.quiet_hours_start.slice(0, 5)}
                    onChange={(e) => update({ quiet_hours_start: e.target.value })}
                  />
                </Field>
                <Field label="До">
                  <input
                    type="time"
                    value={draft.quiet_hours_end.slice(0, 5)}
                    onChange={(e) => update({ quiet_hours_end: e.target.value })}
                  />
                </Field>
              </div>
            )}

            <fieldset className="fieldset">
              <legend className="field-label">Источники</legend>
              <div className="chips">
                {SOURCES.map((source) => (
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
                  ? "Напоминания только для выбранных источников."
                  : "Ничего не выбрано — напоминания для всех событий."}
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
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function IntegrationsSection() {
  const integrations = useAsync(() => api.integrations.list(), []);
  return (
    <div id="integrations" className="anchor">
      <GlassCard
        title="Интеграции"
        actions={
          <Link
            to="/integrations"
            className="btn btn-secondary btn-sm h-8 px-3 text-xs"
          >
            Управлять
          </Link>
        }
      >
        <p className="muted small">
          Google Calendar, Apple Calendar, Jira и Notion: подключение, импорт и
          отправка задач.
        </p>
        {integrations.error && (
          <ErrorNote message={integrations.error} onRetry={integrations.reload} />
        )}
        {integrations.data && (
          <ul className="simple-list">
            {integrations.data.map((item) => (
              <li key={item.slug}>
                <span className="truncate">{item.title}</span>
                {item.connection ? (
                  <Badge
                    tone={item.connection.status === "error" ? "bad" : "ok"}
                  >
                    {item.connection.status === "error" ? "ошибка" : "подключено"}
                  </Badge>
                ) : (
                  <Link
                    to="/integrations"
                    className="btn btn-ghost btn-sm h-8 px-3 text-xs"
                  >
                    Подключить
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

function TelegramSection() {
  const status = useAsync(() => api.telegram.status(), []);
  const history = useAsync(() => api.reminders.history(), []);
  const [link, setLink] = useState<TelegramLink | null>(null);
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());
  const { reload: reloadUser } = useAuth();

  const copy = (text: string) =>
    navigator.clipboard
      .writeText(text)
      .then(() => toast("Скопировано"))
      .catch(() => toast("Не удалось скопировать", "error"));

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
              <Badge tone="ok">подключён</Badge>{" "}
              {status.data.username
                ? `@${status.data.username}`
                : "чат привязан"}
              <span className="muted">
                {" "}
                · с {formatDateTime(status.data.linked_at)}
              </span>
            </p>
            <p className="muted small">
              Пишите боту планы обычными словами, голосом или файлом PDF/DOCX —
              события появятся в календаре. Спросите «что у меня завтра?», чтобы
              увидеть план.
            </p>
            <div className="button-row">
              <Button
                size="sm"
                icon="bell"
                busy={pending === "test"}
                onClick={() =>
                  run("test", async () => {
                    await api.reminders.test();
                    toast("Тестовое уведомление отправлено");
                    window.setTimeout(history.reload, 3000);
                  })
                }
              >
                Отправить тест
              </Button>
              <ConfirmButton
                size="sm"
                confirmLabel="Отвязать?"
                busy={pending === "unlink"}
                onConfirm={() =>
                  run("unlink", async () => {
                    await api.telegram.unlink();
                    await Promise.all([status.reload(), reloadUser()]);
                  })
                }
              >
                Отвязать
              </ConfirmButton>
            </div>
          </div>
        ) : (
          <div className="form">
            <p className="muted">
              Привяжите Telegram, чтобы планировать в чате с Dayla: пишите или
              надиктовывайте планы, спрашивайте о расписании и получайте
              напоминания и план на утро.
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
                    Открыть бота <Icon name="external" size={14} />
                  </a>
                )}
                <p className="small">
                  {link.deep_link
                    ? "Или отправьте боту команду:"
                    : "Отправьте боту команду:"}
                </p>
                <button
                  type="button"
                  className="code h-8 px-3 text-xs rounded-lg"
                  onClick={() => copy(`/start ${link.code}`)}
                  title="Скопировать"
                >
                  /start {link.code}
                </button>
                <p className="muted small">
                  Код действует до{" "}
                  {new Date(link.expires_at).toLocaleTimeString("ru-RU", {
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
                  Я отправил — проверить
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
                Подключить Telegram
              </Button>
            )}
          </div>
        )}

        {history.data && history.data.length > 0 && (
          <details className="history">
            <summary>Последние уведомления</summary>
            <ul>
              {history.data.map((item) => (
                <li key={item.id}>
                  <span className="history-text">{stripTags(item.text)}</span>
                  <span className="muted small">
                    {formatDateTime(item.sent_at ?? item.scheduled_for)} ·{" "}
                    <Badge
                      tone={
                        item.status === "sent"
                          ? "ok"
                          : item.status === "failed"
                          ? "bad"
                          : "neutral"
                      }
                    >
                      {item.status}
                    </Badge>
                    {item.error ? ` ${item.error}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </GlassCard>
    </div>
  );
}

function CalendarsSection() {
  const calendars = useAsync(() => api.calendars.list(), []);
  const [name, setName] = useState("");
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());

  const create = (event: FormEvent) => {
    event.preventDefault();
    run("create", async () => {
      await api.calendars.create({
        name: name.trim(),
        timezone: browserTimezone(),
      });
      setName("");
      await calendars.reload();
      toast("Календарь создан");
    });
  };

  const exportIcs = () =>
    run("export", async () => {
      const blob = await api.calendars.exportIcs();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "focus-day.ics";
      anchor.click();
      URL.revokeObjectURL(url);
    });

  return (
    <div id="calendars" className="anchor">
      <GlassCard
        title="Календари"
        actions={
          <Button
            size="sm"
            variant="ghost"
            icon="download"
            busy={pending === "export"}
            onClick={exportIcs}
          >
            Экспорт .ics
          </Button>
        }
      >
        {calendars.error && (
          <ErrorNote message={calendars.error} onRetry={calendars.reload} />
        )}
        {calendars.data && (
          <ul className="simple-list">
            {calendars.data.map((calendar) => (
              <li key={calendar.id}>
                <span className="truncate">{calendar.name}</span>
                <Badge>
                  {SOURCE_LABELS[calendar.provider] ?? calendar.provider}
                </Badge>
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
            placeholder="Новый календарь, например «Учёба»"
            maxLength={200}
            aria-label="Название календаря"
          />
          <Button
            size="sm"
            type="submit"
            icon="plus"
            busy={pending === "create"}
            disabled={!name.trim()}
          >
            Создать
          </Button>
        </form>
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
      <GlassCard title="Безопасность">
        <div className="button-row">
          <Button size="sm" icon="logout" onClick={() => logout()}>
            Выйти
          </Button>
          <ConfirmButton
            size="sm"
            confirmLabel="Выйти на всех устройствах?"
            onConfirm={() => logout(true)}
          >
            Выйти везде
          </ConfirmButton>
        </div>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Удаление аккаунта стирает все ваши задачи, файлы, переписку с ассистентом и подключения и отзывает доступ
          Dayla к Google Calendar. Отменить его нельзя. Подробнее — в{" "}
          <a href="/privacy-policy" className="text-sky-600 dark:text-sky-400 hover:underline">
            политике конфиденциальности
          </a>
          .
        </p>
        <div className="button-row mt-3">
          <ConfirmButton
            size="sm"
            icon="trash"
            busy={deleting}
            confirmLabel="Удалить аккаунт навсегда?"
            onConfirm={deleteAccount}
          >
            Удалить аккаунт
          </ConfirmButton>
        </div>
      </GlassCard>
    </div>
  );
}