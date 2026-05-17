export interface KLine {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: number;
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean; // true = Sell, false = Buy
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h';

export interface Position {
  type: 'long' | 'short';
  entryPrice: number;
  qty: number;
  filledQty: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  tpPrice?: number;
  slPrice?: number;
  time: number;
  fee: number;
}

export interface TradeHistory {
  type: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  qty: number;
  leverage: number;
  pnl: number;
  fee: number;
  entryTime: number;
  exitTime: number;
}

export interface PendingOrder {
  type: 'long' | 'short';
  side: 'open' | 'close';
  qty: number;
  filledQty: number;
  totalCost: number;
  leverage: number;
}
