const candidates = new Map();
const profileCache = new Map();
const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000;

export function registerLiveWallet(address, source, metadata = {}) {
  if (!address || typeof address !== 'string') return;

  const current = candidates.get(address) || {};
  candidates.set(address, {
    address,
    source: source || current.source,
    firstSeenAt: current.firstSeenAt || Date.now(),
    lastSeenAt: Date.now(),
    ...current,
    ...metadata
  });
}

export function getLiveWalletCandidates(limit = 40) {
  return Array.from(candidates.values())
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .slice(0, limit);
}

export function getCachedWalletProfile(address) {
  const entry = profileCache.get(address);
  if (!entry || Date.now() - entry.cachedAt > PROFILE_CACHE_TTL_MS) {
    profileCache.delete(address);
    return null;
  }
  return entry.profile;
}

export function cacheWalletProfile(address, profile) {
  profileCache.set(address, { cachedAt: Date.now(), profile });
}

export function getLiveWalletStats() {
  return {
    discoveredWallets: candidates.size,
    cachedProfiles: profileCache.size
  };
}
