import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import WalletScreener from './components/WalletScreener';
import TrendingTokens from './components/TrendingTokens';
import Leaderboard from './components/Leaderboard';
import Watchlist from './components/Watchlist';
import SettingsView from './components/SettingsView';
import TokenInspectorModal from './components/TokenInspectorModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('screener');
  const [currency, setCurrency] = useState('SOL');

  const [walletData, setWalletData] = useState(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState(null);

  const [solPriceUsd, setSolPriceUsd] = useState(null);
  const [rpcStatus, setRpcStatus] = useState({ status: 'disconnected', latencyMs: -1, activeRpc: null });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [trendingTokens, setTrendingTokens] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);


  const [selectedToken, setSelectedToken] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('pumpfun_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('pumpfun_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'leaderboard') return;
    setIsLoadingLeaderboard(true);
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeaderboardData(data);
      })
      .catch(err => console.error('Error refreshing live leaderboard:', err))
      .finally(() => setIsLoadingLeaderboard(false));
  }, [activeTab]);


  const fetchInitialData = async () => {
    setIsRefreshing(true);
    setIsLoadingTrending(true);
    try {
      const savedRpcUrl = localStorage.getItem('pumpfun_rpc_url');
      if (savedRpcUrl) {
        const currentRpc = await fetch('/api/settings/rpc').then(r => r.json()).catch(() => null);
        if (currentRpc && !currentRpc.isCustom) {
          const savedRpcResponse = await fetch('/api/settings/rpc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rpcUrl: savedRpcUrl })
          });
          if (!savedRpcResponse.ok) localStorage.removeItem('pumpfun_rpc_url');
        }
      }

      const [healthRes, rpcRes, trendingRes] = await Promise.all([
        fetch('/api/health').then(r => r.json()).catch(() => null),
        fetch('/api/settings/rpc').then(r => r.json()).catch(() => null),
        fetch('/api/tokens/trending?limit=25').then(r => r.json()).catch(() => [])
      ]);

      if (healthRes?.solPriceUsd) setSolPriceUsd(healthRes.solPriceUsd);
      if (rpcRes) {
        setRpcStatus({
          ...rpcRes,
          wsConnected: Boolean(healthRes?.wsConnected)
        });
      }
      if (Array.isArray(trendingRes)) setTrendingTokens(trendingRes);
    } catch (err) {
      console.error('Error loading live market data:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoadingTrending(false);
    }

    setIsLoadingLeaderboard(true);
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLeaderboardData(data);
      })
      .catch(err => console.error('Error loading live leaderboard:', err))
      .finally(() => setIsLoadingLeaderboard(false));
  };

  const screenWalletAddress = async (address) => {
    if (!address?.trim()) return;
    setIsLoadingWallet(true);
    setWalletError(null);

    try {
      const res = await fetch(`/api/wallet/${address.trim()}?limit=50`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to screen wallet`);
      }
      setWalletData(await res.json());
    } catch (err) {
      console.error('Screening error:', err);
      setWalletError(err.message);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const handleToggleWatchlist = (wallet) => {
    if (!wallet?.address) return;
    setWatchlist((prev) => {
      if (prev.some(w => w.address === wallet.address)) {
        return prev.filter(w => w.address !== wallet.address);
      }
      return [{
        address: wallet.address,
        alias: wallet.alias,
        winRate: wallet.summary?.winRate || 0,
        totalPnlSol: wallet.summary?.totalRealizedPnlSol || 0,
        smartScore: wallet.summary?.smartScore || 0,
        savedAt: Date.now()
      }, ...prev];
    });
  };

  const handleRemoveFromWatchlist = (address) => {
    setWatchlist(prev => prev.filter(w => w.address !== address));
  };

  const handleClearWatchlist = () => {
    if (window.confirm('Are you sure you want to clear your entire watchlist?')) {
      setWatchlist([]);
    }
  };

  const handleInspectTraders = (token) => {
    setSelectedToken(token);
    setIsInspectorOpen(true);
  };

  const handleScreenFromModal = (address) => {
    setIsInspectorOpen(false);
    setActiveTab('screener');
    screenWalletAddress(address);
  };

  const handleRefreshTrending = async () => {
    setIsLoadingTrending(true);
    try {
      const res = await fetch('/api/tokens/trending?limit=25');
      const data = await res.json();
      if (Array.isArray(data)) setTrendingTokens(data);
    } catch (err) {
      console.error('Error refreshing live token data:', err);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090d] text-slate-100 font-sans">
      <Header
        solPriceUsd={solPriceUsd}
        rpcStatus={rpcStatus}
        currency={currency}
        setCurrency={setCurrency}
        watchlistCount={watchlist.length}
        onRefresh={fetchInitialData}
        isRefreshing={isRefreshing}
      />

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistCount={watchlist.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'screener' && (
          <WalletScreener
            walletData={walletData}
            isLoading={isLoadingWallet}
            error={walletError}
            onScreenAddress={screenWalletAddress}
            currency={currency}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {activeTab === 'trending' && (
          <TrendingTokens
            tokens={trendingTokens}
            isLoading={isLoadingTrending}
            onRefresh={handleRefreshTrending}
            onInspectTraders={handleInspectTraders}
            onScreenWallet={handleScreenFromModal}
          />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard
            leaderboardData={leaderboardData}
            isLoading={isLoadingLeaderboard}
            onScreenWallet={(address) => {
              setActiveTab('screener');
              screenWalletAddress(address);
            }}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {activeTab === 'watchlist' && (
          <Watchlist
            watchlist={watchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            onScreenWallet={(address) => {
              setActiveTab('screener');
              screenWalletAddress(address);
            }}
            onClearWatchlist={handleClearWatchlist}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            rpcStatus={rpcStatus}
            onUpdateRpc={fetchInitialData}
            currency={currency}
            setCurrency={setCurrency}
          />
        )}
      </main>

      <TokenInspectorModal
        token={selectedToken}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onScreenWallet={handleScreenFromModal}
      />

      <footer className="border-t border-white/5 py-6 bg-dark-950/80 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>💊 Pump.fun Wallet Screener &copy; {new Date().getFullYear()} · Solana Mainnet</p>
          <p className="text-slate-600">Live Solana RPC · DexScreener · PumpPortal WebSocket</p>
        </div>
      </footer>
    </div>
  );
}
