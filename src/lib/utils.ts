import stocks from "@/data/stocks.json";
import type { Stock } from "@/types";

export const allStocks = stocks as Stock[];

export const sectorList = Array.from(
  new Set(allStocks.map((stock) => stock.sector))
).sort();

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-AU").format(value);

export const getStockByTicker = (ticker: string) =>
  allStocks.find((stock) => stock.ticker.toLowerCase() === ticker.toLowerCase());

export const getStocksBySector = (sector: string) =>
  allStocks.filter(
    (stock) => stock.sector.toLowerCase() === sector.toLowerCase()
  );

export const getTopPerformers = (limit = 3) =>
  [...allStocks].sort((a, b) => b.performance1y - a.performance1y).slice(0, limit);

export const getWorstPerformers = (limit = 3) =>
  [...allStocks].sort((a, b) => a.performance1y - b.performance1y).slice(0, limit);

export const getFeaturedStocks = (tickers: string[]) =>
  tickers
    .map((ticker) => getStockByTicker(ticker))
    .filter((stock): stock is Stock => Boolean(stock));
