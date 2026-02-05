import Link from "next/link";
import type { NewsArticle } from "@/types";

export default function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group rounded-2xl border border-white/10 bg-ink-800/60 p-5 transition hover:-translate-y-1 hover:border-blue-500/40"
    >
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="uppercase tracking-[0.2em]">{article.category}</span>
        <span>{article.date}</span>
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold text-white">
        {article.title}
      </h3>
      <p className="mt-3 text-sm text-slate-400">
        {article.excerpt}
      </p>
      <div className="mt-4 text-xs text-blue-300">Read analysis</div>
    </Link>
  );
}
