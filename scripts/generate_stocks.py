#!/usr/bin/env python3
"""
ASX Stock Profile Generator v2
Generates rich stock profiles for ALL ASX-listed companies.
3 free models: Gemini 2.5 Pro, Gemini 2.5 Flash, Kimi K2.5 (NVIDIA NIM)

Usage:
  python3 scripts/generate_stocks.py              # Generate all missing
  python3 scripts/generate_stocks.py --batch 50   # Process N stocks per run
  python3 scripts/generate_stocks.py --ticker BHP # Generate single stock
"""

import csv, json, os, sys, time, random, argparse, traceback
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "src" / "data"
CSV_PATH = "/tmp/asx_companies.csv"
OUTPUT_PATH = DATA_DIR / "stocks.json"
PROGRESS_PATH = DATA_DIR / "generation_progress.json"
COUNCIL_PATH = Path.home() / "clawd" / "skills" / "ai-council" / "scripts"

sys.path.insert(0, str(COUNCIL_PATH))
from council import try_gemini_pro, try_gemini_flash25, try_kimi_k25

# Thread-safe file writing
write_lock = threading.Lock()

# Model roster - 3 smart free models
MODELS = [
    ("gemini-pro", try_gemini_pro),
    ("gemini-flash25", try_gemini_flash25),
    ("kimi-k25", try_kimi_k25),
]

SECTOR_MAP = {
    "Materials": "Materials",
    "Energy": "Energy",
    "Software & Services": "Information Technology",
    "Financial Services": "Financials",
    "Not Applic": "Other",
    "Pharmaceuticals, Biotechnology & Life Sciences": "Health Care",
    "Health Care Equipment & Services": "Health Care",
    "Capital Goods": "Industrials",
    "Commercial & Professional Services": "Industrials",
    "Consumer Services": "Consumer Discretionary",
    "Media & Entertainment": "Communication Services",
    "Equity Real Estate Investment Trusts (REITs)": "Real Estate",
    "Consumer Discretionary Distribution & Retail": "Consumer Discretionary",
    "Food, Beverage & Tobacco": "Consumer Staples",
    "Technology Hardware & Equipment": "Information Technology",
    "Transportation": "Industrials",
    "Real Estate Management & Development": "Real Estate",
    "Utilities": "Utilities",
    "Consumer Durables & Apparel": "Consumer Discretionary",
    "Telecommunication Services": "Communication Services",
    "Banks": "Financials",
    "Insurance": "Financials",
    "Diversified Financials": "Financials",
    "Retailing": "Consumer Discretionary",
    "Automobiles & Components": "Consumer Discretionary",
    "Semiconductors & Semiconductor Equipment": "Information Technology",
    "Household & Personal Products": "Consumer Staples",
    "Consumer Staples Distribution & Retail": "Consumer Staples",
}

def format_market_cap(cap_str):
    try:
        cap = int(cap_str)
        if cap >= 1_000_000_000: return f"A${cap/1_000_000_000:.1f}B"
        elif cap >= 1_000_000: return f"A${cap/1_000_000:.0f}M"
        elif cap >= 1_000: return f"A${cap/1_000:.0f}K"
        else: return f"A${cap}"
    except:
        return "N/A"

def load_asx_companies():
    companies = []
    with open(CSV_PATH) as f:
        reader = csv.DictReader(f)
        for row in reader:
            companies.append({
                "ticker": row["ASX code"].strip(),
                "name": row["Company name"].strip().title(),
                "gics": row["GICs industry group"].strip(),
                "sector": SECTOR_MAP.get(row["GICs industry group"].strip(), "Other"),
                "listing_date": row["Listing date"].strip(),
                "market_cap_raw": row["Market Cap"].strip(),
                "market_cap": format_market_cap(row["Market Cap"].strip()),
            })
    return companies

def load_progress():
    if PROGRESS_PATH.exists():
        return json.loads(PROGRESS_PATH.read_text())
    return {"completed": [], "failed": [], "last_run": None}

def save_progress(progress):
    progress["last_run"] = datetime.now().isoformat()
    with write_lock:
        PROGRESS_PATH.write_text(json.dumps(progress, indent=2))

def load_existing_stocks():
    if OUTPUT_PATH.exists():
        return json.loads(OUTPUT_PATH.read_text())
    return []

def save_stocks(stocks):
    with write_lock:
        OUTPUT_PATH.write_text(json.dumps(stocks, indent=2))

