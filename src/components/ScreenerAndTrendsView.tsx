import React, { useMemo, useState } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import {
  StockAsset,
  MarketCatalyst,
  filterAndSortStocks,
} from '../lib/marketEngine';

interface ScreenerAndTrendsViewProps {
  stocks: StockAsset[];
  catalysts: MarketCatalyst[];
  onSelectSymbolForTrade: (symbol: string) => void;
  onAskAiAboutCatalyst: (prompt: string) => void;
}

const SECTORS = [
  'ALL',
  'Semiconductors',
  'Software & Cloud',
  'Consumer Tech',
  'Financials',
  'Healthcare',
  'Energy',
] as const;

export const ScreenerAndTrendsView: React.FC<ScreenerAndTrendsViewProps> = ({
  stocks,
  catalysts,
  onSelectSymbolForTrade,
  onAskAiAboutCatalyst,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [trendFilter, setTrendFilter] = useState<
    'ALL' | 'GAINERS' | 'LOSERS' | 'HIGH_VOLUME'
  >('ALL');
  const [sortBy, setSortBy] = useState<
    'marketCapB' | 'price' | 'changePercent' | 'volume' | 'peRatio'
  >('marketCapB');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredStocks = useMemo(
    () =>
      filterAndSortStocks(stocks, {
        query: searchQuery,
        sector: selectedSector,
        trend: trendFilter,
        sortBy,
        sortDir,
      }),
    [stocks, searchQuery, selectedSector, trendFilter, sortBy, sortDir]
  );

  // Sector performance summary
  const sectorPerformance = useMemo(() => {
    const map = new Map<string, { sumPct: number; count: number; totalCap: number }>();
    for (const s of stocks) {
      const curr = map.get(s.sector) || { sumPct: 0, count: 0, totalCap: 0 };
      curr.sumPct += s.changePercent;
      curr.count += 1;
      curr.totalCap += s.marketCapB;
      map.set(s.sector, curr);
    }
    return Array.from(map.entries()).map(([sector, stats]) => ({
      sector,
      avgChange: Number((stats.sumPct / Math.max(1, stats.count)).toFixed(2)),
      count: stats.count,
      totalCap: stats.totalCap,
    }));
  }, [stocks]);

  const handleSort = (
    field: 'marketCapB' | 'price' | 'changePercent' | 'volume' | 'peRatio'
  ) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sector Relative Strength Matrix */}
      <section
        aria-label="Sector Relative Strength Matrix"
        className="bg-[#0F172A] border border-slate-800 rounded-lg p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 font-display">
              Sector Relative Strength & Flow
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a sector block to filter the institutional equity screener below
            </p>
          </div>
          {selectedSector !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedSector('ALL')}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#0B0F17] border border-slate-700 rounded hover:text-white cursor-pointer"
            >
              Reset Sector Filter ({selectedSector})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {sectorPerformance.map((item) => {
            const isPos = item.avgChange >= 0;
            const isSelected = selectedSector === item.sector;
            return (
              <button
                key={item.sector}
                type="button"
                onClick={() =>
                  setSelectedSector(isSelected ? 'ALL' : item.sector)
                }
                className={`text-left p-3.5 rounded-md border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-950/50 border-blue-500'
                    : 'bg-[#0B0F17] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-medium text-slate-200 truncate">
                  {item.sector}
                </div>
                <div
                  className={`text-lg font-bold font-mono tabular-nums mt-1 ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPos ? '▲ +' : '▼ '}
                  {item.avgChange.toFixed(2)}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
                  {item.count} {item.count === 1 ? 'ticker' : 'tickers'} · ${(item.totalCap / 1000).toFixed(1)}T
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Screener & Controls */}
      <section
        aria-label="Live Stock Screener"
        className="bg-[#0F172A] border border-slate-800 rounded-lg p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
            <div className="relative flex-1 max-w-xs">
              <label htmlFor="screener-search-input" className="sr-only">
                Search stocks by symbol, name, or sector
              </label>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="screener-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by ticker or company..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0B0F17] border border-slate-700 rounded-md text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Segmented Trend Filters */}
            <div
              role="group"
              aria-label="Market Trend Filter"
              className="flex items-center gap-1 p-1 bg-[#0B0F17] border border-slate-800 rounded-md"
            >
              {(
                [
                  { id: 'ALL', label: 'All Equities' },
                  { id: 'GAINERS', label: 'Top Gainers' },
                  { id: 'LOSERS', label: 'Top Losers' },
                  { id: 'HIGH_VOLUME', label: 'High Volume' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTrendFilter(tab.id)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    trendFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sector Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            {SECTORS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSector(sec)}
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedSector === sec
                    ? 'bg-slate-800 border-slate-600 text-slate-100'
                    : 'bg-[#0B0F17] border-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sec === 'ALL' ? 'All Sectors' : sec}
              </button>
            ))}
          </div>
        </div>

        {/* High-Density Screener Table */}
        <div className="overflow-x-auto mt-3">
          {filteredStocks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-300 font-medium">
                No equities match the active screener criteria.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Clear the search query or reset sector and trend filters to view all live quotes.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSector('ALL');
                  setTrendFilter('ALL');
                }}
                className="mt-3 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-medium">Ticker & Company</th>
                  <th className="py-2.5 px-3 font-medium">Sector</th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('price')}
                      className="inline-flex items-center gap-1 hover:text-slate-200 cursor-pointer"
                    >
                      <span>Last Price</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('changePercent')}
                      className="inline-flex items-center gap-1 hover:text-slate-200 cursor-pointer"
                    >
                      <span>24h Change</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('volume')}
                      className="inline-flex items-center gap-1 hover:text-slate-200 cursor-pointer"
                    >
                      <span>Volume</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('marketCapB')}
                      className="inline-flex items-center gap-1 hover:text-slate-200 cursor-pointer"
                    >
                      <span>Market Cap</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">
                    <button
                      type="button"
                      onClick={() => handleSort('peRatio')}
                      className="inline-flex items-center gap-1 hover:text-slate-200 cursor-pointer"
                    >
                      <span>P/E</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStocks.map((stock) => {
                  const isPos = stock.change >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-100 font-mono">
                          {stock.symbol}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {stock.name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {stock.sector} · {stock.exchange}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-100">
                        ${stock.price.toFixed(2)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums font-medium ${
                          isPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPos ? '▲ +' : '▼ '}
                        {stock.changePercent.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                        {(stock.volume / 1e6).toFixed(2)}M
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                        ${stock.marketCapB.toLocaleString()}B
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                        {stock.peRatio.toFixed(1)}x
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectSymbolForTrade(stock.symbol)}
                          className="px-2.5 py-1 text-xs font-medium text-blue-300 bg-blue-950/60 border border-blue-800/70 rounded hover:bg-blue-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Trade {stock.symbol}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Market Catalysts & Institutional News Wire */}
      <section
        aria-label="Institutional Market Catalysts"
        className="bg-[#0F172A] border border-slate-800 rounded-lg p-5"
      >
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-100 font-display">
            Live Market Catalysts & Macro Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time catalysts impacting equity multiples and intraday order flow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {catalysts.map((item) => (
            <article
              key={item.id}
              className="bg-[#0B0F17] border border-slate-800 rounded-lg p-4 flex flex-col justify-between"
            >
              <div>
                {/* Unboxed clean metadata with typographic separators (Zero-Pill rule) */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="font-medium text-slate-300">{item.source}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.publishedAt}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.impactScore}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      item.sentiment === 'Bullish'
                        ? 'text-emerald-400 font-medium'
                        : item.sentiment === 'Bearish'
                        ? 'text-rose-400 font-medium'
                        : 'text-amber-300 font-medium'
                    }
                  >
                    {item.sentiment === 'Bullish'
                      ? '▲ Bullish Sentiment'
                      : item.sentiment === 'Bearish'
                      ? '▼ Bearish Sentiment'
                      : '• Neutral Sentiment'}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                  {item.headline}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Tickers:</span>
                  {item.relatedSymbols.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => onSelectSymbolForTrade(sym)}
                      className="px-2 py-0.5 text-xs font-mono text-blue-300 hover:underline cursor-pointer"
                    >
                      {sym}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onAskAiAboutCatalyst(
                      `Analyze the market impact of this catalyst: "${item.headline}" on ${item.relatedSymbols.join(', ')}.`
                    )
                  }
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  Ask AI Analyst →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
