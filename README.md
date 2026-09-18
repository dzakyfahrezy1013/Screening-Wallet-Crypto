# 💊 PumpScreen

> **Real-time wallet screening and smart-money radar for Pump.fun meme coins on Solana.**

PumpScreen helps you inspect Solana wallets, understand their Pump.fun trading behavior, find active traders behind newly minted tokens, and keep a watchlist of wallets worth monitoring.

![PumpScreen dashboard](https://placehold.co/1400x760/08090d/10b981?text=PumpScreen+Dashboard)

> **Important:** This is an analytics and research tool, not financial advice. Meme coins are highly volatile. Never connect a wallet or risk funds based only on a score, badge, or historical result.

---

## ✨ What can it do?

| Feature | What you get |
| --- | --- |
| **Wallet Screener** | Win rate, realized/unrealized PnL, profit factor, volume, hold time, traded tokens, and recent swaps. |
| **Live Mints** | Newly created Pump.fun tokens from the PumpPortal WebSocket stream. No manual refresh required. |
| **Find Whales** | Inspect recent buyers and sellers for a token, then screen any wallet in one click. |
| **Smart Money Leaderboard** | Compare tracked profiles by PnL, win rate, profit factor, and Smart Score. |
| **Wallet Watchlist** | Save wallets locally in the browser and export the list as JSON. |
| **Custom RPC** | Use a Helius, QuickNode, Alchemy, Shyft, or other Solana RPC endpoint for higher limits. |
| **SOL/USD display** | Toggle between SOL and USD using a live SOL price from DexScreener. |

### Live data vs sample data

The application has two clearly different data paths:

- **Live wallet scans:** custom wallet addresses are read from Solana Mainnet RPC and parsed from on-chain transactions.
- **Live market data:** token prices and market metrics come from DexScreener.
- **Live mint feed:** new token creation events come from PumpPortal WebSocket and appear in **Trending Pump Coins → Live Mints (Sub-sec)**.
- **Preset profiles:** the four Quick Presets are intentionally curated demo profiles so a new user can explore the interface immediately. They are labeled **Preset Sample**.
- Use **Scan Live On-Chain (Solana RPC)** on a preset profile to bypass its demo profile and query the real wallet address.

---

## 🧭 Quick start

### Requirements

- Node.js **18+** (Node 20+ recommended)
- npm
- Internet access to Solana RPC, DexScreener, and PumpPortal

### 1. Clone and install

```bash
git clone https://github.com/dzakyfahrezy1013/Screening-Wallet-Crypto.git
cd Screening-Wallet-Crypto
npm install
```

### 2. Start the app

For the simplest production-style run:

```bash
npm run build
npm start
```

Open **http://localhost:4000**.

For development with Vite hot reload, use two terminals:

```bash
# Terminal 1 — API + live PumpPortal WebSocket
npm run dev:server

# Terminal 2 — React/Vite frontend
npm run dev:client
```

Open **http://localhost:5173**. Vite proxies `/api` requests to the backend on port `4000`.

### 3. Screen a wallet

1. Open **Wallet Screener**.
2. Paste a Solana wallet address.
3. Click **Screen Wallet**.
4. Review the wallet badge, Smart Score, PnL, win rate, hold duration, and token table.
5. Open a transaction or token in Solscan, Pump.fun, or DexScreener for independent verification.

---

## 🧪 Explore the live feed

1. Open **Trending Pump Coins**.
2. Choose **Live Mints (Sub-sec)**.
3. New Pump.fun mints appear with the token symbol, initial buy, market cap, creator wallet, and mint time.
4. Click **Screen Dev** to inspect the creator wallet's on-chain history.

The backend keeps a small in-memory buffer of recent mints and reconnects the PumpPortal WebSocket after a disconnect.

---

## 🧱 How it works

```text
React + Tailwind UI
        │
        ▼
Express REST API ───────────────► DexScreener (prices, pairs, market data)
        │
        ├────────────────────────► Solana Mainnet RPC (wallet transactions)
        │
        └────────────────────────► PumpPortal WebSocket (new Pump.fun mints)
```

### Main directories

```text
src/
  App.jsx                    App state, routing between dashboard tabs, watchlist
  components/                Screener, live feed, leaderboard, settings, tables
server/
  index.js                   Express API and PumpPortal live stream
  screener.js                Wallet metrics, PnL aggregation, badges, scoring
  parser.js                  Pump.fun transaction parsing
  solanaRpc.js               RPC fallback pool, retry, cache, throttling
  dexscreener.js             SOL price and token market data
  sampleWallets.js           Curated demo profiles for onboarding
```

### Wallet metrics

PumpScreen derives metrics from parsed transactions, including:

- **Win rate:** profitable closed token positions divided by closed positions.
- **Realized PnL:** sell proceeds minus buy cost for closed positions.
- **Unrealized PnL:** estimated value of remaining tokens using current market data.
- **Profit factor:** gross profits divided by gross losses.
- **Average hold duration:** elapsed time between the first buy and final sell/current observation.
- **Smart Score:** a heuristic indicator based on profitability, win rate, profit factor, and risk signals.

Scores and badges are analytical heuristics, not guarantees of future performance.

---

## 🔌 API reference

The API runs on `http://localhost:4000` by default.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | API, RPC, SOL price, and PumpPortal WebSocket status. |
| `GET /api/sol-price` | Current SOL/USD price from DexScreener. |
| `GET /api/wallet/:address` | Screen a wallet. Add `?forceLive=true` to bypass demo profiles. |
| `GET /api/wallet-samples` | List the curated onboarding profiles. |
| `GET /api/tokens/trending?limit=20` | Fetch trending Solana/Pump.fun pairs. |
| `GET /api/tokens/live-feed` | Read the current live-mint buffer. |
| `GET /api/tokens/live-sse` | Server-Sent Events stream for live mints. |
| `GET /api/token/:mint` | Fetch token market data. |
| `GET /api/token/:mint/traders` | Extract recent traders from token transactions. |
| `GET /api/leaderboard` | Read the tracked Smart Money leaderboard. |
| `GET /api/settings/rpc` | Check active RPC and latency. |
| `POST /api/settings/rpc` | Set a custom RPC with `{ "rpcUrl": "https://..." }`. |

Example live wallet request:

```bash
curl "http://localhost:4000/api/wallet/<SOLANA_ADDRESS>?forceLive=true&limit=50"
```

---

## ⚙️ Custom RPC

Public Solana RPC endpoints can return HTTP `429 Too Many Requests` during batch analysis. Open **Settings & RPC** and provide a private endpoint when screening frequently.

Good options include:

- [Helius](https://www.helius.dev/)
- [QuickNode](https://www.quicknode.com/)
- [Alchemy](https://www.alchemy.com/)
- [Shyft](https://shyft.to/)

The app keeps RPC configuration in memory for the running server. Do not commit API keys to the repository.

---

## 🛠️ Configuration

Optional environment variables:

```text
PORT=4000
SOLANA_RPC_URL=https://your-rpc.example.com
```

You can also change the RPC from the Settings screen without editing files.

---

## ✅ Verification

The project has been verified with:

```bash
npm run build
```

The live API has also been smoke-tested for:

- frontend static serving;
- health and RPC status;
- preset and live wallet screening;
- DexScreener trending tokens;
- PumpPortal live token feed;
- token trader inspection;
- Smart Money leaderboard;
- browser tab navigation and live-feed rendering.

---

## ⚠️ Data and risk notes

- Public RPC providers may throttle requests or return incomplete transaction batches.
- Some transactions cannot be classified perfectly from public parsed RPC responses, especially aggregator or bot-routed swaps.
- Token prices, liquidity, and market caps can change rapidly.
- A high historical win rate does not mean a wallet is safe to copy.
- Never expose private keys or seed phrases. PumpScreen does not need them.

---

## 📄 License

No license has been declared yet. Add a license before distributing the project for reuse.
