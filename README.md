# Deyla frontend

One React app for the whole site: the public landing, registration, sign-in and the product itself.
It is served by nginx in Docker (and on Amvera), with the backend proxied on the same origin.

| Path | What it is | Code |
| --- | --- | --- |
| `/` | Landing page; signup buttons open `/register` (logged-in visitors go straight to `/app`) | `src/components/landing/` |
| `/onboarding/*` | Legacy links redirect to `/register`, or `/app` for signed-in users | `src/App.tsx` |
| `/login`, `/register` | Auth screens (`?next=` returns you to the page you came from) | `src/pages/Auth/`, `src/layouts/AuthLayout.tsx` |
| `/terms-of-use`, `/personal-data-consent` | Legal documents (Markdown) | `src/pages/Documents/` |
| `/app/*` | The product: Today, Calendar (day/week/month), Tasks, Event, Assistant, Integrations, Account (profile, tags and all settings; `/app/settings` still opens it) | `src/app/` |

## Design and themes

- The landing and auth pages use Tailwind (`tailwind.config.js`, `src/index.css`).
- The app under `/app` uses `src/app/app.css`, which is scoped to `.fd-app` and follows the same visual language: Inter, a blue→violet gradient, and glass cards on a soft grid.
- **Themes:** light, dark, or follow the system.
  - `src/theme.tsx` stores the choice in `localStorage` (`deyla-theme`) and sets the `dark` class on `<html>`. Tailwind (`darkMode: "class"`) and `app.css` both key off that class.
  - A small script in `index.html` applies the theme before first paint.
  - The toggle is in every header. Settings → Appearance also offers "Как в системе" (follow the system).
- **Font:** Inter is self-hosted (`@fontsource-variable/inter`), so no request goes to Google Fonts.

## State and API

- `src/app/api/client.ts` is the single API client.
  - Sessions use the backend's httpOnly cookies. On 401 the client makes one shared refresh call and retries.
  - `GET /api/public/config` provides the Telegram bot link for the landing footer.
- `src/store/authStore.ts` (zustand) is the single session store, shared by the landing header, the auth pages and the app.
- `src/app/router.tsx` lets the app's pages use paths relative to `/app` on top of react-router.
- Registration opens `/app` directly unless a safe `?next=` destination was provided. Life areas and integrations can be configured in the app; the existing `/api/me/onboarding` endpoint remains the profile-preferences API used there.

## Development

Email confirmation is controlled by the backend environment variable `EMAIL_VERIFICATION_ENABLED` (set `false` to disable it), with no dashboard control. Accounts created with verification disabled have no special flag, badge, color, column or filter in the user sheets.

Task completion is immediate. The optional completion-report dialog records tools, conclusions, a note and result files; reports can be edited later from the completed task. Team reports are readable by current members and editable by the performer.

The Friends calendar includes assigned tasks/reminders and personal events explicitly shared in either direction. Private events and report contents are never exposed by schedule sharing.

Team task lists filter by executor (all members, mine, or a specific member). Admins can reassign directly; other members offer to take a task or request a handover that needs approval. Text/document distribution produces individual sending drafts, with clarification questions before incomplete specifications are assigned.

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api, /auth and /health to BACKEND_URL (default http://127.0.0.1:8000)
npm run build      # type-check + production build into dist/
```

The dev proxy keeps the browser's `Host` header (`changeOrigin: false`), because the backend
rejects writes whose `Origin` doesn't match the host (CSRF protection).

In Docker, nginx serves the build and proxies `/api`, `/auth` and `/health` to the backend at
`BACKEND_URL` (default `http://app:8000`, see `nginx.conf.template`). Hashed assets are cached
for a year, and pages are revalidated on every load.

## Product analytics

Admins open **Metrics & charts** from `/dashboard`, which goes to `/dashboard/analytics`. The page displays the Colab notebook's observable metrics directly from `GET /api/admin/analytics`: daily extended/product DAU, LLM requests, cumulative/new users, input/output/cached/total tokens by model, request purposes, goal totals and the goal-by-day heatmap. It supports inclusive date ranges, IANA timezones, model filters, the notebook's two activity definitions and their union, and CSV exports. Missing instrumentation is explicitly listed under Goals & activity. The table workbook at `/dashboard` is preserved.

The Python / SQL tab runs pandas and read-only SQLite in a fresh Web Worker over aggregate tables (`daily`, `model_daily`, `goals`, `goals_daily`, `purposes`). It never executes submitted code on the backend. Python assigns a DataFrame to `result`; SQL binds `:start_date`, `:end_date`, `:timezone`. Select the returned X/Y columns and line/bar chart type, or export the result. Stop terminates the worker. Limits are 120 seconds, 10,000 result rows, 100 columns and 5 MB. Charts sample evenly above 1,000 rows and say so; table previews show 500 rows and CSV exports keep every result row. Code and results are held in component memory, and are cleared on navigation; applying new filters clears results.

`npm run dev` and `npm run build` prepare the pinned Pyodide runtime through `scripts/prepare-analytics-runtime.mjs`. The first build needs access to the pinned Pyodide package distribution on jsDelivr; every Python wheel is checked against the lockfile's SHA-256. The resulting ~21 MB runtime is self-hosted under `/analytics-runtime/` and loads only when running code. Browsers do not send analytics data to a CDN. The generated directory is ignored by Git and copied into `dist` by Vite.

Preserve the dedicated `/analytics-worker.js` response policy in Nginx. It permits only the local `/analytics-runtime/` asset path and WebAssembly, and blocks API/auth requests, external networking and child workers. Vite applies the same worker policy in local development. The Nginx runtime location declares `.mjs` and `.wasm` MIME types. Serving the worker without this restrictive policy is not supported. This is separate from the optional DEV auth mock, which does not authenticate real backend requests.

No new backend environment variables or migration are required. Deploy the backend analytics endpoint before or alongside the frontend. See `backend/docs/admin-analytics.md` in the shared workspace for definitions and test prerequisites.

## Blog builder

Admins manage articles at `/dashboard/blog`. Open an article and use **Landing page card** to select it for the landing page, set its position (lower numbers first), and override its title, description, caption, image, alt text and link text. The card preview matches the public landing page. Blank overrides use the article title, excerpt, first tag and cover. Save or publish to persist changes; selected drafts stay hidden. Deselecting or unpublishing removes a card from the landing page without deleting the article.

The article preview uses the public renderer. CTA blocks save their destination, text, background style/image, colors, dimensions and floating icon image URLs, including when nested in other blocks. Images can use HTTP(S) URLs or the editor's upload control.

The backend must be migrated through `0059_blog_landing` before running this frontend. Existing articles are initially unselected. The public landing page uses `/api/blog/landing` and links cards to `/blog/:slug`.

## Content to review before launch

- `src/pages/Documents/md_texts/*.md`: the terms and the personal-data consent come from the
  organisation's previous product ("Prosklad") and must be replaced with Deyla's legal texts.
- The support email in the footer (`LandingFooter.tsx`) is the organisation's address.

Landing code is © MentrixLabs, MIT License; see `THIRD_PARTY_NOTICES.md`.
