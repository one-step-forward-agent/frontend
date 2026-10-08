// src/components/ui.tsx
import {
  Component,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "./icons";

/* ─── Мини-утилита для склейки классов ──────────────────── */
type ClassValue = string | number | false | null | undefined;

const cx = (...parts: (ClassValue | ClassValue[])[]): string => {
  const out: string[] = [];
  for (const part of parts) {
    if (Array.isArray(part)) {
      for (const p of part) {
        if (p != null && p !== false && p !== "") out.push(String(p));
      }
    } else if (part != null && part !== false && part !== "") {
      out.push(String(part));
    }
  }
  return out.join(" ");
};

/* ─── Liquid Glass — единый стиль ────────────────────────── */
const GLASS_BODY =
  "bg-white/[0.06] dark:bg-white/[0.02] backdrop-blur-xl " +
  "ring-1 ring-white/30 dark:ring-white/10 " +
  "shadow-[0_4px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(15,23,42,0.06)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.3)]";

const GLASS_BODY_ERROR =
  "bg-red-500/[0.08] dark:bg-red-500/[0.05] backdrop-blur-xl " +
  "ring-1 ring-red-400/40 dark:ring-red-400/30 " +
  "shadow-[0_4px_24px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.6)] " +
  "dark:shadow-[0_4px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]";

const GLASS_SHEEN =
  "pointer-events-none absolute inset-0 " +
  "bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_25%,transparent_45%,transparent_75%,rgba(147,197,253,0.05)_100%)]";

const GLASS_ACTIVE_RING =
  "0 0 0 1.5px rgba(56,189,248,0.6), 0 4px 24px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(15,23,42,0.06)";

/* ─── Toasts ─────────────────────────────────────────────── */
type ToastKind = "info" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

const ToastContext = createContext<(text: string, kind?: ToastKind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((text: string, kind: ToastKind = "info") => {
    const id = ++nextId.current;
    setToasts((items) => [...items.slice(-2), { id, kind, text }]);
    window.setTimeout(
      () => setToasts((items) => items.filter((item) => item.id !== id)),
      kind === "error" ? 6000 : 3500
    );
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cx(
              "relative overflow-hidden rounded-2xl px-4 py-3 text-sm pointer-events-auto",
              "min-w-[240px] max-w-[380px]",
              toast.kind === "error"
                ? cx(GLASS_BODY_ERROR, "text-red-700 dark:text-red-200")
                : cx(GLASS_BODY, "text-gray-800 dark:text-gray-100")
            )}
          >
            <span aria-hidden="true" className={GLASS_SHEEN} />
            <div className="relative flex items-start gap-2">
              {toast.kind === "error" && (
                <Icon name="close" size={14} className="mt-0.5 shrink-0" />
              )}
              <span>{toast.text}</span>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export function useErrorToast() {
  const toast = useToast();
  return useCallback((message: string) => toast(message, "error"), [toast]);
}

/* ─── Button ─────────────────────────────────────────────── */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  icon?: IconName;
  busy?: boolean;
  size?: ButtonSize;
};

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: cx(
  // ─── Стеклянное тело с лёгким голубым оттенком ───
  "text-sky-800 dark:text-sky-100",
  "bg-sky-500/20 dark:bg-sky-400/15",
  "backdrop-blur-xl",
  "ring-1 ring-sky-400/40 dark:ring-sky-400/30",
  "shadow-[0_4px_14px_rgba(56,189,248,0.15),inset_0_1px_0_rgba(255,255,255,0.6)]",
  "dark:shadow-[0_4px_14px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]",
  // ─── На hover — чуть плотнее, но без «вспышки» ───
  "hover:bg-sky-500/30 dark:hover:bg-sky-400/20",
  "hover:ring-sky-400/60 dark:hover:ring-sky-400/50"
),
  secondary: cx(
    GLASS_BODY,
    "text-gray-800 dark:text-gray-100",
    "hover:-translate-y-0.5 hover:bg-white/10 dark:hover:bg-white/[0.05]"
  ),
  ghost: cx(
    "text-gray-700 dark:text-gray-200",
    "bg-transparent hover:bg-white/10 dark:hover:bg-white/[0.05]",
    "ring-1 ring-transparent hover:ring-white/30 dark:hover:ring-white/10"
  ),
  danger: cx(
    "text-red-700 dark:text-red-200",
    "bg-red-500/10 dark:bg-red-500/[0.08]",
    "ring-1 ring-red-400/40 dark:ring-red-400/30",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
    "hover:bg-red-500/20"
  ),
};

export function Button({
  variant = "secondary",
  icon,
  busy,
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isIconOnly = !children;
  const dimension = size === "sm" ? "h-8 min-w-8" : "h-10 min-w-10";
  const padding = isIconOnly ? "px-0" : size === "sm" ? "px-3" : "px-4";
  const text = size === "sm" ? "text-xs" : "text-sm";

  const showSheen = variant === "secondary";

  return (
    <button
      type="button"
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cx(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden",
        "rounded-xl font-medium",
        "transition-all duration-200",
        "disabled:opacity-50 disabled:pointer-events-none",
        dimension,
        padding,
        text,
        BUTTON_VARIANT[variant],
        className
      )}
      {...props}
    >
      {showSheen && <span aria-hidden="true" className={GLASS_SHEEN} />}

      {busy ? (
        <span className="spinner relative" aria-hidden="true" />
      ) : (
        icon && (
          <Icon
            name={icon}
            size={size === "sm" ? 16 : 18}
            className="relative"
          />
        )
      )}
      {children && <span className="relative inline-flex items-center">{children}</span>}
    </button>
  );
}

/* ─── PageHeader ─────────────────────────────────────────── */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header
      className={cx(
        "relative overflow-hidden rounded-2xl mb-6",
        GLASS_BODY
      )}
    >
      <span aria-hidden="true" className={GLASS_SHEEN} />
      <div className="relative flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

/* ─── Card ───────────────────────────────────────────────── */
export function Card({
  title,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        "relative overflow-hidden rounded-2xl",
        GLASS_BODY,
        className
      )}
    >
      <span aria-hidden="true" className={GLASS_SHEEN} />
      <div className="relative p-4 sm:p-5">
        {(title || actions) && (
          <div className="mb-4 flex items-center justify-between gap-3">
            {title && (
              <h2 className="font-medium text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/* ─── Empty ──────────────────────────────────────────────── */
export function Empty({
  icon = "calendar",
  title,
  children,
}: {
  icon?: IconName;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl",
        "flex flex-col items-center text-center",
        "px-6 py-10",
        GLASS_BODY
      )}
    >
      <span aria-hidden="true" className={GLASS_SHEEN} />
      <span
        aria-hidden="true"
        className={cx(
          "relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden mb-3",
          "bg-white/[0.03] dark:bg-white/[0.01] backdrop-blur-xl",
          "ring-1 ring-white/30 dark:ring-white/10",
          "text-sky-600 dark:text-sky-300",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
        )}
      >
        <Icon name={icon} size={24} className="relative" />
      </span>
      <p className="relative font-medium text-gray-900 dark:text-white">
        {title}
      </p>
      {children && (
        <div className="relative text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Loading ────────────────────────────────────────────── */
export function Loading({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-6"
      role="status"
    >
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/* ─── ErrorNote ──────────────────────────────────────────── */
export function ErrorNote({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className={cx(
        "relative overflow-hidden rounded-xl",
        "flex items-center justify-between gap-2",
        "px-3 py-1.5 text-xs",
        GLASS_BODY_ERROR,
        "text-red-700 dark:text-red-200"
      )}
    >
      <span aria-hidden="true" className={GLASS_SHEEN} />
      <span className="relative flex-1 leading-snug">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cx(
            "relative shrink-0",
            "px-2 h-6 rounded-md text-[11px] font-medium",
            "text-red-700 dark:text-red-200",
            "hover:bg-red-100/0 transition-colors"
          )}
        >
          Повторить
        </button>
      )}
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────── */
type BadgeTone = "neutral" | "ok" | "warn" | "bad" | "accent";

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: "text-gray-700 dark:text-gray-300",
  ok: "text-emerald-700 dark:text-emerald-300 ring-emerald-400/40 dark:ring-emerald-400/30 bg-emerald-500/[0.10] dark:bg-emerald-500/[0.08]",
  warn: "text-amber-700 dark:text-amber-300 ring-amber-400/40 dark:ring-amber-400/30 bg-amber-500/[0.10] dark:bg-amber-500/[0.08]",
  bad: "text-red-700 dark:text-red-300 ring-red-400/40 dark:ring-red-400/30 bg-red-500/[0.10] dark:bg-red-500/[0.08]",
  accent: "text-sky-700 dark:text-sky-300 ring-sky-400/40 dark:ring-sky-400/30 bg-sky-500/[0.10] dark:bg-sky-500/[0.08]",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "relative inline-flex items-center gap-1.5 overflow-hidden",
        "px-2.5 py-0.5 rounded-full text-xs font-medium",
        tone === "neutral"
          ? cx(GLASS_BODY, BADGE_TONE.neutral)
          : cx(
              "ring-1",
              BADGE_TONE[tone],
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            )
      )}
    >
      {tone === "neutral" && <span aria-hidden="true" className={GLASS_SHEEN} />}
      <span className="relative">{children}</span>
    </span>
  );
}

/* ─── Field ──────────────────────────────────────────────── */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          {hint}
        </span>
      )}
    </label>
  );
}

