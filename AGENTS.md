## Learned User Preferences
- Prefer using the Render MCP/plugin and related Cursor skills for Render deploy and service work when they are enabled.
- Prefer config-driven feature toggles (e.g. `siteConfig.easterEggEventSlug`) over hardcoding event slugs in scattered files.
- Historical migration files must never be edited; rebrand or schema changes should add new migrations rather than rewriting old ones.

## Learned Workspace Facts
- The workspace is `Cursor-Event-Portal`, a Next.js event portal project using Supabase and environment-variable-driven setup.
- The project includes Render deployment configuration in `render.yaml`. Render cron services are commented out there until they are needed; `/api/cron/*` routes remain for when a scheduler is enabled.
- Production is deployed on Render at https://cursor-event-portal.onrender.com; example service names in `render.yaml` may not match the live service name shown in the Render dashboard.
- The `[eventSlug]` URL segment must match Supabase `events.slug` and the `id` values in `src/content/events.ts`; `app_settings.active_event_slug` selects the default active event when set. Renaming a slug requires coordinated database updates, `next.config.mjs` redirects for old paths, and an audit of hardcoded slug constants (including event-specific features).
- Landing hero and listing imagery under `public/cursor_china_photo/` is assigned into `src/content/header-photos.ts`, `events.ts`, and `world-events.ts` by `scripts/assign-china-photos.ts` (re-run only when that folder still contains the expected stable `china-NN.*` inputs).
- `next.config.mjs` carries the production domain allowlist under `experimental.serverActions.allowedOrigins` (separate from `images.remotePatterns`, which only includes Supabase hosts).
- The `en-CA` locale is used across 8+ admin/action files as a date-formatting trick for ISO-style YYYY-MM-DD output; changing locale affects date-parsing logic in those files.
- `buildHomeJsonLd()` in `LandingPage.tsx` constructs JSON-LD structured data from `siteConfig` and `events.ts`; any site branding change should be verified there.
- A Shanghai rebrand plan in `.cursor/plans/shanghai_china_rebrand_b5a49747.plan.md` tracks a 50+-file migration from Calgary/Canada to Shanghai/China across 16 sections with 15 todos.
