export const dynamicParams = false;
import type { Metadata } from "next";
import StockCard from "@/components/StockCard";
import { buildSectorDescription, buildSectorTitle } from "@/lib/seo";
import { getStocksBySector, sectorList } from "@/lib/utils";

export const revalidate = 3600;

const DISPLAY_LIMIT = 20;

type SectorPageProps = {
  params: { sector: string };
};

export function generateStaticParams() {
  return sectorList.map((sector) => ({ sector: sector.toLowerCase() }));
}

export function generateMetadata({ params }: SectorPageProps): Metadata {
  const sector = decodeURIComponent(params.sector);
  const title = buildSectorTitle(sector);
  const description = buildSectorDescription(sector);
  return {
    title,
    description,
    alternates: {
      canonical: `https://asxdesk.com/sectors/${params.sector}`,
    },
    openGraph: {
      title,
      description,
      url: `https://asxdesk.com/sectors/${params.sector}`,
    },
  };
}

export default function SectorPage({ params }: SectorPageProps) {
  const sector = decodeURIComponent(params.sector);
  const stocks = getStocksBySector(sector);

  /* ---- Derived stats ---- */
  const sorted = [...stocks].sort(
    (a, b) => b.performance1y - a.performance1y
  );
  const best = sorted[0] ?? null;
  const worst = sorted[sorted.length - 1] ?? null;
  const avg =
    stocks.length > 0
      ? stocks.reduce((sum, s) => sum + s.performance1y, 0) / stocks.length
      : 0;

  const top3 = sorted.slice(0, 3);
  const worst3 = sorted.slice(-3).reverse();

  const displayedStocks = sorted.slice(0, DISPLAY_LIMIT);
  const remaining = stocks.length - DISPLAY_LIMIT;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-2xl border border-white/10 bg-ink-900/80 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          Sector
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {sector} Stocks
        </h1>
        <p className="mt-4 text-sm text-slate-300">
          Deep-dive coverage on ASX {sector} leaders, thematic trends, and
          relative performance signals. Our AI engine tracks earnings momentum,
          capital allocation, and sector rotation.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="rounded-full border border-white/10 px-3 py-1">
            {stocks.length} stocks tracked
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1">
            Updated daily
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1">
            AI sector heatmaps
          </span>
        </div>
      </section>

      {/* Stats bar */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Total Stocks
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-white">
            {stocks.length}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Avg 1Y Performance
          </p>
          <p
            className={`mt-1 font-display text-2xl font-semibold ${
              avg >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {avg >= 0 ? "+" : ""}
            {avg.toFixed(1)}%
          </p>
        </div>
        {best && (
          <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Best Performer
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-emerald-400">
              {best.ticker}
            </p>
            <p className="text-xs text-emerald-400/80">
              {best.performance1y >= 0 ? "+" : ""}
              {best.performance1y.toFixed(1)}%
            </p>
          </div>
        )}
        {worst && (
          <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Worst Performer
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-red-400">
              {worst.ticker}
            </p>
            <p className="text-xs text-red-400/80">
              {worst.performance1y >= 0 ? "+" : ""}
              {worst.performance1y.toFixed(1)}%
            </p>
          </div>
        )}
      </section>

      {/* Top & Worst performers */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-6">
          <h2 className="font-display text-lg font-semibold">
            Top Performers
          </h2>
          <div className="mt-4 space-y-3">
            {top3.map((stock) => (
              <div
                key={stock.ticker}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-900/40 p-4"
              >
                <div>
                  <p className="font-semibold text-white">{stock.ticker}</p>
                  <p className="text-xs text-slate-400">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300">
                    A${stock.price.toFixed(2)}
                  </p>
                  <span className="text-sm font-semibold text-emerald-400">
                    {stock.performance1y >= 0 ? "+" : ""}
                    {stock.performance1y.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-6">
          <h2 className="font-display text-lg font-semibold">
            Worst Performers
          </h2>
          <div className="mt-4 space-y-3">
            {worst3.map((stock) => (
              <div
                key={stock.ticker}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-900/40 p-4"
              >
                <div>
                  <p className="font-semibold text-white">{stock.ticker}</p>
                  <p className="text-xs text-slate-400">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300">
                    A${stock.price.toFixed(2)}
                  </p>
                  <span className="text-sm font-semibold text-red-400">
                    {stock.performance1y >= 0 ? "+" : ""}
                    {stock.performance1y.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All stocks (capped at DISPLAY_LIMIT) */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">
            All {sector} Coverage
          </h2>
          <p className="text-sm text-slate-400">
            Showing {displayedStocks.length} of {stocks.length} stocks
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {displayedStocks.map((stock) => (
            <StockCard key={stock.ticker} stock={stock} />
          ))}
        </div>
        {remaining > 0 && (
          <p className="text-center text-sm text-slate-500">
            +{remaining} more {sector.toLowerCase()} stocks available. Use the{" "}
            <a href="/screener" className="text-blue-400 hover:underline">
              Screener
            </a>{" "}
            to filter and explore the full list.
          </p>
        )}
      </section>
    </div>
  );
}
