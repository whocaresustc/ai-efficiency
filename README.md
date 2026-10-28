# ai-efficiency

A **living knowledge base for the fast-moving AI / agent field** — kept continuously refreshed so the knowledge improves as the field evolves.

## Start here

| Page | What it covers |
| --- | --- |
| [Knowledge base index](kb/index.html) | Entry point — all topics + their freshness |
| [Models](kb/models.html) · [Agents](kb/agents.html) · [Tools](kb/tools.html) | Frontier models, agent patterns, Claude Code / CLIs / MCP |
| [Techniques](kb/techniques.html) · [Reading](kb/reading.html) · [People](kb/people.html) | How to build, curated reading, who to follow |
| [Latest daily report](reports/latest.html) | Most recent raw intake |

## Goal

Capture important AI and agent news, advancements, blogs, and tips — **not limited to Claude Code or any single vendor** — and accumulate them into a knowledge base that keeps improving and refreshing itself. The AI field moves fast; the point of this repo is to turn that constant stream of news into durable, organized understanding that stays current.

The daily news reports are **raw intake**, not the product. The product is the distilled, living knowledge.

## How it works: Capture → Synthesize → Curate

```
   CAPTURE (flow)          SYNTHESIZE (leverage)               CURATE (stock)
   daily reports     →     fold new findings into topics  →    knowledge base
   reports/*.html          each run updates kb/ topics          kb/ living HTML docs
```

- **Capture** — a daily pipeline scans ~41 primary sources (vendor blogs, research, dev-tool changelogs, X timelines) across the AI field and writes a dated report of what's new in the last 24h.
- **Synthesize** — each run folds its findings into the knowledge base: promotes genuinely new advancements into living topic pages, refreshes what changed, and supersedes what's outdated. This is what makes the knowledge *compound* instead of pile up.
- **Curate** — the knowledge base is organized by **topic** (not by date), as living documents that get rewritten over time, each showing when it was last refreshed and what changed.

## Structure

```
kb/                  Knowledge base — living topic pages (the product)
  index.html           entry point: what we currently know + topic freshness
  models.html          frontier model landscape
  agents.html          agent architectures, patterns, multi-agent, memory
  tools.html           Claude Code, Cursor, Codex, MCP, CLIs
  techniques.html      prompting, context mgmt, evals, RAG, reasoning
  reading.html         curated blogs / papers worth keeping
  people.html          who to follow
  sources/             original hand-authored notes (raw material, preserved)
reports/             Raw daily intake — dated HTML reports (feeds synthesis)
scripts/             The pipeline
  daily-ai-report/     report generator, sources, prompt, self-improvement meta-agent, KB synthesis
MEMORY.md            (private, not in repo) auto-memory index
```

> The knowledge base is seeded and live: the original hand-authored notes (`Claude Code Setting.md`, `Blogs.md`, `AI Influencers.md`, Git Worktree / Terminal setup) now live under `kb/sources/` as preserved raw material, distilled into the topic pages. The daily synthesis pass keeps the topic pages refreshed from each report.

## The daily pipeline

- **Schedule:** macOS `launchd`, fixed times **10:00 and 14:00** (Asia/Shanghai, when the gateway proxy is reliably up). Meta/synthesis passes follow at 10:30 / 14:30.
- **Self-improving:** a meta-agent critiques each run (source health, coverage, judgment) and records learnings in `scripts/daily-ai-report/state.json`, which the next run reads.
- **Robust:** proxy-readiness guard (skips cleanly when the gateway is down), catch-up guard (produces the day's report on the first run after the proxy is up), and gap backfill.
- **Output:** reports are reviewed and committed manually (not auto-committed).

## Principles

- **Primary sources over aggregators** — vendor/research blogs beat press recaps.
- **Breadth over vendor loyalty** — all of AI/agents, organized topic-first.
- **Refresh, don't just append** — knowledge is rewritten as it changes, with staleness made visible.
