#!/bin/zsh
# Daily RSI improve-loop wrapper for launchd.
#
# The self-improvement cycle: observe -> judge -> gate -> propose -> self-verify ->
# queue for human approval (PROPOSE-ONLY; never applies changes). Follows
# improve-prompt.md. Writes only state.json (rsi.*) and improvements/QUEUE.md.
#
# Schedule: ~/Library/LaunchAgents/com.user.daily-ai-report-improve.plist (added after proving one cycle)
# Manual run: bash scripts/daily-ai-report/improve.sh

set -euo pipefail

PROJECT=/Users/I748816/Documents/SFM/Projects/ai-efficiency
IMPROVE_PROMPT="$PROJECT/scripts/daily-ai-report/improve-prompt.md"
STATE_FILE="$PROJECT/scripts/daily-ai-report/state.json"
REPORTS_DIR="$PROJECT/reports"
KB_DIR="$PROJECT/kb"
QUEUE="$PROJECT/improvements/QUEUE.md"
LOG_DIR="$PROJECT/scripts/daily-ai-report/logs"
CLAUDE_BIN=/Users/I748816/.nvm/versions/node/v22.22.3/bin/claude

export PATH="/Users/I748816/.nvm/versions/node/v22.22.3/bin:/usr/local/bin:/usr/bin:/bin"

# Load the SAP gateway env from settings.json (see run.sh for the full rationale).
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

export CLAUDE_CODE_MAX_CONTEXT_TOKENS=200000

mkdir -p "$LOG_DIR" "$PROJECT/improvements"

# Proxy-readiness guard (same as run.sh/meta.sh): skip cleanly if the gateway is down.
if ! /usr/bin/nc -z -G 2 127.0.0.1 6655 >/dev/null 2>&1; then
  echo "$(date -Iseconds) improve skipped: gateway proxy not listening; will retry next tick" \
    >>"$LOG_DIR/proxy-skips.log"
  exit 0
fi

TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/$TODAY.improve.log"

# Once-per-day guard: QUEUE.md gets a dated entry per cycle. If today's cycle already
# ran (marker in QUEUE.md), exit.
if [ -f "$QUEUE" ] && grep -q "<!-- cycle:$TODAY -->" "$QUEUE" 2>/dev/null; then
  exit 0
fi

# Only run once today's report exists (there must be something to judge).
if [ ! -f "$REPORTS_DIR/$TODAY.html" ]; then
  echo "$(date -Iseconds) improve skipped: today's report not produced yet" >>"$LOG_FILE"
  exit 0
fi

PROMPT=$(printf '%s\n' \
  "Today is $TODAY. Run the daily RSI improve loop (propose-only)." \
  "Read and follow $IMPROVE_PROMPT exactly." \
  "State: $STATE_FILE. Today's report: $REPORTS_DIR/$TODAY.html. KB: $KB_DIR. Queue: $QUEUE." \
  "Append the dated cycle marker '<!-- cycle:$TODAY -->' to the queue entry you write." \
  "PROPOSE-ONLY: edit only state.json and improvements/QUEUE.md. Do not commit. Print one summary line.")

cd "$PROJECT"

{
  echo "===== improve.sh started $(date -Iseconds) ====="
  printf '%s\n' "$PROMPT" | "$CLAUDE_BIN" -p \
    --permission-mode bypassPermissions \
    --output-format text
  echo "===== improve.sh finished $(date -Iseconds) ====="
} >>"$LOG_FILE" 2>&1
