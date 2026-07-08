#!/bin/bash
# Fast deploy hook for cPanel Git "Deploy HEAD Commit" (.cpanel.yml).
# Keeps static site copy only — no npm (Node build runs separately in cron).
set -e
REPO="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
PUBLIC="${2:-/home/ijh19zqesepn/public_html}"
OS_PUBLIC="${3:-/home/ijh19zqesepn/os.greengrouplogistics.com}"

cd "$REPO"

HEAD="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

/bin/cp -R "$REPO/assets" "$PUBLIC/"
/bin/cp -R "$REPO/blog" "$PUBLIC/" 2>/dev/null || true
/bin/cp "$REPO"/*.html "$PUBLIC/" 2>/dev/null || true
/bin/cp "$REPO/robots.txt" "$REPO/sitemap.xml" "$REPO/deploy-check.txt" "$PUBLIC/" 2>/dev/null || true

echo "$HEAD" > "$PUBLIC/deploy-version.txt"
echo "Deployed $HEAD at $(date)" >> "$PUBLIC/deploy-check.txt"

if [ -f "$REPO/tools/deploy-os-subdomain.sh" ]; then
  /bin/bash "$REPO/tools/deploy-os-subdomain.sh" "$REPO" "$OS_PUBLIC"
fi

echo "Git deploy hook OK: $HEAD"
