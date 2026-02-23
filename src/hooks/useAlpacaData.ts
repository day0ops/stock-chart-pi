import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimeInterval, ChartDataState } from '../types';
import { fetchAlpacaCandles, fetchAlpacaQuote } from '../services/alpaca';

interface UseAlpacaDataOptions {
  symbol: string;
  interval: TimeInterval;
  refreshSeconds: number;
  apiKey: string;
  apiSecret: string;
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

export function useAlpacaData({
  symbol,
  interval,
  refreshSeconds,
  apiKey,
  apiSecret,
}: UseAlpacaDataOptions): ChartDataState {
  const [state, setState] = useState<ChartDataState>(initialState);
  const intervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!apiKey || !apiSecret) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Alpaca API credentials required. Add them in settings.',
      }));
      return;
    }

    try {
      const [candles, quote] = await Promise.all([
        fetchAlpacaCandles(symbol, interval, apiKey, apiSecret),
        fetchAlpacaQuote(symbol, apiKey, apiSecret),
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
  }, [symbol, interval, apiKey, apiSecret]);

  useEffect(() => {
    setState(initialState);
    fetchData();

    intervalRef.current = window.setInterval(fetchData, refreshSeconds * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [symbol, interval, refreshSeconds, fetchData]);

  return state;
}
