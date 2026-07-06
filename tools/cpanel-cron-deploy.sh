#!/bin/bash
# Run from cPanel -> Cron Jobs every 5 minutes for near-instant site updates after git push.
# Command: /bin/bash /home/ijh19zqesepn/repositories/GreenGroup/tools/cpanel-cron-deploy.sh
set -e
REPO="/home/ijh19zqesepn/repositories/GreenGroup"
PUBLIC="/home/ijh19zqesepn/public_html"
cd "$REPO"
git fetch origin main
git reset --hard origin/main
if [ -x /usr/local/cpanel/bin/git_deploy ]; then
  /usr/local/cpanel/bin/git_deploy "$REPO"
else
  /bin/cp -R "$REPO/assets" "$PUBLIC/"
  /bin/cp -R "$REPO/blog" "$PUBLIC/"
  /bin/cp "$REPO"/*.html "$PUBLIC/" 2>/dev/null || true
  /bin/cp "$REPO/robots.txt" "$REPO/sitemap.xml" "$REPO/deploy-check.txt" "$REPO/deploy-version.txt" "$PUBLIC/" 2>/dev/null || true
fi
echo "Deployed $(git rev-parse --short HEAD) at $(date)" >> "$PUBLIC/deploy-check.txt"
