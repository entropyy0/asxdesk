export const dynamicParams = false;
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import StockCard from "@/components/StockCard";
import { buildCompareTitle } from "@/lib/seo";
import { allStocks, getStockByTicker } from "@/lib/utils";

type ComparePageProps = {
  params: { tickers: string[] };
};

/* Top 30 ASX stocks by market cap – generates 435 comparison pages */
function getTop30Tickers(): string[] {
  function parseMcap(s: string): number {
    const clean = s.replace("A$", "").trim();
    if (clean.endsWith("B")) return parseFloat(clean) * 1e9;
    if (clean.endsWith("M")) return parseFloat(clean) * 1e6;
    return 0;
  }
  return [...allStocks]
    .sort((a, b) => parseMcap(b.marketCap) - parseMcap(a.marketCap))
    .slice(0, 30)
    .map((s) => s.ticker);
}

export function generateStaticParams() {
  const top = getTop30Tickers();
  const params: { tickers: string[] }[] = [];
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      params.push({ tickers: [`${top[i]}-vs-${top[j]}`] });
    }
  }
  return params;
}

export function generateMetadata({ params }: ComparePageProps): Metadata {
  const parts = (params.tickers[0] || "").split("-vs-");
  const stock1 = getStockByTicker(parts[0]);
  const stock2 = getStockByTicker(parts[1]);
  if (!stock1 || !stock2) return {};
  const title = buildCompareTitle(stock1.ticker, stock2.ticker);
  const description = `Side-by-side comparison of ${stock1.name} (${stock1.ticker}) and ${stock2.name} (${stock2.ticker}) — share price, market cap, dividends, P/E ratio, and 1-year performance on the ASX.`;
  return { title, description };
}

