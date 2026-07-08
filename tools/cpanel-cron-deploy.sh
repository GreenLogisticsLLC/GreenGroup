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
  timeout 120 /usr/local/cpanel/bin/git_deploy "$REPO" >>"$LOG" 2>&1 || log "WARN: git_deploy failed or timed out, using cp fallback"
fi

if [ -f "$REPO/tools/cpanel-git-deploy-hook.sh" ]; then
  /bin/bash "$REPO/tools/cpanel-git-deploy-hook.sh" "$REPO" "$PUBLIC" >>"$LOG" 2>&1 || log "WARN: git deploy hook failed"
else
/bin/cp -R "$REPO/assets" "$PUBLIC/" 2>>"$LOG"
/bin/cp -R "$REPO/blog" "$PUBLIC/" 2>>"$LOG"
/bin/cp "$REPO"/*.html "$PUBLIC/" 2>>"$LOG"
/bin/cp "$REPO/robots.txt" "$REPO/sitemap.xml" "$REPO/deploy-check.txt" "$PUBLIC/" 2>>"$LOG"
fi

# Write the real deployed commit so deploy-version.txt reflects what is live.
echo "$HEAD" > "$PUBLIC/deploy-version.txt"
echo "Deployed $HEAD at $(date)" >> "$PUBLIC/deploy-check.txt"
log "Deploy complete: $HEAD"

if [ -f "$REPO/greenos/tools/cpanel-deploy-build.sh" ]; then
  /bin/bash "$REPO/greenos/tools/cpanel-deploy-build.sh" "$REPO/greenos" >>"$LOG" 2>&1 && log "Green OS Node build complete" || log "WARN: Green OS build failed"
fi
