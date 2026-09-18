import React, { useState, useEffect } from 'react';
import { Flame, ExternalLink, Copy, Check, Users, TrendingUp, TrendingDown, RefreshCw, Zap, Crosshair, Sparkles, Clock } from 'lucide-react';

export default function TrendingTokens({
  tokens = [],
  isLoading,
  onRefresh,
  onInspectTraders,
  onScreenWallet
}) {
  const [activeTab, setActiveTab] = useState('trending'); // 'trending' | 'live'
  const [copiedMint, setCopiedMint] = useState(null);
  const [liveMints, setLiveMints] = useState([]);
  const [isLiveLoading, setIsLiveLoading] = useState(false);

  // Poll live tokens buffer from backend when activeTab === 'live'
  useEffect(() => {
    let intervalId;
    const fetchLiveMints = async () => {
      try {
        const res = await fetch('/api/tokens/live-feed');
        const data = await res.json();
        if (data && Array.isArray(data.tokens)) {
          setLiveMints(data.tokens);
        }
      } catch (err) {
        console.warn('Error fetching live mints:', err);
      }
    };

    if (activeTab === 'live') {
      fetchLiveMints();
      intervalId = setInterval(fetchLiveMints, 3000);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [activeTab]);

  const copyMint = (mint) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const formatNumber = (num) => {
    if (!num) return '$0';
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatTimeAgo = (timestampMs) => {
    const diff = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {activeTab === 'trending' ? (
              <>
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Trending Pump.fun Tokens</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-emerald-400" />
                <span>Live Mints Stream (PumpPortal WS)</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            {activeTab === 'trending'
              ? 'Real-time trending coins on Pump.fun bonding curve & Raydium'
              : 'Sub-second real-time stream of newly created coins on pump.fun'}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center p-1 bg-dark-900 rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'trending'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Trending</span>
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'live'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Mints (Sub-sec)</span>
            </button>
          </div>

          {activeTab === 'trending' && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* View 1: DexScreener Trending Table */}
      {activeTab === 'trending' && (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/90 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Coin</th>
                  <th className="py-3.5 px-4">Price (USD)</th>
                  <th className="py-3.5 px-4">1h Change</th>
                  <th className="py-3.5 px-4">24h Volume</th>
                  <th className="py-3.5 px-4">Market Cap</th>
                  <th className="py-3.5 px-4">24h Swaps</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {tokens.length > 0 ? (
                  tokens.map((token) => (
                    <tr key={token.mint} className="hover:bg-white/[0.02] transition-colors">
                      {/* Coin details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center font-bold text-xs text-emerald-300">
                            {token.symbol?.slice(0, 2) || 'PF'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white font-sans">{token.symbol}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {token.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span>{token.mint?.slice(0, 4)}...{token.mint?.slice(-4)}</span>
                              <button
                                onClick={() => copyMint(token.mint)}
                                className="hover:text-white transition-colors"
                                title="Copy Mint CA"
                              >
                                {copiedMint === token.mint ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price USD */}
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        ${token.priceUsd < 0.0001 ? token.priceUsd.toExponential(3) : token.priceUsd.toFixed(6)}
                      </td>

                      {/* 1h Change */}
                      <td className="py-3.5 px-4">
                        <span className={`flex items-center gap-0.5 font-bold ${
                          token.priceChange1h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {token.priceChange1h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{token.priceChange1h ? `${token.priceChange1h.toFixed(1)}%` : '0.0%'}</span>
                        </span>
                      </td>

                      {/* 24h Volume */}
                      <td className="py-3.5 px-4 text-slate-300 font-semibold">
                        {formatNumber(token.volume24h)}
                      </td>

                      {/* Market Cap */}
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        {formatNumber(token.fdv)}
                      </td>

                      {/* 24h Swaps */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="text-emerald-400 font-bold">{token.txns24h?.buys || 0}B</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-rose-400 font-bold">{token.txns24h?.sells || 0}S</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onInspectTraders(token)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                            title="Inspect buyers and smart wallets for this token"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Find Whales</span>
                          </button>

                          <a
                            href={`https://pump.fun/coin/${token.mint}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-emerald-400 transition-colors"
                            title="Open on Pump.fun"
                          >
                            💊
                          </a>

                          <a
                            href={token.url || `https://dexscreener.com/solana/${token.mint}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white transition-colors"
                            title="View on DexScreener"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500 font-sans italic">
                      {isLoading ? 'Loading trending pump.fun tokens...' : 'No tokens found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Live PumpPortal WebSocket Mints Stream */}
      {activeTab === 'live' && (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-3 bg-dark-900/90 border-b border-white/5 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Connected to wss://pumpportal.fun/api/data (Streaming Live Mints)</span>
            </span>
            <span className="text-slate-400 font-mono">
              Buffer: {liveMints.length} coins captured
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/60 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Coin</th>
                  <th className="py-3.5 px-4">Initial Buy</th>
                  <th className="py-3.5 px-4">Market Cap</th>
                  <th className="py-3.5 px-4">Creator / Dev Wallet</th>
                  <th className="py-3.5 px-4">Minted</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {liveMints.length > 0 ? (
                  liveMints.map((mint) => (
                    <tr key={mint.mint} className="hover:bg-white/[0.02] transition-colors">
                      {/* Coin */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                            💊
                          </div>
                          <div>
                            <span className="font-bold text-white font-sans block">{mint.symbol}</span>
                            <span className="text-[10px] text-slate-500 font-normal truncate block max-w-[120px]">
                              {mint.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Initial Buy */}
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {mint.solAmount ? `${mint.solAmount.toFixed(3)} SOL` : '0 SOL'}
                      </td>

                      {/* Market Cap */}
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">
                        {mint.marketCapSol ? `${mint.marketCapSol.toFixed(1)} SOL` : '~28 SOL'}
                      </td>

                      {/* Creator Dev */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-300">
                            {mint.traderPublicKey ? `${mint.traderPublicKey.slice(0, 4)}...${mint.traderPublicKey.slice(-4)}` : 'Dev'}
                          </span>
                          {mint.traderPublicKey && (
                            <button
                              onClick={() => copyMint(mint.traderPublicKey)}
                              className="text-slate-500 hover:text-white"
                              title="Copy Creator Address"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Minted time */}
                      <td className="py-3.5 px-4 text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{formatTimeAgo(mint.timestamp)}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Screen Dev Wallet */}
                          {mint.traderPublicKey && onScreenWallet && (
                            <button
                              onClick={() => onScreenWallet(mint.traderPublicKey)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                              title="Screen this Dev wallet for past rugs and win rate"
                            >
                              <Crosshair className="w-3 h-3" />
                              <span>Screen Dev</span>
                            </button>
                          )}

                          {/* Open pump.fun */}
                          <a
                            href={`https://pump.fun/coin/${mint.mint}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-dark-800 hover:bg-dark-700 text-emerald-400 transition-colors"
                            title="Open on Pump.fun"
                          >
                            💊
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400 font-sans space-y-2">
                      <Zap className="w-6 h-6 text-emerald-400 animate-bounce mx-auto" />
                      <p className="font-semibold text-white">Listening to Pump.fun WebSocket stream...</p>
                      <p className="text-xs text-slate-500">New tokens created on pump.fun will appear here in sub-seconds automatically.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
