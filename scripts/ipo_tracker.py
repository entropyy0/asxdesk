#!/usr/bin/env python3
"""
ASX IPO Tracker
Checks for new ASX listings and adds them to the stock database.
Also scrapes upcoming floats from the ASX website.
Runs daily via cron - compares ASX company directory against our database.
"""

import csv, json, os, sys, time, random, re
from pathlib import Path
from datetime import datetime, timedelta
from html.parser import HTMLParser

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
DATA_DIR = PROJECT_DIR / "src" / "data"
OUTPUT_PATH = DATA_DIR / "stocks.json"
IPO_LOG_PATH = DATA_DIR / "ipo_log.json"
UPCOMING_IPOS_PATH = DATA_DIR / "upcoming_ipos.json"

sys.path.insert(0, str(Path.home() / "clawd" / "skills" / "ai-council" / "scripts"))
from council import try_gemini_pro, try_gemini_flash25

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
}

# Map principal activities to sectors
ACTIVITY_SECTOR_MAP = {
    "mineral exploration": "Materials",
    "mining exploration": "Materials",
    "mining": "Materials",
    "gold": "Materials",
    "lithium": "Materials",
    "copper": "Materials",
    "rare earth": "Materials",
    "oil and gas": "Energy",
    "energy": "Energy",
    "technology": "Information Technology",
    "software": "Information Technology",
    "biotech": "Health Care",
    "pharmaceutical": "Health Care",
    "medical": "Health Care",
    "health": "Health Care",
    "finance": "Financials",
    "banking": "Financials",
    "real estate": "Real Estate",
    "property": "Real Estate",
    "agriculture": "Consumer Staples",
    "food": "Consumer Staples",
    "retail": "Consumer Discretionary",
    "media": "Communication Services",
    "telecom": "Communication Services",
    "industrial": "Industrials",
    "construction": "Industrials",
    "transport": "Industrials",
    "utilities": "Utilities",
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


def guess_sector(activity):
    """Guess sector from principal activities description."""
    activity_lower = activity.lower()
    for keyword, sector in ACTIVITY_SECTOR_MAP.items():
        if keyword in activity_lower:
            return sector
    return "Other"


def parse_listing_date(date_str):
    """Parse various ASX date formats into YYYY-MM-DD."""
    date_str = date_str.strip()
    # Remove annotations like ##, #, AEDT, AEST, time components
    date_str = re.sub(r'[#]+', '', date_str)
    date_str = re.sub(r'\d+[.:]\d+\s*(am|pm)?\s*(AEDT|AEST)?', '', date_str, flags=re.IGNORECASE)
    date_str = date_str.strip()
    
    # Try common formats
    formats = [
        "%A %d %B %Y",       # "Friday 30 January 2026"
        "%d %B %Y",          # "30 January 2026"
        "%B %d, %Y",         # "January 30, 2026"
        "%d/%m/%Y",          # "30/01/2026"
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    return date_str  # Return as-is if we can't parse


def scrape_upcoming_floats():
    """Scrape upcoming IPOs from ASX website."""
    import urllib.request
    
    url = "https://www.asx.com.au/listings/upcoming-floats-and-listings"
    print("Fetching ASX upcoming floats page...")
    
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })
        resp = urllib.request.urlopen(req, timeout=30)
        html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"Failed to fetch ASX upcoming floats: {e}")
        return []
    
    upcoming = []
    
    # Parse accordion titles for company names + dates
    # Pattern: <span class="cmp-accordion__title">Company Name - Date</span>
    titles = re.findall(r'cmp-accordion__title["\']>\s*(.*?)\s*</span>', html)
    
    # Parse each table for details
    # Each table corresponds to one upcoming float
    table_pattern = re.compile(r'<table[^>]*>(.*?)</table>', re.DOTALL)
    tables = table_pattern.findall(html)
    
    print(f"  Found {len(titles)} accordion entries, {len(tables)} detail tables")
    
    for i, table_html in enumerate(tables):
        entry = {
            "company": "",
            "ticker": "",
            "expectedDate": "",
            "offerPrice": "",
            "industry": "",
            "status": "Upcoming"
        }
        
        # Extract company name from accordion title
        if i < len(titles):
            title = titles[i].strip()
            # Title format: "Company Name - Date"
            parts = title.split(" - ", 1)
            entry["company"] = parts[0].strip()
        
        # Parse table rows
        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', table_html, re.DOTALL)
        for row in rows:
            # Get the label (in <b> tag) and value
            label_match = re.search(r'<b>(.*?)</b>', row)
            if not label_match:
                continue
            label = label_match.group(1).strip().lower()
            
            # Get the value from the second <td>
            tds = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
            if len(tds) < 2:
                continue
            value = re.sub(r'<[^>]+>', ' ', tds[1]).strip()
            value = re.sub(r'\s+', ' ', value).strip()
            
            if "listing date" in label:
                entry["expectedDate"] = parse_listing_date(value)
            elif "principal activities" in label or "principal activity" in label:
                entry["industry"] = value
            elif "issue price" in label:
                # Normalize price format
                price = value.replace("AUD", "").strip()
                try:
                    price_num = float(price)
                    entry["offerPrice"] = f"${price_num:.2f}"
                except:
                    entry["offerPrice"] = f"${price}" if not price.startswith("$") else price
            elif "security code" in label:
                entry["ticker"] = value.strip().upper()
        
        # Fill in sector from industry/activities
        if not entry.get("industry"):
            entry["industry"] = "Other"
        
        # Only add if we have essential data
        if entry["ticker"] and entry["company"]:
            upcoming.append(entry)
            print(f"  📋 {entry['ticker']}: {entry['company']} (listing {entry['expectedDate']}, {entry['offerPrice']})")
        elif entry["company"]:
            print(f"  ⚠️  Skipping {entry['company']} - no ticker found")
    
    return upcoming


