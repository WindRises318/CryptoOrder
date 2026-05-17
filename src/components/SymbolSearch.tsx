import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { fetchTradingPairs } from '../services/binance';
import { cn } from '../lib/utils';

interface SymbolSearchProps {
  currentSymbol: string;
  onSymbolSelect: (symbol: string) => void;
}

export const SymbolSearch: React.FC<SymbolSearchProps> = ({ currentSymbol, onSymbolSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTradingPairs().then(data => {
      setSymbols(data);
      setFilteredSymbols(data);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const filtered = symbols.filter(s => 
      s.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSymbols(filtered);
  }, [searchTerm, symbols]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-zinc-900 px-2 py-1 rounded transition-colors group"
      >
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight group-hover:text-yellow-500 transition-colors">{currentSymbol}</span>
            <ChevronDown size={14} className={cn("text-zinc-500 transition-transform", isOpen && "rotate-180")} />
          </div>
          <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1 rounded uppercase">Perpetual</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <input
                autoFocus
                type="text"
                placeholder="Search pairs (e.g. BTCUSDT)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 pl-8 py-1.5 text-xs outline-none focus:border-yellow-500/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto no-scrollbar">
            {filteredSymbols.length > 0 ? (
              filteredSymbols.map(symbol => (
                <button
                  key={symbol}
                  onClick={() => {
                    onSymbolSelect(symbol);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-xs hover:bg-zinc-800 transition-colors flex items-center justify-between",
                    symbol === currentSymbol ? "text-yellow-500 bg-yellow-500/5" : "text-zinc-300"
                  )}
                >
                  <span className="font-bold">{symbol}</span>
                  <span className="text-[10px] text-zinc-600">USDT-M</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-zinc-600 italic">
                No pairs found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
