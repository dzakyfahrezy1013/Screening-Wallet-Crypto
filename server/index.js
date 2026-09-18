import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';
import { solanaRpc } from './solanaRpc.js';
import { dexScreener } from './dexscreener.js';
import { screenWallet } from './screener.js';
import { SAMPLE_WALLETS } from './sampleWallets.js';
import { parseTransaction } from './parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
// Live PumpPortal WebSocket stream buffer & SSE clients
const liveTokensBuffer = [];
const sseClients = new Set();
let wsConnected = false;

function initPumpPortalWs() {
  try {
    const ws = new WebSocket('wss://pumpportal.fun/api/data');
    ws.onopen = () => {
      console.log('⚡ PumpPortal WebSocket connected! Subscribing to live token mints...');
      wsConnected = true;
      ws.send(JSON.stringify({ method: 'subscribeNewToken' }));
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.txType === 'create') {
          const item = {
            mint: data.mint,
            name: data.name || 'Unknown',
            symbol: data.symbol || 'PUMP',
            traderPublicKey: data.traderPublicKey,
            solAmount: data.solAmount || 0,
            marketCapSol: data.marketCapSol || 28,
            timestamp: Date.now(),
            timeAgo: 'Just now'
          };
          liveTokensBuffer.unshift(item);
          if (liveTokensBuffer.length > 60) liveTokensBuffer.pop();
          // Broadcast to connected SSE browsers
          for (const client of sseClients) {
            client.write(`data: ${JSON.stringify(item)}\n\n`);
          }
        }
      } catch (e) {}
    };
    ws.onclose = () => {
      wsConnected = false;
      setTimeout(initPumpPortalWs, 6000);
    };
    ws.onerror = () => {
      wsConnected = false;
    };
  } catch (err) {
    console.warn('PumpPortal WS init error:', err.message);
  }
}
initPumpPortalWs();

