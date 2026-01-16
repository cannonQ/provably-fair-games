/**
 * Block Traversal Logic for Yahtzee
 * 
 * Traverses the Ergo blockchain transaction graph to get different block data
 * for each roll. Instead of fetching a new block on every roll (which could be
 * manipulated if player waits), we trace backwards through transaction inputs
 * to historical blocks.
 * 
 * TRAVERSAL PATTERN:
 * - Roll 1 of each turn: Use anchor block (fetched at game start)
 * - Roll 2: Trace tx[0] from anchor → find its input box → find parent block
 * - Roll 3: Continue tracing from roll 2's block
 * 
 * If traversal hits a dead end (coinbase/mining reward with no input), restart
 * with a fresh block + now() timestamp. Player can't predict when this happens.
 */

import axios from 'axios';

const API_BASE = 'https://api.ergoplatform.com/api/v1';
const MIN_TX_COUNT = 3;

/**
 * Initialize anchor block at game start
 * @returns {Promise<Object>} Anchor object with block data and tx list
 */
export async function initializeAnchor() {
  try {
    // Fetch recent blocks to find one with enough TXs
    const blocksRes = await axios.get(`${API_BASE}/blocks?limit=10`);
    const blocks = blocksRes.data.items;
    
    // Find first block with enough transactions
    let blockSummary = blocks[0];
    for (const block of blocks) {
      if (block.transactionsCount >= MIN_TX_COUNT) {
        blockSummary = block;
        break;
      }
    }
    
    // Fetch full block details with transactions
    const blockRes = await axios.get(`${API_BASE}/blocks/${blockSummary.id}`);
    const blockData = blockRes.data.block; // API nests under .block
    
    const transactions = blockData.blockTransactions || [];
    
    if (transactions.length < MIN_TX_COUNT) {
      throw new Error('Block has insufficient transactions for tracing');
    }
    
    // Build txList with hash and index
    const txList = transactions.map((tx, index) => ({
      txHash: tx.id,
      txIndex: index
    }));
    
    return {
      blockHeight: blockSummary.height,
      blockHash: blockSummary.id,
      timestamp: blockSummary.timestamp,
      txList: txList,
      txCount: transactions.length
    };
  } catch (error) {
    console.error('Failed to initialize anchor:', error);
    throw new Error(`Failed to fetch anchor block: ${error.message}`);
  }
}

/**
 * Get roll source for a specific turn and roll
 * @param {Object} anchor - Anchor block data from initializeAnchor()
 * @param {Object} traceState - Current trace state (mutated during traversal)
 * @param {number} turnNumber - Current turn (1-13)
 * @param {number} rollNumber - Roll within turn (1-3)
 * @returns {Promise<Object>} Roll source with block data
 */
export async function getSourceForRoll(anchor, traceState, turnNumber, rollNumber) {
  // Roll 1 of any turn: use anchor block
  if (rollNumber === 1) {
    // Use different TX from anchor for each turn
    const txIdx = Math.min(turnNumber - 1, anchor.txList.length - 1);
    const txData = anchor.txList[txIdx];
    
    // Reset trace state for new turn
    traceState.currentTxHash = txData.txHash;
    traceState.currentBlockHeight = anchor.blockHeight;
    traceState.traceDepth = 0;
    
    const source = {
      blockHeight: anchor.blockHeight,
      blockHash: anchor.blockHash,
      txHash: txData.txHash,
      timestamp: anchor.timestamp,
      txIndex: txData.txIndex,
      source: 'anchor',
      traceDepth: 0,
      nowTimestamp: false
    };
    
    traceState.lastSource = source;
    return source;
  }
  
  // Roll 2 or 3: trace backwards through transaction graph
  try {
    const traced = await traceToNextBlock(traceState.currentTxHash, traceState);
    
    if (traced) {
      // Successful trace - update state for next potential trace
      traceState.currentTxHash = traced.txHash;
      traceState.currentBlockHeight = traced.blockHeight;
      traceState.traceDepth++;
      traceState.lastSource = traced;
      return traced;
    }
  } catch (error) {
    console.error('Trace failed:', error.message);
  }
  
  // Dead end or error - restart with fresh block
  return await handleDeadEnd(traceState);
}

/**
 * Trace backwards through transaction inputs to find parent block
 * 
 * Flow: currentTx → input box → parent tx that created box → parent's block
 * 
 * @param {string} currentTxHash - Transaction to trace from
 * @param {Object} traceState - Current trace state
 * @returns {Promise<Object|null>} Roll source or null if dead end
 */
