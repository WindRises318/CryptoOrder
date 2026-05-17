import React from 'react';
import { Wallet } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface AccountPanelProps {
  balance: number;
  availableBalance: number;
  unrealizedPnl: number;
}

export const AccountPanel: React.FC<AccountPanelProps> = ({ balance, availableBalance, unrealizedPnl }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-zinc-400">
        <Wallet size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">Account</span>
      </div>
      <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50 space-y-3">
        <div>
          <div className="text-2xl font-mono font-bold text-blue-400">{formatCurrency(balance + unrealizedPnl)}</div>
          <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-wider">Equity (USDT)</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-700/30">
          <div>
            <div className="text-xs font-mono text-zinc-300">{formatCurrency(balance)}</div>
            <div className="text-[8px] text-zinc-500 uppercase font-bold">Wallet Balance</div>
          </div>
          <div>
            <div className="text-xs font-mono text-zinc-300">{formatCurrency(availableBalance)}</div>
            <div className="text-[8px] text-zinc-500 uppercase font-bold">Available</div>
          </div>
        </div>
      </div>
    </div>
  );
};