function formatVol(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function parseMcap(s: string): number {
  const clean = s.replace("A$", "").trim();
  if (clean.endsWith("B")) return parseFloat(clean) * 1e9;
  if (clean.endsWith("M")) return parseFloat(clean) * 1e6;
  return 0;
}

export default function ComparePage({ params }: ComparePageProps) {
  const parts = (params.tickers[0] || "").split("-vs-");
  const stock1 = getStockByTicker(parts[0]);
  const stock2 = getStockByTicker(parts[1]);
  if (!stock1 || !stock2) notFound();

  type MetricRow = { label: string; valA: string; valB: string; winner: "a" | "b" | "tie" };

  const s1 = stock1 as typeof stock1 & { high52?: number; low52?: number; peRatio?: number; dividendYield?: number; eps?: number };
  const s2 = stock2 as typeof stock2 & { high52?: number; low52?: number; peRatio?: number; dividendYield?: number; eps?: number };

  const metrics: MetricRow[] = [
    {
      label: "Share Price",
      valA: `A$${s1.price.toFixed(2)}`,
      valB: `A$${s2.price.toFixed(2)}`,
      winner: "tie",
    },
    {
      label: "Market Cap",
      valA: s1.marketCap,
      valB: s2.marketCap,
      winner: parseMcap(s1.marketCap) > parseMcap(s2.marketCap) ? "a" : parseMcap(s1.marketCap) < parseMcap(s2.marketCap) ? "b" : "tie",
    },
    {
      label: "Daily Change",
      valA: s1.dailyChange != null ? `${s1.dailyChange >= 0 ? "+" : ""}${s1.dailyChange.toFixed(2)}%` : "—",
      valB: s2.dailyChange != null ? `${s2.dailyChange >= 0 ? "+" : ""}${s2.dailyChange.toFixed(2)}%` : "—",
      winner: s1.dailyChange != null && s2.dailyChange != null ? (s1.dailyChange > s2.dailyChange ? "a" : s1.dailyChange < s2.dailyChange ? "b" : "tie") : "tie",
    },
    {
      label: "1Y Performance",
      valA: `${s1.performance1y >= 0 ? "+" : ""}${s1.performance1y.toFixed(1)}%`,
      valB: `${s2.performance1y >= 0 ? "+" : ""}${s2.performance1y.toFixed(1)}%`,
      winner: s1.performance1y > s2.performance1y ? "a" : s1.performance1y < s2.performance1y ? "b" : "tie",
    },
    {
      label: "Volume",
      valA: s1.volume != null ? formatVol(s1.volume) : "—",
      valB: s2.volume != null ? formatVol(s2.volume) : "—",
      winner: s1.volume != null && s2.volume != null ? (s1.volume > s2.volume ? "a" : s1.volume < s2.volume ? "b" : "tie") : "tie",
    },
    {
      label: "52W High",
      valA: s1.high52 != null ? `A$${s1.high52.toFixed(2)}` : "—",
      valB: s2.high52 != null ? `A$${s2.high52.toFixed(2)}` : "—",
      winner: "tie",
    },
    {
      label: "52W Low",
      valA: s1.low52 != null ? `A$${s1.low52.toFixed(2)}` : "—",
      valB: s2.low52 != null ? `A$${s2.low52.toFixed(2)}` : "—",
      winner: "tie",
    },
    {
      label: "P/E Ratio",
      valA: s1.peRatio != null ? s1.peRatio.toFixed(2) : "—",
      valB: s2.peRatio != null ? s2.peRatio.toFixed(2) : "—",
      winner: s1.peRatio != null && s2.peRatio != null && s1.peRatio > 0 && s2.peRatio > 0 ? (s1.peRatio < s2.peRatio ? "a" : s1.peRatio > s2.peRatio ? "b" : "tie") : "tie",
    },
    {
      label: "Dividend Yield",
      valA: s1.dividendYield != null ? `${s1.dividendYield.toFixed(2)}%` : "—",
      valB: s2.dividendYield != null ? `${s2.dividendYield.toFixed(2)}%` : "—",
      winner: s1.dividendYield != null && s2.dividendYield != null ? (s1.dividendYield > s2.dividendYield ? "a" : s1.dividendYield < s2.dividendYield ? "b" : "tie") : "tie",
    },
    {
      label: "EPS",
      valA: s1.eps != null ? `A$${s1.eps.toFixed(4)}` : "—",
      valB: s2.eps != null ? `A$${s2.eps.toFixed(4)}` : "—",
      winner: s1.eps != null && s2.eps != null ? (s1.eps > s2.eps ? "a" : s1.eps < s2.eps ? "b" : "tie") : "tie",
    },
  ];

  const winClass = "text-emerald-400 font-semibold";

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-white/10 bg-ink-900/80 p-6">
        <div className="flex items-center gap-2">
          <Link href="/compare" className="text-xs text-blue-400 hover:text-blue-300 transition">
            ← All comparisons
          </Link>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold">{stock1.ticker} vs {stock2.ticker}</h1>
        <p className="mt-2 text-sm text-slate-300">
          Side-by-side comparison of {stock1.name} and {stock2.name} — key metrics, sector exposure, and performance analysis.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <StockCard stock={stock1} />
        <StockCard stock={stock2} />
      </section>

      {/* Detailed comparison table */}
      <section className="rounded-2xl border border-white/10 bg-ink-900/80 p-6">
        <h2 className="font-display text-xl font-semibold">Head-to-Head Comparison</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-slate-500">
                <th className="py-2 text-left font-medium">Metric</th>
                <th className="py-2 text-right font-medium">{stock1.ticker}</th>
                <th className="py-2 text-right font-medium">{stock2.ticker}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className="border-b border-white/5">
                  <td className="py-2.5 text-slate-400">{m.label}</td>
                  <td className={`py-2.5 text-right ${m.winner === "a" ? winClass : ""}`}>{m.valA}</td>
                  <td className={`py-2.5 text-right ${m.winner === "b" ? winClass : ""}`}>{m.valB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sector & profile summary */}
      <section className="rounded-2xl border border-white/10 bg-ink-900/80 p-6">
        <h2 className="font-display text-xl font-semibold">Summary</h2>
        <div className="mt-4 space-y-4 text-sm text-slate-300">
          <p>
            <strong className="text-white">{stock1.ticker}</strong> ({stock1.name}) operates in the {stock1.sector} sector
            with a market capitalisation of {stock1.marketCap}.
            {stock1.performance1y >= 0
              ? ` The stock has gained ${stock1.performance1y.toFixed(1)}% over the past year.`
              : ` The stock has declined ${Math.abs(stock1.performance1y).toFixed(1)}% over the past year.`}
          </p>
          <p>
            <strong className="text-white">{stock2.ticker}</strong> ({stock2.name}) operates in the {stock2.sector} sector
            with a market capitalisation of {stock2.marketCap}.
            {stock2.performance1y >= 0
              ? ` The stock has gained ${stock2.performance1y.toFixed(1)}% over the past year.`
              : ` The stock has declined ${Math.abs(stock2.performance1y).toFixed(1)}% over the past year.`}
          </p>
          {stock1.sector === stock2.sector ? (
            <p>Both stocks operate in the {stock1.sector} sector, making this a direct peer comparison for investors evaluating sector allocation.</p>
          ) : (
            <p>These stocks span {stock1.sector} and {stock2.sector}, offering investors a cross-sector comparison to assess diversification and risk balance.</p>
          )}
        </div>
      </section>

      <p className="text-center text-sm text-slate-500">
        <Link href={`/asx/${stock1.ticker}`} className="text-blue-400 hover:text-blue-300 transition">
          {stock1.ticker} full profile
        </Link>
        {" · "}
        <Link href={`/asx/${stock2.ticker}`} className="text-blue-400 hover:text-blue-300 transition">
          {stock2.ticker} full profile
        </Link>
        {" · "}
        <Link href="/compare" className="text-blue-400 hover:text-blue-300 transition">
          Compare other stocks
        </Link>
      </p>
    </div>
  );
}
