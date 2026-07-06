#!/bin/bash
# Optional: run from cPanel -> Cron Jobs every 5-15 minutes if GitHub webhook is unavailable.
# Command: /bin/bash /home/ijh19zqesepn/repositories/GreenGroup/tools/cpanel-cron-deploy.sh
set -e
REPO="/home/ijh19zqesepn/repositories/GreenGroup"
cd "$REPO"
git fetch origin main
git reset --hard origin/main
if [ -x /usr/local/cpanel/bin/git_deploy ]; then
  /usr/local/cpanel/bin/git_deploy "$REPO"
else
  /bin/cp -R "$REPO/assets" /home/ijh19zqesepn/public_html/
  /bin/cp -R "$REPO/blog" /home/ijh19zqesepn/public_html/
  /bin/cp "$REPO"/*.html /home/ijh19zqesepn/public_html/ 2>/dev/null || true
  /bin/cp "$REPO/robots.txt" "$REPO/sitemap.xml" "$REPO/deploy-check.txt" /home/ijh19zqesepn/public_html/ 2>/dev/null || true
fi
