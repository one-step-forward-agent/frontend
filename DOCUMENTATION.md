## 1. Обзор

Фронтенд написан на React 19 с TypeScript, использует Vite для сборки, Tailwind CSS для стилей, Zustand для управления состоянием, React Router для маршрутизации. Обеспечивает пользовательский интерфейс для регистрации, входа, управления товарами, генерации SEO, инфографики, отчётов, просмотра статистики и управления тарифом.

## 2. Установка и запуск

### 2.1. Требования
- Node.js 18+
- npm или yarn

### 2.2. Шаги

```bash
cd StartupFrontend
npm install
cp .env.example .env   # заполнить переменные
```

### 2.3. Переменные окружения (`.env`)

| Переменная | Описание |
|------------|----------|
| `VITE_API_BASE_URL` | Базовый URL бэкенда (например, `https://mlstartupbackend-mentrixlabs.amvera.io`) |

### 2.4. Запуск

```bash
npm run dev   # разработка (порт 3000)
npm run build # сборка в dist
npm run deploy # деплой на GitHub Pages (если настроен)
```

## 3. Архитектура

### 3.1. Структура каталогов

```
StartupFrontend/
├── public/               # Статика
├── src/
│   ├── api/              # Клиенты API (axios)
│   │   ├── client.ts     # axios-инстанс с интерцепторами
│   │   ├── auth.ts       # логин, регистрация, /me
│   │   ├── goods.ts      # CRUD товаров, обновление остатков, репарсинг
│   │   ├── seo.ts        # генерация SEO, история
│   │   ├── infographics.ts # генерация, улучшение, получение
│   │   ├── reports.ts    # отчёты, генерация, скачивание
│   │   ├── stats.ts      # статистика
│   │   ├── payment.ts    # создание платежа
│   │   └── user.ts       # статус пользователя
│   ├── components/       # UI-компоненты
│   │   ├── ui/           # примитивы (Button, Card, Alert, ...) на shadcn/ui
│   │   ├── layout/       # MainLayout, AuthLayout, LandingHeader/Footer
│   │   └── landing/      # компоненты лендинга
│   ├── hooks/            # кастомные хуки
│   │   ├── useAuth.ts    # (устаревший, используется useAuthStore)
│   │   ├── useGoods.ts   # обёртка над goodsStore
│   │   ├── useUserStatus.ts # загрузка статуса пользователя
│   │   └── ...           # другие хуки
│   ├── pages/            # страницы
│   │   ├── Landing/      # лендинг (Home, Features, Pricing)
│   │   ├── Auth/         # LoginPage, RegisterPage
│   │   └── Dashboard/    # защищённые страницы
│   │       ├── DashboardPage.tsx
│   │       ├── GoodsListPage.tsx
│   │       ├── GoodsCreatePage.tsx
│   │       ├── GoodsDetailPage.tsx (с вкладками)
│   │       ├── SeoGenerationPage.tsx
│   │       ├── InfographicsPage.tsx
│   │       ├── ReportsPage.tsx
│   │       ├── ReportViewPage.tsx
│   │       ├── ProfilePage.tsx
│   │       ├── SettingsPage.tsx
│   │       └── PricingPage.tsx (тарифы в дашборде)
│   ├── store/            # Zustand-сторы
│   │   ├── authStore.ts  # авторизация, пользователь
│   │   └── goodsStore.ts # товары, пагинация
│   ├── types/            # TypeScript-интерфейсы (api/types.ts)
│   ├── utils/            # утилиты (cn, getErrorMessage, planHelpers)
│   ├── layouts/          # AuthLayout, MainLayout
│   ├── App.tsx           # корневой компонент, маршруты
│   └── main.tsx          # точка входа
├── tailwind.config.js    # конфигурация Tailwind
└── package.json
```

### 3.2. Основные модули

- **`App.tsx`** – определяет маршруты, использует `ProtectedRoute` для приватных страниц, условный `RootRoute` для `/`.
- **`authStore`** – управление состоянием аутентификации, токен хранится в `localStorage`.
- **`goodsStore`** – список товаров, пагинация, CRUD-операции.
- **API-клиенты** используют единый экземпляр axios с перехватчиками для добавления токена и обработки 401.
- **UI-компоненты** построены на `class-variance-authority` и `tailwind-merge`.

## 4. Роутинг

