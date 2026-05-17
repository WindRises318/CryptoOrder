import React from 'react';
import { BarChart3, Settings, Activity } from 'lucide-react';
import { Timeframe } from '../types';
import { cn, formatNumber } from '../lib/utils';
import { format } from 'date-fns';
import { SymbolSearch } from './SymbolSearch';

interface HeaderProps {
  symbol: string;
  symbolInfo: import('../services/binance').SymbolInfo | null;
  onSymbolSelect: (symbol: string) => void;
  currentTime: number;
  currentPrice: number;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  onJumpToNow: () => void;
  onReset: () => void;
  onTimeChange: (time: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  symbol, 
  symbolInfo,
  onSymbolSelect,
  currentTime, 
  currentPrice,
  timeframe, 
  setTimeframe, 
  onJumpToNow, 
  onReset,
  onTimeChange
}) => {
  const precision = symbolInfo?.pricePrecision ?? 2;
  return (
    <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950 z-30">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <BarChart3 size={18} className="text-black" />
          </div>
          <SymbolSearch currentSymbol={symbol} onSymbolSelect={onSymbolSelect} />
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Simulated Time</span>
            <span className="text-[10px] font-mono font-bold text-yellow-500">
              {currentTime > 0 ? format(currentTime, 'yyyy-MM-dd HH:mm:ss') : '--:--:--'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className={cn("text-sm font-mono font-bold", "text-green-400")}>
              {formatNumber(currentPrice, precision)}
            </span>
            <span className="text-[10px] text-zinc-500">Index {formatNumber(currentPrice - 0.01, precision)}</span>
          </div>
 
          <div className="hidden lg:flex items-center gap-6 border-l border-zinc-800 pl-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Mark Price</span>
              <span className="text-[10px] font-mono font-bold text-zinc-300">{formatNumber(currentPrice, precision)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">24h Change</span>
              <span className="text-[10px] font-mono font-bold text-green-400">+1.24%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">24h High</span>
              <span className="text-[10px] font-mono font-bold text-zinc-300">65,120.00</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">24h Low</span>
              <span className="text-[10px] font-mono font-bold text-zinc-300">63,800.00</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Funding / Countdown</span>
              <span className="text-[10px] font-mono font-bold text-orange-400">0.0100% / 04:22:11</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as any[]).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded transition-all",
                timeframe === tf ? "bg-zinc-800 text-yellow-500" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="datetime-local" 
            className="bg-zinc-900 text-[10px] font-mono font-bold outline-none border border-zinc-800 rounded px-2 py-1 cursor-pointer hover:border-zinc-700 transition-colors"
            value={format(currentTime || Date.now(), "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => {
              const date = new Date(e.target.value);
              if (!isNaN(date.getTime())) {
                onTimeChange(date.getTime());
              }
            }}
          />
          <button 
            onClick={onJumpToNow}
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-400"
            title="Jump to Now"
          >
            <Activity size={14} />
          </button>
          <button 
            onClick={onReset}
            className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-400"
            title="Reset"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
