import SearchBar from "@/components/SearchBar";
import StockCard from "@/components/StockCard";
import NewsCard from "@/components/NewsCard";
import { getFeaturedStocks, getTopPerformers } from "@/lib/utils";
import { newsArticles } from "@/lib/newsData";
import { OrganizationSchema } from "@/components/SEO";

export default function HomePage() {
  const featured = getFeaturedStocks(["BHP", "CBA", "CSL", "MQG"]);
  const topPerformers = getTopPerformers(4);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ASX Desk",
    url: "https://asxdesk.example.com",
    description:
      "Australia&apos;s AI-powered ASX stock research platform delivering instant analysis and sector insights.",
    sameAs: ["https://www.linkedin.com"],
    logo: "https://asxdesk.example.com/logo.png"
  };

  return (
    <div className="space-y-16">
      <OrganizationSchema />
      <section className="relative overflow-hidden rounded-3xl bg-hero-gradient px-6 py-16 shadow-glass">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-20 top-10 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
            Automated ASX Research
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Australia&apos;s AI-Powered ASX Stock Research Platform
          </h1>
          <p className="text-lg text-slate-300">
            Instant company profiles, real-time screening, and sentiment-aware
            market commentary built for Australian investors.
          </p>
          <SearchBar />
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 px-3 py-1">
              20 ASX stocks tracked
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1">
              AI analysis updated daily
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1">
              Built for long-tail SEO
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">Featured Coverage</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Updated this week
          </span>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {featured.map((stock) => (
            <StockCard key={stock.ticker} stock={stock} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-semibold">Latest News & Analysis</h2>
          <div className="grid gap-6">
            {newsArticles.slice(0, 3).map((article) => (
              <NewsCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">Trending Movers</h3>
            <p className="mt-2 text-sm text-slate-400">
              Most positive 1Y performance across the ASX coverage universe.
            </p>
            <div className="mt-4 space-y-4">
              {topPerformers.map((stock) => (
                <div
                  key={stock.ticker}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-ink-900/40 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{stock.ticker}</p>
                    <p className="text-xs text-slate-400">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300">A${stock.price.toFixed(2)}</p>
                    <p className="text-xs font-semibold text-emerald-400">
                      +{stock.performance1y.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">
              Institutional Signals
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• Bank momentum factor turned positive for the first time in 9 weeks.</li>
              <li>• Materials RSI cooled, offering potential mean reversion setups.</li>
              <li>• Defensive healthcare flows remain steady amid rate uncertainty.</li>
            </ul>
            <button className="mt-5 w-full rounded-full bg-blue-500 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
              Unlock Premium Signals
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
