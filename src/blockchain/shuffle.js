/**
 * Deterministic Card Shuffle Module (Enhanced Anti-Spoofing)
 * 
 * Uses blockchain hash + transaction hash + timestamp for provably fair shuffling.
 * Same inputs ALWAYS produce same shuffle — anyone can verify.
 * 
 * Anti-spoofing: An attacker would need to control:
 *   1. Block hash (determined by miners)
 *   2. Which TXs are in the block (determined by network)
 *   3. TX timing/ordering (unpredictable)
 *   4. Game ID (generated client-side)
 *   5. TX index selection (based on timestamp)
 * 
 * Example:
 *   const seed = generateSeed({ blockHash, txHash, timestamp, txIndex }, 'game-123');
 *   const deck = shuffleDeck(seed);
 *   const isValid = verifyShuffle({ blockHash, txHash, timestamp, txIndex }, 'game-123', deck);
 */

/**
 * Creates a seeded pseudo-random number generator (LCG algorithm)
 * @param {string} seed - Hex string seed
 * @returns {function(): number} Function returning random numbers 0-1
 */
function seedRandom(seed) {
  // Convert hex seed to numeric value (use first 8 chars for 32-bit int)
  let state = parseInt(seed.slice(0, 8), 16);
  
  // Linear Congruential Generator constants (same as glibc)
  const a = 1103515245;
  const c = 12345;
  const m = Math.pow(2, 31);
  
  return function() {
    state = (a * state + c) % m;
    return state / m;
  };
}

/**
 * Simple hash function for combining inputs
 * @param {string} input - String to hash
 * @returns {number} 32-bit hash value
 */
function simpleHash(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates deterministic seed from block data and game ID
 * Enhanced version with TX hash for anti-spoofing
 * 
 * @param {object|string} blockData - Block data object or legacy blockHash string
 * @param {string} blockData.blockHash - Ergo block hash
 * @param {string} blockData.txHash - Selected transaction hash
 * @param {number} blockData.timestamp - Block timestamp
 * @param {number} blockData.txIndex - Index of selected TX
 * @param {string} gameId - Unique game identifier
 * @returns {string} 64-char hex string seed
 * 
 * @example
 *   // Enhanced (recommended)
 *   generateSeed({ blockHash: 'abc...', txHash: 'def...', timestamp: 123, txIndex: 5 }, 'game-1')
 *   
 *   // Legacy (backward compatible)
 *   generateSeed('abc123...', 'game-1')
 */
export function generateSeed(blockData, gameId) {
  let input;
  
  // Support both object (new) and string (legacy) formats
  if (typeof blockData === 'object' && blockData !== null) {
    const { blockHash, txHash, timestamp, txIndex } = blockData;
    // Combine all entropy sources
    // Format: blockHash:txHash:timestamp:gameId:txIndex
    input = `${blockHash}:${txHash || ''}:${timestamp || 0}:${gameId}:${txIndex || 0}`;
  } else {
    // Legacy format: just blockHash string
    input = `${blockData}:${gameId}`;
  }
  
  // Generate multiple hash rounds for better distribution
  const hash1 = simpleHash(input);
  const hash2 = simpleHash(input + hash1.toString());
  const hash3 = simpleHash(hash1.toString() + hash2.toString());
  const hash4 = simpleHash(hash2.toString() + hash3.toString());
  
  // Combine into 64-char hex string
  const hex1 = hash1.toString(16).padStart(8, '0');
  const hex2 = hash2.toString(16).padStart(8, '0');
  const hex3 = hash3.toString(16).padStart(8, '0');
  const hex4 = hash4.toString(16).padStart(8, '0');
  
  // Create 64-char seed with good distribution
  return (hex1 + hex2 + hex3 + hex4 + hex1 + hex2 + hex3 + hex4).slice(0, 64);
}

/**
 * Creates a standard 52-card deck
 * @returns {string[]} Array of 52 cards in order
 */
export function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(`${rank}${suit}`);
    }
  }
  
  return deck;
}

/**
 * Shuffles deck using Fisher-Yates algorithm with seeded RNG
 * @param {string} seed - Hex string seed (from generateSeed)
 * @returns {string[]} Shuffled deck array
 */
export function shuffleDeck(seed) {
  const deck = createDeck();
  const random = seedRandom(seed);
  
  // Fisher-Yates shuffle (in-place, O(n))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}

/**
 * Verifies a shuffle matches expected output for given inputs
 * @param {object|string} blockData - Block data object or legacy blockHash string
 * @param {string} gameId - Game identifier
 * @param {string[]} claimedDeck - Deck order to verify
 * @returns {boolean} True if deck matches expected shuffle
 */
export function verifyShuffle(blockData, gameId, claimedDeck) {
  const seed = generateSeed(blockData, gameId);
  const expectedDeck = shuffleDeck(seed);
  
  // Compare arrays
  if (claimedDeck.length !== expectedDeck.length) {
    return false;
  }
  
  for (let i = 0; i < expectedDeck.length; i++) {
    if (claimedDeck[i] !== expectedDeck[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Extracts seed components for display/verification
 * @param {object} blockData - Block data object
 * @param {string} gameId - Game ID
 * @returns {object} Seed components for transparency
 */
export function getSeedComponents(blockData, gameId) {
  const { blockHash, txHash, timestamp, txIndex } = blockData;
  return {
    blockHash,
    txHash,
    timestamp,
    txIndex,
    gameId,
    combinedInput: `${blockHash}:${txHash || ''}:${timestamp || 0}:${gameId}:${txIndex || 0}`,
    seed: generateSeed(blockData, gameId)
  };
}

export default { generateSeed, createDeck, shuffleDeck, verifyShuffle, getSeedComponents };