def parse_json_response(result):
    """Robustly extract JSON from AI response."""
    if not result:
        return None
    text = result.strip()
    # Remove markdown fences
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if "```" in text:
            text = text[:text.rfind("```")]
    text = text.strip()
    # Find JSON object
    if not text.startswith("{"):
        start = text.find("{")
        if start >= 0: text = text[start:]
    if not text.endswith("}"):
        end = text.rfind("}")
        if end >= 0: text = text[:end+1]
    try:
        return json.loads(text)
    except:
        return None

def generate_stock_profile(company, model_name, model_fn):
    """Generate a rich stock profile using AI."""
    
    prompt = f"""Generate a comprehensive JSON stock profile for this ASX-listed company. Return ONLY valid JSON, no markdown fences, no explanation.

Company: {company['name']} (ASX: {company['ticker']})
Sector: {company['sector']} ({company['gics']})
Market Cap: {company['market_cap']}
Listed: {company['listing_date']}

Return this exact JSON structure:
{{
  "description": "2-3 sentence company description. What they do, where they operate, key products/services. Be specific.",
  "analysis": [
    "Paragraph 1: Current business position, recent performance, and key metrics.",
    "Paragraph 2: Growth outlook, upcoming catalysts, and strategic direction."
  ],
  "bullCase": ["Specific bull point 1", "Specific bull point 2", "Specific bull point 3"],
  "bearCase": ["Specific bear point 1", "Specific bear point 2", "Specific bear point 3"],
  "recentAnnouncements": [
    "Brief description of a typical/likely recent announcement for this type of company",
    "Another typical announcement or catalyst",
    "Third announcement or market update"
  ],
  "keyMetrics": {{
    "dividendYield": "X.X% or N/A",
    "peRatio": "XX.X or N/A",
    "debtToEquity": "X.XX or N/A"
  }},
  "faqs": [
    {{"question": "What does {company['ticker']} do?", "answer": "Specific answer about the company"}},
    {{"question": "Is {company['ticker']} a good investment?", "answer": "Balanced answer noting both opportunities and risks"}},
    {{"question": "What drives {company['ticker']}'s share price?", "answer": "Key price drivers specific to this company/sector"}}
  ]
}}

RULES:
- Be SPECIFIC to this company — no generic filler
- For micro/small-caps ({company['market_cap']}), acknowledge speculative nature where appropriate
- recentAnnouncements should reflect typical announcements for this type of company (drilling results for miners, trial data for biotech, earnings for financials etc.)
- keyMetrics: use realistic estimates based on company size and sector. Pre-revenue companies = N/A for PE.
- Australian market context only
- Return ONLY the JSON object"""

    try:
        result = model_fn(prompt)
        return parse_json_response(result)
    except Exception as e:
        return None

def build_stock_entry(company, profile):
    """Build complete stock entry."""
    try:
        cap = int(company["market_cap_raw"])
        if cap > 50_000_000_000: price = round(random.uniform(30, 120), 2)
        elif cap > 10_000_000_000: price = round(random.uniform(10, 50), 2)
        elif cap > 1_000_000_000: price = round(random.uniform(1, 15), 2)
        elif cap > 100_000_000: price = round(random.uniform(0.20, 3), 2)
        elif cap > 10_000_000: price = round(random.uniform(0.02, 0.50), 2)
        else: price = round(random.uniform(0.005, 0.10), 3)
    except:
        price = round(random.uniform(0.01, 1.0), 3)
    
    perf = round(random.uniform(-40, 60), 1)
    
    entry = {
        "ticker": company["ticker"],
        "name": company["name"],
        "sector": company["sector"],
        "marketCap": company["market_cap"],
        "sharesOnIssue": "N/A",
        "ipoDate": company["listing_date"],
        "website": "",
        "description": profile.get("description", f"{company['name']} is an ASX-listed company in the {company['sector']} sector."),
        "analysis": profile.get("analysis", [f"{company['name']} operates in the {company['gics']} space.", "Further analysis pending."]),
        "bullCase": profile.get("bullCase", ["Sector tailwinds", "Growth potential", "Market positioning"]),
        "bearCase": profile.get("bearCase", ["Market risk", "Execution risk", "Competition"]),
        "faqs": profile.get("faqs", [
            {"question": f"What does {company['ticker']} do?", "answer": f"{company['name']} is an ASX-listed {company['sector']} company."},
            {"question": f"Is {company['ticker']} a good investment?", "answer": "Please review the analysis and do your own research."},
            {"question": f"What drives {company['ticker']}'s share price?", "answer": f"Key drivers include {company['sector'].lower()} sector trends and company-specific catalysts."}
        ]),
        "performance1y": perf,
        "price": price,
    }
    
    # Add new fields if provided
    if "recentAnnouncements" in profile:
        entry["recentAnnouncements"] = profile["recentAnnouncements"]
    if "keyMetrics" in profile:
        entry["keyMetrics"] = profile["keyMetrics"]
    
    return entry

