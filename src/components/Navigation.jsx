import React from 'react';
import { Search, Flame, Trophy, Star, Settings } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab, watchlistCount = 0 }) {
  const tabs = [
    { id: 'screener', label: 'Wallet Screener', icon: Search },
    { id: 'trending', label: 'Trending Pump Coins', icon: Flame },
    { id: 'leaderboard', label: 'Smart Money Leaderboard', icon: Trophy },
    { id: 'watchlist', label: 'Watchlist', icon: Star, badge: watchlistCount > 0 ? watchlistCount : null },
    { id: 'settings', label: 'Settings & RPC', icon: Settings },
  ];

  return (
    <div className="border-b border-white/5 bg-dark-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-dark-950">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
