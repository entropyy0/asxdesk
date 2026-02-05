#!/usr/bin/env python3
"""
DEPRECATED: This script is no longer needed. PriceChart now uses the
TradingView Advanced Chart widget which loads data directly from TradingView.
The public/charts/ directory has been removed.

Original description:
Generate static chart data for all ASX stocks.
Fetches 1Y daily price history from Yahoo Finance and saves as JSON files
in public/charts/ for client-side rendering.
"""

import json, time, sys, os
import urllib.request
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path("/home/mark/Projects/asx-seobot")
STOCKS_PATH = PROJECT_DIR / "src" / "data" / "stocks.json"
CHARTS_DIR = PROJECT_DIR / "public" / "charts"

def fetch_chart(ticker, range_str="1y", interval="1d"):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}.AX?range={range_str}&interval={interval}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        result = data.get("chart", {}).get("result", [])
        if not result:
            return None
        
        timestamps = result[0].get("timestamp", [])
        quotes = result[0].get("indicators", {}).get("quote", [{}])[0]
        closes = quotes.get("close", [])
        volumes = quotes.get("volume", [])
        
        # Build compact data array [timestamp, close, volume]
        points = []
        for i, ts in enumerate(timestamps):
            c = closes[i] if i < len(closes) else None
            v = volumes[i] if i < len(volumes) else None
            if c is not None:
                points.append([ts, round(c, 4), v or 0])
        
        return points
    except:
        return None

def main():
    CHARTS_DIR.mkdir(parents=True, exist_ok=True)
    
    stocks = json.loads(STOCKS_PATH.read_text())
    print(f"Generating chart data for {len(stocks)} stocks...")
    
    success = 0
    failed = 0
    
    for i, stock in enumerate(stocks):
        ticker = stock["ticker"]
        out_path = CHARTS_DIR / f"{ticker}.json"
        
        # Skip if already generated today
        if out_path.exists():
            mod_time = datetime.fromtimestamp(out_path.stat().st_mtime)
            if mod_time.date() == datetime.now().date():
                success += 1
                continue
        
        print(f"[{i+1}/{len(stocks)}] {ticker}...", end=" ", flush=True)
        
        chart_data = {}
        
        # Fetch multiple ranges
        for range_key, range_val, interval in [
            ("1m", "1mo", "1d"),
            ("3m", "3mo", "1d"),
            ("6m", "6mo", "1d"),
            ("1y", "1y", "1d"),
            ("5y", "5y", "1wk"),
        ]:
            points = fetch_chart(ticker, range_val, interval)
            if points:
                chart_data[range_key] = points
            time.sleep(0.3)
        
        if chart_data:
            out_path.write_text(json.dumps(chart_data))
            success += 1
            print(f"✅ ({len(chart_data)} ranges)")
        else:
            failed += 1
            print("❌")
        
        # Save progress every 50
        if (i + 1) % 50 == 0:
            print(f"  💾 {success} done, {failed} failed")
        
        time.sleep(0.5)
    
    print(f"\nDone! {success} charts, {failed} failed")

if __name__ == "__main__":
    main()
