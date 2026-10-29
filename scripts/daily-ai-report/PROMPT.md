# Daily AI Report — Cron Prompt

You are generating today's AI news digest. Run this end-to-end without asking questions.

## Inputs
- Source list: `scripts/daily-ai-report/sources.json`
- Today's date: use the date from the system reminder (`# currentDate`).
- Lookback window: **last 24 hours** from "now". Items older than that are out of scope.
- Output path: `reports/YYYY-MM-DD.html` (use today's date).
- Also update: `reports/latest.html` (overwrite as a copy of today's report).

## Steps

### 1. Fetch
For each source in `sources.json`, fetch the latest items respecting `max_items`:
- `type: rss` — try `mcp__tavily-search__tavily_extract` on the RSS URL; if it 404s or returns garbage, fall back to `fallback_url` via Tavily.
- `type: tavily` — use `mcp__tavily-search__tavily_extract` on the URL. For listing pages, use `mcp__tavily-search__tavily_search` with the URL's domain and query "latest news" if extract gives a stale snapshot.
- `type: tavily-search` — call `mcp__tavily-search__tavily_search` with `search_query`, `include_domains: search_domains`, `time_range: "week"`.
- `type: playwright-x` — fetch X.com via Playwright MCP. Steps:
  1. `mcp__playwright__browser_navigate` to the source's `url` (e.g. `https://x.com/AnthropicAI`).
  2. `mcp__playwright__browser_wait_for` with `time: 3` to let the timeline JS render. Without this wait, the snapshot only shows a `progressbar`.
  3. `mcp__playwright__browser_snapshot` to get the rendered accessibility tree.
  4. Parse the tree for `article` entries inside the timeline region. Each article has: tweet text (in a `generic` child), date (in a `time` element under a status link `/handle/status/<id>`), engagement counts (in the `group` aria-label).
  5. After ALL playwright-x sources are fetched, call `mcp__playwright__browser_close` once at the end. Do NOT close between accounts.
  6. If a playwright-x fetch errors or times out, log it in the footer's "failed sources" list and continue with the next account — do not abort the run.
- `type: playwright-x-search` — breakout detection via X live search (NOT a trending feed). Steps:
  1. `mcp__playwright__browser_navigate` to `https://x.com/search?q=<url-encoded search_query>&f=live` (f=live sorts by recency, not algorithm).
  2. `mcp__playwright__browser_wait_for` `time: 3`, then `mcp__playwright__browser_snapshot`.
  3. Parse `article` entries as for `playwright-x`. Keep only posts within `window_hours` (24h) and, independently, that you'd score ≥ 4 — i.e. a genuine frontier release/benchmark. **Drop** crypto, drama, marketing, and engagement bait regardless of like count.
  4. Where possible, corroborate a kept item against a primary source (vendor blog / the account's own post) before including it; note that in the summary.
  5. This source counts against the Tier-2 cap of 3. An empty/rate-limited search is NOT a quiet day — log it under failed sources and continue.
- `type: url` — fetch raw text via Bash `curl -s` for plain files like CHANGELOG.md.
- For `filter_keywords`, drop items whose title doesn't match (case-insensitive).

Fetch sources in parallel using a single message with multiple tool calls.

### 2. Normalize
For every item collected, build:
```
{ title, url, source, tier, published_at, raw_summary }
```
Drop items where `published_at` is older than 24h (or older than 36h if you cannot determine the date — keep undated items only if the source page itself was fetched today and the item appears at the top).

### 3. Dedupe
Drop items with duplicate URLs, or near-identical titles across sources (keep the one from the higher-tier / more authoritative source).

### 4. Rank & Summarize
For each remaining item, you (Opus) judge:
- **Relevance score 1-5**: how much should an AI engineer building production agentic systems care?
  - 5 = major model release, breaking capability, must-know
  - 4 = significant feature, new tool, important research result
  - 3 = useful incremental update
  - 2 = minor / niche
  - 1 = noise (PR fluff, marketing recap)
- **2-sentence summary** in your own words. First sentence: what happened. Second sentence: why it matters.

**Tier-specific thresholds (drop below threshold):**
- Tier 1 (vendor news): keep if score ≥ 3
- Tier 2 (research/community): keep ONLY if score ≥ 4 — high bar, must be genuinely innovative or trending. Cap total Tier 2 items at 3 across all sources.
- Tier 4 (dev tools): keep if score ≥ 3

### 5. Render HTML

Write a single self-contained HTML file (no external CSS/JS). Structure:

```
<header>
  Daily AI Report — {date}
  Generated {timestamp} • {N} items from {M} sources
</header>

<section id="highlights">
  Top Highlights — items scored 5, then 4 (max 5 shown)
  Each: title (link), source badge, score, 2-sentence summary
</section>

<section id="vendor">
  Vendor Announcements (Tier 1)
  Grouped by source, sorted by score desc.
</section>

<section id="devtools">
  Dev Tools (Tier 4)
  Grouped by source, sorted by score desc.
</section>

<footer>
  Sources scanned: {list}. Quiet sources (no items): {list}.
</footer>
```

Style: clean, readable, system font stack, dark-mode friendly (use `prefers-color-scheme`). Cards/items have subtle borders, tier badges are color-coded (Tier 1 = blue, Tier 4 = green). Keep total HTML under ~80KB.

If **zero items survive ranking**, write a minimal "Quiet day — no notable AI news in the last 24h" page with the source-scan footer. **Do NOT declare a quiet day until you have actually fetched every tier — including the Tier-1/Tier-2 `playwright-x` timelines.** A quiet day where the X timelines were skipped is not a confirmed quiet day; dated vendor sources being outside the window is not sufficient grounds to skip X. If a Playwright fetch genuinely fails, log it under "failed sources" (that is allowed) — but silently not firing Playwright is not. State in the footer which X accounts were fetched and their freshest post dates.

**Fetch manifest (machine-checkable quiet-day gate).** Before rendering, record a `fetch_manifest` for this run in `scripts/daily-ai-report/state.json` under `runs.<date>`: for every source, `{ name, fetched: true|false, method, freshest_date, blocked_reason? }`. Rules enforced from the manifest, not from prose:
- You MUST NOT render a "Quiet day" page if ANY `playwright-x` source has `fetched: false`. If some are unfetched, the correct output is a **degraded-mode** page that names the unfetched sources in a visible banner (not a quiet-day page, and not a footer afterthought).
- If a `playwright-x-search` source is blocked (e.g. login wall), the page carries a visible "breakout-detection degraded" banner for that day — a blocked search is never silently treated as "nothing found."
- The manifest is the evidence the self-improvement/meta pass grades coverage against.
- **This write is mandatory on EVERY run, not just quiet days.** Before emitting the report HTML, write `runs.<date>.fetch_manifest` to state.json (one entry per source actually attempted). If you cannot write it, the run is degraded — say so in the page banner. A run that renders without a manifest is a bug.
- The footer's "X timelines fetched" prose MUST be derived from this manifest, so the two cannot disagree.

### 6. Update latest.html
Copy today's HTML to `reports/latest.html` (overwrite). Use Bash `cp`.

### 7. Done
Print one line: `Wrote reports/YYYY-MM-DD.html — {N} items, top score {S}`. Do not commit; the user reviews and commits manually.

## Constraints
- **Do not** ask the user any questions — this is a cron run.
- **Do not** install dependencies or modify anything outside `reports/`.
- **Do not** use `WebSearch` (disabled). Use Tavily MCP tools.
- If a source fails, log it in the footer's "failed sources" list and continue. Don't abort the whole run for one bad source.
- Keep token usage reasonable: don't dump full article bodies into context — extract titles + first paragraph only.
