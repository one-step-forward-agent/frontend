// src/App.tsx
import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Макеты
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';

// Landing
import FeaturesPage from '@/pages/Landing/FeaturesPage';
import PricingPage from '@/pages/Landing/PricingPage';

// Auth
import LoginPage from '@/pages/Auth/LoginPage';
import RegisterPage from '@/pages/Auth/RegisterPage';

// Documents
import PersonalDataConsentPage from '@/pages/Documents/PersonalDataConsentPage';
import TermsOfUsePage from '@/pages/Documents/TermsOfUsePage';

// Dashboard
import { DashboardPage } from "@/pages/Dashboard/DashboardPage";
import { TodaySection } from "@/pages/Dashboard/sections/TodaySection";
import { CalendarSection } from "@/pages/Dashboard/sections/CalendarSection";
import { ChatSection } from "@/pages/Dashboard/sections/ChatSection";
import { TasksSection } from "@/pages/Dashboard/sections/TasksSection";
import { AnalyticsSection } from "@/pages/Dashboard/sections/AnalyticsSection";
import { AccountSection } from "@/pages/Dashboard/sections/AccountSection";

import PaymentSuccessPage from '@/pages/PaymentSuccessPage';

// Onboarding
import { OnboardingProvider } from './components/onboarding/OnboardingContext';
import { Start } from './components/onboarding/Start';
import { ForWhatUsing } from './components/onboarding/ForWhatUsing';
import { FieldOfActivity } from './components/onboarding/FieldOfActivity';
import { ToneOfVoice } from './components/onboarding/ToneOfVoice';
import { GoalsAndHabits } from './components/onboarding/GoalsAndHabits';
import { ExistingPlans } from './components/onboarding/ExistingPlans';
import { AppleAndGoogleLogging } from './components/onboarding/AppleAndGoogleLogging';
import { FastTasksEnter } from './components/onboarding/FastTasksEnter';
import { LetsPlanTomorrow } from './components/onboarding/LetsPlanTomorrow';
import { SuccessAndLearning } from './components/onboarding/SuccessAndLearning';
import { SourcesImport } from './components/onboarding/SourcesImport';

// ---------- Вспомогательные компоненты ----------

const FullScreenLoader: React.FC<{ label?: string }> = ({ label = 'Загрузка...' }) => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </div>
);

/** Восстанавливает путь после логина, если он был сохранён в sessionStorage. */
const RootRedirectHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirect-path');
    if (!redirectPath) return;

    sessionStorage.removeItem('redirect-path');
    if (redirectPath !== location.pathname + location.search) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location]);

  return null;
};

/** Layout-защитник: пускает дальше только авторизованных. */
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const OnboardingRouteLayout: React.FC = () => (
  <OnboardingProvider>
    <Outlet />
  </OnboardingProvider>
);

const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <FullScreenLoader label="Загрузка приложения..." />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Start />;
};

/** Заголовок 404. */
const NotFoundPage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
    <h1 className="text-6xl font-bold text-gray-800 dark:text-white">404</h1>
    <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">Страница не найдена</p>
    <a
      href="/"
      className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Вернуться на главную
    </a>
  </div>
);

// ---------- Корневой компонент ----------

const App: React.FC = () => {
  const { loadUser, logout, isLoading } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Сессия истекла и обновить её не удалось — выходим
  useEffect(() => {
    window.addEventListener('dayla:logout', logout);
    return () => window.removeEventListener('dayla:logout', logout);
  }, [logout]);

  // Звук клика по кнопкам
  useEffect(() => {
    const audio = new Audio('/sounds/buttonsound.mp3');
    audio.volume = 0.1;
    audio.load();

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button =
        target.closest('button') ?? target.closest('[role="button"]');
      if (button) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (isLoading) return <FullScreenLoader label="Загрузка приложения..." />;

  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- Онбординг (публичный, со своим провайдером) ---------- */}
        <Route element={<OnboardingRouteLayout />}>
          <Route path="/onboarding/start" element={<Start />} />
          <Route path="/onboarding/for-what-using" element={<ForWhatUsing />} />
          <Route path="/onboarding/field-of-activity" element={<FieldOfActivity />} />
          <Route path="/onboarding/tone-of-voice" element={<ToneOfVoice />} />
          <Route path="/onboarding/goals-and-habits" element={<GoalsAndHabits />} />
          <Route path="/onboarding/existing-plans" element={<ExistingPlans />} />
          <Route
            path="/onboarding/apple-google-logging"
            element={<AppleAndGoogleLogging />}
          />
          <Route path="/onboarding/sources-import" element={<SourcesImport />} />
          <Route path="/onboarding/fast-tasks-enter" element={<FastTasksEnter />} />
          <Route
            path="/onboarding/success-and-learning"
            element={<SuccessAndLearning />}
          />
          <Route
            path="/onboarding"
            element={<Navigate to="/onboarding/start" replace />}
          />
        </Route>

        {/* ---------- Публичные ---------- */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/personal-data-consent" element={<PersonalDataConsentPage />} />
        <Route path="/terms-of-use" element={<TermsOfUsePage />} />

        {/* ---------- Auth ---------- */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* ---------- Защищённые ---------- */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />}>
            <Route index element={<Navigate to="today" replace />} />
            <Route path="today" element={<TodaySection />} />
            <Route path="calendar" element={<CalendarSection />} />
            <Route path="chat" element={<ChatSection />} />
            <Route path="tasks" element={<TasksSection />} />
            <Route path="analytics" element={<AnalyticsSection />} />
            <Route path="account" element={<AccountSection />} />
          </Route>
          <Route path="/dashboard/pricing" element={<PricingPage dashboardMode />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
        </Route>

        {/* ---------- 404 ---------- */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;