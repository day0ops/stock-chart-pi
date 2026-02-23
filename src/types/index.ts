// Chart configuration types
export type ChartType = 'candlestick' | 'line';
export type AssetType = 'crypto' | 'stock';
export type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface ChartConfig {
  id: string;
  symbol: string;
  type: AssetType;
  chartType: ChartType;
  interval: TimeInterval;
  refreshSeconds: number;
}

export interface LayoutConfig {
  columns: number;
  rows: number;
}

export interface DashboardConfig {
  layout: LayoutConfig;
  charts: ChartConfig[];
  finnhubApiKey: string;
}

// OHLC data format for charts
export interface OHLCData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Real-time price data
export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  lastUpdated: number;
}

// Chart data state
export interface ChartDataState {
  ohlc: OHLCData[];
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

// Dashboard state
export interface DashboardState {
  config: DashboardConfig;
  chartData: Record<string, ChartDataState>;
  isConfigOpen: boolean;
}

// Action types for reducer
export type DashboardAction =
  | { type: 'SET_CONFIG'; payload: DashboardConfig }
  | { type: 'UPDATE_LAYOUT'; payload: LayoutConfig }
  | { type: 'ADD_CHART'; payload: ChartConfig }
  | { type: 'REMOVE_CHART'; payload: string }
  | { type: 'UPDATE_CHART'; payload: ChartConfig }
  | { type: 'SET_CHART_DATA'; payload: { id: string; data: Partial<ChartDataState> } }
  | { type: 'TOGGLE_CONFIG' }
  | { type: 'SET_FINNHUB_KEY'; payload: string };

// Binance kline response format
export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

// Finnhub candle response format
export interface FinnhubCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string;   // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}
