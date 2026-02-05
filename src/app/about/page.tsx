import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ASX Desk",
  description:
    "Learn about ASX Desk, the AI-powered ASX stock research platform with automated analysis and screening tools.",
  alternates: {
    canonical: "https://asxdesk.example.com/about"
  }
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">About</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          Built for ASX investors
        </h1>
        <p className="mt-4 text-sm text-slate-300">
          ASX Desk is an AI-powered research platform delivering instant company
          profiles, sector trend intelligence, and long-tail content built for
          Australian investors.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
            <h3 className="font-semibold text-white">AI Research Engine</h3>
            <p className="mt-2 text-sm text-slate-400">
              We combine public filings, sector data, and market signals to generate
              actionable stock insights.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
            <h3 className="font-semibold text-white">SEO-first Coverage</h3>
            <p className="mt-2 text-sm text-slate-400">
              Long-tail search queries power our content model, helping investors find
              research faster.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-2xl font-semibold">Disclaimer</h2>
        <p className="mt-4 text-sm text-slate-300">
          ASX Desk provides general information only and does not take into account
          your objectives, financial situation, or needs. The content is not financial
          advice and should not be relied upon for investment decisions. You should
          consider obtaining advice from a licensed financial adviser before making
          any investment.
        </p>
      </section>
    </div>
  );
}
