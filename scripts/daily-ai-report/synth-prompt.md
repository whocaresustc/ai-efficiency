# Daily KB Synthesis — Prompt

You run immediately after the daily report is written. Your job: fold today's report into the
**living knowledge base** at `kb/` so it keeps improving. You turn the day's *flow* (news) into
*stock* (durable, organized topic knowledge). Run end-to-end, autonomously, no questions.

## Inputs
- Today's report: `reports/YYYY-MM-DD.html` (today's date) — the source of new findings.
- The knowledge base: `kb/*.html` — living topic pages you update in place.
- Topic pages: `models.html`, `agents.html`, `tools.html`, `techniques.html`, `reading.html`, `people.html`, and `index.html`.

## Principles
- **Refresh, don't just append.** If today's item updates or supersedes something already on a
  page, rewrite that part — don't stack a contradictory new bullet next to the stale one.
- **Topic-first, not date-first.** Knowledge goes under the right topic; do not create dated pages.
- **Only durable signal.** Promote genuinely new advancements, capabilities, patterns, or
  high-signal reading/people. Skip incremental noise — most items don't change the KB.
- **Primary sources.** Prefer vendor/research/author over aggregator press (consistent with the report).
- **Breadth.** All of AI/agents, not one vendor.

## Steps

### 1. Read today's report
Extract the kept items (title, summary, source, score). Ignore quiet-day pages (nothing to fold).

### 2. Route each item to a topic
- Model releases / benchmarks / frontier capability → `models.html`
- Agent architectures, multi-agent/subagents, memory, orchestration, embodiment → `agents.html`
- Claude Code / Cursor / Codex / MCP / CLIs / dev-tool changelogs → `tools.html`
- Prompting, context mgmt, evals, RAG, reasoning, research methods → `techniques.html`
- A notable long-form blog/paper worth keeping → add to `reading.html`
- A high-signal person who keeps producing → add/update in `people.html`. Add someone only when they recur as a genuine signal across multiple reports (not a one-off mention): put practitioners/leaders under "Practitioners & leaders", educators under "Educators & explainers", vendor accounts under "Lab accounts". Include their primary link(s) and a one-line focus. Do not duplicate someone already listed.
An item may touch two pages; put it where it's most durable, cross-reference if useful.

### 3. Update the topic page(s)
For each page that gets new knowledge:
- **Rewrite the "What changed recently" banner** at the top to reflect the latest 1–3 developments (this is the freshness signal — keep it current, 2–4 sentences).
- Integrate the knowledge into the right section (edit prose, update tables/leaderboards, supersede stale claims). Add a short `<span class="src">(Source, date)</span>` attribution.
- **Update the "Last refreshed YYYY-MM-DD"** date in the page's `.meta` line to today.
- Keep pages readable — if a section grows too long, tighten/summarize older detail rather than letting it sprawl.

### 4. Update the index
For every page you refreshed today, set its badge in `index.html` to `<span class="fresh">refreshed YYYY-MM-DD</span>` (today). Leave untouched pages' badges alone (they'll age — that staleness is intentional and visible).

### 5. Done
Print one line: `KB synth YYYY-MM-DD — updated {pages}, {N} items folded`. Do not commit; the user reviews.

## Constraints
- **Edit only files under `kb/`.** Do not touch `reports/`, `scripts/`, or `kb/sources/` (those are immutable raw notes).
- Keep each page self-contained HTML (inline CSS, no external deps), matching the existing style.
- If the report is a quiet day or has no foldable items, update nothing and print `KB synth YYYY-MM-DD — no durable items, KB unchanged`.
- Do not fabricate. Only fold what the report actually captured.
