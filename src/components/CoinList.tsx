import React from 'react';
import { CoinTicker } from '../services/binance';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface CoinListProps {
  coins: CoinTicker[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

export const CoinList: React.FC<CoinListProps> = ({ coins, selectedSymbol, onSelect }) => {
  return (
    <div className="flex flex-col h-full bg-[#141414] border-r border-zinc-800 overflow-hidden">
      <div className="p-4 border-bottom border-zinc-800 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-emerald-500" />
        <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">Top Volume (24h)</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {coins.map((coin) => {
          const isSelected = coin.symbol === selectedSymbol;
          const isPositive = parseFloat(coin.priceChangePercent) >= 0;
          const volume = (parseFloat(coin.quoteVolume) / 1000000).toFixed(2);

          return (
            <button
              key={coin.symbol}
              onClick={() => onSelect(coin.symbol)}
              className={cn(
                "w-full px-4 py-3 flex items-center justify-between transition-all duration-200 border-b border-zinc-900/50",
                "hover:bg-zinc-800/50 group",
                isSelected ? "bg-zinc-800 border-l-2 border-l-emerald-500" : "bg-transparent"
              )}
            >
              <div className="flex flex-col items-start">
                <span className={cn(
                  "text-sm font-bold tracking-tight",
                  isSelected ? "text-emerald-400" : "text-zinc-200 group-hover:text-white"
                )}>
                  {coin.symbol.replace('USDT', '')}
                  <span className="text-[10px] text-zinc-500 ml-1">/USDT</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Vol: ${volume}M
                </span>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono text-zinc-100">
                  {parseFloat(coin.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-mono",
                  isPositive ? "text-emerald-500" : "text-rose-500"
                )}>
                  {isPositive ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                  {isPositive ? '+' : ''}{coin.priceChangePercent}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
