// src/pages/IntegrationsPage.tsx
import { useState, useEffect, useRef, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
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

const GLASS_BODY = GLASS_BODY_FLAT;

const LOGOS: Record<string, string> = {
  google: "/images/google-calendar.png",
  yandex: "/images/yandexcalendar.png",
  jira: "/images/Jira_Software_Logo.svg",
  notion: "/images/Notion.png",
};

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google Calendar",
  yandex: "Яндекс Календарь",
  notion: "Notion",
  jira: "Jira",
};

const PAGE = "relative max-w-5xl mx-auto pt-[1.5vh]";

/* ─── Страница ──────────────────────────────────────────── */

export function IntegrationsPage() {
  useTitle("Интеграции");
  const integrations = useAsync(() => api.integrations.list(), []);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  // Бэкенд после OAuth-callback редиректит сюда с
  // ?connected=<provider> или ?error=<сообщение>.
  // Реагируем один раз: показываем тост, перезагружаем список
  // и убираем параметры из URL, чтобы F5 не повторял тост.
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const errorParam = searchParams.get("error");
    if (!connected && !errorParam) return;

    // Защита от повторного срабатывания (React 18 StrictMode, F5)
    const key = connected ?? errorParam ?? "";
    if (handledRef.current === key) return;
    handledRef.current = key;

    if (connected) {
      toast(`${PROVIDER_LABELS[connected] ?? connected} подключён`);
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
          "hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        )}
      >
        <Icon name="left" size={14} /> Аккаунт
      </Link>

      <PageHeader
        title="Интеграции"
        subtitle="Импортируйте события и задачи из сервисов и отправляйте события Dayla обратно."
      />

      {integrations.error && (
        <div className="mb-4">
          <ErrorNote message={integrations.error} onRetry={integrations.reload} />
        </div>
      )}

      {!integrations.data ? (
        integrations.loading && <Loading />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.data.map((item) => (
            <IntegrationCard
              key={item.slug}
              item={item}
              onEdit={() => setEditing(item)}
              onChanged={integrations.reload}
            />
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        title={editing ? `${editing.title}: подключение` : ""}
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

  // Для OAuth-провайдеров URL с правильными client_id, scope,
  // redirect_uri и подписанным state генерирует бэкенд.
  // Фронт только редиректит и передаёт return_to = текущий путь,
  // чтобы бэк вернул пользователя сюда же после callback.
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
      // Manual-ответ (не должно случиться для OAuth-провайдера)
      onChanged();
    });

  const status = !connection ? (
    <Badge>не подключено</Badge>
  ) : connection.status === "connected" ? (
    <Badge tone="ok">подключено</Badge>
  ) : (
    <Badge tone="bad">ошибка</Badge>
  );

  return (
    <GlassCard>
      <div className="flex items-center gap-3 mb-3">
        <span
          aria-hidden="true"
          className={cn(
            "relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden",
            "bg-white/[0.04] dark:bg-white/[0.02] backdrop-blur-3xl",
            "ring-1 ring-white/30 dark:ring-white/10"
          )}
        >
          {LOGOS[item.slug] ? (
            <img
              src={LOGOS[item.slug]}
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
        {item.description}
      </p>

      {connection && (
        <dl className="mb-3 space-y-1.5 text-xs">
          {connection.account_email && (
            <div className="flex gap-2 min-w-0">
              <dt className="shrink-0 text-gray-500 dark:text-gray-400">
                Аккаунт
              </dt>
              <dd className="truncate text-gray-900 dark:text-white">
                {connection.account_email}
              </dd>
            </div>
          )}
          <div className="flex gap-2 min-w-0">
            <dt className="shrink-0 text-gray-500 dark:text-gray-400">
              Синхронизация
            </dt>
            <dd className="text-gray-900 dark:text-white">
              {connection.last_sync_at
                ? formatDateTime(connection.last_sync_at)
                : "ещё не было"}
            </dd>
          </div>
        </dl>
      )}

      {connection?.last_sync_error && (
        <p className="mb-3 text-xs text-red-600 dark:text-red-400">
          {connection.last_sync_error}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {!connection ? (
          <Button
            variant="primary"
            size="sm"
            busy={pending === "connect"}
            onClick={item.auth_type === "oauth" ? connectOAuth : onEdit}
          >
            Подключить
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
                    `Получено ${result.fetched}: новых ${result.created}, обновлено ${result.updated}`
                  );
                  onChanged();
                })
              }
            >
              Синхронизировать
            </Button>
            <Button
              size="sm"
              variant="ghost"
              busy={pending === "test"}
              onClick={() =>
                run("test", async () => {
                  const result = await api.integrations.test(item.slug);
                  toast(`Работает: ${result.account}`);
                  onChanged();
                })
              }
            >
              Проверить
            </Button>
            {item.auth_type === "oauth" ? (
              <Button
                size="sm"
                variant="ghost"
                busy={pending === "connect"}
                onClick={connectOAuth}
              >
                Переподключить
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={onEdit}>
                Настройки
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
            удалить импортированные
          </label>
          <ConfirmButton
            size="sm"
            confirmLabel="Отключить?"
            busy={pending === "disconnect"}
            onConfirm={() =>
              run("disconnect", async () => {
                await api.integrations.disconnect(item.slug, purge);
                toast(`${item.title} отключён`);
                onChanged();
              })
            }
          >
            Отключить
          </ConfirmButton>
        </div>
      )}
    </GlassCard>
  );
}

/* ─── ConnectForm (для manual-провайдеров) ─────────────── */

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
      ])
    )
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
      toast(`${item.title} подключён`);
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
            label={field.label + (field.required ? "" : " (необязательно)")}
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
                  ? "Сохранено — оставьте пустым, чтобы не менять"
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
                "placeholder:text-gray-400 dark:placeholder:text-gray-500"
              )}
            />
          </Field>
        )
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
          {item.connection ? "Сохранить" : "Подключить"}
        </Button>
      </div>
    </form>
  );
}