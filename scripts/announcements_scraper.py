#!/usr/bin/env python3
"""
ASX Announcements Perma-Scraper
Continuously polls the ASX API for new company announcements.
Categorizes and summarizes using local Ollama (Phi 3).
Feeds data into the website.

Cycles through ALL ASX tickers, checking for new announcements.
Price-sensitive announcements get priority AI analysis.
"""

import json, time, re, os, sys, signal, hashlib
import urllib.request, urllib.parse
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

PROJECT_DIR = Path("/home/mark/Projects/asx-seobot")
DATA_DIR = PROJECT_DIR / "src" / "data"
ANNOUNCEMENTS_PATH = DATA_DIR / "announcements.json"
STOCKS_PATH = DATA_DIR / "stocks.json"
LOG_PATH = Path("/tmp/announcements_scraper.log")

ASX_API = "https://asx.api.markitdigital.com/asx-research/1.0/companies"
ASX_TOKEN = "83ff96335c2d45a094df02a206a39ff4"

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "phi3:3.8b"

# How many announcements to fetch per ticker
FETCH_COUNT = 5
# Delay between API calls (be nice to ASX)
API_DELAY = 1.0
# How many tickers per cycle before saving
BATCH_SIZE = 50
# Full cycle delay (after going through all tickers)
CYCLE_DELAY = 300  # 5 min pause between full cycles

running = True

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [ANN] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a") as f:
            f.write(line + "\n")
    except:
        pass

def signal_handler(sig, frame):
    global running
    log("Shutdown signal received")
    running = False

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

def get_all_tickers():
    """Get all tickers from our stock database."""
    if STOCKS_PATH.exists():
        stocks = json.loads(STOCKS_PATH.read_text())
        return [s["ticker"] for s in stocks]
    return []

def fetch_announcements(ticker):
    """Fetch latest announcements for a ticker from ASX API."""
    url = f"{ASX_API}/{ticker}/announcements?count={FETCH_COUNT}&access_token={ASX_TOKEN}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        items = data.get("data", {}).get("items", [])
        return items
    except Exception as e:
        return []

def categorize_announcement(ann_type, headline, is_sensitive):
    """Quick categorization without AI for speed."""
    headline_lower = headline.lower()
    ann_type_lower = ann_type.lower()
    
    # Map to categories
    if "quarterly" in ann_type_lower or "quarterly" in headline_lower:
        return "Quarterly Report"
    elif "half" in ann_type_lower or "half year" in headline_lower:
        return "Half Year Results"
    elif "annual" in ann_type_lower or "full year" in headline_lower:
        return "Annual Report"
    elif "drilling" in headline_lower or "exploration" in headline_lower:
        return "Exploration Update"
    elif "trading halt" in headline_lower:
        return "Trading Halt"
    elif "capital raise" in headline_lower or "placement" in headline_lower or "entitlement" in headline_lower:
        return "Capital Raise"
    elif "dividend" in headline_lower or "distribution" in headline_lower:
        return "Dividend"
    elif "acquisition" in headline_lower or "takeover" in headline_lower or "merger" in headline_lower:
        return "M&A"
    elif "director" in headline_lower and ("buy" in headline_lower or "sell" in headline_lower or "interest" in headline_lower):
        return "Director Dealing"
    elif "substantial" in headline_lower:
        return "Substantial Holder"
    elif "issued capital" in ann_type_lower or "securities" in headline_lower:
        return "Capital Structure"
    elif "progress" in ann_type_lower or "update" in headline_lower:
        return "Progress Report"
    elif is_sensitive:
        return "Price Sensitive"
    else:
        return "General"

def ai_summarize(ticker, headline, ann_type):
    """Use Ollama to generate a brief market-relevant summary for price-sensitive announcements."""
    prompt = f"""Summarize this ASX announcement in one sentence for investors. Be specific and actionable.
Ticker: {ticker}
Type: {ann_type}
Headline: {headline}
One sentence summary:"""

    try:
        payload = json.dumps({
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.3, "num_predict": 60}
        }).encode()
        
        req = urllib.request.Request(OLLAMA_URL, data=payload,
            headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=30)
        result = json.loads(resp.read())
        return result.get("response", "").strip().split("\n")[0]
    except:
        return headline

def load_announcements_db():
    if ANNOUNCEMENTS_PATH.exists():
        try:
            return json.loads(ANNOUNCEMENTS_PATH.read_text())
        except:
            pass
    return {
        "announcements": [],
        "by_ticker": {},
        "stats": {"total": 0, "price_sensitive": 0, "tickers_covered": 0},
        "last_updated": None
    }

