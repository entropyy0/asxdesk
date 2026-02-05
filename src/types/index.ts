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
};

export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  content: string[];
};
