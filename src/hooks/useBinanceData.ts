import { useState, useEffect, useCallback, useRef } from 'react';
import type { OHLCData, TimeInterval, ChartDataState } from '../types';
import { fetchBinanceKlines, fetchBinance24hrTicker, createBinanceKlineStream } from '../services/binance';

interface UseBinanceDataOptions {
  symbol: string;
  interval: TimeInterval;
  refreshSeconds: number;
  useWebSocket?: boolean;
}

const initialState: ChartDataState = {
  ohlc: [],
  currentPrice: 0,
  change24h: 0,
  changePercent24h: 0,
  loading: true,
  error: null,
  lastUpdated: 0,
};

export function useBinanceData({
  symbol,
  interval,
  refreshSeconds,
  useWebSocket = false,
}: UseBinanceDataOptions): ChartDataState {
  const [state, setState] = useState<ChartDataState>(initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Fetch all data (klines + 24hr ticker)
  const fetchData = useCallback(async () => {
    try {
      const [klines, ticker] = await Promise.all([
        fetchBinanceKlines(symbol, interval),
        fetchBinance24hrTicker(symbol),
      ]);

      setState({
        ohlc: klines,
        currentPrice: ticker.price,
        change24h: ticker.change24h,
        changePercent24h: ticker.changePercent24h,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      }));
    }
  }, [symbol, interval]);

  // Handle WebSocket kline updates
  const handleKlineUpdate = useCallback((kline: OHLCData) => {
    setState((prev) => {
      const newOhlc = [...prev.ohlc];
      const lastIndex = newOhlc.length - 1;

      // Update or append the kline
      if (lastIndex >= 0 && newOhlc[lastIndex].time === kline.time) {
        newOhlc[lastIndex] = kline;
      } else if (lastIndex >= 0 && kline.time > newOhlc[lastIndex].time) {
        newOhlc.push(kline);
        // Keep only last 200 candles
        if (newOhlc.length > 200) {
          newOhlc.shift();
        }
      }

      return {
        ...prev,
        ohlc: newOhlc,
        currentPrice: kline.close,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  // Setup effect
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Setup WebSocket for real-time updates if enabled
    if (useWebSocket) {
      wsRef.current = createBinanceKlineStream(
        symbol,
        interval,
        handleKlineUpdate,
        () => {
          // On WebSocket error, fall back to polling
          setState((prev) => ({
            ...prev,
            error: 'WebSocket disconnected, using polling',
          }));
        }
      );
    }

    // Setup polling interval
    intervalRef.current = window.setInterval(fetchData, refreshSeconds * 1000);

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [symbol, interval, refreshSeconds, useWebSocket, fetchData, handleKlineUpdate]);

  return state;
}
