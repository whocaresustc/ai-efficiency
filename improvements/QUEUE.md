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

## 2026-10-29 — Source gap: X-native long-form articles not scanned <!-- gap:x-articles -->

**Status:** PENDING (found via a specific user-supplied URL the backward scan missed)

### Defect (concrete)
`playwright-x` sources scan a person's **timeline** only. X long-form **articles** (URLs of the form `x.com/<handle>/article/<id>`) do not reliably appear in a timeline accessibility snapshot, so they are a blind spot. Confirmed miss: Addy Osmani's **"Loop Engineering"** (`https://x.com/addyosmani/article/2064127981161959567`) — a landmark, on-theme piece — was not captured by either the daily pipeline or the backward scan, which read his timeline + blog but not his X articles. (Now added to the KB manually.)

### Proposed change (ONE area)
Extend the `playwright-x` fetch step in `PROMPT.md`: after snapshotting a tracked person's timeline, also check for an "Articles" tab / pinned article links and fetch any `x.com/.../article/...` published within the window. Alternatively add a lightweight `playwright-x-article` handling note. Keep it to tracked high-signal people (Addy, Thariq, etc.), not all accounts, to bound cost.

### Predicted delta
Axis A (coverage) +: closes a structural blind spot for a whole content format from already-tracked authors. Low regression risk (additive, gated by existing window + score thresholds).

### Caveats
- X articles may need a separate navigate + render; verify the fetch actually returns article body (tavily_extract worked for "Loop Engineering").
- Bound to tracked people only — don't crawl arbitrary X articles.

### Human action
Approve → I extend PROMPT.md's playwright-x handling (backed up first), or reject.

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

## 2026-11-04 — Backfilled days must write a fetch_manifest too (close the backfill blind spot) <!-- cycle:2026-11-04 -->

**Status:** PENDING

**Axis scores this cycle:** A 3/5 · B 3/5 (real Axis-A defect found; plateau_counter reset to 0)

### Defect (concrete, fixable)
The 2026-10-29 fix made `fetch_manifest` mandatory "on EVERY run" (`PROMPT.md:96-101`), and today's **live** 11-04 run honored it — `state.json → runs.2026-11-04.fetch_manifest` is present and well-formed (33 sources, each `fetched` + `method` + `freshest_date`/`blocked_reason`). That defect is closed *for live runs*.

But the gate's scope is the same-day live scan. **Backfill reconstruction is a separate, unspecified path.** `run.sh:108-109` tells the pipeline to detect gaps in `reports/` and reconstruct missing days as `YYYY-MM-DD.html` marked "backfilled" — with **no manifest obligation**. PROMPT.md has zero mentions of "backfill"/"reconstruct" (`grep` confirms), so the manifest rules at lines 96-101 don't bind the backfill path.

**Consequence (not hypothetical):** On 2026-11-04 the pipeline backfilled **five** days — 10-30, 10-31, 11-01, 11-02, 11-03 — and `state.json → runs` contains **only** the `2026-11-04` key. All five backfilled reports carry a "Reconstruction basis" footer and honest HTML caveats, but **none wrote a `runs.<date>` entry**, so the improve/meta pass has no machine-checkable coverage evidence for **5 of the 7 holdout days**. 11-01 is the sharp case: it renders a "Quiet day" page whose own footer admits the logged-out X breakout search was unavailable (login wall) during reconstruction — precisely the "quiet day without a verifiable per-tier scan" failure class the manifest gate (PROMPT.md:97) exists to make detectable, but with no manifest the gate cannot see it. The 10-29 defect is effectively reopened through the backfill path.

### Proposed change (ONE change — extend the manifest contract to the backfill path)
Edit `scripts/daily-ai-report/PROMPT.md`. Append one bullet to the manifest block (after line 101):

- **File:** `scripts/daily-ai-report/PROMPT.md` (end of the `fetch_manifest` block, after line 101)
- **Before** (current last line of the block, line 101):
  > `- The footer's "X timelines fetched" prose MUST be derived from this manifest, so the two cannot disagree.`
- **After** (append one bullet):
  > `- The footer's "X timelines fetched" prose MUST be derived from this manifest, so the two cannot disagree.`
  > `- **Backfilled/reconstructed days are also runs.** When reconstructing a missed date (per run.sh's gap-backfill step), write`
  > `  \`runs.<backfill-date>.fetch_manifest\` the same way, with every reconstructed source's \`fetched\`/\`freshest_date\` AND a`
  > `  \`"backfill": true\` flag plus \`"confidence": "low"\`. A backfilled quiet day with any \`playwright-x\` source not actually`
  > `  re-fetched (e.g. login-wall) MUST set that entry \`fetched:false\` with \`blocked_reason\` — it is a low-confidence quiet day,`
  > `  never a confirmed one. A backfilled report that renders without its own manifest is the same bug as a live run without one.`

