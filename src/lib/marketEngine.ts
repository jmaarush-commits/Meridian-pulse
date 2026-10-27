export interface OHLCVPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockAsset {
  symbol: string;
  name: string;
  sector: 'Semiconductors' | 'Software & Cloud' | 'Consumer Tech' | 'Financials' | 'Healthcare' | 'Energy';
  exchange: 'NASDAQ' | 'NYSE';
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: number;
  avgVolume: number;
  marketCapB: number;
  peRatio: number;
  beta: number;
  dividendYield: number;
  lastTickDirection: 'up' | 'down' | 'flat';
  intradaySeries: number[];
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface MarketCatalyst {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  relatedSymbols: string[];
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  impactScore: string;
  summary: string;
}

export interface PortfolioPosition {
  symbol: string;
  shares: number;
  avgCost: number;
}

export interface ExecutedOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  shares: number;
  executionPrice: number;
  totalValue: number;
  timestamp: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  triggered: boolean;
  createdAt: string;
}

export interface PortfolioState {
  cashBalance: number;
  positions: PortfolioPosition[];
  orders: ExecutedOrder[];
  alerts: PriceAlert[];
}

export interface OrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  shares: number;
  limitPrice?: number;
}

export interface TechnicalSummary {
  sma20: number;
  sma50: number;
  rsi14: number;
  bollingerUpper: number;
  bollingerLower: number;
  supportLevel: number;
  resistanceLevel: number;
  annualizedVolatility: number;
  signal: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  depthPercent: number;
}

export interface OrderBookSnapshot {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadBps: number;
}

export type TimeframeKey = '1D' | '1W' | '1M' | '1Y';

export const INITIAL_INDICES: MarketIndex[] = [
  { symbol: 'SPX', name: 'S&P 500', value: 5892.45, change: 38.20, changePercent: 0.65 },
  { symbol: 'NDX', name: 'NASDAQ 100', value: 20640.80, change: 214.55, changePercent: 1.05 },
  { symbol: 'DJI', name: 'Dow Jones', value: 43215.10, change: -54.30, changePercent: -0.13 },
  { symbol: 'VIX', name: 'CBOE Volatility', value: 16.42, change: -0.84, changePercent: -4.87 },
  { symbol: 'US10Y', name: '10Y Treasury Yield', value: 4.18, change: 0.03, changePercent: 0.72 },
];

function buildInitialSeries(basePrice: number, prevClose: number, points = 48): number[] {
  const series: number[] = [];
  let cursor = prevClose;
  const stepDelta = (basePrice - prevClose) / points;
  for (let i = 0; i < points; i++) {
    const wave = Math.sin(i * 0.35) * (basePrice * 0.0028) + Math.cos(i * 0.8) * (basePrice * 0.0014);
    cursor = Number((prevClose + stepDelta * (i + 1) + wave).toFixed(2));
    series.push(cursor);
  }
  series[series.length - 1] = basePrice;
  return series;
}

