/**
 * Yahtzee Dice Logic with Blockchain-based RNG
 * Uses Ergo blockchain data for provably fair dice rolls
 */

import CryptoJS from 'crypto-js';

/**
 * Generate a deterministic seed from blockchain roll source data
 * @param {Object} rollSource - Blockchain data for this roll
 * @param {string} gameId - Unique game identifier
 * @param {number} turnNumber - Current turn (1-13)
 * @param {number} rollNumber - Current roll within turn (1-3)
 * @returns {string} SHA256 hash seed
 */
export function generateSeedFromSource(rollSource, gameId, turnNumber, rollNumber) {
  const turnRoll = `T${turnNumber}R${rollNumber}`;
  const seedInput = [
    rollSource.blockHash,
    rollSource.txHash,
    rollSource.timestamp.toString(),
    gameId,
    rollSource.txIndex.toString(),
    turnRoll
  ].join('');
  
  return CryptoJS.SHA256(seedInput).toString();
}

/**
 * Calculate a single die value from seed and die index
 * @param {string} seed - SHA256 seed string
 * @param {number} dieIndex - Die index (0-4)
 * @returns {number} Die value (1-6)
 */
export function calculateDieValue(seed, dieIndex) {
  const dieHash = CryptoJS.SHA256(seed + dieIndex.toString()).toString();
  const numericValue = parseInt(dieHash.slice(0, 8), 16);
  return (numericValue % 6) + 1;
}

/**
 * Roll all non-held dice using blockchain seed
 * @param {Array} dice - Current dice array
 * @param {Object} rollSource - Blockchain data for this roll
 * @param {string} gameId - Unique game identifier
 * @param {number} turnNumber - Current turn (1-13)
 * @param {number} rollNumber - Current roll within turn (1-3)
 * @returns {Object} { dice: Array, seed: string, rollSource: Object }
 */
export function rollDice(dice, rollSource, gameId, turnNumber, rollNumber) {
  const seed = generateSeedFromSource(rollSource, gameId, turnNumber, rollNumber);
  
  const newDice = dice.map((die, index) => {
    if (die.isHeld) {
      return { ...die };
    }
    return {
      ...die,
      value: calculateDieValue(seed, index)
    };
  });
  
  return {
    dice: newDice,
    seed,
    rollSource
  };
}

/**
 * Toggle hold status for a specific die
 * @param {Array} dice - Current dice array
 * @param {number} dieIndex - Index of die to toggle (0-4)
 * @returns {Array} Updated dice array
 */
export function toggleHold(dice, dieIndex) {
  if (dieIndex < 0 || dieIndex > 4) {
    return dice;
  }
  
  return dice.map((die, index) => {
    if (index === dieIndex) {
      return { ...die, isHeld: !die.isHeld };
    }
    return die;
  });
}

/**
 * Reset dice to initial state (all value 1, none held)
 * @returns {Array} Fresh dice array
 */
export function resetDice() {
  return Array.from({ length: 5 }, (_, index) => ({
    id: index,
    value: 1,
    isHeld: false
  }));
}

/**
 * Check if player can roll
 * @param {number} rollsRemaining - Rolls left this turn (0-3)
 * @returns {boolean} True if rolling is allowed
 */
export function canRoll(rollsRemaining) {
  return rollsRemaining > 0;
}

/**
 * Create initial dice state for a new game
 * @returns {Array} Array of 5 dice objects
 */
export function createInitialDice() {
  return resetDice();
}

/**
 * Clear all holds (used at start of new turn)
 * @param {Array} dice - Current dice array
 * @returns {Array} Dice with all holds cleared
 */
export function clearAllHolds(dice) {
  return dice.map(die => ({
    ...die,
    isHeld: false
  }));
}

/**
 * Get values of all dice as array
 * @param {Array} dice - Current dice array
 * @returns {Array} Array of die values [1-6, 1-6, ...]
 */
export function getDiceValues(dice) {
  return dice.map(die => die.value);
}

/**
 * Count how many dice are currently held
 * @param {Array} dice - Current dice array
 * @returns {number} Count of held dice
 */
export function countHeldDice(dice) {
  return dice.filter(die => die.isHeld).length;
}
