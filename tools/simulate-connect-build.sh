#!/usr/bin/env bash
# Builds each Connect application from a copy of its own folder, like the Connect builder does.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
# The Merchant Center app's production build needs registration values; placeholders are fine.
export CUSTOM_APPLICATION_ID=cmplaceholderplaceholder00 \
  ENTRY_POINT_URI_PATH=transactional-messaging CLOUD_IDENTIFIER=gcp-eu \
  APPLICATION_URL=https://placeholder.example.com
FAILED=0
for app in "$@"; do
  printf '%-24s ' "$app"
  cp -R "$ROOT/$app" "$WORK/$app"
  rm -rf "$WORK/$app/node_modules" "$WORK/$app/build" "$WORK/$app/public"
  if (cd "$WORK/$app" && npm ci --no-audit --no-fund && npm run build --if-present) > "$WORK/$app.log" 2>&1
  then echo 'ci + build OK'
  else echo 'FAILED'; tail -20 "$WORK/$app.log" | sed 's/^/    /'; FAILED=1; fi
done
[ "$FAILED" -eq 0 ] || { echo; echo 'Connect will fail the same way.'; exit 1; }
