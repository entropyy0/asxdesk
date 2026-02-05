import type { Metadata } from "next";
import ComparePicker from "@/components/ComparePicker";

export const metadata: Metadata = {
  title: "Compare ASX Stocks | Side-by-Side Analysis",
  description:
    "Compare any two ASX stocks side by side. Analyse share prices, market cap, dividends, P/E ratios, and performance metrics to make smarter investment decisions.",
};

export default function CompareIndexPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-white/10 bg-ink-900/80 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          Compare
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          Compare ASX Stocks
        </h1>
        <p className="mt-4 text-sm text-slate-300">
          Compare any two ASX stocks side by side. Select your stocks below to
          see prices, market cap, dividends, performance, and key metrics
          head-to-head.
        </p>
      </section>
      <ComparePicker />
    </div>
  );
}
