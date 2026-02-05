#!/usr/bin/env python3
"""
ASX Weekly Analysis Refresh
Regenerates AI analysis text for stocks using Gemini.
Focuses on top 200 stocks by market cap to save API calls.
Saves progress every 20 stocks.

Run weekly via scripts/weekly_update.sh
"""

import json, sys, time, re
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "src" / "data"
STOCKS_PATH = DATA_DIR / "stocks.json"
ANNOUNCEMENTS_PATH = DATA_DIR / "announcements.json"
PROGRESS_PATH = DATA_DIR / "generation_progress.json"

sys.path.insert(0, str(Path.home() / "clawd" / "skills" / "ai-council" / "scripts"))
from council import try_gemini_pro, try_gemini_flash25


def parse_market_cap(cap_str):
    """Parse market cap string like 'A$266.1B' into a numeric value for sorting."""
    if not cap_str or cap_str == "N/A":
        return 0
    try:
        cap_str = cap_str.replace("A$", "").replace("$", "").strip()
        if cap_str.endswith("B"):
            return float(cap_str[:-1]) * 1_000_000_000
        elif cap_str.endswith("M"):
            return float(cap_str[:-1]) * 1_000_000
        elif cap_str.endswith("K"):
            return float(cap_str[:-1]) * 1_000
        else:
            return float(cap_str)
    except:
        return 0


def get_announcements_for_ticker(ticker, announcements_db):
    """Get recent announcements for a specific ticker."""
    by_ticker = announcements_db.get("by_ticker", {})
    anns = by_ticker.get(ticker, [])
    if not anns:
        return ""
    
    lines = []
    for a in anns[:5]:
        ps = " [Price Sensitive]" if a.get("priceSensitive") else ""
        lines.append(f"- {a.get('date', 'N/A')}: {a.get('headline', 'N/A')}{ps}")
    return "\n".join(lines)


def get_market_cap_tier(cap_str):
    """Categorize market cap into tiers."""
    cap = parse_market_cap(cap_str)
    if cap >= 10_000_000_000:
        return "Large Cap (>A$10B)"
    elif cap >= 2_000_000_000:
        return "Mid Cap (A$2B–10B)"
    elif cap >= 300_000_000:
        return "Small Cap (A$300M–2B)"
    elif cap >= 50_000_000:
        return "Micro Cap (A$50M–300M)"
    else:
        return "Nano Cap (<A$50M)"


def generate_analysis(stock, announcements_text):
    """Generate fresh analysis for a stock using Gemini."""
    ticker = stock["ticker"]
    name = stock["name"]
    sector = stock["sector"]
    price = stock.get("price", 0)
    performance = stock.get("performance1y", 0)
    market_cap = stock.get("marketCap", "N/A")
    cap_tier = get_market_cap_tier(market_cap)
    
    ann_section = ""
    if announcements_text:
        ann_section = f"""
Recent Announcements:
{announcements_text}
"""
    
    prompt = f"""Generate a fresh stock analysis for an ASX company profile page. Return ONLY valid JSON.

Company: {name} (ASX: {ticker})
Sector: {sector}
Market Cap: {market_cap} ({cap_tier})
Current Price: A${price:.2f}
1-Year Performance: {performance:+.1f}%
{ann_section}
Return this JSON structure:
{{
  "description": "2-3 sentence description of what the company does, its market position, and key business.",
  "analysis": ["First paragraph: company overview, recent performance, and business fundamentals.", "Second paragraph: sector context, competitive position, and key drivers.", "Third paragraph: outlook, catalysts, and what investors should watch."]
}}

Guidelines:
- Be specific to THIS company, not generic
- Reference the actual price and performance data
- Mention sector-relevant factors
- For {cap_tier} stocks, note appropriate risk considerations
- If announcements are provided, reference relevant ones
- Australian English, professional tone
- Each analysis paragraph should be 3-5 sentences
- Return ONLY the JSON object"""

    result = try_gemini_flash25(prompt)
    if not result:
        result = try_gemini_pro(prompt)
    
    if not result:
        return None
    
    text = result.strip()
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
        data = json.loads(text)
        desc = data.get("description", "")
        analysis = data.get("analysis", [])
        
        if desc and isinstance(analysis, list) and len(analysis) >= 2:
            return {"description": desc, "analysis": analysis}
    except json.JSONDecodeError:
        pass
    
    return None


