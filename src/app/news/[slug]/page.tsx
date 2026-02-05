export const dynamicParams = false;
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SEO from "@/components/SEO";
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
      canonical: `https://asxdesk.example.com/news/${article.slug}`
    },
    openGraph: {
      title,
      description: article.excerpt,
      url: `https://asxdesk.example.com/news/${article.slug}`,
      type: "article"
    }
  };
}

export default function NewsDetailPage({ params }: NewsDetailProps) {
  const article = newsArticles.find((item) => item.slug === params.slug);
  if (!article) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Organization",
      name: "ASX Desk"
    }
  };

  return (
    <div className="space-y-10">
      <SEO jsonLd={articleJsonLd} id={`article-${article.slug}`} />
      <section className="glass-card rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-300">
          {article.category}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {article.title}
        </h1>
        <p className="mt-3 text-sm text-slate-400">{article.date}</p>
        <p className="mt-4 text-sm text-slate-300">{article.excerpt}</p>
      </section>
      <section className="glass-card prose-dark rounded-2xl p-6">
        <div className="space-y-4 text-sm text-slate-300">
          {article.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