// 1. Health check & basic stats
app.get('/api/health', async (req, res) => {
  try {
    const solPriceUsd = await dexScreener.getSolPriceUsd();
    res.json({
      status: 'ok',
      version: '1.0.0',
      activeRpc: solanaRpc.getActiveRpc(),
      customRpcSet: !!solanaRpc.customRpc,
      solPriceUsd,
      wsConnected,
      liveTokensCount: liveTokensBuffer.length,
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});
// 2. Real-time SOL price
app.get('/api/sol-price', async (req, res) => {
  try {
    const price = await dexScreener.getSolPriceUsd();
    res.json({ solPriceUsd: price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Screen a specific wallet address
app.get('/api/wallet/:address', async (req, res) => {
  const { address } = req.params;
  const limit = parseInt(req.query.limit || '40', 10);
  const forceLive = req.query.forceLive === 'true';
  const useSample = !forceLive && req.query.sample !== 'false';

  try {
    const result = await screenWallet(address, {
      limit: Math.min(100, Math.max(10, limit)),
      useSampleIfAvailable: useSample
    });
    res.json(result);
  } catch (err) {
    console.error(`Error screening wallet ${address}:`, err);
    res.status(400).json({
      error: err.message || 'Failed to screen wallet',
      address
    });
  }
});

// 4. Sample wallets catalog
app.get('/api/wallet-samples', (req, res) => {
  const samples = Object.values(SAMPLE_WALLETS).map(w => ({
    address: w.address,
    alias: w.alias,
    winRate: w.summary.winRate,
    pnlSol: w.summary.totalRealizedPnlSol,
    badges: w.badges,
    smartScore: w.summary.smartScore,
    safetyLevel: w.summary.safetyLevel,
    tokensCount: w.summary.uniqueTokensTraded
  }));
  res.json(samples);
});

// 5. Trending pump.fun tokens
app.get('/api/tokens/trending', async (req, res) => {
  const limit = parseInt(req.query.limit || '20', 10);
  try {
    const tokens = await dexScreener.getTrendingPumpTokens(limit);
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5b. Live Pump.fun Token Mints Stream (Sub-second via PumpPortal WS)
app.get('/api/tokens/live-feed', (req, res) => {
  res.json({
    connected: wsConnected,
    count: liveTokensBuffer.length,
    tokens: liveTokensBuffer
  });
});

app.get('/api/tokens/live-sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  // Send initial batch
  res.write(`data: ${JSON.stringify({ type: 'init', connected: wsConnected, tokens: liveTokensBuffer.slice(0, 20) })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 6. Token detail & recent traders
app.get('/api/token/:mint', async (req, res) => {
  const { mint } = req.params;
  try {
    const tokenData = await dexScreener.getTokenData(mint);
    if (!tokenData) {
      return res.status(404).json({ error: 'Token not found on DexScreener' });
    }
    res.json(tokenData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Recent traders on a token (useful for finding new wallets to screen)
app.get('/api/token/:mint/traders', async (req, res) => {
  const { mint } = req.params;
  const limit = parseInt(req.query.limit || '12', 10);

  try {
    const sigs = await solanaRpc.getSignaturesForAddress(mint, Math.min(30, limit));
    if (!sigs || sigs.length === 0) {
      return res.json([]);
    }

    const txs = await solanaRpc.getMultipleTransactions(sigs.map(s => s.signature), 4);
    const traderMap = new Map();

    for (const tx of txs) {
      const parsed = parseTransaction(tx);
      if (!parsed || !parsed.userWallet) continue;

      const wallet = parsed.userWallet;
      if (!traderMap.has(wallet)) {
        traderMap.set(wallet, {
          wallet,
          buysCount: 0,
          sellsCount: 0,
          totalSol: 0,
          routerUsed: parsed.routerUsed,
          lastAction: parsed.action,
          lastTimestamp: parsed.timestamp
        });
      }

      const item = traderMap.get(wallet);
      if (parsed.action === 'buy') item.buysCount++;
      if (parsed.action === 'sell') item.sellsCount++;
      item.totalSol += parsed.solAmount;
      if (parsed.routerUsed) item.routerUsed = parsed.routerUsed;
    }

    const traders = Array.from(traderMap.values()).map(t => ({
      ...t,
      totalSol: parseFloat(t.totalSol.toFixed(4))
    }));

    res.json(traders);
  } catch (err) {
    console.warn(`Error getting traders for token ${mint}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// 8. Smart Money Leaderboard
app.get('/api/leaderboard', (req, res) => {
  // Return high-performing sample and tracked smart money wallets
  const list = [
    {
      address: 'Cx32HntvCAZ7CAA9sdP5RHE8Y1NRPD4dMjp2Vu7RFB6h',
      alias: 'Alpha Sniper / Smart Whale',
      winRate: 72.2,
      totalPnlSol: 38.45,
      tradesCount: 42,
      profitFactor: 3.42,
      avgHoldTime: '7m 0s',
      smartScore: 88,
      archetype: 'Smart Money Whale',
      primaryBadge: { label: 'Smart Money', color: 'emerald' },
      isVerified: true
    },
    {
      address: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Pump',
      alias: 'Fast Sniper Bot (Sub-10s)',
      winRate: 75.0,
      totalPnlSol: 22.15,
      tradesCount: 128,
      profitFactor: 2.85,
      avgHoldTime: '45s',
      smartScore: 82,
      archetype: 'Sniper Bot',
      primaryBadge: { label: 'Sub-10s Sniper', color: 'cyan' },
      isVerified: true
    },
    {
      address: 'AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51',
      alias: 'Meme Runner / Swing Whale',
      winRate: 64.5,
      totalPnlSol: 19.80,
      tradesCount: 31,
      profitFactor: 2.45,
      avgHoldTime: '45m 12s',
      smartScore: 78,
      archetype: 'Swing Whale',
      primaryBadge: { label: 'Diamond Hands', color: 'indigo' },
      isVerified: false
    },
    {
      address: '8EskVqiSKZvWoasMtUjUxc5j6SohjwEpCouArSjuhvND',
      alias: 'GMGN Quick Scalper',
      winRate: 68.2,
      totalPnlSol: 14.30,
      tradesCount: 88,
      profitFactor: 2.10,
      avgHoldTime: '2m 15s',
      smartScore: 74,
      archetype: 'Bot Scalper',
      primaryBadge: { label: 'GMGN Router', color: 'purple' },
      isVerified: false
    },
    {
      address: '8Ww2nL7zX4qM9kP1vB6rT3yS5jH8dF2gA4cV1eN7pump',
      alias: 'Serial Rugger / Dev Dumper ⚠️',
      winRate: 85.7,
      totalPnlSol: 18.90,
      tradesCount: 35,
      profitFactor: 8.50,
      avgHoldTime: '25s',
      smartScore: 15,
      archetype: 'Dev Dumper',
      primaryBadge: { label: 'Serial Rugger ⚠️', color: 'red' },
      isVerified: false
    }
  ];

  res.json(list);
});

// 9. Custom RPC settings
app.get('/api/settings/rpc', async (req, res) => {
  const activeRpc = solanaRpc.getActiveRpc();
  const startTime = Date.now();
  let latencyMs = -1;
  let status = 'disconnected';

  try {
    await solanaRpc.callRpc('getSlot', [], { timeoutMs: 5000 });
    latencyMs = Date.now() - startTime;
    status = 'connected';
  } catch (err) {
    status = 'error: ' + err.message;
  }

  res.json({
    activeRpc,
    isCustom: !!solanaRpc.customRpc,
    latencyMs,
    status
  });
});

app.post('/api/settings/rpc', async (req, res) => {
  const { rpcUrl } = req.body;
  if (!rpcUrl) {
    solanaRpc.setCustomRpc(null);
    return res.json({ success: true, message: 'Reset to default RPC pool', activeRpc: solanaRpc.getActiveRpc() });
  }

  const success = solanaRpc.setCustomRpc(rpcUrl);
  if (!success) {
    return res.status(400).json({ success: false, error: 'Invalid RPC URL format (must begin with http:// or https://)' });
  }

  // Test connection
  try {
    const start = Date.now();
    await solanaRpc.callRpc('getSlot', [], { timeoutMs: 6000 });
    const latency = Date.now() - start;
    res.json({ success: true, activeRpc: solanaRpc.getActiveRpc(), latencyMs: latency });
  } catch (err) {
    res.json({ success: true, warning: 'Custom RPC set, but ping test failed: ' + err.message, activeRpc: solanaRpc.getActiveRpc() });
  }
});

// Serve static frontend files in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('API Server running. Start Vite dev server for frontend UI.');
    }
  });
});

const PORT = CONFIG.port;
app.listen(PORT, () => {
  console.log(`🚀 Pump.fun Wallet Screener API running on http://localhost:${PORT}`);
});
