export const dynamicParams = false;
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrokerCTA from "@/components/BrokerCTA";
import StockCard from "@/components/StockCard";
import { buildCompareTitle } from "@/lib/seo";
import { allStocks, getStockByTicker } from "@/lib/utils";

type ComparePageProps = {
  params: { tickers: string[] };
};

export function generateStaticParams() {
  const params: { tickers: string[] }[] = [];
  for (let i = 0; i < allStocks.length; i += 1) {
    for (let j = i + 1; j < allStocks.length; j += 1) {
      params.push({ tickers: [`${allStocks[i].ticker}-vs-${allStocks[j].ticker}`] });
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
  const description = `Side-by-side comparison of ${stock1.name} and ${stock2.name} including market cap, sector exposure, and AI analysis.`;
  return { title, description };
}

export default function ComparePage({ params }: ComparePageProps) {
  const parts = (params.tickers[0] || "").split("-vs-");
  const stock1 = getStockByTicker(parts[0]);
  const stock2 = getStockByTicker(parts[1]);
  if (!stock1 || !stock2) notFound();

  return (
    <div className="space-y-10">
      <section className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Compare</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">{stock1.ticker} vs {stock2.ticker}</h1>
        <p className="mt-4 text-sm text-slate-300">Compare key metrics, sector exposure, and AI analysis signals side by side.</p>
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <StockCard stock={stock1} />
        <StockCard stock={stock2} />
      </section>
      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-xl font-semibold">Key Metrics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[stock1, stock2].map((stock) => (
            <div key={stock.ticker} className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{stock.ticker}</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Market Cap</span><span className="font-semibold">{stock.marketCap}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Sector</span><span className="font-semibold">{stock.sector}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">1Y Performance</span><span className={`font-semibold ${stock.performance1y >= 0 ? "text-emerald-400" : "text-red-400"}`}>{stock.performance1y.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Share Price</span><span className="font-semibold">A${stock.price.toFixed(2)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold">AI Summary</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <p>{stock1.ticker} offers exposure to {stock1.sector.toLowerCase()} themes with a market cap of {stock1.marketCap}. {stock2.ticker} provides a contrasting profile in {stock2.sector.toLowerCase()}, helping investors assess sector rotation and risk balance.</p>
          </div>
        </div>
        <BrokerCTA />
      </section>
    </div>
  );
}
