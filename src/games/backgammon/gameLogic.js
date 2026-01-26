/**
 * Backgammon Game Logic
 *
 * Core rules, dice functions, movement helpers, and win detection.
 * Uses blockchain hash for provably fair dice rolls.
 */

import CryptoJS from 'crypto-js';
import { getSecureRandom } from '../../blockchain/secureRng';

// ============================================
// DICE FUNCTIONS
// ============================================

/**
 * Generate provably fair dice values using secure RNG (commit-reveal)
 * Uses rejection sampling to eliminate modulo bias
 * @param {string} sessionId - Secure session ID
 * @param {number} turnNumber - Current turn number for uniqueness
 * @returns {Promise<[number, number]>} Two dice values (1-6 each)
 */
export async function rollDiceSecure(sessionId, turnNumber) {
  // Get secure random from server (combines secret + blockchain)
  const purpose = `roll-${turnNumber}`;
  const randomHex = await getSecureRandom(sessionId, purpose);

  const dice = [];
  let byteIndex = 0;

  // Use rejection sampling to eliminate modulo bias
  // Reject values >= 252 (252 = 42 * 6, evenly divisible)
  while (dice.length < 2 && byteIndex < randomHex.length - 1) {
    const byte = parseInt(randomHex.substring(byteIndex, byteIndex + 2), 16);
    byteIndex += 2;

    // Only accept values that don't introduce bias
    if (byte < 252) {
      dice.push((byte % 6) + 1);
    }
  }

  // Fallback if we run out of bytes (extremely unlikely)
  while (dice.length < 2) {
    const extraHash = CryptoJS.SHA256(randomHex + dice.length).toString(CryptoJS.enc.Hex);
    const byte = parseInt(extraHash.substring(0, 2), 16);
    if (byte < 252) {
      dice.push((byte % 6) + 1);
    }
  }

  return [dice[0], dice[1]];
}

/**
 * Generate provably fair dice values from blockchain data (LEGACY)
 * Uses rejection sampling to eliminate modulo bias
 * @param {string} blockHash - Blockchain block hash
 * @param {string} gameId - Unique game identifier
 * @param {number} turnNumber - Current turn number for uniqueness
 * @returns {[number, number]} Two dice values (1-6 each)
 */
export function rollDiceValues(blockHash, gameId, turnNumber) {
  // Create deterministic seed from blockchain + game data
  const seedInput = `${blockHash}${gameId}${turnNumber}`;
  const hash = CryptoJS.SHA256(seedInput).toString(CryptoJS.enc.Hex);

  const dice = [];
  let byteIndex = 0;

  // Use rejection sampling to eliminate modulo bias
  // Reject values >= 252 (252 = 42 * 6, evenly divisible)
  while (dice.length < 2 && byteIndex < hash.length - 1) {
    const byte = parseInt(hash.substring(byteIndex, byteIndex + 2), 16);
    byteIndex += 2;

    // Only accept values that don't introduce bias
    if (byte < 252) {
      dice.push((byte % 6) + 1);
    }
  }

  // Fallback if we run out of bytes (extremely unlikely)
  while (dice.length < 2) {
    const extraHash = CryptoJS.SHA256(seedInput + dice.length).toString(CryptoJS.enc.Hex);
    const byte = parseInt(extraHash.substring(0, 2), 16);
    if (byte < 252) {
      dice.push((byte % 6) + 1);
    }
  }

  return [dice[0], dice[1]];
}

/**
 * Check if dice roll is doubles
 * @param {number[]} dice - Array of dice values
 * @returns {boolean}
 */
export function isDoubles(dice) {
  if (!dice || dice.length < 2) return false;
  return dice[0] === dice[1];
}

/**
 * Get available dice values that haven't been used
 * Handles doubles (4 moves with same value)
 * @param {number[]} dice - Current dice values
 * @param {boolean[]} diceUsed - Which dice have been used
 * @returns {number[]} Remaining dice values
 */
export function getAvailableDice(dice, diceUsed) {
  if (!dice || !diceUsed) return [];
  return dice.filter((_, index) => !diceUsed[index]);
}