No change to `run.sh`/`sources.json`/`synth-prompt.md`/`kb/*` — single prompt-contract extension that makes the already-mandatory artifact bind the backfill path too.

### Predicted axis-score delta
- **Axis A: 3 → 4.** Converts 5-of-7 current holdout days from "honest prose only, nothing in durable state" to machine-checkable low-confidence manifests the meta/improve pass can grade; makes a reconstructed quiet day with an unre-fetched X tier structurally detectable (the 11-01 case), closing the backfill reopening of the 10-29 defect.
- **Axis B: 3 → 3 (no regression).** Touches only the report-run/backfill contract, not KB pages.

### Self-verify against holdout (last 7: 11-04, 11-03, 11-02, 11-01, 10-31, 10-30, 10-29)
Re-judging the failing sub-check ("were quiet days verified — fetch_manifest present") across the holdout:
- **11-04** (live): already PASS — manifest present. Unchanged, no regression.
- **10-30, 10-31, 11-02, 11-03** (backfills): FAIL→PASS — each would carry a `backfill:true, confidence:low` manifest derived from the same timelines the reconstruction already re-read, so this is a lossless structuring of work already done, not new fetching. No regression to the (zero) items they shipped.
- **11-01** (backfilled quiet day): the decisive case. With the rule, its manifest would be forced to record the breakout-search `playwright-x` entry as `fetched:false, blocked_reason:"login wall on 2026-11-04 reconstruction"`, flagging it a low-confidence quiet day in durable state rather than only in a footer paragraph. Sub-check flips FAIL→PASS on the exact day it matters most.
- **10-29** (pre-manifest live): out of the new rule's scope (not a backfill); unchanged.
- No other sub-axis touched (no change to ranking, scoring, sources, or KB), so Axis B holds.
- **Net: clear gain on the failing Axis-A sub-check (5 holdout days move FAIL→PASS), zero predicted regression.** Proposal retained.

### Caveats
- **Spec-only until a run proves it.** This tightens the prompt contract; it does not itself write the backfill manifests. Treat Axis A 3→4 as *predicted*, not banked — confirmed only once the next backfill cycle emits `runs.<date>.fetch_manifest` with `backfill:true` for each reconstructed day.
- The real robustness fix would move the gate into `run.sh`/render code (fail a backfill render that lacks a manifest), but that exceeds the one-change-per-cycle budget and touches a guardrailed file; the prompt-first extension is the correct smallest step, consistent with how the 10-29 live-run fix was scoped.
- Lower-value Axis-B defects persist and are still deferred (not proposed this cycle): `kb/techniques.html:66-75` still carries the "subtopics this page will cover" TODO list + "Scaffold" footer (unchanged since 10-29), and `kb/models.html` has thin body-citation density (1 href / 385 words; leaderboard rows carry bare `(Oct 28)` date tags with no links). Logged for a future cycle.

### Human action
Approve → I extend PROMPT.md's manifest block to cover backfilled days (backed up first), or reject.

---

## 2026-11-04 — Scheduled pipeline isn't firing on its own: schedule a wake so live runs replace backfills (Axis C) <!-- cycle:2026-11-04-axisC -->

**Status:** APPROVED 2026-11-04 (human). Action: user runs `sudo pmset repeat wakeorpoweron MTWRFSU 06:55:00`. Axis C 2→4 is UNPROVEN until `reliability.history` shows `fired:true` days without backfill — verify over the next 2-3 days.

**Axis scores this cycle:** A 3/5 · B 3/5 · **C 2/5** (re-run with new Axis C — Run reliability. Real, *live* Axis-C defect found; it outranks the still-pending A/B content defects per the gate. plateau_counter stays 0.)

### Defect (concrete, fixable — infra target)
Axis C grades whether the **scheduled** pipeline actually fired on its own. Reading `state.json → reliability.history`, the last 7 entries are:

| date | fired |
|------|-------|
| 2026-10-29 | ✅ true |
| 2026-10-30 | ❌ false (backfill) |
| 2026-10-31 | ❌ false (backfill) |
| 2026-11-01 | ❌ false (backfill) |
| 2026-11-02 | ❌ false (backfill) |
| 2026-11-03 | ❌ false (backfill) |
| 2026-11-04 | ✅ true |

**5 of the last 7 scheduled days did NOT fire** (10-30 → 11-03). Every one of those reports exists *only* because the 11-04 live run backfilled it. Per the Axis-C rule, a report that exists only because it was backfilled (`fired:false`) is an Axis-C FAIL even though the content is fine — the automation is not working. `reliability.consecutive_failures:0` understates this, because backfills are graded `outcome:"success"` on content; the *firing* record is the 5-day `fired:false` run.

