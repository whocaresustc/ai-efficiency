#!/bin/zsh
# Daily AI report META-AGENT wrapper for launchd.
#
# Runs the self-improvement pass: critiques today's report run and updates
# state.json (and optionally sources.json / PROMPT.md). Fires after run.sh.
#
# Schedule: ~/Library/LaunchAgents/com.user.daily-ai-report-meta.plist
# Manual run: bash scripts/daily-ai-report/meta.sh

set -euo pipefail

PROJECT=/Users/I748816/Documents/SFM/Projects/ai-efficiency
META_PROMPT="$PROJECT/scripts/daily-ai-report/meta-prompt.md"
STATE_FILE="$PROJECT/scripts/daily-ai-report/state.json"
REPORTS_DIR="$PROJECT/reports"
LOG_DIR="$PROJECT/scripts/daily-ai-report/logs"
SCORECARD_DIR="$PROJECT/scripts/daily-ai-report/scorecards"
CLAUDE_BIN=/Users/I748816/.nvm/versions/node/v22.22.3/bin/claude

export PATH="/Users/I748816/.nvm/versions/node/v22.22.3/bin:/usr/local/bin:/usr/bin:/bin"

# Load the SAP gateway env from settings.json (see run.sh for the full rationale):
# launchd does not source ~/.zshrc, so without this claude -p can't reach the
# gateway and exits 78 (EX_CONFIG).
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

mkdir -p "$LOG_DIR" "$SCORECARD_DIR"

# Proxy-readiness guard (see run.sh for the full rationale): claude -p needs the
# login-scoped proxy on localhost:6655. If it's down, skip cleanly (exit 0) and let
# a later tick retry once it's up, rather than dying with EX_CONFIG.
if ! /usr/bin/nc -z -G 2 127.0.0.1 6655 >/dev/null 2>&1; then
  echo "$(date -Iseconds) meta skipped: gateway proxy (localhost:6655) not listening; will retry next tick" \
    >>"$LOG_DIR/proxy-skips.log"
  exit 0
fi

TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/$TODAY.meta.log"

# Once-per-day guard: if today's scorecard exists, the meta pass already ran.
if [ -f "$SCORECARD_DIR/$TODAY.html" ]; then
  exit 0
fi

# Only run the meta pass once today's report run has actually happened, so there
# is something to critique. If today's report is missing, skip quietly — the
# report run's own catch-up guard will produce it, and the next meta fire reviews it.
if [ ! -f "$REPORTS_DIR/$TODAY.html" ]; then
  echo "$(date -Iseconds) meta skipped: today's report not produced yet" >>"$LOG_FILE"
  exit 0
fi

PROMPT=$(printf '%s\n' \
  "Today is $TODAY. Run the daily meta-agent self-improvement pass." \
  "" \
  "Read and follow the instructions in $META_PROMPT." \
  "Durable state is at $STATE_FILE. Today's report is $REPORTS_DIR/$TODAY.html and the run log is $LOG_DIR/$TODAY.log." \
  "Follow the hard safety rules exactly. Do not commit. Print one summary line when done.")

cd "$PROJECT"

{
  echo "===== meta.sh started $(date -Iseconds) ====="
  printf '%s\n' "$PROMPT" | "$CLAUDE_BIN" -p \
    --permission-mode bypassPermissions \
    --output-format text
  echo "===== meta.sh finished $(date -Iseconds) ====="
} >>"$LOG_FILE" 2>&1
