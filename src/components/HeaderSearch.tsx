"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import stocks from "@/data/stocks.json";

type StockEntry = { ticker: string; name: string };

const stockList: StockEntry[] = (stocks as StockEntry[]).map((s) => ({
  ticker: s.ticker,
  name: s.name,
}));

export default function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches =
    query.length > 0
      ? stockList
          .filter((s) => {
            const q = query.toUpperCase();
            return (
              s.ticker.toUpperCase().includes(q) ||
              s.name.toUpperCase().includes(q)
            );
          })
          .slice(0, 8)
      : [];

  const navigate = useCallback(
    (ticker: string) => {
      setQuery("");
      setOpen(false);
      setActiveIndex(-1);
      router.push(`/asx/${ticker}`);
    },
    [router]
  );

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && matches[activeIndex]) {
        navigate(matches[activeIndex].ticker);
      } else if (query.trim()) {
        const ticker = query.trim().split(" ")[0]?.toUpperCase();
        if (ticker) navigate(ticker);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  function highlightMatch(text: string) {
    if (!query) return text;
    const idx = text.toUpperCase().indexOf(query.toUpperCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-blue-400 font-semibold">
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center rounded-full border border-white/10 bg-ink-900/70 px-3 py-1.5 focus-within:border-blue-500/60 transition">
        {/* Magnifying glass SVG */}
        <svg
          className="h-4 w-4 shrink-0 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => query.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search ticker…"
          className="ml-2 w-36 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none lg:w-44"
        />
      </div>

      {/* Dropdown */}
      {open && matches.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-white/10 bg-ink-800 shadow-2xl overflow-hidden">
          {matches.map((stock, i) => (
            <button
              key={stock.ticker}
              type="button"
              onMouseDown={() => navigate(stock.ticker)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                i === activeIndex
                  ? "bg-blue-500/15 text-white"
                  : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span className="shrink-0 rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-xs font-bold text-blue-300">
                {highlightMatch(stock.ticker)}
              </span>
              <span className="truncate text-xs">
                {highlightMatch(stock.name)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
