/**
 * Ergo Blockchain API Module (Read-Only)
 * 
 * Fetches public block data from Ergo blockchain with transaction details.
 * NO wallet integration, NO transactions — just reads public data.
 * 
 * Enhanced anti-spoofing: Uses block hash + random TX hash + timestamp
 * to make seed prediction practically impossible.
 */

import axios from 'axios';

// Ergo public API endpoint (free, no auth required)
const ERGO_API_BASE = 'https://api.ergoplatform.com/api/v1';

// Minimum transactions required in a block (for anti-spoofing)
const MIN_TX_COUNT = 3;

/**
 * Fetches block details including transaction list
 * API returns: { block: { header: {...}, blockTransactions: [...] }, references: {...} }
 * @param {string} blockId - Block hash/ID
 * @returns {Promise<object>} Block data with transactions
 */
async function getBlockWithTransactions(blockId) {
  const response = await axios.get(`${ERGO_API_BASE}/blocks/${blockId}`);
  // The actual block data is nested under response.data.block
  return response.data.block;
}

/**
 * Fetches recent blocks and finds one with enough transactions
 * @param {number} minTxCount - Minimum transaction count required
 * @returns {Promise<object>} Block summary with sufficient TXs
 */
async function findSuitableBlock(minTxCount = MIN_TX_COUNT) {
  // Fetch last 10 blocks to find one with enough TXs
  const response = await axios.get(`${ERGO_API_BASE}/blocks?limit=10`);
  const blocks = response.data.items;
  
  // Find first block with enough transactions
  for (const block of blocks) {
    if (block.transactionsCount >= minTxCount) {
      return block;
    }
  }
  
  // Fallback: use most recent block even if low TX count
  return blocks[0];
}

/**
 * Selects a deterministic transaction from the block
 * Uses timestamp to pick TX index - unpredictable but reproducible
 * @param {Array} transactions - List of transaction objects
 * @param {number} timestamp - Block timestamp
 * @returns {{ txHash: string, txIndex: number }}
 */
function selectDeterministicTx(transactions, timestamp) {
  if (!transactions || transactions.length === 0) {
    return { txHash: '', txIndex: 0 };
  }
  
  // Use timestamp to deterministically select TX
  const txIndex = timestamp % transactions.length;
  // Each transaction object has an 'id' property
  const txHash = transactions[txIndex].id;
  
  return { txHash, txIndex };
}

/**
 * Fetches the latest suitable block with transaction data
 * Returns all data needed for enhanced anti-spoofing seed generation
 * 
 * @returns {Promise<{
 *   blockHeight: number,
 *   blockHash: string,
 *   timestamp: number,
 *   txCount: number,
 *   txHash: string,
 *   txIndex: number
 * }>}
 * @throws {Error} If API request fails
 */
export async function getLatestBlock() {
  try {
    // 1. Find a block with enough transactions
    const blockSummary = await findSuitableBlock(MIN_TX_COUNT);
    
    // 2. Fetch full block details with TX list
    const blockData = await getBlockWithTransactions(blockSummary.id);
    
    // 3. Extract transactions array (blockTransactions contains full TX objects)
    const transactions = blockData.blockTransactions || [];
    
    // 4. Deterministically select one TX using timestamp
    const { txHash, txIndex } = selectDeterministicTx(transactions, blockSummary.timestamp);
    
    return {
      blockHeight: blockSummary.height,
      blockHash: blockSummary.id,
      timestamp: blockSummary.timestamp,
      txCount: transactions.length,
      txHash: txHash,
      txIndex: txIndex
    };
  } catch (error) {
    // Re-throw with user-friendly message
    if (error.response) {
      throw new Error(`Ergo API error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('Cannot reach Ergo API. Check your internet connection.');
    } else {
      throw new Error(`Failed to fetch block: ${error.message}`);
    }
  }
}

/**
 * Fetches a specific block by height (for verification)
 * @param {number} height - Block height
 * @returns {Promise<object>} Block data with TX info
 */
export async function getBlockByHeight(height) {
  try {
    // Get block ID by height
    const response = await axios.get(`${ERGO_API_BASE}/blocks/at/${height}`);
    const blockIds = response.data;
    
    if (!blockIds || blockIds.length === 0) {
      throw new Error(`No block found at height ${height}`);
    }
    
    // Fetch full block details
    const blockData = await getBlockWithTransactions(blockIds[0]);
    const transactions = blockData.blockTransactions || [];
    const timestamp = blockData.header.timestamp;
    const { txHash, txIndex } = selectDeterministicTx(transactions, timestamp);
    
    return {
      blockHeight: height,
      blockHash: blockIds[0],
      timestamp: timestamp,
      txCount: transactions.length,
      txHash: txHash,
      txIndex: txIndex
    };
  } catch (error) {
    throw new Error(`Failed to fetch block ${height}: ${error.message}`);
  }
}

export default { getLatestBlock, getBlockByHeight };
