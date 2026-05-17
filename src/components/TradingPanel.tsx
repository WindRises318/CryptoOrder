import React from 'react';
import { Settings, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Position, PendingOrder } from '../types';
import { SymbolInfo } from '../services/binance';
import { cn, formatCurrency, formatNumber } from '../lib/utils';

interface TradingPanelProps {
  symbol: string;
  symbolInfo: SymbolInfo | null;
  balance: number;
  availableBalance: number;
  currentPrice: number;
  orderQty: number;
  setOrderQty: (qty: number) => void;
  leverage: number;
  setLeverage: (l: number) => void;
  pendingOrder: PendingOrder | null;
  position: Position | null;
  unrealizedPnl: number;
  onTrade: (type: 'long' | 'short') => void;
  onClose: () => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  symbol,
  symbolInfo,
  balance,
  availableBalance,
  currentPrice,
  orderQty,
  setOrderQty,
  leverage,
  setLeverage,
  pendingOrder,
  position,
  unrealizedPnl,
  onTrade,
  onClose
}) => {
  const handlePercentageClick = (percent: number) => {
    if (currentPrice <= 0) return;
    // Calculate max USDT quantity based on available balance and leverage
    const maxUsdt = availableBalance * leverage;
    const targetUsdt = (maxUsdt * percent) / 100;
    // Convert USDT to BTC quantity for the simulation
    const targetQty = targetUsdt / currentPrice;
    
    // Round to correct decimal places for the symbol
    const qtyPrecision = symbolInfo?.quantityPrecision ?? 3;
    const factor = Math.pow(10, qtyPrecision);
    setOrderQty(Math.floor(targetQty * factor) / factor);
  };

  // Convert BTC qty to USDT for display in the input if we want USDT-based input
  // But the user said "units are USDT", so let's make the input value represent USDT
  const [usdtInput, setUsdtInput] = React.useState((orderQty * currentPrice).toFixed(2));

  // Sync usdtInput when orderQty or currentPrice changes (only if not focused to avoid jumping)
  const [isFocused, setIsFocused] = React.useState(false);
  React.useEffect(() => {
    if (!isFocused && currentPrice > 0) {
      setUsdtInput((orderQty * currentPrice).toFixed(2));
    }
  }, [orderQty, currentPrice, isFocused]);

  const handleUsdtChange = (val: string) => {
    setUsdtInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && currentPrice > 0) {
      setOrderQty(num / currentPrice);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800 w-72 overflow-hidden font-sans">
      {/* Mode Selection */}
      <div className="p-2 border-b border-zinc-800 grid grid-cols-3 gap-1">
        <button className="bg-zinc-800 text-zinc-300 text-[10px] font-bold py-1 rounded hover:bg-zinc-700 transition-colors">Cross</button>
        <div className="relative group">
          <input 
            type="number"
            min="1"
            max="125"
            value={leverage}
            onChange={(e) => setLeverage(Math.min(125, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full bg-zinc-800 text-zinc-300 text-[10px] font-bold py-1 rounded text-center outline-none focus:ring-1 focus:ring-yellow-500/50"
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-zinc-500 pointer-events-none">x</span>
        </div>
        <button className="bg-zinc-800 text-zinc-300 text-[10px] font-bold py-1 rounded hover:bg-zinc-700 transition-colors">S</button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex border-b border-zinc-800">
        {['Limit', 'Market', 'Stop Limit'].map((tab, i) => (
          <button 
            key={tab}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
              i === 1 ? "text-yellow-500 border-b-2 border-yellow-500" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Available Balance */}
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-zinc-500">Avbl</span>
          <span className="text-zinc-300 font-mono">{formatNumber(availableBalance, 2)} USDT <Activity size={10} className="inline ml-1 text-yellow-500" /></span>
        </div>

        {/* Price Input (Market) */}
        <div className="space-y-1">
          <div className="relative">
            <input 
              disabled
              type="text" 
              value="Market Price"
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-500 cursor-not-allowed"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-bold">USDT</span>
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-1">
          <div className="relative">
            <input 
              type="text" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 outline-none focus:border-yellow-500/50"
              value={usdtInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => handleUsdtChange(e.target.value)}
              placeholder="Size"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-bold">USDT</span>
          </div>
          <div className="flex justify-between text-[9px] text-zinc-600 px-1">
            <span>≈ {formatNumber(orderQty, symbolInfo?.quantityPrecision || 4)} {symbol.replace('USDT', '')}</span>
            <span>Cost: {formatNumber(orderQty * currentPrice / leverage, 2)} USDT</span>
          </div>
        </div>

        {/* Percentage Slider */}
        <div className="space-y-2 px-1">
          <div className="relative h-6 flex items-center">
            <input 
              type="range"
              min="0"
              max="100"
              step="1"
              value={availableBalance > 0 ? Math.min(100, Math.round((orderQty * currentPrice) / (availableBalance * leverage) * 100)) : 0}
              onChange={(e) => handlePercentageClick(parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>
          <div className="flex justify-between">
            {[0, 25, 50, 75, 100].map(p => (
              <button 
                key={p} 
                onClick={() => handlePercentageClick(p)}
                className="text-[8px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        {/* Buy/Sell Buttons */}
        <div className="space-y-2 pt-2">
          <button 
            onClick={() => onTrade('long')}
            disabled={!!position || !!pendingOrder}
            className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-green-500 text-black font-bold rounded text-xs transition-all active:scale-[0.98]"
          >
            Buy / Long
          </button>
          <button 
            onClick={() => onTrade('short')}
            disabled={!!position || !!pendingOrder}
            className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white font-bold rounded text-xs transition-all active:scale-[0.98]"
          >
            Sell / Short
          </button>
        </div>

        {/* Position Info if active */}
        {position && (
          <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800 space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500">TP / SL</span>
              <div className="flex gap-2 font-mono font-bold">
                <span className="text-green-400">{position.tpPrice ? formatNumber(position.tpPrice, symbolInfo?.pricePrecision || 2) : '--'}</span>
                <span className="text-zinc-700">/</span>
                <span className="text-red-400">{position.slPrice ? formatNumber(position.slPrice, symbolInfo?.pricePrecision || 2) : '--'}</span>
              </div>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500">Liq. Price</span>
              <span className="text-orange-400 font-mono font-bold">{formatNumber(position.liquidationPrice, symbolInfo?.pricePrecision || 2)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500">Margin</span>
              <span className="text-zinc-300 font-mono">{formatCurrency(position.margin)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500">PnL</span>
              <span className={cn("font-mono font-bold", unrealizedPnl >= 0 ? "text-green-400" : "text-red-400")}>
                {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)}
              </span>
            </div>
            <button 
              onClick={onClose}
              disabled={!!pendingOrder}
              className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold transition-colors"
            >
              Close Position
            </button>
          </div>
        )}

        {/* Pending Order Status */}
        {pendingOrder && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-yellow-500 uppercase">
              <span>{pendingOrder.side} {pendingOrder.type}</span>
              <span>{formatNumber((pendingOrder.filledQty / pendingOrder.qty) * 100, 1)}%</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-300" 
                style={{ width: `${(pendingOrder.filledQty / pendingOrder.qty) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Account Info Footer */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-zinc-500">Margin Ratio</span>
          <span className="text-green-400 font-bold">0.00%</span>
        </div>
        <div className="h-1 w-full bg-zinc-800 rounded-full">
          <div className="h-full w-0 bg-green-500 rounded-full" />
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-zinc-500">Maintenance Margin</span>
          <span className="text-zinc-300 font-mono">0.00 USDT</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-zinc-500">Margin Balance</span>
          <span className="text-zinc-300 font-mono">10,000.00 USDT</span>
        </div>
      </div>
    </div>
  );
};
