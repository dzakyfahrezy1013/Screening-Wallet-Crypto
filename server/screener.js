import { solanaRpc } from './solanaRpc.js';
import { parseTransaction } from './parser.js';
import { dexScreener } from './dexscreener.js';
import { SAMPLE_WALLETS } from './sampleWallets.js';

export async function screenWallet(walletAddress, options = {}) {
  const { limit = 60, useSampleIfAvailable = true } = options;

  if (!walletAddress || typeof walletAddress !== 'string') {
    throw new Error('Invalid wallet address');
  }

  const cleanAddress = walletAddress.trim();

  // Check if requested address is one of the curated sample wallets
  if (useSampleIfAvailable && SAMPLE_WALLETS[cleanAddress]) {
    const sample = JSON.parse(JSON.stringify(SAMPLE_WALLETS[cleanAddress]));
    const solPriceUsd = await dexScreener.getSolPriceUsd();
    sample.solPriceUsd = solPriceUsd;
    sample.summary.totalRealizedPnlUsd = sample.summary.totalRealizedPnlSol * solPriceUsd;
    sample.summary.totalUnrealizedPnlUsd = sample.summary.totalUnrealizedPnlSol * solPriceUsd;
    sample.isSample = true;
    return sample;
  }

  // Basic validation of Solana base58 address
  if (cleanAddress.length < 32 || cleanAddress.length > 44) {
    throw new Error('Invalid Solana wallet address length (must be 32-44 characters)');
  }

  const solPriceUsd = await dexScreener.getSolPriceUsd();

  let solBalance = 0;
  let signatures = [];
  try {
    const [bal, sigs] = await Promise.all([
      solanaRpc.getAccountBalance(cleanAddress).catch(() => 0),
      solanaRpc.getSignaturesForAddress(cleanAddress, limit).catch(() => [])
    ]);
    solBalance = bal;
    signatures = sigs || [];
  } catch (err) {
    console.warn(`RPC fetch error for ${cleanAddress}:`, err.message);
  }

  if (signatures.length === 0) {
    // Return empty or new wallet state
    return {
      address: cleanAddress,
      alias: 'New or Inactive Wallet',
      solBalance,
      solPriceUsd,
      isSample: false,
      summary: {
        totalTrades: 0,
        uniqueTokensTraded: 0,
        profitableTrades: 0,
        unprofitableTrades: 0,
        winRate: 0,
        totalRealizedPnlSol: 0,
        totalRealizedPnlUsd: 0,
        totalUnrealizedPnlSol: 0,
        totalUnrealizedPnlUsd: 0,
        totalVolumeSol: 0,
        profitFactor: 0,
        avgHoldDurationSec: 0,
        avgTradeSizeSol: 0,
        smartScore: 50,
        safetyLevel: 'NEUTRAL_NO_HISTORY',
        tokensCreated: 0,
        rugPullsDetected: 0
      },
      badges: [
        { id: 'fresh', label: 'Fresh Wallet', color: 'gray', icon: 'Sparkles', desc: 'No recent pump.fun transactions found' }
      ],
      tokensTraded: [],
      recentTransactions: []
    };
  }

  // Fetch parsed transactions
  const validSignatures = signatures.map(s => s.signature).filter(Boolean);
  const rawTransactions = await solanaRpc.getMultipleTransactions(validSignatures, 6);

  // Parse transactions with our pump.fun parser
  const parsedTxs = rawTransactions
    .map(tx => parseTransaction(tx, cleanAddress))
    .filter(Boolean)
    .sort((a, b) => b.blockTime - a.blockTime);

  // Group by token mint
  const tokenMap = new Map();
  let tokensCreated = 0;
  let rugPullsDetected = 0;
  let gmgnCount = 0;
  let totalBuySol = 0;
  let totalSellSol = 0;
  let totalVolumeSol = 0;

  for (const tx of parsedTxs) {
    if (tx.routerUsed) gmgnCount++;
    if (tx.action === 'create') tokensCreated++;

    const mint = tx.mint;
    if (!mint) continue;

    if (!tokenMap.has(mint)) {
      tokenMap.set(mint, {
        mint,
        buys: [],
        sells: [],
        creates: [],
        totalBoughtSol: 0,
        totalSoldSol: 0,
        totalBoughtTokens: 0,
        totalSoldTokens: 0,
        firstBuyTime: null,
        lastSellTime: null,
        firstSlot: tx.slot,
        routerUsed: tx.routerUsed
      });
    }

    const entry = tokenMap.get(mint);

    if (tx.action === 'buy') {
      entry.buys.push(tx);
      entry.totalBoughtSol += tx.solAmount;
      entry.totalBoughtTokens += tx.tokenAmount;
      totalBuySol += tx.solAmount;
      totalVolumeSol += tx.solAmount;
      if (!entry.firstBuyTime || tx.blockTime < entry.firstBuyTime) {
        entry.firstBuyTime = tx.blockTime;
      }
    } else if (tx.action === 'sell') {
      entry.sells.push(tx);
      entry.totalSoldSol += tx.solAmount;
      entry.totalSoldTokens += tx.tokenAmount;
      totalSellSol += tx.solAmount;
      totalVolumeSol += tx.solAmount;
      if (!entry.lastSellTime || tx.blockTime > entry.lastSellTime) {
        entry.lastSellTime = tx.blockTime;
      }
    } else if (tx.action === 'create') {
      entry.creates.push(tx);
    }
  }

  // Fetch token metadata from DexScreener for all unique mints
  const mintList = Array.from(tokenMap.keys());
  const tokenDataMap = await dexScreener.getMultipleTokenData(mintList);

  // Analyze each token performance
  let profitableTrades = 0;
  let unprofitableTrades = 0;
  let grossProfitsSol = 0;
  let grossLossesSol = 0;
  let totalRealizedPnlSol = 0;
  let totalUnrealizedPnlSol = 0;
  let totalHoldDurationSec = 0;
  let completedTradesCount = 0;
  let sniperBuysCount = 0;

  const analyzedTokens = [];

  for (const [mint, data] of tokenMap.entries()) {
    const meta = tokenDataMap[mint] || {};
    const realizedPnlSol = data.totalSoldSol > 0 ? (data.totalSoldSol - data.totalBoughtSol) : 0;
    const remainingTokens = Math.max(0, data.totalBoughtTokens - data.totalSoldTokens);

    // Unrealized PnL based on current DexScreener price
    let unrealizedPnlSol = 0;
    if (remainingTokens > 0 && meta.priceNative) {
      const currentValSol = remainingTokens * meta.priceNative;
      // Remaining cost basis
      const avgCostPerToken = data.totalBoughtTokens > 0 ? data.totalBoughtSol / data.totalBoughtTokens : 0;
      unrealizedPnlSol = currentValSol - (remainingTokens * avgCostPerToken);
      totalUnrealizedPnlSol += unrealizedPnlSol;
    }

    const netPnlSol = realizedPnlSol + (remainingTokens > 0 ? unrealizedPnlSol : 0);
    const roiPercent = data.totalBoughtSol > 0 ? (netPnlSol / data.totalBoughtSol) * 100 : 0;

    // Holding duration
    let holdDurationSec = 0;
    if (data.firstBuyTime) {
      const endTime = data.lastSellTime || Math.floor(Date.now() / 1000);
      holdDurationSec = Math.max(0, endTime - data.firstBuyTime);
      totalHoldDurationSec += holdDurationSec;
      completedTradesCount++;
    }

    // Sniper detection: hold duration < 60s or very fast buy after mint
    const isSniper = holdDurationSec > 0 && holdDurationSec < 90 && data.buys.length > 0;
    if (isSniper) sniperBuysCount++;

    // Dev rug detection: created token & sold out > 80% within 180s
    if (data.creates.length > 0 && data.sells.length > 0 && holdDurationSec < 180) {
      rugPullsDetected++;
    }

    if (realizedPnlSol > 0) {
      profitableTrades++;
      grossProfitsSol += realizedPnlSol;
    } else if (realizedPnlSol < 0 || (data.totalBoughtSol > 0 && data.totalSoldSol === 0 && remainingTokens === 0)) {
      unprofitableTrades++;
      grossLossesSol += Math.abs(realizedPnlSol);
    }

    totalRealizedPnlSol += realizedPnlSol;

    analyzedTokens.push({
      mint,
      name: meta.name || (mint.slice(0, 4) + '...' + mint.slice(-4)),
      symbol: meta.symbol || 'PUMP',
      totalBoughtSol: parseFloat(data.totalBoughtSol.toFixed(4)),
      totalSoldSol: parseFloat(data.totalSoldSol.toFixed(4)),
      pnlSol: parseFloat(netPnlSol.toFixed(4)),
      roiPercent: parseFloat(roiPercent.toFixed(1)),
      holdDurationSec,
      status: remainingTokens === 0 ? 'Sold Out' : (data.totalSoldSol > 0 ? 'Holding Partial' : 'Holding 100%'),
      remainingTokens,
      unrealizedPnlSol: parseFloat(unrealizedPnlSol.toFixed(4)),
      firstBuyAgo: data.firstBuyTime ? formatTimeAgo(data.firstBuyTime) : null,
      lastTradeAgo: data.lastSellTime ? formatTimeAgo(data.lastSellTime) : (data.firstBuyTime ? formatTimeAgo(data.firstBuyTime) : null),
      isSniper,
      icon: meta.icon || null
    });
  }

  // Sort tokens by absolute PnL or most recent
  analyzedTokens.sort((a, b) => b.pnlSol - a.pnlSol);

  const totalClosedTrades = profitableTrades + unprofitableTrades;
  const winRate = totalClosedTrades > 0 ? (profitableTrades / totalClosedTrades) * 100 : 0;
  const profitFactor = grossLossesSol > 0 ? grossProfitsSol / grossLossesSol : (grossProfitsSol > 0 ? 10 : 0);
  const avgHoldDurationSec = completedTradesCount > 0 ? Math.round(totalHoldDurationSec / completedTradesCount) : 0;
  const avgTradeSizeSol = totalBuySol > 0 && parsedTxs.length > 0 ? totalBuySol / parsedTxs.filter(t => t.action === 'buy').length : 0;

  // Biggest winner & loser
  const biggestWin = analyzedTokens.find(t => t.pnlSol > 0) || null;
  const biggestLoss = [...analyzedTokens].sort((a, b) => a.pnlSol - b.pnlSol).find(t => t.pnlSol < 0) || null;

  // Smart score calculation (0 - 100)
  let smartScore = 50;
  if (winRate >= 70) smartScore += 20;
  else if (winRate >= 55) smartScore += 10;
  else if (winRate < 35 && totalClosedTrades >= 5) smartScore -= 20;

  if (totalRealizedPnlSol > 10) smartScore += 20;
  else if (totalRealizedPnlSol > 2) smartScore += 10;
  else if (totalRealizedPnlSol < -3) smartScore -= 15;

  if (profitFactor >= 2.5) smartScore += 10;
  if (rugPullsDetected > 0) smartScore = Math.min(25, smartScore - 40);
  smartScore = Math.max(5, Math.min(99, Math.round(smartScore)));

  // Badges & Archetype classification
  const badges = [];
  if (winRate >= 60 && totalRealizedPnlSol > 3 && profitFactor >= 1.8) {
    badges.push({ id: 'smart_money', label: 'Smart Money', color: 'emerald', icon: 'Zap', desc: `Win Rate ${winRate.toFixed(0)}% with positive +${totalRealizedPnlSol.toFixed(1)} SOL PnL` });
  }

  if (sniperBuysCount >= 2 || (completedTradesCount > 0 && sniperBuysCount / completedTradesCount > 0.35)) {
    badges.push({ id: 'sniper', label: 'Sniper Bot', color: 'cyan', icon: 'Crosshair', desc: 'Lightning fast entries within initial bonding curve' });
  }

  if (gmgnCount > 3) {
    badges.push({ id: 'bot_user', label: 'GMGN / Bot Router', color: 'purple', icon: 'Cpu', desc: 'Uses specialized automated trading bots' });
  }

  if (totalVolumeSol > 30 || avgTradeSizeSol > 2.5) {
    badges.push({ id: 'whale', label: 'Whale Trader', color: 'amber', icon: 'Fish', desc: `Heavy position size (${totalVolumeSol.toFixed(1)} SOL volume)` });
  }

  if (avgHoldDurationSec > 0 && avgHoldDurationSec < 180) {
    badges.push({ id: 'scalper', label: 'Fast Scalper', color: 'blue', icon: 'Zap', desc: `Average hold duration ${formatDuration(avgHoldDurationSec)}` });
  } else if (avgHoldDurationSec > 3600) {
    badges.push({ id: 'diamond', label: 'Diamond Hands', color: 'indigo', icon: 'Gem', desc: 'Holds tokens longer than 1 hour' });
  }

  if (tokensCreated > 0) {
    if (rugPullsDetected > 0) {
      badges.push({ id: 'serial_rugger', label: 'Dev Dumper ⚠️', color: 'red', icon: 'AlertTriangle', desc: `Created ${tokensCreated} tokens and dumped early` });
    } else {
      badges.push({ id: 'dev', label: 'Token Creator', color: 'orange', icon: 'Flame', desc: `Deployed ${tokensCreated} tokens on pump.fun` });
    }
  }

  if (totalRealizedPnlSol < -2 && winRate < 35 && totalClosedTrades >= 5) {
    badges.push({ id: 'degene', label: 'FOMO Trader ⚠️', color: 'rose', icon: 'TrendingDown', desc: 'Unfavorable risk-reward and negative win rate' });
  }

  if (badges.length === 0) {
    badges.push({ id: 'active', label: 'Active Trader', color: 'slate', icon: 'Activity', desc: 'Standard meme coin trader' });
  }

  // Safety level classification
  let safetyLevel = 'MODERATE';
  if (rugPullsDetected > 0) safetyLevel = 'DANGER_DEV_RUGGER';
  else if (smartScore >= 75) safetyLevel = 'HIGH_CONVICTION';
  else if (smartScore >= 55) safetyLevel = 'RELIABLE_TRADER';
  else if (smartScore < 35) safetyLevel = 'HIGH_RISK_LOSSES';

  // Format recent transactions for preview
  const recentTransactions = parsedTxs.slice(0, 15).map(t => {
    const meta = tokenDataMap[t.mint] || {};
    return {
      signature: t.signature,
      action: t.action,
      tokenSymbol: meta.symbol || (t.mint ? t.mint.slice(0, 4) + '...' + t.mint.slice(-4) : 'PUMP'),
      solAmount: parseFloat(t.solAmount.toFixed(4)),
      timeAgo: formatTimeAgo(t.blockTime),
      router: t.routerUsed,
      pnlSol: t.action === 'sell' ? parseFloat(t.solChange.toFixed(4)) : null
    };
  });

  return {
    address: cleanAddress,
    alias: badges[0]?.label ? `${badges[0].label} (${cleanAddress.slice(0, 4)}...${cleanAddress.slice(-4)})` : 'Solana Trader',
    solBalance: parseFloat(solBalance.toFixed(3)),
    solPriceUsd,
    isSample: false,
    summary: {
      totalTrades: parsedTxs.length,
      uniqueTokensTraded: tokenMap.size,
      profitableTrades,
      unprofitableTrades,
      winRate: parseFloat(winRate.toFixed(1)),
      totalRealizedPnlSol: parseFloat(totalRealizedPnlSol.toFixed(3)),
      totalRealizedPnlUsd: parseFloat((totalRealizedPnlSol * solPriceUsd).toFixed(2)),
      totalUnrealizedPnlSol: parseFloat(totalUnrealizedPnlSol.toFixed(3)),
      totalUnrealizedPnlUsd: parseFloat((totalUnrealizedPnlSol * solPriceUsd).toFixed(2)),
      totalVolumeSol: parseFloat(totalVolumeSol.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      avgHoldDurationSec,
      avgTradeSizeSol: parseFloat(avgTradeSizeSol.toFixed(3)),
      smartScore,
      safetyLevel,
      tokensCreated,
      rugPullsDetected
    },
    badges,
    biggestWin,
    biggestLoss,
    tokensTraded: analyzedTokens,
    recentTransactions
  };
}

function formatTimeAgo(timestampSeconds) {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - timestampSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
