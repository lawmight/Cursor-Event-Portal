---
name: Shanghai China Rebrand
overview: Complete rebrand of the Cursor Event Portal from Calgary/Canada to Shanghai/China, updating site config, metadata, 40+ source files with hardcoded references, timezone defaults, static assets, redirects, and database seeds.
todos:
  - id: site-config
    content: "Update site.config.ts: city, country, footerTagline, add defaultTimezone, siteUrl, venueAddressPlaceholder, easterEggEventSlug, and communityDisplayName() helper"
    status: pending
  - id: static-asset
    content: Replace all cursor-calgary.avif references with /cursor_china_photo/cursor-SHANGHAI-CHINA.png
    status: pending
  - id: layout-metadata
    content: Rebuild layout.tsx metadata from siteConfig, update en.json footer.madeWith
    status: pending
  - id: ui-strings
    content: Replace hardcoded Calgary strings in 14 UI/admin files (Section 3 list)
    status: pending
  - id: easter-eggs
    content: Refactor 5 Easter Egg files to read slug from siteConfig instead of hardcoded calgary-march-2026
    status: pending
  - id: slugs-redirects
    content: Rename calgary-* event slugs to shanghai-*, update DB active_event_slug, events.ts, all hardcoded slug constants, add backward-compat redirects in next.config.mjs
    status: pending
  - id: timezone-sweep
    content: Replace America/Edmonton with siteConfig.defaultTimezone across all 17 source files (Section 6 list)
    status: pending
  - id: next-config
    content: "Update next.config.mjs: add calgary->shanghai redirects, broaden admin slug regex, keep cursorcalgary.com in allowlist"
    status: pending
  - id: content-mock
    content: Update events.ts IDs/titles, mock/data.ts (full scope), assign-china-photos.ts, seed-planned-events.sql
    status: pending
  - id: passwords
    content: Rename CursorCalgary2026 secret in ExportClient, DataManagementClient, admin-users.sql
    status: pending
  - id: db-migration
    content: "Add new SQL migration: rename event slugs, update titles/locations/timezone, update active_event_slug + venues. Update schema.sql snapshot."
    status: pending
  - id: docs-scripts
    content: Update README_DEMO_SIGNUP_HANDOFF.md and Calgary comments in one-time scripts
    status: pending
  - id: locale-sweep
    content: Change en-CA to zh-CN in 5 DISPLAY-ONLY files. KEEP en-CA in 3 parsing-dependent functions (demo/service.ts, actions/demo.ts, event-dashboard.ts) to avoid breaking split("-") date math.
    status: pending
  - id: mst-rename
    content: Rename utcToMstLocal() to utcToLocalDatetime() in AgendaAdminClient.tsx and parametrize with event timezone
    status: pending
  - id: supabase-dashboard
    content: "Manual: update Supabase Dashboard Site URL, redirect URLs, and email template copy"
    status: pending
  - id: metadata-base
    content: Add metadataBase to layout.tsx metadata export for correct OG image URL resolution
    status: pending
  - id: mock-offsets
    content: Update -07:00 UTC offsets to +08:00 in mock/data.ts and mock/queries.ts, replace Edmonton/Vancouver with Chinese cities
    status: pending
  - id: verification
    content: Grep for all 8 patterns (add en-CA, MST, -07:00), run lint/typecheck, smoke-test key pages
    status: pending
isProject: false
---

# Rebrand: Calgary to Shanghai / China

## Design decisions (confirmed)

- **Image asset**: Replace `/cursor-calgary.avif` with the new `/cursor_china_photo/cursor-SHANGHAI-CHINA.png` that already exists in `public/`. Update all `src=` and `alt=` references in the 4+ components.
- **Event slugs**: Full rename — update DB slugs + `active_event_slug` row, `events.ts` IDs, all hardcoded slug constants (easter eggs, queries, layout conditionals), add backward-compat redirects in `next.config.mjs` from old `calgary-*` URLs to new `shanghai-*` URLs, then verify critical flows.
- **`cursorcalgary.com` domain**: Keep in `next.config.mjs` image allowlist for now (may still redirect traffic). Update OG URL to the Render production domain via `siteConfig.siteUrl`.
- **Easter Egg system**: Make config-driven via `siteConfig.easterEggEventSlug`, default to Shanghai event slug (or `null` to disable). Remove all Calgary-specific references from live app code. Leave historical migration files untouched.

