import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_STOCKS,
  INITIAL_PORTFOLIO,
  simulateMarketTick,
  calculateTechnicalIndicators,
  validateAndExecuteOrder,
  calculatePortfolioMetrics,
  filterAndSortStocks,
  generateOrderBook,
  evaluatePriceAlerts,
} from './marketEngine';

test('simulateMarketTick updates prices, volume, and preserves array length', () => {
  const nextStocks = simulateMarketTick(INITIAL_STOCKS, 1);
  assert.equal(nextStocks.length, INITIAL_STOCKS.length);

  for (let i = 0; i < nextStocks.length; i++) {
    const prev = INITIAL_STOCKS[i];
    const curr = nextStocks[i];
    assert.equal(curr.symbol, prev.symbol);
    assert.ok(curr.price > 0, 'Price must stay positive');
    assert.ok(curr.volume >= prev.volume, 'Volume must monotonically increase intraday');
    assert.equal(curr.intradaySeries.length, prev.intradaySeries.length);
    assert.equal(curr.intradaySeries[curr.intradaySeries.length - 1], curr.price);
  }
});

test('calculateTechnicalIndicators returns accurate SMA, RSI, and Bollinger Bands', () => {
  const uptrendPrices = Array.from({ length: 30 }, (_, idx) => 100 + idx * 1.5);
  const indicators = calculateTechnicalIndicators(uptrendPrices);

  assert.ok(indicators.sma20 > 120, 'SMA20 should reflect recent higher prices');
  assert.ok(indicators.bollingerUpper > indicators.sma20);
  assert.ok(indicators.bollingerLower < indicators.sma20);
  assert.ok(indicators.rsi14 >= 50 && indicators.rsi14 <= 100);
  assert.ok(indicators.resistanceLevel >= indicators.supportLevel);
});

test('validateAndExecuteOrder handles valid BUY and SELL orders and rejects invalid quantities or insufficient funds', () => {
  // 1. Reject 0 or negative shares
  const badQty = validateAndExecuteOrder(
    INITIAL_PORTFOLIO,
    { symbol: 'NVDA', side: 'BUY', orderType: 'MARKET', shares: 0 },
    142.85
  );
  assert.equal(badQty.ok, false);

  // 2. Reject BUY exceeding cashBalance
  const tooExpensive = validateAndExecuteOrder(
    INITIAL_PORTFOLIO,
    { symbol: 'NVDA', side: 'BUY', orderType: 'MARKET', shares: 10000 },
    142.85
  );
  assert.equal(tooExpensive.ok, false);

  // 3. Execute valid BUY order
  const buyRes = validateAndExecuteOrder(
    INITIAL_PORTFOLIO,
    { symbol: 'NVDA', side: 'BUY', orderType: 'MARKET', shares: 10 },
    140.00
  );
  assert.equal(buyRes.ok, true);
  if (buyRes.ok) {
    assert.equal(buyRes.portfolio.cashBalance, INITIAL_PORTFOLIO.cashBalance - 1400);
    const nvdaPos = buyRes.portfolio.positions.find((p) => p.symbol === 'NVDA');
    assert.equal(nvdaPos?.shares, 260);
    assert.equal(buyRes.portfolio.orders[0].symbol, 'NVDA');
    assert.equal(buyRes.portfolio.orders[0].shares, 10);
  }

  // 4. Reject SELL exceeding held shares
  const oversell = validateAndExecuteOrder(
    INITIAL_PORTFOLIO,
    { symbol: 'AAPL', side: 'SELL', orderType: 'MARKET', shares: 999 },
    234.15
  );
  assert.equal(oversell.ok, false);

  // 5. Execute valid SELL order
  const sellRes = validateAndExecuteOrder(
    INITIAL_PORTFOLIO,
    { symbol: 'AAPL', side: 'SELL', orderType: 'MARKET', shares: 50 },
    230.00
  );
  assert.equal(sellRes.ok, true);
  if (sellRes.ok) {
    assert.equal(sellRes.portfolio.cashBalance, INITIAL_PORTFOLIO.cashBalance + 11500);
    const aaplPos = sellRes.portfolio.positions.find((p) => p.symbol === 'AAPL');
    assert.equal(aaplPos?.shares, 100);
  }
});

test('calculatePortfolioMetrics computes equity and unrealized PnL accurately', () => {
  const metrics = calculatePortfolioMetrics(INITIAL_PORTFOLIO, INITIAL_STOCKS);
  assert.ok(metrics.totalEquity > metrics.cashBalance);
  assert.equal(metrics.enrichedPositions.length, INITIAL_PORTFOLIO.positions.length);
  const expectedTotal = Number((metrics.cashBalance + metrics.positionsMarketValue).toFixed(2));
  assert.equal(metrics.totalEquity, expectedTotal);
});

test('filterAndSortStocks filters by query, sector, and trend', () => {
  const semis = filterAndSortStocks(INITIAL_STOCKS, { sector: 'Semiconductors' });
  assert.ok(semis.length >= 3);
  assert.ok(semis.every((s) => s.sector === 'Semiconductors'));

  const losers = filterAndSortStocks(INITIAL_STOCKS, { trend: 'LOSERS' });
  assert.ok(losers.length >= 1);
  assert.ok(losers.every((s) => s.changePercent < 0));

  const queryMatch = filterAndSortStocks(INITIAL_STOCKS, { query: 'nvidia' });
  assert.equal(queryMatch.length, 1);
  assert.equal(queryMatch[0].symbol, 'NVDA');
});

test('generateOrderBook and evaluatePriceAlerts work deterministically', () => {
  const book = generateOrderBook(142.85, 5);
  assert.equal(book.bids.length, 5);
  assert.equal(book.asks.length, 5);
  assert.ok(book.asks[0].price > book.bids[0].price);

  const alerts = evaluatePriceAlerts(
    [{ id: 'a1', symbol: 'NVDA', targetPrice: 140, condition: 'ABOVE', triggered: false, createdAt: '09:00' }],
    INITIAL_STOCKS
  );
  assert.equal(alerts[0].triggered, true);
});
