import React, { useState } from 'react';
import { Star, Trash2, Crosshair, Copy, Check, Download, AlertCircle, Sparkles } from 'lucide-react';

export default function Watchlist({
  watchlist = [],
  onRemoveFromWatchlist,
  onScreenWallet,
  onClearWatchlist
}) {
  const [copiedAddress, setCopiedAddress] = useState(null);

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const exportWatchlist = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(watchlist, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pumpfun_watchlist_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Monitored Wallets Watchlist ({watchlist.length})</span>
          </h2>
          <p className="text-xs text-slate-400">
            Locally saved pump.fun copytrade targets & smart money trackers
          </p>
        </div>

        {watchlist.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={exportWatchlist}
              className="px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/5 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClearWatchlist}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Watchlist Table */}
      {watchlist.length > 0 ? (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/90 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Wallet</th>
                  <th className="py-3.5 px-4">Win Rate</th>
                  <th className="py-3.5 px-4">Realized PnL</th>
                  <th className="py-3.5 px-4">Smart Score</th>
                  <th className="py-3.5 px-4">Added</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {watchlist.map((item) => (
                  <tr key={item.address} className="hover:bg-white/[0.02] transition-colors">
                    {/* Wallet address & alias */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center font-bold text-xs text-emerald-300">
                          {item.smartScore >= 75 ? '🐋' : '🎯'}
                        </div>
                        <div>
                          <span className="font-bold text-white font-sans block">
                            {item.alias || 'Saved Trader'}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <span>{item.address.slice(0, 6)}...{item.address.slice(-6)}</span>
                            <button
                              onClick={() => copyAddress(item.address)}
                              className="hover:text-white transition-colors"
                            >
                              {copiedAddress === item.address ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Win Rate */}
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${
                        (item.winRate || item.summary?.winRate) >= 60 ? 'text-emerald-400' : 'text-yellow-400'
                      }`}>
                        {item.winRate || item.summary?.winRate || '0'}%
                      </span>
                    </td>

                    {/* PnL */}
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      {item.totalPnlSol
                        ? `+${item.totalPnlSol} SOL`
                        : item.summary?.totalRealizedPnlSol
                        ? `+${item.summary.totalRealizedPnlSol} SOL`
                        : '---'}
                    </td>

                    {/* Smart Score */}
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      {item.smartScore || item.summary?.smartScore || 50}/100
                    </td>

                    {/* Added Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-sans">
                      {item.savedAt ? new Date(item.savedAt).toLocaleDateString() : 'Recent'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onScreenWallet(item.address)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>Screen</span>
                        </button>
                        <button
                          onClick={() => onRemoveFromWatchlist(item.address)}
                          className="p-1.5 rounded-lg bg-dark-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl border border-white/5 text-center space-y-3">
          <Star className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Your Watchlist is Empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Screen any Solana wallet or browse the Smart Money Leaderboard, then click "Save to Watchlist" to track them here.
          </p>
        </div>
      )}
    </div>
  );
}
