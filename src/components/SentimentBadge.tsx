import type { SentimentData } from "@/lib/scraperData";

function sentimentColor(label: string) {
  switch (label) {
    case "Bullish":
      return {
        emoji: "🟢",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        bar: "bg-emerald-500",
      };
    case "Bearish":
      return {
        emoji: "🔴",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        text: "text-red-400",
        bar: "bg-red-500",
      };
    default:
      return {
        emoji: "🟡",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
        bar: "bg-yellow-500",
      };
  }
}

export default function SentimentBadge({
  sentiment,
}: {
  sentiment: SentimentData;
}) {
  const colors = sentimentColor(sentiment.label);

  // Score bar: map -1..+1 to 0..100%
  const barPercent = ((sentiment.score + 1) / 2) * 100;

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display text-lg font-semibold">Market Sentiment</h3>

      {/* Label badge */}
      <div className="mt-4 flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${colors.bg} ${colors.border} ${colors.text}`}
        >
          {colors.emoji} {sentiment.label}
        </span>
        <span className="text-xs text-slate-500">
          Score: {sentiment.score > 0 ? "+" : ""}
          {sentiment.score.toFixed(2)}
        </span>
      </div>

      {/* Score bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
          <span>Bearish</span>
          <span>Bullish</span>
        </div>
        <div className="relative mt-1 h-2 rounded-full bg-ink-900/60">
          {/* Center marker */}
          <div className="absolute left-1/2 top-0 h-full w-px bg-slate-600" />
          {/* Indicator */}
          <div
            className={`absolute top-0 h-full w-2 rounded-full ${colors.bar}`}
            style={{ left: `calc(${barPercent}% - 4px)` }}
          />
        </div>
      </div>

      {/* Post counts */}
      <div className="mt-4 flex gap-4 text-xs">
        <span className="text-emerald-400">
          ▲ {sentiment.bullish} bullish
        </span>
        <span className="text-red-400">▼ {sentiment.bearish} bearish</span>
        <span className="text-slate-500">{sentiment.neutral} neutral</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Based on {sentiment.total} social post{sentiment.total !== 1 ? "s" : ""}
      </p>

      {/* Recent post summaries */}
      {sentiment.recentPosts.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Recent mentions
          </p>
          {sentiment.recentPosts.slice(0, 3).map((post, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-ink-900/40 p-3 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-ink-800 px-2 py-0.5 text-[10px] text-slate-400">
                  {post.source}
                </span>
                <span className="text-slate-500">{post.date}</span>
                <span
                  className={
                    post.sentiment === "bullish"
                      ? "text-emerald-400"
                      : post.sentiment === "bearish"
                        ? "text-red-400"
                        : "text-slate-400"
                  }
                >
                  {post.sentiment === "bullish"
                    ? "▲"
                    : post.sentiment === "bearish"
                      ? "▼"
                      : "—"}
                </span>
              </div>
              <p className="mt-1.5 text-slate-300">{post.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