---

## 1. Single source of truth — [`src/content/site.config.ts`](src/content/site.config.ts)

Update existing fields and add new ones:

```typescript
export const siteConfig = {
  communityName: 'Cursor',
  communityNameLocal: 'Shanghai',
  city: 'Shanghai',
  country: 'China',
  lumaUrl: 'https://lu.ma/cursor-china',       // or generic community URL
  cursorCommunityUrl: 'https://cursor.com/community',
  defaultLocale: 'en',
  locales: ['en'],
  footerTagline: 'Built with Cursor in Shanghai',
  // NEW fields:
  defaultTimezone: 'Asia/Shanghai',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://cursor-event-portal.onrender.com',
  venueAddressPlaceholder: 'Address TBA (Shanghai, China)',
  easterEggEventSlug: 'shanghai-apr-2026',      // or null to disable
};
```

Add a helper: `communityDisplayName()` returning e.g. `"Cursor Shanghai"` for use in layout/headers.

## 2. Root metadata and i18n

**[`src/app/layout.tsx`](src/app/layout.tsx):**
- Build `metadata` (title, description, `openGraph`) from `siteConfig` + `communityDisplayName()`.
- Replace hardcoded `"https://cursorcalgary.com"` with `siteConfig.siteUrl`.

**[`src/content/locales/en.json`](src/content/locales/en.json):**
- Change `footer.madeWith` from `"Built with Cursor in Calgary"` to match `siteConfig.footerTagline` or use `{city}` interpolation.

## 3. UI string sweep — hardcoded "Calgary" / "Cursor Calgary"

Replace literals with `siteConfig` / helpers in these files:

| File | What to change |
|---|---|
| [`AttendeeCheckinForm.tsx`](src/components/forms/AttendeeCheckinForm.tsx) | "Cursor Calgary Portal" (2 occurrences) |
| [`SurveyConsentModal.tsx`](src/components/consent/SurveyConsentModal.tsx) | "Cursor Calgary community organizers" (2 occurrences) |
| [`EventHeader.tsx`](src/components/layout/EventHeader.tsx) | `src` to new `.png` path + `alt="Cursor Shanghai"` + timezone fallback |
| [`[eventSlug]/page.tsx`](src/app/[eventSlug]/page.tsx) | `src` to new `.png` path + `alt="Cursor Shanghai"` + timezone fallback |
| [`intake/page.tsx`](src/app/[eventSlug]/intake/page.tsx) | `src` to new `.png` path + `alt="Cursor Shanghai"` |
| [`feedback/page.tsx`](src/app/[eventSlug]/feedback/page.tsx) | `src` to new `.png` path + `alt="Cursor Shanghai"` |
| [`EventDisplay.tsx`](src/components/display/EventDisplay.tsx) | "Pop-Up Calgary / MMXXVI" footer text |
| [`EventPortalPopup.tsx`](src/components/landing/EventPortalPopup.tsx) | Calgary references |
| [`AdminHeader.tsx`](src/components/admin/AdminHeader.tsx) | Default title `"Calgary Cursor Meetup"` |
| [`admin/[adminCode]/page.tsx`](src/app/admin/[adminCode]/page.tsx) | Title `"Calgary Cursor Meetup"` |
| [`CalendarAdminTab.tsx`](src/app/admin/_clients/event-dashboard/CalendarAdminTab.tsx) | Default city `"Calgary"` + `v.city !== "Calgary"` special-case |
| **[`VenueAdminTab.tsx`](src/app/admin/_clients/event-dashboard/VenueAdminTab.tsx)** | Placeholder `"e.g., 831 17 Ave SW, Calgary"` |
| **[`event-dashboard.ts`](src/lib/actions/event-dashboard.ts)** | Venue insert default `city: "Calgary"` |
| **[`init-agenda/route.ts`](src/app/api/admin/init-agenda/route.ts)** | `"platform-calgary"` venue key + comment |

Files in **bold** were missing from the original plan.

## 4. Easter Egg subsystem (5 files — was missing entirely)

All hardcode `EASTER_EVENT_SLUG = "calgary-march-2026"`. Refactor to read from `siteConfig.easterEggEventSlug`:

