# Frontend instructions
When this checkout is inside Dayla_AI, also read `../AGENTS.md` and `../codex-setup/commands.md`; they may not be auto-discovered when starting inside this Git root.

- `src/App.tsx` owns public/auth/onboarding routing and providers. `src/app/AppRoutes.tsx` and `src/app/router.tsx` implement the authenticated `/app` route layer and navigation bridge. Preserve `/app` prefixes in bot/deep links and login return paths.
- Extend `src/app/api/client.ts` and `types.ts` for API work; keep same-origin credentials, the single refresh retry, `ApiError` sanitization and `Accept-Language`. Use `src/store/authStore.ts`; do not add a second session store or persist access tokens in browser storage.
- Reuse `src/app/components/ui.tsx` and `src/app/app.css` for app screens; `src/components/ui/`, Tailwind and glass helpers serve public/onboarding pages. Inspect the screen's layer before introducing primitives. Use the `@/` alias and existing functional components/hooks.
- Preserve `src/theme.tsx`, `public/theme-init.js`, class-based dark mode and system theme. Localize via `src/i18n.ts` / `tr`. Check both languages, light/dark, narrow phone layouts, keyboard focus and dialog behavior for changed UI. Check `Start.tsx` animation cleanup and mobile static icon layout when touching onboarding.
- `VITE_DEV_AUTH_BYPASS` is DEV-only and explicitly opt-in. It mocks frontend identity, not backend authorization; never use it as evidence that real auth works.
- From this directory: `npm.cmd ci`, `npm.cmd run dev`, `npm.cmd run typecheck`, `npm.cmd run build` (use `npm` off Windows). Node 24 matches the Docker build. `preview` serves built assets without the dev API proxy.
- There is no configured lint/format script, frontend unit runner or browser test suite. Do not invent successful checks or add frameworks as incidental work. Run a browser review against a local app when available and report its actual scope.
- Review Nginx CSP, proxy paths, forwarded headers and upload limits when changing network-facing behavior. Keep secrets out of `VITE_*`, which are public build inputs.
