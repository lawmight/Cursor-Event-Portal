# Upstream Sync Analysis & Plan — `lawmight/Cursor-Event-Portal` vs `cursorcommunityled/Cursor-Event-Portal`

> Read-only analysis. No destructive git operations have been performed.
> Only change to the local repo state: a read-only `upstream` remote was added
> (`git remote add upstream https://github.com/cursorcommunityled/Cursor-Event-Portal.git`)
> and `git fetch upstream` was run. Probe merge was done in a throwaway worktree
> that has been removed.

## 1. Current drift (measured)

- **Merge base:** `17914f0` — this is the commit your Shanghai rebrand and Next 16 upgrade branched away from (it sits on top of upstream's `main` from before the photo / recap / security wave).
- **Behind upstream/main:** **27 commits** (non-merge) — one more than your last-known picture of 26.
- **Ahead of upstream/main:** **15 commits** (non-merge) / 18 including merges.
- Fetch date: `2026-04-22`.

Reproduce:

```bash
git fetch upstream
git merge-base main upstream/main                 # => 17914f0
git rev-list --left-right --count upstream/main...main   # => 26  18  (with merges)
git log --oneline --no-merges upstream/main ^main        # => 27 lines
git log --oneline --no-merges main ^upstream/main        # => 15 lines
```

## 2. Categorized upstream-only commits (27)

Ordered newest → oldest. Tag legend: **[SEC]** security, **[DB]** migration/schema, **[FEAT]** new feature, **[FIX]** bugfix, **[CFG]** config/build, **[DUP]** likely already ported to fork manually, **[CAL]** Calgary-specific content that must be adapted for Shanghai.

### Security / DB (must go in first, no photo/recap depends on them)

- `4f25a48` **[SEC][DB]** `fix(security): make RLS migration self-bootstrapping`
- `1b21548` **[SEC][DB]** `security: commit existing RLS migration for users/credits/venues/themes` → new file `supabase/migrations/enable_rls_all_missing_tables.sql`
- `5383d73` **[SEC][DB]** `security: harden RLS, admin auth, cron secrets, and rate limiting` — touches `src/middleware.ts`, `src/lib/auth/*`, admin API routes, cron routes, `supabase/schema.sql`, `supabase/admin-users.sql`, and the new RLS migration.

### Event dashboard / Luma / admin fixes

- `1b6a9f0` **[FEAT]** Event status toggle on Venue tab + `setEventStatus` auth fix
- `2b1ecf0` **[FIX]** Fix Live Event / Admin View switcher (removes broken attendee-session check)
- `3d20c4a` **[FIX]** `promoteToEvent`: remove `timezone` column from insert
- `0c4570b` **[FIX]** `promoteToEvent` 500: normalize `HH:MM:SS` time before ISO construction
- `8997113` **[FEAT]** Luma description import + promote planned → live events

### Upcoming-events content + UI

- `1a94a95` **[CAL][DUP-ish]** "Drop redundant Calgary from upcoming event titles" — touches `src/content/events.ts` (your fork already localized this to Shanghai; **conflict guaranteed**)
- `58f9d31` **[FEAT/DUP]** Consistent card layout for upcoming events — you already ported a variant as `feat: GA4, archived event status, unified upcoming cards` (`f160ad4`). Review to see if upstream's version adds anything net-new.
- `c45ae74` **[CAL][FEAT]** Add **SAIT Hackathon (May 23–24, Calgary)** to upcoming events — this is *new content the fork does not have*, but Calgary-only; **needs adaptation / drop** for Shanghai.
- `5dda804` **[DUP][DB]** "Add archived event status, hide Mar 11 & Mar 14 non-meetup events" → adds `supabase/migrations/add_archived_event_status.sql` (upstream name, no date prefix). **Your fork has `20260415_add_archived_event_status.sql` with equivalent SQL.** Keep fork's migration; accept the `src/lib/supabase/queries.ts` + `src/types/index.ts` + admin page changes. The upstream migration file itself should be treated as a duplicate and dropped (do NOT edit either historical migration file).

### Analytics / Node pin / build

- `7d5ba5f` **[DUP][FEAT]** Add GA4 to all pages — **already present on fork** (`f160ad4`). Accept your version; take `.env.local.example` additions if they include keys you don't have.
- `28636f8` **[DUP-ish][CFG]** Pin Node 20.18.1 for Render — your fork already pins `>=20.0.0 <21.0.0` in `package.json.engines` and you bumped beyond upstream in `5a8a821`. Accept fork values; verify `.nvmrc` / `.node-version` match exactly.

### Competitions

- `b52fd40` **[FEAT]** Competitions: edit entry modal, admin updates, upload API tweaks — 7 files, all in `components/competitions/`, admin client, and `lib/actions/competitions.ts`. Likely the biggest net-new code block still missing from fork.

### Photos pipeline (the big chunk)

- `6da59af`, `04ab923` **[FIX/FEAT]** Recap gallery speed + crash fixes (native thumbnails, prefetch, single-page rendering, img lightbox)
- `2de37c0` **[FIX]** TypeScript narrowing fix in `PhotosAdminTab`
- `293c27a` **[FEAT]** Admin hero gallery curation — star photos to feature on homepage
- `0670d9c` **[FEAT][DB]** Paginated photo gallery on event recaps + lightbox viewer → adds `supabase/migrations/add_hero_featured_to_event_photos.sql` (**your fork already has this migration file** — verify contents identical, then don't re-add)
- `5824622` **[FIX]** Hero gallery only swaps 1–2 photos from DB, keep curated static mix
- `4441ae3` **[FEAT][CFG]** ZIP file batch photo uploads with progress — adds **`jszip@^3.10.1`** to `package.json`
- `5d815ca` **[FEAT]** Auto-generate event recaps and hero gallery from approved photos
- `179bda8` **[FEAT]** Admin photo upload: drag-and-drop, multi-file, auto-approve → `src/app/api/admin/upload-event-photo/route.ts`
- `9320e49` **[FEAT][DB]** Event photo upload system with admin approval workflow → adds `supabase/migrations/create_event_photos.sql` (**fork already has this file**); new page `src/app/[eventSlug]/(main)/photos/page.tsx`; new API route `src/app/api/upload-event-photo/route.ts`; new component `src/components/photos/PhotoUploadClient.tsx`.

### Ambassador polish

- `d0aed3e` **[DUP-ish]** Full color + hover glow on ambassador photos. Your fork already customized `AmbassadorSection.tsx` (Tom Coustols photo in `ddcf2e7`), so pick the upstream styling carefully — keep the ambassador identity from fork.

## 3. Your 15 fork-only commits (for reference)

```
bea6f7e Point footer and upcoming event Luma links to lu.ma/cursor
ddcf2e7 content: update ambassador listing to Tom Coustols with photo
f160ad4 feat: GA4, archived event status, unified upcoming cards
5a8a821 chore: sync package-lock.json with package.json engines field
c66053e feat: persist mock photo and competition updates
b3616eb fix: avoid server-action type export crash
e2a2947 feat: add mock-safe photo workflows and entry editing
d35e76b feat: sync upstream photo and competition foundations
77c1b65 Upgrade to Next 16, React 19, Tailwind CSS 4 & modernize dev environment (#5)
4347e51 Rebrand portal from Calgary to Shanghai (#2)
8f1287d feat(content): add China photo set for landing content
3d73a1b docs(rebrand): add Shanghai planning notes
0be6d30 chore(git): ignore cursor hook state files
eae591e chore(render): comment out cron jobs and CRON env until launch
5d468d6 fix(render): declare cron env keys; align eslint-config with Next 14
```

The Next 16 / React 19 / Tailwind v4 upgrade (`77c1b65`) is the single riskiest divergence: it rewrote `package.json`, bumped many libs beyond what upstream has, and dropped `canvas` + `autoprefixer`. Upstream is still on **Next 14.2.21 / React 18 / Tailwind 3**. Anything from upstream that does DOM-typed tricks (drag-and-drop, ZIP upload progress, lightbox) must be re-verified against React 19 strict-mode + Next 16 behavior.

## 4. Probed merge conflicts (actual, from `git merge --no-commit upstream/main`)

**17 files unmerged.** Breakdown:

### Add/add conflicts (both sides created the same path independently)

- `src/app/[eventSlug]/(main)/photos/page.tsx`
- `src/app/api/admin/upload-event-photo/route.ts`
- `src/app/api/upload-event-photo/route.ts`
- `src/components/analytics/GoogleAnalytics.tsx`  *(fork's GA4 impl vs upstream's)*
- `src/components/photos/PhotoUploadClient.tsx`
- `src/lib/actions/photos.ts`

Resolution strategy: in almost every case, **take upstream's version** as the baseline (it is the canonical photo workflow implementation the fork's port was a stop-gap for), then re-apply your mock-mode hooks from `e2a2947`, `c66053e`, `b3616eb`.

### Content conflicts (textual three-way merge failed)

- `src/content/events.ts` — the single biggest semantic conflict: **your Shanghai events vs upstream's Calgary + SAIT + title-cleanup**. Manual edit required; decision framework below.
- `src/app/admin/[adminCode]/page.tsx`
- `src/app/admin/_clients/[adminCode]/social/EventSocialClient.tsx`
- `src/app/admin/_clients/event-dashboard/VenueAdminTab.tsx`
- `src/app/layout.tsx` — fork's GA4 wiring vs upstream's GA4 wiring.
- `src/components/admin/EventSocialCard.tsx`
- `src/lib/actions/competitions.ts`
- `src/lib/mock/data.ts` — conflict because your mock-mode port diverged from upstream's Supabase-first `data.ts`.
- `package.json` / `package-lock.json` — **guaranteed, non-trivial**, because of the Next 16 upgrade.

### Auto-merged (no conflict, but review still required)

- `src/app/admin/[adminCode]/events/page.tsx`
- `src/app/admin/_clients/event-dashboard/CalendarAdminTab.tsx`
- `src/app/admin/_clients/[adminCode]/social/PhotosAdminTab.tsx`
- `src/components/admin/CompetitionsAdminClient.tsx`
- `src/components/competitions/CompetitionCard.tsx`
- `src/components/landing/AmbassadorSection.tsx`  *(review vs Tom Coustols port)*
- `src/components/landing/BentoGrid.tsx`
- `src/components/landing/HeroHeader.tsx`
- `src/components/landing/LandingPage.tsx` — also touches `buildHomeJsonLd()`, confirm Shanghai JSON-LD survives.
- `src/components/landing/PastEvents.tsx`
- `src/components/landing/UpcomingEvents.tsx` — you already have a "unified" version; compare.
- `src/components/layout/EventNav.tsx`
- `src/content/events.ts` *(separate region than the conflicted one)*
- `src/lib/actions/event-dashboard.ts`
- `src/lib/notifications.ts`
- `src/lib/supabase/queries.ts`
- `src/types/index.ts`
- `supabase/admin-users.sql`
- `supabase/schema.sql`
- `scripts/bulk-upload-photos.ts` *(new file)*

### Migrations

- **Fork-only:** `20260326_shanghai_rebrand.sql`, `20260415_add_archived_event_status.sql`
- **Upstream-only:** `20260419_enable_rls_remaining_tables.sql`, `add_archived_event_status.sql`, `enable_rls_all_missing_tables.sql`
- `add_hero_featured_to_event_photos.sql` and `create_event_photos.sql` exist on **both sides** (you ported them manually already) — verify byte-for-byte equivalence; if different, the historical copy stays (per AGENTS.md rule: never edit old migrations) and a new corrective migration is added.
- `add_archived_event_status.sql` (upstream, undated) is semantically duplicate of your `20260415_add_archived_event_status.sql`. Decision: **drop the upstream copy during merge** to avoid two migrations trying to add the same check constraint.

## 5. Shanghai-specific adaptation checklist (things NOT to overwrite)

Per AGENTS.md and the Shanghai rebrand plan (`.cursor/plans/shanghai_china_rebrand_b5a49747.plan.md`), these concerns ride on top of any upstream sync:

- `src/content/events.ts` — keep Shanghai slugs (`shanghai-apr-2026`, `shanghai-hackathon-mar-2026`, `shanghai-march-2026`, `shanghai-coworking-mar-2026`, `shanghai-march-2026`). Decide whether to also include upstream's **SAIT hackathon** entry — for a Shanghai portal this should probably be dropped, or renamed for a local equivalent.
- `src/content/header-photos.ts` + `public/cursor_china_photo/` — do not revert to Calgary stock art.
- `src/content/world-events.ts` — same.
- `buildHomeJsonLd()` in `LandingPage.tsx` — must keep Shanghai location strings in JSON-LD.
- `src/lib/mock/data.ts` — mock event slug is `shanghai-march-2026`; ambassador is Tom Coustols.
- `src/components/landing/AmbassadorSection.tsx` — do not revert to the Calgary ambassador.
- `next.config.mjs` — `experimental.serverActions.allowedOrigins` Shanghai domains, and the Supabase host in `images.remotePatterns`.
- `src/middleware.ts` — upstream's security changes may hardcode Calgary-leaning admin codes or origins; re-check.
- Upstream commit `1a94a95` ("Drop redundant Calgary from upcoming event titles") is **already semantically done** in the fork — the fork never carried "Calgary" in Shanghai titles. Discard.
- `render.yaml` — keep the fork's cron-commented-out state (`eae591e`).
- Luma URLs — fork uses `lu.ma/cursor` (footer + upcoming), upstream uses per-event Luma URLs. Keep fork's override unless you want the per-event links back.

## 6. Strategy — decision + rationale

**Recommendation: single long-lived integration branch, multiple merge commits, in phases.**

- Use **merge (not rebase).** Rebasing 15 fork commits over 27 upstream commits (many of which also touch the same files) would replay each of your commits against a moving target and conflicts would compound. A phased merge keeps history legible and lets you stop between phases.
- Create `integration/upstream-2026-04-sync` off `main`. Merge upstream commits in **logical slices** using `git merge upstream/<sha>` or `git cherry-pick -m 1` for merge commits, so each slice is independently reviewable and each slice gets its own lint/build/smoke test.
- Preserve history: do **not** force-push over `main`. Integration branch stays alive until you PR it into `main`.
- After each merged slice, commit with a message of the form `merge(upstream): <slice> — <sha list>` so later bisects are easy.

## 7. Phased plan (with checkboxes)

### Phase 0 — Prerequisites (read-only)

- [ ] Capture a Supabase dump (schema + data) from production before any DB change — `pg_dump` or the Supabase dashboard backup.
- [ ] Record Render's current service IDs, environment variables, and the last successful build SHA.
- [ ] Confirm which Render service is actually serving `cursor-event-portal.onrender.com` (AGENTS.md calls out that `render.yaml` names may not match the dashboard).
- [ ] Open this plan next to `.cursor/plans/shanghai_china_rebrand_b5a49747.plan.md` to cross-reference Shanghai decisions.
- [ ] Freeze other fork PRs that touch files in section 4 until the sync merges.

### Phase 1 — Scaffolding (no code change)

- [ ] `git fetch upstream` (already done by this analysis).
- [ ] `git checkout -b integration/upstream-2026-04-sync main`.
- [ ] Push the branch with `-u origin` immediately so progress is always visible.

### Phase 2 — Security & DB (upstream slice A: `5383d73`, `1b21548`, `4f25a48`)

This must go first so later feature slices can assume RLS + admin-guard are in place.

- [ ] `git merge 4f25a48` (it's a tip; the older two in the chain come along).
  - If Git walks a merge base further back, instead do it explicitly:
    `git merge 5383d73`, resolve, then `git merge 1b21548`, then `git merge 4f25a48`.
- [ ] Conflicts to expect in this slice:
  - `supabase/admin-users.sql`, `supabase/schema.sql` — upstream-only changes; your fork hasn't diverged here, likely clean.
  - `src/middleware.ts`, `src/lib/auth/*`, admin `route.ts` files — probably clean.
- [ ] Keep the **new** upstream migrations (`enable_rls_all_missing_tables.sql`, `20260419_enable_rls_remaining_tables.sql`) **as-is** — do not renumber, do not edit (AGENTS.md rule).
- [ ] Run locally: `npm run lint`, `npm run build`, `NEXT_PUBLIC_USE_MOCK_DATA=true npm run dev` and smoke-test `/admin/MOCK-ADMIN/...`.
- [ ] Commit any conflict resolutions as the merge commit itself; push.
- [ ] Apply the two new RLS migrations to a **staging** Supabase project. Verify the self-bootstrapping one (`4f25a48`) runs cleanly on a DB that already has some of those policies (that is exactly what your prod DB may look like).

### Phase 3 — Admin / event-dashboard fixes (upstream slice B: `1b6a9f0`, `2b1ecf0`, `3d20c4a`, `0c4570b`, `8997113`)

- [ ] Cherry-pick or merge in order listed. Expect textual conflicts in `VenueAdminTab.tsx`, `CalendarAdminTab.tsx`, `src/lib/actions/event-dashboard.ts`, and — for `8997113` — `src/lib/mock/data.ts`.
- [ ] `src/lib/mock/data.ts` conflict: your `c66053e` already extended mock data; reconcile by keeping Shanghai-aware mock events and layering upstream's Luma-description fields on top.
- [ ] `types/index.ts` and `lib/supabase/queries.ts` additions from this slice are additive — prefer upstream as baseline.
- [ ] Lint + build + mock dev-server smoke test.

### Phase 4 — Competitions (upstream slice C: `b52fd40`)

- [ ] Single-commit merge. Conflicts in `src/components/admin/CompetitionsAdminClient.tsx`, `src/components/competitions/*`, `src/lib/actions/competitions.ts`.
- [ ] Cross-check that your fork's mock-safe paths from `e2a2947`/`c66053e` survive — upstream doesn't know about mock mode.
- [ ] Manually test: edit-entry modal, upload preview, upload video, all in mock mode.

### Phase 5 — Photos pipeline (upstream slice D, in this order)

Merge in upstream chronological order so each fix applies to the layer it was written for:

1. [ ] `9320e49` — event photo upload system. **Heavy conflict** on:
   - `src/app/[eventSlug]/(main)/photos/page.tsx` (add/add)
   - `src/app/api/upload-event-photo/route.ts` (add/add)
   - `src/components/photos/PhotoUploadClient.tsx` (add/add)
   - `src/lib/actions/photos.ts` (9 hunks)
   - `supabase/migrations/create_event_photos.sql` — already present in fork; keep fork's copy only if byte-identical, otherwise do NOT edit either — add a corrective migration if schemas diverge.
2. [ ] `179bda8` — admin drag-and-drop upload; conflict on `PhotosAdminTab.tsx` + add/add on `src/app/api/admin/upload-event-photo/route.ts`.
3. [ ] `5d815ca` — recap + hero auto-generation (touches `HeroHeader`, `LandingPage`, `PastEvents`, `queries.ts`).
4. [ ] `4441ae3` — ZIP upload. **Install `jszip@^3.10.1`** (`npm install jszip@^3.10.1` and let `package-lock.json` update). Confirm it's compatible with Node 20.18 on Render.
5. [ ] `5824622` — "only swap 1–2 photos" hero fix.
6. [ ] `0670d9c` — paginated gallery + `add_hero_featured_to_event_photos.sql` (again, already in fork).
7. [ ] `293c27a` — hero curation "star" feature.
8. [ ] `2de37c0` — TypeScript narrowing fix.
9. [ ] `04ab923` — recap crash fix.
10. [ ] `6da59af` — recap speedup.

After each step: `npm run lint && npm run build`. After the full slice: test upload, approve, recap generation, star-to-hero in mock mode.

### Phase 6 — Content / upcoming events (upstream slice E: `5dda804`, `7d5ba5f`, `58f9d31`, `c45ae74`, `1a94a95`)

Most of this slice is **duplicate-of-fork** or **Calgary-specific**. Prefer cherry-picks with careful manual resolution over plain merge:

- [ ] `5dda804` — take the **code** changes (archived status in `queries.ts`, `types/index.ts`, `events/page.tsx`) but **drop upstream's `supabase/migrations/add_archived_event_status.sql`** (`git rm` it in the resolution commit — your `20260415_add_archived_event_status.sql` already covers the constraint change; upstream's extra `UPDATE` step is Calgary-specific).
- [ ] `7d5ba5f` — GA4 is already on fork; reconcile only if upstream adds env-var defaults or SDK tweaks you don't have.
- [ ] `58f9d31` — compare with your `UpcomingEvents.tsx`; keep whichever is more polished, then hand-merge missing props.
- [ ] `c45ae74` — **Calgary SAIT hackathon**. Decision point: skip, or adapt to a Shanghai equivalent if one exists. For now, recommend **skip**.
- [ ] `1a94a95` — already semantically done; skip.

### Phase 7 — Polish (upstream slice F: `d0aed3e`, `28636f8`)

- [ ] `d0aed3e` — ambassador styling. Apply CSS-only bits; keep Tom Coustols as the ambassador.
- [ ] `28636f8` — Node pin. Compare against fork's `package.json.engines`, `.nvmrc`, `.node-version`. If upstream's are stricter, adopt them; otherwise skip.

### Phase 8 — Dependencies & build sanity

- [ ] Rebuild `package-lock.json`: `rm package-lock.json && npm install` (your fork is on Next 16 / React 19; upstream's `jszip` must resolve in that tree).
- [ ] `npm run lint` — expect to hit your known pre-existing warnings; no *new* errors permitted.
- [ ] `npm run build` — must succeed.
- [ ] In mock mode: `NEXT_PUBLIC_USE_MOCK_DATA=true npm run dev`, walk through landing / `/shanghai-march-2026/` / `/admin/MOCK-ADMIN/`.

### Phase 9 — Staging

- [ ] Push `integration/upstream-2026-04-sync` and open a PR against `main` — **draft**, because staging validation comes first.
- [ ] Point a Render preview / staging service (or a separate Supabase project) at the branch.
- [ ] Apply the new migrations: `enable_rls_all_missing_tables.sql`, `20260419_enable_rls_remaining_tables.sql`. Validate RLS by trying an anonymous read and a logged-in admin read on every affected table.
- [ ] Walk through: photo upload + approval; hero curation; recap pagination; competition edit; Luma import; event status toggle on Venue tab.
- [ ] Capture logs for any 500 / type / RLS-denied errors and triage before promoting.

### Phase 10 — Production

- [ ] Mark the PR ready; squash-or-merge per your fork's convention (recommend **merge commit**, not squash, because the integration branch already has meaningful sub-commits).
- [ ] Apply migrations to production Supabase in the same order as staging.
- [ ] Trigger a Render deploy from `main`. Confirm it picks up the pinned Node version.
- [ ] Post-deploy smoke: landing page, one event page, `/admin/<real-code>/events`, `/admin/<real-code>/social`.

### Phase 11 — Rollback

- [ ] Code: `git revert -m 1 <merge-commit-sha>` on `main` and push; Render auto-deploys the revert.
- [ ] DB (only if the new RLS policies break prod auth):
  - `DROP POLICY` or `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` on the affected tables, then redeploy.
  - Keep the rollback SQL prepared in advance (generate it from the upstream migration SQL by inverting each statement).
- [ ] For photo-pipeline rollbacks, the schema migrations are additive (columns + buckets) so they don't need to be dropped — the revert just stops using them.

## 8. Decisions I need from you (open questions)

1. **SAIT Hackathon (upstream `c45ae74`)** — skip entirely, or list as a Calgary-region event on the Shanghai portal, or replace with a Shanghai equivalent?
2. **Luma URL strategy** — keep fork's single `lu.ma/cursor` handle in the footer and upcoming cards, or take upstream's per-event Luma URLs?
3. **Ambassador styling (`d0aed3e`)** — adopt upstream's full-color + hover-glow, or keep the fork's current treatment on the Tom Coustols photo?
4. **Migration for archived status** — I recommend dropping upstream's `add_archived_event_status.sql` during merge (duplicate of your `20260415_...`). OK to `git rm` it in the resolution commit?
5. **Long-lived integration branch** — OK with `integration/upstream-2026-04-sync` living for several passes, or do you want each phase as its own separate PR?
6. **React 19 / Next 16 compatibility of upstream code** — do you want me to actually attempt the merge now (starting Phase 2), or hold for these answers?

## 9. What I did *not* do

- No `git merge`, `git rebase`, `git push --force`, or any write to `main`.
- No edits to historical migration files.
- No edits to `.cursor/plans/shanghai_china_rebrand_b5a49747.plan.md` (AGENTS.md rule).
- No changes to `package.json` / lockfile / source code. This plan lives only under `.cursor/plans/`.
