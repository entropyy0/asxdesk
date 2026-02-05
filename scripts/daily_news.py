#!/usr/bin/env python3
"""
ASX Daily News Generator
Scrapes recent ASX news and generates AI summaries for the site.
Outputs to src/data/news.json (JSON, not TypeScript).
Generates 10-15 articles per run, keeps existing articles, caps at 50.

Uses Gemini for news analysis and article generation.
"""

import json, os, sys, time, re, hashlib
from pathlib import Path
from datetime import datetime, timedelta

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "src" / "data"
NEWS_PATH = DATA_DIR / "news.json"
STOCKS_PATH = DATA_DIR / "stocks.json"
ANNOUNCEMENTS_PATH = DATA_DIR / "announcements.json"

sys.path.insert(0, str(Path.home() / "clawd" / "skills" / "ai-council" / "scripts"))
from council import try_gemini_pro, try_gemini_flash25

MAX_ARTICLES = 50


def search_asx_news():
    """Search for recent ASX news using SearXNG."""
    import urllib.request, urllib.parse
    
    queries = [
        "ASX market news today site:asx.com.au OR site:afr.com OR site:smh.com.au",
        "ASX small cap news today",
        "ASX mining announcement today",
        "ASX biotech news today",
        "ASX technology stocks news",
        "ASX energy stocks news",
        "ASX market wrap today",
    ]
    
    all_results = []
    for q in queries:
        try:
            url = f"http://localhost:8888/search?q={urllib.parse.quote(q)}&format=json&time_range=week"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            data = json.loads(resp.read())
            results = data.get("results", [])[:5]
            for r in results:
                all_results.append({
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "content": r.get("content", ""),
                    "date": r.get("publishedDate", ""),
                })
            time.sleep(1)
        except Exception as e:
            print(f"  Search failed for '{q[:40]}...': {e}")
    
    # Deduplicate by URL
    seen = set()
    unique = []
    for r in all_results:
        if r["url"] not in seen:
            seen.add(r["url"])
            unique.append(r)
    
    return unique


def get_big_movers():
    """Get stocks with >5% daily change for stock-specific articles."""
    if not STOCKS_PATH.exists():
        return []
    
    try:
        stocks = json.loads(STOCKS_PATH.read_text())
        movers = []
        for s in stocks:
            change = s.get("dailyChange", 0)
            if change and abs(change) > 5:
                movers.append({
                    "ticker": s["ticker"],
                    "name": s["name"],
                    "sector": s["sector"],
                    "price": s.get("price", 0),
                    "change": change,
                    "marketCap": s.get("marketCap", "N/A"),
                })
        # Sort by absolute change, take top 10
        movers.sort(key=lambda x: abs(x.get("change", 0)), reverse=True)
        return movers[:10]
    except:
        return []


def get_recent_announcements():
    """Get recent price-sensitive announcements for summary article."""
    if not ANNOUNCEMENTS_PATH.exists():
        return []
    
    try:
        db = json.loads(ANNOUNCEMENTS_PATH.read_text())
        announcements = db.get("announcements", [])
        # Get price-sensitive announcements from last 2 days
        cutoff = (datetime.now() - timedelta(days=2)).isoformat()
        recent = [
            a for a in announcements
            if a.get("priceSensitive") and a.get("date", "") > cutoff
        ]
        recent.sort(key=lambda x: x.get("date", ""), reverse=True)
        return recent[:15]
    except:
        return []


def get_sector_data():
    """Get sector-level performance data."""
    if not STOCKS_PATH.exists():
        return {}
    
    try:
        stocks = json.loads(STOCKS_PATH.read_text())
        sectors = {}
        for s in stocks:
            sector = s.get("sector", "Other")
            if sector not in sectors:
                sectors[sector] = {"count": 0, "total_change": 0, "names": []}
            sectors[sector]["count"] += 1
            sectors[sector]["total_change"] += s.get("dailyChange", 0) or 0
            if s.get("dailyChange") and abs(s["dailyChange"]) > 3:
                sectors[sector]["names"].append(f"{s['ticker']} ({s['dailyChange']:+.1f}%)")
        
        # Calculate avg change per sector
        for sector in sectors:
            count = sectors[sector]["count"]
            sectors[sector]["avg_change"] = sectors[sector]["total_change"] / count if count > 0 else 0
        
        return sectors
    except:
        return {}


