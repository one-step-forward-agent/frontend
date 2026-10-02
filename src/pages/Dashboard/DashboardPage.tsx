// src/pages/Dashboard/DashboardPage.tsx
import * as React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Sun,
  Calendar as CalendarIcon,
  MessageCircle,
  ListTodo,
  BarChart3,
  User as UserIcon,
  Plus,
  SlidersHorizontal,
  Menu,
  X,
  Settings,
  LogOut,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/utils/cn";

// ---------- Навигация ----------

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard/today", label: "Сегодня", icon: Sun },
  { to: "/dashboard/calendar", label: "Календарь", icon: CalendarIcon },
  { to: "/dashboard/chat", label: "Чат", icon: MessageCircle },
  { to: "/dashboard/tasks", label: "Задачи", icon: ListTodo },
  { to: "/dashboard/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/dashboard/account", label: "Аккаунт", icon: UserIcon },
];

const SECTION_TITLES: Record<string, string> = {
  today: "Сегодня",
  calendar: "Календарь",
  chat: "Чат с Deyla",
  tasks: "Задачи",
  analytics: "Аналитика",
  account: "Аккаунт",
};

const useCurrentSection = () => {
  const { pathname } = useLocation();
  const seg = pathname.split("/").filter(Boolean).pop() ?? "today";
  return SECTION_TITLES[seg] ?? "Сегодня";
};

const useCreateTask = () => {
  const navigate = useNavigate();
  return () => navigate("/dashboard/tasks?new=1");
};

// Форматирование даты в шапке
const formatToday = () => {
  const d = new Date();
  return d.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

// ---------- Логотип ----------

const Logo: React.FC<{ size?: "sm" | "md" }> = ({ size = "md" }) => (
  <div className="flex items-center gap-2.5">
    <div
      aria-hidden="true"
      className={cn(
        "rounded-lg flex items-center justify-center text-white",
        "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600",
        "shadow-md shadow-blue-500/20",
        size === "sm" ? "w-7 h-7" : "w-8 h-8"
      )}
    >
      <Sparkles size={size === "sm" ? 13 : 15} />
    </div>
    <span
      className={cn(
        "font-semibold tracking-tight",
        size === "sm" ? "text-sm" : "text-base"
      )}
    >
      Deyla
    </span>
  </div>
);

// ---------- Ссылка навигации (desktop) ----------

const NavItemLink: React.FC<NavItem & { onNavigate?: () => void }> = ({
  to,
  label,
  icon: Icon,
  onNavigate,
}) => (
  <NavLink
    to={to}
    onClick={onNavigate}
    className={({ isActive }) =>
      cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
        "transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 text-blue-700 dark:text-blue-300 shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
      )
    }
  >
    {({ isActive }) => (
      <>
        {/* Активная полоска слева */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300",
            isActive
              ? "h-6 bg-gradient-to-b from-blue-500 to-indigo-600"
              : "h-0 bg-transparent"
          )}
        />

        <Icon
          size={18}
          className={cn(
            "shrink-0 transition-transform duration-200",
            isActive ? "scale-105" : "group-hover:scale-105"
          )}
          aria-hidden="true"
        />
        <span className="flex-1">{label}</span>
      </>
    )}
  </NavLink>
);

// ---------- Основной компонент ----------

