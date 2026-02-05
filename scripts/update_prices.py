#!/usr/bin/env python3
"""
ASX Price Updater
Fetches real prices, market caps, and daily changes from the ASX API.
Updates stocks.json with accurate data.

Usage:
  python3 scripts/update_prices.py           # Update all stocks
  python3 scripts/update_prices.py --ticker BHP  # Update single stock
"""

import json, time, sys, argparse
import urllib.request
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path("/home/mark/Projects/asx-seobot")
STOCKS_PATH = PROJECT_DIR / "src" / "data" / "stocks.json"
ASX_API = "https://asx.api.markitdigital.com/asx-research/1.0/companies"
ASX_TOKEN = "83ff96335c2d45a094df02a206a39ff4"

def format_market_cap(cap):
    if not cap or cap == 0:
        return "N/A"
    if cap >= 1_000_000_000:
        return f"A${cap/1_000_000_000:.1f}B"
    elif cap >= 1_000_000:
        return f"A${cap/1_000_000:.0f}M"
    elif cap >= 1_000:
        return f"A${cap/1_000:.0f}K"
    return f"A${cap}"

def fetch_price(ticker):
    """Fetch real price data from ASX API (header + key-statistics)."""
    result = {}
    
    # Header endpoint — price, daily change, volume, market cap
    url = f"{ASX_API}/{ticker}/header?access_token={ASX_TOKEN}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        d = data.get("data", {})
        result = {
            "price": d.get("priceLast", 0),
            "change_pct": round(d.get("priceChangePercent", 0), 2),
            "volume": d.get("volume", 0),
            "market_cap": d.get("marketCap", 0),
        }
    except:
        return None
    
    # Key-statistics endpoint — 52wk high/low, PE, dividend yield, EPS
    url2 = f"{ASX_API}/{ticker}/key-statistics?access_token={ASX_TOKEN}"
    try:
        req = urllib.request.Request(url2, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        d = data.get("data", {})
        result["high52"] = d.get("priceFiftyTwoWeekHigh", 0)
        result["low52"] = d.get("priceFiftyTwoWeekLow", 0)
        result["pe_ratio"] = d.get("priceEarningsRatio", 0)
        result["dividend_yield"] = d.get("yieldAnnual", 0)
        result["eps"] = d.get("earningsPerShare", 0)
    except:
        pass
    
    return result

def fetch_yearly_performance(ticker):
    """Get real 1-year performance from Yahoo Finance."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}.AX?range=1y&interval=1mo"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        result = data.get("chart", {}).get("result", [])
        if result:
            closes = result[0].get("indicators", {}).get("quote", [{}])[0].get("close", [])
            valid = [c for c in closes if c is not None]
            if len(valid) >= 2:
                return round(((valid[-1] - valid[0]) / valid[0]) * 100, 1)
    except:
        pass
    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ticker", type=str, help="Update single ticker")
    parser.add_argument("--delay", type=float, default=0.5, help="API delay")
    args = parser.parse_args()

    stocks = json.loads(STOCKS_PATH.read_text())
    print(f"Loaded {len(stocks)} stocks")

    if args.ticker:
        stocks_to_update = [s for s in stocks if s["ticker"] == args.ticker.upper()]
    else:
        stocks_to_update = stocks

    updated = 0
    failed = 0
    
    for i, stock in enumerate(stocks_to_update):
        ticker = stock["ticker"]
        print(f"[{i+1}/{len(stocks_to_update)}] {ticker}...", end=" ", flush=True)

        price_data = fetch_price(ticker)
        
        if price_data and price_data["price"] > 0:
            # Fetch 1Y performance from Yahoo
            perf_1y = fetch_yearly_performance(ticker)
            
            # Update in the main stocks list
            for s in stocks:
                if s["ticker"] == ticker:
                    s["price"] = round(price_data["price"], 4)
                    s["marketCap"] = format_market_cap(price_data["market_cap"])
                    s["dailyChange"] = price_data["change_pct"]
                    s["volume"] = price_data["volume"]
                    
                    # Real 1Y performance
                    if perf_1y is not None:
                        s["performance1y"] = perf_1y
                    
                    # 52-week range
                    if price_data.get("high52"):
                        s["high52"] = round(price_data["high52"], 4)
                    if price_data.get("low52"):
                        s["low52"] = round(price_data["low52"], 4)
                    
                    # Fundamentals
                    if price_data.get("pe_ratio"):
                        s["peRatio"] = round(price_data["pe_ratio"], 2)
                    if price_data.get("dividend_yield"):
                        s["dividendYield"] = round(price_data["dividend_yield"], 2)
                    if price_data.get("eps"):
                        s["eps"] = round(price_data["eps"], 4)
                    break
            updated += 1
            perf_str = f" 1Y:{perf_1y:+.1f}%" if perf_1y is not None else ""
            print(f"${price_data['price']:.4f} ({price_data['change_pct']:+.2f}%){perf_str} vol:{price_data['volume']:,}")
        else:
            failed += 1
            print("❌ no data")

        # Save every 100
        if (i + 1) % 100 == 0:
            STOCKS_PATH.write_text(json.dumps(stocks, indent=2))
            print(f"  💾 Saved ({updated} updated)")

        time.sleep(args.delay)

    # Final save
    STOCKS_PATH.write_text(json.dumps(stocks, indent=2))
    
    print(f"\n{'='*50}")
    print(f"Updated: {updated}, Failed: {failed}")
    print(f"Saved to: {STOCKS_PATH}")
    print(f"Timestamp: {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()
