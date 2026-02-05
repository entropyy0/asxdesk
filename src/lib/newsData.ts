import type { NewsArticle } from "@/types";

let articles: NewsArticle[] = [];
try {
  articles = require("@/data/news.json");
} catch {
  articles = [];
}

export const newsArticles: NewsArticle[] = articles;
