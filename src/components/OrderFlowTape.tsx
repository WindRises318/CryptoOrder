import React from 'react';
import { Activity } from 'lucide-react';
import { Trade } from '../types';
import { SymbolInfo } from '../services/binance';
import { cn, formatNumber } from '../lib/utils';
import { format } from 'date-fns';

interface OrderFlowTapeProps {
  trades: Trade[];
  symbolInfo: SymbolInfo | null;
}

export const OrderFlowTape: React.FC<OrderFlowTapeProps> = ({ trades, symbolInfo }) => {
  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
      <div className="flex-1 overflow-y-auto font-mono text-[10px]">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-zinc-900 text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="p-2">Price</th>
              <th className="p-2">Size</th>
              <th className="p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 50).map((trade) => (
              <tr key={trade.id} className={cn(
                "border-b border-zinc-800/50",
                trade.isBuyerMaker ? "text-red-400 bg-red-400/5" : "text-green-400 bg-green-400/5"
              )}>
                <td className="p-2">{formatNumber(trade.price, symbolInfo?.pricePrecision || 2)}</td>
                <td className="p-2 font-bold">{formatNumber(trade.qty, symbolInfo?.quantityPrecision || 4)}</td>
                <td className="p-2 text-zinc-600">{format(trade.time, 'HH:mm:ss')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