export const INITIAL_STOCKS: StockAsset[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Semiconductors',
    exchange: 'NASDAQ',
    price: 142.85,
    previousClose: 138.40,
    change: 4.45,
    changePercent: 3.22,
    high24h: 143.90,
    low24h: 138.10,
    volume: 68420000,
    avgVolume: 59100000,
    marketCapB: 3495,
    peRatio: 54.8,
    beta: 1.68,
    dividendYield: 0.03,
    lastTickDirection: 'up',
    intradaySeries: buildInitialSeries(142.85, 138.40),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Software & Cloud',
    exchange: 'NASDAQ',
    price: 428.50,
    previousClose: 423.10,
    change: 5.40,
    changePercent: 1.28,
    high24h: 430.25,
    low24h: 422.40,
    volume: 19850000,
    avgVolume: 21400000,
    marketCapB: 3185,
    peRatio: 36.2,
    beta: 0.92,
    dividendYield: 0.71,
    lastTickDirection: 'up',
    intradaySeries: buildInitialSeries(428.50, 423.10),
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Consumer Tech',
    exchange: 'NASDAQ',
    price: 234.15,
    previousClose: 232.20,
    change: 1.95,
    changePercent: 0.84,
    high24h: 235.40,
    low24h: 231.50,
    volume: 42180000,
    avgVolume: 46800000,
    marketCapB: 3560,
    peRatio: 34.5,
    beta: 1.18,
    dividendYield: 0.44,
    lastTickDirection: 'up',
    intradaySeries: buildInitialSeries(234.15, 232.20),
  },
  {
    symbol: 'AVGO',
    name: 'Broadcom Inc.',
    sector: 'Semiconductors',
    exchange: 'NASDAQ',
    price: 181.60,
    previousClose: 176.90,
    change: 4.70,
    changePercent: 2.66,
    high24h: 183.00,
    low24h: 176.25,
    volume: 24910000,
    avgVolume: 22300000,
    marketCapB: 848,
    peRatio: 42.1,
    beta: 1.42,
    dividendYield: 1.18,
    lastTickDirection: 'up',
    intradaySeries: buildInitialSeries(181.60, 176.90),
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Consumer Tech',
    exchange: 'NASDAQ',
    price: 211.40,
    previousClose: 208.30,
    change: 3.10,
    changePercent: 1.49,
    high24h: 212.60,
    low24h: 207.80,
    volume: 37600000,
    avgVolume: 40200000,
    marketCapB: 2218,
    peRatio: 43.9,
    beta: 1.15,
    dividendYield: 0.0,
    lastTickDirection: 'up',
    intradaySeries: buildInitialSeries(211.40, 208.30),
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    sector: 'Software & Cloud',
    exchange: 'NASDAQ',
    price: 594.20,
    previousClose: 586.50,
    change: 7.70,
    changePercent: 1.31,
    high24h: 597.80,
    low24h: 585.00,
    volume: 12840000,
    avgVolume: 14100000,
    marketCapB: 1502,
    peRatio: 29.4,
    beta: 1.24,
    dividendYield: 0.34,
    lastTickDirection: 'up',
    intradaySeries: buildInitialSeries(594.20, 586.50),
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    sector: 'Semiconductors',
    exchange: 'NASDAQ',
    price: 156.30,
    previousClose: 159.10,
    change: -2.80,
    changePercent: -1.76,
    high24h: 160.20,
    low24h: 155.10,
    volume: 49300000,
    avgVolume: 45100000,
    marketCapB: 252,
    peRatio: 46.8,
    beta: 1.72,
    dividendYield: 0.0,
    lastTickDirection: 'down',
    intradaySeries: buildInitialSeries(156.30, 159.10),
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Software & Cloud',
    exchange: 'NASDAQ',
    price: 183.75,
    previousClose: 182.10,
    change: 1.65,
    changePercent: 0.91,
    high24h: 185.10,
    low24h: 181.60,
    volume: 25400000,
    avgVolume: 27900000,
    marketCapB: 2265,
    peRatio: 26.1,
    beta: 1.04,
    dividendYield: 0.43,
    lastTickDirection: 'up',
    intradaySeries: buildInitialSeries(183.75, 182.10),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Consumer Tech',
    exchange: 'NASDAQ',
    price: 258.90,
    previousClose: 264.40,
    change: -5.50,
    changePercent: -2.08,
    high24h: 265.80,
    low24h: 256.20,
    volume: 74150000,
    avgVolume: 68900000,
    marketCapB: 821,
    peRatio: 68.4,
    beta: 2.15,
    dividendYield: 0.0,
    lastTickDirection: 'down',
    intradaySeries: buildInitialSeries(258.90, 264.40),
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financials',
    exchange: 'NYSE',
    price: 229.40,
    previousClose: 226.80,
    change: 2.60,
    changePercent: 1.15,
    high24h: 230.65,
    low24h: 226.10,
    volume: 9420000,
    avgVolume: 8900000,
    marketCapB: 648,
    peRatio: 12.8,
    beta: 1.08,
    dividendYield: 2.18,
    lastTickDirection: 'up',
    intradaySeries: buildInitialSeries(229.40, 226.80),
  },
  {
    symbol: 'LLY',
    name: 'Eli Lilly and Company',
    sector: 'Healthcare',
    exchange: 'NYSE',
    price: 912.60,
    previousClose: 904.20,
    change: 8.40,
    changePercent: 0.93,
    high24h: 917.50,
    low24h: 901.00,
    volume: 3120000,
    avgVolume: 3450000,
    marketCapB: 867,
    peRatio: 79.2,
    beta: 0.45,
    dividendYield: 0.57,
    lastTickDirection: 'up',
    intradaySeries: buildInitialSeries(912.60, 904.20),
  },
  {
    symbol: 'XOM',
    name: 'Exxon Mobil Corporation',
    sector: 'Energy',
    exchange: 'NYSE',
    price: 118.45,
    previousClose: 120.15,
    change: -1.70,
    changePercent: -1.41,
    high24h: 120.80,
    low24h: 117.90,
    volume: 14800000,
    avgVolume: 15600000,
    marketCapB: 521,
    peRatio: 14.1,
    beta: 0.86,
    dividendYield: 3.21,
    lastTickDirection: 'down',
    intradaySeries: buildInitialSeries(118.45, 120.15),
  },
];

