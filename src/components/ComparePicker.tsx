"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import stocks from "@/data/stocks.json";

type StockEntry = {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  marketCap: string;
  performance1y: number;
  dailyChange?: number;
  volume?: number;
  high52?: number;
  low52?: number;
  peRatio?: number;
  dividendYield?: number;
  eps?: number;
};

const stockList = stocks as StockEntry[];

/* ---------- popular pre-generated pairs (kept in sync with generateStaticParams) ---------- */
const popularPairs: [string, string][] = [
  ["BHP", "RIO"],
  ["CBA", "NAB"],
  ["CBA", "WBC"],
  ["CSL", "RMD"],
  ["FMG", "BHP"],
  ["WES", "WOW"],
  ["ANZ", "NAB"],
  ["MQG", "ANZ"],
  ["TLS", "REA"],
  ["WDS", "STO"],
];

/* ---------- helpers ---------- */
function formatNum(n: number): string {
  if (Math.abs(n) >= 1e9) return `A$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `A$${(n / 1e6).toFixed(1)}M`;
  return new Intl.NumberFormat("en-AU").format(n);
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

/* ---------- Autocomplete input ---------- */
function StockInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StockEntry | null;
  onChange: (s: StockEntry | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches =
    query.length > 0
      ? stockList
          .filter((s) => {
            const q = query.toUpperCase();
            return s.ticker.toUpperCase().includes(q) || s.name.toUpperCase().includes(q);
          })
          .slice(0, 8)
      : [];

  const pick = useCallback(
    (s: StockEntry) => {
      onChange(s);
      setQuery(s.ticker);
      setOpen(false);
      setActiveIdx(-1);
    },
    [onChange],
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((p) => (p < matches.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((p) => (p > 0 ? p - 1 : matches.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && matches[activeIdx]) pick(matches[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  return (
    <div ref={wrapRef} className="relative flex-1">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </label>
      <div className="flex items-center rounded-xl border border-white/10 bg-ink-900/70 px-3 py-2.5 focus-within:border-blue-500/60 transition">
        <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={value && !open ? value.ticker : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIdx(-1);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => {
            if (value) {
              setQuery(value.ticker);
            }
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search ticker or name…"
          className="ml-2 w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="ml-1 shrink-0 text-slate-500 hover:text-white transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      {open && matches.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-white/10 bg-ink-800 shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
          {matches.map((stock, i) => (
            <button
              key={stock.ticker}
              type="button"
              onMouseDown={() => pick(stock)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                i === activeIdx ? "bg-blue-500/15 text-white" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span className="shrink-0 rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-xs font-bold text-blue-300">
                {stock.ticker}
              </span>
              <span className="truncate text-xs">{stock.name}</span>
              <span className="ml-auto text-xs text-slate-500">A${stock.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Comparison Result ---------- */
function ComparisonResult({ a, b }: { a: StockEntry; b: StockEntry }) {
  type Metric = {
    label: string;
    valA: string;
    valB: string;
    winner: "a" | "b" | "tie";
  };

  const metrics: Metric[] = [
    {
      label: "Share Price",
      valA: `A$${a.price.toFixed(2)}`,
      valB: `A$${b.price.toFixed(2)}`,
      winner: "tie",
    },
    {
      label: "Market Cap",
      valA: a.marketCap,
      valB: b.marketCap,
      winner: parseMcap(a.marketCap) > parseMcap(b.marketCap) ? "a" : parseMcap(a.marketCap) < parseMcap(b.marketCap) ? "b" : "tie",
    },
    {
      label: "Daily Change",
      valA: a.dailyChange != null ? `${a.dailyChange >= 0 ? "+" : ""}${a.dailyChange.toFixed(2)}%` : "—",
      valB: b.dailyChange != null ? `${b.dailyChange >= 0 ? "+" : ""}${b.dailyChange.toFixed(2)}%` : "—",
      winner:
        a.dailyChange != null && b.dailyChange != null
          ? a.dailyChange > b.dailyChange
            ? "a"
            : a.dailyChange < b.dailyChange
            ? "b"
            : "tie"
          : "tie",
    },
    {
      label: "1Y Performance",
      valA: `${a.performance1y >= 0 ? "+" : ""}${a.performance1y.toFixed(1)}%`,
      valB: `${b.performance1y >= 0 ? "+" : ""}${b.performance1y.toFixed(1)}%`,
      winner: a.performance1y > b.performance1y ? "a" : a.performance1y < b.performance1y ? "b" : "tie",
    },
    {
      label: "Volume",
      valA: a.volume != null ? formatVol(a.volume) : "—",
      valB: b.volume != null ? formatVol(b.volume) : "—",
      winner:
        a.volume != null && b.volume != null
          ? a.volume > b.volume
            ? "a"
            : a.volume < b.volume
            ? "b"
            : "tie"
          : "tie",
    },
    {
      label: "52W High",
      valA: a.high52 != null ? `A$${a.high52.toFixed(2)}` : "—",
      valB: b.high52 != null ? `A$${b.high52.toFixed(2)}` : "—",
      winner: "tie",
    },
    {
      label: "52W Low",
      valA: a.low52 != null ? `A$${a.low52.toFixed(2)}` : "—",
      valB: b.low52 != null ? `A$${b.low52.toFixed(2)}` : "—",
      winner: "tie",
    },
    {
      label: "P/E Ratio",
      valA: a.peRatio != null ? a.peRatio.toFixed(2) : "—",
      valB: b.peRatio != null ? b.peRatio.toFixed(2) : "—",
      winner:
        a.peRatio != null && b.peRatio != null && a.peRatio > 0 && b.peRatio > 0
          ? a.peRatio < b.peRatio
            ? "a"
            : a.peRatio > b.peRatio
            ? "b"
            : "tie"
          : "tie",
    },
    {
      label: "Dividend Yield",
      valA: a.dividendYield != null ? `${a.dividendYield.toFixed(2)}%` : "—",
      valB: b.dividendYield != null ? `${b.dividendYield.toFixed(2)}%` : "—",
      winner:
        a.dividendYield != null && b.dividendYield != null
          ? a.dividendYield > b.dividendYield
            ? "a"
            : a.dividendYield < b.dividendYield
            ? "b"
            : "tie"
          : "tie",
    },
    {
      label: "EPS",
      valA: a.eps != null ? `A$${a.eps.toFixed(4)}` : "—",
      valB: b.eps != null ? `A$${b.eps.toFixed(4)}` : "—",
      winner:
        a.eps != null && b.eps != null
          ? a.eps > b.eps
            ? "a"
            : a.eps < b.eps
            ? "b"
            : "tie"
          : "tie",
    },
  ];

  const winClass = "text-emerald-400 font-semibold";

  return (
    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Side-by-side stock cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[a, b].map((s) => {
          const changeClass = (s.dailyChange ?? 0) >= 0 ? "text-emerald-400" : "text-red-400";
          const perfClass = s.performance1y >= 0 ? "text-emerald-400" : "text-red-400";
          return (
            <div key={s.ticker} className="rounded-2xl border border-white/10 bg-ink-900/80 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{s.sector}</p>
                  <h3 className="mt-1 font-display text-xl font-semibold">
                    {s.ticker}
                    <span className="ml-2 text-sm font-normal text-slate-400">{s.name}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">A${s.price.toFixed(2)}</p>
                  {s.dailyChange != null && (
                    <p className={`text-xs font-semibold ${changeClass}`}>
                      {s.dailyChange >= 0 ? "+" : ""}{s.dailyChange.toFixed(2)}% today
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Market Cap</p>
                  <p className="font-medium">{s.marketCap}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">1Y Performance</p>
                  <p className={`font-medium ${perfClass}`}>{s.performance1y >= 0 ? "+" : ""}{s.performance1y.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Volume</p>
                  <p className="font-medium">{s.volume != null ? formatVol(s.volume) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Dividend Yield</p>
                  <p className="font-medium">{s.dividendYield != null ? `${s.dividendYield.toFixed(2)}%` : "—"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-5">
        <h3 className="font-display text-lg font-semibold">Head-to-Head Comparison</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.15em] text-slate-500">
                <th className="py-2 text-left font-medium">Metric</th>
                <th className="py-2 text-right font-medium">{a.ticker}</th>
                <th className="py-2 text-right font-medium">{b.ticker}</th>
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
      </div>

      {/* Link to dedicated page if available */}
      <p className="text-center text-sm text-slate-500">
        <Link
          href={`/asx/${a.ticker}`}
          className="text-blue-400 hover:text-blue-300 transition"
        >
          {a.ticker} profile
        </Link>
        {" · "}
        <Link
          href={`/asx/${b.ticker}`}
          className="text-blue-400 hover:text-blue-300 transition"
        >
          {b.ticker} profile
        </Link>
      </p>
    </div>
  );
}

/* ---------- Main ComparePicker ---------- */
export default function ComparePicker() {
  const [stockA, setStockA] = useState<StockEntry | null>(null);
  const [stockB, setStockB] = useState<StockEntry | null>(null);
  const [showResult, setShowResult] = useState(false);

  const canCompare = stockA && stockB && stockA.ticker !== stockB.ticker;

  function handleCompare() {
    if (canCompare) setShowResult(true);
  }

  // Reset result when stocks change
  useEffect(() => {
    setShowResult(false);
  }, [stockA, stockB]);

  return (
    <div>
      {/* Picker */}
      <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <StockInput label="Stock A" value={stockA} onChange={setStockA} />
          <div className="hidden sm:flex items-center justify-center pb-1">
            <span className="text-lg font-bold text-slate-500">vs</span>
          </div>
          <StockInput label="Stock B" value={stockB} onChange={setStockB} />
          <button
            type="button"
            onClick={handleCompare}
            disabled={!canCompare}
            className="shrink-0 rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white shadow-glow transition hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Compare
          </button>
        </div>
        {stockA && stockB && stockA.ticker === stockB.ticker && (
          <p className="mt-3 text-xs text-red-400">Please select two different stocks to compare.</p>
        )}
      </div>

      {/* Result */}
      {showResult && stockA && stockB && <ComparisonResult a={stockA} b={stockB} />}

      {/* Popular comparisons */}
      {!showResult && (
        <div className="mt-10">
          <h2 className="font-display text-xl font-semibold">Popular Comparisons</h2>
          <p className="mt-1 text-sm text-slate-400">Quick access to frequently compared ASX stock pairs.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularPairs.map(([t1, t2]) => {
              const s1 = stockList.find((s) => s.ticker === t1);
              const s2 = stockList.find((s) => s.ticker === t2);
              if (!s1 || !s2) return null;
              return (
                <Link
                  key={`${t1}-${t2}`}
                  href={`/compare/${t1}-vs-${t2}`}
                  className="group flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-4 transition hover:border-blue-500/40 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-xs font-bold text-blue-300">
                      {t1}
                    </span>
                    <span className="text-xs text-slate-500">vs</span>
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-xs font-bold text-blue-300">
                      {t2}
                    </span>
                  </div>
                  <span className="ml-auto text-xs text-slate-500 group-hover:text-blue-300 transition">
                    View →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
