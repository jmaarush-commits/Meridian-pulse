import React, { useMemo, useState } from 'react';
import {
  StockAsset,
  PortfolioState,
  OrderRequest,
  generateOrderBook,
} from '../lib/marketEngine';

interface OrderTicketAndBookProps {
  stock: StockAsset;
  portfolio: PortfolioState;
  onExecuteOrder: (
    request: OrderRequest
  ) => { ok: boolean; message: string };
}

export const OrderTicketAndBook: React.FC<OrderTicketAndBookProps> = ({
  stock,
  portfolio,
  onExecuteOrder,
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [sharesInput, setSharesInput] = useState<string>('10');
  const [limitPriceInput, setLimitPriceInput] = useState<string>(
    stock.price.toFixed(2)
  );
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const orderBook = useMemo(
    () => generateOrderBook(stock.price, 5),
    [stock.price]
  );

  const existingPosition = portfolio.positions.find(
    (p) => p.symbol === stock.symbol
  );

  const parsedShares = Number(sharesInput);
  const effectivePrice =
    orderType === 'LIMIT' ? Number(limitPriceInput) || 0 : stock.price;
  const estimatedTotal =
    Number.isFinite(parsedShares) && parsedShares > 0
      ? parsedShares * effectivePrice
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(sharesInput);
    const limitPx = orderType === 'LIMIT' ? Number(limitPriceInput) : undefined;

    const result = onExecuteOrder({
      symbol: stock.symbol,
      side,
      orderType,
      shares: qty,
      limitPrice: limitPx,
    });

    if (result.ok) {
      setFeedback({ type: 'success', text: result.message });
    } else {
      setFeedback({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Level-2 Order Book Depth */}
      <section
        aria-label="Level 2 Order Book Depth"
        className="lg:col-span-6 bg-[#0F172A] border border-slate-800 rounded-lg p-4 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 whitespace-nowrap">
                Order Book ({stock.symbol})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                Spread ${orderBook.spread.toFixed(2)} · {orderBook.spreadBps} bps
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400 whitespace-nowrap shrink-0">
              Mid ${stock.price.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Bids */}
            <div>
              <div className="flex justify-between text-slate-400 pb-1.5 border-b border-slate-800/80 font-medium">
                <span>Bid</span>
                <span>Size</span>
              </div>
              <div className="divide-y divide-slate-800/40 mt-1">
                {orderBook.bids.map((bid, i) => (
                  <div
                    key={i}
                    className="relative flex justify-between py-1.5 px-1.5 font-mono tabular-nums overflow-hidden"
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-emerald-500/10 pointer-events-none"
                      style={{ width: `${bid.depthPercent}%` }}
                    />
                    <span className="relative text-emerald-400 font-medium">
                      ${bid.price.toFixed(2)}
                    </span>
                    <span className="relative text-slate-300">
                      {bid.size.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Asks */}
            <div>
              <div className="flex justify-between text-slate-400 pb-1.5 border-b border-slate-800/80 font-medium">
                <span>Ask</span>
                <span>Size</span>
              </div>
              <div className="divide-y divide-slate-800/40 mt-1">
                {orderBook.asks.map((ask, i) => (
                  <div
                    key={i}
                    className="relative flex justify-between py-1.5 px-1.5 font-mono tabular-nums overflow-hidden"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-rose-500/10 pointer-events-none"
                      style={{ width: `${ask.depthPercent}%` }}
                    />
                    <span className="relative text-rose-400 font-medium">
                      ${ask.price.toFixed(2)}
                    </span>
                    <span className="relative text-slate-300">
                      {ask.size.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>Position:</span>
            <strong className="font-mono tabular-nums text-slate-200">
              {existingPosition ? `${existingPosition.shares} sh @ $${existingPosition.avgCost.toFixed(2)}` : '0 shares'}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Buying Power:</span>
            <strong
              data-testid="ticket-cash-balance"
              className="font-mono tabular-nums text-slate-200"
            >
              ${portfolio.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </section>

      {/* Institutional Order Execution Ticket */}
      <section
        aria-label="Order Execution Ticket"
        className="lg:col-span-6 bg-[#0F172A] border border-slate-800 rounded-lg p-4 flex flex-col justify-between"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-2">
          <h2 className="text-sm font-semibold text-slate-100 whitespace-nowrap">
            Order Ticket
          </h2>
          <div
            role="group"
            aria-label="Order Type"
            className="flex items-center gap-1 p-0.5 bg-[#0B0F17] border border-slate-800 rounded"
          >
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                orderType === 'MARKET'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Market
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType('LIMIT');
                setLimitPriceInput(stock.price.toFixed(2));
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                orderType === 'LIMIT'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Limit
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {/* Buy / Sell Segmented Buttons */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0F17] border border-slate-800 rounded-md">
            <button
              type="button"
              onClick={() => {
                setSide('BUY');
                setFeedback(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                side === 'BUY'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Buy {stock.symbol}
            </button>
            <button
              type="button"
              onClick={() => {
                setSide('SELL');
                setFeedback(null);
              }}
              className={`py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                side === 'SELL'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sell {stock.symbol}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="order-shares-input"
                className="text-xs font-medium text-slate-300"
              >
                Shares Quantity
              </label>
              <div className="flex items-center gap-1">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setSharesInput(String(preset));
                      setFeedback(null);
                    }}
                    className="px-1.5 py-0.5 text-[11px] font-mono bg-[#0B0F17] border border-slate-800 rounded text-slate-400 hover:text-slate-200 hover:border-slate-700 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <input
              id="order-shares-input"
              type="number"
              min="1"
              step="1"
              value={sharesInput}
              onChange={(e) => {
                setSharesInput(e.target.value);
                setFeedback(null);
              }}
              className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-[#0B0F17] border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="order-price-input"
                className="text-xs font-medium text-slate-300"
              >
                {orderType === 'LIMIT' ? 'Limit Price ($)' : 'Execution Price'}
              </label>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                Est. Total:{' '}
                <strong className="text-slate-200">
                  ${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
              </span>
            </div>
            {orderType === 'LIMIT' ? (
              <input
                id="order-price-input"
                type="number"
                step="0.01"
                value={limitPriceInput}
                onChange={(e) => {
                  setLimitPriceInput(e.target.value);
                  setFeedback(null);
                }}
                className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-[#0B0F17] border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-blue-500"
              />
            ) : (
              <div className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[#0B0F17]/60 border border-slate-800 rounded-md text-slate-300 flex items-center justify-between">
                <span>Market Fill</span>
                <span className="text-slate-100 font-semibold">${stock.price.toFixed(2)}</span>
              </div>
            )}
          </div>

          {feedback && (
            <div
              role="status"
              className={`px-3 py-2 rounded text-xs font-medium border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-800/80 text-rose-300'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2 px-4 text-xs font-semibold text-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              side === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            Place {side === 'BUY' ? 'Buy' : 'Sell'} Order ({stock.symbol})
          </button>
        </form>
      </section>
    </div>
  );
};