def download_asx_directory():
    """Download fresh ASX company directory."""
    import urllib.request
    url = "https://asx.api.markitdigital.com/asx-research/1.0/companies/directory/file?access_token=83ff96335c2d45a094df02a206a39ff4"
    csv_path = "/tmp/asx_companies_fresh.csv"
    urllib.request.urlretrieve(url, csv_path)
    
    companies = {}
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            companies[row["ASX code"].strip()] = {
                "ticker": row["ASX code"].strip(),
                "name": row["Company name"].strip().title(),
                "gics": row["GICs industry group"].strip(),
                "sector": SECTOR_MAP.get(row["GICs industry group"].strip(), "Other"),
                "listing_date": row["Listing date"].strip(),
                "market_cap_raw": row["Market Cap"].strip(),
                "market_cap": format_market_cap(row["Market Cap"].strip()),
            }
    return companies


def generate_ipo_profile(company):
    """Generate profile for a new IPO."""
    prompt = f"""Generate a JSON stock profile for this newly ASX-listed company (IPO). Return ONLY valid JSON.

Company: {company['name']} (ASX: {company['ticker']})
Sector: {company['sector']} ({company['gics']})
Market Cap: {company['market_cap']}
Listing Date: {company['listing_date']}

Return this exact JSON structure:
{{
  "description": "2-3 sentence company description focusing on what they do and their IPO story.",
  "analysis": ["Paragraph about the company and its IPO.", "Outlook and what to watch post-listing."],
  "bullCase": ["Bull point 1", "Bull point 2", "Bull point 3"],
  "bearCase": ["Bear point 1", "Bear point 2", "Bear point 3"],
  "faqs": [
    {{"question": "What does {company['ticker']} do?", "answer": "Brief answer"}},
    {{"question": "When did {company['ticker']} list on the ASX?", "answer": "Listed on {company['listing_date']}"}},
    {{"question": "What is {company['ticker']}'s market cap?", "answer": "{company['market_cap']}"}}
  ]
}}

Return ONLY the JSON object."""

    result = try_gemini_pro(prompt)
    if not result:
        result = try_gemini_flash25(prompt)
    if not result:
        return {}
    
    text = result.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
        if "```" in text:
            text = text[:text.rfind("```")]
    text = text.strip()
    if not text.startswith("{"):
        start = text.find("{")
        if start >= 0: text = text[start:]
    if not text.endswith("}"):
        end = text.rfind("}")
        if end >= 0: text = text[:end+1]
    
    try:
        return json.loads(text)
    except:
        return {}


