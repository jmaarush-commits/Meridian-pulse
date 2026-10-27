import React, { useMemo, useState } from 'react';
import {
  StockAsset,
  TimeframeKey,
  generateOHLCVSeries,
  calculateTechnicalIndicators,
} from '../lib/marketEngine';

interface InteractiveChartProps {
  stock: StockAsset;
  timeframe: TimeframeKey;
  onTimeframeChange: (tf: TimeframeKey) => void;
  onOpenAiPrompt: (prompt: string) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  stock,
  timeframe,
  onTimeframeChange,
  onOpenAiPrompt,
}) => {
  const [chartType, setChartType] = useState<'area' | 'candle'>('candle');
  const [showSma, setShowSma] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series = useMemo(
    () => generateOHLCVSeries(stock, timeframe),
    [stock, timeframe]
  );

  const indicators = useMemo(
    () => calculateTechnicalIndicators(series.map((p) => p.close)),
    [series]
  );

  const activePoint =
    hoverIndex !== null && series[hoverIndex]
      ? series[hoverIndex]
      : series[series.length - 1];

  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    for (const pt of series) {
      if (pt.low < min) min = pt.low;
      if (pt.high > max) max = pt.high;
      if (pt.volume > maxVol) maxVol = pt.volume;
    }
    const pad = Math.max(0.5, (max - min) * 0.08);
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      maxVolume: Math.max(1, maxVol),
    };
  }, [series]);

  const width = 760;
  const height = 300;
  const priceHeight = 232;
  const volTop = 246;
  const volHeight = 46;

  const getX = (idx: number) => {
    if (series.length <= 1) return width / 2;
    return 16 + (idx / (series.length - 1)) * (width - 32);
  };

  const getY = (price: number) => {
    const ratio = (price - minPrice) / Math.max(0.0001, maxPrice - minPrice);
    return priceHeight - 12 - ratio * (priceHeight - 28);
  };

  const linePoints = series
    .map((pt, idx) => `${getX(idx).toFixed(1)},${getY(pt.close).toFixed(1)}`)
    .join(' ');

  const areaPoints = `${getX(0).toFixed(1)},${priceHeight} ${linePoints} ${getX(
    series.length - 1
  ).toFixed(1)},${priceHeight}`;

  // Running SMA-10 line for visual overlay
  const smaPoints = useMemo(() => {
    return series
      .map((_, idx) => {
        const start = Math.max(0, idx - 9);
        const slice = series.slice(start, idx + 1);
        const avg = slice.reduce((acc, s) => acc + s.close, 0) / slice.length;
        return `${getX(idx).toFixed(1)},${getY(avg).toFixed(1)}`;
      })
      .join(' ');
  }, [series, minPrice, maxPrice]);

  const isPositive = stock.change >= 0;
  const strokeColor = isPositive ? '#10B981' : '#EF4444';

  const priceTicks = useMemo(() => {
    const count = 5;
    const step = (maxPrice - minPrice) / (count - 1);
    return Array.from({ length: count }, (_, i) => Number((maxPrice - i * step).toFixed(2)));
  }, [minPrice, maxPrice]);

  return (
    <section
      aria-label={`${stock.symbol} interactive price chart`}
      className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 flex flex-col gap-4"
    >
      {/* Top Quote Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-50 font-display">
              {stock.symbol}
            </h1>
            <span className="text-sm text-slate-300 font-medium">{stock.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span>{stock.exchange}</span>
            <span aria-hidden="true">·</span>
            <span>{stock.sector}</span>
            <span aria-hidden="true">·</span>
            <span>Mkt Cap ${stock.marketCapB.toLocaleString()}B</span>
            <span aria-hidden="true">·</span>
            <span>P/E {stock.peRatio.toFixed(1)}x</span>
          </div>
        </div>

        <div className="flex items-baseline gap-4">
          <div className="text-right">
            <div
              data-testid="active-stock-price"
              className="text-2xl font-bold font-mono tabular-nums text-slate-50"
            >
              ${stock.price.toFixed(2)}
            </div>
            <div
              className={`text-xs font-mono tabular-nums font-medium ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? '▲ +' : '▼ '}
              {stock.change.toFixed(2)} ({isPositive ? '+' : ''}
              {stock.changePercent.toFixed(2)}%)
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenAiPrompt(
                `Provide a technical and fundamental breakdown for ${stock.symbol} at $${stock.price.toFixed(2)}.`
              )
            }
            className="px-3 py-2 text-xs font-medium text-blue-300 bg-blue-950/60 border border-blue-800/70 rounded-md hover:bg-blue-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Analyze {stock.symbol} with AI
          </button>
        </div>
      </div>

      {/* Toolbar: Timeframe & Chart Mode Controls + Live OHLCV Readout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Chart timeframe"
            className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-md"
          >
            {(['1D', '1W', '1M', '1Y'] as TimeframeKey[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                aria-pressed={timeframe === tf}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Chart display style"
            className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-md"
          >
            <button
              type="button"
              onClick={() => setChartType('candle')}
              aria-pressed={chartType === 'candle'}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartType === 'candle'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candles
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              aria-pressed={chartType === 'area'}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                chartType === 'area'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Area
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowSma((prev) => !prev)}
            aria-pressed={showSma}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showSma
                ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            SMA Overlay
          </button>
        </div>

        {/* Active Bar OHLCV Telemetry */}
        {activePoint && (
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-slate-400">
            <span>{activePoint.timestamp}</span>
            <span>
              O <strong className="text-slate-200 font-normal">${activePoint.open.toFixed(2)}</strong>
            </span>
            <span>
              H <strong className="text-slate-200 font-normal">${activePoint.high.toFixed(2)}</strong>
            </span>
            <span>
              L <strong className="text-slate-200 font-normal">${activePoint.low.toFixed(2)}</strong>
            </span>
            <span>
              C <strong className="text-slate-200 font-normal">${activePoint.close.toFixed(2)}</strong>
            </span>
            <span>
              Vol{' '}
              <strong className="text-slate-200 font-normal">
                {(activePoint.volume / 1000).toFixed(0)}K
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden bg-[#0B0F17] border border-slate-800/90 rounded-md p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[270px] select-none block"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`areaGrad-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Price Grid Lines */}
          {priceTicks.map((tickVal, idx) => {
            const y = getY(tickVal);
            return (
              <g key={idx}>
                <line
                  x1={12}
                  y1={y}
                  x2={width - 58}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  ${tickVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Separator between Price and Volume */}
          <line
            x1={12}
            y1={priceHeight + 4}
            x2={width - 12}
            y2={priceHeight + 4}
            stroke="#1E293B"
            strokeWidth="1"
          />

          {/* Area or Candlestick Plot */}
          {chartType === 'area' ? (
            <>
              <polygon points={areaPoints} fill={`url(#areaGrad-${stock.symbol})`} />
              <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                points={linePoints}
              />
            </>
          ) : (
            series.map((pt, idx) => {
              const x = getX(idx);
              const isBull = pt.close >= pt.open;
              const color = isBull ? '#10B981' : '#EF4444';
              const yHigh = getY(pt.high);
              const yLow = getY(pt.low);
              const yOpen = getY(pt.open);
              const yClose = getY(pt.close);
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2.5, Math.abs(yClose - yOpen));
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  <rect
                    x={x - 4}
                    y={bodyTop}
                    width={8}
                    height={bodyHeight}
                    fill={color}
                    rx={1}
                  />
                </g>
              );
            })
          )}

          {/* SMA Overlay Line */}
          {showSma && (
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              points={smaPoints}
            />
          )}

          {/* Volume Histogram Bars */}
          {series.map((pt, idx) => {
            const x = getX(idx);
            const isBull = pt.close >= pt.open;
            const barH = Math.max(2, (pt.volume / maxVolume) * volHeight);
            const y = volTop + (volHeight - barH);
            return (
              <rect
                key={`vol-${idx}`}
                x={x - 3.5}
                y={y}
                width={7}
                height={barH}
                fill={isBull ? '#10B981' : '#EF4444'}
                opacity={hoverIndex === idx ? 0.85 : 0.35}
              />
            );
          })}

          {/* Crosshair Hover Line */}
          {hoverIndex !== null && series[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={8}
                x2={getX(hoverIndex)}
                y2={height - 6}
                stroke="#64748B"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(series[hoverIndex].close)}
                r={4}
                fill={strokeColor}
                stroke="#0B0F17"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Interactive Hover Hit Columns */}
          {series.map((_, idx) => {
            const colWidth = (width - 32) / series.length;
            const x = getX(idx) - colWidth / 2;
            return (
              <rect
                key={`hit-${idx}`}
                x={x}
                y={0}
                width={colWidth}
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}
        </svg>
      </div>

      {/* Bottom Technical Indicators Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
        <div className="bg-[#0B0F17] border border-slate-800/80 rounded px-3 py-2 flex items-center justify-between">
          <span className="text-slate-400">Signal</span>
          <span
            className={`font-mono font-semibold whitespace-nowrap ${
              indicators.signal === 'Bullish'
                ? 'text-emerald-400'
                : indicators.signal === 'Bearish'
                ? 'text-rose-400'
                : 'text-amber-300'
            }`}
          >
            {indicators.signal === 'Bullish'
              ? '▲ Bullish'
              : indicators.signal === 'Bearish'
              ? '▼ Bearish'
              : '• Neutral'}
          </span>
        </div>
        <div className="bg-[#0B0F17] border border-slate-800/80 rounded px-3 py-2 flex items-center justify-between">
          <span className="text-slate-400">SMA (20)</span>
          <span className="font-mono tabular-nums text-slate-100 font-semibold whitespace-nowrap">
            ${indicators.sma20.toFixed(2)}
          </span>
        </div>
        <div className="bg-[#0B0F17] border border-slate-800/80 rounded px-3 py-2 flex items-center justify-between">
          <span className="text-slate-400">RSI (14)</span>
          <span className="font-mono tabular-nums text-slate-100 font-semibold whitespace-nowrap">
            {indicators.rsi14.toFixed(1)}
          </span>
        </div>
        <div className="bg-[#0B0F17] border border-slate-800/80 rounded px-3 py-2 flex items-center justify-between">
          <span className="text-slate-400">24h Range</span>
          <span className="font-mono tabular-nums text-slate-100 font-semibold whitespace-nowrap">
            ${stock.low24h.toFixed(2)}–${stock.high24h.toFixed(2)}
          </span>
        </div>
        <div className="bg-[#0B0F17] border border-slate-800/80 rounded px-3 py-2 flex items-center justify-between">
          <span className="text-slate-400">Bollinger</span>
          <span className="font-mono tabular-nums text-slate-100 font-semibold whitespace-nowrap">
            ${indicators.bollingerLower.toFixed(0)}–${indicators.bollingerUpper.toFixed(0)}
          </span>
        </div>
        <div className="bg-[#0B0F17] border border-slate-800/80 rounded px-3 py-2 flex items-center justify-between">
          <span className="text-slate-400">Volume</span>
          <span className="font-mono tabular-nums text-slate-100 font-semibold whitespace-nowrap">
            {(stock.volume / 1e6).toFixed(2)}M
          </span>
        </div>
      </div>
    </section>
  );
};
