/**
 * Yahtzee Scoring Logic
 * Pure functions for calculating scores across all 13 categories
 */

/**
 * Count occurrences of each die value
 * @param {Array} dice - Array of die objects with value property
 * @returns {Object} Counts for each value {1: n, 2: n, ..., 6: n}
 */
export function getDiceCounts(dice) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  dice.forEach(die => {
    counts[die.value]++;
  });
  return counts;
}

/**
 * Check if dice contain N or more of the same value
 * @param {Array} dice - Array of die objects
 * @param {number} n - Minimum matching dice required
 * @returns {boolean} True if N or more dice match
 */
export function hasNOfAKind(dice, n) {
  const counts = getDiceCounts(dice);
  return Object.values(counts).some(count => count >= n);
}

/**
 * Check for full house (exactly 3 of one value + 2 of another)
 * @param {Array} dice - Array of die objects
 * @returns {boolean} True if valid full house
 */
export function isFullHouse(dice) {
  const counts = getDiceCounts(dice);
  const values = Object.values(counts).filter(c => c > 0);
  
  // Must have exactly 2 distinct values: one with 3, one with 2
  if (values.length !== 2) return false;
  return values.includes(3) && values.includes(2);
}

/**
 * Get length of longest consecutive sequence in dice
 * @param {Array} dice - Array of die objects
 * @returns {number} Length of longest straight (1-5)
 */
export function getStraightLength(dice) {
  const counts = getDiceCounts(dice);
  const present = Object.keys(counts)
    .filter(k => counts[k] > 0)
    .map(Number)
    .sort((a, b) => a - b);
  
  if (present.length === 0) return 0;
  
  let maxLength = 1;
  let currentLength = 1;
  
  for (let i = 1; i < present.length; i++) {
    if (present[i] === present[i - 1] + 1) {
      currentLength++;
      maxLength = Math.max(maxLength, currentLength);
    } else {
      currentLength = 1;
    }
  }
  
  return maxLength;
}

/**
 * Check if all 5 dice show the same value
 * @param {Array} dice - Array of die objects
 * @returns {boolean} True if Yahtzee
 */
export function isYahtzee(dice) {
  return hasNOfAKind(dice, 5);
}

/**
 * Sum of all dice showing value 1
 * @param {Array} dice - Array of die objects
 * @returns {number} Score for Ones category
 */
export function scoreOnes(dice) {
  return dice.filter(d => d.value === 1).length * 1;
}

/**
 * Sum of all dice showing value 2
 * @param {Array} dice - Array of die objects
 * @returns {number} Score for Twos category
 */
export function scoreTwos(dice) {
  return dice.filter(d => d.value === 2).length * 2;
}

/**
 * Sum of all dice showing value 3
 * @param {Array} dice - Array of die objects
 * @returns {number} Score for Threes category
 */
export function scoreThrees(dice) {
  return dice.filter(d => d.value === 3).length * 3;
}

/**
 * Sum of all dice showing value 4
 * @param {Array} dice - Array of die objects
 * @returns {number} Score for Fours category
 */
export function scoreFours(dice) {
  return dice.filter(d => d.value === 4).length * 4;
}

/**
 * Sum of all dice showing value 5
 * @param {Array} dice - Array of die objects
 * @returns {number} Score for Fives category
 */
export function scoreFives(dice) {
  return dice.filter(d => d.value === 5).length * 5;
}

/**
 * Sum of all dice showing value 6
 * @param {Array} dice - Array of die objects
 * @returns {number} Score for Sixes category
 */
export function scoreSixes(dice) {
  return dice.filter(d => d.value === 6).length * 6;
}

/**
 * Score for upper section by value (1-6)
 * @param {Array} dice - Array of die objects
 * @param {number} value - Die value to score (1-6)
 * @returns {number} Sum of dice matching value
 */
export function scoreUpperSection(dice, value) {
  return dice.filter(d => d.value === value).length * value;
}

/**
 * Sum all dice values
 * @param {Array} dice - Array of die objects
 * @returns {number} Total of all dice
 */
