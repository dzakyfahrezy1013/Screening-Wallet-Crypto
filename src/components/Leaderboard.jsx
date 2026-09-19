import React, { useState } from 'react';
import { Trophy, Star, Crosshair, ExternalLink, Copy, Check, Sparkles, TrendingUp, Filter } from 'lucide-react';

export default function Leaderboard({
  leaderboardData = [],
  onScreenWallet,
  watchlist = [],
  onToggleWatchlist
}) {
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [filterMode, setFilterMode] = useState('pnl'); // 'pnl' | 'winrate'

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const sortedData = [...leaderboardData].sort((a, b) => {
    if (filterMode === 'winrate') return b.winRate - a.winRate;
    return b.totalPnlSol - a.totalPnlSol;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span>Live Wallet Leaderboard</span>
          </h2>
          <p className="text-xs text-slate-400">
            Ranked from wallets discovered through the live PumpPortal stream and on-chain trader scans
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-dark-900 rounded-xl border border-white/5 text-xs self-start sm:self-center">
          <button
            onClick={() => setFilterMode('pnl')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterMode === 'pnl'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Highest PnL
          </button>
          <button
            onClick={() => setFilterMode('winrate')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filterMode === 'winrate'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Highest Win Rate
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-900/90 text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Rank & Trader</th>
                <th className="py-3.5 px-4">Win Rate</th>
                <th className="py-3.5 px-4">Total PnL</th>
                <th className="py-3.5 px-4">Profit Factor</th>
                <th className="py-3.5 px-4">Avg Hold</th>
                <th className="py-3.5 px-4">Smart Score</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-sans">
                    No live wallet history discovered yet. Open Live Mints or inspect a token's traders to populate this board.
                  </td>
                </tr>
              )}
              {sortedData.map((item, index) => {
                const isWatchlisted = watchlist.some(w => w.address === item.address);
                return (
                  <tr key={item.address} className="hover:bg-white/[0.02] transition-colors">
                    {/* Rank & Trader info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs ${
                          index === 0
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : index === 1
                            ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                            : index === 2
                            ? 'bg-amber-600/20 text-amber-500 border border-amber-600/30'
                            : 'text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="font-bold text-white">{item.alias}</span>
                            {item.primaryBadge && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                item.primaryBadge.color === 'emerald'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : item.primaryBadge.color === 'cyan'
                                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                  : item.primaryBadge.color === 'red'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}>
                                {item.primaryBadge.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            <span>{item.address.slice(0, 4)}...{item.address.slice(-4)}</span>
                            <button
                              onClick={() => copyAddress(item.address)}
                              className="hover:text-white transition-colors"
                              title="Copy Address"
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
                        item.winRate >= 60 ? 'text-emerald-400' : 'text-yellow-400'
                      }`}>
                        {item.winRate}%
                      </span>
                    </td>

                    {/* Total PnL */}
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      +{item.totalPnlSol} SOL
                    </td>

                    {/* Profit Factor */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.profitFactor}x
                    </td>

                    {/* Avg Hold Time */}
                    <td className="py-3.5 px-4 text-slate-400">
                      {item.avgHoldTime}
                    </td>

                    {/* Smart Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1.5 rounded-full bg-dark-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.smartScore >= 75 ? 'bg-emerald-400' : 'bg-yellow-400'
                            }`}
                            style={{ width: `${item.smartScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-200">{item.smartScore}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Watchlist toggle */}
                        <button
                          onClick={() => onToggleWatchlist(item)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isWatchlisted
                              ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                              : 'bg-dark-800 hover:bg-dark-700 border-white/5 text-slate-400 hover:text-white'
                          }`}
                          title="Toggle Watchlist"
                        >
                          <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                        </button>

                        {/* Screen Button */}
                        <button
                          onClick={() => onScreenWallet(item.address)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                          <span>Screen</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
