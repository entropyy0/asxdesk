import { MetadataRoute } from "next";
import { allStocks, sectorList } from "@/lib/utils";
import { newsArticles } from "@/lib/newsData";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://asxdesk.example.com";

  const staticPages = ["", "/news", "/about", "/screener"].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date()
  }));

  const stockPages = allStocks.map((stock) => ({
    url: `${baseUrl}/asx/${stock.ticker}`,
    lastModified: new Date()
  }));

  const sectorPages = sectorList.map((sector) => ({
    url: `${baseUrl}/sectors/${encodeURIComponent(sector.toLowerCase())}`,
    lastModified: new Date()
  }));

  const newsPages = newsArticles.map((article) => ({
    url: `${baseUrl}/news/${article.slug}`,
    lastModified: new Date(article.date)
  }));

  const comparePages: MetadataRoute.Sitemap = [];
  for (let i = 0; i < allStocks.length; i += 1) {
    for (let j = i + 1; j < allStocks.length; j += 1) {
      comparePages.push({
        url: `${baseUrl}/compare/${allStocks[i].ticker}-vs-${allStocks[j].ticker}`,
        lastModified: new Date()
      });
    }
  }

  return [...staticPages, ...stockPages, ...sectorPages, ...newsPages, ...comparePages];
}
