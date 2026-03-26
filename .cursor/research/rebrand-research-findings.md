# Rebrand Research: Calgary to Shanghai — Gap Analysis

Research conducted against the existing 16-section, 50+ file rebrand plan.

---

## 1. Next.js-Specific Metadata & Config Commonly Missed

**Your plan already covers:** `layout.tsx` metadata, `next.config.mjs`, JSON-LD via `buildHomeJsonLd()`, and confirms no PWA manifest / sitemap / robots.txt exist.

**Potential gaps found:**

| Item | Status | Notes |
|---|---|---|
| **`manifest.json` / `site.webmanifest`** | Clean | Plan confirms none exists. |
| **`robots.txt` / `sitemap.xml`** | Clean | Plan confirms none exists. |
| **JSON-LD structured data** | Covered | `LandingPage.tsx:buildHomeJsonLd()` reads from `siteConfig` and `events.ts`, so it updates automatically once those are changed. **No gap.** |
| **OG image alt text / filenames** | Covered | Plan Section 8 covers the `.avif` → `.png` swap and alt text updates. |
| **`metadataBase`** | Partially covered | `layout.tsx` has `url: "https://cursorcalgary.com"` hardcoded in `openGraph`. The plan says to replace with `siteConfig.siteUrl`. Ensure `metadataBase` is also set at the export level for canonical URL resolution — not just inside `openGraph`. |
| **Vercel/Render `SITE_URL` env var** | Not in plan | If `NEXT_PUBLIC_SITE_URL` is set in the Render dashboard or `.env`, it needs updating to match the new production URL. The `.env.local.example` is generic (no hardcoded URL), but the **live Render environment variables** should be audited. |
| **Service Worker / cache** | N/A | No service worker exists. |
| **`_document.tsx` lang attribute** | Check | If using Pages Router `_document.tsx`, the `<html lang="en">` attribute is set there. In App Router, it's in `layout.tsx`. Verify the `lang` attribute matches the target audience (keep `"en"` if the UI stays English, or set `"zh"` if localizing). |

**Verdict: Your plan is comprehensive for Next.js artifacts. The only additions are (a) confirm `metadataBase` is set at the top-level metadata export, and (b) audit Render env vars for `SITE_URL`.**

---

## 2. Supabase-Specific Settings That May Reference Old Locations/Domains

**Your plan covers:** Database migrations for event slugs, `active_event_slug`, venues, and schema snapshot.

**Supabase Dashboard settings to audit:**

| Setting | Location in Dashboard | What to check |
|---|---|---|
| **Site URL** | Authentication → URL Configuration | This is the base URL Supabase uses for password reset links, magic links, and email confirmations. If set to `https://cursorcalgary.com`, it must be updated. |
| **Redirect URLs allow-list** | Authentication → URL Configuration | Any `cursorcalgary.com` entries must be updated (or kept if the domain still redirects). Add the new production URL. |
| **Email templates** | Authentication → Email Templates | Templates use `{{ .SiteURL }}` variable which auto-resolves from the Site URL setting. If any template has **hardcoded** URLs or city names in the copy, update them. |
| **Custom SMTP sender name** | Authentication → SMTP Settings | If the "From" name says "Cursor Calgary", update it. |
| **Project region** | Project Settings → General | This is **immutable** after project creation. If the Supabase project is in a US/Canada region and you want lower latency from China, you'd need to create a new project in the Singapore region. However, this is a latency optimization, not a blocker. |
| **Auth providers (OAuth redirect URIs)** | Authentication → Providers | If using Google/GitHub OAuth, the redirect URIs registered with those providers must include the new domain. |
| **RLS policies** | Table Editor → Policies | These typically reference `auth.uid()` or roles, not domains/locations. **Unlikely to need changes** unless a policy checks against a hardcoded event slug (e.g., `slug = 'calgary-march-2026'`). |
| **Edge Functions** | If any exist | Check for hardcoded URLs or location strings. |
| **Scheduled/cron jobs** | If configured via Supabase | The `render.yaml` cron services are commented out, but if Supabase has scheduled functions, they may reference old endpoints. |

**Verdict: The Supabase Dashboard "Site URL" and "Redirect URLs" settings are the most critical items NOT covered in the plan. These are not in code — they're in the Supabase web console.**

---

## 3. `en-CA` → `zh-CN` Locale Change: Date Parsing Risks

This is the **highest-risk technical issue** in the rebrand.

### The Problem

`en-CA` locale produces ISO-style dates: `2026-03-26` (with dashes, zero-padded).
`zh-CN` locale produces: `2026/3/26` (with slashes, **no zero-padding**).

### Affected Code Patterns

**CRITICAL — These functions use `en-CA` specifically for its `YYYY-MM-DD` output, then parse with `split("-")`:**

