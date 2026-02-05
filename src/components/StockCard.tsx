import Link from "next/link";
import type { Stock } from "@/types";

export default function StockCard({ stock }: { stock: Stock }) {
  const perfClass = stock.performance1y >= 0 ? "text-emerald-400" : "text-red-400";
  return (
    <Link
      href={`/asx/${stock.ticker}`}
      className="glass-card group rounded-2xl p-5 transition hover:-translate-y-1 hover:border-blue-500/40"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {stock.sector}
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold">
            {stock.ticker}
            <span className="ml-2 text-sm text-slate-400">{stock.name}</span>
          </h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-300">A${stock.price.toFixed(2)}</p>
          <p className={`text-xs font-semibold ${perfClass}`}>
            {stock.performance1y.toFixed(1)}% 1Y
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-400">{stock.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>Market cap {stock.marketCap}</span>
        <span className="text-blue-300">View analysis</span>
      </div>
    </Link>
  );
}
