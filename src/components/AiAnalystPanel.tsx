import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RotateCcw, ExternalLink } from 'lucide-react';
import { StockAsset, PortfolioMetrics } from '../lib/marketEngine';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Array<{ title: string; uri: string }>;
  analyzedSymbols?: string[];
}

interface AiAnalystPanelProps {
  selectedStock: StockAsset;
  stocks: StockAsset[];
  portfolioMetrics: PortfolioMetrics;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (promptText: string) => void;
  onClearHistory: () => void;
  onSelectSymbol: (symbol: string) => void;
  isFullPage?: boolean;
}

export const AiAnalystPanel: React.FC<AiAnalystPanelProps> = ({
  selectedStock,
  stocks,
  portfolioMetrics,
  messages,
  isLoading,
  onSendMessage,
  onClearHistory,
  onSelectSymbol,
  isFullPage = false,
}) => {
  const [input, setInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    onSendMessage(trimmed);
  };

  const quickPrompts = [
    `Analyze ${selectedStock.symbol} technicals & key support levels`,
    `Compare ${selectedStock.symbol} vs MSFT valuation & momentum`,
    `Summarize today's top market trends & sector leaders`,
    `Audit my portfolio risk & cash allocation`,
  ];

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed text-slate-200">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-1" />;
          if (trimmed.startsWith('### ')) {
            return (
              <h4
                key={i}
                className="text-sm font-semibold text-slate-50 pt-1 font-display"
              >
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h5
                key={i}
                className="text-xs font-semibold text-blue-300 pt-1 uppercase tracking-wider"
              >
                {trimmed.replace('#### ', '')}
              </h5>
            );
          }
          if (trimmed.startsWith('|')) {
            if (trimmed.includes('---')) return null;
            const cells = trimmed
              .split('|')
              .map((c) => c.trim())
              .filter(Boolean);
            return (
              <div
                key={i}
                className="grid grid-cols-3 gap-2 py-1 px-2 bg-[#0B0F17] border-b border-slate-800/80 font-mono text-[11px]"
              >
                {cells.map((cell, cIdx) => (
                  <span
                    key={cIdx}
                    className={cIdx === 0 ? 'text-slate-400 font-sans' : 'text-slate-200'}
                  >
                    {cell.replace(/\*\*/g, '')}
                  </span>
                ))}
              </div>
            );
          }
          if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
            const cleanText = trimmed.replace(/^(- |\d+\.\s)/, '');
            const parts = cleanText.split(/(\*\*.*?\*\*)/g);
            return (
              <div key={i} className="flex items-start gap-2 pl-1">
                <span className="text-blue-400 select-none">•</span>
                <span>
                  {parts.map((part, pIdx) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                      <strong key={pIdx} className="font-semibold text-slate-50">
                        {part.slice(2, -2)}
                      </strong>
                    ) : (
                      <span key={pIdx}>{part}</span>
                    )
                  )}
                </span>
              </div>
            );
          }

          const parts = trimmed.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={i}>
              {parts.map((part, pIdx) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={pIdx} className="font-semibold text-slate-50">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  <span key={pIdx}>{part}</span>
                )
              )}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      aria-label="AI Market Research Analyst"
      className={`bg-[#0F172A] border border-slate-800 rounded-lg flex flex-col ${
        isFullPage ? 'h-[calc(100vh-140px)] min-h-[580px]' : 'lg:h-[780px] min-h-[560px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Meridian AI Market Analyst
            </h2>
            <p className="text-[11px] text-slate-400">
              Context: {selectedStock.symbol} (${selectedStock.price.toFixed(2)}) · Equity $
              {portfolioMetrics.totalEquity.toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          aria-label="Reset AI conversation"
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800/70 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Analysis Prompts */}
      <div className="px-4 py-2.5 border-b border-slate-800/80 bg-[#0B0F17]/60">
        <div className="text-[11px] text-slate-400 mb-1.5">
          Institutional Research Prompts:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => onSendMessage(prompt)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-[#0F172A] border border-slate-800 rounded hover:border-blue-600/60 hover:text-blue-200 transition-colors text-left truncate max-w-full cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div
        ref={scrollContainerRef}
        data-testid="ai-chat-messages"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
              <span>{msg.role === 'user' ? 'Trader' : 'AI Desk Analyst'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-[95%] rounded-lg p-3.5 border ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 border-blue-500/40 text-slate-100 text-xs'
                  : 'bg-[#0B0F17] border-slate-800 text-slate-200'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-xs leading-relaxed">{msg.content}</p>
              ) : (
                renderFormattedContent(msg.content)
              )}

              {/* Referenced Tickers Jump Buttons */}
              {msg.analyzedSymbols && msg.analyzedSymbols.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    Inspect Ticker:
                  </span>
                  {msg.analyzedSymbols.map((sym) => {
                    const st = stocks.find((s) => s.symbol === sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => onSelectSymbol(sym)}
                        className="px-2 py-0.5 text-[11px] font-mono tabular-nums bg-slate-900 border border-slate-700 rounded text-blue-300 hover:bg-slate-800 cursor-pointer"
                      >
                        {sym} {st ? `$${st.price.toFixed(2)}` : ''}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search Grounding Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="text-[10px] text-slate-400">
                    Grounded Sources:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cit, cIdx) => (
                      <a
                        key={cIdx}
                        href={cit.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                      >
                        <span className="truncate max-w-[180px]">{cit.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex flex-col items-start">
            <div className="text-[11px] text-slate-400 mb-1">
              AI Desk Analyst · Synthesizing live quotes...
            </div>
            <div className="w-full max-w-[90%] rounded-lg p-3.5 bg-[#0B0F17] border border-slate-800 space-y-2">
              <div className="h-3 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-800 rounded w-2/3" />
            </div>
          </div>
        )}
      </div>

      {/* Input Composer */}
      <form
        onSubmit={handleFormSubmit}
        className="p-3 border-t border-slate-800 bg-[#0B0F17]/80"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="ai-analyst-input" className="sr-only">
            Ask AI Market Analyst
          </label>
          <input
            id="ai-analyst-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${selectedStock.symbol}, sector trends, or your portfolio...`}
            className="flex-1 px-3 py-2 text-xs bg-[#0F172A] border border-slate-700 rounded-md text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message to AI Analyst"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-40 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Ask AI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
};
