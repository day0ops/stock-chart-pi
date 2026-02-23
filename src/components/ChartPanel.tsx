import { Chart } from './Chart';
import type { ChartConfig, ChartDataState } from '../types';
import { useBinanceData } from '../hooks/useBinanceData';
import { useYahooData } from '../hooks/useYahooData';
import { formatPrice, formatPercentChange, getDisplaySymbol, formatDateTime } from '../services/dataAdapter';

interface ChartPanelProps {
  config: ChartConfig;
}

export function ChartPanel({ config }: ChartPanelProps) {
  // Use appropriate data hook based on asset type
  const binanceData = useBinanceData({
    symbol: config.symbol,
    interval: config.interval,
    refreshSeconds: config.refreshSeconds,
    useWebSocket: false,
  });

  // Use Yahoo Finance for stocks (free, no API key required)
  const yahooData = useYahooData({
    symbol: config.symbol,
    interval: config.interval,
    refreshSeconds: config.refreshSeconds,
  });

  // Select the right data based on asset type
  const data: ChartDataState = config.type === 'crypto' ? binanceData : yahooData;

  const displaySymbol = getDisplaySymbol(config.symbol, config.type);
  const priceFormatted = data.currentPrice > 0 ? formatPrice(data.currentPrice, config.symbol) : '--';
  const changeFormatted = formatPercentChange(data.changePercent24h);
  const isPositive = data.changePercent24h >= 0;

  return (
    <div className="chart-panel">
      <div className="chart-header">
        <div className="chart-symbol">
          <span className="symbol-name">{displaySymbol}</span>
          <span className={`symbol-type ${config.type}`}>
            {config.type === 'crypto' ? 'CRYPTO' : 'STOCK'}
          </span>
        </div>
        <div className="chart-price-info">
          <span className="current-price">${priceFormatted}</span>
          <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
            {changeFormatted}
          </span>
        </div>
      </div>

      <div className="chart-body">
        {data.loading ? (
          <div className="chart-loading">
            <div className="loading-spinner" />
            <span>Loading {displaySymbol}...</span>
          </div>
        ) : data.error ? (
          <div className="chart-error">
            <span className="error-icon">!</span>
            <span className="error-message">{data.error}</span>
          </div>
        ) : (
          <Chart data={data.ohlc} chartType={config.chartType} />
        )}
      </div>

      <div className="chart-footer">
        <span className="interval-badge">{config.interval}</span>
        <span className="last-updated">
          {data.lastUpdated > 0 ? formatDateTime(data.lastUpdated) : '--'}
        </span>
      </div>
    </div>
  );
}
