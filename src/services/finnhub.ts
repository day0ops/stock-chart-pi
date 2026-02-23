import type { OHLCData, TimeInterval, FinnhubCandle } from '../types';

const FINNHUB_API_BASE = 'https://finnhub.io/api/v1';

// Map our interval format to Finnhub resolution
const resolutionMap: Record<TimeInterval, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
  '1w': 'W',
};

// Parse Finnhub candle response to our format
function parseCandles(data: FinnhubCandle): OHLCData[] {
  if (data.s !== 'ok' || !data.t || data.t.length === 0) {
    return [];
  }

  return data.t.map((timestamp, index) => ({
    time: timestamp,
    open: data.o[index],
    high: data.h[index],
    low: data.l[index],
    close: data.c[index],
    volume: data.v[index],
  }));
}

// Calculate time range based on interval
function getTimeRange(interval: TimeInterval): { from: number; to: number } {
  const now = Math.floor(Date.now() / 1000);
  const to = now;

  // Calculate 'from' based on interval to get ~200 candles
  const candleSeconds: Record<TimeInterval, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
    '1w': 604800,
  };

  const from = now - candleSeconds[interval] * 200;
  return { from, to };
}

// Fetch historical candles
export async function fetchFinnhubCandles(
  symbol: string,
  interval: TimeInterval,
  apiKey: string
): Promise<OHLCData[]> {
  if (!apiKey) {
    throw new Error('Finnhub API key required for stock data');
  }

  const resolution = resolutionMap[interval];
  const { from, to } = getTimeRange(interval);

  const url = `${FINNHUB_API_BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }

  const data: FinnhubCandle = await response.json();

  if (data.s === 'no_data') {
    throw new Error(`No data available for ${symbol}`);
  }

  return parseCandles(data);
}

// Fetch current quote
export async function fetchFinnhubQuote(
  symbol: string,
  apiKey: string
): Promise<{
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
}> {
  if (!apiKey) {
    throw new Error('Finnhub API key required for stock data');
  }

  const url = `${FINNHUB_API_BASE}/quote?symbol=${symbol}&token=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    price: data.c, // Current price
    change: data.d, // Change
    changePercent: data.dp, // Change percent
    previousClose: data.pc, // Previous close
  };
}

// Validate API key by making a test request
export async function validateFinnhubKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;

  try {
    const url = `${FINNHUB_API_BASE}/quote?symbol=AAPL&token=${apiKey}`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}
