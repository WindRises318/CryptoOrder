import React, { useMemo } from 'react';
import { Trade } from '../types';
import { SymbolInfo } from '../services/binance';
import { cn, formatNumber } from '../lib/utils';

interface OrderBookProps {
  currentPrice: number;
  trades: Trade[];
  symbolInfo: SymbolInfo | null;
}

export const OrderBook: React.FC<OrderBookProps> = ({ currentPrice, trades, symbolInfo }) => {
  // Simulate order book levels based on current price
  const levels = useMemo(() => {
    if (currentPrice === 0) return { asks: [], bids: [] };
    
    const tickSize = symbolInfo?.tickSize || 0.01;
    const asks = [];
    const bids = [];
    
    for (let i = 1; i <= 12; i++) {
      asks.unshift({
        price: currentPrice + i * tickSize,
        size: Math.random() * 2 + 0.1,
        total: 0
      });
      bids.push({
        price: currentPrice - i * tickSize,
        size: Math.random() * 2 + 0.1,
        total: 0
      });
    }

    // Calculate totals
    let askTotal = 0;
    asks.slice().reverse().forEach(a => {
      askTotal += a.size;
      a.total = askTotal;
    });
    
    let bidTotal = 0;
    bids.forEach(b => {
      bidTotal += b.size;
      b.total = bidTotal;
    });

    return { asks, bids };
  }, [currentPrice]);

  const maxTotal = Math.max(
    ...levels.asks.map(a => a.total),
    ...levels.bids.map(b => b.total)
  );

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-b border-zinc-800 overflow-hidden font-mono text-[10px]">
      <div className="p-2 border-b border-zinc-800 flex items-center justify-between text-zinc-500 font-bold uppercase tracking-wider">
        <span>Order Book</span>
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-green-500/50 rounded-sm" />
          <div className="w-2 h-2 bg-red-500/50 rounded-sm" />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Headers */}
        <div className="grid grid-cols-3 px-2 py-1 text-zinc-500 border-b border-zinc-900">
          <span>Price(USDT)</span>
          <span className="text-right">Size({symbolInfo?.symbol.replace('USDT', '') || 'BTC'})</span>
          <span className="text-right">Total({symbolInfo?.symbol.replace('USDT', '') || 'BTC'})</span>
        </div>

        {/* Asks (Sells) */}
        <div className="flex-1 flex flex-col-reverse overflow-hidden">
          {levels.asks.map((ask, i) => (
            <div key={i} className="relative grid grid-cols-3 px-2 py-0.5 hover:bg-zinc-900 group cursor-pointer">
              <div className="absolute inset-0 bg-red-500/10 origin-right transition-transform" style={{ transform: `scaleX(${ask.total / maxTotal})` }} />
              <span className="text-red-400 z-10">{formatNumber(ask.price, symbolInfo?.pricePrecision || 2)}</span>
              <span className="text-right text-zinc-300 z-10">{formatNumber(ask.size, symbolInfo?.quantityPrecision || 3)}</span>
              <span className="text-right text-zinc-500 z-10">{formatNumber(ask.total, symbolInfo?.quantityPrecision || 3)}</span>
            </div>
          ))}
        </div>

        {/* Spread / Current Price */}
        <div className="px-2 py-2 bg-zinc-900/50 border-y border-zinc-800 flex items-center gap-2">
          <span className={cn(
            "text-lg font-bold",
            trades[0]?.isBuyerMaker ? "text-red-400" : "text-green-400"
          )}>
            {formatNumber(currentPrice, symbolInfo?.pricePrecision || 2)}
          </span>
          <span className="text-zinc-500 text-[8px]">≈ {formatNumber(currentPrice, symbolInfo?.pricePrecision || 2)} USD</span>
        </div>

        {/* Bids (Buys) */}
        <div className="flex-1 overflow-hidden">
          {levels.bids.map((bid, i) => (
            <div key={i} className="relative grid grid-cols-3 px-2 py-0.5 hover:bg-zinc-900 group cursor-pointer">
              <div className="absolute inset-0 bg-green-500/10 origin-right transition-transform" style={{ transform: `scaleX(${bid.total / maxTotal})` }} />
              <span className="text-green-400 z-10">{formatNumber(bid.price, symbolInfo?.pricePrecision || 2)}</span>
              <span className="text-right text-zinc-300 z-10">{formatNumber(bid.size, symbolInfo?.quantityPrecision || 3)}</span>
              <span className="text-right text-zinc-500 z-10">{formatNumber(bid.total, symbolInfo?.quantityPrecision || 3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
