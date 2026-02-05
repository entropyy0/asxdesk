import type { Metadata } from "next";
import NewsCard from "@/components/NewsCard";
import { OrganizationSchema } from "@/components/SEO";
import { newsArticles } from "@/lib/newsData";

export const metadata: Metadata = {
  title: "ASX News & AI Market Commentary",
  description:
    "AI-generated ASX market commentary, sector roundups, and stock of the week features.",
  alternates: {
    canonical: "https://asxdesk.example.com/news"
  }
};

export default function NewsPage() {
  const newsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "ASX Desk News",
    description:
      "AI-generated ASX market commentary, sector roundups, and announcement summaries."
  };

  return (
    <div className="space-y-10">
      <OrganizationSchema />
      <section className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">News</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          Market Commentary & Analysis
        </h1>
        <p className="mt-4 text-sm text-slate-300">
          Daily ASX briefings, sector roundups, and AI-powered stock features.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        {newsArticles.map((article) => (
          <NewsCard key={article.slug} article={article} />
        ))}
      </section>
    </div>
  );
}