| Путь | Компонент | Защита |
|------|-----------|--------|
| `/` | `RootRoute` (лендинг или редирект на `/dashboard`) | нет |
| `/features` | `FeaturesPage` | нет |
| `/pricing` | `PricingPage` (лендинг) | нет |
| `/login` | `LoginPage` | нет |
| `/register` | `RegisterPage` | нет |
| `/dashboard` | `DashboardPage` | да |
| `/goods` | `GoodsListPage` | да |
| `/goods/new` | `GoodsCreatePage` | да |
| `/goods/:id` | `GoodsDetailPage` | да |
| `/seo` | `SeoGenerationPage` | да |
| `/infographics` | `InfographicsPage` | да |
| `/reports` | `ReportsPage` | да |
| `/reports/view/:id` | `ReportViewPage` | да |
| `/profile` | `ProfilePage` | да |
| `/settings` | `SettingsPage` | да |
| `/dashboard/pricing` | `PricingPage` (dashboardMode) | да |

## 5. Состояния (Zustand)

### 5.1. `authStore`
- `user`, `isAuthenticated`, `isLoading`, `error`
- `login`, `register`, `logout`, `loadUser`, `setUser`, `clearError`
- Персистентность через `persist` middleware (сохраняет `user` и `isAuthenticated`).

### 5.2. `goodsStore`
- `goods`, `isLoading`, `error`, `total`, `page`, `size`, `pages`, `selectedGoods`
- `fetchGoods`, `getGoods`, `addGoods`, `updateGoods`, `removeGoods`, `parseByArticle`, `setSelectedGoods`, `clearError`

## 6. Основные страницы и их функции

- **`DashboardPage`** – отображает графики активности, распределение контента, планку на неделю, последние товары. Использует API статистики.
- **`GoodsListPage`** – список товаров с поиском, пагинацией, удалением (ConfirmDialog).
- **`GoodsCreatePage`** – форма создания товара по URL, проверка лимита товаров через `useUserStatus`.
- **`GoodsDetailPage`** – вкладки: Информация, SEO, Инфографика, Отчёты. Позволяет генерировать SEO, улучшать/генерировать инфографику, обновлять данные товара.
- **`SeoGenerationPage`** – выбор товара, генерация SEO, история.
- **`InfographicsPage`** – поиск/генерация изображений, улучшение, сохранение.
- **`ReportsPage`** – список отчётов, фильтрация по товару, ввод остатков перед созданием, скачивание.
- **`ReportViewPage`** – детальный просмотр отчёта с графиками (ДРР, лиды, CTR, прогнозы).
- **`PricingPage`** – карточки тарифов с кнопкой выбора; для авторизованных – редирект на дашборд с автоматической оплатой.
- **`ProfilePage`** – редактирование профиля (заглушка).
- **`SettingsPage`** – тема, язык, уведомления, настройки генерации (сохраняются в localStorage).

## 7. Взаимодействие с API

- **`api/client.ts`** – создаёт axios-инстанс с базовым URL и таймаутом. Добавляет `Authorization` из `localStorage`. При 401 удаляет токен и редиректит на `/login`.
- **API-функции** (например, `generateSeo`, `getReports`) возвращают промисы с типизированными данными.
- **Хуки** (`useGoods`, `useUserStatus`) оборачивают вызовы API и управляют состоянием загрузки/ошибок.

## 8. Хуки и утилиты

### 8.1. `useUserStatus`
- Загружает статус пользователя (`/user/status`) при монтировании.
- Возвращает `{ status, loading, error }`.

### 8.2. `planHelpers.ts`
- `canAddGoods(status)`, `canGenerateSeo(status)`, `canGenerateInfographics(status, count)`, `getPlanLimitMessage(status, action)`
- Используются на фронтенде для предварительной проверки лимитов (но основная проверка на бэкенде).

### 8.3. `getErrorMessage.ts`
- Извлекает `detail` из ответа Axios (или `message`), возвращает понятную строку ошибки.

## 9. Стилизация и тема

- Используется Tailwind CSS с кастомными токенами (тени, скругления, анимации).
- Поддержка тёмной темы через `dark:` классы.
- UI-компоненты (Button, Card, Alert, Badge, Switch, Table, SelectableImageGrid) построены на shadcn/ui с `class-variance-authority`.

## 10. Деплой

- Фронтенд собирается в `dist` командой `npm run build`.
- Для GitHub Pages настроен скрипт `deploy`, использующий `gh-pages`.
- В `vite.config.ts` установлен `base: '/StartupFrontend/'` (может быть изменён при использовании кастомного домена).

---

# Общие замечания

- Вся бизнес-логика, связанная с лимитами и тарифами, централизована в бэкенде (проверки выполняются перед каждым действием). Фронтенд использует те же лимиты для UX, но не полагается на них.
- Отчёты генерируются с использованием GigaChat (или заглушки) и содержат прогнозы по ДРР, лидам, CTR с учётом плана.
- Платежи интегрированы с ЮKassa (или моком), поддерживают двухстадийную оплату.
- Все эндпоинты защищены JWT-токеном (кроме `/auth/login`, `/auth/register`, `/payment/webhook`).
- Ошибки возвращаются в формате `{"detail": "..."}` для удобного отображения на фронтенде.