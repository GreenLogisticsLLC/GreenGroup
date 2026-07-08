#!/bin/bash
# Run from GreenGroup repo after git pull (cron or manual). Skips if Node/npm unavailable.
REPO="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$REPO"

export PATH="/opt/cpanel/ea-nodejs20/bin:/opt/cpanel/ea-nodejs18/bin:$PATH"
NPM="$(command -v npm 2>/dev/null || true)"

if [ -z "$NPM" ]; then
  echo "[$(date)] SKIP Green OS build: npm not found on server"
  exit 0
fi

if [ ! -f "$REPO/package.json" ]; then
  echo "[$(date)] SKIP Green OS build: package.json missing"
  exit 0
fi

echo "[$(date)] Green OS deploy build..."
$NPM ci --omit=dev 2>/dev/null || $NPM install --production
$NPM run deploy:build
npx prisma db push --skip-generate 2>/dev/null || true
mkdir -p "$REPO/tmp"
touch "$REPO/tmp/restart.txt"
HEAD="$(git -C "$(dirname "$REPO")" rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "$HEAD" > "$REPO/deploy-version.txt"
echo "[$(date)] Green OS build complete: $HEAD"
