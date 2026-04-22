# Kickoff prompt for the execution agent

Copy-paste the block below into a fresh Cursor Cloud agent to start the integration work. All decisions are already locked.

---

```
Execute the upstream-sync plan in this repo.

Primary input: .cursor/plans/upstream_sync_analysis_8820.plan.md
Cross-reference: .cursor/plans/shanghai_china_rebrand_b5a49747.plan.md
Workspace rules: AGENTS.md

The analysis PR (#9) is already open on branch cursor/upstream-sync-analysis-8820
and must not be edited. Do not modify either plan file.

Working branch: create integration/upstream-2026-04-sync off main. Open one
final PR from that branch into main when all phases complete or when a phase
gets blocked per G28.

All decisions in section 8 ("Locked decisions") are final. Do not re-ask them.
Open question policy: if you hit anything in section 9 or a genuinely new
edge case, stop and surface it in the PR body — do not improvise.

Execution order: follow Phases 0 → 11 exactly as written. In particular:

  Phase 2 (security/RLS) lands before anything else.
  Phase 5 (photos pipeline) lands last among feature slices.
  Phase 9 is prod-dry-run (no separate staging Supabase — see C11).

Guardrails:
  - Never edit historical migration files. Add new ones if truly needed.
  - Keep cron commented in render.yaml.
  - Keep Tom Coustols ambassador, Shanghai events, lu.ma/cursor Luma link.
  - Use Render MCP/plugin to resolve the live service (D13).
  - Use Nia for upstream package docs if a Next 16 / React 19 rewrite stalls.
  - Regenerate package-lock.json from scratch (E17).
  - Make RLS migrations idempotent (G22).
  - Produce a mock-mode video walkthrough (F20) before declaring done.

Start with Phase 0 (prereqs + pg_dump) and commit after each phase.
Push the branch after every phase and update the execution PR body with
the checkbox status as you go.
```

---

## Context the next agent will already have

- Read-only `upstream` remote was added in this session and has been fetched. Running `git fetch upstream` in the new session is still safe (idempotent) and recommended as a sanity check.
- Merge-base at time of planning: `17914f0`. If the count of upstream-only commits has grown beyond 27 when the new agent starts, re-category any net-new commits using section 2's tag convention before merging.
- The probe merge in the analysis produced 17 conflicted files; section 4 of the plan lists each with resolution bias (take-upstream vs reconcile-mock vs keep-Shanghai).

## Things to remember to include in the execution PR body

- Render service ID (from D13 lookup).
- List of Render dashboard secrets that need to be set (per G27).
- pg_dump backup location / timestamp (Phase 0).
- Prod-dry-run output for each new migration (Phase 9).
- Mock-mode walkthrough video (F20).
- Explicit note if any phase was deferred (G28 partial ship).
