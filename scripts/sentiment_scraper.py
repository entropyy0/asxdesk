#!/usr/bin/env python3
"""
ASX Sentiment Perma-Scraper
Continuously scrapes HotCopper + X for ASX stock sentiment.
Uses local Ollama (Llama 3 8B) for sentiment analysis — zero cost.

Runs forever. Outputs to src/data/sentiment.json
"""

import json, time, re, os, sys, hashlib, signal
import urllib.request, urllib.parse
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

# Paths
PROJECT_DIR = Path("/home/mark/Projects/asx-seobot")
DATA_DIR = PROJECT_DIR / "src" / "data"
SENTIMENT_PATH = DATA_DIR / "sentiment.json"
SCRAPE_LOG_PATH = Path("/tmp/sentiment_scraper.log")

# Ollama config
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3:8b-instruct-q4_K_M"

# SearXNG
SEARXNG_URL = "http://localhost:8888/search"

# Scrape intervals
HOTCOPPER_INTERVAL = 180    # 3 mins between HotCopper scrapes
TWITTER_INTERVAL = 300      # 5 mins between X/Twitter scrapes
SAVE_INTERVAL = 60          # Save every minute

# Track seen posts to avoid duplicates
seen_hashes = set()
running = True

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(SCRAPE_LOG_PATH, "a") as f:
        f.write(line + "\n")

def signal_handler(sig, frame):
    global running
    log("Shutdown signal received, saving and exiting...")
    running = False

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

def ollama_sentiment(text, ticker=""):
    """Classify sentiment using local Ollama Llama 3."""
    prompt = f"""Classify this ASX stock forum post's sentiment. Return ONLY a JSON object.

Post about {ticker}: "{text[:500]}"

Return: {{"sentiment": "bullish"|"bearish"|"neutral", "confidence": 0.0-1.0, "summary": "one line summary"}}
JSON only, no explanation:"""

    try:
        payload = json.dumps({
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1, "num_predict": 100}
        }).encode()
        
        req = urllib.request.Request(OLLAMA_URL, data=payload,
            headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=60)
        result = json.loads(resp.read())
        text_out = result.get("response", "").strip()
        
        # Parse JSON from response
        if not text_out.startswith("{"):
            start = text_out.find("{")
            if start >= 0: text_out = text_out[start:]
        if not text_out.endswith("}"):
            end = text_out.rfind("}")
            if end >= 0: text_out = text_out[:end+1]
        
        return json.loads(text_out)
    except Exception as e:
        return {"sentiment": "neutral", "confidence": 0.5, "summary": "Analysis failed"}

def extract_tickers(text):
    """Extract ASX ticker mentions from text."""
    # Match $XXX or ASX:XXX or standalone 3-letter uppercase
    patterns = [
        r'\$([A-Z]{2,4})\b',
        r'ASX[:\s]([A-Z]{2,4})\b',
        r'\b([A-Z]{3})\b',
    ]
    tickers = set()
    for pattern in patterns:
        matches = re.findall(pattern, text)
        tickers.update(matches)
    
    # Filter out common English words that look like tickers
    noise = {"THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER",
             "WAS", "ONE", "OUR", "OUT", "HAS", "HIS", "HOW", "ITS", "MAY", "NEW",
             "NOW", "OLD", "SEE", "WAY", "WHO", "DID", "GET", "HIM", "LET", "SAY",
             "SHE", "TOO", "USE", "DAD", "MOM", "PRE", "IPO", "CEO", "CFO", "ETF",
             "ASX", "AUD", "USD", "GDP", "RBA", "IMF"}
    return tickers - noise

def scrape_hotcopper():
    """Scrape HotCopper via SearXNG for recent ASX stock discussions."""
    posts = []
    queries = [
        "site:hotcopper.com.au ASX stock",
        "site:hotcopper.com.au mining announcement",
        "site:hotcopper.com.au penny stock",
        "site:hotcopper.com.au biotech ASX",
        "site:hotcopper.com.au lithium gold copper ASX",
        "site:hotcopper.com.au rocket moon ASX",
    ]
    
    query = queries[int(time.time() / HOTCOPPER_INTERVAL) % len(queries)]
    
    try:
        url = f"{SEARXNG_URL}?q={urllib.parse.quote(query)}&format=json&time_range=day"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        
        for r in data.get("results", [])[:10]:
            content = r.get("content", "")
            title = r.get("title", "")
            full_text = f"{title} {content}"
            
            # Deduplicate
            h = hashlib.md5(full_text.encode()).hexdigest()
            if h in seen_hashes:
                continue
            seen_hashes.add(h)
            
            tickers = extract_tickers(full_text)
            if tickers:
                posts.append({
                    "source": "hotcopper",
                    "title": title,
                    "text": content[:500],
                    "url": r.get("url", ""),
                    "tickers": list(tickers),
                    "scraped_at": datetime.now().isoformat(),
                })
        
        log(f"HotCopper: {len(posts)} new posts (query: {query[:40]})")
    except Exception as e:
        log(f"HotCopper scrape error: {e}")
    
    return posts

