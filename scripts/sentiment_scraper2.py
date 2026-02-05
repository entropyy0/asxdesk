#!/usr/bin/env python3
"""
ASX Sentiment Perma-Scraper #2
Scrapes Reddit (ASX_Bets, AusFinance), Livewire, Stockhead, Small Caps
Uses local Ollama Phi 3 (3.8B) — tiny, fast, zero cost.

Complements scraper #1 (HotCopper + X with Llama 3)
"""

import json, time, re, os, sys, hashlib, signal
import urllib.request, urllib.parse
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict

PROJECT_DIR = Path("/home/mark/Projects/asx-seobot")
DATA_DIR = PROJECT_DIR / "src" / "data"
SENTIMENT_PATH = DATA_DIR / "sentiment.json"  # Shared with scraper 1
SCRAPE_LOG_PATH = Path("/tmp/sentiment_scraper2.log")

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "phi3:3.8b"  # Smaller, faster model for scraper 2

SEARXNG_URL = "http://localhost:8888/search"

SCRAPE_INTERVAL = 240  # 4 mins between scrape cycles
SAVE_INTERVAL = 60

seen_hashes = set()
running = True

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [S2] {msg}"
    print(line, flush=True)
    try:
        with open(SCRAPE_LOG_PATH, "a") as f:
            f.write(line + "\n")
    except:
        pass

def signal_handler(sig, frame):
    global running
    log("Shutdown signal received")
    running = False

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

def ollama_sentiment(text, ticker=""):
    prompt = f"""Classify sentiment of this ASX stock post. Return ONLY JSON.
Post about {ticker}: "{text[:400]}"
Return: {{"sentiment": "bullish"|"bearish"|"neutral", "confidence": 0.0-1.0, "summary": "one line"}}"""

    try:
        payload = json.dumps({
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0.1, "num_predict": 80}
        }).encode()
        
        req = urllib.request.Request(OLLAMA_URL, data=payload,
            headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=45)
        result = json.loads(resp.read())
        text_out = result.get("response", "").strip()
        
        if not text_out.startswith("{"):
            start = text_out.find("{")
            if start >= 0: text_out = text_out[start:]
        if not text_out.endswith("}"):
            end = text_out.rfind("}")
            if end >= 0: text_out = text_out[:end+1]
        
        return json.loads(text_out)
    except:
        return {"sentiment": "neutral", "confidence": 0.5, "summary": "Analysis failed"}

def extract_tickers(text):
    patterns = [r'\$([A-Z]{2,4})\b', r'ASX[:\s]([A-Z]{2,4})\b', r'\b([A-Z]{3})\b']
    tickers = set()
    for pattern in patterns:
        tickers.update(re.findall(pattern, text))
    noise = {"THE","AND","FOR","ARE","BUT","NOT","YOU","ALL","CAN","HER","WAS","ONE",
             "OUR","OUT","HAS","HIS","HOW","ITS","MAY","NEW","NOW","OLD","SEE","WAY",
             "WHO","DID","GET","HIM","LET","SAY","SHE","TOO","USE","DAD","MOM","PRE",
             "IPO","CEO","CFO","ETF","ASX","AUD","USD","GDP","RBA","IMF","ETA","FAQ",
             "PDF","URL","RSS","API","BIG","RED","TOP","LOW","HIGH","EDIT","JUST",
             "THIS","THAT","WITH","FROM","BEEN","HAVE","WILL","WHAT","YOUR","THEM"}
    return tickers - noise

def scrape_source(query_set_name, queries):
    """Scrape a set of queries via SearXNG."""
    posts = []
    # Rotate through queries
    idx = int(time.time() / SCRAPE_INTERVAL) % len(queries)
    query = queries[idx]
    
    try:
        url = f"{SEARXNG_URL}?q={urllib.parse.quote(query)}&format=json&time_range=week"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        
        for r in data.get("results", [])[:8]:
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
                    "source": query_set_name,
                    "title": title,
                    "text": content[:500],
                    "url": r.get("url", ""),
                    "tickers": list(tickers),
                    "scraped_at": datetime.now().isoformat(),
                })
        
        log(f"{query_set_name}: {len(posts)} new posts")
    except Exception as e:
        log(f"{query_set_name} error: {e}")
    
    return posts

