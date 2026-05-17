import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, IPriceLine, SeriesMarker, createSeriesMarkers } from 'lightweight-charts';
import { KLine, Position, TradeHistory } from '../types';
import { SymbolInfo } from '../services/binance';
import { formatNumber } from '../lib/utils';

interface KLineChartProps {
  klines: KLine[];
  currentPrice: number;
  position: Position | null;
  history: TradeHistory[];
  updateTPSL: (tp?: number, sl?: number) => void;
  symbolInfo: SymbolInfo | null;
}

export const KLineChart: React.FC<KLineChartProps> = ({ klines, currentPrice, position, history, updateTPSL, symbolInfo }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersPluginRef = useRef<import('lightweight-charts').ISeriesMarkersPluginApi<Time> | null>(null);
  
  const entryLineRef = useRef<IPriceLine | null>(null);
  const tpLineRef = useRef<IPriceLine | null>(null);
  const slLineRef = useRef<IPriceLine | null>(null);

  const [dragging, setDragging] = useState<'tp' | 'sl' | 'entry' | null>(null);
  const [previewTPSL, setPreviewTPSL] = useState<{ tp?: number, sl?: number } | null>(null);
  
  // Use refs for values needed in event listeners to avoid stale closures and unnecessary effect re-runs
  const positionRef = useRef(position);
  const updateTPSLRef = useRef(updateTPSL);
  const draggingRef = useRef(dragging);
  const previewTPSLRef = useRef(previewTPSL);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { updateTPSLRef.current = updateTPSL; }, [updateTPSL]);
  useEffect(() => { draggingRef.current = dragging; }, [dragging]);
  useEffect(() => { previewTPSLRef.current = previewTPSL; }, [previewTPSL]);

  // Disable chart interactions while dragging or previewing to prevent chart movement
  useEffect(() => {
    if (!chartRef.current) return;
    const isLocked = dragging !== null || previewTPSL !== null;
    chartRef.current.applyOptions({
      handleScroll: !isLocked,
      handleScale: !isLocked,
    });
  }, [dragging, previewTPSL]);

  // 1. Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#09090b' },
        textColor: '#a1a1aa',
      },
      grid: {
        vertLines: { color: '#18181b' },
        horzLines: { color: '#18181b' },
      },
      crosshair: {
        mode: 0,
        vertLine: { labelBackgroundColor: '#27272a' },
        horzLine: { labelBackgroundColor: '#27272a' },
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time: number, tickMarkType: number) => {
          const date = new Date(time * 1000);
          if (tickMarkType < 3) {
            return date.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
          }
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleString([], { 
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
          });
        },
      },
      rightPriceScale: {
        borderColor: '#27272a',
        autoScale: true,
      },
    });

    const series = (chart as any).addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight
        );
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    window.addEventListener('resize', handleResize);
    handleResize();

    // Dragging Logic
    const container = chartContainerRef.current;
    
    const onMouseDown = (e: MouseEvent) => {
      if (!seriesRef.current || !positionRef.current) return;
      
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      
      const entryY = seriesRef.current.priceToCoordinate(positionRef.current.entryPrice);
      const tpPrice = previewTPSLRef.current?.tp ?? positionRef.current.tpPrice;
      const slPrice = previewTPSLRef.current?.sl ?? positionRef.current.slPrice;
      
      const tpY = tpPrice ? seriesRef.current.priceToCoordinate(tpPrice) : null;
      const slY = slPrice ? seriesRef.current.priceToCoordinate(slPrice) : null;

      const pixelThreshold = 15;

      if (tpY !== null && Math.abs(y - tpY) < pixelThreshold) {
        setDragging('tp');
        if (!previewTPSLRef.current) {
          setPreviewTPSL({ tp: tpPrice, sl: slPrice });
        }
      } else if (slY !== null && Math.abs(y - slY) < pixelThreshold) {
        setDragging('sl');
        if (!previewTPSLRef.current) {
          setPreviewTPSL({ tp: tpPrice, sl: slPrice });
        }
      } else if (entryY !== null && Math.abs(y - entryY) < pixelThreshold) {
        setDragging('entry');
        if (!previewTPSLRef.current) {
          setPreviewTPSL({ tp: tpPrice, sl: slPrice });
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!seriesRef.current || !positionRef.current) return;

      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      let price = seriesRef.current.coordinateToPrice(y);
      if (price === null) return;

      const tickSize = symbolInfo?.tickSize || 0.01;
      price = Math.round(price / tickSize) * tickSize;

      // Update cursor style
      const entryY = seriesRef.current.priceToCoordinate(positionRef.current.entryPrice);
      const tpPrice = previewTPSLRef.current?.tp ?? positionRef.current.tpPrice;
      const slPrice = previewTPSLRef.current?.sl ?? positionRef.current.slPrice;
      
      const tpY = tpPrice ? seriesRef.current.priceToCoordinate(tpPrice) : null;
      const slY = slPrice ? seriesRef.current.priceToCoordinate(slPrice) : null;
      const pixelThreshold = 15;

      const isNearLine = (entryY !== null && Math.abs(y - entryY) < pixelThreshold) ||
                         (tpY !== null && Math.abs(y - tpY) < pixelThreshold) ||
                         (slY !== null && Math.abs(y - slY) < pixelThreshold);

      container.style.cursor = draggingRef.current ? 'grabbing' : (isNearLine ? 'ns-resize' : 'crosshair');

      if (!draggingRef.current) return;

      const isLong = positionRef.current.type === 'long';

      if (draggingRef.current === 'tp') {
        const isProfit = isLong ? price > positionRef.current.entryPrice : price < positionRef.current.entryPrice;
        if (isProfit) {
          setPreviewTPSL(prev => ({ ...prev, tp: price }));
        }
      } else if (draggingRef.current === 'sl') {
        const isLoss = isLong ? price < positionRef.current.entryPrice : price > positionRef.current.entryPrice;
        if (isLoss) {
          setPreviewTPSL(prev => ({ ...prev, sl: price }));
        }
      } else if (draggingRef.current === 'entry') {
        const isAbove = price > positionRef.current.entryPrice;
        
        if (isLong) {
          if (isAbove) { // Profit zone for Long
            setPreviewTPSL({ tp: price, sl: positionRef.current.slPrice });
          } else { // Loss zone for Long
            setPreviewTPSL({ tp: positionRef.current.tpPrice, sl: price });
          }
        } else { // Short
          if (isAbove) { // Loss zone for Short
            setPreviewTPSL({ tp: positionRef.current.tpPrice, sl: price });
          } else { // Profit zone for Short
            setPreviewTPSL({ tp: price, sl: positionRef.current.slPrice });
          }
        }
      }
    };

    const onMouseUp = () => {
      setDragging(null);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []); // Empty dependency array: only run once

  // 2. Update Data
  useEffect(() => {
    if (!seriesRef.current || klines.length === 0) return;

    const data: CandlestickData[] = klines.map(k => ({
      time: (k.time / 1000) as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    seriesRef.current.setData(data);
  }, [klines]);

  // 2.5 Update Markers (Trade History)
  useEffect(() => {
    if (!seriesRef.current || history.length === 0) {
      if (markersPluginRef.current) {
        markersPluginRef.current.setMarkers([]);
      }
      return;
    }

    const markers: SeriesMarker<Time>[] = [];
    
    // Process history
    history.forEach(trade => {
      // Entry marker
      markers.push({
        time: (trade.entryTime / 1000) as Time,
        position: trade.type === 'long' ? 'belowBar' : 'aboveBar',
        color: trade.type === 'long' ? '#22c55e' : '#ef4444',
        shape: trade.type === 'long' ? 'arrowUp' : 'arrowDown',
        text: 'ENTRY',
      });
      
      // Exit marker
      markers.push({
        time: (trade.exitTime / 1000) as Time,
        position: trade.type === 'long' ? 'aboveBar' : 'belowBar',
        color: trade.pnl >= 0 ? '#22c55e' : '#ef4444',
        shape: trade.pnl >= 0 ? 'circle' : 'square',
        text: trade.pnl >= 0 ? 'PROFIT' : 'LOSS',
      });
    });

    if (!markersPluginRef.current && seriesRef.current) {
      markersPluginRef.current = createSeriesMarkers(seriesRef.current, markers);
    } else if (markersPluginRef.current) {
      markersPluginRef.current.setMarkers(markers);
    }
  }, [history]);

  // 2.6 Update Symbol Precision
  useEffect(() => {
    if (!seriesRef.current || !symbolInfo) return;
    
    seriesRef.current.applyOptions({
      priceFormat: {
        type: 'price',
        precision: symbolInfo.pricePrecision,
        minMove: symbolInfo.tickSize,
      },
    });

    if (chartRef.current) {
      chartRef.current.applyOptions({
        localization: {
          priceFormatter: (p: number) => p.toFixed(symbolInfo.pricePrecision),
        },
      });
    }
  }, [symbolInfo]);

  // 3. Update Current Price
  useEffect(() => {
    if (!seriesRef.current || klines.length === 0 || currentPrice === 0) return;

    const lastKLine = klines[klines.length - 1];
    seriesRef.current.update({
      time: (lastKLine.time / 1000) as Time,
      open: lastKLine.open,
      high: Math.max(lastKLine.high, currentPrice),
      low: Math.min(lastKLine.low, currentPrice),
      close: currentPrice,
    });
  }, [currentPrice, klines]);

  // 4. Update Price Lines
  useEffect(() => {
    if (!seriesRef.current) return;

    // Clear old lines
    if (entryLineRef.current) {
      seriesRef.current.removePriceLine(entryLineRef.current);
      entryLineRef.current = null;
    }
    if (tpLineRef.current) {
      seriesRef.current.removePriceLine(tpLineRef.current);
      tpLineRef.current = null;
    }
    if (slLineRef.current) {
      seriesRef.current.removePriceLine(slLineRef.current);
      slLineRef.current = null;
    }

    if (!position) return;

    const displayTP = previewTPSL?.tp ?? position.tpPrice;
    const displaySL = previewTPSL?.sl ?? position.slPrice;

    // Entry Line
    entryLineRef.current = seriesRef.current.createPriceLine({
      price: position.entryPrice,
      color: '#eab308',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: `ENTRY ${position.leverage}x`,
    });

    // TP Line
    if (displayTP) {
      tpLineRef.current = seriesRef.current.createPriceLine({
        price: displayTP,
        color: previewTPSL?.tp ? '#fbbf24' : '#22c55e', // Yellow if previewing
        lineWidth: previewTPSL?.tp ? 2 : 1,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: previewTPSL?.tp ? 'TP (PREVIEW)' : 'TP',
      });
    }

    // SL Line
    if (displaySL) {
      slLineRef.current = seriesRef.current.createPriceLine({
        price: displaySL,
        color: previewTPSL?.sl ? '#fbbf24' : '#ef4444', // Yellow if previewing
        lineWidth: previewTPSL?.sl ? 2 : 1,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: previewTPSL?.sl ? 'SL (PREVIEW)' : 'SL',
      });
    }
  }, [position, previewTPSL]);

  const handleConfirm = () => {
    if (previewTPSL) {
      updateTPSL(previewTPSL.tp, previewTPSL.sl);
      setPreviewTPSL(null);
    }
  };

  const handleCancel = () => {
    setPreviewTPSL(null);
  };

  return (
    <div className="w-full h-full relative bg-zinc-950">
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* Confirmation Overlay */}
      {previewTPSL && !dragging && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-zinc-900 border border-zinc-800 p-4 rounded-lg shadow-2xl flex flex-col gap-4 min-w-[200px]">
          <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-2">Confirm TP/SL Change</div>
          <div className="space-y-2">
            {previewTPSL.tp !== position?.tpPrice && (
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">New TP Price</span>
                <span className="text-green-400 font-mono font-bold">{formatNumber(previewTPSL.tp, symbolInfo?.pricePrecision || 2)}</span>
              </div>
            )}
            {previewTPSL.sl !== position?.slPrice && (
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">New SL Price</span>
                <span className="text-red-400 font-mono font-bold">{formatNumber(previewTPSL.sl, symbolInfo?.pricePrecision || 2)}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCancel}
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-[10px] font-bold rounded transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Price Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{symbolInfo?.symbol || 'BTCUSDT'}</span>
          <span className="text-zinc-300 text-xs font-mono font-bold">{formatNumber(currentPrice, symbolInfo?.pricePrecision || 2)}</span>
        </div>
        {position && (
          <div className="flex flex-col gap-1 mt-2">
            {!position.tpPrice && (
              <button 
                className="pointer-events-auto bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[9px] font-bold px-2 py-1 rounded border border-green-500/30 transition-colors"
                onClick={() => updateTPSL(position.entryPrice * (position.type === 'long' ? 1.05 : 0.95), position.slPrice)}
              >
                + ADD TP
              </button>
            )}
            {!position.slPrice && (
              <button 
                className="pointer-events-auto bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-bold px-2 py-1 rounded border border-red-500/30 transition-colors"
                onClick={() => updateTPSL(position.tpPrice, position.entryPrice * (position.type === 'long' ? 0.95 : 1.05))}
              >
                + ADD SL
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
