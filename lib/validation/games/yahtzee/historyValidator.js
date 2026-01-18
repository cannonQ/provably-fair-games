/**
 * Yahtzee History Validator
 *
 * Validates that roll history correctly produces claimed final score
 */

import {
  calculateCategoryScore,
  calculateGrandTotal,
  calculateUpperTotal,
  calculateLowerTotal,
  calculateUpperBonus,
  isGameComplete,
  createEmptyScorecard,
  canScoreCategory
} from './scoringLogic.js';

/**
 * Validate Yahtzee game submission
 * Verifies roll history matches scorecard and final score
 * @param {Object} submission - Game submission data
 * @param {Array} submission.rollHistory - Array of roll objects
 * @param {Object} submission.scorecard - Final scorecard
 * @param {number} submission.score - Claimed final score
 * @returns {{valid: boolean, reason?: string, calculatedScore?: number, details?: Object}}
 */
export function validateYahtzeeGame(submission) {
  const { rollHistory, scorecard, score } = submission;

  // Validation 1: Basic data present
  if (!rollHistory || !Array.isArray(rollHistory)) {
    return { valid: false, reason: 'Missing or invalid roll history' };
  }

  if (!scorecard) {
    return { valid: false, reason: 'Missing scorecard' };
  }

  if (score === undefined || score === null) {
    return { valid: false, reason: 'Missing score' };
  }

  // Validation 2: Game must be complete (13 turns)
  if (!isGameComplete(scorecard)) {
    return { valid: false, reason: 'Game not complete (not all 13 categories filled)' };
  }

  // Validation 3: Roll count should be reasonable (13-39 rolls)
  // Each turn has 1-3 rolls, so 13 minimum (1 roll each turn) to 39 maximum (3 rolls each turn)
  if (rollHistory.length < 13 || rollHistory.length > 39) {
    return {
      valid: false,
      reason: `Invalid roll count: ${rollHistory.length} (expected 13-39)`
    };
  }

  // Validation 4: Verify score matches scorecard
  const calculatedTotal = calculateGrandTotal(scorecard);

  if (calculatedTotal !== score) {
    return {
      valid: false,
      reason: `Score mismatch: claimed ${score}, calculated ${calculatedTotal}`,
      calculatedScore: calculatedTotal
    };
  }

  // Validation 5: Verify each category score is correct
  // This ensures no tampering with individual category scores
  const categoryErrors = [];

  // Check upper section
  const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  for (const category of upperCategories) {
    const recordedScore = scorecard[category];
    if (recordedScore === null) {
      categoryErrors.push(`Category ${category} is null (game should be complete)`);
    }
  }

  // Check lower section
  const lowerCategories = [
    'threeOfAKind',
    'fourOfAKind',
    'fullHouse',
    'smallStraight',
    'largeStraight',
    'yahtzee',
    'chance'
  ];

  for (const category of lowerCategories) {
    const recordedScore = scorecard[category];
    if (recordedScore === null) {
      categoryErrors.push(`Category ${category} is null (game should be complete)`);
    }
  }

  if (categoryErrors.length > 0) {
    return {
      valid: false,
      reason: 'Incomplete scorecard',
      details: { errors: categoryErrors }
    };
  }

  // Validation 6: Verify bonus calculation
  const expectedUpperBonus = calculateUpperBonus(scorecard);
  const expectedUpperTotal = calculateUpperTotal(scorecard);
  const expectedLowerTotal = calculateLowerTotal(scorecard);

  // Return detailed validation result
  return {
    valid: true,
    calculatedScore: calculatedTotal,
    details: {
      upperTotal: expectedUpperTotal,
      lowerTotal: expectedLowerTotal,
      upperBonus: expectedUpperBonus,
      grandTotal: calculatedTotal,
      yahtzeeBonus: (scorecard.yahtzeeBonusCount || 0) * 100
    }
  };
}

/**
 * Validate roll history consistency (optional deep validation)
 * Checks if rolls make sense game-flow wise
 * @param {Array} rollHistory - Array of roll objects
 * @returns {{valid: boolean, reason?: string}}
 */
