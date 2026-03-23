# Claude Code Settings & Resources

A curated collection of tips, guides, and resources for getting the most out of Claude Code.

## Tips & Guides

| # | Resource | Link |
|---|----------|------|
| 1 | Claude Code Tips from Creator Boris Cherny (X/Twitter) | [x.com](https://x.com/bcherny/status/2007179832300581177) |
| 2 | Claude Code Team Tips from Boris Cherny (X/Twitter) | [x.com](https://x.com/bcherny/status/2017742741636321619) |
| 3 | Claude Code Tips from Boris Cherny (X/Twitter) | [x.com](https://x.com/bcherny/status/2021699851499798911) |

## Recommended Settings

### Notifications (macOS Terminal)

Get notified when Claude Code needs your input or confirmation, so you can multitask without constantly checking back.

1. In the Claude Code CLI, type `/config`
2. Select **Notifications**
3. Choose **`terminal_bell`**

This triggers a system bell whenever Claude is waiting for input, which works with macOS terminal notification settings (e.g., iTerm2 can show system alerts or bounce the dock icon on bell).

## Boris Cherny's Tips for Claude Code

*From the creator of Claude Code -- 13 tips from his [X/Twitter thread](https://x.com/bcherny/status/2007179832300581177) ([ThreadReader](https://threadreaderapp.com/thread/2007179832300581177.html))*

1. **Run multiple Claudes in parallel** -- Boris runs 5 Claudes in parallel terminal tabs, numbered 1-5, and uses system notifications to know when a Claude needs input.

2. **Use claude.ai/code alongside terminal** -- He also runs 5-10 Claudes on claude.ai/code in parallel with local ones, hands off sessions using `&`, uses `--teleport` to move between them, and starts sessions from his phone throughout the day.

3. **Use Opus with thinking for everything** -- Even though it's bigger and slower than Sonnet, you have to steer it less and it's better at tool use, making it almost always faster in the end.

4. **Maintain a shared CLAUDE.md** -- The team shares a single `CLAUDE.md` checked into git. The whole team contributes multiple times a week. Anytime Claude does something incorrectly, they add it to the `CLAUDE.md` so Claude knows not to do it next time.

5. **Use @claude in code review** -- During code review, tag `@claude` on coworkers' PRs to add things to the `CLAUDE.md` as part of the PR, using the Claude Code GitHub Action (`/install-github-action`). This is their version of "Compounding Engineering."

6. **Start sessions in Plan mode** -- Most sessions start in Plan mode (shift+tab twice). Go back and forth with Claude until you like its plan, then switch to auto-accept edits mode -- Claude can usually one-shot it from a good plan.

7. **Use slash commands for inner loops** -- Create slash commands for workflows you repeat many times a day (e.g., `/commit-push-pr`). Commands live in `.claude/commands/` and are checked into git. Use inline bash in commands to pre-compute info like git status to avoid unnecessary back-and-forth.

8. **Use subagents for common workflows** -- Subagents like `code-simplifier` (simplifies code after Claude is done) and `verify-app` (detailed end-to-end testing instructions) automate the most common per-PR workflows.

9. **Use a PostToolUse hook for formatting** -- A hook automatically formats Claude's code output. Claude usually generates well-formatted code, and the hook handles the last 10% to avoid formatting errors in CI.

10. **Pre-allow safe bash commands instead of skipping permissions** -- Don't use `--dangerously-skip-permissions`. Instead, use `/permissions` to pre-allow common safe bash commands. Most are checked into `.claude/settings.json` and shared with the team.

11. **Let Claude use your tools via MCP** -- Claude Code searches and posts to Slack (via MCP server), runs BigQuery queries, grabs error logs from Sentry, etc. The Slack MCP configuration is checked into `.mcp.json` and shared with the team.

12. **Use background agents and hooks for long-running tasks** -- For very long tasks: (a) prompt Claude to verify with a background agent when done, (b) use an agent Stop hook for deterministic verification, or (c) use the `ralph-wiggum` plugin. Use `--permission-mode=dontAsk` or `--dangerously-skip-permissions` in a sandbox so Claude can work unblocked.

13. **Give Claude a way to verify its work** -- Probably the most important tip. If Claude has a feedback loop, it will 2-3x the quality of the final result. Claude tests every change using the Chrome extension -- opening a browser, testing the UI, and iterating until it works. Verification looks different per domain: bash commands, test suites, browser testing, phone simulator, etc.

## Tips from the Claude Code Team

*Sourced from the Claude Code team via Boris Cherny's [second thread](https://x.com/bcherny/status/2017742741636321619) ([ThreadReader](https://threadreaderapp.com/thread/2017742741636321619.html))*

> Tips below marked with *(also in Thread 1)* overlap with Boris's personal tips above but include additional detail from the team.

1. **Use git worktrees for parallelism** *(also in Thread 1)* -- Spin up 3-5 git worktrees, each running its own Claude session in parallel. This is the single biggest productivity unlock and the top tip from the team. Some people name their worktrees and set up shell aliases (`za`, `zb`, `zc`) to hop between them in one keystroke. Others have a dedicated "analysis" worktree only for reading logs and running BigQuery.

2. **Pour energy into the plan** *(also in Thread 1)* -- Start every complex task in Plan mode so Claude can one-shot the implementation. One person has one Claude write the plan, then spins up a second Claude to review it as a staff engineer. The moment something goes sideways, switch back to plan mode and re-plan -- don't keep pushing. Also explicitly tell Claude to enter plan mode for verification steps, not just for the build.

3. **Make CLAUDE.md self-improving** *(also in Thread 1)* -- After every correction, end with: "Update your CLAUDE.md so you don't make that mistake again." Claude is eerily good at writing rules for itself. Ruthlessly edit your `CLAUDE.md` over time -- keep iterating until Claude's mistake rate measurably drops. One engineer has Claude maintain a notes directory for every task/project, updated after every PR, and points `CLAUDE.md` at it.

4. **Create your own skills and slash commands** *(also in Thread 1)* -- If you do something more than once a day, turn it into a skill or command. Commit them to git and reuse across projects. Team examples:
   - Build a `/techdebt` slash command and run it at the end of every session to find and kill duplicated code
   - Set up a slash command that syncs 7 days of Slack, GDrive, Asana, and GitHub into one context dump
   - Build analytics-engineer-style agents that write dbt models, review code, and test changes in dev

5. **Let Claude fix bugs autonomously** -- Enable the Slack MCP, paste a Slack bug thread into Claude and just say "fix" -- zero context switching required. Or say "Go fix the failing CI tests" without micromanaging how. Point Claude at docker logs to troubleshoot distributed systems -- it's surprisingly capable at this.

6. **Level up your prompting** -- Several new techniques from the team:
   - Challenge Claude: say "Grill me on these changes and don't make a PR until I pass your test." Make Claude be your reviewer
   - Say "Prove to me this works" and have Claude diff behavior between `main` and your feature branch
   - After a mediocre fix, say: "Knowing everything you know now, scrap this and implement the elegant solution"
   - Write detailed specs and reduce ambiguity before handing work off -- the more specific, the better

7. **Optimize your terminal setup** -- The team loves Ghostty for its synchronized rendering, 24-bit color, and proper unicode support. Use `/statusline` to customize your status bar to show context usage and current git branch. Color-code and name your terminal tabs, sometimes using tmux -- one tab per task/worktree. Use voice dictation (fn x2 on macOS) -- you speak 3x faster than you type, and prompts get way more detailed.

8. **Use subagents strategically** *(also in Thread 1)* -- Append "use subagents" to any request where you want Claude to throw more compute at the problem. Offload individual tasks to subagents to keep your main agent's context window clean and focused. Route permission requests to Opus 4.5 via a hook to auto-approve safe ones.

9. **Use Claude for data & analytics** *(also in Thread 1)* -- Use the `bq` CLI to pull and analyze metrics on the fly. The team has a BigQuery skill checked into the codebase that everyone uses for analytics queries directly in Claude Code. Boris hasn't written a line of SQL in 6+ months. This works for any database that has a CLI, MCP, or API.

10. **Use Claude for learning** -- Enable the "Explanatory" or "Learning" output style in `/config` to have Claude explain the *why* behind its changes. Have Claude generate a visual HTML presentation explaining unfamiliar code. Ask Claude to draw ASCII diagrams of new protocols and codebases. Build a spaced-repetition learning skill where you explain your understanding, Claude asks follow-ups to fill gaps, and stores the result.

## Reference Repositories

| # | Resource | Link |
|---|----------|------|
| 1 | Everything Claude Code -- comprehensive community resource | [github.com/affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) |
| 2 | Code Simplifier Plugin (Official Anthropic) | [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/code-simplifier/agents/code-simplifier.md) |
