export type FAQItem = {
  question: string;
  answer: string;
};

export type Stock = {
  ticker: string;
  name: string;
  sector: string;
  marketCap: string;
  sharesOnIssue: string;
  ipoDate: string;
  website: string;
  description: string;
  analysis: string[];
  bullCase: string[];
  bearCase: string[];
  faqs: FAQItem[];
  performance1y: number;
  price: number;
  recentAnnouncements?: string[];
  keyMetrics?: {
    dividendYield: string;
    peRatio: string;
    debtToEquity: string;
  };
  dailyChange?: number;
  volume?: number;
  high52?: number;
  low52?: number;
  peRatio?: number;
  dividendYield?: number;
  eps?: number;
};

export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  content: string[];
};
