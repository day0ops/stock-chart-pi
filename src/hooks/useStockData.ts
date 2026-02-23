import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimeInterval, ChartDataState } from '../types';
import { fetchYahooCandles, fetchYahooQuote } from '../services/yahoo';
import { fetchAlpacaCandles, fetchAlpacaQuote } from '../services/alpaca';

interface UseStockDataOptions {
  symbol: string;
  interval: TimeInterval;
  refreshSeconds: number;
  alpacaApiKey: string;
  alpacaApiSecret: string;
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

export function useStockData({
  symbol,
  interval,
  refreshSeconds,
  alpacaApiKey,
  alpacaApiSecret,
}: UseStockDataOptions): ChartDataState {
  const [state, setState] = useState<ChartDataState>(initialState);
  const intervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    // Try Yahoo Finance first
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
      return;
    } catch (yahooError) {
      console.warn(`Yahoo Finance failed for ${symbol}, trying Alpaca...`, yahooError);
    }

    // Fallback to Alpaca if credentials are available
    if (alpacaApiKey && alpacaApiSecret) {
      try {
        const [candles, quote] = await Promise.all([
          fetchAlpacaCandles(symbol, interval, alpacaApiKey, alpacaApiSecret),
          fetchAlpacaQuote(symbol, alpacaApiKey, alpacaApiSecret),
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
        return;
      } catch (alpacaError) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: `Failed to fetch data for ${symbol}`,
        }));
      }
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: `Yahoo Finance failed. Add Alpaca API keys in settings for fallback.`,
      }));
    }
  }, [symbol, interval, alpacaApiKey, alpacaApiSecret]);

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