export const INITIAL_CATALYSTS: MarketCatalyst[] = [
  {
    id: 'cat-1',
    headline: 'Hyperscaler CapEx Guidance Raised 18% on Next-Gen AI Rack Deployments',
    source: 'Institutional Desk',
    publishedAt: '12m ago',
    relatedSymbols: ['NVDA', 'AVGO', 'MSFT'],
    sentiment: 'Bullish',
    impactScore: 'High Impact',
    summary: 'Tier-1 cloud providers confirmed accelerated Q4 silicon shipments and optical interconnect orders, lifting semiconductor supply chain visibility through FY27.',
  },
  {
    id: 'cat-2',
    headline: '10-Year Treasury Yield Holds at 4.18% Following Resilient Retail & Payroll Prints',
    source: 'Macro Rates Wire',
    publishedAt: '34m ago',
    relatedSymbols: ['JPM', 'AAPL', 'AMZN'],
    sentiment: 'Neutral',
    impactScore: 'Medium Impact',
    summary: 'Fixed income desks price a measured pace of FOMC rate normalization while net interest income expectations for money-center banks ticked upward.',
  },
  {
    id: 'cat-3',
    headline: 'EV Margin Compression Weighs on Auto Deliveries Amid European Tariff Adjustments',
    source: 'Global Equities Desk',
    publishedAt: '1h ago',
    relatedSymbols: ['TSLA'],
    sentiment: 'Bearish',
    impactScore: 'High Impact',
    summary: 'Promotional financing incentives in North America and Europe continue to pressure gross automotive margins despite energy storage growth.',
  },
  {
    id: 'cat-4',
    headline: 'GLP-1 Manufacturing Capacity Expansion Clears FDA Inspection Ahead of Schedule',
    source: 'Biotech & Pharma Monitor',
    publishedAt: '2h ago',
    relatedSymbols: ['LLY'],
    sentiment: 'Bullish',
    impactScore: 'Medium Impact',
    summary: 'New parenteral filling lines in North Carolina are slated to expand commercial supply volume by 25% starting next quarter.',
  },
];

export const INITIAL_PORTFOLIO: PortfolioState = {
  cashBalance: 145250.00,
  positions: [
    { symbol: 'NVDA', shares: 250, avgCost: 128.40 },
    { symbol: 'MSFT', shares: 80, avgCost: 412.00 },
    { symbol: 'AAPL', shares: 150, avgCost: 224.50 },
    { symbol: 'JPM', shares: 100, avgCost: 215.20 },
  ],
  orders: [
    {
      id: 'ORD-9041',
      symbol: 'NVDA',
      side: 'BUY',
      orderType: 'MARKET',
      shares: 50,
      executionPrice: 139.20,
      totalValue: 6960.00,
      timestamp: '09:34:12 EST',
    },
    {
      id: 'ORD-9038',
      symbol: 'MSFT',
      side: 'BUY',
      orderType: 'LIMIT',
      shares: 30,
      executionPrice: 421.50,
      totalValue: 12645.00,
      timestamp: '09:18:45 EST',
    },
  ],
  alerts: [
    {
      id: 'ALT-101',
      symbol: 'NVDA',
      targetPrice: 145.00,
      condition: 'ABOVE',
      triggered: false,
      createdAt: '09:00 EST',
    },
    {
      id: 'ALT-102',
      symbol: 'TSLA',
      targetPrice: 255.00,
      condition: 'BELOW',
      triggered: false,
      createdAt: '09:15 EST',
    },
  ],
};

