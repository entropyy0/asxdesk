export const siteMetadata = {
  name: "ASX Desk",
  description:
    "Australia's AI-powered ASX stock research platform delivering instant analysis, sector insights, and SEO-optimized company profiles.",
  url: "https://asxdesk.com",
  twitterHandle: "@asxdesk"
};

export const buildStockTitle = (ticker: string, name: string) =>
  `${ticker} share price, analysis & company profile - ${name}`;

export const buildStockDescription = (ticker: string, name: string) =>
  `Latest ${ticker} share price overview, what ${name} does, bull and bear cases, and AI-powered analysis for ASX investors.`;

export const buildSectorTitle = (sector: string) =>
  `${sector} sector stocks on the ASX | trends & top performers`;

export const buildSectorDescription = (sector: string) =>
  `Explore ASX ${sector} stocks, sector trends, and leading performers with AI-generated insights.`;

export const buildNewsTitle = (title: string) => `${title} | ASX Desk News`;

export const buildCompareTitle = (ticker1: string, ticker2: string) =>
  `${ticker1} vs ${ticker2} comparison | ASX share analysis`;
