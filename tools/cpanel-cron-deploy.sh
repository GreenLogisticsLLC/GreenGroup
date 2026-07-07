#!/bin/bash
# cPanel Cron (every 5 min):
# /bin/bash /home/ijh19zqesepn/repositories/GreenGroup/tools/cpanel-cron-deploy.sh
REPO="/home/ijh19zqesepn/repositories/GreenGroup"
PUBLIC="/home/ijh19zqesepn/public_html"
LOG="$PUBLIC/deploy-cron.log"

log() { echo "[$(date)] $*" >> "$LOG"; }

if [ ! -d "$REPO/.git" ]; then
  log "ERROR: repo not found at $REPO — clone GreenGroup in cPanel Git first."
  exit 1
fi

cd "$REPO" || { log "ERROR: cannot cd to $REPO"; exit 1; }

GIT="$(command -v git || echo /usr/local/cpanel/3rdparty/bin/git)"
$GIT fetch origin main 2>>"$LOG" || { log "ERROR: git fetch failed"; exit 1; }
$GIT reset --hard origin/main 2>>"$LOG" || { log "ERROR: git reset failed"; exit 1; }

HEAD="$($GIT rev-parse --short HEAD 2>/dev/null || echo unknown)"
log "Synced to $HEAD"

if [ -x /usr/local/cpanel/bin/git_deploy ]; then
  /usr/local/cpanel/bin/git_deploy "$REPO" >>"$LOG" 2>&1 || log "WARN: git_deploy failed, using cp fallback"
fi

/bin/cp -R "$REPO/assets" "$PUBLIC/" 2>>"$LOG"
/bin/cp -R "$REPO/blog" "$PUBLIC/" 2>>"$LOG"
/bin/cp "$REPO"/*.html "$PUBLIC/" 2>>"$LOG"
/bin/cp "$REPO/robots.txt" "$REPO/sitemap.xml" "$REPO/deploy-check.txt" "$REPO/deploy-version.txt" "$PUBLIC/" 2>>"$LOG"

echo "Deployed $HEAD at $(date)" >> "$PUBLIC/deploy-check.txt"
log "Deploy complete: $HEAD"

/bin/bash "$REPO/tools/deploy-os-subdomain.sh" "$REPO" >>"$LOG" 2>&1 && log "GreenOS subdomain deploy complete: $HEAD" || log "WARN: GreenOS subdomain deploy failed"