export async function traceToNextBlock(currentTxHash, traceState) {
  // Step 1: Fetch the current transaction
  const txRes = await axios.get(`${API_BASE}/transactions/${currentTxHash}`);
  const tx = txRes.data;
  
  // Check if this is a coinbase (no inputs = mining reward)
  if (!tx.inputs || tx.inputs.length === 0) {
    console.log('Dead end: coinbase transaction (no inputs)');
    return null;
  }
  
  // Step 2: Get the first input box ID
  const inputBoxId = tx.inputs[0].boxId;
  
  // Step 3: Fetch the input box to find what TX created it
  const boxRes = await axios.get(`${API_BASE}/boxes/${inputBoxId}`);
  const box = boxRes.data;
  
  // The box has transactionId = the TX that created this box
  const parentTxId = box.transactionId;
  if (!parentTxId) {
    console.log('Dead end: box has no parent transaction');
    return null;
  }
  
  // Step 4: Fetch parent transaction to get its block info
  const parentTxRes = await axios.get(`${API_BASE}/transactions/${parentTxId}`);
  const parentTx = parentTxRes.data;
  
  // Parent TX should have blockId field
  const parentBlockId = parentTx.blockId;
  if (!parentBlockId) {
    console.log('Dead end: parent transaction has no blockId');
    return null;
  }
  
  // Step 5: Fetch the parent block for full details
  const blockRes = await axios.get(`${API_BASE}/blocks/${parentBlockId}`);
  const blockData = blockRes.data.block; // API nests under .block
  
  // Find TX index within the block
  const txs = blockData.blockTransactions || [];
  const txIndex = txs.findIndex(t => t.id === parentTxId);
  
  return {
    blockHeight: blockData.header.height,
    blockHash: blockData.header.id,
    txHash: parentTxId,
    timestamp: blockData.header.timestamp,
    txIndex: Math.max(0, txIndex),
    source: 'trace',
    traceDepth: traceState.traceDepth + 1,
    parentTxHash: currentTxHash,
    nowTimestamp: false
  };
}

/**
 * Handle dead end by fetching fresh block with now() timestamp
 * This prevents manipulation since player can't predict coinbase encounters
 * @param {Object} traceState - Current trace state (mutated)
 * @returns {Promise<Object>} Fresh roll source
 */
async function handleDeadEnd(traceState) {
  console.log('Handling dead end - fetching fresh block with now() timestamp');
  
  // Fetch current block
  const blocksRes = await axios.get(`${API_BASE}/blocks?limit=1`);
  const blockSummary = blocksRes.data.items[0];
  
  const blockRes = await axios.get(`${API_BASE}/blocks/${blockSummary.id}`);
  const blockData = blockRes.data.block;
  
  // Use NOW timestamp, not block timestamp - this adds unpredictability
  const nowTimestamp = Date.now();
  
  // Select a transaction from this block
  const txs = blockData.blockTransactions || [];
  const txIndex = Math.min(traceState.traceDepth, Math.max(0, txs.length - 1));
  const tx = txs[txIndex] || txs[0];
  
  const source = {
    blockHeight: blockData.header.height,
    blockHash: blockData.header.id,
    txHash: tx?.id || blockData.header.id,
    timestamp: nowTimestamp,
    txIndex: txIndex,
    source: 'restart',
    traceDepth: 0,
    reason: 'dead_end_coinbase',
    nowTimestamp: true
  };
  
  // Update trace state - this becomes new anchor for subsequent traces
  traceState.currentTxHash = source.txHash;
  traceState.currentBlockHeight = source.blockHeight;
  traceState.traceDepth = 0;
  traceState.lastSource = source;
  
  return source;
}

/**
 * Create initial trace state for a new game
 * @returns {Object} Fresh trace state
 */
export function createInitialTraceState() {
  return {
    currentTxHash: null,
    currentBlockHeight: null,
    traceDepth: 0,
    lastSource: null
  };
}

/**
 * Build verification trail for a completed game
 * @param {Array} rollHistory - Array of all roll sources used
 * @returns {Object} Verification data for blockchain proof
 */
export function buildVerificationTrail(rollHistory) {
  return {
    totalRolls: rollHistory.length,
    rolls: rollHistory.map((source, idx) => ({
      rollIndex: idx,
      turn: source.turn,
      roll: source.roll,
      source: source.source,
      blockHeight: source.blockHeight,
      blockHash: source.blockHash,
      txHash: source.txHash,
      timestamp: source.timestamp,
      txIndex: source.txIndex,
      traceDepth: source.traceDepth,
      parentTxHash: source.parentTxHash || null,
      nowTimestamp: source.nowTimestamp || false,
      seed: source.seed,
      diceValues: source.diceValues
    }))
  };
}

export default {
  initializeAnchor,
  getSourceForRoll,
  traceToNextBlock,
  createInitialTraceState,
  buildVerificationTrail
};
