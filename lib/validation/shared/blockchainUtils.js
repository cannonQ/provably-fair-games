/**
 * Blockchain Utilities for Server-Side Validation
 *
 * Provides functions for:
 * - Ergo blockchain verification
 * - Deterministic seed generation
 * - Block data fetching
 */

const ERGO_API = 'https://api.ergoplatform.com/api/v1';

/**
 * Verify block exists on Ergo blockchain
 * @param {string} blockHash - Block hash to verify
 * @param {number} blockHeight - Expected block height
 * @returns {Promise<{valid: boolean, reason?: string, txCount?: number, timestamp?: number}>}
 */
export async function verifyBlock(blockHash, blockHeight) {
  try {
    const response = await fetch(`${ERGO_API}/blocks/${blockHash}`);

    if (!response.ok) {
      return { valid: false, reason: 'Block not found on blockchain' };
    }

    const data = await response.json();
    const block = data.block;

    // Verify height matches
    if (block.header.height !== blockHeight) {
      return {
        valid: false,
        reason: `Block height mismatch: expected ${blockHeight}, got ${block.header.height}`
      };
    }

    return {
      valid: true,
      txCount: block.blockTransactions?.length || 0,
      timestamp: block.header.timestamp
    };
  } catch (error) {
    return {
      valid: false,
      reason: `Failed to fetch block from Ergo API: ${error.message}`
    };
  }
}

/**
 * Simple hash function (MUST match client-side shuffle.js)
 * Used for deterministic seed generation
 * @param {string} str - String to hash
 * @returns {string} Hex hash string
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate seed from blockchain data and game ID
 * MUST match client-side implementation exactly for verification
 * @param {Object} blockData - Block data object
 * @param {string} blockData.blockHash - Block hash
 * @param {string} blockData.txHash - Transaction hash
 * @param {number} blockData.timestamp - Block timestamp
 * @param {number} blockData.txIndex - Transaction index in block
 * @param {string} gameId - Unique game identifier
 * @returns {string} Deterministic seed string
 */
export function generateSeed(blockData, gameId) {
  const { blockHash, txHash, timestamp, txIndex } = blockData;
  const combined = `${blockHash}${txHash || ''}${timestamp || ''}${gameId}${txIndex || 0}`;

  let seed = '';
  for (let i = 0; i < 4; i++) {
    seed += simpleHash(combined + i);
  }
  return seed;
}

/**
 * Fetch full block data including transactions
 * Useful for deep verification of transaction-based seeds
 * @param {string} blockHash - Block hash to fetch
 * @returns {Promise<{valid: boolean, block?: Object, reason?: string}>}
 */
export async function getBlockData(blockHash) {
  try {
    const response = await fetch(`${ERGO_API}/blocks/${blockHash}`);

    if (!response.ok) {
      return { valid: false, reason: 'Block not found' };
    }

    const data = await response.json();
    return { valid: true, block: data.block };
  } catch (error) {
    return {
      valid: false,
      reason: `Failed to fetch block: ${error.message}`
    };
  }
}

/**
 * Verify transaction exists in block
 * @param {string} blockHash - Block containing transaction
 * @param {string} txHash - Transaction hash to verify
 * @param {number} expectedIndex - Expected transaction index
 * @returns {Promise<{valid: boolean, reason?: string}>}
 */
export async function verifyTransaction(blockHash, txHash, expectedIndex) {
  const blockData = await getBlockData(blockHash);

  if (!blockData.valid) {
    return { valid: false, reason: blockData.reason };
  }

  const transactions = blockData.block.blockTransactions || [];
  const txIndex = transactions.findIndex(tx => tx.id === txHash);

  if (txIndex === -1) {
    return { valid: false, reason: 'Transaction not found in block' };
  }

  if (expectedIndex !== undefined && txIndex !== expectedIndex) {
    return {
      valid: false,
      reason: `Transaction index mismatch: expected ${expectedIndex}, got ${txIndex}`
    };
  }

  return { valid: true };
}

/**
 * Verify seed matches blockchain data + gameId
 * @param {string} seed - Claimed seed from client
 * @param {Object} blockData - Block data used to generate seed
 * @param {string} gameId - Game identifier
 * @returns {boolean} True if seed is valid
 */
export function verifySeed(seed, blockData, gameId) {
  const regeneratedSeed = generateSeed(blockData, gameId);
  return seed === regeneratedSeed;
}

/**
 * Extract block height from game ID (some games encode it)
 * @param {string} gameId - Game identifier
 * @returns {number|null} Block height if found, null otherwise
 */
export function extractBlockHeightFromGameId(gameId) {
  // Format: GAME-{blockHeight}-{random}
  const match = gameId.match(/^[A-Z]+-(\d+)-/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Validate game ID format for specific game type
 * @param {string} gameId - Game identifier
 * @param {string} gameType - Game type (solitaire, yahtzee, etc.)
 * @returns {boolean} True if format is valid
 */
export function validateGameIdFormat(gameId, gameType) {
  const patterns = {
    solitaire: /^SOL-\d+-\w+$/,
    garbage: /^GRB-\d+-\w+$/,
    yahtzee: /^YAH-\d+-\w+$/,
    blackjack: /^BJK-\d+-\w+$/,
    '2048': /^2048-\w{8}-\d+-\w{4}$/,
    backgammon: /^BGM-\d+-\w{9}$/
  };

  const pattern = patterns[gameType];
  return pattern ? pattern.test(gameId) : false;
}

export default {
  verifyBlock,
  generateSeed,
  getBlockData,
  verifyTransaction,
  verifySeed,
  extractBlockHeightFromGameId,
  validateGameIdFormat
};
