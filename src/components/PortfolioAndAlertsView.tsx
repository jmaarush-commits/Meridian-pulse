import React, { useState } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import {
  StockAsset,
  PortfolioState,
  PortfolioMetrics,
  OrderRequest,
} from '../lib/marketEngine';

interface PortfolioAndAlertsViewProps {
  stocks: StockAsset[];
  portfolio: PortfolioState;
  metrics: PortfolioMetrics;
  onSelectSymbolForTrade: (symbol: string) => void;
  onExecuteOrder: (request: OrderRequest) => { ok: boolean; message: string };
  onAddPriceAlert: (
    symbol: string,
    targetPrice: number,
    condition: 'ABOVE' | 'BELOW'
  ) => void;
  onRemovePriceAlert: (id: string) => void;
}

export const PortfolioAndAlertsView: React.FC<PortfolioAndAlertsViewProps> = ({
  stocks,
  portfolio,
  metrics,
  onSelectSymbolForTrade,
  onExecuteOrder,
  onAddPriceAlert,
  onRemovePriceAlert,
}) => {
  const [alertSymbol, setAlertSymbol] = useState<string>(stocks[0]?.symbol || 'NVDA');
  const [alertCondition, setAlertCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [alertPriceInput, setAlertPriceInput] = useState<string>('150.00');
  const [alertError, setAlertError] = useState<string | null>(null);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(alertPriceInput);
    if (!Number.isFinite(target) || target <= 0) {
      setAlertError('Enter a valid target price greater than $0.');
      return;
    }
    setAlertError(null);
    onAddPriceAlert(alertSymbol, Number(target.toFixed(2)), alertCondition);
  };

  const isTotalPnLPos = metrics.totalUnrealizedPnL >= 0;
  const isDayPnLPos = metrics.totalDayPnL >= 0;

  return (
    <div className="space-y-6">
      {/* Portfolio KPI Summary Strip */}
      <section
        aria-label="Account Equity Summary"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Total Account Equity</div>
          <div
            data-testid="portfolio-total-equity"
            className="text-2xl font-bold font-mono tabular-nums text-slate-50 mt-1"
          >
            ${metrics.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Cash + Long Equity Holdings
          </div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Available Buying Power</div>
          <div
            data-testid="portfolio-cash-balance"
            className="text-2xl font-bold font-mono tabular-nums text-slate-50 mt-1"
          >
            ${metrics.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
            {((metrics.cashBalance / Math.max(1, metrics.totalEquity)) * 100).toFixed(1)}% Liquidity Weight
          </div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Total Unrealized P&L</div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              isTotalPnLPos ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isTotalPnLPos ? '▲ +$' : '▼ -$'}
            {Math.abs(metrics.totalUnrealizedPnL).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </div>
          <div
            className={`text-xs font-mono tabular-nums mt-1 ${
              isTotalPnLPos ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isTotalPnLPos ? '+' : ''}
            {metrics.totalUnrealizedPnLPercent.toFixed(2)}% vs Cost Basis
          </div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">Session Intraday P&L</div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
              isDayPnLPos ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isDayPnLPos ? '▲ +$' : '▼ -$'}
            {Math.abs(metrics.totalDayPnL).toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Mark-to-Market Live Feed
          </div>
        </div>
      </section>

      {/* Active Equity Positions Table */}
      <section
        aria-label="Open Equity Positions"
        className="bg-[#0F172A] border border-slate-800 rounded-lg p-5"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 font-display">
              Open Equity Positions ({metrics.enrichedPositions.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time mark-to-market valuation across active holdings
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-3">
          {metrics.enrichedPositions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-300">No open equity positions.</p>
              <p className="text-xs text-slate-500 mt-1">
                Place a Buy order from the Trading Terminal to open a position.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-medium">Asset</th>
                  <th className="py-2.5 px-3 font-medium text-right">Shares</th>
                  <th className="py-2.5 px-3 font-medium text-right">Avg Cost</th>
                  <th className="py-2.5 px-3 font-medium text-right">Last Price</th>
                  <th className="py-2.5 px-3 font-medium text-right">Market Value</th>
                  <th className="py-2.5 px-3 font-medium text-right">Unrealized P&L</th>
                  <th className="py-2.5 px-3 font-medium text-right">Weight</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.enrichedPositions.map((pos) => {
                  const isPos = pos.unrealizedPnL >= 0;
                  return (
                    <tr
                      key={pos.symbol}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-100 font-mono">
                          {pos.symbol}
                        </div>
                        <div className="text-[11px] text-slate-400">{pos.name}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
                        {pos.shares.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                        ${pos.avgCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-100">
                        ${pos.currentPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-100">
                        ${pos.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono tabular-nums font-medium ${
                          isPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPos ? '▲ +$' : '▼ -$'}
                        {Math.abs(pos.unrealizedPnL).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        ({isPos ? '+' : ''}
                        {pos.unrealizedPnLPercent.toFixed(2)}%)
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                        {pos.weightPercent.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectSymbolForTrade(pos.symbol)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-300 bg-blue-950/60 border border-blue-800/70 rounded hover:bg-blue-900/60 cursor-pointer"
                          >
                            Chart
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onExecuteOrder({
                                symbol: pos.symbol,
                                side: 'SELL',
                                orderType: 'MARKET',
                                shares: Math.max(1, Math.floor(pos.shares / 2)),
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium text-rose-300 bg-rose-950/50 border border-rose-800/70 rounded hover:bg-rose-900/50 cursor-pointer"
                          >
                            Trim 50%
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Bottom Split: Executed Orders Ledger & Price Alerts Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Executed Orders Ledger */}
        <section
          aria-label="Executed Orders Ledger"
          className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-lg p-5"
        >
          <h2 className="text-base font-bold text-slate-100 font-display pb-3 border-b border-slate-800">
            Executed Orders Ledger ({portfolio.orders.length})
          </h2>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-2.5 font-medium">Order ID</th>
                  <th className="py-2 px-2.5 font-medium">Side & Asset</th>
                  <th className="py-2 px-2.5 font-medium text-right">Shares</th>
                  <th className="py-2 px-2.5 font-medium text-right">Fill Price</th>
                  <th className="py-2 px-2.5 font-medium text-right">Total Value</th>
                  <th className="py-2 px-2.5 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {portfolio.orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-2.5 font-mono text-slate-400">
                      {ord.id}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span
                        className={`font-mono font-semibold ${
                          ord.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {ord.side}
                      </span>{' '}
                      <strong className="font-mono text-slate-100">
                        {ord.symbol}
                      </strong>{' '}
                      <span className="text-slate-400">· {ord.orderType}</span>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-200">
                      {ord.shares}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-200">
                      ${ord.executionPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-100">
                      ${ord.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-400">
                      {ord.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Custom Price Alerts Manager */}
        <section
          aria-label="Custom Price Alerts"
          className="lg:col-span-5 bg-[#0F172A] border border-slate-800 rounded-lg p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Bell className="w-4 h-4 text-blue-400" />
              <h2 className="text-base font-bold text-slate-100 font-display">
                Automated Price Alerts ({portfolio.alerts.length})
              </h2>
            </div>

            <form onSubmit={handleCreateAlert} className="mt-4 space-y-3" noValidate>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label
                    htmlFor="alert-symbol-select"
                    className="block text-xs text-slate-400 mb-1"
                  >
                    Ticker
                  </label>
                  <select
                    id="alert-symbol-select"
                    value={alertSymbol}
                    onChange={(e) => {
                      const sym = e.target.value;
                      setAlertSymbol(sym);
                      const found = stocks.find((s) => s.symbol === sym);
                      if (found) setAlertPriceInput((found.price * 1.02).toFixed(2));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0B0F17] border border-slate-700 rounded text-slate-100"
                  >
                    {stocks.map((s) => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.symbol}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="alert-condition-select"
                    className="block text-xs text-slate-400 mb-1"
                  >
                    Trigger
                  </label>
                  <select
                    id="alert-condition-select"
                    value={alertCondition}
                    onChange={(e) =>
                      setAlertCondition(e.target.value as 'ABOVE' | 'BELOW')
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0B0F17] border border-slate-700 rounded text-slate-100"
                  >
                    <option value="ABOVE">Crosses Above</option>
                    <option value="BELOW">Drops Below</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="alert-target-input"
                    className="block text-xs text-slate-400 mb-1"
                  >
                    Target ($)
                  </label>
                  <input
                    id="alert-target-input"
                    type="number"
                    step="0.01"
                    value={alertPriceInput}
                    onChange={(e) => setAlertPriceInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-[#0B0F17] border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>

              {alertError && (
                <p className="text-xs text-rose-400">{alertError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-500 transition-colors cursor-pointer"
              >
                Create Price Alert
              </button>
            </form>

            {/* Alerts List */}
            <div className="mt-4 divide-y divide-slate-800/70">
              {portfolio.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-100">
                      {alert.symbol}
                    </span>{' '}
                    <span className="text-slate-400">
                      {alert.condition === 'ABOVE' ? '≥' : '≤'}
                    </span>{' '}
                    <span className="font-mono tabular-nums text-slate-200 font-semibold">
                      ${alert.targetPrice.toFixed(2)}
                    </span>
                    <span className="text-slate-500 ml-2">
                      · {alert.triggered ? 'Triggered' : 'Monitoring'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemovePriceAlert(alert.id)}
                    aria-label={`Delete price alert for ${alert.symbol}`}
                    className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
