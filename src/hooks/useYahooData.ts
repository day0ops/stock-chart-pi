import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimeInterval, ChartDataState } from '../types';
import { fetchYahooCandles, fetchYahooQuote } from '../services/yahoo';

interface UseYahooDataOptions {
  symbol: string;
  interval: TimeInterval;
  refreshSeconds: number;
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

export function useYahooData({
  symbol,
  interval,
  refreshSeconds,
}: UseYahooDataOptions): ChartDataState {
  const [state, setState] = useState<ChartDataState>(initialState);
  const intervalRef = useRef<number | null>(null);

  // Fetch all data (candles + quote)
  const fetchData = useCallback(async () => {
    try {
      const [candles, quote] = await Promise.all([
        fetchYahooCandles(symbol, interval),
        fetchYahooQuote(symbol),
      ]);

      setState({
        ohlc: candles,
        currentPrice: quote.price,
        change24h: quote.change,
        changePercent24h: quote.changePercent,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock data',
      }));
    }
  }, [symbol, interval]);

  // Setup effect
  useEffect(() => {
    // Reset state when symbol changes
    setState(initialState);

    // Initial fetch
    fetchData();

    // Setup polling interval
    intervalRef.current = window.setInterval(fetchData, refreshSeconds * 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [symbol, interval, refreshSeconds, fetchData]);

  return state;
}
