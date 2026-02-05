import type { Stock } from "@/types";

export default function MetricsPanel({ stock }: { stock: Stock }) {
  const perfClass = stock.performance1y >= 0 ? "text-emerald-400" : "text-red-400";
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-semibold">Key Metrics</h3>
      <div className="mt-4 space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Share Price</span>
          <span className="font-semibold">A${stock.price.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">1Y Performance</span>
          <span className={`font-semibold ${perfClass}`}>
            {stock.performance1y.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Market Cap</span>
          <span className="font-semibold">{stock.marketCap}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Shares on Issue</span>
          <span className="font-semibold">{stock.sharesOnIssue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Sector</span>
          <span className="font-semibold">{stock.sector}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">IPO Date</span>
          <span className="font-semibold">{stock.ipoDate}</span>
        </div>
      </div>
    </div>
  );
}
