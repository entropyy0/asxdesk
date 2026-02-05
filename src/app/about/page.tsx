import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ASX Desk",
  description:
    "Learn about ASX Desk, the AI-powered ASX stock research platform with automated analysis, screening tools, and sector intelligence for Australian investors.",
  alternates: {
    canonical: "https://asxdesk.com/about"
  }
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">About</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          Built for ASX Investors
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          ASX Desk is an AI-powered research platform designed to make Australian
          equity research accessible to everyone. We deliver instant company profiles,
          sector intelligence, and data-driven screening tools — all focused
          exclusively on the ASX.
        </p>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-2xl font-semibold">Our Mission</h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          Quality equity research has traditionally been locked behind institutional
          paywalls or scattered across dozens of sources. ASX Desk exists to change
          that. Our goal is to provide clear, structured, and timely research on
          ASX-listed companies so that every investor — from first-timers to seasoned
          portfolio managers — can make more informed decisions.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-semibold">What We Offer</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-white">AI Research Engine</h3>
            <p className="mt-2 text-sm text-slate-400">
              Our models combine public filings, market data, and sector signals to
              generate structured bull/bear analyses, key metrics summaries, and
              sentiment commentary for every stock in our coverage universe.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-white">Stock Screener</h3>
            <p className="mt-2 text-sm text-slate-400">
              Filter ASX stocks by sector, market capitalisation, and performance.
              Quickly surface ideas that match your investment criteria without
              needing expensive terminal software.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-white">Sector Intelligence</h3>
            <p className="mt-2 text-sm text-slate-400">
              Dedicated sector pages track Materials, Financials, Health Care, Energy,
              and Technology themes with curated stock lists and rotation signals.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-white">Company Profiles</h3>
            <p className="mt-2 text-sm text-slate-400">
              Every covered stock has a detailed page with business description,
              key financial metrics, AI-generated analysis, and frequently asked
              questions — all kept up to date.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-white">Stock Comparisons</h3>
            <p className="mt-2 text-sm text-slate-400">
              Side-by-side comparisons of any two covered stocks let you weigh
              sector exposure, valuation metrics, and performance in a single view.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-ink-900/40 p-5">
            <h3 className="font-semibold text-white">Market Commentary</h3>
            <p className="mt-2 text-sm text-slate-400">
              Daily briefings, sector roundups, and stock-of-the-week features
              provide context on what&apos;s moving the ASX and why it matters.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-2xl font-semibold">How Our AI Works</h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          ASX Desk uses large language models combined with structured financial
          data to produce research-grade content. Our pipeline works in three stages:
        </p>
        <ol className="mt-4 list-inside list-decimal space-y-3 text-sm text-slate-300">
          <li>
            <span className="font-semibold text-white">Data ingestion</span> —
            We pull public filings, market data, and sector indicators from
            authoritative Australian sources.
          </li>
          <li>
            <span className="font-semibold text-white">Analysis generation</span> —
            Our AI models synthesise the data into structured outputs: bull/bear
            frameworks, key metric summaries, and plain-English commentary.
          </li>
          <li>
            <span className="font-semibold text-white">Quality review</span> —
            Outputs are checked against factual constraints and formatting rules
            before publication. We clearly label all AI-generated content.
          </li>
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Our models are not making predictions or recommendations — they are
          organising publicly available information into a format that saves
          investors time.
        </p>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display text-2xl font-semibold">Important Disclaimer</h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          ASX Desk provides general information only and does not take into account
          your objectives, financial situation, or needs. The content on this site
          is not financial advice and should not be relied upon for investment
          decisions. All analysis is AI-generated from publicly available data and
          may contain errors or omissions. You should consider obtaining advice from
          a licensed financial adviser before making any investment. Past performance
          is not indicative of future results.
        </p>
      </section>
    </div>
  );
}
