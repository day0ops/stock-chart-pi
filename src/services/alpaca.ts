// Alpaca Markets API Service
// Requires API key and secret from alpaca.markets (free account)

import type { OHLCData, TimeInterval } from '../types';

// Map our interval format to Alpaca timeframe
const timeframeMap: Record<TimeInterval, string> = {
  '1m': '1Min',
  '5m': '5Min',
  '15m': '15Min',
  '1h': '1Hour',
  '4h': '4Hour',
  '1d': '1Day',
  '1w': '1Week',
};

// Calculate start date based on interval to get ~200 candles
function getStartDate(interval: TimeInterval): string {
  const now = new Date();
  const daysBack: Record<TimeInterval, number> = {
    '1m': 1,       // 1 day of 1-min data
    '5m': 2,       // 2 days of 5-min data
    '15m': 5,      // 5 days of 15-min data
    '1h': 14,      // 2 weeks of hourly data
    '4h': 60,      // ~2 months of 4h data
    '1d': 365,     // 1 year of daily data
    '1w': 730,     // 2 years of weekly data
  };

  const startDate = new Date(now.getTime() - daysBack[interval] * 24 * 60 * 60 * 1000);
  return startDate.toISOString();
}

interface AlpacaBar {
  t: string;  // Timestamp
  o: number;  // Open
  h: number;  // High
  l: number;  // Low
  c: number;  // Close
  v: number;  // Volume
}

interface AlpacaBarsResponse {
  bars: AlpacaBar[];
  symbol: string;
  next_page_token?: string;
}

// Fetch historical bars from Alpaca
export async function fetchAlpacaCandles(
  symbol: string,
  interval: TimeInterval,
  apiKey: string,
  apiSecret: string
): Promise<OHLCData[]> {
  if (!apiKey || !apiSecret) {
    throw new Error('Alpaca API credentials required');
  }

  const timeframe = timeframeMap[interval];
  const start = getStartDate(interval);

  const url = new URL(`https://data.alpaca.markets/v2/stocks/${symbol}/bars`);
  url.searchParams.set('timeframe', timeframe);
  url.searchParams.set('start', start);
  url.searchParams.set('limit', '200');
  url.searchParams.set('adjustment', 'split');
  url.searchParams.set('feed', 'iex'); // Use IEX for free tier

  const response = await fetch(url.toString(), {
    headers: {
      'APCA-API-KEY-ID': apiKey,
      'APCA-API-SECRET-KEY': apiSecret,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid Alpaca API credentials');
    }
    if (response.status === 404) {
      throw new Error(`Symbol ${symbol} not found`);
    }
    throw new Error(`Alpaca API error: ${response.status}`);
  }

  const data: AlpacaBarsResponse = await response.json();

  if (!data.bars || data.bars.length === 0) {
    throw new Error(`No data available for ${symbol}`);
  }

  return data.bars.map((bar) => ({
    time: Math.floor(new Date(bar.t).getTime() / 1000),
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));
}

// Fetch current quote from Alpaca
export async function fetchAlpacaQuote(
  symbol: string,
  apiKey: string,
  apiSecret: string
): Promise<{
  price: number;
  change: number;
  changePercent: number;
}> {
  if (!apiKey || !apiSecret) {
    throw new Error('Alpaca API credentials required');
  }

  // Fetch latest trade and previous day bar for change calculation
  const [tradeResponse, barsResponse] = await Promise.all([
    fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/trades/latest?feed=iex`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    }),
    fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=1Day&limit=2&feed=iex`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    }),
  ]);

  if (!tradeResponse.ok || !barsResponse.ok) {
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }

  const tradeData = await tradeResponse.json();
  const barsData = await barsResponse.json();

  const currentPrice = tradeData.trade?.p || 0;
  let previousClose = currentPrice;

  if (barsData.bars && barsData.bars.length >= 2) {
    previousClose = barsData.bars[barsData.bars.length - 2].c;
  } else if (barsData.bars && barsData.bars.length === 1) {
    previousClose = barsData.bars[0].o;
  }

  const change = currentPrice - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  return {
    price: currentPrice,
    change,
    changePercent,
  };
}

// Validate Alpaca API credentials
export async function validateAlpacaCredentials(
  apiKey: string,
  apiSecret: string
): Promise<boolean> {
  try {
    const response = await fetch('https://data.alpaca.markets/v2/stocks/AAPL/trades/latest?feed=iex', {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
