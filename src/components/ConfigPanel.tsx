import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { SymbolAutocomplete } from './SymbolAutocomplete';
import type { ChartType, AssetType, TimeInterval } from '../types';
import type { SymbolInfo } from '../services/symbolSearch';

const LAYOUT_PRESETS = [
  { label: '1x1', columns: 1, rows: 1 },
  { label: '2x1', columns: 2, rows: 1 },
  { label: '2x2', columns: 2, rows: 2 },
  { label: '3x2', columns: 3, rows: 2 },
  { label: '4x2', columns: 4, rows: 2 },
  { label: '4x3', columns: 4, rows: 3 },
  { label: '4x4', columns: 4, rows: 4 },
  { label: '8x4', columns: 8, rows: 4 },
];

const INTERVALS: TimeInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
const REFRESH_OPTIONS = [30, 60, 120, 300, 600, 900];

export function ConfigPanel() {
  const { state, toggleConfig, updateLayout, addChart, removeChart, updateChart, setAlpacaCredentials } =
    useDashboard();
  const { config, isConfigOpen } = state;

  // Alpaca credentials state
  const [alpacaKey, setAlpacaKey] = useState(config.alpacaCredentials?.apiKey || '');
  const [alpacaSecret, setAlpacaSecret] = useState(config.alpacaCredentials?.apiSecret || '');

  // New chart form state
  const [newSymbol, setNewSymbol] = useState('');
  const [selectedSymbolInfo, setSelectedSymbolInfo] = useState<SymbolInfo | null>(null);
  const [newType, setNewType] = useState<AssetType>('crypto');
  const [newChartType, setNewChartType] = useState<ChartType>('candlestick');
  const [newInterval, setNewInterval] = useState<TimeInterval>('15m');
  const [newRefresh, setNewRefresh] = useState(60);

  const handleSymbolSelect = (symbol: SymbolInfo) => {
    setSelectedSymbolInfo(symbol);
    setNewSymbol(symbol.symbol);
    // Auto-set type based on selected symbol
    if (symbol.type !== newType) {
      setNewType(symbol.type);
    }
  };

  const handleTypeChange = (type: AssetType) => {
    setNewType(type);
    // Clear symbol when switching types
    setNewSymbol('');
    setSelectedSymbolInfo(null);
  };

  const handleAddChart = () => {
    if (!newSymbol.trim()) return;

    addChart({
      symbol: newSymbol.toUpperCase(),
      type: newType,
      chartType: newChartType,
      interval: newInterval,
      refreshSeconds: newRefresh,
    });

    setNewSymbol('');
    setSelectedSymbolInfo(null);
  };

  if (!isConfigOpen) return null;

  return (
    <div className="config-overlay" onClick={toggleConfig}>
      <div className="config-panel" onClick={(e) => e.stopPropagation()}>
        <div className="config-header">
          <h2>Dashboard Settings</h2>
          <button className="config-close" onClick={toggleConfig}>
            &times;
          </button>
        </div>

        <div className="config-content">
          {/* Layout Section */}
          <section className="config-section">
            <h3>Grid Layout</h3>
            <div className="layout-presets">
              {LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={`layout-preset ${
                    config.layout.columns === preset.columns &&
                    config.layout.rows === preset.rows
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => updateLayout({ columns: preset.columns, rows: preset.rows })}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          {/* Add Chart Section */}
          <section className="config-section">
            <h3>Add Chart</h3>
            <p className="section-note">
              Crypto data from Binance • Stock data from Yahoo Finance (Alpaca fallback)
            </p>
            <div className="add-chart-form">
              <div className="form-row type-selector">
                <button
                  className={`type-btn ${newType === 'crypto' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('crypto')}
                >
                  <span className="type-icon">₿</span>
                  Crypto
                </button>
                <button
                  className={`type-btn ${newType === 'stock' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('stock')}
                >
                  <span className="type-icon">📈</span>
                  Stock
                </button>
              </div>

              <div className="form-row symbol-row">
                <SymbolAutocomplete
                  value={newSymbol}
                  onChange={setNewSymbol}
                  onSelect={handleSymbolSelect}
                  type={newType}
                  placeholder={newType === 'crypto' ? 'Search crypto (e.g., BTC, ETH)' : 'Search stock (e.g., AAPL, MSFT)'}
                />
              </div>

              {selectedSymbolInfo && (
                <div className="selected-symbol-info">
                  <span className="selected-symbol">{selectedSymbolInfo.symbol}</span>
                  <span className="selected-name">{selectedSymbolInfo.name}</span>
                  {selectedSymbolInfo.exchange && (
                    <span className="selected-exchange">{selectedSymbolInfo.exchange}</span>
                  )}
                </div>
              )}

              <div className="form-row">
                <select
                  value={newChartType}
                  onChange={(e) => setNewChartType(e.target.value as ChartType)}
                >
                  <option value="candlestick">Candlestick</option>
                  <option value="line">Line</option>
                </select>
                <select
                  value={newInterval}
                  onChange={(e) => setNewInterval(e.target.value as TimeInterval)}
                >
                  {INTERVALS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                <select value={newRefresh} onChange={(e) => setNewRefresh(Number(e.target.value))}>
                  {REFRESH_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}s
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="add-chart-btn"
                onClick={handleAddChart}
                disabled={!newSymbol.trim()}
              >
                Add Chart
              </button>
            </div>
          </section>

          {/* Alpaca API Section */}
          <section className="config-section">
            <h3>
              Alpaca API
              <span className="tooltip-wrapper">
                <span className="info-icon">?</span>
                <span className="tooltip">Used as fallback when Yahoo Finance fails to fetch data</span>
              </span>
            </h3>
            <p className="section-note">
              Get free API keys at <a href="https://alpaca.markets" target="_blank" rel="noopener noreferrer">alpaca.markets</a>
            </p>
            <div className="alpaca-credentials">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="API Key ID"
                  value={alpacaKey}
                  onChange={(e) => setAlpacaKey(e.target.value)}
                  className="alpaca-input"
                />
              </div>
              <div className="form-row">
                <input
                  type="password"
                  placeholder="API Secret Key"
                  value={alpacaSecret}
                  onChange={(e) => setAlpacaSecret(e.target.value)}
                  className="alpaca-input"
                />
              </div>
              <button
                className="save-alpaca-btn"
                onClick={() => setAlpacaCredentials({ apiKey: alpacaKey, apiSecret: alpacaSecret })}
                disabled={!alpacaKey.trim() || !alpacaSecret.trim()}
              >
                Save Credentials
              </button>
              {config.alpacaCredentials?.apiKey && (
                <p className="credentials-status">Credentials saved</p>
              )}
            </div>
          </section>

          {/* Charts List Section */}
          <section className="config-section">
            <h3>Charts ({config.charts.length})</h3>
            <div className="charts-list">
              {config.charts.map((chart) => (
                <div key={chart.id} className="chart-item">
                  <div className="chart-item-info">
                    <span className="chart-item-symbol">{chart.symbol}</span>
                    <span className={`chart-item-type ${chart.type}`}>
                      {chart.type === 'crypto' ? 'C' : 'S'}
                    </span>
                    <span className="chart-item-details">
                      {chart.chartType} • {chart.interval} • {chart.refreshSeconds}s
                    </span>
                  </div>
                  <div className="chart-item-actions">
                    <select
                      value={chart.interval}
                      onChange={(e) =>
                        updateChart({ ...chart, interval: e.target.value as TimeInterval })
                      }
                    >
                      {INTERVALS.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                    <button
                      className="remove-chart-btn"
                      onClick={() => removeChart(chart.id)}
                      title="Remove chart"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
