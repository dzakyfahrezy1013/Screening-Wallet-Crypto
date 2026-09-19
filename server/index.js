import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';
import { solanaRpc } from './solanaRpc.js';
import { dexScreener } from './dexscreener.js';
import { screenWallet } from './screener.js';
import { parseTransaction } from './parser.js';
import {
  cacheWalletProfile,
  getCachedWalletProfile,
  getLiveWalletCandidates,
  getLiveWalletStats,
  registerLiveWallet
} from './liveWallets.js';

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
        if (data.txType === 'create' && data.mint) {
          const item = {
            mint: data.mint,
            name: data.name || 'Unknown',
            symbol: data.symbol || 'PUMP',
            traderPublicKey: data.traderPublicKey || null,
            solAmount: data.solAmount ?? null,
            marketCapSol: data.marketCapSol ?? null,
            timestamp: Date.now(),
            timeAgo: 'Just now'
          };
          if (item.traderPublicKey) {
            registerLiveWallet(item.traderPublicKey, 'pumpportal-create', {
              lastMint: item.mint,
              lastMintAt: item.timestamp
            });
          }
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

function formatDuration(seconds = 0) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function redactRpcUrl(url) {
  try {
    const parsed = new URL(url);
    for (const key of ['api-key', 'api_key', 'apikey', 'apiKey', 'key', 'token']) {
      if (parsed.searchParams.has(key)) parsed.searchParams.set(key, '••••••••');
    }
    return parsed.toString();
  } catch {
    return 'Custom RPC';
  }
}

// 1. Health check & basic stats
app.get('/api/health', async (req, res) => {
  try {
    const solPriceUsd = await dexScreener.getSolPriceUsd();
    res.json({
      status: 'ok',
      version: '1.0.0',
      activeRpc: redactRpcUrl(solanaRpc.getActiveRpc()),
      customRpcSet: !!solanaRpc.customRpc,
      solPriceUsd,
      wsConnected,
      liveTokensCount: liveTokensBuffer.length,
      ...getLiveWalletStats(),
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// 2. Real-time SOL price
app.get('/api/sol-price', async (req, res) => {
  try {
    res.json({ solPriceUsd: await dexScreener.getSolPriceUsd() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 3. Screen a specific wallet from Solana Mainnet RPC
app.get('/api/wallet/:address', async (req, res) => {
  const { address } = req.params;
  const limit = parseInt(req.query.limit || '40', 10);

  try {
    const result = await screenWallet(address, {
      limit: Math.min(100, Math.max(10, limit))
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

// 4. Trending Pump.fun tokens from DexScreener
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
      if (!parsed || !parsed.hasPumpFun || !parsed.userWallet || !['buy', 'sell'].includes(parsed.action)) continue;

      const wallet = parsed.userWallet;
      registerLiveWallet(wallet, 'token-trader', {
        lastToken: mint,
        lastTradeAt: parsed.timestamp
      });

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

// 8. Live Wallet Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  const limit = Math.min(12, Math.max(1, parseInt(req.query.limit || '8', 10)));
  const candidates = getLiveWalletCandidates(limit);
  const list = [];

  for (const candidate of candidates) {
    try {
      let profile = getCachedWalletProfile(candidate.address);
      if (!profile) {
        profile = await screenWallet(candidate.address, { limit: 30 });
        cacheWalletProfile(candidate.address, profile);
      }

      if (!profile.summary || profile.summary.totalTrades === 0) continue;

      const primaryBadge = profile.badges?.[0] || {
        label: 'Observed Trader',
        color: 'slate'
      };

      list.push({
        address: profile.address,
        alias: `Live ${profile.address.slice(0, 4)}...${profile.address.slice(-4)}`,
        winRate: profile.summary.winRate,
        totalPnlSol: profile.summary.totalRealizedPnlSol,
        tradesCount: profile.summary.totalTrades,
        profitFactor: profile.summary.profitFactor,
        avgHoldTime: formatDuration(profile.summary.avgHoldDurationSec),
        smartScore: profile.summary.smartScore,
        archetype: profile.summary.safetyLevel,
        primaryBadge,
        source: candidate.source,
        lastSeenAt: candidate.lastSeenAt
      });
    } catch (err) {
      console.warn(`Unable to rank live wallet ${candidate.address}:`, err.message);
    }
  }

  list.sort((a, b) => b.smartScore - a.smartScore || b.totalPnlSol - a.totalPnlSol);
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
    activeRpc: redactRpcUrl(activeRpc),
    isCustom: !!solanaRpc.customRpc,
    latencyMs,
    status
  });
});

app.post('/api/settings/rpc', async (req, res) => {
  const { rpcUrl } = req.body;
  if (!rpcUrl) {
    solanaRpc.setCustomRpc(null);
    return res.json({
      success: true,
      message: 'Reset to default RPC pool',
      activeRpc: redactRpcUrl(solanaRpc.getActiveRpc())
    });
  }

  const previousRpc = solanaRpc.customRpc;
  if (!solanaRpc.setCustomRpc(rpcUrl)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid RPC URL format (must begin with http:// or https://)'
    });
  }

  try {
    const start = Date.now();
    await solanaRpc.callRpc('getSlot', [], { timeoutMs: 6000 });
    await solanaRpc.callRpc(
      'getSignaturesForAddress',
      ['11111111111111111111111111111111', { limit: 1 }],
      { timeoutMs: 6000, useCache: false }
    );
    const latency = Date.now() - start;
    return res.json({
      success: true,
      activeRpc: redactRpcUrl(solanaRpc.getActiveRpc()),
      latencyMs: latency
    });
  } catch (err) {
    solanaRpc.setCustomRpc(previousRpc);
    return res.status(502).json({
      success: false,
      error: `RPC connected check failed: ${err.message}`,
      activeRpc: redactRpcUrl(solanaRpc.getActiveRpc())
    });
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
