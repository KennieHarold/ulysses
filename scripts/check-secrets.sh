#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/apps/web/dist"

if [ ! -d "$DIST" ]; then
  echo "No build found at apps/web/dist — run 'pnpm build' first." >&2
  exit 1
fi

if [ ! -f "$ROOT/.env" ]; then
  echo "No .env at repo root; nothing to compare against." >&2
  exit 1
fi

status=0
for name in WORLD_RP_SIGNING_KEY WORLD_API_KEY; do
  value="$(grep -E "^${name}=" "$ROOT/.env" | head -1 | cut -d= -f2- | tr -d '"'"'"' \r')"
  if [ -z "$value" ]; then
    echo "skip  $name (not set in .env)"
    continue
  fi
  if grep -rqF -- "$value" "$DIST"; then
    echo "LEAK  $name found in apps/web/dist" >&2
    grep -rlF -- "$value" "$DIST" >&2
    status=1
  else
    echo "ok    $name absent from bundle"
  fi
done

if [ "$status" -eq 0 ]; then
  echo "PASS: no server secrets in the web bundle."
else
  echo "FAIL: secrets leaked into the web bundle." >&2
fi
exit "$status"
