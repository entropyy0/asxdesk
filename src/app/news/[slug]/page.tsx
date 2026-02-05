export const dynamicParams = false;
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleSchema } from "@/components/SEO";
import { newsArticles } from "@/lib/newsData";
import { buildNewsTitle } from "@/lib/seo";

export const revalidate = 3600;

type NewsDetailProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return newsArticles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({ params }: NewsDetailProps): Metadata {
  const article = newsArticles.find((item) => item.slug === params.slug);
  if (!article) return {};

  const title = buildNewsTitle(article.title);
  return {
    title,
    description: article.excerpt,
    alternates: {
      canonical: `https://asxdesk.com/news/${article.slug}`
    },
    openGraph: {
      title,
      description: article.excerpt,
      url: `https://asxdesk.com/news/${article.slug}`,
      type: "article"
    }
  };
}

export default function NewsDetailPage({ params }: NewsDetailProps) {
  const article = newsArticles.find((item) => item.slug === params.slug);
  if (!article) notFound();

  // Get related articles (same category, excluding current)
  const related = newsArticles
    .filter(
      (a) => a.slug !== article.slug && a.category === article.category
    )
    .slice(0, 3);

  // If not enough same-category, fill with other recent articles
  const otherArticles =
    related.length < 3
      ? newsArticles
          .filter(
            (a) =>
              a.slug !== article.slug &&
              !related.some((r) => r.slug === a.slug)
          )
          .slice(0, 3 - related.length)
      : [];

  const relatedArticles = [...related, ...otherArticles];

  return (
    <div className="space-y-10">
      <ArticleSchema
        title={article.title}
        date={article.date}
        description={article.excerpt}
      />

      {/* Back navigation */}
      <div>
        <Link
          href="/news"
          className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to News
        </Link>
      </div>

      {/* Article header */}
      <section className="rounded-2xl border border-white/10 bg-ink-800/60 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          {article.category}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {article.title}
        </h1>
        <p className="mt-3 text-sm text-slate-400">{article.date}</p>
        <p className="mt-4 text-sm text-slate-300">{article.excerpt}</p>
      </section>

      {/* Article content */}
      <section className="rounded-2xl border border-white/10 bg-ink-800/60 p-6">
        <div className="space-y-4 text-sm leading-relaxed text-slate-300">
          {article.content.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-white">
            Related Articles
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedArticles.map((related) => (
              <Link
                key={related.slug}
                href={`/news/${related.slug}`}
                className="group rounded-2xl border border-white/10 bg-ink-800/60 p-4 transition hover:-translate-y-1 hover:border-blue-500/40"
              >
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {related.category}
                </p>
                <h3 className="mt-2 font-display text-sm font-semibold text-white">
                  {related.title}
                </h3>
                <p className="mt-2 text-xs text-slate-400">{related.date}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
