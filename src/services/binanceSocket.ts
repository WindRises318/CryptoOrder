import { KLine, Trade, Timeframe } from '../types';

const WS_BASE_URL = 'wss://fstream.binance.com/ws';

export type WSEvent = 
  | { type: 'kline', data: KLine, symbol: string }
  | { type: 'trade', data: Trade, symbol: string }
  | { type: 'ticker', price: number, symbol: string };

type WSCallback = (event: WSEvent) => void;

class BinanceSocketService {
  private ws: WebSocket | null = null;
  private callbacks: Set<WSCallback> = new Set();
  private currentSymbol: string = '';
  private currentTimeframe: Timeframe = '1m';
  private reconnectTimeout: number | null = null;

  constructor() {}

  public subscribe(symbol: string, timeframe: Timeframe, callback: WSCallback) {
    this.callbacks.add(callback);
    
    if (symbol !== this.currentSymbol || timeframe !== this.currentTimeframe) {
      this.currentSymbol = symbol;
      this.currentTimeframe = timeframe;
      this.connect();
    }
  }

  public unsubscribe(callback: WSCallback) {
    this.callbacks.delete(callback);
    if (this.callbacks.size === 0) {
      this.disconnect();
    }
  }

  private connect() {
    this.disconnect();

    const lowerSymbol = this.currentSymbol.toLowerCase();
    const streams = [
      `${lowerSymbol}@kline_${this.currentTimeframe}`,
      `${lowerSymbol}@aggTrade`,
      `${lowerSymbol}@ticker`
    ];

    const url = `wss://fstream.binance.com/stream?streams=${streams.join('/')}`;
    console.log(`Connecting to Binance WS: ${url}`);
    
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.stream && msg.data) {
        this.handleMessage(msg.data);
      } else {
        this.handleMessage(msg);
      }
    };

    this.ws.onclose = () => {
      console.log('Binance WS closed');
      if (this.callbacks.size > 0) {
        this.reconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('Binance WS error:', err);
    };
  }

  private disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private reconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 3000);
  }

  private handleMessage(msg: any) {
    if (msg.e === 'kline') {
      const k = msg.k;
      const kline: KLine = {
        time: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      };
      this.notify({ type: 'kline', data: kline, symbol: msg.s });
    } else if (msg.e === 'aggTrade') {
      const trade: Trade = {
        id: msg.a,
        price: parseFloat(msg.p),
        qty: parseFloat(msg.q),
        time: msg.T,
        isBuyerMaker: msg.m,
      };
      this.notify({ type: 'trade', data: trade, symbol: msg.s });
    } else if (msg.e === '24hrTicker') {
      this.notify({ type: 'ticker', price: parseFloat(msg.c), symbol: msg.s });
    }
  }

  private notify(event: WSEvent) {
    this.callbacks.forEach(cb => cb(event));
  }
}

export const binanceSocket = new BinanceSocketService();
