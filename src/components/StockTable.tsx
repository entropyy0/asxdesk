"use client";

import { useMemo, useState } from "react";
import type { Stock } from "@/types";

const marketCapRanges = [
  { label: "All", value: "all" },
  { label: "Large (>$50B)", value: "large" },
  { label: "Mid ($5B-$50B)", value: "mid" },
  { label: "Small (<$5B)", value: "small" }
];

export default function StockTable({ stocks }: { stocks: Stock[] }) {
  const [sector, setSector] = useState("all");
  const [range, setRange] = useState("all");
  const [sortKey, setSortKey] = useState<"ticker" | "performance1y" | "price">(
    "performance1y"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sectors = useMemo(() => {
    const unique = Array.from(new Set(stocks.map((stock) => stock.sector)));
    return ["All", ...unique];
  }, [stocks]);

  const filtered = useMemo(() => {
    return stocks.filter((stock) => {
      const sectorMatch =
        sector === "all" || stock.sector.toLowerCase() === sector;
      const rangeMatch =
        range === "all" ||
        (range === "large" && stock.marketCap.includes("B")) ||
        (range === "mid" && stock.marketCap.includes("B") === false) ||
        (range === "small" && stock.marketCap.includes("M"));
      return sectorMatch && rangeMatch;
    });
  }, [stocks, sector, range]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const direction = sortDir === "asc" ? 1 : -1;
      if (sortKey === "ticker") return a.ticker.localeCompare(b.ticker) * direction;
      if (sortKey === "price") return (a.price - b.price) * direction;
      return (a.performance1y - b.performance1y) * direction;
    });
  }, [filtered, sortDir, sortKey]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-ink-800/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          <label className="flex flex-col gap-2">
            Sector
            <select
              value={sector}
              onChange={(event) =>
                setSector(event.target.value.toLowerCase())
              }
              className="rounded-full border border-white/10 bg-ink-900/70 px-4 py-2 text-sm"
            >
              {sectors.map((item) => (
                <option key={item} value={item.toLowerCase()}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            Market cap
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="rounded-full border border-white/10 bg-ink-900/70 px-4 py-2 text-sm"
            >
              {marketCapRanges.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs text-blue-200">
          Showing {sorted.length} stocks
        </div>
      </div>
      <div className="table-scroll overflow-x-auto rounded-2xl border border-white/10 bg-ink-800/60">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              <th className="px-5 py-4 cursor-pointer" onClick={() => toggleSort("ticker")}>
                Ticker
              </th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Sector</th>
              <th className="px-5 py-4 cursor-pointer" onClick={() => toggleSort("price")}>
                Price
              </th>
              <th
                className="px-5 py-4 cursor-pointer"
                onClick={() => toggleSort("performance1y")}
              >
                1Y
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((stock) => (
              <tr key={stock.ticker} className="border-b border-white/5">
                <td className="px-5 py-4 font-semibold text-blue-200">
                  <a href={`/asx/${stock.ticker}`}>{stock.ticker}</a>
                </td>
                <td className="px-5 py-4 text-slate-200">{stock.name}</td>
                <td className="px-5 py-4 text-slate-400">{stock.sector}</td>
                <td className="px-5 py-4">A${stock.price.toFixed(2)}</td>
                <td
                  className={`px-5 py-4 font-semibold ${
                    stock.performance1y >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {stock.performance1y.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
