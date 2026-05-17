import React from 'react';
import { History } from 'lucide-react';
import { TradeHistory, Position } from '../types';
import { SymbolInfo } from '../services/binance';
import { cn, formatCurrency, formatNumber } from '../lib/utils';

interface HistoryPanelProps {
  symbol: string;
  symbolInfo: SymbolInfo | null;
  history: TradeHistory[];
  position: Position | null;
  currentPrice: number;
  unrealizedPnl: number;
  onClose: () => void;
}

import { format } from 'date-fns';

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ symbol, symbolInfo, history, position, currentPrice, unrealizedPnl, onClose }) => {
  const [activeTab, setActiveTab] = React.useState('Positions');

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-t border-zinc-800 font-sans">
      <div className="flex border-b border-zinc-800 px-2 overflow-x-auto no-scrollbar">
        {['Positions', 'Open Orders', 'Order History', 'Trade History', 'Transaction History'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap flex items-center gap-1.5",
              activeTab === tab ? "text-yellow-500" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab}
            {tab === 'Positions' && position && (
              <span className="bg-yellow-500 text-black px-1 rounded-full text-[8px]">1</span>
            )}
            {activeTab === tab && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-yellow-500" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'Positions' ? (
          <table className="w-full text-[10px] text-left">
            <thead className="text-zinc-500 uppercase font-bold sticky top-0 bg-zinc-950 border-b border-zinc-900">
              <tr>
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Entry Price</th>
                <th className="px-4 py-2">Mark Price</th>
                <th className="px-4 py-2">TP/SL</th>
                <th className="px-4 py-2">Liq. Price</th>
                <th className="px-4 py-2">Margin Ratio</th>
                <th className="px-4 py-2">Margin</th>
                <th className="px-4 py-2 text-right">PnL (ROE%)</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {!position ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-600 italic">No active positions</td>
                </tr>
              ) : (
                <tr className="hover:bg-zinc-900/50 transition-colors group">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-bold",
                        position.type === 'long' ? "text-green-400" : "text-red-400"
                      )}>
                        {symbol} Perpetual
                      </span>
                      <span className="bg-zinc-800 px-1 rounded text-[8px] text-zinc-400">{position.leverage}x</span>
                    </div>
                  </td>
                  <td className={cn("px-4 py-2 font-mono", position.type === 'long' ? "text-green-400" : "text-red-400")}>
                    {position.type === 'long' ? '+' : '-'}{formatNumber(position.qty, symbolInfo?.quantityPrecision || 3)}
                  </td>
                  <td className="px-4 py-2 font-mono text-zinc-300">{formatNumber(position.entryPrice, symbolInfo?.pricePrecision || 2)}</td>
                  <td className="px-4 py-2 font-mono text-zinc-300">{formatNumber(currentPrice, symbolInfo?.pricePrecision || 2)}</td>
                  <td className="px-4 py-2 font-mono text-[9px]">
                    <div className="text-green-400">{position.tpPrice ? formatNumber(position.tpPrice, symbolInfo?.pricePrecision || 2) : '--'}</div>
                    <div className="text-red-400">{position.slPrice ? formatNumber(position.slPrice, symbolInfo?.pricePrecision || 2) : '--'}</div>
                  </td>
                  <td className="px-4 py-2 font-mono text-orange-400">{formatNumber(position.liquidationPrice, symbolInfo?.pricePrecision || 2)}</td>
                  <td className="px-4 py-2 font-mono text-green-400">0.01%</td>
                  <td className="px-4 py-2 font-mono text-zinc-300">{formatCurrency(position.margin)}</td>
                  <td className="px-4 py-2 text-right font-mono">
                    <div className={cn("font-bold", unrealizedPnl >= 0 ? "text-green-400" : "text-red-400")}>
                      {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)}
                    </div>
                    <div className={cn("text-[8px]", unrealizedPnl >= 0 ? "text-green-400/70" : "text-red-400/70")}>
                      ({((unrealizedPnl / position.margin) * 100).toFixed(2)}%)
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button 
                      onClick={onClose}
                      className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold transition-colors"
                    >
                      Market Close
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : activeTab === 'Trade History' ? (
          <table className="w-full text-[10px] text-left">
            <thead className="text-zinc-500 uppercase font-bold sticky top-0 bg-zinc-950 border-b border-zinc-900">
              <tr>
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Symbol</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Side</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Entry Price</th>
                <th className="px-4 py-2 text-right">Exit Price</th>
                <th className="px-4 py-2 text-right">Fees</th>
                <th className="px-4 py-2 text-right">Realized PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-600 italic">No trade history</td>
                </tr>
              ) : (
                history.map((trade, i) => (
                  <tr key={i} className="hover:bg-zinc-900/50 transition-colors group">
                    <td className="px-4 py-2 text-zinc-500 font-mono">{format(trade.exitTime, 'MM-dd HH:mm:ss')}</td>
                    <td className="px-4 py-2 font-bold">{symbol}</td>
                    <td className="px-4 py-2">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-sm font-bold uppercase text-[8px]",
                        trade.type === 'long' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                      )}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-400">Market</td>
                    <td className="px-4 py-2 text-right font-mono">{formatNumber(trade.qty, symbolInfo?.quantityPrecision || 3)}</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-400">{formatNumber(trade.entryPrice, symbolInfo?.pricePrecision || 2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-300">{formatNumber(trade.exitPrice, symbolInfo?.pricePrecision || 2)}</td>
                    <td className="px-4 py-2 text-right font-mono text-red-400/70">{formatCurrency(trade.fee)}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      <div className={cn("font-bold", trade.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </div>
                      <div className="text-[8px] text-zinc-600">Net: {formatCurrency(trade.pnl - trade.fee)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-600 italic text-[10px]">
            {activeTab} content coming soon...
          </div>
        )}
      </div>
    </div>
  );
};