# Source definitions
SOURCES = {
    "reddit": [
        "site:reddit.com/r/ASX_Bets ASX stock",
        "site:reddit.com/r/AusFinance ASX investment",
        "site:reddit.com/r/ASX_Bets rocket",
        "site:reddit.com/r/AusFinance dividend ASX",
        "site:reddit.com ASX penny stock mining",
    ],
    "livewire": [
        "site:livewiremarkets.com ASX stock",
        "site:livewiremarkets.com small cap ASX",
        "site:livewiremarkets.com buy sell ASX",
    ],
    "stockhead": [
        "site:stockhead.com.au ASX",
        "site:stockhead.com.au small cap penny",
        "site:stockhead.com.au mining gold lithium",
        "site:stockhead.com.au biotech ASX",
    ],
    "smallcaps": [
        "site:smallcaps.com.au ASX",
        "site:smallcaps.com.au mining exploration",
        "site:smallcaps.com.au IPO listing ASX",
    ],
    "motleyfool": [
        "site:motleyfool.com.au ASX shares buy",
        "site:motleyfool.com.au ASX stock pick",
    ],
}

def load_sentiment_db():
    """Load shared sentiment database (shared with scraper 1)."""
    if SENTIMENT_PATH.exists():
        try:
            return json.loads(SENTIMENT_PATH.read_text())
        except:
            return {"posts": [], "aggregates": {}, "last_updated": None}
    return {"posts": [], "aggregates": {}, "last_updated": None}

def save_sentiment_db(db):
    """Save with aggregates (shared file — append-safe)."""
    db["last_updated"] = datetime.now().isoformat()
    
    cutoff = (datetime.now() - timedelta(days=7)).isoformat()
    db["posts"] = [p for p in db["posts"] if p.get("analyzed_at", "") > cutoff]
    
    ticker_data = defaultdict(lambda: {"bullish": 0, "bearish": 0, "neutral": 0, "total": 0, "posts": []})
    for post in db["posts"]:
        for ticker in post.get("tickers", []):
            s = post.get("sentiment", "neutral")
            ticker_data[ticker][s] += 1
            ticker_data[ticker]["total"] += 1
            if len(ticker_data[ticker]["posts"]) < 5:
                ticker_data[ticker]["posts"].append({
                    "source": post["source"],
                    "summary": post.get("summary", ""),
                    "sentiment": s,
                    "date": post.get("analyzed_at", "")[:10],
                })
    
    aggregates = {}
    for ticker, data in ticker_data.items():
        total = data["total"]
        if total > 0:
            score = (data["bullish"] - data["bearish"]) / total
            aggregates[ticker] = {
                "score": round(score, 2),
                "bullish": data["bullish"],
                "bearish": data["bearish"],
                "neutral": data["neutral"],
                "total": total,
                "label": "Bullish" if score > 0.2 else ("Bearish" if score < -0.2 else "Mixed"),
                "recentPosts": data["posts"][-5:],
            }
    
    db["aggregates"] = aggregates
    SENTIMENT_PATH.write_text(json.dumps(db, indent=2))

def analyze_posts(posts):
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

def main():
    global running
    log("🔥 Sentiment Scraper #2 starting (Reddit/Livewire/Stockhead/SmallCaps)")
    log(f"   Model: {OLLAMA_MODEL} (local)")
    log(f"   Scrape interval: {SCRAPE_INTERVAL}s")
    
    db = load_sentiment_db()
    log(f"   Existing posts in shared DB: {len(db.get('posts', []))}")
    
    source_names = list(SOURCES.keys())
    cycle = 0
    last_save = 0
    
    while running:
        now = time.time()
        
        # Rotate through sources each cycle
        source_name = source_names[cycle % len(source_names)]
        queries = SOURCES[source_name]
        
        posts = scrape_source(source_name, queries)
        if posts:
            analyzed = analyze_posts(posts)
            # Reload DB before appending (scraper 1 may have written)
            db = load_sentiment_db()
            db["posts"].extend(analyzed)
        
        if now - last_save >= SAVE_INTERVAL:
            save_sentiment_db(db)
            log(f"💾 Saved: {len(db['posts'])} posts, {len(db.get('aggregates', {}))} tickers")
            last_save = now
        
        cycle += 1
        time.sleep(15)  # Brief pause between source scrapes
    
    save_sentiment_db(db)
    log("Scraper #2 shut down cleanly.")

if __name__ == "__main__":
    main()