def scrape_twitter():
    """Scrape X/Twitter via SearXNG for ASX stock sentiment."""
    posts = []
    queries = [
        "ASX stock twitter.com OR x.com",
        "ASX penny stock moon twitter.com OR x.com",  
        "ASX mining gold lithium twitter.com OR x.com",
        "$BHP OR $CBA OR $FMG OR $CSL ASX twitter.com OR x.com",
        "ASX small cap buy sell twitter.com OR x.com",
    ]
    
    query = queries[int(time.time() / TWITTER_INTERVAL) % len(queries)]
    
    try:
        url = f"{SEARXNG_URL}?q={urllib.parse.quote(query)}&format=json&time_range=day"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        
        for r in data.get("results", [])[:10]:
            content = r.get("content", "")
            title = r.get("title", "")
            full_text = f"{title} {content}"
            
            h = hashlib.md5(full_text.encode()).hexdigest()
            if h in seen_hashes:
                continue
            seen_hashes.add(h)
            
            tickers = extract_tickers(full_text)
            if tickers:
                posts.append({
                    "source": "twitter",
                    "title": title,
                    "text": content[:500],
                    "url": r.get("url", ""),
                    "tickers": list(tickers),
                    "scraped_at": datetime.now().isoformat(),
                })
        
        log(f"X/Twitter: {len(posts)} new posts (query: {query[:40]})")
    except Exception as e:
        log(f"Twitter scrape error: {e}")
    
    return posts

def analyze_posts(posts):
    """Run sentiment analysis on posts using local Ollama."""
    results = []
    for post in posts:
        ticker_str = ", ".join(post["tickers"][:3])
        sentiment = ollama_sentiment(post["text"], ticker_str)
        
        results.append({
            "source": post["source"],
            "tickers": post["tickers"],
            "title": post["title"],
            "text": post["text"][:200],
            "url": post["url"],
            "sentiment": sentiment.get("sentiment", "neutral"),
            "confidence": sentiment.get("confidence", 0.5),
            "summary": sentiment.get("summary", ""),
            "analyzed_at": datetime.now().isoformat(),
        })
        
        log(f"  {ticker_str}: {sentiment.get('sentiment', '?')} ({sentiment.get('confidence', 0):.0%})")
    
    return results

def load_sentiment_db():
    """Load existing sentiment data."""
    if SENTIMENT_PATH.exists():
        return json.loads(SENTIMENT_PATH.read_text())
    return {"posts": [], "aggregates": {}, "last_updated": None}

def save_sentiment_db(db):
    """Save sentiment data."""
    db["last_updated"] = datetime.now().isoformat()
    
    # Keep last 7 days of posts only
    cutoff = (datetime.now() - timedelta(days=7)).isoformat()
    db["posts"] = [p for p in db["posts"] if p.get("analyzed_at", "") > cutoff]
    
    # Compute per-ticker aggregates
    ticker_data = defaultdict(lambda: {"bullish": 0, "bearish": 0, "neutral": 0, "total": 0, "posts": []})
    for post in db["posts"]:
        for ticker in post.get("tickers", []):
            s = post.get("sentiment", "neutral")
            ticker_data[ticker][s] += 1
            ticker_data[ticker]["total"] += 1
            if len(ticker_data[ticker]["posts"]) < 5:  # Keep latest 5 per ticker
                ticker_data[ticker]["posts"].append({
                    "source": post["source"],
                    "summary": post.get("summary", ""),
                    "sentiment": s,
                    "date": post.get("analyzed_at", "")[:10],
                })
    
    # Calculate sentiment scores
    aggregates = {}
    for ticker, data in ticker_data.items():
        total = data["total"]
        if total > 0:
            score = (data["bullish"] - data["bearish"]) / total
            aggregates[ticker] = {
                "score": round(score, 2),  # -1 to +1
                "bullish": data["bullish"],
                "bearish": data["bearish"],
                "neutral": data["neutral"],
                "total": total,
                "label": "Bullish" if score > 0.2 else ("Bearish" if score < -0.2 else "Mixed"),
                "recentPosts": data["posts"][-5:],
            }
    
    db["aggregates"] = aggregates
    SENTIMENT_PATH.write_text(json.dumps(db, indent=2))

def main():
    global running
    log("🔥 ASX Sentiment Perma-Scraper starting...")
    log(f"   Model: {OLLAMA_MODEL} (local)")
    log(f"   HotCopper interval: {HOTCOPPER_INTERVAL}s")
    log(f"   Twitter interval: {TWITTER_INTERVAL}s")
    log(f"   Output: {SENTIMENT_PATH}")
    
    db = load_sentiment_db()
    log(f"   Existing posts: {len(db.get('posts', []))}")
    
    last_hc_scrape = 0
    last_tw_scrape = 0
    last_save = 0
    cycle = 0
    
    while running:
        now = time.time()
        new_posts = []
        
        # Scrape HotCopper
        if now - last_hc_scrape >= HOTCOPPER_INTERVAL:
            posts = scrape_hotcopper()
            if posts:
                analyzed = analyze_posts(posts)
                new_posts.extend(analyzed)
            last_hc_scrape = now
        
        # Scrape Twitter/X
        if now - last_tw_scrape >= TWITTER_INTERVAL:
            posts = scrape_twitter()
            if posts:
                analyzed = analyze_posts(posts)
                new_posts.extend(analyzed)
            last_tw_scrape = now
        
        # Add to database
        if new_posts:
            db["posts"].extend(new_posts)
        
        # Save periodically
        if now - last_save >= SAVE_INTERVAL and (new_posts or cycle == 0):
            save_sentiment_db(db)
            log(f"💾 Saved: {len(db['posts'])} posts, {len(db.get('aggregates', {}))} tickers tracked")
            last_save = now
        
        cycle += 1
        
        # Sleep between cycles
        time.sleep(10)
    
    # Final save on shutdown
    save_sentiment_db(db)
    log("Scraper shut down cleanly. Data saved.")

if __name__ == "__main__":
    main()