/* ─── Switch ─────────────────────────────────────────────── */
export function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cx(
          "relative shrink-0 w-11 h-6 rounded-full overflow-hidden transition-colors duration-200",
          "ring-1",
          checked
            ? [
                "bg-sky-500/60 ring-sky-400/60",
                "shadow-[0_4px_14px_rgba(56,189,248,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]",
              ]
            : [
                "bg-white/[0.06] dark:bg-white/[0.02]",
                "backdrop-blur-xl",
                "ring-white/30 dark:ring-white/10",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]",
              ]
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white",
            "shadow-[0_2px_6px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]",
            "transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-800 dark:text-gray-100">
          {label}
        </span>
        {hint && (
          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}

/* ─── Dialog ─────────────────────────────────────────────── */
export function Dialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto p-0 bg-transparent border-none max-w-lg w-[calc(100%-2rem)]"
    >
      <div
        className={cx(
          "relative overflow-hidden rounded-2xl",
          GLASS_BODY
        )}
      >
        <span aria-hidden="true" className={GLASS_SHEEN} />
        <div className="relative p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-medium text-gray-900 dark:text-white">
              {title}
            </h2>
            <Button
              variant="ghost"
              icon="close"
              aria-label="Закрыть"
              onClick={onClose}
              size="sm"
            />
          </div>
          {open && children}
        </div>
      </div>
    </dialog>
  );
}

/* ─── ConfirmButton ──────────────────────────────────────── */
export function ConfirmButton({
  children,
  label,
  confirmLabel = "Точно?",
  onConfirm,
  busy,
  icon,
  size,
}: {
  children?: ReactNode;
  label?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  busy?: boolean;
  icon?: IconName;
  size?: ButtonSize;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return armed ? (
    <Button
      variant="danger"
      size={size}
      busy={busy}
      icon={icon}
      onClick={() => {
        setArmed(false);
        onConfirm();
      }}
    >
      {confirmLabel}
    </Button>
  ) : (
    <Button
      variant="ghost"
      size={size}
      busy={busy}
      icon={icon}
      aria-label={label}
      title={label}
      onClick={() => setArmed(true)}
    >
      {children}
    </Button>
  );
}

/* ─── ErrorBoundary ──────────────────────────────────────── */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // The user sees a plain message; the details are for developers
    console.error(error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <ErrorNote
          message="Что-то пошло не так. Обновите страницу."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
}