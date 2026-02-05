import { MetadataRoute } from "next";
import { allStocks, sectorList } from "@/lib/utils";
import { newsArticles } from "@/lib/newsData";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://asxdesk.com";
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/screener`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/news`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const stockPages: MetadataRoute.Sitemap = allStocks.map((stock) => ({
    url: `${base}/asx/${stock.ticker}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  const sectorPages: MetadataRoute.Sitemap = sectorList.map((sector) => ({
    url: `${base}/sectors/${encodeURIComponent(sector.toLowerCase())}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const newsPages: MetadataRoute.Sitemap = newsArticles.map((article) => ({
    url: `${base}/news/${article.slug}`,
    lastModified: article.date,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Only include pre-built compare pages (top 10 popular tickers)
  const popular = ["BHP", "CBA", "CSL", "FMG", "RIO", "NAB", "WBC", "ANZ", "MQG", "WDS"];
  const comparePages: MetadataRoute.Sitemap = [];
  for (let i = 0; i < popular.length; i++) {
    for (let j = i + 1; j < popular.length; j++) {
      comparePages.push({
        url: `${base}/compare/${popular[i]}-vs-${popular[j]}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      });
    }
  }

  return [...staticPages, ...stockPages, ...sectorPages, ...newsPages, ...comparePages];
}
