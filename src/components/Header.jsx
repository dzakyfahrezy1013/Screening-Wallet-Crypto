import React from 'react';
import { ShieldCheck, Activity, DollarSign, Wallet, RefreshCw, Sparkles } from 'lucide-react';

export default function Header({
  solPriceUsd,
  rpcStatus,
  currency,
  setCurrency,
  watchlistCount,
  onRefresh,
  isRefreshing
}) {
  return (
    <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <span className="text-xl">💊</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Pump<span className="text-emerald-400">Screen</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Solana Meme Radar
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pump.fun Wallet Screener & Smart Money Analyzer
            </p>
          </div>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-3">
          {/* Live SOL Price */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-850 border border-white/5 text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">SOL:</span>
            <span className="font-semibold text-white">
              ${solPriceUsd ? solPriceUsd.toFixed(2) : '---'}
            </span>
          </div>
          {/* RPC Latency & Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-850 border border-white/5 text-xs">
            <div className={`w-2 h-2 rounded-full ${rpcStatus?.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-slate-400">RPC:</span>
            <span className="font-mono text-slate-200">
              {rpcStatus?.latencyMs && rpcStatus.latencyMs > 0 ? `${rpcStatus.latencyMs}ms` : 'Ready'}
            </span>
          </div>

          {/* Live WS Pulse Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">Pump WS: Live</span>
          </div>

          {/* Currency Toggle */}
          <button
            onClick={() => setCurrency(currency === 'SOL' ? 'USD' : 'SOL')}
            className="px-2.5 py-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-white/5 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1"
            title="Toggle Currency Display (SOL / USD)"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currency}</span>
          </button>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 border border-white/5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