function sumAllDice(dice) {
  return dice.reduce((sum, die) => sum + die.value, 0);
}

/**
 * Score three of a kind (sum all if 3+ match)
 * @param {Array} dice - Array of die objects
 * @returns {number} Sum of all dice or 0
 */
export function scoreThreeOfAKind(dice) {
  return hasNOfAKind(dice, 3) ? sumAllDice(dice) : 0;
}

/**
 * Score four of a kind (sum all if 4+ match)
 * @param {Array} dice - Array of die objects
 * @returns {number} Sum of all dice or 0
 */
export function scoreFourOfAKind(dice) {
  return hasNOfAKind(dice, 4) ? sumAllDice(dice) : 0;
}

/**
 * Score full house (25 points if valid)
 * @param {Array} dice - Array of die objects
 * @returns {number} 25 or 0
 */
export function scoreFullHouse(dice) {
  return isFullHouse(dice) ? 25 : 0;
}

/**
 * Score small straight (30 points if 4+ consecutive)
 * @param {Array} dice - Array of die objects
 * @returns {number} 30 or 0
 */
export function scoreSmallStraight(dice) {
  return getStraightLength(dice) >= 4 ? 30 : 0;
}

/**
 * Score large straight (40 points if 5 consecutive)
 * @param {Array} dice - Array of die objects
 * @returns {number} 40 or 0
 */
export function scoreLargeStraight(dice) {
  return getStraightLength(dice) >= 5 ? 40 : 0;
}

/**
 * Score Yahtzee (50 points if all 5 same)
 * @param {Array} dice - Array of die objects
 * @returns {number} 50 or 0
 */
export function scoreYahtzee(dice) {
  return isYahtzee(dice) ? 50 : 0;
}

/**
 * Score chance (sum of all dice, always valid)
 * @param {Array} dice - Array of die objects
 * @returns {number} Sum of all dice
 */
export function scoreChance(dice) {
  return sumAllDice(dice);
}

/**
 * Map of category names to scoring functions
 */
const scoringFunctions = {
  ones: scoreOnes,
  twos: scoreTwos,
  threes: scoreThrees,
  fours: scoreFours,
  fives: scoreFives,
  sixes: scoreSixes,
  threeOfAKind: scoreThreeOfAKind,
  fourOfAKind: scoreFourOfAKind,
  fullHouse: scoreFullHouse,
  smallStraight: scoreSmallStraight,
  largeStraight: scoreLargeStraight,
  yahtzee: scoreYahtzee,
  chance: scoreChance
};

/**
 * Check if a category can still be scored
 * @param {string} category - Category name
 * @param {Object} scorecard - Current scorecard
 * @returns {boolean} True if category not yet used
 */
export function canScoreCategory(category, scorecard) {
  return scorecard[category] === null;
}

/**
 * Get potential scores for all available categories
 * @param {Array} dice - Array of die objects
 * @param {Object} scorecard - Current scorecard
 * @returns {Object} Map of available categories to potential scores
 */
export function getAvailableScores(dice, scorecard) {
  const available = {};
  
  Object.keys(scoringFunctions).forEach(category => {
    if (canScoreCategory(category, scorecard)) {
      available[category] = scoringFunctions[category](dice);
    }
  });
  
  return available;
}

/**
 * Calculate score for a specific category
 * @param {string} category - Category name
 * @param {Array} dice - Array of die objects
 * @returns {number} Score for that category
 */
export function calculateCategoryScore(category, dice) {
  const fn = scoringFunctions[category];
  return fn ? fn(dice) : 0;
}

/**
 * Calculate upper section bonus (35 if total >= 63)
 * @param {Object} scorecard - Current scorecard
 * @returns {number} 35 or 0
 */
export function calculateUpperBonus(scorecard) {
  const upperSum = (scorecard.ones || 0) +
    (scorecard.twos || 0) +
    (scorecard.threes || 0) +
    (scorecard.fours || 0) +
    (scorecard.fives || 0) +
    (scorecard.sixes || 0);
  
  return upperSum >= 63 ? 35 : 0;
}