| File | Function | How it uses en-CA output |
|---|---|---|
| `src/lib/demo/service.ts:35-38` | `toUtcIso()` | `datePart.split("-").map(Number)` — **will break** with zh-CN (`/` separator) |
| `src/lib/actions/demo.ts:32-34` | `toUtcIso()` | Same pattern — **will break** |
| `src/lib/actions/event-dashboard.ts:184-191` | `localDateTime()` | Returns `date` formatted as `"YYYY-MM-DD"` with comment saying so — downstream code depends on this format |

**SAFE — These use `formatToParts()` instead of string splitting:**

| File | Function | Why safe |
|---|---|---|
| `src/lib/demo/service.ts:17-32` | `getUtcOffsetMs()` | Uses `formatToParts()` → `parseInt()` per part. Locale doesn't affect part extraction. |
| `src/lib/actions/demo.ts:13-28` | `getUtcOffsetMs()` | Same pattern — safe. |

**DISPLAY-ONLY — No parsing, locale change just affects visual output:**

| File | Pattern |
|---|---|
| `CalendarAdminTab.tsx:85` | `monthLabel()` — `toLocaleDateString("en-CA", { month: "long", year: "numeric" })` |
| `CalendarAdminTab.tsx:508` | Month display |
| `ActiveVenueSelector.tsx:57` | Date label |
| `AdminEventControls.tsx:17` | Event label |
| `registration.ts:483` | Export filename label |

### Recommendation

**Do NOT blindly replace `"en-CA"` with `"zh-CN"` in parsing-critical code.** Instead:

1. **For `getUtcOffsetMs()` and `toUtcIso()` in `demo/service.ts` and `actions/demo.ts`:** Keep using `"en-CA"` (or better, use `formatToParts()` consistently). The locale here is a **formatting tool**, not a user-facing string. `en-CA` is chosen specifically because it produces ISO-compatible output.

2. **For `localDateTime()` in `event-dashboard.ts`:** Same — keep `"en-CA"` or switch to `formatToParts()`.

3. **For display-only usage** (admin labels, calendar headers): Safe to change to `"zh-CN"` if you want Chinese month/date display, or keep `"en-US"` if the admin UI stays English.

4. **Best practice:** Create a constant like `const ISO_LOCALE = "en-CA"` or `"sv-SE"` (Swedish also produces `YYYY-MM-DD`) for parsing contexts, separate from the display locale.

---

## 4. Timezone Change: America/Edmonton → Asia/Shanghai — DST Pitfalls

### Key Differences

| Property | America/Edmonton (MST/MDT) | Asia/Shanghai (CST) |
|---|---|---|
| Standard offset | UTC-7 | UTC+8 |
| DST offset | UTC-6 (Mar–Nov) | **None — China has no DST** |
| UTC offset swing | 15 hours apart (winter) / 14 hours (summer) | Fixed +8 year-round |

### What This Means for Your Code