- **[`src/lib/actions/attendee-chat.ts`](src/lib/actions/attendee-chat.ts)** — `EASTER_EVENT_SLUG`
- **[`src/lib/actions/easter-eggs.ts`](src/lib/actions/easter-eggs.ts)** — `EASTER_EVENT_SLUG`
- **[`src/app/[eventSlug]/(main)/layout.tsx`](src/app/[eventSlug]/(main)/layout.tsx)** — `eventSlug === "calgary-march-2026"` conditional
- **[`src/components/easter/ResourcesEggTrigger.tsx`](src/components/easter/ResourcesEggTrigger.tsx)** — `EASTER_EVENT_SLUG`
- **[`src/components/agenda/AttendeeCreditsView.tsx`](src/components/agenda/AttendeeCreditsView.tsx)** — `EASTER_EVENT_SLUG`

## 5. Event slug rename — full scope (was missing)

This is the broadest cross-cutting change. Rename all `calgary-*` slugs to `shanghai-*` equivalents:

**DB + app setting:**
- Update the `events` table `slug` column for live rows (handled in new migration, Section 11).
- Update the `app_settings` row for `active_event_slug` if it points to a `calgary-*` slug.

**Code constants:**
- **[`src/lib/supabase/queries.ts`](src/lib/supabase/queries.ts):** `getActiveEventSlug()` fallback `"calgary-feb-2026"` — change to new Shanghai slug.
- **[`src/content/events.ts`](src/content/events.ts):** All event `id` fields (`calgary-apr-2026`, `calgary-hackathon-mar-2026`, `calgary-coworking-mar-2026`, `calgary-feb-2026`).
- **[`src/lib/mock/data.ts`](src/lib/mock/data.ts):** `MOCK_EVENT.slug` and all `MOCK_PLANNED_EVENTS` references.
- **Easter Egg constants** (5 files, covered in Section 4): `calgary-march-2026` slug.
- **[`src/app/api/admin/init-agenda/route.ts`](src/app/api/admin/init-agenda/route.ts):** `"platform-calgary"` venue key.
- **[`scripts/add-agenda-items.ts`](scripts/add-agenda-items.ts)**, **[`scripts/remove-build-session-speaker.ts`](scripts/remove-build-session-speaker.ts):** Any slug references.

**Redirects (Section 7):**
- Add backward-compat redirects from old `calgary-*` paths to new `shanghai-*` paths.
- Broaden admin slug regex pattern.

**Verification:** After the rename, navigate to old `calgary-*` URLs and confirm they redirect correctly to `shanghai-*` equivalents.

## 6. Timezone defaults — full file list

Replace every `"America/Edmonton"` with `siteConfig.defaultTimezone` (or `event.timezone || siteConfig.defaultTimezone`). **All 19 files:**

- [`src/lib/utils.ts`](src/lib/utils.ts) — `formatTime`/`formatDate` default params
- [`src/lib/mock/data.ts`](src/lib/mock/data.ts) — timezone field
- [`src/app/admin/_clients/agenda/AgendaAdminClient.tsx`](src/app/admin/_clients/agenda/AgendaAdminClient.tsx) — 4 occurrences (offset math + fallbacks)
- [`src/components/agenda/EventPageClient.tsx`](src/components/agenda/EventPageClient.tsx)
- [`src/components/layout/EventHeader.tsx`](src/components/layout/EventHeader.tsx)
- [`src/app/[eventSlug]/page.tsx`](src/app/[eventSlug]/page.tsx) — 2 occurrences
- **[`src/components/agenda/AgendaList.tsx`](src/components/agenda/AgendaList.tsx)** — default parameter
- **[`src/components/admin/ActiveVenueSelector.tsx`](src/components/admin/ActiveVenueSelector.tsx)** — hardcoded
- **[`src/components/admin/AdminEventControls.tsx`](src/components/admin/AdminEventControls.tsx)** — hardcoded
- **[`src/app/admin/_clients/announcements/AnnouncementsClient.tsx`](src/app/admin/_clients/announcements/AnnouncementsClient.tsx)**
- **[`src/app/admin/_clients/demos/DemosAdminClient.tsx`](src/app/admin/_clients/demos/DemosAdminClient.tsx)**
- **[`src/app/admin/[adminCode]/events/page.tsx`](src/app/admin/[adminCode]/events/page.tsx)** — hardcoded
- **[`src/lib/actions/registration.ts`](src/lib/actions/registration.ts)** — hardcoded (no event context)
- **[`src/lib/actions/demo.ts`](src/lib/actions/demo.ts)** — 2 occurrences
- **[`src/lib/demo/service.ts`](src/lib/demo/service.ts)** — 3 occurrences
- **[`src/app/[eventSlug]/(main)/demos/page.tsx`](src/app/[eventSlug]/(main)/demos/page.tsx)** — 2 occurrences
- [`supabase/migrations/bootstrap_events_house831.sql`](supabase/migrations/bootstrap_events_house831.sql) — reference only, do not edit (history)
- [`supabase/migrations/add_timezone_to_events.sql`](supabase/migrations/add_timezone_to_events.sql) — reference only, do not edit