def load_progress():
    """Load progress tracking file."""
    if PROGRESS_PATH.exists():
        try:
            return json.loads(PROGRESS_PATH.read_text())
        except:
            pass
    return {"last_run": None, "completed_tickers": [], "run_id": None}


def save_progress(progress):
    """Save progress tracking file."""
    PROGRESS_PATH.write_text(json.dumps(progress, indent=2))


def main():
    print(f"[{datetime.now().isoformat()}] Weekly Analysis Refresh starting...")
    
    # Load stocks
    if not STOCKS_PATH.exists():
        print("❌ stocks.json not found")
        sys.exit(1)
    
    stocks = json.loads(STOCKS_PATH.read_text())
    print(f"Loaded {len(stocks)} stocks")
    
    # Sort by market cap, take top 200
    stocks_with_cap = [(s, parse_market_cap(s.get("marketCap", "N/A"))) for s in stocks]
    stocks_with_cap.sort(key=lambda x: x[1], reverse=True)
    top_stocks = [s for s, _ in stocks_with_cap[:200]]
    top_tickers = {s["ticker"] for s in top_stocks}
    
    print(f"Processing top {len(top_stocks)} stocks by market cap")
    
    # Load announcements
    announcements_db = {}
    if ANNOUNCEMENTS_PATH.exists():
        try:
            announcements_db = json.loads(ANNOUNCEMENTS_PATH.read_text())
        except:
            pass
    
    # Load progress (resume from where we left off if interrupted)
    progress = load_progress()
    run_id = datetime.now().strftime("%Y%m%d")
    
    if progress.get("run_id") == run_id:
        completed = set(progress.get("completed_tickers", []))
        print(f"Resuming run {run_id}: {len(completed)} already completed")
    else:
        completed = set()
        progress = {"last_run": None, "completed_tickers": [], "run_id": run_id}
    
    # Build a ticker -> index map for updating
    ticker_to_idx = {s["ticker"]: i for i, s in enumerate(stocks)}
    
    updated = 0
    failed = 0
    skipped = 0
    
    for i, stock in enumerate(top_stocks):
        ticker = stock["ticker"]
        
        if ticker in completed:
            skipped += 1
            continue
        
        print(f"  [{i+1}/{len(top_stocks)}] {ticker} ({stock['name']})...", end=" ", flush=True)
        
        ann_text = get_announcements_for_ticker(ticker, announcements_db)
        result = generate_analysis(stock, ann_text)
        
        if result:
            idx = ticker_to_idx.get(ticker)
            if idx is not None:
                stocks[idx]["description"] = result["description"]
                stocks[idx]["analysis"] = result["analysis"]
                updated += 1
                print("✅")
            else:
                print("⚠️ ticker not found in index")
        else:
            failed += 1
            print("❌")
        
        completed.add(ticker)
        progress["completed_tickers"] = list(completed)
        
        # Save progress every 20 stocks
        if (updated + failed) % 20 == 0 and (updated + failed) > 0:
            STOCKS_PATH.write_text(json.dumps(stocks, indent=2))
            save_progress(progress)
            print(f"  💾 Progress saved ({updated} updated, {failed} failed, {skipped} skipped)")
        
        # Rate limit
        time.sleep(2)
    
    # Final save
    STOCKS_PATH.write_text(json.dumps(stocks, indent=2))
    progress["last_run"] = datetime.now().isoformat()
    save_progress(progress)
    
    print(f"\n✅ Analysis refresh complete:")
    print(f"   Updated: {updated}")
    print(f"   Failed: {failed}")
    print(f"   Skipped (already done): {skipped}")
    print(f"   Total stocks: {len(stocks)}")


if __name__ == "__main__":
    main()