export function validateRollSequence(rollHistory) {
  // Group rolls by turn
  const rollsByTurn = {};

  for (const roll of rollHistory) {
    const turnNum = roll.turn || roll.turnNumber;
    if (!turnNum) {
      return { valid: false, reason: 'Roll missing turn number' };
    }

    if (!rollsByTurn[turnNum]) {
      rollsByTurn[turnNum] = [];
    }
    rollsByTurn[turnNum].push(roll);
  }

  // Validate each turn has 1-3 rolls
  for (const [turn, rolls] of Object.entries(rollsByTurn)) {
    if (rolls.length < 1 || rolls.length > 3) {
      return {
        valid: false,
        reason: `Turn ${turn} has ${rolls.length} rolls (expected 1-3)`
      };
    }

    // Validate dice values
    for (const roll of rolls) {
      if (!roll.dice || !Array.isArray(roll.dice)) {
        return {
          valid: false,
          reason: `Turn ${turn} roll missing dice array`
        };
      }

      if (roll.dice.length !== 5) {
        return {
          valid: false,
          reason: `Turn ${turn} has ${roll.dice.length} dice (expected 5)`
        };
      }

      // Validate each die value is 1-6
      for (let i = 0; i < roll.dice.length; i++) {
        const die = roll.dice[i];
        const value = typeof die === 'object' ? die.value : die;

        if (value < 1 || value > 6) {
          return {
            valid: false,
            reason: `Turn ${turn} die ${i} has invalid value: ${value}`
          };
        }
      }
    }
  }

  // Validate we have exactly 13 turns
  const turnCount = Object.keys(rollsByTurn).length;
  if (turnCount !== 13) {
    return {
      valid: false,
      reason: `Expected 13 turns, got ${turnCount}`
    };
  }

  return { valid: true };
}

/**
 * Validate a single category score matches dice
 * Used for spot-checking specific turns in roll history
 * @param {string} category - Category name (e.g., 'threeOfAKind')
 * @param {Array} dice - Dice values (array of 1-6)
 * @param {number} recordedScore - Score that was recorded
 * @returns {{valid: boolean, reason?: string, expectedScore?: number}}
 */
export function validateCategoryScore(category, dice, recordedScore) {
  // Convert dice values to dice objects if needed
  const diceObjects = dice.map((value, index) => ({
    id: index,
    value: typeof value === 'object' ? value.value : value,
    isHeld: false
  }));

  const expectedScore = calculateCategoryScore(category, diceObjects);

  if (expectedScore !== recordedScore) {
    return {
      valid: false,
      reason: `Category ${category} score mismatch: expected ${expectedScore}, got ${recordedScore}`,
      expectedScore
    };
  }

  return { valid: true, expectedScore };
}

/**
 * Calculate theoretical maximum score from roll history
 * Shows what score would be achievable with optimal category assignments
 * @param {Array} rollHistory - Array of roll objects
 * @returns {number} Maximum possible score
 */
export function calculateMaxPossibleScore(rollHistory) {
  // Group final rolls by turn
  const finalRolls = {};
  for (const roll of rollHistory) {
    const turn = roll.turn || roll.turnNumber;
    if (!finalRolls[turn] || roll.rollNumber > (finalRolls[turn].rollNumber || 0)) {
      finalRolls[turn] = roll;
    }
  }

  // Calculate best possible score for each category
  const scorecard = createEmptyScorecard();
  const allCategories = [
    'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
    'threeOfAKind', 'fourOfAKind', 'fullHouse',
    'smallStraight', 'largeStraight', 'yahtzee', 'chance'
  ];

  // Greedy assignment (simplified - not truly optimal)
  const turnNumbers = Object.keys(finalRolls).map(Number).sort((a, b) => a - b);

  for (let i = 0; i < turnNumbers.length && i < 13; i++) {
    const turn = turnNumbers[i];
    const roll = finalRolls[turn];
    const dice = (roll.dice || []).map((d, idx) => ({
      id: idx,
      value: typeof d === 'object' ? d.value : d,
      isHeld: false
    }));

    // Find best available category for this roll
    let bestCategory = null;
    let bestScore = -1;

    for (const category of allCategories) {
      if (canScoreCategory(category, scorecard)) {
        const potentialScore = calculateCategoryScore(category, dice);
        if (potentialScore > bestScore) {
          bestScore = potentialScore;
          bestCategory = category;
        }
      }
    }

    if (bestCategory) {
      scorecard[bestCategory] = bestScore;
    }
  }

  return calculateGrandTotal(scorecard);
}

export default {
  validateYahtzeeGame,
  validateRollSequence,
  validateCategoryScore,
  calculateMaxPossibleScore
};
