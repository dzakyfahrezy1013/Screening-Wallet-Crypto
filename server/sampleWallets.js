// Curated sample pump.fun wallet profiles representing distinct trader archetypes

export const SAMPLE_WALLETS = {
  // 1. Smart Money Whale
  'Cx32HntvCAZ7CAA9sdP5RHE8Y1NRPD4dMjp2Vu7RFB6h': {
    address: 'Cx32HntvCAZ7CAA9sdP5RHE8Y1NRPD4dMjp2Vu7RFB6h',
    alias: 'Alpha Sniper / Smart Whale',
    solBalance: 24.85,
    summary: {
      totalTrades: 42,
      uniqueTokensTraded: 18,
      profitableTrades: 13,
      unprofitableTrades: 5,
      winRate: 72.2,
      totalRealizedPnlSol: 38.45,
      totalRealizedPnlUsd: 6152.00,
      totalUnrealizedPnlSol: 4.20,
      totalUnrealizedPnlUsd: 672.00,
      totalVolumeSol: 114.6,
      profitFactor: 3.42,
      avgHoldDurationSec: 420,
      avgTradeSizeSol: 1.85,
      smartScore: 88,
      safetyLevel: 'HIGH_CONVICTION',
      tokensCreated: 0,
      rugPullsDetected: 0
    },
    badges: [
      { id: 'smart_money', label: 'Smart Money', color: 'emerald', icon: 'Zap', desc: 'Win rate > 70% & profit factor > 3.0' },
      { id: 'sniper', label: 'Early Sniper', color: 'cyan', icon: 'Crosshair', desc: 'Frequently buys within initial bonding curve' },
      { id: 'bot_user', label: 'GMGN Router', color: 'purple', icon: 'Cpu', desc: 'Executes trades via automated routing' },
      { id: 'whale', label: 'Whale (>100 SOL Vol)', color: 'amber', icon: 'Fish', desc: 'High cumulative trading volume' }
    ],
    biggestWin: {
      symbol: 'Mochi',
      name: '모찌',
      mint: '4k3TtpGbX6avD5YdLFFLLuedWUnRTVATKkSR7BGipump',
      pnlSol: 12.4,
      roiPercent: 840.5
    },
    biggestLoss: {
      symbol: 'PEPE2',
      name: 'Pepe Fun',
      mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      pnlSol: -1.2,
      roiPercent: -65.0
    },
    tokensTraded: [
      {
        mint: '4k3TtpGbX6avD5YdLFFLLuedWUnRTVATKkSR7BGipump',
        name: '모찌 (Mochi)',
        symbol: 'Mochi',
        totalBoughtSol: 1.45,
        totalSoldSol: 13.85,
        pnlSol: 12.40,
        roiPercent: 855.1,
        holdDurationSec: 240,
        status: 'Sold Out',
        remainingTokens: 0,
        unrealizedPnlSol: 0,
        firstBuyAgo: '2h ago',
        lastTradeAgo: '1h ago',
        isSniper: true,
        icon: 'https://cdn.dexscreener.com/cms/images/9SNCI87g6RsQN8Q4?width=64&height=64&fit=crop&quality=95&format=auto'
      },
      {
        mint: '9V2rU978cfrWo3igcmq7EpAH9NmZG1GVwNeNKbjgjupx',
        name: 'Dave to Jupiter',
        symbol: 'DAVE',
        totalBoughtSol: 2.10,
        totalSoldSol: 9.80,
        pnlSol: 7.70,
        roiPercent: 366.6,
        holdDurationSec: 680,
        status: 'Holding Partial',
        remainingTokens: 450000,
        unrealizedPnlSol: 1.85,
        firstBuyAgo: '5h ago',
        lastTradeAgo: '3h ago',
        isSniper: true,
        icon: 'https://cdn.dexscreener.com/cms/images/YoxR1iy6MV2Um1Sc?width=64&height=64&fit=crop&quality=95&format=auto'
      },
      {
        mint: '4MJRUwJD6kS55P1fDRaFLj4PXXc8eJu5R4LXdViCMj6N',
        name: 'Solana Doge',
        symbol: 'SDOGE',
        totalBoughtSol: 0.85,
        totalSoldSol: 4.90,
        pnlSol: 4.05,
        roiPercent: 476.4,
        holdDurationSec: 180,
        status: 'Sold Out',
        remainingTokens: 0,
        unrealizedPnlSol: 0,
        firstBuyAgo: '8h ago',
        lastTradeAgo: '7h ago',
        isSniper: true,
        icon: 'https://cdn.dexscreener.com/cms/images/-pteCFxMGIyc7l75?width=64&height=64&fit=crop&quality=95&format=auto'
      },
      {
        mint: '5r3q2K8eG5Fm8tB9wY1vA7xL4nP6sQ8zX9kC2vB3mN4pump',
        name: 'Pump King',
        symbol: 'KING',
        totalBoughtSol: 1.50,
        totalSoldSol: 5.60,
        pnlSol: 4.10,
        roiPercent: 273.3,
        holdDurationSec: 520,
        status: 'Sold Out',
        remainingTokens: 0,
        unrealizedPnlSol: 0,
        firstBuyAgo: '12h ago',
        lastTradeAgo: '11h ago',
        isSniper: false,
        icon: null
      },
      {
        mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        name: 'Pepe Fun',
        symbol: 'PEPE2',
        totalBoughtSol: 1.85,
        totalSoldSol: 0.65,
        pnlSol: -1.20,
        roiPercent: -64.8,
        holdDurationSec: 90,
        status: 'Sold Out',
        remainingTokens: 0,
        unrealizedPnlSol: 0,
        firstBuyAgo: '14h ago',
        lastTradeAgo: '14h ago',
        isSniper: false,
        icon: null
      }
    ],
    recentTransactions: [
      {
        signature: '2JAC69Md3Pyu8kaWuLquswZTzZPg54sXQUG7cXGQXrejhPsmpGErx9XDyEv4rK1gWvMmtpDaGtPsaHMU9zsruvDn',
        action: 'sell',
        tokenSymbol: 'Mochi',
        solAmount: 0.103,
        timeAgo: '10m ago',
        router: 'GMGN Router',
        pnlSol: 0.092
      },
      {
        signature: '3mSpSg6ycP6x6DfzJzppq11K6gFdTuxykkMUKqoV4HefdNRHHNC88EHUAyHKAtVENT9kQpaAWp4Ca3dFUo2BQYbY',
        action: 'buy',
        tokenSymbol: 'Mochi',
        solAmount: 0.0089,
        timeAgo: '11m ago',
        router: 'GMGN Router',
        pnlSol: null
      }
    ]
  },

  // 2. High Frequency Sniper Bot
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Pump': {
    address: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Pump',
    alias: 'Fast Sniper Bot (Sub-10s)',
    solBalance: 12.30,
    summary: {
      totalTrades: 128,
      uniqueTokensTraded: 64,
      profitableTrades: 48,
      unprofitableTrades: 16,
      winRate: 75.0,
      totalRealizedPnlSol: 22.15,
      totalRealizedPnlUsd: 3544.00,
      totalUnrealizedPnlSol: 0.50,
      totalUnrealizedPnlUsd: 80.00,
      totalVolumeSol: 86.4,
      profitFactor: 2.85,
      avgHoldDurationSec: 45,
      avgTradeSizeSol: 0.45,
      smartScore: 82,
      safetyLevel: 'HIGH_RISK_BOT',
      tokensCreated: 0,
      rugPullsDetected: 0
    },
    badges: [
      { id: 'sniper', label: 'Sub-10s Sniper', color: 'cyan', icon: 'Crosshair', desc: 'Buys in first block of pump.fun mint' },
      { id: 'scalper', label: 'Flash Scalper', color: 'blue', icon: 'Zap', desc: 'Average hold duration < 45 seconds' },
      { id: 'bot_user', label: 'Algorithmic Bot', color: 'purple', icon: 'Cpu', desc: 'Over 100 automated executions' }
    ],
    biggestWin: {
      symbol: 'CAT',
      name: 'Solana Cat',
      mint: 'CATXyZ11111111111111111111111111111111pump',
      pnlSol: 5.8,
      roiPercent: 1200.0
    },
    biggestLoss: {
      symbol: 'RUGME',
      name: 'Rug Me Bro',
      mint: 'RUGXyZ11111111111111111111111111111111pump',
      pnlSol: -0.45,
      roiPercent: -95.0
    },
    tokensTraded: [
      {
        mint: 'CATXyZ11111111111111111111111111111111pump',
        name: 'Solana Cat',
        symbol: 'CAT',
        totalBoughtSol: 0.48,
        totalSoldSol: 6.28,
        pnlSol: 5.80,
        roiPercent: 1208.3,
        holdDurationSec: 32,
        status: 'Sold Out',
        remainingTokens: 0,
        unrealizedPnlSol: 0,
        firstBuyAgo: '30m ago',
        lastTradeAgo: '29m ago',
        isSniper: true,
        icon: null
      }
    ],
    recentTransactions: []
  },

  // 3. Serial Rugger / Dev Dumper
  '8Ww2nL7zX4qM9kP1vB6rT3yS5jH8dF2gA4cV1eN7pump': {
    address: '8Ww2nL7zX4qM9kP1vB6rT3yS5jH8dF2gA4cV1eN7pump',
    alias: 'Serial Rugger / Dev Dumper ⚠️',
    solBalance: 3.12,
    summary: {
      totalTrades: 35,
      uniqueTokensTraded: 14,
      profitableTrades: 12,
      unprofitableTrades: 2,
      winRate: 85.7,
      totalRealizedPnlSol: 18.90,
      totalRealizedPnlUsd: 3024.00,
      totalUnrealizedPnlSol: 0,
      totalUnrealizedPnlUsd: 0,
      totalVolumeSol: 24.2,
      profitFactor: 8.5,
      avgHoldDurationSec: 25,
      avgTradeSizeSol: 0.20,
      smartScore: 15,
      safetyLevel: 'DANGER_SERIAL_RUGGER',
      tokensCreated: 8,
      rugPullsDetected: 7
    },
    badges: [
      { id: 'serial_rugger', label: 'Serial Rugger', color: 'red', icon: 'AlertTriangle', desc: 'Created 8 tokens and dumped developer supply' },
      { id: 'dev_dumper', label: 'Dev Dumper', color: 'rose', icon: 'Flame', desc: 'Dumps 90%+ within 60s of launch' },
      { id: 'avoid', label: 'DO NOT COPYTRADE', color: 'red', icon: 'ShieldAlert', desc: 'Extreme risk of insider extraction' }
    ],
    biggestWin: {
      symbol: 'FAKEPEPE',
      name: 'Pepe 2.0 Official',
      mint: 'FAKE11111111111111111111111111111111pump',
      pnlSol: 6.4,
      roiPercent: 3200.0
    },
    biggestLoss: {
      symbol: 'BONK3',
      name: 'Bonk 3',
      mint: 'BONK11111111111111111111111111111111pump',
      pnlSol: -0.15,
      roiPercent: -75.0
    },
    tokensTraded: [
      {
        mint: 'FAKE11111111111111111111111111111111pump',
        name: 'Pepe 2.0 Official (Dev Dumped)',
        symbol: 'FAKEPEPE',
        totalBoughtSol: 0.20,
        totalSoldSol: 6.60,
        pnlSol: 6.40,
        roiPercent: 3200.0,
        holdDurationSec: 42,
        status: 'Dumped Dev Allocation',
        remainingTokens: 0,
        unrealizedPnlSol: 0,
        firstBuyAgo: '1h ago',
        lastTradeAgo: '1h ago',
        isSniper: true,
        icon: null
      }
    ],
    recentTransactions: []
  },

  // 4. Degenerate Gambler (Negative PnL / Low Win Rate)
  '3K9vB7xM1qP4nL8rT2yS6jH9dF3gA5cV2eN8wX4pump': {
    address: '3K9vB7xM1qP4nL8rT2yS6jH9dF3gA5cV2eN8wX4pump',
    alias: 'FOMO Gambler (Exit Liquidity)',
    solBalance: 0.85,
    summary: {
      totalTrades: 54,
      uniqueTokensTraded: 26,
      profitableTrades: 6,
      unprofitableTrades: 20,
      winRate: 23.0,
      totalRealizedPnlSol: -16.40,
      totalRealizedPnlUsd: -2624.00,
      totalUnrealizedPnlSol: -2.10,
      totalUnrealizedPnlUsd: -336.00,
      totalVolumeSol: 45.8,
      profitFactor: 0.35,
      avgHoldDurationSec: 1800,
      avgTradeSizeSol: 0.85,
      smartScore: 28,
      safetyLevel: 'UNPROFITABLE_GAMBLER',
      tokensCreated: 0,
      rugPullsDetected: 0
    },
    badges: [
      { id: 'fomo_buyer', label: 'FOMO Top Buyer', color: 'orange', icon: 'TrendingUp', desc: 'Regularly buys at top of bonding curve' },
      { id: 'bagholder', label: 'Bagholder', color: 'yellow', icon: 'Package', desc: 'Holds depreciating tokens > 30 minutes' },
      { id: 'negative_pnl', label: '-16.4 SOL PnL', color: 'red', icon: 'TrendingDown', desc: 'Low win rate (23%) and consistent drawdown' }
    ],
    biggestWin: {
      symbol: 'LUCKY',
      name: 'Lucky Moon',
      mint: 'LUCK11111111111111111111111111111111pump',
      pnlSol: 1.2,
      roiPercent: 140.0
    },
    biggestLoss: {
      symbol: 'SHIB2',
      name: 'Shiba Solana',
      mint: 'SHIB11111111111111111111111111111111pump',
      pnlSol: -4.5,
      roiPercent: -92.0
    },
    tokensTraded: [],
    recentTransactions: []
  }
};