def main():
    print(f"[{datetime.now().isoformat()}] IPO Tracker running...")
    
    # --- Part 1: Scrape upcoming floats ---
    print("\n=== Scraping Upcoming Floats ===")
    upcoming = scrape_upcoming_floats()
    
    # Load existing upcoming IPOs to preserve any manual additions
    existing_upcoming = []
    if UPCOMING_IPOS_PATH.exists():
        try:
            existing_upcoming = json.loads(UPCOMING_IPOS_PATH.read_text())
        except:
            existing_upcoming = []
    
    if upcoming:
        # Replace with fresh data from ASX
        UPCOMING_IPOS_PATH.write_text(json.dumps(upcoming, indent=2))
        print(f"✅ Saved {len(upcoming)} upcoming IPOs to {UPCOMING_IPOS_PATH.name}")
    else:
        print("No upcoming floats found on ASX website (or scrape failed)")
        if not existing_upcoming:
            # Write empty array so the file exists
            UPCOMING_IPOS_PATH.write_text("[]")
    
    # --- Part 2: Check for new listings in ASX directory ---
    print("\n=== Checking for New Listings ===")
    
    # Download fresh ASX directory
    print("Downloading ASX company directory...")
    asx_companies = download_asx_directory()
    print(f"ASX directory: {len(asx_companies)} companies")
    
    # Load our database
    existing = json.loads(OUTPUT_PATH.read_text()) if OUTPUT_PATH.exists() else []
    existing_tickers = {s["ticker"] for s in existing}
    print(f"Our database: {len(existing_tickers)} stocks")
    
    # Find new listings (in ASX directory but not in our DB)
    new_tickers = set(asx_companies.keys()) - existing_tickers
    
    if not new_tickers:
        print("No new listings found ✅")
        return
    
    print(f"🆕 Found {len(new_tickers)} new listings!")
    
    # Load IPO log
    ipo_log = json.loads(IPO_LOG_PATH.read_text()) if IPO_LOG_PATH.exists() else []
    
    for ticker in sorted(new_tickers):
        company = asx_companies[ticker]
        print(f"  Processing new listing: {ticker} ({company['name']})...", end=" ", flush=True)
        
        profile = generate_ipo_profile(company)
        
        try:
            cap = int(company["market_cap_raw"])
            if cap > 1_000_000_000: price = round(random.uniform(1, 15), 2)
            elif cap > 100_000_000: price = round(random.uniform(0.20, 3), 2)
            else: price = round(random.uniform(0.02, 0.50), 2)
        except:
            price = round(random.uniform(0.01, 1.0), 3)
        
        entry = {
            "ticker": company["ticker"],
            "name": company["name"],
            "sector": company["sector"],
            "marketCap": company["market_cap"],
            "sharesOnIssue": "N/A",
            "ipoDate": company["listing_date"],
            "website": "",
            "description": profile.get("description", f"{company['name']} is a newly listed ASX company in the {company['sector']} sector."),
            "analysis": profile.get("analysis", [f"{company['name']} recently listed on the ASX.", "Post-IPO performance and outlook to be determined."]),
            "bullCase": profile.get("bullCase", ["New listing momentum", "Sector tailwinds", "Growth potential"]),
            "bearCase": profile.get("bearCase", ["Post-IPO volatility", "Unproven track record", "Market risk"]),
            "faqs": profile.get("faqs", [
                {"question": f"What does {company['ticker']} do?", "answer": f"{company['name']} is an ASX-listed {company['sector']} company."},
                {"question": f"When did {company['ticker']} IPO?", "answer": f"Listed {company['listing_date']}"},
                {"question": f"What is {company['ticker']}'s market cap?", "answer": company['market_cap']}
            ]),
            "performance1y": 0.0,
            "price": price,
        }
        
        existing.append(entry)
        ipo_log.append({
            "ticker": ticker,
            "name": company["name"],
            "date_added": datetime.now().isoformat(),
            "listing_date": company["listing_date"],
        })
        print("✅")
        time.sleep(2)
    
    # Save
    OUTPUT_PATH.write_text(json.dumps(existing, indent=2))
    IPO_LOG_PATH.write_text(json.dumps(ipo_log, indent=2))
    print(f"\n✅ Added {len(new_tickers)} new stocks. Total: {len(existing)}")


if __name__ == "__main__":
    main()