**Simplification (good news):** Switching TO Shanghai **eliminates** DST edge cases. `Asia/Shanghai` is a fixed-offset timezone. Code that currently needs to handle the Edmonton DST transition (where 2:00 AM either doesn't exist or happens twice) becomes simpler.

**Subtle issues to watch:**

1. **Historical date calculations:** If your app ever displays or calculates dates that occurred while the app was running in Edmonton time (e.g., past event timestamps stored as UTC), those will now render in Shanghai time. This is correct behavior if the intent is "show in event-local time," but confusing for historical Calgary events.

2. **`utcToMstLocal()` function (`AgendaAdminClient.tsx`):** The plan already covers renaming this and parameterizing the timezone. The critical detail: the function currently does `new Date(date.toLocaleString("en-US", { timeZone: "America/Edmonton" }))` which is a well-known hack that works but has edge-case bugs around DST transitions. For Shanghai, this simplifies since there are no DST transitions.

3. **Mock data offsets:** The plan covers changing `-07:00` to `+08:00`. Note that some mock dates may use `-06:00` (MDT summer offset). Search for both `-07:00` AND `-06:00` in mock data.

4. **Cron timing:** If any cron jobs or scheduled tasks reference specific UTC hours that were chosen to align with Edmonton business hours, they need recalculating for Shanghai. A 9 AM MST cron (16:00 UTC) would need to become 9 AM CST (01:00 UTC).

5. **`Intl.DateTimeFormat` timezone abbreviation:** The `formatTime()` in `utils.ts` extracts `timeZoneName: "short"` to display the timezone abbreviation. For Shanghai, this will show `"CST"` (China Standard Time), which unfortunately collides with "Central Standard Time" (US). Consider using `timeZoneName: "shortOffset"` (shows `"GMT+8"`) for clarity if the app serves an international audience.

### Recommendation

Add `-06:00` to the verification grep patterns (Section 16/Verification). The plan currently only lists `-07:00`.

---

## 5. China Deployment: Infrastructure Concerns

**This is the most impactful area not addressed in the code-level plan.** These are deployment/infrastructure concerns:

### Blocked Services Behind the Great Firewall

| Service | Status in China | Impact on Your App | Mitigation |
|---|---|---|---|
| **Google Fonts** | Blocked | If loaded via `fonts.googleapis.com`, pages will hang or be extremely slow | Self-host fonts or use Chinese CDN alternatives (e.g., fonts from `fonts.loli.net`) |
| **Google reCAPTCHA** | Blocked | Forms won't submit | Replace with hCaptcha, GeeTest, or Tencent Captcha |
| **Google Analytics** | Blocked | No tracking data | Use Baidu Analytics, Umami (self-hosted), or Plausible |
| **Google Maps** | Blocked | Map embeds fail | Use Baidu Maps or Amap (Gaode) |
| **Vercel** | Intermittently slow/blocked | If serving from Vercel edge | You're on Render — check Render's China accessibility |
| **GitHub (raw/API)** | Intermittently blocked | If app fetches from GitHub at runtime | Cache or proxy GitHub API calls |
| **Cloudflare** | Partially blocked | Some Cloudflare-fronted sites degraded | N/A if not using Cloudflare |
| **Stripe** | Not blocked but restricted | Payment processing works but requires Chinese entity | Check if your app uses Stripe |
| **Render.com** | Unknown/variable | Your production host | **Test from within China** — Render's US servers may have high latency (200-500ms+) |

### Regulatory Requirements

| Requirement | Timeline | Needed? |
|---|---|---|
| **ICP Filing** (备案) | 2-4 weeks | Required if hosting on mainland China servers. Not required if hosting outside China (but performance suffers). |
| **ICP Commercial License** | 60-90 days | Only if the site generates revenue in China. |
| **Data residency (PIPL)** | Ongoing | If collecting personal data from Chinese citizens, data must be stored on servers within China under PIPL (Personal Information Protection Law). Your Supabase instance location matters here. |

### Practical Recommendations

1. **Test your production URL from China** using tools like [17CE](https://www.17ce.com/), [BOCE](https://www.boce.com/), or [GreatFire Analyzer](https://en.greatfire.org/analyzer). This tells you if Render's servers are accessible and how fast.

2. **Audit third-party script dependencies.** Run your site through a dependency analyzer to find any resources loaded from blocked domains. Key things to check:
   - Font loading (`@import url('fonts.googleapis.com/...')` in CSS)
   - Analytics scripts
   - CDN-hosted libraries (cdnjs, jsdelivr are generally OK; Google CDN is not)
   - Social media embeds

3. **If targeting users IN China (not just rebranding the event name):** Consider Hong Kong hosting as a middle ground — no ICP required, much better latency than US servers, and most services work.

4. **If this is only a theme/branding change** (the event is in Shanghai but users access from global locations): The Great Firewall issues are less critical. You mainly need to ensure the app works for attendees who are in China during the event.

### Quick Dependency Audit Checklist

Run these greps against your codebase:

```
fonts.googleapis.com
google-analytics.com
googletagmanager.com
maps.googleapis.com
recaptcha
gstatic.com
facebook.net
connect.facebook.net
cdn.jsdelivr.net (usually OK)
unpkg.com (usually OK)
```

---

## Summary: Items NOT in Your Current Plan

| # | Item | Severity | Action |
|---|---|---|---|
| 1 | **Supabase Dashboard: Site URL setting** | HIGH | Update in Authentication → URL Configuration |
| 2 | **Supabase Dashboard: Redirect URLs allow-list** | HIGH | Add new production URL |
| 3 | **`en-CA` used for date PARSING (not display)** | CRITICAL | Do NOT change to `zh-CN` in `demo/service.ts`, `actions/demo.ts`, `event-dashboard.ts` parsing functions. Keep `en-CA` or refactor to `formatToParts()`. |
| 4 | **Render env var `NEXT_PUBLIC_SITE_URL`** | MEDIUM | Audit and update in Render dashboard |
| 5 | **Supabase email template copy** | LOW | Check for hardcoded city names in template HTML |
| 6 | **SMTP sender name** | LOW | If it says "Cursor Calgary", update in Supabase SMTP settings |
| 7 | **`-06:00` (MDT offset) in mock data** | LOW | Add to verification grep patterns |
| 8 | **China accessibility testing** | MEDIUM | Test production URL from China before the event |
| 9 | **Third-party script audit for GFW** | MEDIUM | Grep for Google Fonts, Analytics, reCAPTCHA in CSS/HTML |
| 10 | **`metadataBase` in layout.tsx** | LOW | Ensure it's set at the top-level `metadata` export, not just inside `openGraph` |
| 11 | **Timezone abbreviation collision** | LOW | `CST` = both China Standard Time and Central Standard Time. Consider `shortOffset` format. |

---

*Sources: MDN Intl.DateTimeFormat docs, Supabase Auth docs (redirect-urls, email-templates, general-configuration), Next.js metadata API docs, GreatFire Analyzer database (2026), 21CloudBox China CDN Guide, timeanddate.com DST schedules.*
