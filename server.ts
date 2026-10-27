import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_STOCKS,
  INITIAL_INDICES,
  INITIAL_CATALYSTS,
  calculateTechnicalIndicators,
  StockAsset,
} from './src/lib/marketEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChatRequestPayload {
  message: string;
  selectedSymbol?: string;
  stocks?: StockAsset[];
  portfolioSummary?: {
    totalEquity: number;
    cashBalance: number;
    totalUnrealizedPnL: number;
    positions: Array<{ symbol: string; shares: number; avgCost: number; currentPrice: number; unrealizedPnLPercent: number }>;
  };
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

function buildQuantitativeFallbackResponse(payload: ChatRequestPayload): {
  reply: string;
  citations: Array<{ title: string; uri: string }>;
  analyzedSymbols: string[];
} {
  const stocks = payload.stocks && payload.stocks.length > 0 ? payload.stocks : INITIAL_STOCKS;
  const msgLower = (payload.message || '').toLowerCase();

  // Detect any mentioned tickers or fall back to selectedSymbol
  const matchedStocks = stocks.filter(
    (s) =>
      msgLower.includes(s.symbol.toLowerCase()) ||
      msgLower.includes(s.name.split(' ')[0].toLowerCase())
  );

  const primaryStock =
    matchedStocks[0] ||
    stocks.find((s) => s.symbol === payload.selectedSymbol) ||
    stocks[0];

  const tech = calculateTechnicalIndicators(primaryStock.intradaySeries);
  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 2);

  if (msgLower.includes('portfolio') || msgLower.includes('risk') || msgLower.includes('allocation') || msgLower.includes('position')) {
    const port = payload.portfolioSummary;
    if (port && port.positions.length > 0) {
      const posLines = port.positions
        .map(
          (p) =>
            `- **${p.symbol}**: ${p.shares} shares @ $${p.avgCost.toFixed(2)} avg cost (Last: $${p.currentPrice.toFixed(2)} · Return: ${p.unrealizedPnLPercent >= 0 ? '+' : ''}${p.unrealizedPnLPercent.toFixed(2)}%)`
        )
        .join('\n');

      return {
        reply: `### Portfolio Risk & Attribution Analysis\n\nYour current total account equity stands at **$${port.totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}** with **$${port.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}** in available buying power and **${port.totalUnrealizedPnL >= 0 ? '+' : ''}$${port.totalUnrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}** in net unrealized P&L.\n\n#### Active Holdings Breakdown\n${posLines}\n\n#### Institutional Desk Assessment\n1. **Factor Exposure**: Your equity book carries a growth and semiconductor tilt led by **NVDA** and **MSFT**, balanced by money-center financial exposure in **JPM**.\n2. **Liquidity Cushion**: Cash reserves represent **${((port.cashBalance / Math.max(1, port.totalEquity)) * 100).toFixed(1)}%** of total equity, providing ample dry powder for limit-order entries near 20-period SMA support levels.`,
        citations: [],
        analyzedSymbols: port.positions.map((p) => p.symbol),
      };
    }
  }

  if (matchedStocks.length >= 2) {
    const [a, b] = matchedStocks;
    const techA = calculateTechnicalIndicators(a.intradaySeries);
    const techB = calculateTechnicalIndicators(b.intradaySeries);
    return {
      reply: `### Relative Value & Momentum Comparison: ${a.symbol} vs. ${b.symbol}\n\n| Metric | ${a.symbol} (${a.name}) | ${b.symbol} (${b.name}) |\n| :--- | :--- | :--- |\n| **Last Price** | $${a.price.toFixed(2)} (${a.changePercent >= 0 ? '+' : ''}${a.changePercent.toFixed(2)}%) | $${b.price.toFixed(2)} (${b.changePercent >= 0 ? '+' : ''}${b.changePercent.toFixed(2)}%) |\n| **Market Cap** | $${a.marketCapB}B | $${b.marketCapB}B |\n| **Forward P/E** | ${a.peRatio.toFixed(1)}x | ${b.peRatio.toFixed(1)}x |\n| **Beta / Volatility** | ${a.beta.toFixed(2)} (${techA.annualizedVolatility}% vol) | ${b.beta.toFixed(2)} (${techB.annualizedVolatility}% vol) |\n| **RSI (14) & Signal** | ${techA.rsi14} (${techA.signal}) | ${techB.rsi14} (${techB.signal}) |\n| **SMA-20 Support** | $${techA.sma20.toFixed(2)} | $${techB.sma20.toFixed(2)} |\n\n#### Key Takeaway\n- **${a.symbol}** trades at **${a.peRatio.toFixed(1)}x** earnings with an intraday RSI of **${techA.rsi14}** (${techA.signal} regime), while **${b.symbol}** trades at **${b.peRatio.toFixed(1)}x** with an RSI of **${techB.rsi14}** (${techB.signal} regime). Watch key resistance at **$${techA.resistanceLevel.toFixed(2)}** for ${a.symbol} and **$${techB.resistanceLevel.toFixed(2)}** for ${b.symbol}.`,
      citations: [],
      analyzedSymbols: [a.symbol, b.symbol],
    };
  }

  if (msgLower.includes('trend') || msgLower.includes('market') || msgLower.includes('sector') || msgLower.includes('mover') || msgLower.includes('today')) {
    return {
      reply: `### Live Market Regime & Sector Flow Summary\n\nBroad indices are led by technology and semiconductor infrastructure, with the **NASDAQ 100 (+1.05%)** and **S&P 500 (+0.65%)** outperforming while the **CBOE VIX (16.42)** compresses by 4.87%.\n\n#### Session Relative Strength Leaders\n${topGainers.map((s) => `- **${s.symbol}** (${s.sector}): **$${s.price.toFixed(2)}** (${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%) · Vol: ${(s.volume / 1e6).toFixed(1)}M`).join('\n')}\n\n#### Session Laggards Under Distribution\n${topLosers.map((s) => `- **${s.symbol}** (${s.sector}): **$${s.price.toFixed(2)}** (${s.changePercent.toFixed(2)}%) · Vol: ${(s.volume / 1e6).toFixed(1)}M`).join('\n')}\n\n#### Desk Focus on ${primaryStock.symbol}\n**${primaryStock.name} (${primaryStock.symbol})** is currently trading at **$${primaryStock.price.toFixed(2)}** with a **${tech.signal}** technical posture (SMA-20: $${tech.sma20.toFixed(2)}, RSI-14: ${tech.rsi14}).`,
      citations: [],
      analyzedSymbols: [primaryStock.symbol, ...topGainers.map((s) => s.symbol)],
    };
  }

  return {
    reply: `### Quantitative Brief: ${primaryStock.name} (${primaryStock.symbol})\n\n- **Live Quote**: **$${primaryStock.price.toFixed(2)}** (${primaryStock.change >= 0 ? '+' : ''}$${primaryStock.change.toFixed(2)} / ${primaryStock.changePercent >= 0 ? '+' : ''}${primaryStock.changePercent.toFixed(2)}%)\n- **Session Range**: $${primaryStock.low24h.toFixed(2)} – $${primaryStock.high24h.toFixed(2)} · Volume: ${(primaryStock.volume / 1e6).toFixed(2)}M shares\n- **Technical Structure**: **${tech.signal}** posture · SMA-20 at **$${tech.sma20.toFixed(2)}** · SMA-50 at **$${tech.sma50.toFixed(2)}** · RSI(14) at **${tech.rsi14}**\n- **Bollinger Envelope**: Lower Band **$${tech.bollingerLower.toFixed(2)}** · Upper Band **$${tech.bollingerUpper.toFixed(2)}**\n- **Valuation Profile**: Market Cap **$${primaryStock.marketCapB}B** · P/E **${primaryStock.peRatio}x** · Beta **${primaryStock.beta}**\n\n#### Execution Levels\nImmediate intraday support sits near **$${tech.supportLevel.toFixed(2)}**, with overhead supply tested at **$${tech.resistanceLevel.toFixed(2)}**. Use the Order Ticket to stage Market or Limit orders directly against live book depth.`,
    citations: [],
    analyzedSymbols: [primaryStock.symbol],
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/market/snapshot', (_req, res) => {
    res.json({
      indices: INITIAL_INDICES,
      stocks: INITIAL_STOCKS,
      catalysts: INITIAL_CATALYSTS,
      serverTime: new Date().toISOString(),
    });
  });

  app.post('/api/ai/chat', async (req, res) => {
    const payload = (req.body || {}) as ChatRequestPayload;
    const userMessage = (payload.message || '').trim();

    if (!userMessage) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey =
      Boolean(apiKey) &&
      apiKey !== 'MY_GEMINI_API_KEY' &&
      apiKey!.trim().length > 10;

    if (!hasValidKey) {
      const fallback = buildQuantitativeFallbackResponse(payload);
      res.json(fallback);
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const stocks = payload.stocks && payload.stocks.length > 0 ? payload.stocks : INITIAL_STOCKS;
      const tickerContext = stocks
        .map(
          (s) =>
            `${s.symbol} ($${s.price.toFixed(2)}, ${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%, P/E ${s.peRatio}x, Sector: ${s.sector})`
        )
        .join('; ');

      const portfolioContext = payload.portfolioSummary
        ? `User Portfolio: Total Equity $${payload.portfolioSummary.totalEquity.toFixed(2)}, Cash $${payload.portfolioSummary.cashBalance.toFixed(2)}, Unrealized PnL $${payload.portfolioSummary.totalUnrealizedPnL.toFixed(2)}, Positions: ${payload.portfolioSummary.positions
            .map((p) => `${p.symbol} (${p.shares} sh @ $${p.avgCost.toFixed(2)})`)
            .join(', ')}.`
        : '';

      const systemInstruction = `You are the Meridian Pulse Institutional AI Market Analyst inside a live financial trading terminal.
Provide concise, quantitative, well-structured analysis using Markdown headings and bullet points.
Always reference exact prices, percentage changes, valuation multiples, and technical levels from the live terminal feed below.
Active Selected Ticker: ${payload.selectedSymbol || 'NVDA'}
Live Terminal Feed: ${tickerContext}
${portfolioContext}
Do not give personalized legal/tax advice; frame insights as institutional market research and technical/fundamental analysis.`;

      const contents = [
        ...(payload.history || []).slice(-6).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const replyText = response.text || buildQuantitativeFallbackResponse(payload).reply;
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const citations: Array<{ title: string; uri: string }> = [];
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          citations.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      }

      const analyzedSymbols = stocks
        .filter((s) => replyText.includes(s.symbol))
        .map((s) => s.symbol)
        .slice(0, 5);

      res.json({
        reply: replyText,
        citations: citations.slice(0, 4),
        analyzedSymbols: analyzedSymbols.length > 0 ? analyzedSymbols : [payload.selectedSymbol || 'NVDA'],
      });
    } catch (err) {
      // Graceful fallback to deterministic quantitative engine if API key is restricted or rate-limited
      const fallback = buildQuantitativeFallbackResponse(payload);
      res.json(fallback);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Meridian Pulse server listening on http://localhost:${PORT}`);
  });
}

startServer();
