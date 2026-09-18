import React, { useState } from 'react';
import {
  Search, Copy, Check, ExternalLink, ShieldCheck, ShieldAlert,
  AlertTriangle, Crosshair, Zap, Cpu, Fish, Gem, TrendingUp,
  TrendingDown, Sparkles, Clock, ArrowUpRight, ArrowDownRight,
  Package, DollarSign, Star, Loader2, RefreshCw
} from 'lucide-react';

export default function WalletScreener({
  walletData,
  isLoading,
  error,
  onScreenAddress,
  onForceLiveScan,
  currency,
  watchlist,
  onToggleWatchlist,
  sampleWallets = []
}) {
  const [inputAddress, setInputAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('tokens'); // 'tokens' | 'transactions' | 'insights'

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!inputAddress.trim()) return;
    onScreenAddress(inputAddress.trim());
  };

  const handleSelectSample = (addr) => {
    setInputAddress(addr);
    onScreenAddress(addr);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSavedInWatchlist = walletData?.address && watchlist.some(w => w.address === walletData.address);

  const formatSolOrUsd = (solAmount, solPriceUsd) => {
    if (solAmount === null || solAmount === undefined) return '---';
    if (currency === 'USD') {
      const usd = solAmount * (solPriceUsd || 100);
      return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${solAmount >= 0 ? '+' : ''}${solAmount.toFixed(3)} SOL`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Search Bar & Preset Quick Chips */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="Paste Solana wallet address to screen (e.g. Cx32Hnt...)"
              className="w-full pl-10 pr-24 py-3 bg-dark-900 border border-white/10 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            {/* Quick paste button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  const clip = await navigator.clipboard.readText();
                  if (clip) setInputAddress(clip.trim());
                } catch {}
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-slate-300 rounded border border-white/5 transition-colors"
            >
              Paste
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputAddress.trim()}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-dark-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Screening...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-4 h-4" />
                <span>Screen Wallet</span>
              </>
            )}
          </button>
        </form>

        {/* Preset sample archetypes */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium">Quick Presets:</span>
          {sampleWallets.length > 0 ? (
            sampleWallets.map((sample) => (
              <button
                key={sample.address}
                onClick={() => handleSelectSample(sample.address)}
                className={`px-2.5 py-1 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
                  walletData?.address === sample.address
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-dark-900/60 border-white/5 text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{sample.alias}</span>
                <span className={`font-mono font-semibold ${sample.pnlSol >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {sample.pnlSol >= 0 ? `+${sample.pnlSol} SOL` : `${sample.pnlSol} SOL`}
                </span>
              </button>
            ))
          ) : (
            <span className="text-slate-500 italic">Loading sample wallets...</span>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <div>
            <p className="font-semibold">Screening Error</p>
            <p className="text-xs text-rose-300/80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="glass-panel p-8 rounded-2xl border border-white/5 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-medium">
            Fetching Solana transactions & analyzing pump.fun trade history...
          </p>
          <p className="text-xs text-slate-500 font-mono">
            Calculating Win Rate, PnL, hold durations, and smart money signatures
          </p>
        </div>
      )}

      {/* 2. Wallet Profile Hero Card */}
      {!isLoading && walletData && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-15 ${
              walletData.summary?.totalRealizedPnlSol >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              {/* Left Profile Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                    {walletData.summary?.smartScore >= 75 ? '🐋' : (walletData.summary?.rugPullsDetected > 0 ? '⚠️' : '🎯')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {walletData.alias}
                      </h2>
                      {walletData.isSample ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          Preset Sample
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live On-Chain RPC
                        </span>
                      )}
                    </div>
                    {/* Address + Copy + Links */}
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                      <span>{walletData.address}</span>
                      <button
                        onClick={() => copyToClipboard(walletData.address)}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Copy Solana Address"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`https://solscan.io/account/${walletData.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-0.5"
                        title="View on Solscan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    {/* Force Live RPC button if sample */}
                    {walletData.isSample && onForceLiveScan && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => onForceLiveScan(walletData.address)}
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Scan Live On-Chain (Solana RPC)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Behavioral Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {walletData.badges?.map((b) => (
                    <span
                      key={b.id}
                      title={b.desc}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border shadow-sm ${
                        b.color === 'emerald'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : b.color === 'cyan'
                          ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                          : b.color === 'purple'
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                          : b.color === 'amber'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : b.color === 'red' || b.color === 'rose'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{b.label}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Score & Actions */}
              <div className="flex items-center gap-4 self-start lg:self-center">
                {/* Smart Score Gauge */}
                <div className="p-3 px-4 rounded-xl bg-dark-900 border border-white/5 text-center min-w-[110px]">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Smart Score
                  </p>
                  <p className={`text-2xl font-black font-mono mt-0.5 ${
                    walletData.summary?.smartScore >= 75
                      ? 'text-emerald-400'
                      : walletData.summary?.smartScore >= 50
                      ? 'text-yellow-400'
                      : 'text-rose-400'
                  }`}>
                    {walletData.summary?.smartScore || 50}
                    <span className="text-xs font-normal text-slate-500">/100</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {walletData.summary?.safetyLevel?.replace(/_/g, ' ') || 'NEUTRAL'}
                  </p>
                </div>

                {/* Watchlist Toggle Button */}
                <button
                  onClick={() => onToggleWatchlist(walletData)}
                  className={`p-3 rounded-xl border font-semibold text-xs flex flex-col items-center gap-1 transition-all min-w-[100px] ${
                    isSavedInWatchlist
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      : 'bg-dark-900 hover:bg-dark-850 border-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  <Star className={`w-4 h-4 ${isSavedInWatchlist ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>{isSavedInWatchlist ? 'Saved' : 'Watchlist'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Win Rate */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Win Rate</span>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold font-mono ${
                  walletData.summary?.winRate >= 60 ? 'text-emerald-400' : walletData.summary?.winRate >= 40 ? 'text-yellow-400' : 'text-rose-400'
                }`}>
                  {walletData.summary?.winRate}%
                </p>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                {walletData.summary?.profitableTrades} Won / {walletData.summary?.unprofitableTrades} Lost
              </p>
            </div>

            {/* Realized PnL */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Realized PnL</span>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold font-mono ${
                  walletData.summary?.totalRealizedPnlSol >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatSolOrUsd(walletData.summary?.totalRealizedPnlSol, walletData.solPriceUsd)}
                </p>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                ${walletData.summary?.totalRealizedPnlUsd?.toFixed(2) || '0.00'} USD
              </p>
            </div>

            {/* Profit Factor */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Profit Factor</span>
              <p className="text-2xl font-bold font-mono text-white">
                {walletData.summary?.profitFactor || '0.00'}x
              </p>
              <p className="text-[11px] text-slate-500">
                Gross Gains vs Losses
              </p>
            </div>

            {/* Total Volume */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Volume</span>
              <p className="text-2xl font-bold font-mono text-white">
                {walletData.summary?.totalVolumeSol?.toFixed(1) || '0.0'} SOL
              </p>
              <p className="text-[11px] text-slate-500">
                {walletData.summary?.totalTrades} Total Swaps
              </p>
            </div>

            {/* Avg Hold Time */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Avg Holding Time</span>
              <p className="text-xl font-bold font-mono text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>
                  {walletData.summary?.avgHoldDurationSec < 60
                    ? `${walletData.summary?.avgHoldDurationSec}s`
                    : walletData.summary?.avgHoldDurationSec < 3600
                    ? `${Math.floor(walletData.summary?.avgHoldDurationSec / 60)}m ${walletData.summary?.avgHoldDurationSec % 60}s`
                    : `${Math.floor(walletData.summary?.avgHoldDurationSec / 3600)}h`}
                </span>
              </p>
              <p className="text-[11px] text-slate-500">
                {walletData.summary?.avgHoldDurationSec < 180 ? 'Scalper / Sniper speed' : 'Swing holding'}
              </p>
            </div>

            {/* Avg Position Size */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Avg Position Size</span>
              <p className="text-xl font-bold font-mono text-white">
                {walletData.summary?.avgTradeSizeSol?.toFixed(3) || '0.000'} SOL
              </p>
              <p className="text-[11px] text-slate-500">
                Per trade allocation
              </p>
            </div>

            {/* Unique Tokens */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Tokens Traded</span>
              <p className="text-xl font-bold font-mono text-white">
                {walletData.summary?.uniqueTokensTraded || 0} Coins
              </p>
              <p className="text-[11px] text-slate-500">
                Pump.fun ecosystem
              </p>
            </div>

            {/* Dev / Rug Check */}
            <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Dev Activity</span>
              <p className={`text-xl font-bold font-mono flex items-center gap-1 ${
                walletData.summary?.rugPullsDetected > 0 ? 'text-rose-400' : 'text-slate-200'
              }`}>
                {walletData.summary?.rugPullsDetected > 0 ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{walletData.summary?.rugPullsDetected} Rugs!</span>
                  </>
                ) : (
                  <span>{walletData.summary?.tokensCreated || 0} Created</span>
                )}
              </p>
              <p className="text-[11px] text-slate-500">
                {walletData.summary?.rugPullsDetected > 0 ? '⚠️ High Insider Dump Risk' : 'Clean Creator History'}
              </p>
            </div>
          </div>

          {/* 4. Sub-Navigation Tabs */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveSubTab('tokens')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeSubTab === 'tokens'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Traded Coins ({walletData.tokensTraded?.length || 0})
            </button>
            <button
              onClick={() => setActiveSubTab('transactions')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeSubTab === 'transactions'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Recent Swaps ({walletData.recentTransactions?.length || 0})
            </button>
          </div>

          {/* Sub-tab 1: Traded Coins Table */}
          {activeSubTab === 'tokens' && (
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-900/90 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Token</th>
                      <th className="py-3.5 px-4">Buy / Sell (SOL)</th>
                      <th className="py-3.5 px-4">Net PnL</th>
                      <th className="py-3.5 px-4">ROI %</th>
                      <th className="py-3.5 px-4">Hold Duration</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Links</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {walletData.tokensTraded?.length > 0 ? (
                      walletData.tokensTraded.map((token, idx) => (
                        <tr key={token.mint || idx} className="hover:bg-white/[0.02] transition-colors">
                          {/* Token Name & Icon */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {token.icon ? (
                                <img src={token.icon} alt={token.symbol} className="w-7 h-7 rounded-full object-cover bg-dark-800" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                                  {token.symbol?.slice(0, 2)}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white font-sans">{token.symbol}</span>
                                  {token.isSniper && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                      Sniper
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                                  {token.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Buy / Sell SOL */}
                          <td className="py-3.5 px-4">
                            <div>
                              <span className="text-slate-300">{token.totalBoughtSol} SOL</span>
                              <span className="text-slate-500 mx-1">→</span>
                              <span className="text-slate-300">{token.totalSoldSol} SOL</span>
                            </div>
                          </td>

                          {/* Net PnL */}
                          <td className="py-3.5 px-4">
                            <span className={`font-bold ${token.pnlSol >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {token.pnlSol >= 0 ? `+${token.pnlSol}` : token.pnlSol} SOL
                            </span>
                          </td>

                          {/* ROI % */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              token.roiPercent >= 0
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {token.roiPercent >= 0 ? `+${token.roiPercent}%` : `${token.roiPercent}%`}
                            </span>
                          </td>

                          {/* Hold Duration */}
                          <td className="py-3.5 px-4 text-slate-400">
                            {token.holdDurationSec < 60
                              ? `${token.holdDurationSec}s`
                              : token.holdDurationSec < 3600
                              ? `${Math.floor(token.holdDurationSec / 60)}m`
                              : `${Math.floor(token.holdDurationSec / 3600)}h`}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-sans font-medium ${
                              token.status === 'Sold Out'
                                ? 'bg-slate-500/10 text-slate-400'
                                : token.status.includes('Dumped')
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            }`}>
                              {token.status}
                            </span>
                          </td>

                          {/* External Links */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`https://pump.fun/coin/${token.mint}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded bg-dark-800 hover:bg-dark-700 text-emerald-400 transition-colors"
                                title="Open on Pump.fun"
                              >
                                💊
                              </a>
                              <a
                                href={`https://dexscreener.com/solana/${token.mint}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white transition-colors"
                                title="Open on DexScreener"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500 italic font-sans">
                          No pump.fun token trades detected for this wallet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 2: Recent Swaps */}
          {activeSubTab === 'transactions' && (
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-900/90 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Token</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Router / Bot</th>
                      <th className="py-3.5 px-4">Time</th>
                      <th className="py-3.5 px-4 text-right">Solscan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {walletData.recentTransactions?.length > 0 ? (
                      walletData.recentTransactions.map((tx, idx) => (
                        <tr key={tx.signature || idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              tx.action === 'buy'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : tx.action === 'sell'
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-slate-500/10 text-slate-400'
                            }`}>
                              {tx.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-sans font-bold text-white">
                            {tx.tokenSymbol}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-200">
                            {tx.solAmount} SOL
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-400">
                            {tx.router || 'Direct / Pump'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {tx.timeAgo}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <a
                              href={`https://solscan.io/tx/${tx.signature}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                            >
                              <span>{tx.signature?.slice(0, 6)}...</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-500 italic font-sans">
                          No recent transactions recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
