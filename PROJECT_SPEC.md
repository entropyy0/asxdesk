# ASX SeoBOT - Automated ASX Stock Content Website

## Overview
A Next.js website that auto-generates SEO-optimized content pages for ASX-listed companies. The site targets long-tail search queries like "What does [TICKER] do?", "[COMPANY] share price", "[TICKER] analysis" — terms with almost zero competition in the Australian market.

## Tech Stack
- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Content:** Static generation (SSG) + Incremental Static Regeneration (ISR)
- **Data:** JSON files for stock data (no database needed initially)
- **Deployment:** Vercel (free tier to start)
- **SEO:** Next.js metadata API, sitemap.xml, robots.txt, structured data (JSON-LD)

## Site Structure

### Pages to Build:

1. **Homepage** (`/`)
   - Hero: "Australia's AI-Powered ASX Stock Research Platform"
   - Search bar to find any ASX ticker
   - Featured stocks / trending / recently updated
   - Latest news/analysis cards
   - Clean, professional financial site design (dark mode, think Bloomberg meets modern SaaS)

2. **Stock Profile Page** (`/asx/[ticker]`)
   - Company overview (what they do, sector, market cap)
   - Key metrics sidebar (market cap, shares on issue, sector, IPO date)
   - AI-generated analysis section
   - Bull case / Bear case
   - Recent announcements summary
   - Price chart placeholder (embed TradingView widget)
   - Related stocks in same sector
   - Broker comparison CTA (affiliate links)
   - FAQ section with structured data for Google rich snippets

3. **Sector Pages** (`/sectors/[sector]`)
   - List of all stocks in that sector
   - Sector overview and trends
   - Top performers / worst performers

4. **News/Blog** (`/news` and `/news/[slug]`)
   - AI-generated market commentary
   - Announcement summaries
   - Sector roundups
   - "Stock of the week" features

5. **Screener** (`/screener`)
   - Filter ASX stocks by sector, market cap range, performance
   - Table with sortable columns
   - Links to individual stock pages

6. **About** (`/about`)
   - AI-powered research platform
   - Disclaimer (not financial advice)

7. **Compare** (`/compare/[ticker1]-vs-[ticker2]`)
   - Side-by-side stock comparison
   - Great for SEO: "[TICKER] vs [TICKER]" searches

### SEO Requirements:
- Every page has unique meta title and description
- Structured data (JSON-LD) for Organization, Article, FAQPage
- Auto-generated sitemap.xml with all ticker pages
- robots.txt allowing all crawlers
- Canonical URLs
- Open Graph and Twitter Card meta tags
- Fast loading (target 95+ Lighthouse score)

### Monetization Placeholders:
- Banner ad slots (Google AdSense)
- Broker comparison section with affiliate CTAs
- "Open an account" buttons linking to broker partners
- Newsletter signup for premium content

## Sample Data
Create a sample dataset with 20 ASX stocks to demonstrate the site. Include real tickers and approximate data:
- BHP, CBA, CSL, WDS, FMG, RIO, NAB, WBC, ANZ, MQG (large caps for credibility)
- NVA, PNV, VML, LKE, BRN, ZIP, APX, WBT, DEG, SYA (small/micro caps)

For each stock include:
- ticker, name, sector, marketCap, sharesOnIssue, description, website
- A 2-paragraph AI analysis
- Bull case (2-3 points)
- Bear case (2-3 points)
- 3 FAQ items

## Design Guidelines
- Dark theme primary (navy/charcoal backgrounds, white text)
- Accent color: electric blue (#3B82F6) and green (#10B981) for positive
- Red (#EF4444) for negative/bearish
- Clean typography, lots of whitespace
- Mobile-first responsive
- Professional financial aesthetic — not a toy, this is serious research
- Subtle gradients and glass morphism for cards

## File Structure
```
/src
  /app
    /page.tsx              (homepage)
    /asx/[ticker]/page.tsx (stock profile)
    /sectors/[sector]/page.tsx
    /news/page.tsx
    /news/[slug]/page.tsx
    /screener/page.tsx
    /compare/[ticker1]-vs-[ticker2]/page.tsx
    /about/page.tsx
    /layout.tsx
    /globals.css
  /components
    /Header.tsx
    /Footer.tsx
    /StockCard.tsx
    /SearchBar.tsx
    /MetricsPanel.tsx
    /AnalysisSection.tsx
    /BrokerCTA.tsx
    /NewsCard.tsx
    /SEO.tsx
    /StockTable.tsx
  /data
    /stocks.json
  /lib
    /utils.ts
    /seo.ts
  /types
    /index.ts
```

## Build Priority
1. Core layout (header, footer, nav)
2. Stock profile page (this is the money page)
3. Homepage with search
4. Screener
5. Sector pages
6. News section
7. Compare pages

Build the COMPLETE site. All pages, all components, all data. Make it production-ready and beautiful.