Files in **bold** were missing from the original plan.

## 7. `next.config.mjs` — redirects and domain allowlist (was missing entirely)

**[`next.config.mjs`](next.config.mjs):**

- **New slug redirects**: For each renamed slug (e.g. `calgary-feb-2026` to `shanghai-feb-2026`), add a permanent redirect so old bookmarked URLs still work:
  - `{ source: "/calgary-feb-2026/:path*", destination: "/shanghai-feb-2026/:path*", permanent: true }`
  - Same pattern for all renamed slugs.
- **Existing redirects**: The old `calgary-jan-2026` to `calgary-feb-2026` chain now needs to point to the new `shanghai-*` destination.
- **Admin slug pattern**: Broaden the regex from `calgary-[^/]+` to `(calgary|shanghai)-[^/]+` (or just `[^/]+` if there is no ambiguity risk).
- **Image domain allowlist**: Keep `cursorcalgary.com` entries for now (traffic may still come through). No additions needed since the new image is a local file.

## 8. Static asset swap (was missing)

The replacement image already exists at `public/cursor_china_photo/cursor-SHANGHAI-CHINA.png`.

- Update all `src="/cursor-calgary.avif"` to `src="/cursor_china_photo/cursor-SHANGHAI-CHINA.png"` in:
  - [`EventHeader.tsx`](src/components/layout/EventHeader.tsx)
  - [`[eventSlug]/page.tsx`](src/app/[eventSlug]/page.tsx)
  - [`intake/page.tsx`](src/app/[eventSlug]/intake/page.tsx)
  - [`feedback/page.tsx`](src/app/[eventSlug]/feedback/page.tsx)
- Update `alt` text from `"Cursor Calgary"` to `"Cursor Shanghai"` (or use `siteConfig` helper).
- Update the regex in [`scripts/assign-china-photos.ts`](scripts/assign-china-photos.ts) that matches `cursor-calgary.avif`.

## 9. Content and mock data

**[`src/content/events.ts`](src/content/events.ts):**
- Update event IDs from `calgary-*` to `shanghai-*`.
- Update titles, locations to Shanghai/China.
- Update per-event `lumaUrl` values (e.g. `lu.ma/onlcm9o9`) to placeholder URLs until real Shanghai Luma events are created.

**[`src/lib/mock/data.ts`](src/lib/mock/data.ts):** (scope is larger than original plan noted)
- `MOCK_EVENT`: name, venue, address, slug
- `MOCK_ATTENDEE_PROFILE`: intent text ("meet other builders in Calgary")
- `MOCK_THEMES`: "Raising Your First Round... in Canada" text
- `MOCK_PLANNED_EVENTS`: all Calgary titles, venues, addresses, city fields
- `MOCK_VENUES`: "Platform Calgary" names and addresses
- `MOCK_CITIES`: "Calgary" as first city

**[`scripts/assign-china-photos.ts`](scripts/assign-china-photos.ts):** Align event data objects and the `cursor-calgary.avif` regex with the new branding.

**[`scripts/seed-planned-events.sql`](scripts/seed-planned-events.sql):** (was missing) Update Calgary city/venue/address values and comments.

## 10. Passwords and exports (security-sensitive)

No change from original plan — covers:
- [`ExportClient.tsx`](src/app/admin/_clients/export/ExportClient.tsx)
- [`DataManagementClient.tsx`](src/app/admin/_clients/[adminCode]/data/DataManagementClient.tsx)
- [`supabase/admin-users.sql`](supabase/admin-users.sql)

