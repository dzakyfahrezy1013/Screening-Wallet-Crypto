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

  // Wallet Screener State
  const [walletData, setWalletData] = useState(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState(null);

  // Global Market & RPC State
  const [solPriceUsd, setSolPriceUsd] = useState(106.00);
  const [rpcStatus, setRpcStatus] = useState({ status: 'connected', latencyMs: 24, activeRpc: 'Default Pool' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Samples & Trending & Leaderboard
  const [sampleWallets, setSampleWallets] = useState([]);
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  // Token Inspector Modal
  const [selectedToken, setSelectedToken] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Watchlist in LocalStorage
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('pumpfun_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pumpfun_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage:', e);
    }
  }, [watchlist]);

  // Initial Data Fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Health & SOL price & RPC
      const [healthRes, samplesRes, trendingRes, leaderboardRes] = await Promise.all([
        fetch('/api/health').then(r => r.json()).catch(() => null),
        fetch('/api/wallet-samples').then(r => r.json()).catch(() => []),
        fetch('/api/tokens/trending?limit=25').then(r => r.json()).catch(() => []),
        fetch('/api/leaderboard').then(r => r.json()).catch(() => [])
      ]);

      if (healthRes) {
        if (healthRes.solPriceUsd) setSolPriceUsd(healthRes.solPriceUsd);
        setRpcStatus({
          status: 'connected',
          latencyMs: 18,
          activeRpc: healthRes.activeRpc
        });
      }

      if (Array.isArray(samplesRes)) {
        setSampleWallets(samplesRes);
        // Automatically load the first sample wallet (Alpha Smart Whale) if none loaded
        if (!walletData && samplesRes.length > 0) {
          screenWalletAddress(samplesRes[0].address);
        }
      }

      if (Array.isArray(trendingRes)) {
        setTrendingTokens(trendingRes);
      }

      if (Array.isArray(leaderboardRes)) {
        setLeaderboardData(leaderboardRes);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const screenWalletAddress = async (address, forceLive = false) => {
    if (!address) return;
    setIsLoadingWallet(true);
    setWalletError(null);

    try {
      const res = await fetch(`/api/wallet/${address.trim()}?sample=${!forceLive}&forceLive=${forceLive}&limit=50`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to screen wallet`);
      }
      const data = await res.json();
      setWalletData(data);
    } catch (err) {
      console.error('Screening error:', err);
      setWalletError(err.message);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const handleToggleWatchlist = (wallet) => {
    if (!wallet || !wallet.address) return;
    setWatchlist((prev) => {
      const exists = prev.some(w => w.address === wallet.address);
      if (exists) {
        return prev.filter(w => w.address !== wallet.address);
      }
      return [
        {
          address: wallet.address,
          alias: wallet.alias,
          winRate: wallet.summary?.winRate || wallet.winRate || 0,
          totalPnlSol: wallet.summary?.totalRealizedPnlSol || wallet.totalPnlSol || 0,
          smartScore: wallet.summary?.smartScore || wallet.smartScore || 50,
          savedAt: Date.now()
        },
        ...prev
      ];
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
      console.error(err);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08090d] text-slate-100 font-sans">
      {/* 1. Header */}
      <Header
        solPriceUsd={solPriceUsd}
        rpcStatus={rpcStatus}
        currency={currency}
        setCurrency={setCurrency}
        watchlistCount={watchlist.length}
        onRefresh={fetchInitialData}
        isRefreshing={isRefreshing}
      />

      {/* 2. Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        watchlistCount={watchlist.length}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'screener' && (
          <WalletScreener
            walletData={walletData}
            isLoading={isLoadingWallet}
            error={walletError}
            onScreenAddress={(addr) => screenWalletAddress(addr, false)}
            onForceLiveScan={(addr) => screenWalletAddress(addr, true)}
            currency={currency}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            sampleWallets={sampleWallets}
          />
        )}

        {activeTab === 'trending' && (
          <TrendingTokens
            tokens={trendingTokens}
            isLoading={isLoadingTrending}
            onRefresh={handleRefreshTrending}
            onInspectTraders={handleInspectTraders}
            onScreenWallet={(addr) => {
              setActiveTab('screener');
              screenWalletAddress(addr, false);
            }}
          />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard
            leaderboardData={leaderboardData}
            onScreenWallet={(addr) => {
              setActiveTab('screener');
              screenWalletAddress(addr);
            }}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {activeTab === 'watchlist' && (
          <Watchlist
            watchlist={watchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            onScreenWallet={(addr) => {
              setActiveTab('screener');
              screenWalletAddress(addr);
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

      {/* 4. Token Inspector Modal */}
      <TokenInspectorModal
        token={selectedToken}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onScreenWallet={handleScreenFromModal}
      />

      {/* 5. Footer */}
      <footer className="border-t border-white/5 py-6 bg-dark-950/80 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            💊 Pump.fun Wallet Screener &copy; {new Date().getFullYear()} &middot; Solana Mainnet
          </p>
          <p className="text-slate-600">
            Powered by Solana JSON-RPC &middot; DexScreener API &middot; Pump.fun Program
          </p>
        </div>
      </footer>
    </div>
  );
}
