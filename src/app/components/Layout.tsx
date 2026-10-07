import { Sparkles } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { ThemeToggle } from "@/theme";
import type { User } from "../api/types";
import { useAuth, useSignOut } from "../auth";
import { Link, navigate, useLocation } from "../router";
import { Icon, type IconName } from "./icons";
import { ErrorBoundary, useToast } from "./ui";

type NavItem = { to: string; label: string; icon: IconName; main?: boolean };

// Ассистент — главная функция: в середине нижнего меню и выделен в боковом
const NAV: NavItem[] = [
  { to: "/", label: "Сегодня", icon: "today" },
  { to: "/calendar", label: "Календарь", icon: "calendar" },
  { to: "/assistant", label: "Ассистент", icon: "assistant", main: true },
  { to: "/tasks", label: "Задачи", icon: "tasks" },
  { to: "/integrations", label: "Интеграции", icon: "integrations" },
];

// Нижнее меню на телефоне: ассистент посередине, под большим пальцем; настройки — внутри аккаунта
const TABS: NavItem[] = [NAV[0], NAV[1], NAV[2], NAV[3], { to: "/account", label: "Аккаунт", icon: "user" }];
// Страницы, где плавающая «＋» мешала бы: у чата своя строка ввода, у формы — свои кнопки
const NO_FAB = ["/assistant", "/events/new", "/account", "/settings"];

const isActive = (to: string, path: string) =>
  to === "/" ? path === "/" : path === to || path.startsWith(`${to}/`) || (to === "/account" && path === "/settings");

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

export function Avatar({ user, size = 34 }: { user: User | null | undefined; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size }} aria-hidden="true">
      {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
    </span>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const signOut = useSignOut();
  const { path, query } = useLocation();
  const toast = useToast();
  const accountActive = isActive("/account", path);

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
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${item.main ? "nav-main" : ""} ${isActive(item.to, path) ? "active" : ""}`}
              aria-current={isActive(item.to, path) ? "page" : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-user">
          <Link to="/account" className={`sidebar-account ${accountActive ? "active" : ""}`} aria-current={accountActive ? "page" : undefined} title="Аккаунт и настройки">
            <Avatar user={user} />
            <span className="sidebar-user-text">
              <span className="truncate">{user?.name || "Аккаунт"}</span>
              <span className="truncate muted">{user?.email}</span>
            </span>
          </Link>
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
        </div>
      </header>

      <main className="content" id="content">
        <ErrorBoundary key={path}>{children}</ErrorBoundary>
      </main>

      {!NO_FAB.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)) && (
        <Link to="/events/new" className="fab" aria-label="Новая задача">
          <Icon name="plus" size={24} />
        </Link>
      )}

      <nav className="tabbar" aria-label="Разделы">
        {TABS.map((item) =>
          item.main ? (
            <Link key={item.to} to={item.to} className={`tab tab-main ${isActive(item.to, path) ? "active" : ""}`} aria-current={isActive(item.to, path) ? "page" : undefined}>
              <span className="tab-main-icon">
                <Icon name={item.icon} size={24} />
              </span>
              <span>{item.label}</span>
            </Link>
          ) : (
            <Tab key={item.to} {...item} active={isActive(item.to, path)} />
          ),
        )}
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