**Root cause (named, in-repo):** `~/Library/LaunchAgents/com.user.daily-ai-report.plist` schedules with `StartInterval` (7200s) + `RunAtLoad` only — no wake. `run.sh:65-67` states the design explicitly: *"launchd will not wake the Mac for a StartCalendarInterval and does not catch up calendar runs missed while asleep"* — so the pipeline deliberately relies on backfill-on-wake instead of firing live. Verified with `pmset -g sched`: there is **no `pmset repeat wake`** scheduled for this job and `womp 0`. When the Mac is asleep/off across a day boundary, nothing wakes it, the LaunchAgent never ticks that day, and the day becomes a backfill. This is the exact failure mode Axis A/B are blind to: the content was fine, but the pipeline silently didn't run for 5 straight days.

### Proposed change (ONE change — schedule a wake so the LaunchAgent ticks live each day)
Add a recurring power-schedule wake a few minutes before the daily run so launchd's next `StartInterval` tick lands on a live (not backfilled) day. This is the minimal fix that converts `fired:false` days into `fired:true` without touching the report logic.

- **Target:** system power schedule (not a guardrailed file) — human runs once:
  > `sudo pmset repeat wakeorpoweron MTWRFSU 06:55:00`
  (wake/power-on daily at 06:55; the existing `StartInterval=7200` + `RunAtLoad` + the `run.sh:69` once-per-day guard then fire the report live at the first tick after wake. 06:55 chosen to precede the 06:57 cadence noted in project memory.)
- **Optional hardening (same change, plist side), for the human to apply to** `~/Library/LaunchAgents/com.user.daily-ai-report.plist`: replace the bare `StartInterval` with an explicit `StartCalendarInterval` at `Hour 6 / Minute 57` **in addition to** keeping `RunAtLoad` as the catch-up path. (The `pmset` wake is the load-bearing part; the plist edit alone does nothing without the wake, per `run.sh:66`.)
- **Verify after applying:** `pmset -g sched` shows the daily `wakeorpoweron`; then over the next 2–3 days, `reliability.history` entries should read `fired:true` (not backfill). Axis C banks only once that is observed.

**No change by me to** `run.sh` / `meta.sh` / `improve.sh` / the `*.plist` / `PROMPT.md` / `sources.json` / `kb/*` — per the hard guardrail, Axis-C infra fixes are proposed as a diff/command here for the human to apply; I only wrote this queue entry + `state.json`.

### Predicted axis-score delta
- **Axis C: 2 → 4.** Converts the daily fire from "best-effort tick while awake, else backfill" to a scheduled wake → live fire. The 5/7 `fired:false` run is the direct consequence of no wake; scheduling one removes it. Not 5, because `pmset` wake can still be defeated by the lid being physically closed on some hardware / the machine being fully powered off at the wall, and the gateway-proxy guard (`run.sh:56-60`) can still skip a live tick if `localhost:6655` isn't up pre-login — so a residual backfill path remains.
- **Axis A: 3 → 3** and **Axis B: 3 → 3 (no regression).** Infra-only; touches neither coverage logic nor KB. Fewer backfills would *incidentally* help Axis A (backfilled quiet days are the lower-confidence ones), but I don't claim that here.

### Self-verify against the reliability trend (Axis C is judged on `reliability.history`, not the holdout reports)
- The failing sub-check is "in the last 7 reliability entries, how many `fired:true` vs `fired:false`" → currently **2 true / 5 false**. A daily `wakeorpoweron` at 06:55 directly targets the cause named in `run.sh:66` (no wake). On the days the machine is docked/plugged (the normal case for this workstation), the wake fires, the `StartInterval` tick runs `run.sh`, and the day records `fired:true`. Projected trend after the fix: the `fired:false` run stops accumulating; within ~7 days the window should flip to mostly `fired:true`. Sub-check moves FAIL→PASS.
- **Regression check:** the once-per-day guard (`run.sh:69`, exit if `$TODAY.html` exists) means an *extra* wake cannot double-produce; and the proxy guard (`run.sh:56-60`) already exits 0 cleanly if the gateway is down, so a pre-login wake can't produce a broken report. No new failure surface. Axis A/B untouched.
- **Honest caveat — unproven until the next scheduled fire actually succeeds.** This is an infra proposal: Axis C 2→4 is *predicted*, banked only once `reliability.history` shows real `fired:true` days without a backfill after the human runs the `pmset` command. If the workstation is routinely powered fully off (not asleep) overnight, `wakeorpoweron` may still not fire and the real fix would be a server/cron host — out of scope for this one-change cycle. A valid null outcome is possible on next review if the wake doesn't stick.

### Human action
Approve → run `sudo pmset repeat wakeorpoweron MTWRFSU 06:55:00` (and optionally the plist `StartCalendarInterval` edit above); then watch `reliability.history` flip to `fired:true`. Reject if the workstation is intentionally powered off overnight (then the fix is a hosted runner, not a wake).

---
