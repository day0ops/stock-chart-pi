import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimeInterval, ChartDataState } from '../types';
import { fetchFinnhubCandles, fetchFinnhubQuote } from '../services/finnhub';

interface UseFinnhubDataOptions {
  symbol: string;
  interval: TimeInterval;
  refreshSeconds: number;
  apiKey: string;
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

export function useFinnhubData({
  symbol,
  interval,
  refreshSeconds,
  apiKey,
}: UseFinnhubDataOptions): ChartDataState {
  const [state, setState] = useState<ChartDataState>(initialState);
  const intervalRef = useRef<number | null>(null);

  // Fetch all data (candles + quote)
  const fetchData = useCallback(async () => {
    if (!apiKey) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Finnhub API key required. Add it in settings.',
      }));
      return;
    }

    try {
      const [candles, quote] = await Promise.all([
        fetchFinnhubCandles(symbol, interval, apiKey),
        fetchFinnhubQuote(symbol, apiKey),
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
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      }));
    }
  }, [symbol, interval, apiKey]);

  // Setup effect
  useEffect(() => {
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
  }, [symbol, interval, refreshSeconds, apiKey, fetchData]);

  return state;
}