def save_announcements_db(db):
    db["last_updated"] = datetime.now().isoformat()
    
    # Keep last 30 days of announcements
    cutoff = (datetime.now() - timedelta(days=30)).isoformat()
    db["announcements"] = [a for a in db["announcements"] if a.get("date", "") > cutoff]
    
    # Rebuild by_ticker index (latest 10 per ticker)
    by_ticker = defaultdict(list)
    for ann in db["announcements"]:
        ticker = ann.get("ticker", "")
        if len(by_ticker[ticker]) < 10:
            by_ticker[ticker].append({
                "date": ann["date"][:10],
                "headline": ann["headline"],
                "category": ann["category"],
                "priceSensitive": ann["priceSensitive"],
                "summary": ann.get("summary", ""),
            })
    db["by_ticker"] = dict(by_ticker)
    
    # Stats
    db["stats"] = {
        "total": len(db["announcements"]),
        "price_sensitive": sum(1 for a in db["announcements"] if a.get("priceSensitive")),
        "tickers_covered": len(by_ticker),
        "categories": dict(sorted(
            defaultdict(int, {a.get("category", "Other"): 1 for a in db["announcements"]}).items(),
            key=lambda x: -x[1]
        )),
    }
    
    ANNOUNCEMENTS_PATH.write_text(json.dumps(db, indent=2))

def main():
    global running
    
    # Support --once flag: do one cycle and exit
    once_mode = "--once" in sys.argv
    
    mode_label = "single-cycle" if once_mode else "continuous"
    log(f"🔥 ASX Announcements Scraper starting ({mode_label})...")
    log(f"   Model: {OLLAMA_MODEL} (local, for price-sensitive summaries)")
    log(f"   API delay: {API_DELAY}s per ticker")
    
    db = load_announcements_db()
    seen_keys = {a.get("key", "") for a in db.get("announcements", [])}
    log(f"   Existing announcements: {len(seen_keys)}")
    
    cycle = 0
    
    while running:
        tickers = get_all_tickers()
        if not tickers:
            log("No tickers in database yet, waiting 60s...")
            time.sleep(60)
            continue
        
        cycle += 1
        log(f"=== Cycle {cycle}: Scanning {len(tickers)} tickers ===")
        
        new_total = 0
        sensitive_total = 0
        errors = 0
        
        for i, ticker in enumerate(tickers):
            if not running:
                break
            
            items = fetch_announcements(ticker)
            
            new_for_ticker = 0
            for item in items:
                key = item.get("documentKey", "")
                if not key or key in seen_keys:
                    continue
                
                seen_keys.add(key)
                
                headline = item.get("headline", "Unknown")
                ann_type = item.get("announcementType", "")
                is_sensitive = item.get("isPriceSensitive", False)
                date = item.get("date", "")
                category = categorize_announcement(ann_type, headline, is_sensitive)
                
                # AI summarize price-sensitive announcements
                summary = ""
                if is_sensitive:
                    summary = ai_summarize(ticker, headline, ann_type)
                    sensitive_total += 1
                
                ann_entry = {
                    "key": key,
                    "ticker": ticker,
                    "date": date,
                    "headline": headline,
                    "type": ann_type,
                    "category": category,
                    "priceSensitive": is_sensitive,
                    "summary": summary,
                    "fileSize": item.get("fileSize", ""),
                }
                
                db["announcements"].append(ann_entry)
                new_for_ticker += 1
                new_total += 1
            
            if new_for_ticker > 0:
                sens_marker = " 🚨" if any(
                    a.get("priceSensitive") for a in db["announcements"][-new_for_ticker:]
                ) else ""
                log(f"  {ticker}: +{new_for_ticker} new{sens_marker}")
            
            # Save periodically
            if (i + 1) % BATCH_SIZE == 0:
                save_announcements_db(db)
                log(f"  💾 Saved ({i+1}/{len(tickers)} tickers, +{new_total} new)")
            
            # Rate limit
            time.sleep(API_DELAY)
        
        # End of cycle save
        save_announcements_db(db)
        log(f"=== Cycle {cycle} complete: +{new_total} new ({sensitive_total} price-sensitive), {errors} errors ===")
        log(f"    Total: {len(db['announcements'])} announcements, {len(db.get('by_ticker', {}))} tickers")
        
        # In --once mode, exit after first cycle
        if once_mode:
            log("Single cycle complete (--once mode). Exiting.")
            break
        
        if running:
            log(f"    Next cycle in {CYCLE_DELAY}s...")
            # Sleep in small chunks so we can respond to shutdown
            for _ in range(CYCLE_DELAY // 5):
                if not running:
                    break
                time.sleep(5)

    save_announcements_db(db)
    log("Announcements scraper shut down cleanly.")

if __name__ == "__main__":
    main()
