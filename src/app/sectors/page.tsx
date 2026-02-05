import type { Metadata } from "next";
import Link from "next/link";
import { sectorList, getStocksBySector } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ASX Sectors | Industry breakdown & top performers",
  description:
    "Browse all 12 ASX sectors — see stock counts, top and worst performers by 1-year return, and drill into sector-level analysis.",
  alternates: {
    canonical: "https://asxdesk.com/sectors",
  },
  openGraph: {
    title: "ASX Sectors | Industry breakdown & top performers",
    description:
      "Browse all 12 ASX sectors — see stock counts, top and worst performers by 1-year return, and drill into sector-level analysis.",
    url: "https://asxdesk.com/sectors",
  },
};

function getSectorStats(sector: string) {
  const stocks = getStocksBySector(sector);
  const sorted = [...stocks].sort(
    (a, b) => b.performance1y - a.performance1y
  );
  const best = sorted[0] ?? null;
  const worst = sorted[sorted.length - 1] ?? null;
  return { count: stocks.length, best, worst };
}

export default function SectorsPage() {
  const sectors = sectorList.map((sector) => ({
    name: sector,
    slug: sector.toLowerCase(),
    ...getSectorStats(sector),
  }));

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-white/10 bg-ink-900/80 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          Market Overview
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          ASX Sectors
        </h1>
        <p className="mt-4 text-sm text-slate-300">
          Explore all {sectors.length} ASX sectors. Each card shows total tracked
          stocks, the best and worst 1-year performer, so you can quickly spot
          where momentum is building — or fading.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <Link
            key={sector.slug}
            href={`/sectors/${sector.slug}`}
            className="group rounded-2xl border border-white/10 bg-ink-900/80 p-5 transition hover:-translate-y-1 hover:border-blue-500/40"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">
                {sector.name}
              </h2>
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-slate-400">
                {sector.count} stocks
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {sector.best && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    Top{" "}
                    <span className="font-medium text-slate-200">
                      {sector.best.ticker}
                    </span>
                  </span>
                  <span className="font-semibold text-emerald-400">
                    {sector.best.performance1y >= 0 ? "+" : ""}
                    {sector.best.performance1y.toFixed(1)}%
                  </span>
                </div>
              )}
              {sector.worst && sector.worst.ticker !== sector.best?.ticker && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    Worst{" "}
                    <span className="font-medium text-slate-200">
                      {sector.worst.ticker}
                    </span>
                  </span>
                  <span className="font-semibold text-red-400">
                    {sector.worst.performance1y >= 0 ? "+" : ""}
                    {sector.worst.performance1y.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <p className="mt-4 text-xs text-blue-300 opacity-0 transition group-hover:opacity-100">
              View sector →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
