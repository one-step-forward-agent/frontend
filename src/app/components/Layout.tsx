import { Sparkles } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { ThemeToggle } from "@/theme";
import { useAuth, useSignOut } from "../auth";
import { Link, navigate, useLocation } from "../router";
import { Icon, type IconName } from "./icons";
import { ErrorBoundary, useToast } from "./ui";

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/", label: "Сегодня", icon: "today" },
  { to: "/calendar", label: "Календарь", icon: "calendar" },
  { to: "/tasks", label: "Задачи", icon: "tasks" },
  { to: "/assistant", label: "Ассистент", icon: "assistant" },
  { to: "/integrations", label: "Интеграции", icon: "integrations" },
  { to: "/settings", label: "Настройки", icon: "settings" },
];

// Нижнее меню на телефоне: настройки — в шапке, сервисы — в настройках; «＋» посередине, под большим пальцем
const TABS_LEFT = NAV.slice(0, 2);
const TABS_RIGHT = NAV.slice(2, 4);

const isActive = (to: string, path: string) => (to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`));

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="brand">
      <span className="brand-mark" aria-hidden="true">
        <Sparkles size={16} strokeWidth={2} />
      </span>
      Dayla
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const signOut = useSignOut();
  const { path, query } = useLocation();
  const toast = useToast();

  const connected = query.get("connected");
  useEffect(() => {
    if (connected === "google") {
      toast("Google Calendar подключён");
      navigate("/integrations", { replace: true });
    }
  }, [connected, toast]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <Link to="/events/new" className="btn btn-primary btn-md new-event">
          <Icon name="plus" size={18} /> Новая задача
        </Link>
        <nav aria-label="Разделы">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={`nav-link ${isActive(item.to, path) ? "active" : ""}`} aria-current={isActive(item.to, path) ? "page" : undefined}>
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar" aria-hidden="true">
            {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-text">
            <span className="truncate">{user?.name || "Без имени"}</span>
            <span className="truncate muted">{user?.email}</span>
          </div>
          <ThemeToggle />
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => signOut()} aria-label="Выйти" title="Выйти">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <ThemeToggle />
          <Link to="/settings" className={`btn btn-ghost btn-sm btn-icon ${isActive("/settings", path) ? "active" : ""}`} aria-label="Настройки">
            <Icon name="settings" size={18} />
          </Link>
        </div>
      </header>

      <main className="content" id="content">
        <ErrorBoundary key={path}>{children}</ErrorBoundary>
      </main>

      <nav className="tabbar" aria-label="Разделы">
        {TABS_LEFT.map((item) => (
          <Tab key={item.to} {...item} active={isActive(item.to, path)} />
        ))}
        <Link to="/events/new" className="tab-add" aria-label="Новая задача">
          <span>
            <Icon name="plus" size={24} />
          </span>
        </Link>
        {TABS_RIGHT.map((item) => (
          <Tab key={item.to} {...item} active={isActive(item.to, path)} />
        ))}
      </nav>
    </div>
  );
}

function Tab({ to, label, icon, active }: { to: string; label: string; icon: IconName; active: boolean }) {
  return (
    <Link to={to} className={`tab ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}>
      <Icon name={icon} size={22} />
      <span>{label}</span>
    </Link>
  );
}
