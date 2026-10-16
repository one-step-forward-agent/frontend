// src/pages/IntegrationsPage.tsx
import { useState, useEffect, useRef, useMemo, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { TelegramPrompt } from "../components/TelegramPrompt";
import { AiChatTransfer } from "../components/AiChatTransfer";
import { Icon } from "../components/icons";
import type { Integration } from "../api/types";
import {
  Badge,
  Button,
  ConfirmButton,
  Dialog,
  ErrorNote,
  Field,
  Loading,
  PageHeader,
  Switch,
  useErrorToast,
  useToast,
} from "../components/ui";
import { errorText, formatDateTime } from "../lib/format";
import { useAction, useAsync } from "../lib/hooks";
import { Link, useTitle } from "../router";
import { cn } from "@/utils/cn";
import { GlassCard, GLASS_BODY_FLAT } from "@/components/dashboard/glass";
import { tr } from "@/i18n";

const GLASS_BODY = GLASS_BODY_FLAT;

/* ─── OAuth-провайдеры (совпадает с onboarding/Integrations.tsx) ─── */

type OAuthProvider = "google" | "yandex" | "notion" | "jira";

const OAUTH_INTEGRATIONS: Record<
  OAuthProvider,
  {
    title: string;
    description: string;
    src: string;
  }
> = {
  google: {
    title: "Google Calendar",
    description:
      tr("Двусторонняя синхронизация событий Google Calendar с Dayla.", "Two-way sync of Google Calendar events with Dayla."),
    src: "/images/google-calendar.png",
  },
  yandex: {
    title: tr("Яндекс Календарь", "Yandex Calendar"),
    description:
      tr("Импорт событий Яндекс Календаря в Dayla и экспорт обратно.", "Import Yandex Calendar events into Dayla and export them back."),
    src: "/images/yandexcalendar.png",
  },
  notion: {
    title: "Notion",
    description:
      tr("Записи из баз Notion с датой появляются в календаре Dayla, а задачи Dayla можно отправить в Notion. При подключении отметьте нужные базы.", "Entries with dates from your Notion databases appear in the Dayla calendar, and Dayla tasks can be sent to Notion. Pick the databases when connecting."),
    src: "/images/Notion.webp",
  },
  jira: {
    title: "Jira",
    description:
      tr("Ваши задачи Jira со сроком (Due date) появляются в календаре Dayla и обновляются при синхронизации.", "Your Jira issues with a due date appear in the Dayla calendar and update on every sync."),
    src: "/images/Jira_Software_Logo.svg",
  },
};

// Logos of services connected with a form rather than OAuth
const OTHER_LOGOS: Record<string, string> = {
  apple: "/images/apple-calendar.webp",
};

const isOAuth = (slug: string): slug is OAuthProvider =>
  slug in OAUTH_INTEGRATIONS;

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google Calendar",
  yandex: tr("Яндекс Календарь", "Yandex Calendar"),
  notion: "Notion",
  jira: "Jira",
};

const PAGE = "relative max-w-5xl mx-auto pt-[1.5vh]";

/* ─── Merge: OAuth из фронта + всё остальное с бэка ────── */

function mergeIntegrations(fromBackend: Integration[]): Integration[] {
  const bySlug = new Map<string, Integration>(
    fromBackend.map((item) => [item.slug, item]),
  );

  // Гарантируем, что все OAuth-провайдеры присутствуют на странице,
  // даже если бэкенд их пока не зарегистрировал (например, yandex).
  for (const slug of Object.keys(OAUTH_INTEGRATIONS) as OAuthProvider[]) {
    if (bySlug.has(slug)) continue;
    const meta = OAUTH_INTEGRATIONS[slug];
    bySlug.set(slug, {
      slug,
      title: meta.title,
      description: meta.description,
      auth_type: "oauth",
      supports_push: slug === "google" || slug === "yandex",
      fields: [],
      connection: null,
    } as unknown as Integration);
  }

  // Стабильный порядок: сначала OAuth (в порядке из OAUTH_INTEGRATIONS),
  // потом всё остальное.
  const ordered: Integration[] = [];
  for (const slug of Object.keys(OAUTH_INTEGRATIONS) as OAuthProvider[]) {
    const item = bySlug.get(slug);
    if (item) ordered.push(item);
    bySlug.delete(slug);
  }
  ordered.push(...bySlug.values());
  return ordered;
}

