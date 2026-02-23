import type { OHLCData } from '../types';
import type { CandlestickData, LineData, Time } from 'lightweight-charts';

// Convert OHLC data to TradingView candlestick format
export function toChartCandlestickData(data: OHLCData[]): CandlestickData<Time>[] {
  return data.map((item) => ({
    time: item.time as Time,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
  }));
}

// Convert OHLC data to TradingView line format (uses close price)
export function toChartLineData(data: OHLCData[]): LineData<Time>[] {
  return data.map((item) => ({
    time: item.time as Time,
    value: item.close,
  }));
}

// Format price with appropriate decimal places
export function formatPrice(price: number, symbol: string): string {
  // Crypto pairs typically have more decimal places
  if (symbol.endsWith('USDT') || symbol.endsWith('USD') || symbol.endsWith('BUSD')) {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  }
  // Stocks typically use 2 decimal places
  return price.toFixed(2);
}

// Format percent change
export function formatPercentChange(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

// Format timestamp to readable time
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format timestamp to readable date/time
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Calculate 24h change from OHLC data if not provided
export function calculate24hChange(data: OHLCData[]): {
  change: number;
  changePercent: number;
} {
  if (data.length < 2) {
    return { change: 0, changePercent: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;

  // Find the candle closest to 24h ago
  const oldCandle = data.find((d) => d.time >= oneDayAgo) || data[0];
  const currentPrice = data[data.length - 1].close;
  const oldPrice = oldCandle.open;

  const change = currentPrice - oldPrice;
  const changePercent = (change / oldPrice) * 100;

  return { change, changePercent };
}

// Get display name for symbol
export function getDisplaySymbol(symbol: string, type: 'crypto' | 'stock'): string {
  if (type === 'crypto') {
    // Remove USDT/USD/BUSD suffix for display
    return symbol
      .replace(/USDT$/, '')
      .replace(/USD$/, '')
      .replace(/BUSD$/, '');
  }
  return symbol;
}
