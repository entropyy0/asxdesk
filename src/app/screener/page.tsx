import type { Metadata } from "next";
import StockTable from "@/components/StockTable";
import { allStocks } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ASX Stock Screener",
  description:
    "Filter ASX stocks by sector, market cap, and performance with our AI-powered screener.",
  alternates: {
    canonical: "https://asxdesk.example.com/screener"
  }
};

export default function ScreenerPage() {
  return (
    <div className="space-y-10">
      <section className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Screener</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          ASX Stock Screener
        </h1>
        <p className="mt-4 text-sm text-slate-300">
          Filter ASX-listed stocks by sector, market cap, and 1Y performance.
          Discover new ideas in seconds.
        </p>
      </section>
      <StockTable stocks={allStocks} />
    </div>
  );
}
