#!/bin/bash
# ASX Desk Weekly Analysis Refresh
# Runs: AI analysis regeneration + sentiment scraping
# Schedule via cron: 0 2 * * 0 /home/mark/Projects/asx-seobot/scripts/weekly_update.sh

set -e
cd /home/mark/Projects/asx-seobot
echo "=== Weekly Analysis Refresh $(date) ==="

python3 scripts/refresh_analysis.py 2>&1
python3 scripts/sentiment_scraper2.py --once 2>&1 || true

echo "=== Done $(date) ==="
