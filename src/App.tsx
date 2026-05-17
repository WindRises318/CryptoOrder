import React, { useState } from 'react';
import { useTradingSimulation } from './hooks/useTradingSimulation';
import { Header } from './components/Header';
import { AccountPanel } from './components/AccountPanel';
import { TradingPanel } from './components/TradingPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { format } from 'date-fns';
import { KLineChart } from './components/KLineChart';
import { OrderFlowTape } from './components/OrderFlowTape';
import { ReplayControls } from './components/ReplayControls';
import { cn } from './lib/utils';

import { OrderBook } from './components/OrderBook';

export default function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const {
    klines,
    trades,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    currentTime,
    balance,
    orderQty,
    setOrderQty,
    leverage,
    setLeverage,
    pendingOrder,
    position,
    history,
    currentPrice,
    unrealizedPnl,
    handleTrade,
    handleClose,
    updateTPSL,
    loadData,
    resetSimulation,
    timeframe,
    setTimeframe,
    symbolInfo
  } = useTradingSimulation(symbol, '1m');

  const [showOrderBook, setShowOrderBook] = useState(true);

  const usedMargin = (position?.margin || 0) + (pendingOrder ? (pendingOrder.qty * currentPrice / leverage) : 0);
  const availableBalance = Math.max(0, balance - usedMargin);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-yellow-500/30 overflow-hidden">
      <Header 
        symbol={symbol}
        symbolInfo={symbolInfo}
        onSymbolSelect={(s) => {
          if (position) {
            if (window.confirm('Switching symbols will close your current position. Proceed?')) {
              resetSimulation();
              setSymbol(s);
            }
          } else {
            setSymbol(s);
          }
        }}
        currentTime={currentTime}
        currentPrice={currentPrice}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        onJumpToNow={() => loadData(Date.now())}
        onReset={() => {
          if (window.confirm('Reset balance to $10,000?')) {
            resetSimulation();
          }
        }}
        onTimeChange={(time) => loadData(time)}
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Section - Chart & Positions */}
        <div className="flex-1 flex flex-col border-r border-zinc-800 overflow-hidden">
          <div className="flex-1 relative flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-950 text-[10px] font-bold uppercase text-zinc-500">
              <div className="flex gap-4">
                <span className="text-yellow-500 border-b border-yellow-500">Chart</span>
                <span className="hover:text-zinc-300 cursor-pointer">Info</span>
                <span className="hover:text-zinc-300 cursor-pointer">Trading Data</span>
              </div>
              <button 
                onClick={() => setShowOrderBook(!showOrderBook)}
                className={cn(
                  "px-2 py-0.5 rounded transition-all border",
                  showOrderBook 
                    ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200" 
                    : "bg-yellow-500/10 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20"
                )}
              >
                {showOrderBook ? 'Hide Order Book' : 'Show Order Book'}
              </button>
            </div>
            <div className="flex-1 relative">
              <KLineChart 
                klines={klines} 
                currentPrice={currentPrice} 
                position={position}
                history={history}
                updateTPSL={updateTPSL}
                symbolInfo={symbolInfo}
              />
              <ReplayControls 
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                speed={speed}
                setSpeed={setSpeed}
                onJump={(seconds) => loadData(currentTime + seconds * 1000)}
              />
            </div>
          </div>
          
          <div className="h-1/3 min-h-[200px]">
            <HistoryPanel 
              symbol={symbol}
              symbolInfo={symbolInfo}
              history={history} 
              position={position} 
              currentPrice={currentPrice} 
              unrealizedPnl={unrealizedPnl} 
              onClose={handleClose} 
            />
          </div>
        </div>

        {/* Middle Section - Order Book & Recent Trades */}
        {showOrderBook && (
          <div className="w-64 flex flex-col border-r border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="flex-1 min-h-0">
              <OrderBook currentPrice={currentPrice} trades={trades} symbolInfo={symbolInfo} />
            </div>
            <div className="flex-1 min-h-0 border-t border-zinc-800 flex flex-col">
              <div className="p-2 border-b border-zinc-800 text-[10px] font-bold uppercase text-zinc-500 bg-zinc-950">
                Recent Trades
              </div>
              <div className="flex-1 min-h-0">
                <OrderFlowTape trades={trades} symbolInfo={symbolInfo} />
              </div>
            </div>
          </div>
        )}

        {/* Right Section - Trading Panel */}
        <TradingPanel 
          symbol={symbol}
          symbolInfo={symbolInfo}
          balance={balance}
          availableBalance={availableBalance}
          currentPrice={currentPrice}
          orderQty={orderQty}
          setOrderQty={setOrderQty}
          leverage={leverage}
          setLeverage={setLeverage}
          pendingOrder={pendingOrder}
          position={position}
          unrealizedPnl={unrealizedPnl}
          onTrade={handleTrade}
          onClose={handleClose}
        />
      </main>

      {/* Footer */}
      <footer className="h-6 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", isPlaying ? "bg-green-500 animate-pulse" : "bg-zinc-700")} />
            <span>{isPlaying ? "Connected" : "Disconnected"}</span>
          </div>
          <span className="text-zinc-700">|</span>
          <span>Stable Connection</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-yellow-500/50">Binance Futures Simulator</span>
          <span className="text-zinc-800">v2.4.0</span>
        </div>
      </footer>
    </div>
  );
}
