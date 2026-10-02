// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { CreditCard } from 'lucide-react';

import {
  LayoutDashboard,
  Package,
  FileText,
  Image,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
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

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { to: '/goods', label: 'Товары', icon: Package },
    { to: '/seo', label: 'SEO-генерация', icon: FileText },
    { to: '/infographics', label: 'Инфографика', icon: Image },
    { to: '/reports', label: 'Отчёты', icon: BarChart3 },
    { to: '/profile', label: 'Профиль', icon: User },
    { to: '/dashboard/pricing', label: 'Тарифы', icon: CreditCard },
  ];

  const userInitials = user?.username
    ? user.username
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex h-screen bg-gray-50/70 dark:bg-gray-900/70 backdrop-blur-sm">
      {/* Мобильная кнопка-гамбургер — стеклянная */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-apple dark:shadow-apple-dark lg:hidden transition-all hover:scale-105"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Сайдбар — стеклянный, с размытием */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-white/20 dark:border-gray-700/30
          transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:translate-x-0 lg:static lg:inset-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-apple dark:shadow-apple-dark
        `}
      >
        <div className="flex flex-col h-full">
          {/* Логотип — с градиентом */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/30">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              P
            </div>
            <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Deyla
            </span>
          </div>

          {/* Навигация */}
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:shadow-sm'
                  }`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} className="shrink-0" />
                <span>{item.label}</span>
                {item.to === '/dashboard' && (
                  <span className="ml-auto text-xs font-medium bg-blue-500/20 text-blue-600 dark:bg-blue-400/20 dark:text-blue-400 px-2 py-0.5 rounded-full">
                    Новое
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Кнопка выхода — с иконкой */}
          <div className="px-4 py-4 border-t border-gray-200/50 dark:border-gray-700/30">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50/80 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut size={20} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Основной контент — без центрирования, на всю ширину */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Шапка (header) — стеклянная */}
        <header className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/30 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 lg:hidden" />
            <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Добро пожаловать
            </h1>
          </div>

          {/* Профиль */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
              {user?.username || user?.email}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-11 w-11 rounded-full p-0 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all">
                  <Avatar className="h-10 w-10 ring-2 ring-blue-500/20 shadow-apple dark:shadow-apple-dark">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-2xl shadow-apple dark:shadow-apple-dark">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.username || 'Пользователь'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Профиль
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Область контента — занимает всю ширину без центрирования */}
        <main className="flex-1 overflow-y-auto p-6 bg-transparent">
          <Outlet />
        </main>
      </div>

      {/* Затемнение для мобильного сайдбара */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;