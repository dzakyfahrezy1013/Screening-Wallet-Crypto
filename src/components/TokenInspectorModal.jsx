import React, { useState, useEffect } from 'react';
import { X, Users, Crosshair, ExternalLink, Loader2, Copy, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function TokenInspectorModal({
  token,
  isOpen,
  onClose,
  onScreenWallet
}) {
  const [traders, setTraders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(null);

  useEffect(() => {
    if (isOpen && token?.mint) {
      setIsLoading(true);
      fetch(`/api/token/${token.mint}/traders?limit=15`)
        .then(res => res.json())
        .then(data => {
          setTraders(Array.isArray(data) ? data : []);
          setIsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [isOpen, token]);

  if (!isOpen || !token) return null;

  const copyWallet = (wallet) => {
    navigator.clipboard.writeText(wallet);
    setCopiedWallet(wallet);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-dark-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-white/10 flex items-center justify-center font-bold text-sm text-emerald-300">
              {token.symbol?.slice(0, 2) || 'PF'}
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <span>{token.symbol}</span>
                <span className="text-xs text-slate-400 font-normal">({token.name})</span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <span>CA: {token.mint?.slice(0, 6)}...{token.mint?.slice(-6)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Active Traders List */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Recent On-Chain Traders ({traders.length})</span>
            </span>
            <span>Click "Screen" to inspect trader's historical win rate & PnL</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">
                Fetching recent pump.fun transactions for {token.symbol}...
              </p>
            </div>
          ) : traders.length > 0 ? (
            <div className="divide-y divide-white/5 font-mono text-xs">
              {traders.map((trader) => (
                <div
                  key={trader.wallet}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-white/[0.02] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      trader.lastAction === 'buy' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200 font-bold">
                          {trader.wallet.slice(0, 4)}...{trader.wallet.slice(-4)}
                        </span>
                        <button
                          onClick={() => copyWallet(trader.wallet)}
                          className="text-slate-500 hover:text-white transition-colors"
                          title="Copy Address"
                        >
                          {copiedWallet === trader.wallet ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-sans mt-0.5">
                        <span className="capitalize">{trader.lastAction}</span>
                        {trader.routerUsed && (
                          <span className="text-purple-400 bg-purple-500/10 px-1 rounded">
                            {trader.routerUsed}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="text-right">
                    <span className="font-bold text-slate-300">
                      {trader.totalSol} SOL
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      {trader.buysCount}B / {trader.sellsCount}S
                    </span>
                  </div>

                  {/* Screen Button */}
                  <button
                    onClick={() => {
                      onClose();
                      onScreenWallet(trader.wallet);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>Screen</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs italic">
              No recent pump.fun transactions found for this mint.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-dark-900/80 flex items-center justify-between text-xs text-slate-400 font-sans">
          <span>Bonding Curve Program: 6EF8...P</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
