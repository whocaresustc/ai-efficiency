#!/bin/zsh
# Daily AI report wrapper for launchd.
#
# Reads the prompt from PROMPT.md, fills in today's date, and pipes to
# claude -p in non-interactive mode. Output goes to logs/ so launchd
# stays quiet.
#
# Schedule lives in ~/Library/LaunchAgents/com.user.daily-ai-report.plist
# Manual run: bash scripts/daily-ai-report/run.sh

set -euo pipefail

PROJECT=/Users/I748816/Documents/SFM/Projects/ai-efficiency
PROMPT_FILE="$PROJECT/scripts/daily-ai-report/PROMPT.md"
SYNTH_PROMPT_FILE="$PROJECT/scripts/daily-ai-report/synth-prompt.md"
SOURCES_FILE="$PROJECT/scripts/daily-ai-report/sources.json"
STATE_FILE="$PROJECT/scripts/daily-ai-report/state.json"
REPORTS_DIR="$PROJECT/reports"
KB_DIR="$PROJECT/kb"
LOG_DIR="$PROJECT/scripts/daily-ai-report/logs"
CLAUDE_BIN=/Users/I748816/.nvm/versions/node/v22.22.3/bin/claude

# nvm node lives under a PATH set by ~/.zshrc which launchd does not source.
# Prepend node bin so claude finds its node runtime.
export PATH="/Users/I748816/.nvm/versions/node/v22.22.3/bin:/usr/local/bin:/usr/bin:/bin"

# launchd does not source ~/.zshrc, and the `env` block in ~/.claude/settings.json
# is only auto-applied to interactive runs. Without it, claude -p can't reach the
# SAP gateway (ANTHROPIC_BASE_URL / _AUTH_TOKEN / _MODEL are unset) and falls back
# to the public API, which rejects the proxied model id as `unrecognized_model`
# and exits 78 (EX_CONFIG). Export that env block here so the cron run uses the
# same gateway config as the interactive session.
SETTINGS=/Users/I748816/.claude/settings.json
while IFS=$'\t' read -r k v; do
  [ -n "$k" ] && export "$k=$v"
done < <(/usr/bin/python3 -I -c '
import json, sys
with open(sys.argv[1]) as f:
    env = json.load(f).get("env", {})
for k, v in env.items():
    print(f"{k}\t{v}")
' "$SETTINGS")

# Keep the full context window for the cron run (settings.json caps it at 1M).
export CLAUDE_CODE_MAX_CONTEXT_TOKENS=200000

mkdir -p "$LOG_DIR" "$REPORTS_DIR"

# Proxy-readiness guard + auto-recover. claude -p can only reach the SAP gateway
# through the login-scoped proxy on localhost:6655 (process hai-desktop). When a
# scheduled run fires while that proxy is down (overnight / before login), the run
# would die with EX_CONFIG and produce nothing. Instead: if the proxy isn't
# listening, log it and exit 0 (clean). The StartInterval (every 2h) + the
# catch-up guard below mean the next tick after the proxy comes up will generate
# the still-missing report automatically — self-healing, no manual run needed.
if ! /usr/bin/nc -z -G 2 127.0.0.1 6655 >/dev/null 2>&1; then
  echo "$(date -Iseconds) run skipped: gateway proxy (localhost:6655) not listening; will retry next tick" \
    >>"$LOG_DIR/proxy-skips.log"
  exit 0
fi

TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/$TODAY.log"

# Catch-up guard: this agent is fired on login/wake and periodically (StartInterval),
# not at a fixed clock time, because launchd will not wake the Mac for a
# StartCalendarInterval and does not catch up calendar runs missed while asleep.
# Do the real work at most once per day: if today's report already exists, exit.
if [ -f "$REPORTS_DIR/$TODAY.html" ]; then
  exit 0
fi

# Pull the self-improvement learnings the meta-agent recorded, so this run acts on
# them (double-check degraded sources, don't declare quiet without scanning X, etc).
STATE_HINT=""
if [ -f "$STATE_FILE" ]; then
  STATE_HINT=$(/usr/bin/python3 -I -c '
import json, sys
try:
    s = json.load(open(sys.argv[1]))
except Exception:
    sys.exit(0)
deg = [n for n, v in s.get("sources", {}).items() if isinstance(v, dict) and v.get("status") == "degraded"]
dis = [n for n, v in s.get("sources", {}).items() if isinstance(v, dict) and v.get("status") == "disabled"]
notes = s.get("judgment", {}).get("notes", [])[:5]
out = []
if dis:   out.append("Disabled sources (skip these): " + ", ".join(dis) + ".")
if deg:   out.append("Degraded sources (double-check their output, do not trust a single stale/empty fetch): " + ", ".join(deg) + ".")
for nts in notes:
    out.append("Lesson: " + nts)
print("\n".join(out))
' "$STATE_FILE" 2>/dev/null || true)
fi

# Build the prompt with printf so no heredoc-quote issues.
PROMPT=$(printf '%s\n' \
  "Today is $TODAY. Run the daily AI report." \
  "" \
  "Read and follow the instructions in $PROMPT_FILE, using the source list at $SOURCES_FILE." \
  "Use a 24-hour lookback window (last 24h from now)." \
  "Write the report to $REPORTS_DIR/$TODAY.html and copy it to $REPORTS_DIR/latest.html." \
  "Do not commit. The user reviews and commits manually." \
  "Print one summary line when done." \
  "" \
  "Self-improvement learnings from prior runs (honor these):" \
  "${STATE_HINT:-(none yet)}" \
  "" \
  "Also check if reports/ has any gap in dated files between the most recent report and today." \
  "If a daily report is missing for one or more dates in the gap, backfill it as YYYY-MM-DD.html using whatever current source data you can reconstruct, and mark the report header clearly as backfilled.")

cd "$PROJECT"

# bypassPermissions so the agent can write files without prompting.
{
  echo "===== run.sh started $(date -Iseconds) ====="
  printf '%s\n' "$PROMPT" | "$CLAUDE_BIN" -p \
    --permission-mode bypassPermissions \
    --output-format text
  echo "===== run.sh finished $(date -Iseconds) ====="
} >>"$LOG_FILE" 2>&1

# KB synthesis: fold today's report into the living knowledge base (kb/). Runs only
# if the report was actually written, so a failed report never triggers synthesis.
# Kept as a separate claude -p call so a synthesis failure can't corrupt the report.
if [ -f "$REPORTS_DIR/$TODAY.html" ]; then
  SYNTH_PROMPT=$(printf '%s\n' \
    "Today is $TODAY. Run the daily KB synthesis pass." \
    "Read and follow the instructions in $SYNTH_PROMPT_FILE." \
    "Today's report is $REPORTS_DIR/$TODAY.html. The knowledge base is at $KB_DIR (edit kb/*.html in place)." \
    "Do not commit. Print one summary line when done.")
  {
    echo "===== kb synth started $(date -Iseconds) ====="
    printf '%s\n' "$SYNTH_PROMPT" | "$CLAUDE_BIN" -p \
      --permission-mode bypassPermissions \
      --output-format text
    echo "===== kb synth finished $(date -Iseconds) ====="
  } >>"$LOG_DIR/$TODAY.synth.log" 2>&1
fi