Rename secret from `CursorCalgary2026` to a new value. Prefer env var for the download gate.

## 11. Database migrations

- **Do not edit** existing migration files (history integrity).
- **Add one new migration** that:
  - Updates live `events` row(s): `slug` (from `calgary-*` to `shanghai-*`), `title`, `location`/address to Shanghai/China TBA, `timezone` to `Asia/Shanghai`.
  - Updates `app_settings` `active_event_slug` value if it references a `calgary-*` slug.
  - Updates any `venues` rows with Calgary city/address data.
- Update [`supabase/schema.sql`](supabase/schema.sql) reference snapshot seed data (currently has `'calgary-jan-2026'`, `'Calgary, AB'`).

## 12. Documentation

- [`README_DEMO_SIGNUP_HANDOFF.md`](README_DEMO_SIGNUP_HANDOFF.md): Replace `America/Edmonton` example and Calgary wording with `Asia/Shanghai` and Shanghai/China.

## 13. Scripts with Calgary comments (low priority, was missing)

These are one-time scripts with Calgary only in comments. Update for grep-cleanliness:
- [`scripts/add-agenda-items.ts`](scripts/add-agenda-items.ts)
- [`scripts/update-agenda-jan-2026.sql`](scripts/update-agenda-jan-2026.sql)
- [`scripts/fix-agenda-times.sql`](scripts/fix-agenda-times.sql)

## 14. Locale: `en-CA` to `zh-CN` — with CRITICAL parsing caveat (new)

**`zh-CN` outputs `2026/3/26` (slashes, no zero-padding) instead of `en-CA`'s `YYYY-MM-DD`.** Three functions parse formatted dates with `.split("-")` — blindly switching these to `zh-CN` will **silently break date math**.

**DO NOT change locale in these parsing-dependent functions** (keep `en-CA`):
- [`src/lib/demo/service.ts`](src/lib/demo/service.ts) — `toUtcIso()` uses `en-CA` to get `YYYY-MM-DD`, then `split("-")` on line 37
- [`src/lib/actions/demo.ts`](src/lib/actions/demo.ts) — `toUtcIso()` same pattern, `split("-")` on line 33
- [`src/lib/actions/event-dashboard.ts`](src/lib/actions/event-dashboard.ts) — `localDateTime()` uses `en-CA` to get `YYYY-MM-DD` (line 186-191), comment confirms the expected format

**Change to `zh-CN` only in display-only contexts** (5 files):
- [`src/components/admin/ActiveVenueSelector.tsx`](src/components/admin/ActiveVenueSelector.tsx) — `toLocaleDateString("en-CA", ...)`
- [`src/components/admin/AdminEventControls.tsx`](src/components/admin/AdminEventControls.tsx) — `toLocaleDateString("en-CA", ...)`
- [`src/app/admin/_clients/demos/DemosAdminClient.tsx`](src/app/admin/_clients/demos/DemosAdminClient.tsx) — `Intl.DateTimeFormat("en-CA", ...)` display formatter
- [`src/app/admin/_clients/event-dashboard/CalendarAdminTab.tsx`](src/app/admin/_clients/event-dashboard/CalendarAdminTab.tsx) — `toLocaleDateString("en-CA", ...)` (2 occurrences, both display-only)
- [`src/lib/actions/registration.ts`](src/lib/actions/registration.ts) — `toLocaleString("en-CA", ...)` (label formatting)

## 15. Rename `utcToMstLocal()` and parametrize (new)

**[`src/app/admin/_clients/agenda/AgendaAdminClient.tsx`](src/app/admin/_clients/agenda/AgendaAdminClient.tsx):**

- Rename `utcToMstLocal()` to `utcToLocalDatetime(utcString, timezone)`.
- Replace all internal `"America/Edmonton"` hardcodes with the `timezone` parameter (pass `event.timezone || siteConfig.defaultTimezone`).
- Update all comments that say "MST" to be timezone-agnostic (e.g. "Convert UTC to event-local time").
- Update call sites `utcToMstLocal(item.start_time)` to `utcToLocalDatetime(item.start_time, event.timezone || siteConfig.defaultTimezone)`.

