// Yahoo Finance API Service (Free, no API key required)
// Uses the unofficial Yahoo Finance API via query endpoints

import type { OHLCData, TimeInterval } from '../types';

// Map our interval format to Yahoo Finance interval
const intervalMap: Record<TimeInterval, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '1h', // Yahoo doesn't have 4h, use 1h
  '1d': '1d',
  '1w': '1wk',
};

// Map interval to appropriate range
const rangeMap: Record<TimeInterval, string> = {
  '1m': '1d',      // 1 day of 1-min data
  '5m': '5d',      // 5 days of 5-min data
  '15m': '5d',     // 5 days of 15-min data
  '1h': '1mo',     // 1 month of hourly data
  '4h': '3mo',     // 3 months (using 1h interval)
  '1d': '1y',      // 1 year of daily data
  '1w': '5y',      // 5 years of weekly data
};

interface YahooChartResult {
  meta: {
    symbol: string;
    regularMarketPrice: number;
    previousClose: number;
  };
  timestamp: number[];
  indicators: {
    quote: [{
      open: (number | null)[];
      high: (number | null)[];
      low: (number | null)[];
      close: (number | null)[];
      volume: (number | null)[];
    }];
  };
}

// Fetch historical data using Yahoo Finance chart API
export async function fetchYahooCandles(
  symbol: string,
  interval: TimeInterval
): Promise<OHLCData[]> {
  const yahooInterval = intervalMap[interval];
  const range = rangeMap[interval];

  // Use a CORS proxy or the direct Yahoo API
  // Yahoo Finance allows CORS for chart data
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${yahooInterval}&range=${range}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.chart.error) {
      throw new Error(data.chart.error.description || 'Unknown error');
    }

    const result: YahooChartResult = data.chart.result[0];

    if (!result.timestamp || result.timestamp.length === 0) {
      throw new Error('No data available');
    }

    const quotes = result.indicators.quote[0];
    const ohlcData: OHLCData[] = [];

    for (let i = 0; i < result.timestamp.length; i++) {
      // Skip null values
      if (
        quotes.open[i] !== null &&
        quotes.high[i] !== null &&
        quotes.low[i] !== null &&
        quotes.close[i] !== null
      ) {
        ohlcData.push({
          time: result.timestamp[i],
          open: quotes.open[i]!,
          high: quotes.high[i]!,
          low: quotes.low[i]!,
          close: quotes.close[i]!,
          volume: quotes.volume[i] || 0,
        });
      }
    }

    return ohlcData;
  } catch (error) {
    // If direct call fails, try with CORS proxy
    return fetchYahooCandlesWithProxy(symbol, interval);
  }
}

// Fallback using a CORS proxy (for development)
async function fetchYahooCandlesWithProxy(
  symbol: string,
  interval: TimeInterval
): Promise<OHLCData[]> {
  const yahooInterval = intervalMap[interval];
  const range = rangeMap[interval];

  // Use allorigins.win as a CORS proxy
  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${yahooInterval}&range=${range}`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch stock data for ${symbol}`);
  }

  const data = await response.json();

  if (data.chart.error) {
    throw new Error(data.chart.error.description || `No data for ${symbol}`);
  }

  const result: YahooChartResult = data.chart.result[0];

  if (!result.timestamp || result.timestamp.length === 0) {
    throw new Error('No data available');
  }

  const quotes = result.indicators.quote[0];
  const ohlcData: OHLCData[] = [];

  for (let i = 0; i < result.timestamp.length; i++) {
    if (
      quotes.open[i] !== null &&
      quotes.high[i] !== null &&
      quotes.low[i] !== null &&
      quotes.close[i] !== null
    ) {
      ohlcData.push({
        time: result.timestamp[i],
        open: quotes.open[i]!,
        high: quotes.high[i]!,
        low: quotes.low[i]!,
        close: quotes.close[i]!,
        volume: quotes.volume[i] || 0,
      });
    }
  }

  return ohlcData;
}

// Fetch current quote
export async function fetchYahooQuote(symbol: string): Promise<{
  price: number;
  change: number;
  changePercent: number;
}> {
  // First try to get from chart metadata (more reliable)
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      const meta = data.chart.result[0].meta;

      return {
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      };
    }
  } catch {
    // Try with proxy
  }

  // Fallback with proxy
  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }

  const data = await response.json();
  const meta = data.chart.result[0].meta;

  return {
    price: meta.regularMarketPrice,
    change: meta.regularMarketPrice - meta.previousClose,
    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
  };
}

// Validate if a symbol exists on Yahoo Finance
export async function validateYahooSymbol(symbol: string): Promise<boolean> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      return !data.chart.error;
    }

    // Try with proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const proxyResponse = await fetch(proxyUrl);

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      return !data.chart.error;
    }

    return false;
  } catch {
    return false;
  }
}