/* ─── Страница ──────────────────────────────────────────── */

export function IntegrationsPage() {
  useTitle(tr("Интеграции", "Integrations"));
  const integrations = useAsync(() => api.integrations.list(), []);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const merged = useMemo(
    () => (integrations.data ? mergeIntegrations(integrations.data) : []),
    [integrations.data],
  );

  // Возврат с OAuth: ?connected=<slug> или ?error=<сообщение>.
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorParam = searchParams.get("error");
    if (!connected && !errorParam) return;

    const key = connected ?? errorParam ?? "";
    if (handledRef.current === key) return;
    handledRef.current = key;

    if (connected) {
      toast(`${PROVIDER_LABELS[connected] ?? connected} ${tr("подключён", "connected")}`);
      integrations.reload();
    }
    if (errorParam) {
      toast(decodeURIComponent(errorParam));
    }

    const next = new URLSearchParams(searchParams);
    next.delete("connected");
    next.delete("error");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className={PAGE}>
      <Link
        to="/account#integrations"
        className={cn(
          "inline-flex items-center gap-1.5 mb-4 text-sm",
          "text-gray-500 dark:text-gray-400",
          "hover:text-gray-800 dark:hover:text-gray-200 transition-colors",
        )}
      >
        <Icon name="left" size={14} /> {tr("Аккаунт", "Account")}
      </Link>

      <PageHeader
        title={tr("Интеграции", "Integrations")}
        subtitle={tr("Импортируйте события и задачи из сервисов и отправляйте события Dayla обратно.", "Import events and tasks from other services and send Dayla events back.")}
      />

      <div className="mb-4">
        <TelegramPrompt place="integrations" closable={false} />
      </div>

      {integrations.error && (
        <div className="mb-4">
          <ErrorNote message={integrations.error} onRetry={integrations.reload} />
        </div>
      )}

      {!integrations.data ? (
        integrations.loading && <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {merged.map((item) => (
            <IntegrationCard
              key={item.slug}
              item={item}
              onEdit={() => setEditing(item)}
              onChanged={integrations.reload}
            />
          ))}
          <SamsungCard />
        </div>
      )}

      {integrations.data && (
        <div className="mt-4">
          <AiChatTransfer />
        </div>
      )}

      <Dialog
        open={editing !== null}
        title={editing ? `${editing.title}: ${tr("подключение", "connection")}` : ""}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ConnectForm
            item={editing}
            onDone={() => {
              setEditing(null);
              integrations.reload();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

/* ─── Samsung Calendar ──────────────────────────────────── */

// Samsung Calendar has no API of its own: it shows the calendars of the phone's accounts (Google) and subscriptions.
// So Dayla reaches it through the phone's Google account; the feed link is for apps that subscribe (Outlook, Apple).
function SamsungCard() {
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());
  const [path, setPath] = useState<string | null>(null);
  const url = path ? `${window.location.origin}${path}` : null;

  const load = (reset = false) =>
    run(reset ? "reset" : "link", async () => {
      const result = await api.calendars.feed(reset);
      setPath(result.path);
      if (reset) toast(tr("Новая ссылка готова, старая больше не работает", "The new link is ready; the old one no longer works"));
    });

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast(tr("Ссылка скопирована", "Link copied"));
    } catch {
      toast(tr("Не удалось скопировать — выделите ссылку вручную", "Could not copy — select the link by hand"));
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden="true"
          className={cn(
            "relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden",
            "bg-[#1428A0] text-white",
          )}
        >
          <Icon name="calendar" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white truncate">Samsung Calendar</h2>
          <div className="mt-1">
            <Badge>{url ? tr("ссылка готова", "link ready") : tr("через Google", "via Google")}</Badge>
          </div>
        </div>
      </div>

      <p className="mb-2 text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
        {tr("В обычном Samsung Calendar Dayla появляется через Google-аккаунт телефона — без сторонних приложений:", "Dayla shows up in the regular Samsung Calendar through the phone's Google account — no extra apps:")}
      </p>
      <ol className="mb-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed list-decimal pl-4">
        <li>{tr("Подключите выше Google Calendar.", "Connect Google Calendar above.")}</li>
        <li>
          {tr(
            "В Samsung Calendar: ☰ → ⚙ Настройки → Управление календарями (или «Календари») → включите календарь вашего Google-аккаунта. Если аккаунта нет — Настройки телефона → Учётные записи → Добавить → Google.",
            "In Samsung Calendar: ☰ → ⚙ Settings → Manage calendars (or “Calendars”) → turn on your Google account's calendar. No account there? Phone Settings → Accounts → Add → Google."
          )}
        </li>
        <li>{tr("Задачи из Dayla сразу появятся в Samsung Calendar, а события, созданные в нём в Google-календаре, — в Dayla.", "Dayla tasks will appear in Samsung Calendar right away, and events you create there in the Google calendar will appear in Dayla.")}</li>
      </ol>
      <p className="mb-3 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
        {tr(
          "Без Google: ссылка ниже — для подписки в Outlook, Apple Calendar и других приложениях. Samsung Calendar сам подписываться на ссылки не умеет — его календари приходят только из аккаунтов телефона.",
          "Without Google: the link below is for subscribing in Outlook, Apple Calendar and other apps. Samsung Calendar can't subscribe to links itself — its calendars only come from the phone's accounts."
        )}
      </p>

      {url && (
        <input
          readOnly
          value={url}
          aria-label={tr("Ссылка на календарь Dayla", "Dayla calendar link")}
          onFocus={(e) => e.currentTarget.select()}
          className="mb-3 w-full rounded-lg px-2.5 py-2 text-xs bg-white/50 dark:bg-white/5 ring-1 ring-white/30 dark:ring-white/10 text-gray-900 dark:text-white"
        />
      )}

      <div className="flex flex-wrap gap-2">
        {url ? (
          <>
            <Button variant="primary" size="sm" icon="clip" onClick={copy}>
              {tr("Скопировать ссылку", "Copy link")}
            </Button>
            <ConfirmButton
              size="sm"
              icon="sync"
              label={tr("Новая ссылка", "New link")}
              confirmLabel={tr("Старая перестанет работать", "The old one will stop working")}
              busy={pending === "reset"}
              onConfirm={() => load(true)}
            >
              {tr("Новая ссылка", "New link")}
            </ConfirmButton>
          </>
        ) : (
          <Button variant="primary" size="sm" icon="external" busy={pending === "link"} onClick={() => load()}>
            {tr("Получить ссылку", "Get the link")}
          </Button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
        {tr("Ссылка личная: по ней видно ваше расписание, не пересылайте её.", "The link is personal: it shows your schedule, so don't share it.")}
      </p>
    </GlassCard>
  );
}

/* ─── Apple Calendar through Google ─────────────────────── */

// The simplest way to see Dayla in Apple Calendar: Dayla syncs with Google, and Apple Calendar shows the Google
// account's calendars. The iCloud form below stays for those who keep their calendars in iCloud.
function AppleViaGoogle() {
  return (
    <details className="mb-3 rounded-xl p-3 bg-white/[0.04] dark:bg-white/[0.02] ring-1 ring-white/30 dark:ring-white/10 group" open>
      <summary className="cursor-pointer select-none text-xs font-medium text-gray-900 dark:text-white">
        {tr("Проще всего — через Google Calendar", "Easiest: through Google Calendar")}
      </summary>
      <ol className="mt-2 space-y-1.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed list-decimal pl-4">
        <li>{tr("Подключите выше Google Calendar — задачи Dayla попадут в ваш Google-календарь.", "Connect Google Calendar above — Dayla tasks will go to your Google calendar.")}</li>
        <li>
          {tr(
            "iPhone или iPad: Настройки → Приложения → Календарь → Учётные записи → Добавить учётную запись → Google. Войдите тем же Google-аккаунтом и включите «Календари». (На iOS 17 и раньше: Настройки → Календарь → Учётные записи.)",
            "iPhone or iPad: Settings → Apps → Calendar → Accounts → Add Account → Google. Sign in with the same Google account and turn on “Calendars”. (On iOS 17 and earlier: Settings → Calendar → Accounts.)"
          )}
        </li>
        <li>
          {tr(
            "Mac: Календарь → Настройки → Учётные записи → «+» → Google.",
            "Mac: Calendar → Settings → Accounts → “+” → Google."
          )}
        </li>
        <li>
          {tr(
            "Чтобы события, созданные на iPhone, тоже попадали в Dayla: Настройки → Календарь → Календарь по умолчанию → выберите Google-календарь.",
            "So that events you create on the iPhone reach Dayla too: Settings → Calendar → Default Calendar → pick the Google calendar."
          )}
        </li>
      </ol>
      <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
        {tr("Календари в iCloud? Подключите их напрямую кнопкой ниже — понадобится пароль приложения Apple ID.", "Calendars in iCloud? Connect them directly with the button below — you'll need an Apple ID app-specific password.")}
      </p>
    </details>
  );
}

/* ─── IntegrationCard ───────────────────────────────────── */

function IntegrationCard({
  item,
  onEdit,
  onChanged,
}: {
  item: Integration;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const connection = item.connection;
  const toast = useToast();
  const { pending, run } = useAction(useErrorToast());
  const [purge, setPurge] = useState(false);

  // OAuth by the page's own list (google, yandex, notion, jira); the others are connected with a form
  const oauth = isOAuth(item.slug);

  const connectOAuth = () =>
    run("connect", async () => {
      const result = await api.integrations.connect(
        item.slug,
        {},
        window.location.pathname,
      );
      if ("authorization_url" in result) {
        window.location.assign(result.authorization_url);
        return;
      }
      onChanged();
    });

  const status = !connection ? (
    <Badge>{tr("не подключено", "not connected")}</Badge>
  ) : connection.status === "connected" ? (
    <Badge tone="ok">{tr("подключено", "connected")}</Badge>
  ) : (
    <Badge tone="bad">{tr("ошибка", "error")}</Badge>
  );

  const logoSrc = isOAuth(item.slug)
    ? OAUTH_INTEGRATIONS[item.slug].src
    : OTHER_LOGOS[item.slug];
  // The page's own wording for OAuth services: the backend's mentions signing in with them, which is off
  const description = isOAuth(item.slug) ? OAUTH_INTEGRATIONS[item.slug].description : item.description;

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden="true"
          className={cn(
            "relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden",
            "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-xl",
            "ring-1 ring-white/30 dark:ring-white/10",
          )}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className="w-6 h-6 object-contain select-none pointer-events-none"
              loading="lazy"
            />
          ) : (
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {item.title.charAt(0)}
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {item.title}
          </h2>
          <div className="mt-1">{status}</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
        {description}
      </p>

      {item.slug === "apple" && <AppleViaGoogle />}

      {connection && (
        <dl className="mb-3 space-y-1.5 text-xs">
          {connection.account_email && (
            <div className="flex gap-2 min-w-0">
              <dt className="shrink-0 text-gray-500 dark:text-gray-400">
                {tr("Аккаунт", "Account")}
              </dt>
              <dd className="truncate text-gray-900 dark:text-white">
                {connection.account_email}
              </dd>
            </div>
          )}
          <div className="flex gap-2 min-w-0">
            <dt className="shrink-0 text-gray-500 dark:text-gray-400">
              {tr("Синхронизация", "Sync")}
            </dt>
            <dd className="text-gray-900 dark:text-white">
              {connection.last_sync_at
                ? formatDateTime(connection.last_sync_at)
                : tr("ещё не было", "not yet")}
            </dd>
          </div>
        </dl>
      )}

      {connection?.last_sync_error && (
        <p className="mb-3 text-xs text-red-600 dark:text-red-400">
          {connection.last_sync_error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {!connection ? (
          <Button
            variant="primary"
            size="sm"
            busy={pending === "connect"}
            onClick={oauth ? connectOAuth : onEdit}
          >
            {tr("Подключить", "Connect")}
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              icon="sync"
              busy={pending === "sync"}
              onClick={() =>
                run("sync", async () => {
                  const result = await api.integrations.sync(item.slug);
                  toast(
                    tr(
                      `Получено ${result.fetched}: новых ${result.created}, обновлено ${result.updated}`,
                      `Fetched ${result.fetched}: ${result.created} new, ${result.updated} updated`,
                    ),
                  );
                  onChanged();
                })
              }
            >
              {tr("Синхронизировать", "Sync")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              busy={pending === "test"}
              onClick={() =>
                run("test", async () => {
                  const result = await api.integrations.test(item.slug);
                  toast(`${tr("Работает", "Working")}: ${result.account}`);
                  onChanged();
                })
              }
            >
              {tr("Проверить", "Test")}
            </Button>
            {oauth ? (
              <Button
                size="sm"
                variant="ghost"
                busy={pending === "connect"}
                onClick={connectOAuth}
              >
                {tr("Переподключить", "Reconnect")}
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={onEdit}>
                {tr("Настройки", "Settings")}
              </Button>
            )}
          </>
        )}
      </div>

      {connection && (
        <div className="mt-4 pt-3 border-t border-white/20 dark:border-white/10 flex items-center justify-between gap-2">
          <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={purge}
              onChange={(e) => setPurge(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-sky-500"
            />
            {tr("удалить импортированные", "delete imported")}
          </label>
          <ConfirmButton
            size="sm"
            confirmLabel={tr("Отключить?", "Disconnect?")}
            busy={pending === "disconnect"}
            onConfirm={() =>
              run("disconnect", async () => {
                await api.integrations.disconnect(item.slug, purge);
                toast(`${item.title} ${tr("отключён", "disconnected")}`);
                onChanged();
              })
            }
          >
            {tr("Отключить", "Disconnect")}
          </ConfirmButton>
        </div>
      )}
    </GlassCard>
  );
}

/* ─── ConnectForm (только для manual-провайдеров) ─────── */

function ConnectForm({
  item,
  onDone,
}: {
  item: Integration;
  onDone: () => void;
}) {
  const config = item.connection?.config ?? {};
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      item.fields.map((field) => [
        field.name,
        field.secret
          ? ""
          : config[field.name] ??
            field.default ??
            (field.type === "checkbox" ? false : ""),
      ]),
    ),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.integrations.connect(item.slug, values);
      toast(`${item.title} ${tr("подключён", "connected")}`);
      onDone();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        {item.description}
      </p>

      {item.fields.map((field) =>
        field.type === "checkbox" ? (
          <Switch
            key={field.name}
            label={field.label}
            hint={field.help}
            checked={Boolean(values[field.name])}
            onChange={(checked) =>
              setValues((current) => ({ ...current, [field.name]: checked }))
            }
          />
        ) : (
          <Field
            key={field.name}
            label={field.label + (field.required ? "" : tr(" (необязательно)", " (optional)"))}
            hint={field.help || undefined}
          >
            <input
              type={
                field.type === "password"
                  ? "password"
                  : field.type === "url"
                    ? "url"
                    : "text"
              }
              value={String(values[field.name] ?? "")}
              placeholder={
                field.secret && item.connection
                  ? tr("Сохранено — оставьте пустым, чтобы не менять", "Saved — leave empty to keep it")
                  : field.placeholder
              }
              required={field.required && !(field.secret && item.connection)}
              autoComplete={field.secret ? "new-password" : "off"}
              onChange={(e) =>
                setValues((current) => ({
                  ...current,
                  [field.name]: e.target.value,
                }))
              }
              className={cn(
                "w-full h-9 px-3 text-sm rounded-lg",
                "bg-white/[0.05] dark:bg-white/[0.02]",
                "ring-1 ring-white/20 dark:ring-white/10",
                "outline-none focus:ring-sky-400/50",
                "text-gray-900 dark:text-white",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              )}
            />
          </Field>
        ),
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          busy={busy}
          icon="check"
        >
          {item.connection ? tr("Сохранить", "Save") : tr("Подключить", "Connect")}
        </Button>
      </div>
    </form>
  );
}