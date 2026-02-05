import { StockSchema, FAQSchema } from "@/components/SEO";
export const dynamicParams = false;
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AnalysisSection from "@/components/AnalysisSection";
import BrokerCTA from "@/components/BrokerCTA";
import MetricsPanel from "@/components/MetricsPanel";
import StockCard from "@/components/StockCard";
import SEO from "@/components/SEO";
import { buildStockDescription, buildStockTitle } from "@/lib/seo";
import { allStocks, getStockByTicker, getStocksBySector } from "@/lib/utils";

export const revalidate = 3600;

type StockPageProps = {
  params: { ticker: string };
};

export function generateStaticParams() {
  return allStocks.map((stock) => ({ ticker: stock.ticker }));
}

export function generateMetadata({ params }: StockPageProps): Metadata {
  const stock = getStockByTicker(params.ticker);
  if (!stock) return {};
  const title = buildStockTitle(stock.ticker, stock.name);
  const description = buildStockDescription(stock.ticker, stock.name);

  return {
    title,
    description,
    alternates: {
      canonical: `https://asxdesk.example.com/asx/${stock.ticker}`
    },
    openGraph: {
      title,
      description,
      url: `https://asxdesk.example.com/asx/${stock.ticker}`,
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default function StockPage({ params }: StockPageProps) {
  const stock = getStockByTicker(params.ticker);
  if (!stock) notFound();

  const related = getStocksBySector(stock.sector).filter(
    (item) => item.ticker !== stock.ticker
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: stock.faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <div className="space-y-12">
      <SEO jsonLd={faqJsonLd} id={`faq-${stock.ticker}`} />
      <section className="grid gap-8 lg:grid-cols-[1.6fr_0.8fr]">
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
              {stock.sector}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold">
              {stock.name} ({stock.ticker})
            </h1>
            <p className="mt-4 text-sm text-slate-300">{stock.description}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
                <p className="text-xs text-slate-500">Market Cap</p>
                <p className="mt-2 text-lg font-semibold">{stock.marketCap}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
                <p className="text-xs text-slate-500">Shares on Issue</p>
                <p className="mt-2 text-lg font-semibold">
                  {stock.sharesOnIssue}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400">
              <a
                href={stock.website}
                className="rounded-full border border-white/10 px-3 py-1"
              >
                Company Website
              </a>
              <span className="rounded-full border border-white/10 px-3 py-1">
                AI coverage updated hourly
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                Data from ASX filings
              </span>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-display text-xl font-semibold">
              Price Chart (TradingView)
            </h2>
            <div className="mt-4 h-72 rounded-xl border border-dashed border-blue-500/30 bg-ink-900/40 p-6 text-sm text-slate-400">
              Embed TradingView widget here for {stock.ticker}. The production
              version should load live pricing and technical indicators.
            </div>
          </div>
          <AnalysisSection stock={stock} />
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">Recent Announcements</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
                <p className="font-semibold">Quarterly Activities Report</p>
                <p className="text-xs text-slate-500">
                  Highlights production updates, capital allocation priorities, and
                  FY guidance commentary.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-ink-900/40 p-4">
                <p className="font-semibold">Investor Presentation</p>
                <p className="text-xs text-slate-500">
                  Strategic outlook with market positioning and growth pipeline.
                </p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">FAQs</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {stock.faqs.map((item) => (
                <div key={item.question} className="border-b border-white/5 pb-3">
                  <p className="font-semibold text-white">{item.question}</p>
                  <p className="text-slate-400">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <MetricsPanel stock={stock} />
          <BrokerCTA />
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold">Related Stocks</h3>
            <div className="mt-4 space-y-4">
              {related.slice(0, 3).map((item) => (
                <StockCard key={item.ticker} stock={item} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
