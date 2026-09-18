import { PUMP_FUN_PROGRAM_ID, ROUTER_PROGRAMS } from './config.js';

export function parseTransaction(tx, targetWallet = null) {
  if (!tx || !tx.meta || !tx.transaction) return null;

  const isFailed = tx.meta.err !== null;
  const signature = tx.transaction.signatures?.[0] || 'unknown';
  const blockTime = tx.blockTime || Math.floor(Date.now() / 1000);
  const slot = tx.slot || 0;

  const accountKeys = tx.transaction.message.accountKeys || [];
  const accountPubkeys = accountKeys.map(a => (typeof a === 'string' ? a : a.pubkey));
  const feePayer = accountPubkeys[0] || '';

  // Determine user wallet: targetWallet or feePayer
  const userWallet = targetWallet || feePayer;
  const userIndex = accountPubkeys.indexOf(userWallet);

  // Check if pump.fun is involved
  const hasPumpFun = accountPubkeys.includes(PUMP_FUN_PROGRAM_ID);
  const logMessages = tx.meta.logMessages || [];
  const logsString = logMessages.join('\n');

  // Detect router or bot programs
  let routerUsed = null;
  for (const [progId, name] of Object.entries(ROUTER_PROGRAMS)) {
    if (accountPubkeys.includes(progId)) {
      routerUsed = name;
      break;
    }
  }

  // Detect action type from logs
  let action = 'unknown';
  if (logsString.includes('Instruction: Buy')) {
    action = 'buy';
  } else if (logsString.includes('Instruction: Sell')) {
    action = 'sell';
  } else if (logsString.includes('Instruction: Create')) {
    action = 'create';
  } else if (logsString.includes('Instruction: Migrate')) {
    action = 'migrate';
  }

  // Parse token balance changes
  const preTokens = tx.meta.preTokenBalances || [];
  const postTokens = tx.meta.postTokenBalances || [];

  // Filter token balance changes related to userWallet
  let matchedMint = null;
  let tokenChangeAmount = 0;
  let preUiAmount = 0;
  let postUiAmount = 0;

  // First check token balances owned by userWallet
  for (const post of postTokens) {
    if (post.owner === userWallet) {
      const pre = preTokens.find(p => p.accountIndex === post.accountIndex && p.mint === post.mint);
      const preAmt = pre?.uiTokenAmount?.uiAmount || 0;
      const postAmt = post.uiTokenAmount?.uiAmount || 0;
      const diff = postAmt - preAmt;

      if (Math.abs(diff) > 0 || post.mint.endsWith('pump')) {
        matchedMint = post.mint;
        tokenChangeAmount = diff;
        preUiAmount = preAmt;
        postUiAmount = postAmt;
        break;
      }
    }
  }

  // If not found by user owner, check if any token ending with 'pump' or involved in tx
  if (!matchedMint) {
    for (const post of postTokens) {
      if (post.mint && post.mint.endsWith('pump')) {
        matchedMint = post.mint;
        break;
      }
    }
  }

  // If still not found, check preTokens
  if (!matchedMint && preTokens.length > 0) {
    const pumpPre = preTokens.find(p => p.mint?.endsWith('pump'));
    matchedMint = pumpPre ? pumpPre.mint : preTokens[0]?.mint;
  }

  // Parse SOL balance change for the user
  let solChange = 0;
  if (userIndex !== -1 && tx.meta.preBalances && tx.meta.postBalances) {
    const preSol = (tx.meta.preBalances[userIndex] || 0) / 1e9;
    const postSol = (tx.meta.postBalances[userIndex] || 0) / 1e9;
    solChange = postSol - preSol; // negative if spent, positive if received
  }

  // If action wasn't determined by logs, deduce from solChange and tokenChange
  if (action === 'unknown') {
    if (tokenChangeAmount > 0 || solChange < -0.0001) {
      action = 'buy';
    } else if (tokenChangeAmount < 0 || solChange > 0.0001) {
      action = 'sell';
    }
  }

  // Extract sol_received or sol_cost from logs if available for exact precision
  let exactSolAmount = Math.abs(solChange);
  const solReceivedMatch = logsString.match(/sol_received:\s*(\d+)/i);
  const solCostMatch = logsString.match(/sol_cost:\s*(\d+)/i);

  if (action === 'sell' && solReceivedMatch) {
    exactSolAmount = parseInt(solReceivedMatch[1], 10) / 1e9;
  } else if (action === 'buy' && solCostMatch) {
    exactSolAmount = parseInt(solCostMatch[1], 10) / 1e9;
  } else {
    // If using balance diff, subtract approximate network gas (~0.000005 to 0.002) if buy
    if (action === 'buy' && exactSolAmount > 0.001) {
      exactSolAmount = Math.max(0.0001, exactSolAmount - 0.0005);
    }
  }

  const feePaid = (tx.meta.fee || 5000) / 1e9;

  return {
    signature,
    blockTime,
    timestamp: blockTime * 1000,
    slot,
    userWallet,
    action,
    mint: matchedMint,
    tokenAmount: Math.abs(tokenChangeAmount),
    tokenChangeAmount,
    preUiAmount,
    postUiAmount,
    solAmount: exactSolAmount,
    solChange,
    feePaid,
    isFailed,
    hasPumpFun,
    routerUsed
  };
}