/**
 * Pure deterministic or random-seeded tick simulation for stocks.
 */
export function simulateMarketTick(
  stocks: StockAsset[],
  tickStep: number
): StockAsset[] {
  return stocks.map((stock, idx) => {
    // Deterministic pseudo-random oscillation mixed with slight drift
    const phase = Math.sin(tickStep * 0.7 + idx * 1.9) + Math.cos(tickStep * 1.3 - idx * 0.8);
    const pctDelta = phase * 0.0016 * (stock.beta || 1.0);
    const rawNewPrice = Math.max(1.0, stock.price * (1 + pctDelta));
    const newPrice = Number(rawNewPrice.toFixed(2));
    const change = Number((newPrice - stock.previousClose).toFixed(2));
    const changePercent = Number(((change / stock.previousClose) * 100).toFixed(2));
    const high24h = Number(Math.max(stock.high24h, newPrice).toFixed(2));
    const low24h = Number(Math.min(stock.low24h, newPrice).toFixed(2));
    const volumeIncrement = Math.round(Math.abs(phase) * 42500 + 8500);
    const direction: 'up' | 'down' | 'flat' =
      newPrice > stock.price ? 'up' : newPrice < stock.price ? 'down' : 'flat';

    const updatedSeries = [...stock.intradaySeries.slice(1), newPrice];

    return {
      ...stock,
      price: newPrice,
      change,
      changePercent,
      high24h,
      low24h,
      volume: stock.volume + volumeIncrement,
      lastTickDirection: direction,
      intradaySeries: updatedSeries,
    };
  });
}

/**
 * Generates OHLCV series for a given stock and timeframe ('1D', '1W', '1M', '1Y').
 */
export function generateOHLCVSeries(
  stock: StockAsset,
  timeframe: TimeframeKey
): OHLCVPoint[] {
  const count = 48;
  const points: OHLCVPoint[] = [];
  const scaleFactor =
    timeframe === '1D' ? 0.003 :
    timeframe === '1W' ? 0.008 :
    timeframe === '1M' ? 0.016 : 0.035;

  const baseSeries = stock.intradaySeries.length >= count
    ? stock.intradaySeries.slice(-count)
    : buildInitialSeries(stock.price, stock.previousClose, count);

  const seedNum = stock.symbol.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  for (let i = 0; i < baseSeries.length; i++) {
    const progress = (i + 1) / baseSeries.length;
    let close = baseSeries[i];
    if (timeframe !== '1D') {
      const historicalDrift = (1 - progress) * (timeframe === '1Y' ? 0.24 : timeframe === '1M' ? 0.07 : 0.025);
      const wave = Math.sin(i * 0.45 + seedNum) * stock.price * scaleFactor;
      close = Number((stock.price * (1 - historicalDrift * (stock.change >= 0 ? 1 : -0.6)) + wave).toFixed(2));
      if (i === baseSeries.length - 1) {
        close = stock.price;
      }
    }

    const prevClose = i > 0 ? points[i - 1].close : Number((close * (1 - 0.002)).toFixed(2));
    const open = prevClose;
    const wickSpread = Math.max(0.15, Number((close * scaleFactor * (0.6 + ((i + seedNum) % 5) * 0.18)).toFixed(2)));
    const high = Number((Math.max(open, close) + wickSpread).toFixed(2));
    const low = Number((Math.min(open, close) - wickSpread * 0.85).toFixed(2));
    const vol = Math.round((stock.avgVolume / 48) * (0.7 + ((i * 7 + seedNum) % 10) * 0.08));

    let label = '';
    if (timeframe === '1D') {
      const totalMinutes = 9 * 60 + 30 + Math.floor((i / count) * 390);
      const hrs = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const mins = (totalMinutes % 60).toString().padStart(2, '0');
      label = `${hrs}:${mins}`;
    } else if (timeframe === '1W') {
      label = `D-${count - i}h`;
    } else if (timeframe === '1M') {
      label = `Day ${i + 1}`;
    } else {
      label = `W${i + 1}`;
    }

    points.push({
      timestamp: label,
      open,
      high,
      low,
      close,
      volume: vol,
    });
  }

  return points;
}

