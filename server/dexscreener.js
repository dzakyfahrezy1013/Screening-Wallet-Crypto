// DexScreener API integration for Pump.fun token data & prices

class DexScreenerService {
  constructor() {
    this.cache = new Map();
    this.cacheTtlMs = 45 * 1000; // 45 seconds cache
    this.solPriceUsd = 160; // fallback default
    this.lastSolPriceFetch = 0;
  }

  async getSolPriceUsd() {
    if (Date.now() - this.lastSolPriceFetch < 60000 && this.solPriceUsd > 0) {
      return this.solPriceUsd;
    }

    try {
      // Fetch SOL/USDC pair from DexScreener
      const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');
      if (res.ok) {
        const data = await res.json();
        const usdcPair = data.pairs?.find(p =>
          p.quoteToken?.symbol === 'USDC' || p.quoteToken?.symbol === 'USDT'
        );
        if (usdcPair?.priceUsd) {
          this.solPriceUsd = parseFloat(usdcPair.priceUsd);
          this.lastSolPriceFetch = Date.now();
          return this.solPriceUsd;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch SOL price from DexScreener, using fallback:', err.message);
    }

    return this.solPriceUsd;
  }

  async getTokenData(mint) {
    if (!mint) return null;
    const cacheKey = `token:${mint}`;
    if (this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey);
      if (Date.now() - entry.time < this.cacheTtlMs) {
        return entry.data;
      }
    }

    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
      if (!res.ok) return null;
      const data = await res.json();

      if (!data.pairs || data.pairs.length === 0) {
        return null;
      }

      // Find pumpfun or primary raydium pair
      const pumpPair = data.pairs.find(p => p.dexId === 'pumpfun') || data.pairs[0];

      const formatted = {
        mint,
        name: pumpPair.baseToken?.name || 'Unknown Token',
        symbol: pumpPair.baseToken?.symbol || 'UNKNOWN',
        priceUsd: parseFloat(pumpPair.priceUsd || '0'),
        priceNative: parseFloat(pumpPair.priceNative || '0'), // price in SOL
        volume24h: pumpPair.volume?.h24 || 0,
        fdv: pumpPair.fdv || 0,
        pairAddress: pumpPair.pairAddress,
        dexId: pumpPair.dexId,
        url: pumpPair.url,
        icon: pumpPair.info?.imageUrl || null,
        txns24h: (pumpPair.txns?.h24?.buys || 0) + (pumpPair.txns?.h24?.sells || 0)
      };

      this.cache.set(cacheKey, { time: Date.now(), data: formatted });
      return formatted;
    } catch (err) {
      console.warn(`DexScreener fetch error for ${mint}:`, err.message);
      return null;
    }
  }

  async getMultipleTokenData(mints) {
    const uniqueMints = [...new Set(mints.filter(Boolean))].slice(0, 30);
    const results = {};
    const promises = uniqueMints.map(async (mint) => {
      const data = await this.getTokenData(mint);
      if (data) {
        results[mint] = data;
      }
    });
    await Promise.all(promises);
    return results;
  }

  async getTrendingPumpTokens(limit = 20) {
    try {
      // DexScreener's pumpfun search returns current Pump.fun and PumpSwap pairs.
      const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=pumpfun');
      if (!res.ok) return [];
      const data = await res.json();

      const pairs = (data.pairs || [])
        .filter(p =>
          p.chainId === 'solana'
          && ['pumpfun', 'pumpswap'].includes(p.dexId)
        )
        .slice(0, limit)
        .map(p => ({
          mint: p.baseToken.address,
          name: p.baseToken.name,
          symbol: p.baseToken.symbol,
          priceUsd: parseFloat(p.priceUsd || '0'),
          priceNative: parseFloat(p.priceNative || '0'),
          fdv: p.fdv || 0,
          volume24h: p.volume?.h24 || 0,
          volume1h: p.volume?.h1 || 0,
          priceChange24h: p.priceChange?.h24 || 0,
          priceChange1h: p.priceChange?.h1 || 0,
          txns24h: p.txns?.h24 || { buys: 0, sells: 0 },
          dexId: p.dexId,
          pairAddress: p.pairAddress,
          url: p.url
        }));

      return pairs;
    } catch (err) {
      console.warn('Failed to fetch trending pump tokens:', err.message);
      return [];
    }
  }
}

export const dexScreener = new DexScreenerService();