export const DashboardPage: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const sectionTitle = useCurrentSection();
  const createTask = useCreateTask();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const initials = React.useMemo(() => {
    const source = user?.name?.trim() || user?.email || "?";
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }, [user?.name, user?.email]);

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Профиль";

  // Закрытие mobile nav при смене раздела
  const closeMobileNav = () => setMobileNavOpen(false);

  // Прогресс — заглушка
  const progress = 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="flex">
        {/* ═══════════ Сайдбар (desktop) ═══════════ */}
        <aside
          className="hidden md:flex md:flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
          aria-label="Основная навигация"
        >
          {/* Логотип */}
          <div className="px-5 pt-6 pb-5">
            <Logo />
          </div>

          {/* Навигация */}
          <nav className="flex-1 px-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavItemLink key={item.to} {...item} />
            ))}
          </nav>

          {/* Меню пользователя */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800">
            <UserMenu
              initials={initials}
              name={displayName}
              email={user?.email}
              onLogout={logout}
              onNavigate={(to) => navigate(to)}
            />
          </div>
        </aside>

        {/* ═══════════ Мобильный drawer ═══════════ */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Мобильная навигация"
          >
            {/* Оверлей */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={closeMobileNav}
              aria-hidden="true"
            />

            {/* Панель */}
            <aside
              className={cn(
                "absolute left-0 top-0 bottom-0 w-72 max-w-[85vw]",
                "bg-white dark:bg-gray-950",
                "border-r border-gray-200 dark:border-gray-800",
                "p-4 flex flex-col",
                "animate-in slide-in-from-left duration-300"
              )}
            >
              <div className="flex items-center justify-between mb-5">
                <Logo size="sm" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeMobileNav}
                  aria-label="Закрыть меню"
                >
                  <X size={18} />
                </Button>
              </div>

              <nav className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <NavItemLink
                    key={item.to}
                    {...item}
                    onNavigate={closeMobileNav}
                  />
                ))}
              </nav>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <UserMenu
                  initials={initials}
                  name={displayName}
                  email={user?.email}
                  onLogout={logout}
                  onNavigate={(to) => {
                    closeMobileNav();
                    navigate(to);
                  }}
                />
              </div>
            </aside>
          </div>
        )}

        {/* ═══════════ Правая часть: хедер + контент ═══════════ */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 px-4 md:px-6 py-3">
              {/* Бургер — mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Открыть меню"
              >
                <Menu size={20} />
              </Button>

              {/* Заголовок + дата */}
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-semibold truncate">
                  {sectionTitle}
                </h1>
                <p className="hidden md:block text-[11px] text-gray-500 dark:text-gray-400 capitalize">
                  {formatToday()}
                </p>
              </div>

              {/* Прогресс дня */}
              <div className="hidden lg:flex items-center gap-2 ml-4">
                <div className="relative h-1.5 w-24 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {progress}%
                </span>
              </div>

              <div className="flex-1" />

              {/* Кнопка фильтра */}
              <Button
                variant="secondary"
                size="sm"
                className="hidden sm:inline-flex"
                aria-label="Фильтр сфер и календарей"
              >
                <SlidersHorizontal size={16} className="mr-2" />
                <span className="hidden lg:inline">Сферы и календари</span>
                <span className="lg:hidden">Фильтр</span>
              </Button>

              {/* Добавить задачу */}
              <Button size="sm" onClick={createTask}>
                <Plus size={16} className="sm:mr-1.5" />
                <span className="hidden sm:inline">Добавить</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 md:px-6 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

// ---------- Меню пользователя ----------

interface UserMenuProps {
  initials: string;
  name: string;
  email?: string;
  onLogout: () => void;
  onNavigate: (to: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  initials,
  name,
  email,
  onLogout,
  onNavigate,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={cn(
          "group flex w-full items-center gap-3 px-2 py-2 rounded-xl",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          "transition-colors text-left"
        )}
      >
        <Avatar className="h-8 w-8 shrink-0 ring-2 ring-white/60 dark:ring-gray-900/60">
          <AvatarFallback className="text-xs">{initials || "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
            {name}
          </p>
          {email && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {email}
            </p>
          )}
        </div>
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel>Аккаунт</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuItem onSelect={() => onNavigate("/dashboard/account")}>
        <Settings size={16} className="mr-2" />
        Настройки
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        onSelect={onLogout}
        className="text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300"
      >
        <LogOut size={16} className="mr-2" />
        Выйти
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default DashboardPage;