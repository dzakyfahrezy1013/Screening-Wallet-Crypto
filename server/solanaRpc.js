import { CONFIG, DEFAULT_RPCS } from './config.js';

const DEFAULT_PUBLIC_RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana.drpc.org',
  'https://rpc.ankr.com/solana',
  'https://solana-mainnet.rpc.extrnode.com'
];

class SolanaRpcClient {
  constructor() {
    this.rpcPool = [...DEFAULT_PUBLIC_RPCS];
    this.currentRpcIndex = 0;
    this.customRpc = null;
    this.cache = new Map();
    this.stats = {
      requests: 0,
      errors: 0,
      cacheHits: 0
    };
  }
  setCustomRpc(url) {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      this.customRpc = url.trim();
      return true;
    }
    this.customRpc = null;
    return false;
  }

  getActiveRpc() {
    return this.customRpc || this.rpcPool[this.currentRpcIndex] || DEFAULT_RPCS[0];
  }

  switchNextRpc() {
    if (this.customRpc) return; // don't cycle if user explicitly set custom RPC
    this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcPool.length;
  }

  async callRpc(method, params, options = {}) {
    const { retry = 3, timeoutMs = 12000, useCache = false } = options;
    const cacheKey = useCache ? `${method}:${JSON.stringify(params)}` : null;

    if (cacheKey && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey);
      if (Date.now() - entry.time < CONFIG.cacheTtlMs) {
        this.stats.cacheHits++;
        return entry.data;
      }
      this.cache.delete(cacheKey);
    }

    let lastError = null;
    for (let attempt = 0; attempt < retry; attempt++) {
      const rpcUrl = this.getActiveRpc();
      this.stats.requests++;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now() + Math.floor(Math.random() * 1000),
            method,
            params
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error.message || JSON.stringify(data.error));
        }

        if (cacheKey) {
          this.cache.set(cacheKey, { time: Date.now(), data: data.result });
        }

        return data.result;
      } catch (err) {
        clearTimeout(timeoutId);
        this.stats.errors++;
        lastError = err;
        // Cycle RPC on failure
        this.switchNextRpc();
        // Exponential backoff
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
      }
    }

    throw lastError || new Error(`Failed to call RPC method ${method}`);
  }

  async getSignaturesForAddress(address, limit = 50) {
    return this.callRpc('getSignaturesForAddress', [address, { limit }], { useCache: true });
  }

  async getTransaction(signature) {
    return this.callRpc('getTransaction', [
      signature,
      { encoding: 'jsonParsed', maxSupportedTransactionVersion: 1 }
    ], { useCache: true });
  }

  async getMultipleTransactions(signatures, concurrency = 4) {
    const results = [];
    for (let i = 0; i < signatures.length; i += concurrency) {
      const chunk = signatures.slice(i, i + concurrency);
      const chunkPromises = chunk.map(sig =>
        this.getTransaction(sig).catch(err => {
          // Only warn if not rate limit
          if (!err.message.includes('429')) {
            console.warn(`Failed to fetch tx ${sig}:`, err.message);
          }
          return null;
        })
      );
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      // Small throttle to stay within public RPC quotas
      if (i + concurrency < signatures.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    return results.filter(Boolean);
  }

  async getParsedTokenAccountsByOwner(walletAddress) {
    return this.callRpc('getParsedTokenAccountsByOwner', [
      walletAddress,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' }
    ], { useCache: true });
  }

  async getAccountBalance(address) {
    const res = await this.callRpc('getBalance', [address], { useCache: true });
    return res ? res.value / 1e9 : 0;
  }
}

export const solanaRpc = new SolanaRpcClient();
