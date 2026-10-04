// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  CreditCard, LayoutDashboard, Package, FileText, Image,
  BarChart3, User, LogOut, Menu, X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard',        label: 'Дашборд',       icon: LayoutDashboard },
    { to: '/goods',            label: 'Товары',        icon: Package },
    { to: '/seo',              label: 'SEO-генерация', icon: FileText },
    { to: '/infographics',     label: 'Инфографика',   icon: Image },
    { to: '/reports',          label: 'Отчёты',        icon: BarChart3 },
    { to: '/profile',          label: 'Профиль',       icon: User },
    { to: '/dashboard/pricing',label: 'Тарифы',        icon: CreditCard },
  ];

  return (
    <div
      className={cn(
        "relative flex h-screen overflow-hidden",
        // ─── Нейтральный фон страницы ───
        "bg-slate-50 dark:bg-gray-950",
        "text-gray-900 dark:text-white"
      )}
    >
      {/* ─── Фоновые пятна — синие/голубые ─── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-[28rem] h-[28rem] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[30rem] h-[30rem] rounded-full bg-slate-400/10 blur-3xl" />
      </div>

      {/* ─── Мобильная кнопка-гамбургер — стеклянная ─── */}
      <button
        type="button"
        className={cn(
          "fixed top-4 left-4 z-50 p-2.5 rounded-full",
          "lg:hidden transition-transform duration-200",
          // ─── Liquid Glass тело ───
          "bg-white/65 dark:bg-white/[0.08]",
          "backdrop-blur-xl",
          "ring-1 ring-white/70 dark:ring-white/10",
          "shadow-[0_4px_16px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.85)]",
          "dark:shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "text-gray-800 dark:text-gray-100",
          "hover:scale-105 active:scale-95",
          // ─── Hover: плотнее, без смены цвета ───
          "hover:bg-white/85 dark:hover:bg-white/[0.12]"
        )}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ═══════════ Сайдбар — Liquid Glass ═══════════ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 lg:static lg:translate-x-0 lg:inset-auto",
          "transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // ─── Стекло тела ───
          "bg-white/55 dark:bg-white/[0.03]",
          "backdrop-blur-2xl",
          "border-r border-white/50 dark:border-white/10",
          "shadow-[0_8px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.7)]",
          "dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)]"
        )}
      >
        <div className="relative flex flex-col h-full">
          {/* Спекулярный блик сверху сайдбара */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-1 h-24 rounded-full bg-gradient-to-b from-white/40 to-transparent opacity-70 blur-md"
          />

          {/* ─── Логотип ─── */}
          <div className="relative flex items-center gap-3 px-6 py-5 border-b border-white/40 dark:border-white/10">
            <div
              className={cn(
                "relative w-10 h-10 rounded-xl overflow-hidden",
                "bg-gradient-to-br from-sky-500 to-blue-600",
                "flex items-center justify-center text-white font-bold text-lg",
                "ring-1 ring-white/40",
                "shadow-[0_4px_14px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]"
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/70 to-transparent blur-[0.5px]"
              />
              <span className="relative">D</span>
            </div>

            <span
              className={cn(
                "text-xl font-semibold tracking-tight",
                "bg-gradient-to-r from-sky-600 to-blue-600",
                "dark:from-sky-400 dark:to-blue-400",
                "bg-clip-text text-transparent"
              )}
            >
              Dayla
            </span>
          </div>

          {/* ─── Навигация ─── */}
          <nav className="relative flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                    "overflow-hidden transition-all duration-200",
                    // ─── Базовый стеклянный вид ───
                    "ring-1",
                    isActive
                      ? [
                          // ─── Active: стеклянное тело + синий ring ───
                          "bg-white/70 dark:bg-white/[0.08]",
                          "ring-sky-400/50 dark:ring-sky-400/40",
                          "text-sky-700 dark:text-sky-300",
                          "shadow-[0_4px_16px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.85)]",
                          "dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]",
                        ]
                      : [
                          // ─── Покой: прозрачное стекло ───
                          "bg-white/30 dark:bg-white/[0.02]",
                          "ring-white/40 dark:ring-white/5",
                          "text-gray-700 dark:text-gray-300",
                          "hover:bg-white/60 dark:hover:bg-white/[0.06]",
                          "hover:ring-white/60 dark:hover:ring-white/10",
                        ]
                  )
                }
              >
                {/* Спекулярный блик на активной ссылке */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent opacity-0 group-hover:opacity-60 blur-[1px] transition-opacity"
                />

                <item.icon size={20} className="relative shrink-0" />
                <span className="relative">{item.label}</span>

                {item.to === '/dashboard' && (
                  <span
                    className={cn(
                      "relative ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full",
                      "bg-sky-500/15 dark:bg-sky-400/15",
                      "text-sky-700 dark:text-sky-300",
                      "ring-1 ring-sky-400/30 dark:ring-sky-400/25",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
                    )}
                  >
                    Новое
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* ─── Кнопка выхода ─── */}
          <div className="relative px-4 py-4 border-t border-white/40 dark:border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium overflow-hidden",
                "bg-white/30 dark:bg-white/[0.02]",
                "ring-1 ring-white/40 dark:ring-white/5",
                "text-red-600 dark:text-red-400",
                "transition-all duration-200",
                // ─── Hover: плотнее, цвет не меняется ───
                "hover:bg-red-50/70 dark:hover:bg-red-500/10",
                "hover:ring-red-300/50 dark:hover:ring-red-400/30"
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/50 to-transparent opacity-0 group-hover:opacity-60 blur-[1px] transition-opacity"
              />
              <LogOut size={20} className="relative" />
              <span className="relative">Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════ Основной контент ═══════════ */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* ─── Header — Liquid Glass ─── */}
        <header
          className={cn(
            "relative px-6 py-4 flex items-center justify-between",
            // ─── Стекло ───
            "bg-white/55 dark:bg-white/[0.03]",
            "backdrop-blur-2xl",
            "border-b border-white/50 dark:border-white/10",
            "shadow-[0_4px_16px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.7)]",
            "dark:shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]"
          )}
        >
          {/* Спекулярный блик сверху шапки */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-8 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/40 to-transparent opacity-60 blur-[1px]"
          />

          <div className="relative flex items-center gap-3">
            <div className="w-10 lg:hidden" />
            <h1
              className={cn(
                "text-lg md:text-xl font-semibold tracking-tight",
                "bg-gradient-to-r from-gray-800 to-gray-600",
                "dark:from-white dark:to-gray-300",
                "bg-clip-text text-transparent"
              )}
            >
              Добро пожаловать
            </h1>
          </div>

          {/* ─── Профиль ─── */}
          <div className="relative flex items-center gap-4">
            <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.username || user?.email}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "relative h-11 w-11 rounded-full p-0",
                    "transition-all duration-200",
                    "hover:bg-white/60 dark:hover:bg-white/[0.06]",
                    "hover:ring-1 hover:ring-white/70 dark:hover:ring-white/10"
                  )}
                >
                  <Avatar
                    className={cn(
                      "h-10 w-10 ring-1 ring-white/60 dark:ring-white/10",
                      "shadow-[0_2px_8px_rgba(59,130,246,0.20),inset_0_1px_0_rgba(255,255,255,0.5)]"
                    )}
                  >
                    <AvatarFallback
                      className={cn(
                        "relative overflow-hidden",
                        "bg-gradient-to-br from-sky-500 to-blue-600",
                        "text-white text-sm font-medium"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/60 to-transparent blur-[0.5px]"
                      />
                      <span className="relative">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className={cn(
                  "w-56 rounded-2xl overflow-hidden",
                  // ─── Liquid Glass ───
                  "bg-white/70 dark:bg-gray-900/60",
                  "backdrop-blur-2xl",
                  "border border-white/50 dark:border-white/10",
                  "shadow-[0_8px_32px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]",
                  "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
                )}
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user?.username || 'Пользователь'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Профиль
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ─── Контент ─── */}
        <main className="relative flex-1 overflow-y-auto p-6 bg-transparent">
          <Outlet />
        </main>
      </div>

      {/* ─── Затемнение для мобильного сайдбара ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default MainLayout;