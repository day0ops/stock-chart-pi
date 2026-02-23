// Symbol search and validation service
// Uses Binance API for crypto and Yahoo Finance for stocks (both free, no API key required)

export interface SymbolInfo {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock';
  exchange?: string;
}

// Cache for symbol lists
let cryptoSymbolsCache: SymbolInfo[] | null = null;
let stockSearchCache: Map<string, SymbolInfo[]> = new Map();

// Popular crypto pairs (preloaded for instant search)
const POPULAR_CRYPTO: SymbolInfo[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto' },
  { symbol: 'BNBUSDT', name: 'BNB', type: 'crypto' },
  { symbol: 'SOLUSDT', name: 'Solana', type: 'crypto' },
  { symbol: 'XRPUSDT', name: 'XRP', type: 'crypto' },
  { symbol: 'ADAUSDT', name: 'Cardano', type: 'crypto' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', type: 'crypto' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', type: 'crypto' },
  { symbol: 'DOTUSDT', name: 'Polkadot', type: 'crypto' },
  { symbol: 'MATICUSDT', name: 'Polygon', type: 'crypto' },
  { symbol: 'LINKUSDT', name: 'Chainlink', type: 'crypto' },
  { symbol: 'LTCUSDT', name: 'Litecoin', type: 'crypto' },
  { symbol: 'ATOMUSDT', name: 'Cosmos', type: 'crypto' },
  { symbol: 'UNIUSDT', name: 'Uniswap', type: 'crypto' },
  { symbol: 'XLMUSDT', name: 'Stellar', type: 'crypto' },
  { symbol: 'ETCUSDT', name: 'Ethereum Classic', type: 'crypto' },
  { symbol: 'NEARUSDT', name: 'NEAR Protocol', type: 'crypto' },
  { symbol: 'APTUSDT', name: 'Aptos', type: 'crypto' },
  { symbol: 'ARBUSDT', name: 'Arbitrum', type: 'crypto' },
  { symbol: 'OPUSDT', name: 'Optimism', type: 'crypto' },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu', type: 'crypto' },
  { symbol: 'TRXUSDT', name: 'TRON', type: 'crypto' },
  { symbol: 'ICPUSDT', name: 'Internet Computer', type: 'crypto' },
  { symbol: 'FILUSDT', name: 'Filecoin', type: 'crypto' },
  { symbol: 'AAVEUSDT', name: 'Aave', type: 'crypto' },
];

// Popular stocks (preloaded for instant search)
const POPULAR_STOCKS: SymbolInfo[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway', type: 'stock', exchange: 'NYSE' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', exchange: 'NYSE' },
  { symbol: 'WMT', name: 'Walmart Inc.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'MA', name: 'Mastercard Inc.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'PG', name: 'Procter & Gamble', type: 'stock', exchange: 'NYSE' },
  { symbol: 'HD', name: 'The Home Depot', type: 'stock', exchange: 'NYSE' },
  { symbol: 'DIS', name: 'Walt Disney Co.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel Corporation', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'CRM', name: 'Salesforce Inc.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'BA', name: 'Boeing Co.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'NKE', name: 'Nike Inc.', type: 'stock', exchange: 'NYSE' },
  { symbol: 'COST', name: 'Costco Wholesale', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'PYPL', name: 'PayPal Holdings', type: 'stock', exchange: 'NASDAQ' },
  { symbol: 'UBER', name: 'Uber Technologies', type: 'stock', exchange: 'NYSE' },
];

// Fetch all Binance trading pairs (USDT pairs)
async function fetchBinanceSymbols(): Promise<SymbolInfo[]> {
  if (cryptoSymbolsCache) {
    return cryptoSymbolsCache;
  }

  try {
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    if (!response.ok) {
      return POPULAR_CRYPTO;
    }

    const data = await response.json();
    const symbols: SymbolInfo[] = data.symbols
      .filter((s: { status: string; quoteAsset: string }) =>
        s.status === 'TRADING' && s.quoteAsset === 'USDT'
      )
      .map((s: { symbol: string; baseAsset: string }) => ({
        symbol: s.symbol,
        name: s.baseAsset,
        type: 'crypto' as const,
      }));

    cryptoSymbolsCache = symbols;
    return symbols;
  } catch {
    return POPULAR_CRYPTO;
  }
}

