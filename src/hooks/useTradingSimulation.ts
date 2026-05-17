import { useState, useEffect, useRef, useCallback } from 'react';
import { KLine, Trade, Timeframe, PendingOrder, Position, TradeHistory } from '../types';
import { fetchKLines, fetchAggTrades, getSymbolInfo, SymbolInfo } from '../services/binance';
import { binanceSocket, WSEvent } from '../services/binanceSocket';

const FEE_RATE = 0.001;

export function useTradingSimulation(symbol: string, initialTimeframe: Timeframe) {
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [klines, setKlines] = useState<KLine[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [balance, setBalance] = useState(10000);
  const [orderQty, setOrderQty] = useState(0.015); // Approx 1000 USDT at 65k
  const [leverage, setLeverage] = useState(10);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [history, setHistory] = useState<TradeHistory[]>([]);
  
  // Refs to keep track of latest state for the async trading engine
  const pendingOrderRef = useRef<PendingOrder | null>(null);
  const positionRef = useRef<Position | null>(null);
  const balanceRef = useRef<number>(10000);
  const timeframeRef = useRef<Timeframe>(initialTimeframe);

  useEffect(() => { pendingOrderRef.current = pendingOrder; }, [pendingOrder]);
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { timeframeRef.current = timeframe; }, [timeframe]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTime = useRef<number>(0);
  const lastProcessedTradeId = useRef<number>(0);
  const lastSimulatedTime = useRef<number>(0);

  const currentPrice = trades[0]?.price || klines[klines.length - 1]?.close || 0;

  const loadData = useCallback(async (targetTime: number) => {
    try {
      const timeframeMs = {
        '1m': 60000, '5m': 300000, '15m': 900000, 
        '30m': 1800000, '1h': 3600000, '4h': 14400000, '1d': 86400000
      }[timeframe];
      
      // Fetch 200 candles ending near targetTime
      const fetchStartTime = targetTime - (200 * timeframeMs);
      const data = await fetchKLines(symbol, timeframe, fetchStartTime, 200);
      
      if (Array.isArray(data) && data.length > 0) {
        setKlines(data);
        // Set current time to the target time, or the last candle if target is in the future
        const lastCandleTime = data[data.length - 1].time;
        const actualStartTime = Math.min(targetTime, lastCandleTime);
        
        setCurrentTime(actualStartTime);
        lastSimulatedTime.current = actualStartTime;
        lastFetchTime.current = actualStartTime;
        lastProcessedTradeId.current = 0;
        
        // Fetch initial trades for the new time
        const initialTrades = await fetchAggTrades(symbol, actualStartTime - 5000, actualStartTime);
        if (initialTrades.length > 0) {
          const lastTrade = initialTrades[initialTrades.length - 1];
          const price = lastTrade.price;
          
          lastProcessedTradeId.current = Math.max(...initialTrades.map(t => t.id));
          setTrades([...initialTrades].reverse().slice(0, 100));
          
          // Adjust order scale for different symbols
          if (price > 0) {
            const targetValue = 1000; // Default $1,000 position
            let initialQty = targetValue / price;
            
            const info = getSymbolInfo(symbol);
            if (info) {
              const factor = Math.pow(10, info.quantityPrecision);
              initialQty = Math.floor(initialQty * factor) / factor;
            } else {
              // Fallback logic
              if (price < 1) initialQty = Math.round(initialQty);
              else if (price < 100) initialQty = parseFloat(initialQty.toFixed(2));
              else initialQty = parseFloat(initialQty.toFixed(4));
            }
            
            setOrderQty(initialQty || 0.001);
          }
        } else {
          setTrades([]);
        }
      }
    } catch (error) {
      console.error("Failed to load K-lines:", error);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    setKlines([]);
    setTrades([]);
    const now = Date.now();
    const start = now - 1000 * 60 * 60 * 24;
    loadData(start);
  }, [loadData]);

  const isFetchingRef = useRef(false);
  const tradesBufferRef = useRef<Trade[]>([]);

  // WebSocket Integration
  useEffect(() => {
    const handleWsEvent = (event: WSEvent) => {
      if (event.symbol !== symbol) return;

      if (event.type === 'trade') {
        // If we are "near" live, we can use these trades
        const now = Date.now();
        if (Math.abs(currentTime - now) < 5000) {
          setTrades(prev => [event.data, ...prev].slice(0, 100));
          lastProcessedTradeId.current = Math.max(lastProcessedTradeId.current, event.data.id);
        } else {
          // Buffer them for later use if needed, or just ignore if we are far in the past
          tradesBufferRef.current = [event.data, ...tradesBufferRef.current].slice(0, 500);
        }
      } else if (event.type === 'kline') {
        const now = Date.now();
        if (Math.abs(currentTime - now) < 5000) {
          setKlines(prev => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];
            if (event.data.time === last.time) {
              return [...prev.slice(0, -1), event.data];
            } else if (event.data.time > last.time) {
              return [...prev.slice(1), event.data];
            }
            return prev;
          });
        }
      }
    };

    binanceSocket.subscribe(symbol, timeframe, handleWsEvent);
    return () => binanceSocket.unsubscribe(handleWsEvent);
  }, [symbol, timeframe, currentTime]);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 100;
      timerRef.current = setInterval(async () => {
        setCurrentTime(prev => {
          const next = prev + intervalMs * speed;
          
          const now = Date.now();
          const isNearLive = Math.abs(next - now) < 5000;

          if (currentPrice > 0 && !isNearLive) {
            setKlines(prevKlines => {
              if (prevKlines.length === 0) return prevKlines;
              const lastCandle = prevKlines[prevKlines.length - 1];
              const timeframeMs = {
                '1m': 60000, '5m': 300000, '15m': 900000, 
                '30m': 1800000, '1h': 3600000, '4h': 14400000, '1d': 86400000
              }[timeframe];

              if (next >= lastCandle.time + timeframeMs) {
                const newCandle: KLine = {
                  time: lastCandle.time + timeframeMs,
                  open: currentPrice,
                  high: currentPrice,
                  low: currentPrice,
                  close: currentPrice,
                  volume: 0
                };
                return [...prevKlines.slice(1), newCandle];
              } else {
                const updatedCandle = {
                  ...lastCandle,
                  high: Math.max(lastCandle.high, currentPrice),
                  low: Math.min(lastCandle.low, currentPrice),
                  close: currentPrice
                };
                return [...prevKlines.slice(0, -1), updatedCandle];
              }
            });
          }

                  // Process Trading Engine & Liquidation
                  const processTradingEngine = (unprocessedTrades: Trade[], timestamp: number) => {
                    const currentPriceValue = unprocessedTrades[0]?.price || currentPrice;
                    
                    // 1. Process Pending Order
                    const currentPending = pendingOrderRef.current;
                    const currentPos = positionRef.current;
                    
                    if (currentPending) {
                      const pending = { ...currentPending };
                      let remainingToFill = pending.qty - pending.filledQty;
                      let newlyFilledQty = 0;
                      let newlyFilledCost = 0;
                      
                      const targetIsBuyerMaker = pending.type === 'long' ? false : true;

                      for (const t of unprocessedTrades) {
                        if (t.isBuyerMaker === targetIsBuyerMaker || speed > 5) { 
                          const fill = Math.min(remainingToFill, t.qty);
                          newlyFilledQty += fill;
                          newlyFilledCost += fill * t.price;
                          remainingToFill -= fill;
                          if (remainingToFill <= 0) break;
                        }
                      }

                      if (newlyFilledQty > 0) {
                        pending.filledQty += newlyFilledQty;
                        pending.totalCost += newlyFilledCost;

                        if (pending.filledQty >= pending.qty) {
                          const avgPrice = pending.totalCost / pending.qty;
                          const fee = pending.totalCost * FEE_RATE;
                          
                          if (pending.side === 'open') {
                            const margin = pending.totalCost / pending.leverage;
                            const liqPrice = pending.type === 'long' 
                              ? avgPrice * (1 - 0.9 / pending.leverage)
                              : avgPrice * (1 + 0.9 / pending.leverage);

                            const newPos: Position = {
                              type: pending.type,
                              entryPrice: avgPrice,
                              qty: pending.qty,
                              filledQty: pending.qty,
                              leverage: pending.leverage,
                              margin: margin,
                              liquidationPrice: liqPrice,
                              time: timestamp,
                              fee: fee
                            };
                            
                            setPosition(newPos);
                            setBalance(b => b - fee);
                            setPendingOrder(null);
                          } else {
                            if (currentPos) {
                              const pnl = pending.type === 'long'
                                ? (avgPrice - currentPos.entryPrice) * currentPos.qty
                                : (currentPos.entryPrice - avgPrice) * currentPos.qty;
                              
                              const totalFee = currentPos.fee + fee;

                              setBalance(b => b + pnl - fee);
                              setHistory(h => [{
                                type: currentPos.type,
                                entryPrice: currentPos.entryPrice,
                                exitPrice: avgPrice,
                                qty: currentPos.qty,
                                leverage: currentPos.leverage,
                                pnl: pnl,
                                fee: totalFee,
                                entryTime: currentPos.time,
                                exitTime: timestamp
                              }, ...h]);
                              setPosition(null);
                              setPendingOrder(null);
                            }
                          }
                        } else {
                          setPendingOrder(pending);
                        }
                      }
                    }

                    // 2. Liquidation & TP/SL Check
                    setPosition(pos => {
                      if (!pos) return null;
                      
                      const isLiquidated = pos.type === 'long' 
                        ? currentPriceValue <= pos.liquidationPrice
                        : currentPriceValue >= pos.liquidationPrice;

                      const isTPHit = pos.tpPrice && (pos.type === 'long' 
                        ? currentPriceValue >= pos.tpPrice
                        : currentPriceValue <= pos.tpPrice);

                      const isSLHit = pos.slPrice && (pos.type === 'long' 
                        ? currentPriceValue <= pos.slPrice
                        : currentPriceValue >= pos.slPrice);

                      if (isLiquidated || isTPHit || isSLHit) {
                        const exitPrice = isLiquidated ? pos.liquidationPrice : currentPriceValue;
                        const pnl = pos.type === 'long' 
                          ? (exitPrice - pos.entryPrice) * pos.qty 
                          : (pos.entryPrice - exitPrice) * pos.qty;
                        
                        const exitFee = (pos.qty * exitPrice) * FEE_RATE;
                        const totalFee = pos.fee + exitFee;

                        setBalance(b => b + pnl - exitFee);
                        setHistory(h => [{
                          type: pos.type,
                          entryPrice: pos.entryPrice,
                          exitPrice: exitPrice,
                          qty: pos.qty,
                          leverage: pos.leverage,
                          pnl: pnl,
                          fee: totalFee,
                          entryTime: pos.time,
                          exitTime: timestamp
                        }, ...h]);
                        return null;
                      }
                      return pos;
                    });
                  };

                  if (next - lastFetchTime.current > 2000 && !isFetchingRef.current) {
                    const now = Date.now();
                    if (Math.abs(next - now) < 5000) {
                      // Near live: use trades from WebSocket buffer
                      const wsTrades = tradesBufferRef.current.filter(t => t.id > lastProcessedTradeId.current && t.time <= next);
                      if (wsTrades.length > 0) {
                        lastProcessedTradeId.current = Math.max(...wsTrades.map(t => t.id));
                        processTradingEngine(wsTrades, next);
                        // Clean up old trades from buffer
                        tradesBufferRef.current = tradesBufferRef.current.filter(t => t.time > next - 30000);
                      }
                      lastFetchTime.current = next;
                    } else {
                      // Far from live: fetch via REST
                      isFetchingRef.current = true;
                      const fetchStart = Math.max(lastFetchTime.current, next - 10000);
                      const fetchEnd = next;
                      
                      fetchAggTrades(symbol, fetchStart, fetchEnd).then(newTrades => {
                        if (newTrades.length > 0) {
                          const unprocessedTrades = newTrades.filter(t => t.id > lastProcessedTradeId.current && t.time <= next);
                          if (unprocessedTrades.length > 0) {
                            lastProcessedTradeId.current = Math.max(...unprocessedTrades.map(t => t.id));
                            const reversed = [...unprocessedTrades].reverse();
                            setTrades(prevTrades => [...reversed, ...prevTrades].slice(0, 100));
                            processTradingEngine(unprocessedTrades, next);
                          }
                        }
                        lastFetchTime.current = next;
                      }).finally(() => {
                        isFetchingRef.current = false;
                      });
                    }
                  }

          return next;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, symbol, timeframe, currentPrice]);

  const handleTrade = (type: 'long' | 'short') => {
    if (position || pendingOrder) return;
    const newOrder: PendingOrder = {
      type,
      side: 'open',
      qty: orderQty,
      filledQty: 0,
      totalCost: 0,
      leverage
    };
    setPendingOrder(newOrder);
    pendingOrderRef.current = newOrder; // Update ref immediately
  };

  const handleClose = () => {
    if (!position || pendingOrder) return;
    const newOrder: PendingOrder = {
      type: position.type,
      side: 'close',
      qty: position.qty,
      filledQty: 0,
      totalCost: 0,
      leverage: position.leverage
    };
    setPendingOrder(newOrder);
    pendingOrderRef.current = newOrder; // Update ref immediately
  };

  const updateTPSL = (tp?: number, sl?: number) => {
    setPosition(pos => {
      if (!pos) return null;
      return { ...pos, tpPrice: tp, slPrice: sl };
    });
  };

  const resetSimulation = () => {
    setBalance(10000);
    balanceRef.current = 10000;
    setHistory([]);
    setPosition(null);
    positionRef.current = null;
    setPendingOrder(null);
    pendingOrderRef.current = null;
    lastProcessedTradeId.current = 0;
  };

  const unrealizedPnl = position 
    ? (position.type === 'long' ? (currentPrice - position.entryPrice) * position.qty : (position.entryPrice - currentPrice) * position.qty)
    : 0;

  return {
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
    symbolInfo: getSymbolInfo(symbol)
  };
}