def generate_morning_briefing(search_results, sector_data, movers):
    """Generate the daily morning briefing article."""
    today = datetime.now().strftime("%Y-%m-%d")
    today_display = datetime.now().strftime("%b %d, %Y")
    
    news_digest = "\n".join([
        f"- {r['title']}: {r['content'][:150]}"
        for r in search_results[:10]
    ])
    
    sector_summary = "\n".join([
        f"- {sector}: avg {data['avg_change']:+.1f}% ({data['count']} stocks)"
        for sector, data in sorted(sector_data.items(), key=lambda x: abs(x[1].get('avg_change', 0)), reverse=True)[:6]
    ])
    
    mover_summary = "\n".join([
        f"- {m['ticker']} ({m['name']}): {m['change']:+.1f}%"
        for m in movers[:5]
    ])
    
    prompt = f"""Write a morning market briefing article for an ASX stock research website. Today is {today_display}.
Return ONLY a valid JSON object with these fields:
{{
  "slug": "asx-morning-briefing-{today}",
  "title": "Headline for today's briefing",
  "excerpt": "2 sentence summary",
  "date": "{today_display}",
  "category": "Market Brief",
  "content": ["Paragraph 1...", "Paragraph 2...", "Paragraph 3...", "Paragraph 4..."]
}}

Context:
Recent news headlines:
{news_digest}

Sector performance:
{sector_summary}

Biggest movers:
{mover_summary}

Write 4 paragraphs covering: market open/mood, sector highlights, key movers, themes for the day.
Reference actual ASX tickers. Keep it factual and balanced. Australian English.
Return ONLY the JSON object."""

    result = try_gemini_flash25(prompt)
    if not result:
        result = try_gemini_pro(prompt)
    return _parse_json_article(result)


def generate_stock_articles(movers):
    """Generate articles for stocks with big moves."""
    if not movers:
        return []
    
    today_display = datetime.now().strftime("%b %d, %Y")
    today = datetime.now().strftime("%Y-%m-%d")
    articles = []
    
    # Take top 5 movers, generate articles for them
    for mover in movers[:5]:
        direction = "surges" if mover["change"] > 0 else "drops"
        
        prompt = f"""Write a stock-specific news article about {mover['ticker']} ({mover['name']}) which {direction} {abs(mover['change']):.1f}% today.
Return ONLY a valid JSON object:
{{
  "slug": "{mover['ticker'].lower()}-{direction}-{today}",
  "title": "Headline about {mover['ticker']} price move",
  "excerpt": "2 sentence summary",
  "date": "{today_display}",
  "category": "Stock Spotlight",
  "content": ["Paragraph 1...", "Paragraph 2...", "Paragraph 3..."]
}}

Stock: {mover['ticker']} ({mover['name']})
Sector: {mover['sector']}
Price: ${mover['price']:.2f}
Daily change: {mover['change']:+.1f}%
Market cap: {mover['marketCap']}

Write 3 paragraphs: what happened, context/sector, outlook. Reference ASX tickers. Factual and balanced.
Return ONLY the JSON object."""

        result = try_gemini_flash25(prompt)
        if not result:
            result = try_gemini_pro(prompt)
        article = _parse_json_article(result)
        if article:
            articles.append(article)
            time.sleep(2)
    
    return articles


def generate_sector_roundups(sector_data, search_results):
    """Generate 2-3 sector roundup articles."""
    today_display = datetime.now().strftime("%b %d, %Y")
    today = datetime.now().strftime("%Y-%m-%d")
    articles = []
    
    # Pick top 3 sectors by absolute movement
    top_sectors = sorted(
        sector_data.items(),
        key=lambda x: abs(x[1].get("avg_change", 0)),
        reverse=True
    )[:3]
    
    news_digest = "\n".join([
        f"- {r['title']}: {r['content'][:100]}"
        for r in search_results[:8]
    ])
    
    for sector, data in top_sectors:
        slug_sector = sector.lower().replace(" ", "-")
        movers_text = ", ".join(data.get("names", [])[:5]) or "no major individual movers"
        
        prompt = f"""Write a sector roundup article for the {sector} sector on the ASX.
Return ONLY a valid JSON object:
{{
  "slug": "{slug_sector}-sector-roundup-{today}",
  "title": "Sector headline for {sector}",
  "excerpt": "2 sentence summary",
  "date": "{today_display}",
  "category": "Sector Analysis",
  "content": ["Paragraph 1...", "Paragraph 2...", "Paragraph 3..."]
}}

Sector: {sector}
Average daily change: {data['avg_change']:+.1f}%
Stock count: {data['count']}
Notable movers: {movers_text}

Recent news context:
{news_digest}

Write 3 paragraphs covering: sector performance, key drivers, outlook. Reference actual ASX tickers.
Return ONLY the JSON object."""

        result = try_gemini_flash25(prompt)
        if not result:
            result = try_gemini_pro(prompt)
        article = _parse_json_article(result)
        if article:
            articles.append(article)
            time.sleep(2)
    
    return articles