// Search stocks using Yahoo Finance autocomplete
async function searchYahooSymbols(query: string): Promise<SymbolInfo[]> {
  if (query.length < 1) {
    return POPULAR_STOCKS;
  }

  const cacheKey = query.toLowerCase();
  if (stockSearchCache.has(cacheKey)) {
    return stockSearchCache.get(cacheKey)!;
  }

  // First check popular stocks for immediate results
  const popularMatches = POPULAR_STOCKS.filter(s =>
    s.symbol.toLowerCase().includes(query.toLowerCase()) ||
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  // Always query Yahoo Finance to find non-popular stocks
  try {
    // Use Yahoo Finance search/autocomplete endpoint
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0`;

    let response = await fetch(url);

    // If direct call fails due to CORS, try with proxy
    if (!response.ok) {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      response = await fetch(proxyUrl);
    }

    if (!response.ok) {
      return popularMatches.length > 0 ? popularMatches : POPULAR_STOCKS.slice(0, 10);
    }

    const data = await response.json();
    const quotes = data.quotes || [];

    const symbols: SymbolInfo[] = quotes
      .filter((q: { quoteType: string; isYahooFinance: boolean }) =>
        q.quoteType === 'EQUITY' && q.isYahooFinance
      )
      .slice(0, 15)
      .map((q: { symbol: string; shortname?: string; longname?: string; exchange?: string }) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: 'stock' as const,
        exchange: q.exchange,
      }));

    // Merge with popular matches
    const merged = [...popularMatches];
    for (const sym of symbols) {
      if (!merged.find(m => m.symbol === sym.symbol)) {
        merged.push(sym);
      }
    }

    stockSearchCache.set(cacheKey, merged.slice(0, 15));
    return merged.slice(0, 15);
  } catch {
    return popularMatches.length > 0 ? popularMatches : POPULAR_STOCKS.slice(0, 10);
  }
}

// Search symbols based on type
export async function searchSymbols(
  query: string,
  type: 'crypto' | 'stock',
  _apiKey?: string // Kept for backwards compatibility, not needed anymore
): Promise<SymbolInfo[]> {
  const normalizedQuery = query.trim().toUpperCase();

  if (type === 'crypto') {
    const symbols = await fetchBinanceSymbols();
    return symbols
      .filter(s =>
        s.symbol.includes(normalizedQuery) ||
        s.name.toUpperCase().includes(normalizedQuery)
      )
      .slice(0, 15);
  } else {
    return searchYahooSymbols(query);
  }
}

// Validate if a symbol exists
export async function validateSymbol(
  symbol: string,
  type: 'crypto' | 'stock',
  _apiKey?: string // Kept for backwards compatibility, not needed anymore
): Promise<{ valid: boolean; info?: SymbolInfo }> {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (type === 'crypto') {
    try {
      // Quick validation using Binance ticker endpoint
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${normalizedSymbol}`
      );

      if (response.ok) {
        const symbols = await fetchBinanceSymbols();
        const info = symbols.find(s => s.symbol === normalizedSymbol);
        return {
          valid: true,
          info: info || { symbol: normalizedSymbol, name: normalizedSymbol.replace('USDT', ''), type: 'crypto' }
        };
      }
      return { valid: false };
    } catch {
      return { valid: false };
    }
  } else {
    // For stocks, validate using Yahoo Finance
    try {
      // First check popular stocks
      const found = POPULAR_STOCKS.find(s => s.symbol === normalizedSymbol);
      if (found) {
        return { valid: true, info: found };
      }

      // Validate via Yahoo Finance chart endpoint
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?interval=1d&range=1d`;

      let response = await fetch(url);

      // Try with proxy if direct fails
      if (!response.ok) {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        response = await fetch(proxyUrl);
      }

      if (response.ok) {
        const data = await response.json();
        if (!data.chart.error && data.chart.result && data.chart.result.length > 0) {
          const meta = data.chart.result[0].meta;
          return {
            valid: true,
            info: {
              symbol: normalizedSymbol,
              name: meta.shortName || meta.longName || normalizedSymbol,
              type: 'stock',
              exchange: meta.exchangeName
            }
          };
        }
      }
      return { valid: false };
    } catch {
      return { valid: false };
    }
  }
}

// Get suggestions for empty input
export function getPopularSymbols(type: 'crypto' | 'stock'): SymbolInfo[] {
  return type === 'crypto' ? POPULAR_CRYPTO.slice(0, 10) : POPULAR_STOCKS.slice(0, 10);
}
