export interface CoinTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export class BinanceService {
  private static BASE_URL = 'https://api.binance.com/api/v3';
  private static FUTURES_API_URL = 'https://fapi.binance.com/fapi/v1';
  private static WS_URL = 'wss://stream.binance.com:9443/ws';

  static async getTopVolumeCoins(limit: number = 20): Promise<CoinTicker[]> {
    // Fetch futures exchange info to get the list of symbols with futures
    const futuresResponse = await fetch(`${this.FUTURES_API_URL}/exchangeInfo`);
    const futuresData = await futuresResponse.json();
    const futuresSymbols = new Set(futuresData.symbols.map((s: any) => s.symbol));

    const response = await fetch(`${this.BASE_URL}/ticker/24hr`);
    const data: CoinTicker[] = await response.json();
    
    // Filter for USDT pairs that also have futures and sort by quote volume
    return data
      .filter(ticker => ticker.symbol.endsWith('USDT') && futuresSymbols.has(ticker.symbol))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit);
  }

  static async getKlines(symbol: string, interval: string = '1m', limit: number = 500): Promise<CandleData[]> {
    const response = await fetch(`${this.BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    const data = await response.json();
    
    return data.map((d: any) => ({
      time: d[0] / 1000,
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
    }));
  }

  static subscribeToKline(symbol: string, interval: string, onMessage: (candle: CandleData) => void): WebSocket {
    const ws = new WebSocket(`${this.WS_URL}/${symbol.toLowerCase()}@kline_${interval}`);
    
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const k = msg.k;
      onMessage({
        time: k.t / 1000,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
      });
    };

    return ws;
  }
}
