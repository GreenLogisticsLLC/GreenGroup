#!/bin/bash
# Deploy GreenOS static fallback to os.greengrouplogistics.com (legacy os-site).
# Skip when greenos/ Node app exists — Application Manager serves that path instead.
REPO="${1:-/home/ijh19zqesepn/repositories/GreenGroup}"
OS_PUBLIC="${2:-/home/ijh19zqesepn/os.greengrouplogistics.com}"

if [ -d "$REPO/greenos/server.js" ]; then
  echo "SKIP os-site static deploy: greenos/ Node app is the source for os.greengrouplogistics.com"
  exit 0
fi

if [ ! -d "$REPO/os-site" ]; then
  echo "ERROR: $REPO/os-site not found" >&2
  exit 1
fi

mkdir -p "$OS_PUBLIC"

/bin/cp -R "$REPO/assets" "$OS_PUBLIC/"
/bin/cp "$REPO/os-site/assets/js/greenos-config.js" "$OS_PUBLIC/assets/js/greenos-config.js"
/bin/cp "$REPO/os-site/index.html" "$OS_PUBLIC/index.html"
/bin/cp "$REPO/os-site/index.html" "$OS_PUBLIC/greenos.html"
/bin/cp "$REPO/os-site/greenos-dashboard.html" "$OS_PUBLIC/greenos-dashboard.html"
/bin/cp "$REPO/os-site/robots.txt" "$OS_PUBLIC/robots.txt" 2>/dev/null || true

HEAD="$(cd "$REPO" && git rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "GreenOS subdomain deploy $HEAD at $(date)" >> "$OS_PUBLIC/deploy-check.txt"
