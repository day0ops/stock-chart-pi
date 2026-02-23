import type { OHLCData, TimeInterval } from '../types';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';

// Map our interval format to Binance format
const intervalMap: Record<TimeInterval, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
};

// Parse Binance kline array to our format
function parseKline(kline: (string | number)[]): OHLCData {
  return {
    time: Math.floor(Number(kline[0]) / 1000), // Convert ms to seconds
    open: parseFloat(String(kline[1])),
    high: parseFloat(String(kline[2])),
    low: parseFloat(String(kline[3])),
    close: parseFloat(String(kline[4])),
    volume: parseFloat(String(kline[5])),
  };
}

// Fetch historical klines (candlestick data)
export async function fetchBinanceKlines(
  symbol: string,
  interval: TimeInterval,
  limit: number = 200
): Promise<OHLCData[]> {
  const binanceInterval = intervalMap[interval];
  const url = `${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data: (string | number)[][] = await response.json();
  return data.map(parseKline);
}

// Fetch 24hr ticker for price change data
export async function fetchBinance24hrTicker(symbol: string): Promise<{
  price: number;
  change24h: number;
  changePercent24h: number;
}> {
  const url = `${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    price: parseFloat(data.lastPrice),
    change24h: parseFloat(data.priceChange),
    changePercent24h: parseFloat(data.priceChangePercent),
  };
}

// Create WebSocket connection for real-time kline updates
export function createBinanceKlineStream(
  symbol: string,
  interval: TimeInterval,
  onMessage: (kline: OHLCData) => void,
  onError?: (error: Event) => void
): WebSocket {
  const binanceInterval = intervalMap[interval];
  const streamName = `${symbol.toLowerCase()}@kline_${binanceInterval}`;
  const ws = new WebSocket(`${BINANCE_WS_BASE}/${streamName}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.k) {
      const kline: OHLCData = {
        time: Math.floor(data.k.t / 1000),
        open: parseFloat(data.k.o),
        high: parseFloat(data.k.h),
        low: parseFloat(data.k.l),
        close: parseFloat(data.k.c),
        volume: parseFloat(data.k.v),
      };
      onMessage(kline);
    }
  };

  ws.onerror = (error) => {
    console.error('Binance WebSocket error:', error);
    onError?.(error);
  };

  return ws;
}

// Fetch current price only
export async function fetchBinancePrice(symbol: string): Promise<number> {
  const url = `${BINANCE_API_BASE}/ticker/price?symbol=${symbol}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const data = await response.json();
  return parseFloat(data.price);
}
