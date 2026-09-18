// Pump.fun & Solana Program IDs and configuration
export const PUMP_FUN_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
export const PUMP_FEE_RECIPIENT = 'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM';
export const RAYDIUM_V4_PROGRAM_ID = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
export const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

// Bot & Router Program IDs commonly used on pump.fun
export const ROUTER_PROGRAMS = {
  'GMgnVFR8Jb39LoXsEVzb3DvBy3ywCmdmJquHUy1Lrkqb': 'GMGN Router',
  'troj43uVdNuCpL9jWv1sV2Wv7Vv9sT6wVqX4bF3nJ9q': 'Trojan Bot',
  'minTcGQbT3nC2V5X8P7Nq6f9hK4tY2rS5vE8wA1bC3d': 'Mint Bot',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter V6',
};

// RPC Endpoints pool (public fallbacks + user custom)
export const DEFAULT_RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-mainnet.rpc.extrnode.com'
];

export const CONFIG = {
  port: process.env.PORT || 4000,
  defaultRpcUrl: process.env.SOLANA_RPC_URL || DEFAULT_RPCS[0],
  customRpcUrl: null,
  maxSignaturesLimit: 80,
  batchSize: 10,
  cacheTtlMs: 60 * 1000, // 1 minute cache for wallet queries
};
