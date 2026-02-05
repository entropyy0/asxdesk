import type { Announcement } from "@/lib/scraperData";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AnnouncementsFeed({
  announcements,
}: {
  announcements: Announcement[];
}) {
  if (announcements.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display text-lg font-semibold">
        Recent Announcements
      </h3>
      <div className="mt-4 space-y-3 text-sm text-slate-300">
        {announcements.map((ann, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-ink-900/40 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-white">{ann.headline}</p>
              {ann.priceSensitive && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400"
                  title="Price sensitive"
                >
                  🚨 Price Sensitive
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>{formatDate(ann.date)}</span>
              {ann.category && (
                <span className="rounded-full border border-white/10 bg-ink-800 px-2 py-0.5">
                  {ann.category}
                </span>
              )}
            </div>
            {ann.summary && (
              <p className="mt-2 text-xs text-slate-400">{ann.summary}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
