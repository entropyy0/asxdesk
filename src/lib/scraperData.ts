// Scraper data loaders — sentiment + announcements
// These JSON files are produced by external scraper bots and may not exist on first build.

let sentimentRaw: Record<string, unknown> = {};
let announcementsRaw: Record<string, unknown> = {};

try {
  sentimentRaw = require("@/data/sentiment.json");
} catch {
  // sentiment.json not yet generated — that's fine
}

try {
  announcementsRaw = require("@/data/announcements.json");
} catch {
  // announcements.json not yet generated — that's fine
}

export type SentimentPost = {
  source: string;
  summary: string;
  sentiment: string;
  date: string;
};

export type SentimentData = {
  score: number;
  label: "Bullish" | "Bearish" | "Mixed";
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
  recentPosts: SentimentPost[];
};

export type Announcement = {
  date: string;
  headline: string;
  category: string;
  priceSensitive: boolean;
  summary?: string;
};

export function getSentiment(ticker: string): SentimentData | null {
  const agg = (sentimentRaw as any)?.aggregates?.[ticker];
  if (!agg) return null;
  return {
    score: agg.score ?? 0,
    label: agg.label ?? "Mixed",
    bullish: agg.bullish ?? 0,
    bearish: agg.bearish ?? 0,
    neutral: agg.neutral ?? 0,
    total: agg.total ?? 0,
    recentPosts: agg.recentPosts || [],
  };
}

export function getAnnouncements(ticker: string): Announcement[] {
  const byTicker = (announcementsRaw as any)?.by_ticker?.[ticker];
  if (!byTicker || !Array.isArray(byTicker)) return [];
  return byTicker.slice(0, 5);
}