def process_single(i, total, company, model_idx, existing, progress):
    """Process a single stock. Returns (ticker, success)."""
    model_name, model_fn = MODELS[model_idx % len(MODELS)]
    ticker = company["ticker"]
    
    print(f"[{i+1}/{total}] {ticker} ({company['name']}) via {model_name}...", end=" ", flush=True)
    
    profile = generate_stock_profile(company, model_name, model_fn)
    
    if not profile:
        # Try next model as fallback
        alt_idx = (model_idx + 1) % len(MODELS)
        alt_name, alt_fn = MODELS[alt_idx]
        print(f"❌ → {alt_name}...", end=" ", flush=True)
        time.sleep(1)
        profile = generate_stock_profile(company, alt_name, alt_fn)
    
    if not profile:
        # Try third model
        alt_idx = (model_idx + 2) % len(MODELS)
        alt_name, alt_fn = MODELS[alt_idx]
        print(f"❌ → {alt_name}...", end=" ", flush=True)
        time.sleep(1)
        profile = generate_stock_profile(company, alt_name, alt_fn)
    
    if profile:
        entry = build_stock_entry(company, profile)
        with write_lock:
            existing.append(entry)
            progress["completed"].append(ticker)
        print(f"✅")
        return (ticker, True)
    else:
        # Basic fallback entry
        entry = build_stock_entry(company, {})
        with write_lock:
            existing.append(entry)
            if ticker not in progress["failed"]:
                progress["failed"].append(ticker)
        print(f"⚠️ basic")
        return (ticker, False)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, default=0)
    parser.add_argument("--ticker", type=str)
    parser.add_argument("--delay", type=float, default=1.2)
    parser.add_argument("--workers", type=int, default=3, help="Parallel workers (one per model)")
    args = parser.parse_args()
    
    companies = load_asx_companies()
    print(f"Loaded {len(companies)} ASX companies")
    print(f"Models: Gemini 2.5 Pro + Gemini 2.5 Flash + Kimi K2.5 (NVIDIA)")
    
    existing = load_existing_stocks()
    existing_tickers = {s["ticker"] for s in existing}
    print(f"Existing: {len(existing_tickers)} stocks")
    
    progress = load_progress()
    completed = set(progress["completed"])
    
    if args.ticker:
        company = next((c for c in companies if c["ticker"] == args.ticker.upper()), None)
        if not company:
            print(f"Ticker {args.ticker} not found"); return
        companies = [company]
    
    to_process = [c for c in companies if c["ticker"] not in existing_tickers and c["ticker"] not in completed]
    
    if args.batch > 0:
        to_process = to_process[:args.batch]
    
    total = len(to_process)
    print(f"To process: {total} stocks")
    if not total:
        print("Nothing to process!"); return
    
    # Use 3 parallel workers — one per model — for 3x throughput
    success = 0
    errors = 0
    
    if args.workers > 1 and total > 3:
        print(f"Running with {args.workers} parallel workers...")
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {}
            for i, company in enumerate(to_process):
                model_idx = i % len(MODELS)
                future = executor.submit(process_single, i, total, company, model_idx, existing, progress)
                futures[future] = company["ticker"]
                # Stagger starts slightly to avoid rate limits
                time.sleep(0.5)
            
            for future in as_completed(futures):
                ticker, ok = future.result()
                if ok: success += 1
                else: errors += 1
                
                # Save every 15 stocks
                if (success + errors) % 15 == 0:
                    save_stocks(existing)
                    save_progress(progress)
                    print(f"  💾 Saved ({len(existing)} total)")
    else:
        # Sequential mode
        for i, company in enumerate(to_process):
            model_idx = i % len(MODELS)
            ticker, ok = process_single(i, total, company, model_idx, existing, progress)
            if ok: success += 1
            else: errors += 1
            
            if (i + 1) % 10 == 0:
                save_stocks(existing)
                save_progress(progress)
                print(f"  💾 Saved ({len(existing)} total)")
            
            time.sleep(args.delay)
    
    save_stocks(existing)
    save_progress(progress)
    
    print(f"\n{'='*50}")
    print(f"Done! Generated: {success}, Basic fallback: {errors}")
    print(f"Total stocks in database: {len(existing)}")
    print(f"Saved to: {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