/**
 * Expand dice for doubles (returns 4 identical values)
 * @param {[number, number]} dice - Original dice roll
 * @returns {number[]} Expanded dice array
 */
export function expandDiceForDoubles(dice) {
  if (isDoubles(dice)) {
    return [dice[0], dice[0], dice[0], dice[0]];
  }
  return [...dice];
}

// ============================================
// MOVEMENT HELPERS
// ============================================

/**
 * Get movement direction for a player
 * White moves from high to low (24 → 1), represented as decreasing indices
 * Black moves from low to high (1 → 24), represented as increasing indices
 * @param {string} player - 'white' or 'black'
 * @returns {number} Direction multiplier (1 or -1)
 */
export function getDirection(player) {
  return player === 'white' ? -1 : 1;
}

/**
 * Calculate destination point index from a move
 * @param {number} from - Source point index (0-23)
 * @param {number} dieValue - Die value (1-6)
 * @param {string} player - 'white' or 'black'
 * @returns {number} Destination index (may be out of bounds for bearing off)
 */
export function calculateDestination(from, dieValue, player) {
  const direction = getDirection(player);
  return from + (dieValue * direction);
}

/**
 * Get home board range for a player (indices)
 * White home: indices 0-5 (points 1-6)
 * Black home: indices 18-23 (points 19-24)
 * @param {string} player - 'white' or 'black'
 * @returns {{start: number, end: number}} Range of home board indices
 */
export function getHomeRange(player) {
  if (player === 'white') {
    return { start: 0, end: 5 };
  }
  return { start: 18, end: 23 };
}

/**
 * Get bar entry point for a player
 * White enters at opponent's home (indices 18-23, using dice as distance from 25)
 * Black enters at opponent's home (indices 0-5, using dice as distance from 0)
 * @param {number} dieValue - Die value (1-6)
 * @param {string} player - 'white' or 'black'
 * @returns {number} Entry point index
 */
export function getBarEntryPoint(dieValue, player) {
  if (player === 'white') {
    // White enters from point 25 (off-board), moves toward 1
    // Die 1 → index 23 (point 24), Die 6 → index 18 (point 19)
    return 24 - dieValue;
  }
  // Black enters from point 0 (off-board), moves toward 24
  // Die 1 → index 0 (point 1), Die 6 → index 5 (point 6)
  return dieValue - 1;
}

/**
 * Calculate pip count (total distance to bear off)
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {number} Total pip count
 */
export function getPipCount(state, player) {
  let count = 0;
  
  // Count checkers on points
  state.points.forEach((point, index) => {
    if (point.color === player) {
      // Distance to bear off
      const distance = player === 'white' 
        ? index + 1  // White bears off from point 1 (index 0)
        : 24 - index; // Black bears off from point 24 (index 23)
      count += point.checkers * distance;
    }
  });
  
  // Checkers on bar must travel full board + entry
  const barDistance = 25;
  count += state.bar[player] * barDistance;
  
  return count;
}

// ============================================
// CHECKER/BOARD QUERIES
// ============================================

/**
 * Check if player has checkers on the bar
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {boolean}
 */
export function hasCheckersOnBar(state, player) {
  return state.bar[player] > 0;
}

/**
 * Check if all player's checkers are in their home board
 * Required before bearing off
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {boolean}
 */
