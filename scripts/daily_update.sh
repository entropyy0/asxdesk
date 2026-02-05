#!/bin/bash
# ASX Desk Daily Update
# Runs: price update, announcements, IPO tracking, news generation, site rebuild, deploy
# Schedule via cron: 0 6 * * * /home/mark/Projects/asx-seobot/scripts/daily_update.sh

set -e
cd /home/mark/Projects/asx-seobot

LOG="/tmp/asxdesk_daily_$(date +%Y%m%d).log"
echo "=== ASX Desk Daily Update $(date) ===" | tee "$LOG"

# 1. Update prices
echo "[1/6] Updating prices..." | tee -a "$LOG"
python3 scripts/update_prices.py --delay 0.5 2>&1 | tail -5 | tee -a "$LOG"

# 2. Scrape announcements
echo "[2/6] Scraping announcements..." | tee -a "$LOG"
timeout 600 python3 scripts/announcements_scraper.py --once 2>&1 | tail -5 | tee -a "$LOG" || echo "Announcements timed out" | tee -a "$LOG"

# 3. Check for new IPOs + upcoming floats
echo "[3/6] Checking IPOs..." | tee -a "$LOG"
python3 scripts/ipo_tracker.py 2>&1 | tee -a "$LOG"

# 4. Generate news
echo "[4/6] Generating news..." | tee -a "$LOG"
python3 scripts/daily_news.py 2>&1 | tee -a "$LOG"

# 5. Build
echo "[5/6] Building site..." | tee -a "$LOG"
NODE_OPTIONS="--max-old-space-size=4096" npm run build 2>&1 | tail -5 | tee -a "$LOG"

# 6. Deploy
echo "[6/6] Deploying..." | tee -a "$LOG"
npx gh-pages -d out --nojekyll 2>&1 | tee -a "$LOG"

echo "=== Done $(date) ===" | tee -a "$LOG"
