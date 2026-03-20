import { useEffect, useState, useCallback } from 'react';
import { BinanceService, CoinTicker, CandleData } from './services/binance';
import { CoinList } from './components/CoinList';
import { PriceChart } from './components/PriceChart';
import { Loader2, RefreshCw, BarChart3 } from 'lucide-react';

export default function App() {
  const [coins, setCoins] = useState<CoinTicker[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [klines, setKlines] = useState<CandleData[]>([]);
  const [liveCandle, setLiveCandle] = useState<CandleData | undefined>();
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const topCoins = await BinanceService.getTopVolumeCoins(30);
      setCoins(topCoins);
      
      // If current selected symbol is not in top coins, keep it or pick first
      if (!topCoins.find(c => c.symbol === selectedSymbol)) {
        setSelectedSymbol(topCoins[0].symbol);
      }
      
      setChartLoading(true);
      const history = await BinanceService.getKlines(selectedSymbol);
      setKlines(history);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setChartLoading(true);
        const history = await BinanceService.getKlines(selectedSymbol);
        setKlines(history);
        setError(null);
      } catch (err) {
        setError('Failed to fetch history');
        console.error(err);
      } finally {
        setChartLoading(false);
      }
    };
    
    if (!loading) {
      fetchHistory();
    }
  }, [selectedSymbol, loading]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh list every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const ws = BinanceService.subscribeToKline(selectedSymbol, '1m', (candle) => {
      setLiveCandle(candle);
    });

    return () => ws.close();
  }, [selectedSymbol]);

  if (loading && coins.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a] text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mr-3" />
        <span className="font-mono text-sm tracking-widest uppercase">Initializing Screener...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] text-zinc-200 overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-[#141414]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-black" />
          </div>
          <h1 className="text-sm font-bold tracking-tighter uppercase">
            Crypto<span className="text-emerald-500">Volume</span> Screener
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE DATA
          </div>
          <button 
            onClick={() => fetchData()}
            className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <CoinList 
            coins={coins} 
            selectedSymbol={selectedSymbol} 
            onSelect={(symbol) => {
              setSelectedSymbol(symbol);
              setLiveCandle(undefined);
            }} 
          />
        </aside>

        {/* Chart Area */}
        <section className="flex-1 relative">
          {chartLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.2em]">Loading 3-Day History...</span>
              </div>
            </div>
          )}
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm z-50">
              <div className="text-center">
                <p className="text-rose-500 font-mono mb-4">{error}</p>
                <button 
                  onClick={() => fetchData()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-bold transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : (
            <PriceChart 
              data={klines} 
              liveCandle={liveCandle} 
              symbol={selectedSymbol} 
            />
          )}
        </section>
      </main>
      
      {/* Footer / Status Bar */}
      <footer className="h-6 border-t border-zinc-800 bg-[#141414] px-4 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <div className="flex gap-4">
          <span>API: api.binance.com</span>
          <span>WS: stream.binance.com</span>
        </div>
        <div>
          {new Date().toUTCString()}
        </div>
      </footer>
    </div>
  );
}