## 16. Mock data UTC offsets and secondary cities (new)

**[`src/lib/mock/data.ts`](src/lib/mock/data.ts):**
- All `-07:00` offsets in `start_time`, `end_time`, `timer_end_time` and agenda items should become `+08:00` (Asia/Shanghai = UTC+8).
- Replace Edmonton/Vancouver secondary cities with Chinese cities (e.g. Beijing, Shenzhen):
  - `MOCK_VENUES`: "Startup Edmonton" to a Shanghai/Beijing venue
  - `MOCK_CITIES`: replace Calgary/Edmonton/Vancouver with Shanghai/Beijing/Shenzhen

**[`src/lib/mock/queries.ts`](src/lib/mock/queries.ts):**
- All `-07:00` offsets in `getSeriesAttendanceData()` and `getCheckInCurve()` return values should become `+08:00`.

## Verification

After all changes, grep for **all** of these patterns (allow-listed only in migration history and intentional backward-compat redirects):

- `Calgary` (case-insensitive)
- `America/Edmonton`
- `CursorCalgary` / `cursorcalgary`
- `cursor-calgary` (image filename)
- `Canada` (country references)
- `calgary-` (event slugs)
- `en-CA` (locale)
- `MST` / `Mountain` (timezone name references)
- `-07:00` (MST UTC offset in mock data)

Run lint/typecheck. Smoke-test: landing metadata, event pages, admin calendar/venue labels, agenda times with `Asia/Shanghai`, easter egg conditional, date formatting in admin tools after locale change, and JSON-LD output on landing page (built from `siteConfig` + `events.ts` via `buildHomeJsonLd()` in `LandingPage.tsx`).

## 17. Supabase Dashboard settings (NOT in code — manual step) (new)

These are settings in the **Supabase web console**, not in the codebase:

- **Authentication > URL Configuration > Site URL**: If set to `cursorcalgary.com`, password reset and magic link emails will generate broken links. Update to the Render production URL.
- **Authentication > URL Configuration > Redirect URLs**: Add the new production URL to the allowlist.
- **Authentication > Email Templates**: Check for hardcoded "Calgary" strings in email subject/body copy.
- **Project Settings > General**: Check project name for Calgary branding.

## 18. Layout `metadataBase` (new)

In [`src/app/layout.tsx`](src/app/layout.tsx), set `metadataBase` at the top level of the `metadata` export (not just inside `openGraph`). This ensures all relative OG image URLs resolve correctly:

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  // ...
};
```

## Deployment notes

- **DST simplification**: America/Edmonton has daylight saving time (UTC-7 winter / UTC-6 summer). Asia/Shanghai does **not** have DST (always UTC+8). This means timezone math is simpler after the switch — no edge cases around spring/fall transitions.
- **Timezone abbreviation**: `Asia/Shanghai` displays as `"CST"` which collides with US Central Standard Time. Consider using `timeZoneName: "shortOffset"` in formatters for clarity (shows `"+08"` instead of `"CST"`).
- **Great Firewall**: No Google Fonts, reCAPTCHA, Google Analytics, or Google Maps dependencies were found in the source code. The app should be accessible from within China, but test the Render URL using a China connectivity checker (e.g. 17CE.com) during the event.

## Confirmed clean (no changes needed)

The following were audited and contain **no** Calgary/Canada-specific references:

- Email templates (`lib/email/resend.ts`, `post-event.ts`, `notifications.ts`, `auth.ts`, `post-event-emails.ts`)
- PWA manifest / `site.webmanifest` (none exists)
- `robots.txt` / sitemap (none exists)
- Favicon / `apple-touch-icon` metadata (none set)
- OG image files in app directory (none exist — OG is text-only in `layout.tsx`)
- Stripe / payment configs (none exist)
- GDPR / PIPEDA / privacy law references (none in code)
- Google Maps / coordinates / map embeds (none in code)
- `.env.local.example` (generic placeholders only; Twilio `+1` kept as-is)
- `package.json` name/scripts (uses `cursor-popup-portal`, no Calgary branding)
- `render.yaml` (no Calgary references)
- CI/CD configs (none exist)
- `tsconfig.json` (no location-specific paths)
- `EventNav.tsx` `build-idea-generator.onrender.com` link (external service, kept as-is)
