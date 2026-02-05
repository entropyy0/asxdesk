"use client";

import { useMemo, useState, useCallback } from "react";
import type { Stock } from "@/types";

export type SentimentMapEntry = { score: number; label: string };

const ITEMS_PER_PAGE = 50;

const marketCapRanges = [
  { label: "All", value: "all" },
  { label: "Large (>$10B)", value: "large" },
  { label: "Mid ($500M–$10B)", value: "mid" },
  { label: "Small ($50M–$500M)", value: "small" },
  { label: "Micro (<$50M)", value: "micro" },
];

type SortKey =
  | "ticker"
  | "name"
  | "sector"
  | "price"
  | "dailyChange"
  | "volume"
  | "marketCap"
  | "performance1y"
  | "sentiment";

function sentimentEmoji(label: string): string {
  switch (label) {
    case "Bullish":
      return "🟢";
    case "Bearish":
      return "🔴";
    default:
      return "🟡";
  }
}

function sentimentColorClass(label: string): string {
  switch (label) {
    case "Bullish":
      return "text-emerald-400";
    case "Bearish":
      return "text-red-400";
    default:
      return "text-yellow-400";
  }
}

/** Parse "A$220B" / "A$50M" / "A$1.2T" etc into a raw number for sorting & filtering */
function parseMarketCapValue(cap: string): number {
  if (!cap) return 0;
  const cleaned = cap.replace(/[^0-9.BMTK]/gi, "");
  const match = cleaned.match(/^([\d.]+)\s*([BMTK])?$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return 0;
  const unit = (match[2] || "").toUpperCase();
  switch (unit) {
    case "T":
      return num * 1_000_000;
    case "B":
      return num * 1_000;
    case "M":
      return num;
    case "K":
      return num / 1_000;
    default:
      return num;
  }
}

function formatVolume(vol: number | undefined): string {
  if (vol == null) return "—";
  return vol.toLocaleString("en-AU");
}

function SortArrow({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) {
    return (
      <span className="ml-1 inline-flex flex-col text-[8px] leading-none text-slate-600">
        <span>▲</span>
        <span>▼</span>
      </span>
    );
  }
  return (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none">
      <span className={dir === "asc" ? "text-blue-400" : "text-slate-600"}>▲</span>
      <span className={dir === "desc" ? "text-blue-400" : "text-slate-600"}>▼</span>
    </span>
  );
}

export default function StockTable({
  stocks,
  sentimentMap = {},
}: {
  stocks: Stock[];
  sentimentMap?: Record<string, SentimentMapEntry>;
}) {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("all");
  const [range, setRange] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("performance1y");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const sectors = useMemo(() => {
    const unique = Array.from(new Set(stocks.map((s) => s.sector))).sort();
    return ["All", ...unique];
  }, [stocks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stocks.filter((stock) => {
      // Search filter
      if (q && !stock.ticker.toLowerCase().includes(q) && !stock.name.toLowerCase().includes(q)) {
        return false;
      }
      // Sector filter
      if (sector !== "all" && stock.sector.toLowerCase() !== sector) {
        return false;
      }
      // Market cap filter
      if (range !== "all") {
        const capM = parseMarketCapValue(stock.marketCap); // value in millions
        switch (range) {
          case "large":
            if (capM <= 10_000) return false;
            break;
          case "mid":
            if (capM < 500 || capM > 10_000) return false;
            break;
          case "small":
            if (capM < 50 || capM > 500) return false;
            break;
          case "micro":
            if (capM >= 50) return false;
            break;
        }
      }
      return true;
    });
  }, [stocks, search, sector, range]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "ticker":
          return a.ticker.localeCompare(b.ticker) * dir;
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "sector":
          return a.sector.localeCompare(b.sector) * dir;
        case "price":
          return (a.price - b.price) * dir;
        case "dailyChange":
          return ((a.dailyChange ?? 0) - (b.dailyChange ?? 0)) * dir;
        case "volume":
          return ((a.volume ?? 0) - (b.volume ?? 0)) * dir;
        case "marketCap":
          return (parseMarketCapValue(a.marketCap) - parseMarketCapValue(b.marketCap)) * dir;
        case "performance1y":
          return (a.performance1y - b.performance1y) * dir;
        case "sentiment": {
          const sa = sentimentMap[a.ticker]?.score ?? -2;
          const sb = sentimentMap[b.ticker]?.score ?? -2;
          return (sa - sb) * dir;
        }
        default:
          return 0;
      }
    });
  }, [filtered, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, safePage]);

  // Reset to page 1 when filters change
  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);
  const handleSector = useCallback((val: string) => {
    setSector(val.toLowerCase());
    setPage(1);
  }, []);
  const handleRange = useCallback((val: string) => {
    setRange(val);
    setPage(1);
  }, []);

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
      setPage(1);
    },
    [sortKey]
  );

  const columns: { key: SortKey; label: string; className?: string }[] = [
    { key: "ticker", label: "Ticker" },
    { key: "name", label: "Name" },
    { key: "sector", label: "Sector" },
    { key: "price", label: "Price" },
    { key: "dailyChange", label: "Day" },
    { key: "volume", label: "Volume" },
    { key: "marketCap", label: "Mkt Cap" },
    { key: "performance1y", label: "1Y" },
    { key: "sentiment", label: "Sentiment" },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-ink-800/60 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          {/* Search */}
          <label className="flex flex-col gap-2">
            Search
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Ticker or name…"
              className="rounded-full border border-white/10 bg-ink-900/70 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
          </label>
          {/* Sector */}
          <label className="flex flex-col gap-2">
            Sector
            <select
              value={sector}
              onChange={(e) => handleSector(e.target.value)}
              className="rounded-full border border-white/10 bg-ink-900/70 px-4 py-2 text-sm"
            >
              {sectors.map((item) => (
                <option key={item} value={item.toLowerCase()}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          {/* Market cap */}
          <label className="flex flex-col gap-2">
            Market cap
            <select
              value={range}
              onChange={(e) => handleRange(e.target.value)}
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
        <div className="shrink-0 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs text-blue-200">
          {sorted.length.toLocaleString()} stock{sorted.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Table */}
      <div className="table-scroll overflow-x-auto rounded-2xl border border-white/10 bg-ink-800/60">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-ink-800 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer select-none px-5 py-4 transition-colors hover:text-slate-300"
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.label}
                    <SortArrow active={sortKey === col.key} dir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-500">
                  No stocks match your filters.
                </td>
              </tr>
            ) : (
              paged.map((stock) => (
                <tr
                  key={stock.ticker}
                  className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                >
                  {/* Ticker */}
                  <td className="px-5 py-4 font-semibold text-blue-200">
                    <a href={`/asx/${stock.ticker}`}>{stock.ticker}</a>
                  </td>
                  {/* Name */}
                  <td className="max-w-[200px] truncate px-5 py-4 text-slate-200">
                    {stock.name}
                  </td>
                  {/* Sector */}
                  <td className="px-5 py-4 text-slate-400">{stock.sector}</td>
                  {/* Price */}
                  <td className="px-5 py-4 tabular-nums">A${stock.price.toFixed(2)}</td>
                  {/* Daily Change */}
                  <td
                    className={`px-5 py-4 font-semibold tabular-nums ${
                      stock.dailyChange == null
                        ? "text-slate-500"
                        : stock.dailyChange >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                    }`}
                  >
                    {stock.dailyChange == null
                      ? "—"
                      : `${stock.dailyChange >= 0 ? "+" : ""}${stock.dailyChange.toFixed(2)}%`}
                  </td>
                  {/* Volume */}
                  <td className="px-5 py-4 tabular-nums text-slate-300">
                    {formatVolume(stock.volume)}
                  </td>
                  {/* Market Cap */}
                  <td className="px-5 py-4 text-slate-300">{stock.marketCap || "—"}</td>
                  {/* 1Y Performance */}
                  <td
                    className={`px-5 py-4 font-semibold tabular-nums ${
                      stock.performance1y >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {stock.performance1y >= 0 ? "+" : ""}
                    {stock.performance1y.toFixed(1)}%
                  </td>
                  {/* Sentiment */}
                  <td className="px-5 py-4 text-xs">
                    {sentimentMap[stock.ticker] ? (
                      <span className={sentimentColorClass(sentimentMap[stock.ticker].label)}>
                        {sentimentEmoji(sentimentMap[stock.ticker].label)}{" "}
                        {sentimentMap[stock.ticker].label}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink-800/60 px-5 py-3 text-sm text-slate-400">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="rounded-full border border-white/10 px-4 py-1.5 text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Prev
          </button>
          <span>
            Page <span className="text-slate-200">{safePage}</span> of{" "}
            <span className="text-slate-200">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="rounded-full border border-white/10 px-4 py-1.5 text-slate-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
