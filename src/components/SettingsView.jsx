import React, { useState } from 'react';
import { Settings, Server, Check, AlertCircle, RefreshCw, Shield, HelpCircle, ExternalLink } from 'lucide-react';

export default function SettingsView({
  rpcStatus,
  onUpdateRpc,
  currency,
  setCurrency
}) {
  const [customUrl, setCustomUrl] = useState(() => localStorage.getItem('pumpfun_rpc_url') || '');
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSaveRpc = async (e) => {
    e.preventDefault();
    setIsTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpcUrl: customUrl.trim() || null })
      });
      const data = await res.json();
      setIsTesting(false);

      if (data.success) {
        localStorage.setItem('pumpfun_rpc_url', customUrl.trim());
        setMessage({ type: 'success', text: data.message || `Connected! Latency: ${data.latencyMs || 'OK'}ms` });
        onUpdateRpc && onUpdateRpc();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to connect to RPC' });
      }
    } catch (err) {
      setIsTesting(false);
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleResetDefault = async () => {
    setCustomUrl('');
    localStorage.removeItem('pumpfun_rpc_url');
    setIsTesting(true);
    try {
      const res = await fetch('/api/settings/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rpcUrl: null })
      });
      const data = await res.json();
      setIsTesting(false);
      setMessage(data.success
        ? { type: 'success', text: 'Reset to default public Solana RPC pool' }
        : { type: 'error', text: data.error || 'Failed to reset RPC' });
      if (data.success) onUpdateRpc && onUpdateRpc();
    } catch (err) {
      setIsTesting(false);
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Application & RPC Settings</span>
        </h2>
        <p className="text-xs text-slate-400">
          Configure custom Solana RPC endpoints, display currency, and screening limits
        </p>
      </div>

      {/* 1. Custom RPC Configuration */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Solana RPC Endpoint</h3>
              <p className="text-xs text-slate-400">
                Current: <span className="font-mono text-emerald-300">{rpcStatus?.activeRpc || 'Default Pool'}</span>
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
            rpcStatus?.status === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : rpcStatus?.status?.startsWith('error')
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>
              {rpcStatus?.status === 'connected'
                ? `${rpcStatus.latencyMs}ms`
                : rpcStatus?.status?.startsWith('error') ? 'Error' : 'Checking'}
            </span>
          </span>
        </div>

        <form onSubmit={handleSaveRpc} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Custom RPC URL (Helius / QuickNode / Alchemy / Shyft / Private)
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://mainnet.helius-rpc.com/?api-key=..."
              className="w-full px-4 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              💡 Tip: A private RPC from Helius or QuickNode gives 50x higher rate limits and avoids public RPC 429 errors when batch screening.
            </p>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
            }`}>
              {message.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isTesting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-dark-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{customUrl.trim() ? 'Save & Test Connection' : 'Test Active RPC'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefault}
              disabled={isTesting}
              className="px-4 py-2 bg-dark-850 hover:bg-dark-800 border border-white/5 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Reset to Public Pool
            </button>
          </div>
        </form>
      </div>

      {/* 2. Display Preferences */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
        <h3 className="text-sm font-bold text-white">Display Currency</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setCurrency('SOL')}
            className={`p-3 rounded-xl border text-left transition-all ${
              currency === 'SOL'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-dark-900 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <span className="font-bold text-sm block">SOL (Solana Native)</span>
            <span className="text-[11px] text-slate-500">Show all PnL and trade sizes in SOL</span>
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`p-3 rounded-xl border text-left transition-all ${
              currency === 'USD'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-dark-900 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <span className="font-bold text-sm block">USD ($ Dollar)</span>
            <span className="text-[11px] text-slate-500">Converted using real-time DexScreener SOL price</span>
          </button>
        </div>
      </div>

      {/* 3. Program IDs & Contracts Reference */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3 font-mono text-xs">
        <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Tracked Solana Program Contracts</span>
        </h3>
        <div className="divide-y divide-white/5 text-slate-400">
          <div className="py-2 flex justify-between">
            <span>Pump.fun Bonding Curve Program:</span>
            <span className="text-slate-200">6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P</span>
          </div>
          <div className="py-2 flex justify-between">
            <span>Pump.fun Fee Account:</span>
            <span className="text-slate-200">CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM</span>
          </div>
          <div className="py-2 flex justify-between">
            <span>Raydium Liquidity Pool V4:</span>
            <span className="text-slate-200">675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8</span>
          </div>
          <div className="py-2 flex justify-between">
            <span>GMGN Bot Router:</span>
            <span className="text-slate-200">GMgnVFR8Jb39LoXsEVzb3DvBy3ywCmdmJquHUy1Lrkqb</span>
          </div>
        </div>
      </div>
    </div>
  );
}
