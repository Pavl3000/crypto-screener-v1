import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, ColorType, CandlestickData, Time } from 'lightweight-charts';
import { CandleData } from '../services/binance';

interface PriceChartProps {
  data: CandleData[];
  liveCandle?: CandleData;
  symbol: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, liveCandle, symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#d1d1d1',
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Cast data to CandlestickData[] to satisfy types
    series.setData(data as CandlestickData<Time>[]);
    
    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  useEffect(() => {
    if (seriesRef.current && liveCandle) {
      seriesRef.current.update(liveCandle as CandlestickData<Time>);
    }
  }, [liveCandle]);

  return (
    <div className="relative w-full h-full bg-[#0a0a0a]">
      <div className="absolute top-4 left-4 z-10 flex flex-col">
        <span className="text-2xl font-bold text-white tracking-tight">{symbol}</span>
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Binance • 1m Timeframe</span>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};