export function allCheckersInHome(state, player) {
  // Can't bear off with checkers on bar
  if (state.bar[player] > 0) return false;
  
  const homeRange = getHomeRange(player);
  
  // Check if any checkers are outside home board
  for (let i = 0; i < 24; i++) {
    if (state.points[i].color === player) {
      if (i < homeRange.start || i > homeRange.end) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Check if a point is blocked for a player (opponent has 2+ checkers)
 * @param {object} state - Game state
 * @param {number} pointIndex - Point index (0-23)
 * @param {string} player - Player trying to move there
 * @returns {boolean}
 */
export function isPointBlocked(state, pointIndex, player) {
  if (pointIndex < 0 || pointIndex > 23) return false;
  
  const point = state.points[pointIndex];
  const opponent = player === 'white' ? 'black' : 'white';
  
  return point.color === opponent && point.checkers >= 2;
}

/**
 * Check if a point has a blot (single opponent checker that can be hit)
 * @param {object} state - Game state
 * @param {number} pointIndex - Point index (0-23)
 * @param {string} player - Player making the move
 * @returns {boolean}
 */
export function isBlot(state, pointIndex, player) {
  if (pointIndex < 0 || pointIndex > 23) return false;
  
  const point = state.points[pointIndex];
  const opponent = player === 'white' ? 'black' : 'white';
  
  return point.color === opponent && point.checkers === 1;
}

/**
 * Check if player can enter from bar with a specific die value
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @param {number} dieValue - Die value (1-6)
 * @returns {boolean}
 */
export function canEnterFromBar(state, player, dieValue) {
  const entryPoint = getBarEntryPoint(dieValue, player);
  return !isPointBlocked(state, entryPoint, player);
}

/**
 * Check if player has any checkers remaining on the board
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {boolean}
 */
export function hasCheckersRemaining(state, player) {
  // Check bar
  if (state.bar[player] > 0) return true;
  
  // Check board
  for (let i = 0; i < 24; i++) {
    if (state.points[i].color === player && state.points[i].checkers > 0) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get total checkers for a player (board + bar + borne off)
 * Should always equal 15
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {number}
 */
export function getTotalCheckers(state, player) {
  let total = state.bar[player] + state.bearOff[player];
  
  state.points.forEach(point => {
    if (point.color === player) {
      total += point.checkers;
    }
  });
  
  return total;
}

/**
 * Find the furthest checker from bearing off for a player
 * Used for bearing off with higher die values
 * @param {object} state - Game state
 * @param {string} player - 'white' or 'black'
 * @returns {number|null} Point index or null if no checkers
 */
export function getFurthestChecker(state, player) {
  const homeRange = getHomeRange(player);
  
  if (player === 'white') {
    // White: search from index 5 down to 0
    for (let i = homeRange.end; i >= homeRange.start; i--) {
      if (state.points[i].color === player && state.points[i].checkers > 0) {
        return i;
      }
    }
  } else {
    // Black: search from index 18 up to 23
    for (let i = homeRange.start; i <= homeRange.end; i++) {
      if (state.points[i].color === player && state.points[i].checkers > 0) {
        return i;
      }
    }
  }
  
  return null;
}

// ============================================
// WIN TYPE DETECTION
// ============================================

/**
 * Detect the type of win (affects score multiplier)
 * - Normal: Opponent has borne off at least one checker
 * - Gammon: Opponent has borne off zero checkers
 * - Backgammon: Gammon + opponent has checker on bar or in winner's home
 * @param {object} state - Game state
 * @param {string} loser - The losing player
 * @returns {'normal' | 'gammon' | 'backgammon'}
 */
export function detectWinType(state, loser) {
  const winner = loser === 'white' ? 'black' : 'white';
  
  // If loser has borne off any checkers, it's a normal win
  if (state.bearOff[loser] > 0) {
    return 'normal';
  }
  
  // Loser has no checkers borne off - at least a gammon
  // Check for backgammon: loser has checker on bar OR in winner's home
  
  // Check bar
  if (state.bar[loser] > 0) {
    return 'backgammon';
  }
  
  // Check winner's home board
  const winnerHome = getHomeRange(winner);
  for (let i = winnerHome.start; i <= winnerHome.end; i++) {
    if (state.points[i].color === loser && state.points[i].checkers > 0) {
      return 'backgammon';
    }
  }
  
  return 'gammon';
}

/**
 * Check if game is over (a player has borne off all 15 checkers)
 * @param {object} state - Game state
 * @returns {{isOver: boolean, winner: string|null}}
 */
export function checkGameOver(state) {
  if (state.bearOff.white === 15) {
    return { isOver: true, winner: 'white' };
  }
  if (state.bearOff.black === 15) {
    return { isOver: true, winner: 'black' };
  }
  return { isOver: false, winner: null };
}

// ============================================
// SCORE CALCULATION
// ============================================

/**
 * Calculate game score based on win type, cube, and difficulty
 * Score = winTypeMultiplier × cubeValue × difficultyBonus
 * @param {'normal' | 'gammon' | 'backgammon'} winType 
 * @param {number} cubeValue - Doubling cube value (1, 2, 4, 8, 16, 32, 64)
 * @param {'easy' | 'normal' | 'hard'} difficulty
 * @returns {number}
 */
export function calculateGameScore(winType, cubeValue, difficulty) {
  const winTypeMultipliers = {
    normal: 1,
    gammon: 2,
    backgammon: 3
  };
  
  const difficultyBonuses = {
    easy: 1,
    normal: 2,
    hard: 3
  };
  
  const winMult = winTypeMultipliers[winType] || 1;
  const diffBonus = difficultyBonuses[difficulty] || 1;
  
  return winMult * cubeValue * diffBonus;
}

// ============================================
// DOUBLING CUBE
// ============================================

/**
 * Check if a player can offer a double
 * @param {object} state - Game state
 * @param {string} player - Player wanting to double
 * @returns {boolean}
 */
export function canOfferDouble(state, player) {
  // Can only double before rolling
  if (state.phase !== 'rolling') return false;
  
  // Can't double beyond 64
  if (state.doublingCube.value >= 64) return false;
  
  // If no one owns the cube, either player can double
  if (state.doublingCube.owner === null) return true;
  
  // Only cube owner can double
  return state.doublingCube.owner === player;
}

/**
 * Get the next double value
 * @param {number} currentValue - Current cube value
 * @returns {number} New cube value (max 64)
 */
export function getDoubleValue(currentValue) {
  return Math.min(currentValue * 2, 64);
}

/**
 * Get cube display text
 * @param {number} value - Cube value
 * @returns {string}
 */
export function getCubeDisplayText(value) {
  return value.toString();
}

// ============================================
// VERIFICATION DATA
// ============================================

/**
 * Generate verification data for a dice roll
 * @param {string} blockHash - Blockchain block hash
 * @param {string} gameId - Game identifier
 * @param {number} turnNumber - Turn number
 * @param {[number, number]} dice - Resulting dice values
 * @returns {object} Verification data object
 */
export function generateVerificationData(blockHash, gameId, turnNumber, dice) {
  const seedInput = `${blockHash}${gameId}${turnNumber}`;
  const hash = CryptoJS.SHA256(seedInput).toString(CryptoJS.enc.Hex);
  
  return {
    blockHash,
    gameId,
    turnNumber,
    seedInput,
    resultHash: hash,
    dice,
    timestamp: Date.now()
  };
}

/**
 * Verify a dice roll was fair
 * @param {object} verificationData - Data from generateVerificationData
 * @returns {boolean} Whether the roll is verified
 */
export function verifyDiceRoll(verificationData) {
  const { blockHash, gameId, turnNumber, dice } = verificationData;
  const expectedDice = rollDiceValues(blockHash, gameId, turnNumber);
  
  return dice[0] === expectedDice[0] && dice[1] === expectedDice[1];
}

export default {
  // Dice
  rollDiceValues,
  isDoubles,
  getAvailableDice,
  expandDiceForDoubles,
  
  // Movement
  getDirection,
  calculateDestination,
  getHomeRange,
  getBarEntryPoint,
  getPipCount,
  
  // Board queries
  hasCheckersOnBar,
  allCheckersInHome,
  isPointBlocked,
  isBlot,
  canEnterFromBar,
  hasCheckersRemaining,
  getTotalCheckers,
  getFurthestChecker,
  
  // Win detection
  detectWinType,
  checkGameOver,
  
  // Scoring
  calculateGameScore,
  
  // Doubling cube
  canOfferDouble,
  getDoubleValue,
  getCubeDisplayText,
  
  // Verification
  generateVerificationData,
  verifyDiceRoll
};
