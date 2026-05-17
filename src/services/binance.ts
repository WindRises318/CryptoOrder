import { KLine, Trade, Timeframe } from '../types';

const BASE_URL = 'https://fapi.binance.com/fapi/v1';

export interface SymbolInfo {
  symbol: string;
  pricePrecision: number;
  quantityPrecision: number;
  tickSize: number;
  stepSize: number;
}

const symbolInfoCache: Record<string, SymbolInfo> = {};

function getPrecisionFromStep(step: number): number {
  if (!step || step <= 0) return 2;
  const s = step.toString();
  if (s.indexOf('e') !== -1) {
    const exponent = parseInt(s.split('e-')[1]);
    return exponent || 2;
  }
  const parts = s.split('.');
  return parts.length > 1 ? parts[1].length : 0;
}

export async function fetchTradingPairs(): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_URL}/exchangeInfo`);
    if (!response.ok) {
      throw new Error(`Binance API returned status ${response.status}`);
    }
    const data = await response.json();
    
    if (data && Array.isArray(data.symbols)) {
      data.symbols.forEach((s: any) => {
        const priceFilter = s.filters.find((f: any) => f.filterType === 'PRICE_FILTER');
        const lotSizeFilter = s.filters.find((f: any) => f.filterType === 'LOT_SIZE');
        
        const tickSize = parseFloat(priceFilter?.tickSize || '0.01');
        const stepSize = parseFloat(lotSizeFilter?.stepSize || '0.001');

        symbolInfoCache[s.symbol] = {
          symbol: s.symbol,
          pricePrecision: getPrecisionFromStep(tickSize),
          quantityPrecision: getPrecisionFromStep(stepSize),
          tickSize,
          stepSize,
        };
      });

      return data.symbols
        .filter((s: any) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT' && s.status === 'TRADING')
        .map((s: any) => s.symbol);
    } else {
      console.warn("Unexpected Binance response structure, using defaults", data);
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    console.error("Failed to fetch trading pairs from Binance:", error);
    // Provide default symbols and info
    const defaults = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
    defaults.forEach(s => {
      if (!symbolInfoCache[s]) {
        const tickSize = s === 'BTCUSDT' ? 0.1 : 0.01;
        const stepSize = s === 'BTCUSDT' ? 0.001 : 0.01;
        symbolInfoCache[s] = {
          symbol: s,
          pricePrecision: getPrecisionFromStep(tickSize),
          quantityPrecision: getPrecisionFromStep(stepSize),
          tickSize,
          stepSize
        };
      }
    });
    return defaults;
  }
}

export function getSymbolInfo(symbol: string): SymbolInfo | null {
  const info = symbolInfoCache[symbol];
  if (!info) {
    // If not in cache, we return a basic default to avoid UI breakage
    return {
      symbol,
      pricePrecision: 2,
      quantityPrecision: 3,
      tickSize: 0.01,
      stepSize: 0.001
    };
  }
  return info;
}

export async function fetchKLines(symbol: string, interval: Timeframe, startTime: number, limit: number = 500): Promise<KLine[]> {
  try {
    const url = `${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      time: item[0],
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5]),
    }));
  } catch (error) {
    console.error("Failed to fetch KLines:", error);
    return [];
  }
}

export async function fetchAggTrades(symbol: string, startTime: number, endTime: number): Promise<Trade[]> {
  try {
    const url = `${BASE_URL}/aggTrades?symbol=${symbol}&startTime=${startTime}&endTime=${endTime}&limit=1000`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.a,
      price: parseFloat(item.p),
      qty: parseFloat(item.q),
      time: item.T,
      isBuyerMaker: item.m,
    }));
  } catch (error) {
    console.error("Failed to fetch aggTrades:", error);
    return [];
  }
}