def generate_announcement_summary(announcements):
    """Generate a summary article of recent price-sensitive announcements."""
    if not announcements:
        return None
    
    today_display = datetime.now().strftime("%b %d, %Y")
    today = datetime.now().strftime("%Y-%m-%d")
    
    ann_text = "\n".join([
        f"- {a['ticker']}: {a['headline']} ({a.get('category', 'General')})"
        for a in announcements[:12]
    ])
    
    prompt = f"""Write a summary article covering the latest price-sensitive ASX announcements.
Return ONLY a valid JSON object:
{{
  "slug": "asx-announcements-summary-{today}",
  "title": "Headline about today's key announcements",
  "excerpt": "2 sentence summary",
  "date": "{today_display}",
  "category": "Announcements",
  "content": ["Paragraph 1...", "Paragraph 2...", "Paragraph 3...", "Paragraph 4..."]
}}

Recent price-sensitive announcements:
{ann_text}

Write 3-4 paragraphs: highlights, themes/categories, what to watch. Reference actual ASX tickers.
Return ONLY the JSON object."""

    result = try_gemini_flash25(prompt)
    if not result:
        result = try_gemini_pro(prompt)
    return _parse_json_article(result)


def _parse_json_article(text):
    """Parse a JSON article from AI response text."""
    if not text:
        return None
    
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if "```" in text:
            text = text[:text.rfind("```")]
    text = text.strip()
    
    if not text.startswith("{"):
        start = text.find("{")
        if start >= 0:
            text = text[start:]
    if not text.endswith("}"):
        end = text.rfind("}")
        if end >= 0:
            text = text[:end + 1]
    
    try:
        article = json.loads(text)
        # Validate required fields
        required = ["slug", "title", "excerpt", "date", "category", "content"]
        if all(k in article for k in required) and isinstance(article["content"], list):
            return article
        print(f"  ⚠️ Article missing required fields: {[k for k in required if k not in article]}")
        return None
    except json.JSONDecodeError as e:
        print(f"  ⚠️ JSON parse error: {e}")
        return None


def main():
    print(f"[{datetime.now().isoformat()}] Starting daily news generation...")
    
    # Load existing articles
    existing_articles = []
    if NEWS_PATH.exists():
        try:
            existing_articles = json.loads(NEWS_PATH.read_text())
            if not isinstance(existing_articles, list):
                existing_articles = []
        except:
            existing_articles = []
    
    existing_slugs = {a["slug"] for a in existing_articles}
    print(f"Existing articles: {len(existing_articles)}")
    
    # Gather context data
    print("Searching for recent ASX news...")
    search_results = search_asx_news()
    print(f"Found {len(search_results)} unique news items")
    
    print("Getting big movers...")
    movers = get_big_movers()
    print(f"Found {len(movers)} stocks with >5% moves")
    
    print("Getting sector data...")
    sector_data = get_sector_data()
    print(f"Got data for {len(sector_data)} sectors")
    
    print("Getting recent announcements...")
    announcements = get_recent_announcements()
    print(f"Found {len(announcements)} recent price-sensitive announcements")
    
    new_articles = []
    
    # 1. Morning Briefing
    print("\n[1/4] Generating morning briefing...")
    briefing = generate_morning_briefing(search_results, sector_data, movers)
    if briefing and briefing["slug"] not in existing_slugs:
        new_articles.append(briefing)
        print(f"  ✅ {briefing['title']}")
    elif briefing:
        print(f"  ⏭️ Already exists: {briefing['slug']}")
    else:
        print("  ❌ Failed to generate morning briefing")
    
    # 2. Stock-specific articles
    print("\n[2/4] Generating stock articles...")
    stock_articles = generate_stock_articles(movers)
    for article in stock_articles:
        if article["slug"] not in existing_slugs:
            new_articles.append(article)
            print(f"  ✅ {article['title']}")
    print(f"  Generated {len(stock_articles)} stock articles")
    
    # 3. Sector roundups
    print("\n[3/4] Generating sector roundups...")
    sector_articles = generate_sector_roundups(sector_data, search_results)
    for article in sector_articles:
        if article["slug"] not in existing_slugs:
            new_articles.append(article)
            print(f"  ✅ {article['title']}")
    print(f"  Generated {len(sector_articles)} sector articles")
    
    # 4. Announcement summary
    print("\n[4/4] Generating announcement summary...")
    ann_article = generate_announcement_summary(announcements)
    if ann_article and ann_article["slug"] not in existing_slugs:
        new_articles.append(ann_article)
        print(f"  ✅ {ann_article['title']}")
    elif ann_article:
        print(f"  ⏭️ Already exists: {ann_article['slug']}")
    else:
        print("  ❌ Failed to generate (or no announcements)")
    
    # Combine: new articles first, then existing
    all_articles = new_articles + existing_articles
    
    # Cap at MAX_ARTICLES (remove oldest)
    if len(all_articles) > MAX_ARTICLES:
        all_articles = all_articles[:MAX_ARTICLES]
    
    # Save
    NEWS_PATH.write_text(json.dumps(all_articles, indent=2))
    print(f"\n✅ Saved {len(all_articles)} total articles ({len(new_articles)} new)")


if __name__ == "__main__":
    main()
