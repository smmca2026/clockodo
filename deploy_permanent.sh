#!/bin/bash
# Clockodo 24/7 Permanent Deployment & Auto-Recovery Script
set -e

echo "=========================================================="
echo "  CLOCKODO 24/7 PERMANENT RECOVERY & STARTUP FIX"
echo "=========================================================="

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "1. Pulling latest codebase from origin/master..."
git pull origin master

echo "2. Building frontend for production..."
cd frontend
npm run build
cd "$APP_DIR"

echo "3. Installing backend dependencies if needed..."
cd backend
npm install --production --no-audit --no-fund
cd "$APP_DIR"

echo "4. Configuring PM2 for 24/7 background execution..."
# Stop old rogue pm2 instances if any
npx pm2 delete clockodo 2>/dev/null || true

# Start with ecosystem.config.js
npx pm2 start ecosystem.config.js

# Save running process list so it survives reboots
npx pm2 save

echo "5. Enabling process persistence..."
# If loginctl is available, enable linger for current user so closing SSH doesn't kill PM2
if command -v loginctl &> /dev/null; then
  loginctl enable-linger "$USER" 2>/dev/null || true
fi

echo "6. Installing automatic 24/7 watchdog (Restarts app automatically if server reboots)..."
# Add watchdog and reboot resurrect to user crontab without needing root/sudo
CURRENT_CRON=$(crontab -l 2>/dev/null | grep -F -v "clockodo" || true)
NEW_CRON="$CURRENT_CRON
@reboot cd $APP_DIR && npx pm2 resurrect 2>/dev/null || (cd $APP_DIR && npx pm2 start ecosystem.config.js)
* * * * * cd $APP_DIR && curl -s -f http://127.0.0.1:3022/health > /dev/null || npx pm2 restart clockodo"

echo "$NEW_CRON" | crontab -
echo "✓ Watchdog installed in crontab! Even if the server reboots overnight, it will restart automatically!"

echo "=========================================================="
echo "  SUCCESS! Clockodo is now permanently LIVE 24/7!"
echo "=========================================================="
npx pm2 status