/**
 * Calculate upper section total including bonus
 * @param {Object} scorecard - Current scorecard
 * @returns {number} Upper total with bonus
 */
export function calculateUpperTotal(scorecard) {
  const base = (scorecard.ones || 0) +
    (scorecard.twos || 0) +
    (scorecard.threes || 0) +
    (scorecard.fours || 0) +
    (scorecard.fives || 0) +
    (scorecard.sixes || 0);
  
  return base + calculateUpperBonus(scorecard);
}

/**
 * Calculate raw upper section sum (no bonus)
 * @param {Object} scorecard - Current scorecard
 * @returns {number} Sum of upper categories
 */
export function calculateUpperSum(scorecard) {
  return (scorecard.ones || 0) +
    (scorecard.twos || 0) +
    (scorecard.threes || 0) +
    (scorecard.fours || 0) +
    (scorecard.fives || 0) +
    (scorecard.sixes || 0);
}

/**
 * Calculate lower section total including Yahtzee bonuses
 * @param {Object} scorecard - Current scorecard
 * @returns {number} Lower total with bonuses
 */
export function calculateLowerTotal(scorecard) {
  const base = (scorecard.threeOfAKind || 0) +
    (scorecard.fourOfAKind || 0) +
    (scorecard.fullHouse || 0) +
    (scorecard.smallStraight || 0) +
    (scorecard.largeStraight || 0) +
    (scorecard.yahtzee || 0) +
    (scorecard.chance || 0);
  
  // Yahtzee bonus: 100 points per additional Yahtzee after first
  const yahtzeeBonus = (scorecard.yahtzeeBonusCount || 0) * 100;
  
  return base + yahtzeeBonus;
}

/**
 * Calculate grand total (upper + lower)
 * @param {Object} scorecard - Current scorecard
 * @returns {number} Final game score
 */
export function calculateGrandTotal(scorecard) {
  return calculateUpperTotal(scorecard) + calculateLowerTotal(scorecard);
}

/**
 * Create initial empty scorecard
 * @returns {Object} Fresh scorecard with all nulls
 */
export function createEmptyScorecard() {
  return {
    ones: null,
    twos: null,
    threes: null,
    fours: null,
    fives: null,
    sixes: null,
    threeOfAKind: null,
    fourOfAKind: null,
    fullHouse: null,
    smallStraight: null,
    largeStraight: null,
    yahtzee: null,
    chance: null,
    yahtzeeBonusCount: 0
  };
}

/**
 * Check if game is complete (all categories filled)
 * @param {Object} scorecard - Current scorecard
 * @returns {boolean} True if all 13 categories scored
 */
export function isGameComplete(scorecard) {
  const categories = Object.keys(scoringFunctions);
  return categories.every(cat => scorecard[cat] !== null);
}

/**
 * Count remaining turns
 * @param {Object} scorecard - Current scorecard
 * @returns {number} Number of unscored categories (0-13)
 */
export function getRemainingTurns(scorecard) {
  const categories = Object.keys(scoringFunctions);
  return categories.filter(cat => scorecard[cat] === null).length;
}

/**
 * Upper section categories
 */
export const UPPER_CATEGORIES = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];

/**
 * Lower section categories
 */
export const LOWER_CATEGORIES = [
  'threeOfAKind',
  'fourOfAKind',
  'fullHouse',
  'smallStraight',
  'largeStraight',
  'yahtzee',
  'chance'
];

/**
 * Display names for categories
 */
export const CATEGORY_DISPLAY_NAMES = {
  ones: 'Ones',
  twos: 'Twos',
  threes: 'Threes',
  fours: 'Fours',
  fives: 'Fives',
  sixes: 'Sixes',
  threeOfAKind: 'Three of a Kind',
  fourOfAKind: 'Four of a Kind',
  fullHouse: 'Full House',
  smallStraight: 'Small Straight',
  largeStraight: 'Large Straight',
  yahtzee: 'Yahtzee',
  chance: 'Chance'
};
