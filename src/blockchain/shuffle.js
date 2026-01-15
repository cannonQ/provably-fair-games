/**
 * Deterministic Card Shuffle Module (Enhanced Anti-Spoofing)
 *
 * Uses blockchain hash + transaction hash + timestamp for provably fair shuffling.
 * Same inputs ALWAYS produce same shuffle — anyone can verify.
 *
 * Supports two deck formats:
 * - shuffleDeck(seed) → card objects {id, rank, suit, faceUp} (for Solitaire)
 * - shuffleDeckStrings(seed) → card strings "A♠", "7♥" (for Garbage)
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
 *
 * @param {object|string} blockData - Block data object or legacy blockHash string
 * @param {string} gameId - Unique game identifier
 * @returns {string} 64-char hex string seed
 */
export function generateSeed(blockData, gameId) {
  let input;

  // Support both object (new) and string (legacy) formats
  if (typeof blockData === 'object' && blockData !== null) {
    const { blockHash, hash, txHash, timestamp, txIndex } = blockData;
    const actualHash = blockHash || hash;
    input = `${actualHash}:${txHash || ''}:${timestamp || 0}:${gameId}:${txIndex || 0}`;
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

  return (hex1 + hex2 + hex3 + hex4 + hex1 + hex2 + hex3 + hex4).slice(0, 64);
}

/**
 * Creates a standard 52-card deck as strings (for Garbage)
 * @returns {string[]} Array of 52 card strings like "A♠", "7♥"
 */
export function createDeckStrings() {
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
 * Creates a standard 52-card deck as objects (for Solitaire)
 * @returns {Object[]} Array of 52 card objects
 */
export function createDeck() {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      const suitInitial = suit[0].toUpperCase(); // H, D, C, S
      deck.push({
        id: `${rank}${suitInitial}`,
        rank,
        suit,
        faceUp: false
      });
    }
  }

  return deck;
}

/**
 * Shuffles deck as strings (for Garbage)
 * @param {string} seed - Hex string seed
 * @returns {string[]} Shuffled deck of card strings
 */
export function shuffleDeckStrings(seed) {
  const deck = createDeckStrings();
  const random = seedRandom(seed);

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Shuffles deck as objects (for Solitaire)
 * @param {string} seed - Hex string seed
 * @returns {Object[]} Shuffled deck of card objects
 */
export function shuffleDeck(seed) {
  const deck = createDeck();
  const random = seedRandom(seed);

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * Verifies a shuffle matches expected output for given inputs
 * Supports both string and object deck formats
 * @param {object|string} blockData - Block data object or legacy blockHash string
 * @param {string} gameId - Game identifier
 * @param {Array} claimedDeck - Deck order to verify (strings or objects)
 * @returns {boolean} True if deck matches expected shuffle
 */
export function verifyShuffle(blockData, gameId, claimedDeck) {
  if (!claimedDeck || claimedDeck.length !== 52) {
    return false;
  }

  const seed = generateSeed(blockData, gameId);
  
  // Detect format based on first element
  const isObjectFormat = typeof claimedDeck[0] === 'object';
  const expectedDeck = isObjectFormat ? shuffleDeck(seed) : shuffleDeckStrings(seed);

  for (let i = 0; i < expectedDeck.length; i++) {
    if (isObjectFormat) {
      // Compare by ID for object format
      if (claimedDeck[i]?.id !== expectedDeck[i]?.id) {
        return false;
      }
    } else {
      // Direct comparison for string format
      if (claimedDeck[i] !== expectedDeck[i]) {
        return false;
      }
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
  const { blockHash, hash, txHash, timestamp, txIndex } = blockData;
  const actualHash = blockHash || hash;
  return {
    blockHash: actualHash,
    txHash,
    timestamp,
    txIndex,
    gameId,
    combinedInput: `${actualHash}:${txHash || ''}:${timestamp || 0}:${gameId}:${txIndex || 0}`,
    seed: generateSeed(blockData, gameId)
  };
}

export default { 
  generateSeed, 
  createDeck, 
  createDeckStrings,
  shuffleDeck, 
  shuffleDeckStrings,
  verifyShuffle, 
  getSeedComponents 
};