/**
 * Pure calculation of technical indicators from a price array.
 */
export function calculateTechnicalIndicators(prices: number[]): TechnicalSummary {
  if (!prices || prices.length === 0) {
    return {
      sma20: 0,
      sma50: 0,
      rsi14: 50,
      bollingerUpper: 0,
      bollingerLower: 0,
      supportLevel: 0,
      resistanceLevel: 0,
      annualizedVolatility: 0,
      signal: 'Neutral',
    };
  }

  const window20 = prices.slice(-20);
  const sma20 = Number(
    (window20.reduce((sum, p) => sum + p, 0) / window20.length).toFixed(2)
  );

  const window50 = prices.slice(-50);
  const sma50 = Number(
    (window50.reduce((sum, p) => sum + p, 0) / window50.length).toFixed(2)
  );

  // Standard deviation over window20 for Bollinger Bands
  const variance =
    window20.reduce((acc, p) => acc + Math.pow(p - sma20, 2), 0) / window20.length;
  const stdDev = Math.sqrt(variance);
  const bollingerUpper = Number((sma20 + 2 * stdDev).toFixed(2));
  const bollingerLower = Number((sma20 - 2 * stdDev).toFixed(2));

  // RSI-14
  const rsiSlice = prices.slice(-15);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < rsiSlice.length; i++) {
    const diff = rsiSlice[i] - rsiSlice[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const period = Math.max(1, rsiSlice.length - 1);
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi14 = Number((avgLoss === 0 ? 78 : 100 - 100 / (1 + rs)).toFixed(1));

  const supportLevel = Number(Math.min(...window20).toFixed(2));
  const resistanceLevel = Number(Math.max(...window20).toFixed(2));

  const lastPrice = prices[prices.length - 1];
  const annualizedVolatility = Number(((stdDev / Math.max(1, lastPrice)) * Math.sqrt(252) * 100).toFixed(1));

  let signal: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (lastPrice > sma20 && rsi14 >= 52 && rsi14 <= 75) {
    signal = 'Bullish';
  } else if (lastPrice < sma20 && rsi14 < 48) {
    signal = 'Bearish';
  }

  return {
    sma20,
    sma50,
    rsi14,
    bollingerUpper,
    bollingerLower,
    supportLevel,
    resistanceLevel,
    annualizedVolatility,
    signal,
  };
}

/**
 * Generates deterministic Level-2 Order Book around midPrice.
 */
export function generateOrderBook(midPrice: number, levels = 6): OrderBookSnapshot {
  const tickSize = midPrice > 200 ? 0.05 : 0.02;
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  let cumBid = 0;
  let cumAsk = 0;
  const seed = Math.round(midPrice * 100);

  for (let i = 1; i <= levels; i++) {
    const bidPrice = Number((midPrice - i * tickSize).toFixed(2));
    const askPrice = Number((midPrice + i * tickSize).toFixed(2));
    const bidSize = 120 + ((seed + i * 37) % 480);
    const askSize = 110 + ((seed + i * 53) % 460);
    cumBid += bidSize;
    cumAsk += askSize;

    bids.push({ price: bidPrice, size: bidSize, total: cumBid, depthPercent: 0 });
    asks.push({ price: askPrice, size: askSize, total: cumAsk, depthPercent: 0 });
  }

  const maxTotal = Math.max(cumBid, cumAsk, 1);
  bids.forEach((b) => {
    b.depthPercent = Math.round((b.total / maxTotal) * 100);
  });
  asks.forEach((a) => {
    a.depthPercent = Math.round((a.total / maxTotal) * 100);
  });

  const spread = Number((asks[0].price - bids[0].price).toFixed(2));
  const spreadBps = Number(((spread / midPrice) * 10000).toFixed(1));

  return { bids, asks, spread, spreadBps };
}

/**
 * Validates and executes a paper trading order against the user's portfolio.
 */
export function validateAndExecuteOrder(
  portfolio: PortfolioState,
  request: OrderRequest,
  marketPrice: number,
  timestamp = '10:42:15 EST'
): { ok: true; portfolio: PortfolioState; order: ExecutedOrder } | { ok: false; error: string } {
  if (!request.symbol || request.symbol.trim() === '') {
    return { ok: false, error: 'Ticker symbol is required.' };
  }
  if (!Number.isFinite(request.shares) || request.shares <= 0 || !Number.isInteger(request.shares)) {
    return { ok: false, error: 'Order quantity must be a whole number greater than 0.' };
  }
  if (!Number.isFinite(marketPrice) || marketPrice <= 0) {
    return { ok: false, error: 'Invalid market execution price.' };
  }

  let executionPrice = marketPrice;
  if (request.orderType === 'LIMIT') {
    if (request.limitPrice === undefined || !Number.isFinite(request.limitPrice) || request.limitPrice <= 0) {
      return { ok: false, error: 'Please enter a valid positive limit price.' };
    }
    executionPrice = Number(request.limitPrice.toFixed(2));
  }

  const totalValue = Number((request.shares * executionPrice).toFixed(2));
  const existingPos = portfolio.positions.find((p) => p.symbol === request.symbol);

  if (request.side === 'BUY') {
    if (totalValue > portfolio.cashBalance) {
      return {
        ok: false,
        error: `Insufficient buying power. Order requires $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}, available cash is $${portfolio.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
      };
    }

    const updatedPositions = existingPos
      ? portfolio.positions.map((pos) => {
          if (pos.symbol !== request.symbol) return pos;
          const newShares = pos.shares + request.shares;
          const newAvgCost = Number(
            ((pos.shares * pos.avgCost + totalValue) / newShares).toFixed(2)
          );
          return { ...pos, shares: newShares, avgCost: newAvgCost };
        })
      : [
          ...portfolio.positions,
          { symbol: request.symbol, shares: request.shares, avgCost: executionPrice },
        ];

    const newOrder: ExecutedOrder = {
      id: `ORD-${9042 + portfolio.orders.length}`,
      symbol: request.symbol,
      side: 'BUY',
      orderType: request.orderType,
      shares: request.shares,
      executionPrice,
      totalValue,
      timestamp,
    };

    return {
      ok: true,
      order: newOrder,
      portfolio: {
        ...portfolio,
        cashBalance: Number((portfolio.cashBalance - totalValue).toFixed(2)),
        positions: updatedPositions,
        orders: [newOrder, ...portfolio.orders],
      },
    };
  } else {
    // SELL
    if (!existingPos || existingPos.shares < request.shares) {
      const held = existingPos ? existingPos.shares : 0;
      return {
        ok: false,
        error: `Insufficient shares to sell. You hold ${held} shares of ${request.symbol}.`,
      };
    }

    const remainingShares = existingPos.shares - request.shares;
    const updatedPositions =
      remainingShares === 0
        ? portfolio.positions.filter((p) => p.symbol !== request.symbol)
        : portfolio.positions.map((p) =>
            p.symbol === request.symbol ? { ...p, shares: remainingShares } : p
          );

    const newOrder: ExecutedOrder = {
      id: `ORD-${9042 + portfolio.orders.length}`,
      symbol: request.symbol,
      side: 'SELL',
      orderType: request.orderType,
      shares: request.shares,
      executionPrice,
      totalValue,
      timestamp,
    };

    return {
      ok: true,
      order: newOrder,
      portfolio: {
        ...portfolio,
        cashBalance: Number((portfolio.cashBalance + totalValue).toFixed(2)),
        positions: updatedPositions,
        orders: [newOrder, ...portfolio.orders],
      },
    };
  }
}

export interface EnrichedPosition extends PortfolioPosition {
  name: string;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChangeDollar: number;
  weightPercent: number;
}

export interface PortfolioMetrics {
  cashBalance: number;
  positionsMarketValue: number;
  totalEquity: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  totalDayPnL: number;
  enrichedPositions: EnrichedPosition[];
}

export function calculatePortfolioMetrics(
  portfolio: PortfolioState,
  stocks: StockAsset[]
): PortfolioMetrics {
  const stockMap = new Map(stocks.map((s) => [s.symbol, s]));

  let positionsMarketValue = 0;
  let totalCostBasis = 0;
  let totalDayPnL = 0;

  const rawPositions = portfolio.positions.map((pos) => {
    const asset = stockMap.get(pos.symbol);
    const currentPrice = asset ? asset.price : pos.avgCost;
    const dayChange = asset ? asset.change : 0;
    const marketValue = Number((pos.shares * currentPrice).toFixed(2));
    const costBasis = Number((pos.shares * pos.avgCost).toFixed(2));
    const unrealizedPnL = Number((marketValue - costBasis).toFixed(2));
    const unrealizedPnLPercent =
      costBasis > 0 ? Number(((unrealizedPnL / costBasis) * 100).toFixed(2)) : 0;
    const dayChangeDollar = Number((pos.shares * dayChange).toFixed(2));

    positionsMarketValue += marketValue;
    totalCostBasis += costBasis;
    totalDayPnL += dayChangeDollar;

    return {
      ...pos,
      name: asset ? asset.name : pos.symbol,
      currentPrice,
      marketValue,
      costBasis,
      unrealizedPnL,
      unrealizedPnLPercent,
      dayChangeDollar,
      weightPercent: 0,
    };
  });

  positionsMarketValue = Number(positionsMarketValue.toFixed(2));
  totalCostBasis = Number(totalCostBasis.toFixed(2));
  totalDayPnL = Number(totalDayPnL.toFixed(2));
  const totalEquity = Number((portfolio.cashBalance + positionsMarketValue).toFixed(2));
  const totalUnrealizedPnL = Number((positionsMarketValue - totalCostBasis).toFixed(2));
  const totalUnrealizedPnLPercent =
    totalCostBasis > 0
      ? Number(((totalUnrealizedPnL / totalCostBasis) * 100).toFixed(2))
      : 0;

  const enrichedPositions: EnrichedPosition[] = rawPositions.map((p) => ({
    ...p,
    weightPercent:
      totalEquity > 0 ? Number(((p.marketValue / totalEquity) * 100).toFixed(1)) : 0,
  }));

  return {
    cashBalance: portfolio.cashBalance,
    positionsMarketValue,
    totalEquity,
    totalCostBasis,
    totalUnrealizedPnL,
    totalUnrealizedPnLPercent,
    totalDayPnL,
    enrichedPositions,
  };
}

export interface ScreenerFilterOptions {
  query?: string;
  sector?: string;
  trend?: 'ALL' | 'GAINERS' | 'LOSERS' | 'HIGH_VOLUME';
  sortBy?: 'marketCapB' | 'price' | 'changePercent' | 'volume' | 'peRatio';
  sortDir?: 'asc' | 'desc';
}

export function filterAndSortStocks(
  stocks: StockAsset[],
  options: ScreenerFilterOptions
): StockAsset[] {
  const q = (options.query || '').trim().toLowerCase();
  const sector = options.sector || 'ALL';
  const trend = options.trend || 'ALL';
  const sortBy = options.sortBy || 'marketCapB';
  const sortDir = options.sortDir || 'desc';

  const filtered = stocks.filter((stock) => {
    if (q) {
      const matchSymbol = stock.symbol.toLowerCase().includes(q);
      const matchName = stock.name.toLowerCase().includes(q);
      const matchSector = stock.sector.toLowerCase().includes(q);
      if (!matchSymbol && !matchName && !matchSector) return false;
    }
    if (sector !== 'ALL' && stock.sector !== sector) {
      return false;
    }
    if (trend === 'GAINERS' && stock.changePercent <= 0) return false;
    if (trend === 'LOSERS' && stock.changePercent >= 0) return false;
    if (trend === 'HIGH_VOLUME' && stock.volume < stock.avgVolume) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    return sortDir === 'desc' ? valB - valA : valA - valB;
  });
}

export function evaluatePriceAlerts(
  alerts: PriceAlert[],
  stocks: StockAsset[]
): PriceAlert[] {
  const priceMap = new Map(stocks.map((s) => [s.symbol, s.price]));
  return alerts.map((alert) => {
    const currentPrice = priceMap.get(alert.symbol);
    if (currentPrice === undefined) return alert;
    const isHit =
      (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice);
    return isHit ? { ...alert, triggered: true } : alert;
  });
}
