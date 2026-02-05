"use client";

import { useEffect, useRef, useState } from "react";

type PriceChartProps = { ticker: string };

export default function PriceChart({ ticker }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.height = "100%";
    wrapper.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      symbol: `ASX:${ticker}`,
      interval: "D",
      timezone: "Australia/Sydney",
      theme: "dark",
      style: "3",
      locale: "en",
      backgroundColor: "rgba(11, 18, 32, 1)",
      gridColor: "rgba(255, 255, 255, 0.04)",
      hide_top_toolbar: false,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      withdateranges: true,
      hide_volume: false,
      hide_legend: true,
      enable_publishing: false,
      calendar: false,
      studies: [],
      support_host: "https://www.tradingview.com",
    });

    wrapper.appendChild(widgetDiv);
    wrapper.appendChild(script);
    container.appendChild(wrapper);

    return () => {
      container.innerHTML = "";
    };
  }, [ticker, mounted]);

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="font-display text-xl font-semibold mb-4">Price Chart</h2>
      <div
        ref={containerRef}
        id={`tradingview-widget-${ticker}`}
        style={{ height: "700px", width: "100%" }}
      >
        <div className="flex h-full items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <svg
              className="h-5 w-5 animate-spin text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M4 12a8 8 0 018-8"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-75"
              />
            </svg>
            Loading chart…
          </div>
        </div>
      </div>
    </div>
  );
}
