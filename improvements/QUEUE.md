# RSI Improvement Queue

The daily RSI improve loop (propose-only) appends a dated proposal here each cycle.
Review each, then approve ("apply proposal <date>") or reject. The loop never applies changes itself.

Status legend: PENDING (awaiting review) · APPLIED · REJECTED · NULL (no change proposed) · DORMANT (healthy, no action)

---

## 2026-10-29 — Enforce the fetch_manifest quiet-day gate (make the spec real) <!-- cycle:2026-10-29 -->

**Status:** APPLIED 2026-10-29 (human-approved; PROMPT.md manifest-write made mandatory every run). Verify the next real run emits `runs.<date>.fetch_manifest`.

---

## 2026-10-29 — Source gap: Cognition/Devin + YouTube talks untracked <!-- gap:cognition-youtube -->

**Status:** APPLIED 2026-10-29 (human-approved; added Cognition Blog (Tier 1) + @ScottWu46 (playwright-x) to sources.json after verifying both live; backed up first)

### Defect (concrete)
The pipeline missed Scott Wu's (Cognition CEO) "It's time to be ambitious" talk (Runtime 2026, YouTube, 2026-10-09) — which strongly overlaps a KB article (Rieseberg's "be ambitious" tutorial, `kb/reading.html`). Two causes, both real coverage gaps in `scripts/daily-ai-report/sources.json`:
1. **Cognition / Devin is not a tracked source** — a major agent lab with no entry (no site feed, no X account like @cognition_labs/@ScottWu46).
2. **No YouTube/conference-talk path** — high-signal talks (Runtime, etc.) are invisible; the pipeline only scans blogs/changelogs/X.

### Proposed change (ONE area — add source coverage)
Edit `sources.json`: add (a) Cognition's blog/news URL as a Tier-1 `tavily` source, and (b) `@ScottWu46` / `@cognition_labs` as `playwright-x` sources. Optionally a `tavily-search` for high-view AI conference talks. Keep each `max_items` low.

### Predicted delta
Axis A (coverage) +: closes a named miss of a frontier agent lab; catches talk-shaped content the pipeline structurally can't see today. No regression (additive sources, gated by the same ranking thresholds).

### Caveats
- Verify the exact Cognition feed URL + correct X handles before adding (don't add dead/wrong handles).
- YouTube transcript fetching needs a path (Tavily extract worked for this video's transcript — viable).

### Human action
Approve → I add the verified sources to `sources.json` (backed up first), or reject.

---
**Axis scores this cycle:** A 3/5 · B 3/5 (baseline established; not dormant — real Axis-A defect found)

### Defect (concrete, fixable)
`scripts/daily-ai-report/PROMPT.md:96-99` mandates that every run record a machine-checkable
`fetch_manifest` in `state.json` under `runs.<date>` — `{ name, fetched, method, freshest_date, blocked_reason? }`
per source — and says the quiet-day / degraded-mode rules are "enforced from the manifest, not from prose"
and that "the manifest is the evidence the self-improvement/meta pass grades coverage against."

**It is never written.** `state.json` has no `runs` key (confirmed: no `runs`/`fetch_manifest`/`fetched`
keys anywhere in the file), and neither `run.sh` nor the render step emits one. Coverage is verified only
by the prose footer ("X / social timelines fetched"), which is exactly the evidence the spec rejects.

**Consequence (not hypothetical):** `state.json → judgment.suspect_quiet_days` records 2026-10-13 — a
"Quiet day" page declared *without* firing Playwright for the X tier, i.e. an unconfirmed quiet day. That
is the precise failure the manifest gate (PROMPT.md:97) exists to make impossible, but with no manifest the
gate is unenforceable. The guard today is prose in the prompt, not a check against machine-readable state.

### Proposed change (ONE change — tighten the render step so the manifest is actually produced)
Edit `scripts/daily-ai-report/PROMPT.md`. Promote the manifest from a buried instruction into a hard
pre-render step by adding an explicit emit-and-self-check requirement. Minimal diff:

- **File:** `scripts/daily-ai-report/PROMPT.md` (the block at line 96, "Fetch manifest…")
- **Before** (end of the existing manifest paragraph, line ~99):
  > `- The manifest is the evidence the self-improvement/meta pass grades coverage against.`
- **After** (append two lines to that same block):
  > `- The manifest is the evidence the self-improvement/meta pass grades coverage against.`
  > `- **This write is mandatory on EVERY run, not just quiet days.** Before emitting the report HTML, write`
  > `  \`runs.<date>.fetch_manifest\` to state.json (one entry per source actually attempted). If you cannot`
  > `  write it, the run is degraded — say so in the page banner. A run that renders without a manifest is a bug.`
  > `- The footer's "X timelines fetched" prose MUST be derived from this manifest, so the two cannot disagree.`

No change to `run.sh`/`sources.json`/`synth-prompt.md`/`kb/*` — this is a single prompt-contract tightening
that makes the already-specified artifact non-optional and self-consistent with the footer.

### Predicted axis-score delta
- **Axis A: 3 → 4.** Converts the quiet-day gate from prose-only (unenforceable) to a machine-checkable
  artifact the meta/improve pass can grade against; removes the "fetch_manifest absent = defect" finding and
  makes a repeat of the 10-13 suspect-quiet-day structurally detectable.
- **Axis B: 3 → 3 (no regression).** Touches only the report-run contract, not KB pages.

### Self-verify against holdout (last 7: 10-29, 10-28, 10-19, 10-15, 10-14, 10-13, 10-12)
Re-judging the failing sub-check ("were quiet days verified — fetch_manifest present") across the holdout:
- 6 of 7 (10-29, 10-28, 10-15, 10-14, 10-12 and the 10-19 backfill) would now carry a manifest; their prose
  footers already enumerate the X accounts fetched, so emitting the structured form is a lossless upgrade,
  not new fetching work — **no regression risk** to the items already shipped.
- **10-13** is the decisive case: with the manifest mandatory, a quiet-day render with `playwright-x`
  entries `fetched:false` would be forced into degraded-mode (PROMPT.md:97) instead of a clean "Quiet day"
  page. The sub-check flips from FAIL→PASS on the one holdout day it actually failed.
- No other sub-axis is touched (no change to ranking, scoring, sources, or KB), so Axis B holds.
- **Net: clear gain on the failing Axis-A sub-check, zero predicted regression.** Proposal retained.

### Caveats
- **Spec-only until a run proves it.** This tightens the prompt contract; it does not itself write a
  manifest. The gain is confirmed only once the next report run emits `runs.<date>.fetch_manifest` and a
  subsequent improve cycle grades against it. Treat Axis A 3→4 as *predicted*, not banked.
- It leans on the model following the prompt. A fully robust fix would move the gate into `run.sh`/render
  code (fail the build with no manifest), but that exceeds the one-change-per-cycle budget and touches a
  guardrailed file; prompt-first is the correct smallest step.
- Lower-value defect deferred (not proposed this cycle): `kb/techniques.html` carries 2 scaffold/TODO
  markers and `agents.html`/`models.html` have thin body-citation density (Axis B). Logged for a future cycle.

---
