import type { Metadata } from "next";
import StockCard from "@/components/StockCard";
import { buildSectorDescription, buildSectorTitle } from "@/lib/seo";
import { getStocksBySector, sectorList, getTopPerformers, getWorstPerformers } from "@/lib/utils";

export const revalidate = 3600;

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
      canonical: `https://asxdesk.example.com/sectors/${params.sector}`
    },
    openGraph: {
      title,
      description,
      url: `https://asxdesk.example.com/sectors/${params.sector}`
    }
  };
}

export default function SectorPage({ params }: SectorPageProps) {
  const sector = decodeURIComponent(params.sector);
  const stocks = getStocksBySector(sector);
  const top = getTopPerformers(3).filter((stock) => stock.sector.toLowerCase() === sector.toLowerCase());
  const worst = getWorstPerformers(3).filter((stock) => stock.sector.toLowerCase() === sector.toLowerCase());

  return (
    <div className="space-y-10">
      <section className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Sector</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {sector} Stocks
        </h1>
        <p className="mt-4 text-sm text-slate-300">
          Deep-dive coverage on ASX {sector} leaders, thematic trends, and relative
          performance signals. Our AI engine tracks earnings momentum, capital
          allocation, and sector rotation.
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold">Top Performers</h2>
          <div className="mt-4 space-y-3">
            {top.length ? (
              top.map((stock) => (
                <div
                  key={stock.ticker}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-900/40 p-4"
                >
                  <div>
                    <p className="font-semibold text-white">{stock.ticker}</p>
                    <p className="text-xs text-slate-400">{stock.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    +{stock.performance1y.toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                Performance data is still being compiled for this sector.
              </p>
            )}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold">Worst Performers</h2>
          <div className="mt-4 space-y-3">
            {worst.length ? (
              worst.map((stock) => (
                <div
                  key={stock.ticker}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-900/40 p-4"
                >
                  <div>
                    <p className="font-semibold text-white">{stock.ticker}</p>
                    <p className="text-xs text-slate-400">{stock.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-400">
                    {stock.performance1y.toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                Performance data is still being compiled for this sector.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-semibold">All {sector} Coverage</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {stocks.map((stock) => (
            <StockCard key={stock.ticker} stock={stock} />
          ))}
        </div>
      </section>
    </div>
  );
}
