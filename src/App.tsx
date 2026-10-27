/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  INITIAL_STOCKS,
  INITIAL_INDICES,
  INITIAL_CATALYSTS,
  INITIAL_PORTFOLIO,
  StockAsset,
  MarketIndex,
  PortfolioState,
  TimeframeKey,
  OrderRequest,
  simulateMarketTick,
  validateAndExecuteOrder,
  calculatePortfolioMetrics,
  evaluatePriceAlerts,
} from './lib/marketEngine';
import { InteractiveChart } from './components/InteractiveChart';
import { OrderTicketAndBook } from './components/OrderTicketAndBook';
import { AiAnalystPanel, ChatMessage } from './components/AiAnalystPanel';
import { ScreenerAndTrendsView } from './components/ScreenerAndTrendsView';
import { PortfolioAndAlertsView } from './components/PortfolioAndAlertsView';

type ActiveTab = 'terminal' | 'screener' | 'portfolio' | 'ai-analyst';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('terminal');
  const [stocks, setStocks] = useState<StockAsset[]>(INITIAL_STOCKS);
  const [indices, setIndices] = useState<MarketIndex[]>(INITIAL_INDICES);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [timeframe, setTimeframe] = useState<TimeframeKey>('1D');
  const [watchlistFilter, setWatchlistFilter] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [portfolio, setPortfolio] = useState<PortfolioState>(INITIAL_PORTFOLIO);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      timestamp: '09:30 EST',
      content: `### Institutional Desk Briefing\n\nWelcome to **Meridian Pulse**. Live market data is streaming across 12 institutional equities and 5 macro benchmarks.\n\n- **Semiconductors & AI Infrastructure** lead early session flows, with **NVDA ($142.85, +3.22%)** and **AVGO ($181.60, +2.66%)** outperforming on raised hyperscaler CapEx guidance.\n- **Portfolio Snapshot**: Your account holds 4 active positions (**NVDA**, **MSFT**, **AAPL**, **JPM**) with **$145,250.00** in cash buying power.\n\nSelect any research prompt above or ask about technical levels, peer valuation multiples, or portfolio risk.`,
      analyzedSymbols: ['NVDA', 'AVGO', 'MSFT', 'AAPL'],
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Live streaming market tick loop (every 2.4s when enabled)
  useEffect(() => {
    if (!isStreaming) return;
    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      setStocks((prevStocks) => {
        const nextStocks = simulateMarketTick(prevStocks, step);
        setPortfolio((prevPort) => ({
          ...prevPort,
          alerts: evaluatePriceAlerts(prevPort.alerts, nextStocks),
        }));
        return nextStocks;
      });

      setIndices((prevIndices) =>
        prevIndices.map((idx, i) => {
          const delta = Math.sin(step * 0.6 + i) * (idx.value * 0.0004);
          const newVal = Number((idx.value + delta).toFixed(2));
          const newChange = Number((idx.change + delta).toFixed(2));
          return {
            ...idx,
            value: newVal,
            change: newChange,
          };
        })
      );
    }, 2400);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const selectedStock = useMemo(
    () => stocks.find((s) => s.symbol === selectedSymbol) || stocks[0],
    [stocks, selectedSymbol]
  );

  const portfolioMetrics = useMemo(
    () => calculatePortfolioMetrics(portfolio, stocks),
    [portfolio, stocks]
  );

  const filteredWatchlist = useMemo(() => {
    const q = watchlistFilter.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q)
    );
  }, [stocks, watchlistFilter]);

  const handleExecuteOrder = useCallback(
    (request: OrderRequest): { ok: boolean; message: string } => {
      const targetStock =
        stocks.find((s) => s.symbol === request.symbol) || selectedStock;
      const nowStr = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const result = validateAndExecuteOrder(
        portfolio,
        request,
        targetStock.price,
        `${nowStr} EST`
      );

      if (!result.ok) {
        return { ok: false, message: result.error };
      }

      setPortfolio(result.portfolio);
      return {
        ok: true,
        message: `Executed ${result.order.side} ${result.order.shares} ${result.order.symbol} @ $${result.order.executionPrice.toFixed(2)} ($${result.order.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })})`,
      };
    },
    [portfolio, stocks, selectedStock]
  );

  const handleSendAiMessage = useCallback(
    async (promptText: string) => {
      const nowStr = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: promptText,
        timestamp: `${nowStr} EST`,
      };

      setChatMessages((prev) => [...prev, userMsg]);
      setIsAiLoading(true);

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: promptText,
            selectedSymbol: selectedStock.symbol,
            stocks,
            portfolioSummary: {
              totalEquity: portfolioMetrics.totalEquity,
              cashBalance: portfolioMetrics.cashBalance,
              totalUnrealizedPnL: portfolioMetrics.totalUnrealizedPnL,
              positions: portfolioMetrics.enrichedPositions.map((p) => ({
                symbol: p.symbol,
                shares: p.shares,
                avgCost: p.avgCost,
                currentPrice: p.currentPrice,
                unrealizedPnLPercent: p.unrealizedPnLPercent,
              })),
            },
            history: chatMessages.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content:
            data.reply ||
            ` Quantitative snapshot for **${selectedStock.symbol}** at **$${selectedStock.price.toFixed(2)}** (${selectedStock.changePercent >= 0 ? '+' : ''}${selectedStock.changePercent.toFixed(2)}%).`,
          timestamp: `${nowStr} EST`,
          citations: data.citations || [],
          analyzedSymbols: data.analyzedSymbols || [selectedStock.symbol],
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const fallbackMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `### Desk Analysis: ${selectedStock.name} (${selectedStock.symbol})\n\n- **Last Price**: **$${selectedStock.price.toFixed(2)}** (${selectedStock.changePercent >= 0 ? '+' : ''}${selectedStock.changePercent.toFixed(2)}%)\n- **Day Range**: $${selectedStock.low24h.toFixed(2)} – $${selectedStock.high24h.toFixed(2)}\n- **Valuation**: Market Cap $${selectedStock.marketCapB}B · P/E ${selectedStock.peRatio}x`,
          timestamp: `${nowStr} EST`,
          analyzedSymbols: [selectedStock.symbol],
        };
        setChatMessages((prev) => [...prev, fallbackMsg]);
      } finally {
        setIsAiLoading(false);
      }
    },
    [selectedStock, stocks, portfolioMetrics, chatMessages]
  );

  const handleAddPriceAlert = (
    symbol: string,
    targetPrice: number,
    condition: 'ABOVE' | 'BELOW'
  ) => {
    setPortfolio((prev) => ({
      ...prev,
      alerts: [
        {
          id: `ALT-${Date.now()}`,
          symbol,
          targetPrice,
          condition,
          triggered: false,
          createdAt: 'Just now',
        },
        ...prev.alerts,
      ],
    }));
  };

  const handleRemovePriceAlert = (id: string) => {
    setPortfolio((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => a.id !== id),
    }));
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#0F172A]">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#terminal"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('terminal');
          }}
          className="text-lg font-bold tracking-tight text-slate-50 font-display whitespace-nowrap shrink-0"
        >
          Meridian Pulse
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="flex items-center gap-6 text-sm font-medium text-slate-400"
        >
          <a
            href="#terminal"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('terminal');
            }}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'terminal'
                ? 'text-slate-50 border-blue-500'
                : 'border-transparent'
            }`}
          >
            Terminal
          </a>
          <a
            href="#screener"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('screener');
            }}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'screener'
                ? 'text-slate-50 border-blue-500'
                : 'border-transparent'
            }`}
          >
            Screener
          </a>
          <a
            href="#portfolio"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('portfolio');
            }}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'portfolio'
                ? 'text-slate-50 border-blue-500'
                : 'border-transparent'
            }`}
          >
            Portfolio
          </a>
          <a
            href="#ai-analyst"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('ai-analyst');
            }}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'ai-analyst'
                ? 'text-slate-50 border-blue-500'
                : 'border-transparent'
            }`}
          >
            AI Analyst
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ai-analyst')}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Open AI Research Studio
          </button>
        </div>
      </header>

      {/* Sub-header Live Benchmark Indices Strip & Feed Toggle */}
      <div className="border-b border-slate-800/90 bg-[#0B0F17] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        <div
          aria-label="Global Market Indices"
          className="flex flex-wrap items-center gap-6 text-xs"
        >
          {indices.map((idx) => {
            const isPos = idx.change >= 0;
            return (
              <div key={idx.symbol} className="flex items-baseline gap-2">
                <span className="font-semibold text-slate-300">{idx.name}</span>
                <span className="font-mono tabular-nums text-slate-100 font-medium">
                  {idx.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`font-mono tabular-nums ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPos ? '▲ +' : '▼ '}
                  {idx.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400 font-mono tabular-nums">
            Equity:{' '}
            <strong className="text-slate-100">
              ${portfolioMetrics.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setIsStreaming((prev) => !prev)}
            aria-pressed={isStreaming}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#0F172A] border border-slate-800 rounded hover:border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isStreaming ? 'Live Feed: Active' : 'Live Feed: Paused'}
          </button>
        </div>
      </div>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-5">
        {activeTab === 'terminal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column (3 cols): Live Streaming Watchlist */}
            <section
              aria-label="Live Stock Watchlist"
              className="lg:col-span-3 bg-[#0F172A] border border-slate-800 rounded-lg flex flex-col overflow-hidden"
            >
              <div className="p-3.5 border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-100">
                    Live Watchlist ({filteredWatchlist.length})
                  </h2>
                  <span className="text-[11px] text-slate-400">NASDAQ · NYSE</span>
                </div>
                <label htmlFor="watchlist-search" className="sr-only">
                  Filter Watchlist
                </label>
                <input
                  id="watchlist-search"
                  type="search"
                  value={watchlistFilter}
                  onChange={(e) => setWatchlistFilter(e.target.value)}
                  placeholder="Search ticker or sector..."
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-slate-700 rounded text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="divide-y divide-slate-800/60 max-h-[680px] overflow-y-auto">
                {filteredWatchlist.map((stock) => {
                  const isPos = stock.change >= 0;
                  const isSelected = stock.symbol === selectedSymbol;
                  return (
                    <button
                      key={stock.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(stock.symbol)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/40 text-slate-50'
                          : 'hover:bg-slate-800/40 text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-100">
                            {stock.symbol}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate">
                            · {stock.sector}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {stock.name}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono tabular-nums text-xs font-semibold text-slate-100">
                          ${stock.price.toFixed(2)}
                        </div>
                        <div
                          className={`font-mono tabular-nums text-[11px] ${
                            isPos ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPos ? '▲ +' : '▼ '}
                          {stock.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Center Column (5 cols): Interactive Chart + Level 2 Order Book & Order Ticket */}
            <div className="lg:col-span-5 space-y-5">
              <InteractiveChart
                stock={selectedStock}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                onOpenAiPrompt={(prompt) => handleSendAiMessage(prompt)}
              />

              <OrderTicketAndBook
                stock={selectedStock}
                portfolio={portfolio}
                onExecuteOrder={handleExecuteOrder}
              />
            </div>

            {/* Right Column (4 cols): AI Financial Research Chatbot */}
            <div className="lg:col-span-4">
              <AiAnalystPanel
                selectedStock={selectedStock}
                stocks={stocks}
                portfolioMetrics={portfolioMetrics}
                messages={chatMessages}
                isLoading={isAiLoading}
                onSendMessage={handleSendAiMessage}
                onClearHistory={() => setChatMessages(chatMessages.slice(0, 1))}
                onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              />
            </div>
          </div>
        )}

        {activeTab === 'screener' && (
          <ScreenerAndTrendsView
            stocks={stocks}
            catalysts={INITIAL_CATALYSTS}
            onSelectSymbolForTrade={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('terminal');
            }}
            onAskAiAboutCatalyst={(prompt) => {
              setActiveTab('terminal');
              handleSendAiMessage(prompt);
            }}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioAndAlertsView
            stocks={stocks}
            portfolio={portfolio}
            metrics={portfolioMetrics}
            onSelectSymbolForTrade={(sym) => {
              setSelectedSymbol(sym);
              setActiveTab('terminal');
            }}
            onExecuteOrder={handleExecuteOrder}
            onAddPriceAlert={handleAddPriceAlert}
            onRemovePriceAlert={handleRemovePriceAlert}
          />
        )}

        {activeTab === 'ai-analyst' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <section className="bg-[#0F172A] border border-slate-800 rounded-lg p-4">
                <h2 className="text-sm font-bold text-slate-100 font-display mb-2">
                  Live Terminal Context
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Meridian AI Analyst automatically receives live prices, 24h momentum, P/E multiples, technical indicators, and your current portfolio holdings with every query.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Ticker</span>
                    <span className="font-mono font-semibold text-slate-100">
                      {selectedStock.symbol} (${selectedStock.price.toFixed(2)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Account Equity</span>
                    <span className="font-mono tabular-nums text-slate-100">
                      ${portfolioMetrics.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cash Buying Power</span>
                    <span className="font-mono tabular-nums text-slate-100">
                      ${portfolioMetrics.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </section>

              <section className="bg-[#0F172A] border border-slate-800 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-slate-300 mb-2.5">
                  Switch Context Ticker
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {stocks.map((s) => (
                    <button
                      key={s.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(s.symbol)}
                      className={`px-2.5 py-1.5 text-xs font-mono rounded border text-left transition-colors cursor-pointer ${
                        s.symbol === selectedSymbol
                          ? 'bg-blue-950/60 border-blue-500 text-slate-50 font-semibold'
                          : 'bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>{s.symbol}</div>
                      <div
                        className={`text-[10px] tabular-nums ${
                          s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        ${s.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-8">
              <AiAnalystPanel
                selectedStock={selectedStock}
                stocks={stocks}
                portfolioMetrics={portfolioMetrics}
                messages={chatMessages}
                isLoading={isAiLoading}
                onSendMessage={handleSendAiMessage}
                onClearHistory={() => setChatMessages(chatMessages.slice(0, 1))}
                onSelectSymbol={(sym) => {
                  setSelectedSymbol(sym);
                  setActiveTab('terminal');
                }}
                isFullPage
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
