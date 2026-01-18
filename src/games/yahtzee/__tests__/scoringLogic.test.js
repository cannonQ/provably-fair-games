/**
 * Tests for Yahtzee Scoring Logic
 * @module scoringLogic.test
 */

import {
  getDiceCounts,
  hasNOfAKind,
  isFullHouse,
  getStraightLength,
  isYahtzee,
  scoreOnes,
  scoreTwos,
  scoreThrees,
  scoreFours,
  scoreFives,
  scoreSixes,
  scoreUpperSection,
  scoreThreeOfAKind,
  scoreFourOfAKind,
  scoreFullHouse,
  scoreSmallStraight,
  scoreLargeStraight,
  scoreYahtzee,
  scoreChance,
  canScoreCategory,
  getAvailableScores,
  calculateCategoryScore,
  calculateUpperBonus,
  calculateUpperTotal,
  calculateUpperSum,
  calculateLowerTotal,
  calculateGrandTotal,
  createEmptyScorecard,
  isGameComplete,
  getRemainingTurns,
  UPPER_CATEGORIES,
  LOWER_CATEGORIES
} from '../scoringLogic';

// ============================================
// TEST HELPERS
// ============================================

function createDice(values) {
  return values.map((value, index) => ({
    id: index,
    value: value,
    isHeld: false
  }));
}

// ============================================
// DICE COUNTING
// ============================================

describe('getDiceCounts', () => {
  test('counts all same value', () => {
    const dice = createDice([3, 3, 3, 3, 3]);
    const counts = getDiceCounts(dice);
    expect(counts[3]).toBe(5);
    expect(counts[1]).toBe(0);
  });

  test('counts mixed values', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    const counts = getDiceCounts(dice);
    expect(counts[1]).toBe(1);
    expect(counts[2]).toBe(1);
    expect(counts[3]).toBe(1);
    expect(counts[4]).toBe(1);
    expect(counts[5]).toBe(1);
    expect(counts[6]).toBe(0);
  });

  test('counts with duplicates', () => {
    const dice = createDice([2, 2, 5, 5, 6]);
    const counts = getDiceCounts(dice);
    expect(counts[2]).toBe(2);
    expect(counts[5]).toBe(2);
    expect(counts[6]).toBe(1);
  });
});

// ============================================
// N-OF-A-KIND DETECTION
// ============================================

describe('hasNOfAKind', () => {
  test('detects 3 of a kind', () => {
    const dice = createDice([3, 3, 3, 1, 2]);
    expect(hasNOfAKind(dice, 3)).toBe(true);
  });

  test('detects 4 of a kind', () => {
    const dice = createDice([5, 5, 5, 5, 2]);
    expect(hasNOfAKind(dice, 4)).toBe(true);
  });

  test('detects 5 of a kind (Yahtzee)', () => {
    const dice = createDice([6, 6, 6, 6, 6]);
    expect(hasNOfAKind(dice, 5)).toBe(true);
  });

  test('4 of a kind also satisfies 3 of a kind', () => {
    const dice = createDice([2, 2, 2, 2, 5]);
    expect(hasNOfAKind(dice, 3)).toBe(true);
    expect(hasNOfAKind(dice, 4)).toBe(true);
  });

  test('does not detect missing kind', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    expect(hasNOfAKind(dice, 3)).toBe(false);
  });

  test('two pairs is not 3 of a kind', () => {
    const dice = createDice([2, 2, 5, 5, 6]);
    expect(hasNOfAKind(dice, 3)).toBe(false);
  });
});

// ============================================
// FULL HOUSE DETECTION
// ============================================

describe('isFullHouse', () => {
  test('detects valid full house (3 + 2)', () => {
    const dice = createDice([3, 3, 3, 5, 5]);
    expect(isFullHouse(dice)).toBe(true);
  });

  test('detects full house with different values', () => {
    const dice = createDice([1, 1, 4, 4, 4]);
    expect(isFullHouse(dice)).toBe(true);
  });

  test('rejects 4 of a kind + 1 (not full house)', () => {
    const dice = createDice([2, 2, 2, 2, 5]);
    expect(isFullHouse(dice)).toBe(false);
  });

  test('rejects 5 of a kind (not full house)', () => {
    const dice = createDice([6, 6, 6, 6, 6]);
    expect(isFullHouse(dice)).toBe(false);
  });

  test('rejects two pairs + 1', () => {
    const dice = createDice([2, 2, 5, 5, 6]);
    expect(isFullHouse(dice)).toBe(false);
  });

  test('rejects all different', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    expect(isFullHouse(dice)).toBe(false);
  });
});

// ============================================
// STRAIGHT DETECTION
// ============================================

describe('getStraightLength', () => {
  test('detects length 5 straight [1,2,3,4,5]', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    expect(getStraightLength(dice)).toBe(5);
  });

  test('detects length 5 straight [2,3,4,5,6]', () => {
    const dice = createDice([2, 3, 4, 5, 6]);
    expect(getStraightLength(dice)).toBe(5);
  });

  test('detects length 4 straight [1,2,3,4,6]', () => {
    const dice = createDice([1, 2, 3, 4, 6]);
    expect(getStraightLength(dice)).toBe(4);
  });

  test('detects length 4 straight [2,3,4,5,1]', () => {
    const dice = createDice([2, 3, 4, 5, 1]);
    expect(getStraightLength(dice)).toBe(5);
  });

  test('handles duplicate in straight [1,2,2,3,4]', () => {
    const dice = createDice([1, 2, 2, 3, 4]);
    expect(getStraightLength(dice)).toBe(4);
  });

  test('returns 1 for all same', () => {
    const dice = createDice([3, 3, 3, 3, 3]);
    expect(getStraightLength(dice)).toBe(1);
  });

  test('handles gaps correctly [1,3,5,2,6]', () => {
    const dice = createDice([1, 3, 5, 2, 6]);
    // Sorted: 1,2,3,5,6 → straight is 1,2,3 (len 3) or 5,6 (len 2)
    expect(getStraightLength(dice)).toBe(3);
  });
});

// ============================================
// YAHTZEE DETECTION
// ============================================

describe('isYahtzee', () => {
  test('detects Yahtzee (all same)', () => {
    const dice = createDice([4, 4, 4, 4, 4]);
    expect(isYahtzee(dice)).toBe(true);
  });

  test('rejects 4 of a kind', () => {
    const dice = createDice([4, 4, 4, 4, 1]);
    expect(isYahtzee(dice)).toBe(false);
  });

  test('detects Yahtzee with 1s', () => {
    const dice = createDice([1, 1, 1, 1, 1]);
    expect(isYahtzee(dice)).toBe(true);
  });

  test('detects Yahtzee with 6s', () => {
    const dice = createDice([6, 6, 6, 6, 6]);
    expect(isYahtzee(dice)).toBe(true);
  });
});

// ============================================
// UPPER SECTION SCORING
// ============================================

describe('scoreOnes', () => {
  test('scores three 1s = 3', () => {
    const dice = createDice([1, 1, 1, 5, 6]);
    expect(scoreOnes(dice)).toBe(3);
  });

  test('scores no 1s = 0', () => {
    const dice = createDice([2, 3, 4, 5, 6]);
    expect(scoreOnes(dice)).toBe(0);
  });

  test('scores all 1s = 5', () => {
    const dice = createDice([1, 1, 1, 1, 1]);
    expect(scoreOnes(dice)).toBe(5);
  });
});

describe('scoreTwos', () => {
  test('scores two 2s = 4', () => {
    const dice = createDice([2, 2, 5, 5, 6]);
    expect(scoreTwos(dice)).toBe(4);
  });

  test('scores no 2s = 0', () => {
    const dice = createDice([1, 3, 4, 5, 6]);
    expect(scoreTwos(dice)).toBe(0);
  });

  test('scores all 2s = 10', () => {
    const dice = createDice([2, 2, 2, 2, 2]);
    expect(scoreTwos(dice)).toBe(10);
  });
});

describe('scoreThrees', () => {
  test('scores three 3s = 9', () => {
    const dice = createDice([3, 3, 3, 1, 2]);
    expect(scoreThrees(dice)).toBe(9);
  });

  test('scores one 3 = 3', () => {
    const dice = createDice([3, 1, 2, 4, 5]);
    expect(scoreThrees(dice)).toBe(3);
  });
});

describe('scoreFours', () => {
  test('scores four 4s = 16', () => {
    const dice = createDice([4, 4, 4, 4, 1]);
    expect(scoreFours(dice)).toBe(16);
  });
});

describe('scoreFives', () => {
  test('scores two 5s = 10', () => {
    const dice = createDice([5, 5, 1, 2, 3]);
    expect(scoreFives(dice)).toBe(10);
  });
});

describe('scoreSixes', () => {
  test('scores five 6s = 30', () => {
    const dice = createDice([6, 6, 6, 6, 6]);
    expect(scoreSixes(dice)).toBe(30);
  });
});

describe('scoreUpperSection', () => {
  test('scores by value parameter', () => {
    const dice = createDice([3, 3, 3, 1, 2]);
    expect(scoreUpperSection(dice, 3)).toBe(9);
    expect(scoreUpperSection(dice, 1)).toBe(1);
    expect(scoreUpperSection(dice, 2)).toBe(2);
    expect(scoreUpperSection(dice, 4)).toBe(0);
  });
});

// ============================================
// LOWER SECTION SCORING
// ============================================

describe('scoreThreeOfAKind', () => {
  test('scores sum when valid [3,3,3,5,6] = 20', () => {
    const dice = createDice([3, 3, 3, 5, 6]);
    expect(scoreThreeOfAKind(dice)).toBe(20);
  });

  test('scores 0 when invalid', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    expect(scoreThreeOfAKind(dice)).toBe(0);
  });

  test('4 of a kind also scores', () => {
    const dice = createDice([5, 5, 5, 5, 2]);
    expect(scoreThreeOfAKind(dice)).toBe(22);
  });

  test('Yahtzee also scores', () => {
    const dice = createDice([6, 6, 6, 6, 6]);
    expect(scoreThreeOfAKind(dice)).toBe(30);
  });
});

describe('scoreFourOfAKind', () => {
  test('scores sum when valid [4,4,4,4,3] = 19', () => {
    const dice = createDice([4, 4, 4, 4, 3]);
    expect(scoreFourOfAKind(dice)).toBe(19);
  });

  test('scores 0 when invalid (only 3 of a kind)', () => {
    const dice = createDice([2, 2, 2, 5, 6]);
    expect(scoreFourOfAKind(dice)).toBe(0);
  });

  test('Yahtzee also scores', () => {
    const dice = createDice([1, 1, 1, 1, 1]);
    expect(scoreFourOfAKind(dice)).toBe(5);
  });
});

describe('scoreFullHouse', () => {
  test('scores 25 for valid full house', () => {
    const dice = createDice([3, 3, 3, 5, 5]);
    expect(scoreFullHouse(dice)).toBe(25);
  });

  test('scores 0 for invalid', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    expect(scoreFullHouse(dice)).toBe(0);
  });

  test('scores 0 for 4 of a kind', () => {
    const dice = createDice([2, 2, 2, 2, 5]);
    expect(scoreFullHouse(dice)).toBe(0);
  });
});

describe('scoreSmallStraight', () => {
  test('scores 30 for [1,2,3,4,6]', () => {
    const dice = createDice([1, 2, 3, 4, 6]);
    expect(scoreSmallStraight(dice)).toBe(30);
  });

  test('scores 30 for large straight (also contains small)', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    expect(scoreSmallStraight(dice)).toBe(30);
  });

  test('scores 0 for no straight', () => {
    const dice = createDice([1, 1, 3, 5, 6]);
    expect(scoreSmallStraight(dice)).toBe(0);
  });

  test('scores 30 for [2,3,4,5,1]', () => {
    const dice = createDice([2, 3, 4, 5, 1]);
    expect(scoreSmallStraight(dice)).toBe(30);
  });
});

describe('scoreLargeStraight', () => {
  test('scores 40 for [1,2,3,4,5]', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    expect(scoreLargeStraight(dice)).toBe(40);
  });

  test('scores 40 for [2,3,4,5,6]', () => {
    const dice = createDice([2, 3, 4, 5, 6]);
    expect(scoreLargeStraight(dice)).toBe(40);
  });

  test('scores 0 for small straight only', () => {
    const dice = createDice([1, 2, 3, 4, 6]);
    expect(scoreLargeStraight(dice)).toBe(0);
  });

  test('scores 0 for no straight', () => {
    const dice = createDice([1, 1, 3, 5, 6]);
    expect(scoreLargeStraight(dice)).toBe(0);
  });
});

describe('scoreYahtzee', () => {
  test('scores 50 for Yahtzee', () => {
    const dice = createDice([5, 5, 5, 5, 5]);
    expect(scoreYahtzee(dice)).toBe(50);
  });

  test('scores 0 for non-Yahtzee', () => {
    const dice = createDice([5, 5, 5, 5, 2]);
    expect(scoreYahtzee(dice)).toBe(0);
  });
});

describe('scoreChance', () => {
  test('scores sum of all dice', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    expect(scoreChance(dice)).toBe(15);
  });

  test('scores sum for same values', () => {
    const dice = createDice([6, 6, 6, 6, 6]);
    expect(scoreChance(dice)).toBe(30);
  });

  test('scores sum for mixed', () => {
    const dice = createDice([3, 5, 2, 6, 1]);
    expect(scoreChance(dice)).toBe(17);
  });
});

// ============================================
// SCORECARD MANAGEMENT
// ============================================

describe('canScoreCategory', () => {
  test('can score when category is null', () => {
    const scorecard = createEmptyScorecard();
    expect(canScoreCategory('ones', scorecard)).toBe(true);
  });

  test('cannot score when category already filled', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 3;
    expect(canScoreCategory('ones', scorecard)).toBe(false);
  });

  test('can score 0 in category', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 0;
    expect(canScoreCategory('ones', scorecard)).toBe(false); // Already scored (even if 0)
  });
});

describe('getAvailableScores', () => {
  test('returns all categories when empty', () => {
    const scorecard = createEmptyScorecard();
    const dice = createDice([3, 3, 3, 5, 6]);
    const available = getAvailableScores(dice, scorecard);

    expect(Object.keys(available)).toHaveLength(13);
    expect(available.threes).toBe(9);
    expect(available.threeOfAKind).toBe(20);
  });

  test('excludes already scored categories', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 3;
    scorecard.twos = 4;
    const dice = createDice([1, 2, 3, 4, 5]);
    const available = getAvailableScores(dice, scorecard);

    expect(available.ones).toBeUndefined();
    expect(available.twos).toBeUndefined();
    expect(available.threes).toBe(3);
  });

  test('calculates correct potential scores', () => {
    const scorecard = createEmptyScorecard();
    const dice = createDice([6, 6, 6, 6, 6]);
    const available = getAvailableScores(dice, scorecard);

    expect(available.sixes).toBe(30);
    expect(available.yahtzee).toBe(50);
    expect(available.chance).toBe(30);
    expect(available.fourOfAKind).toBe(30);
    expect(available.threeOfAKind).toBe(30);
  });
});

describe('calculateCategoryScore', () => {
  test('calculates score for category', () => {
    const dice = createDice([3, 3, 3, 5, 6]);
    expect(calculateCategoryScore('threes', dice)).toBe(9);
    expect(calculateCategoryScore('threeOfAKind', dice)).toBe(20);
  });

  test('returns 0 for invalid category', () => {
    const dice = createDice([1, 2, 3, 4, 5]);
    expect(calculateCategoryScore('invalidCategory', dice)).toBe(0);
  });
});

describe('createEmptyScorecard', () => {
  test('creates scorecard with all nulls', () => {
    const scorecard = createEmptyScorecard();
    expect(scorecard.ones).toBeNull();
    expect(scorecard.twos).toBeNull();
    expect(scorecard.yahtzee).toBeNull();
    expect(scorecard.chance).toBeNull();
  });

  test('yahtzeeBonusCount starts at 0', () => {
    const scorecard = createEmptyScorecard();
    expect(scorecard.yahtzeeBonusCount).toBe(0);
  });

  test('has all 13 categories', () => {
    const scorecard = createEmptyScorecard();
    const categories = [...UPPER_CATEGORIES, ...LOWER_CATEGORIES];
    categories.forEach(cat => {
      expect(scorecard[cat]).toBeNull();
    });
  });
});

// ============================================
// BONUS CALCULATION
// ============================================

describe('calculateUpperBonus', () => {
  test('awards 35 bonus when upper >= 63', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 3;    // 3
    scorecard.twos = 6;    // 6
    scorecard.threes = 9;  // 9
    scorecard.fours = 12;  // 12
    scorecard.fives = 15;  // 15
    scorecard.sixes = 18;  // 18
    // Total = 63
    expect(calculateUpperBonus(scorecard)).toBe(35);
  });

  test('no bonus when upper < 63', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 3;
    scorecard.twos = 6;
    scorecard.threes = 9;
    scorecard.fours = 12;
    scorecard.fives = 15;
    scorecard.sixes = 12; // Total = 57
    expect(calculateUpperBonus(scorecard)).toBe(0);
  });

  test('bonus awarded when upper > 63', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 5;
    scorecard.twos = 10;
    scorecard.threes = 15;
    scorecard.fours = 20;
    scorecard.fives = 25;
    scorecard.sixes = 30; // Total = 105
    expect(calculateUpperBonus(scorecard)).toBe(35);
  });

  test('handles partial scorecard', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 5;
    scorecard.sixes = 30; // Total = 35
    expect(calculateUpperBonus(scorecard)).toBe(0);
  });
});

// ============================================
// TOTAL CALCULATION
// ============================================

describe('calculateUpperSum', () => {
  test('sums upper section without bonus', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 3;
    scorecard.twos = 6;
    scorecard.threes = 9;
    expect(calculateUpperSum(scorecard)).toBe(18);
  });

  test('handles nulls as 0', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 5;
    expect(calculateUpperSum(scorecard)).toBe(5);
  });
});

describe('calculateUpperTotal', () => {
  test('includes bonus in total', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 3;
    scorecard.twos = 6;
    scorecard.threes = 9;
    scorecard.fours = 12;
    scorecard.fives = 15;
    scorecard.sixes = 18;
    // Sum = 63, Bonus = 35, Total = 98
    expect(calculateUpperTotal(scorecard)).toBe(98);
  });

  test('total without bonus', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 3;
    scorecard.twos = 4;
    // Sum = 7, Bonus = 0, Total = 7
    expect(calculateUpperTotal(scorecard)).toBe(7);
  });
});

describe('calculateLowerTotal', () => {
  test('sums lower section', () => {
    const scorecard = createEmptyScorecard();
    scorecard.threeOfAKind = 20;
    scorecard.chance = 25;
    expect(calculateLowerTotal(scorecard)).toBe(45);
  });

  test('includes Yahtzee bonus', () => {
    const scorecard = createEmptyScorecard();
    scorecard.yahtzee = 50;
    scorecard.yahtzeeBonusCount = 2; // 200 bonus
    expect(calculateLowerTotal(scorecard)).toBe(250);
  });

  test('handles nulls', () => {
    const scorecard = createEmptyScorecard();
    scorecard.fullHouse = 25;
    expect(calculateLowerTotal(scorecard)).toBe(25);
  });
});

describe('calculateGrandTotal', () => {
  test('sums upper and lower', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 5;
    scorecard.twos = 10;
    scorecard.threes = 15;
    scorecard.fours = 20;
    scorecard.fives = 25;
    scorecard.sixes = 30; // Upper sum = 105, bonus = 35, total = 140

    scorecard.yahtzee = 50;
    scorecard.chance = 30; // Lower total = 80

    // Grand total = 140 + 80 = 220
    expect(calculateGrandTotal(scorecard)).toBe(220);
  });

  test('perfect game calculation', () => {
    const scorecard = createEmptyScorecard();
    // Upper section (all 5s of each)
    scorecard.ones = 5;
    scorecard.twos = 10;
    scorecard.threes = 15;
    scorecard.fours = 20;
    scorecard.fives = 25;
    scorecard.sixes = 30;
    // Upper = 105 + 35 bonus = 140

    // Lower section
    scorecard.threeOfAKind = 30;
    scorecard.fourOfAKind = 30;
    scorecard.fullHouse = 25;
    scorecard.smallStraight = 30;
    scorecard.largeStraight = 40;
    scorecard.yahtzee = 50;
    scorecard.chance = 30;
    // Lower = 235

    // Grand = 140 + 235 = 375
    expect(calculateGrandTotal(scorecard)).toBe(375);
  });
});

// ============================================
// GAME COMPLETION
// ============================================

describe('isGameComplete', () => {
  test('empty scorecard is not complete', () => {
    const scorecard = createEmptyScorecard();
    expect(isGameComplete(scorecard)).toBe(false);
  });

  test('complete when all 13 categories filled', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 0;
    scorecard.twos = 0;
    scorecard.threes = 0;
    scorecard.fours = 0;
    scorecard.fives = 0;
    scorecard.sixes = 0;
    scorecard.threeOfAKind = 0;
    scorecard.fourOfAKind = 0;
    scorecard.fullHouse = 0;
    scorecard.smallStraight = 0;
    scorecard.largeStraight = 0;
    scorecard.yahtzee = 0;
    scorecard.chance = 0;

    expect(isGameComplete(scorecard)).toBe(true);
  });

  test('not complete with 12/13 filled', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 5;
    scorecard.twos = 10;
    scorecard.threes = 15;
    scorecard.fours = 20;
    scorecard.fives = 25;
    scorecard.sixes = 30;
    scorecard.threeOfAKind = 20;
    scorecard.fourOfAKind = 19;
    scorecard.fullHouse = 25;
    scorecard.smallStraight = 30;
    scorecard.largeStraight = 40;
    scorecard.yahtzee = 50;
    // chance is still null

    expect(isGameComplete(scorecard)).toBe(false);
  });
});

describe('getRemainingTurns', () => {
  test('13 turns remaining when empty', () => {
    const scorecard = createEmptyScorecard();
    expect(getRemainingTurns(scorecard)).toBe(13);
  });

  test('0 turns remaining when complete', () => {
    const scorecard = createEmptyScorecard();
    [...UPPER_CATEGORIES, ...LOWER_CATEGORIES].forEach(cat => {
      scorecard[cat] = 0;
    });
    expect(getRemainingTurns(scorecard)).toBe(0);
  });

  test('correct count with partial scorecard', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 5;
    scorecard.twos = 10;
    scorecard.yahtzee = 50;
    // 3 filled, 10 remaining
    expect(getRemainingTurns(scorecard)).toBe(10);
  });
});

// ============================================
// CONSTANTS
// ============================================

describe('Category constants', () => {
  test('UPPER_CATEGORIES has 6 categories', () => {
    expect(UPPER_CATEGORIES).toHaveLength(6);
    expect(UPPER_CATEGORIES).toContain('ones');
    expect(UPPER_CATEGORIES).toContain('sixes');
  });

  test('LOWER_CATEGORIES has 7 categories', () => {
    expect(LOWER_CATEGORIES).toHaveLength(7);
    expect(LOWER_CATEGORIES).toContain('threeOfAKind');
    expect(LOWER_CATEGORIES).toContain('yahtzee');
    expect(LOWER_CATEGORIES).toContain('chance');
  });

  test('total 13 categories', () => {
    const total = UPPER_CATEGORIES.length + LOWER_CATEGORIES.length;
    expect(total).toBe(13);
  });
});

// ============================================
// COMPLEX SCORING SCENARIOS
// ============================================

describe('Complex scoring scenarios', () => {
  test('Yahtzee can score in multiple categories', () => {
    const dice = createDice([5, 5, 5, 5, 5]);

    expect(scoreFives(dice)).toBe(25);
    expect(scoreThreeOfAKind(dice)).toBe(25);
    expect(scoreFourOfAKind(dice)).toBe(25);
    expect(scoreYahtzee(dice)).toBe(50);
    expect(scoreChance(dice)).toBe(25);
    // Not full house, not straight
    expect(scoreFullHouse(dice)).toBe(0);
    expect(scoreSmallStraight(dice)).toBe(0);
  });

  test('Large straight scoring', () => {
    const dice = createDice([1, 2, 3, 4, 5]);

    expect(scoreSmallStraight(dice)).toBe(30);
    expect(scoreLargeStraight(dice)).toBe(40);
    expect(scoreChance(dice)).toBe(15);
    // Not any-of-a-kind, not full house
    expect(scoreThreeOfAKind(dice)).toBe(0);
    expect(scoreFullHouse(dice)).toBe(0);
  });

  test('Full house with high values', () => {
    const dice = createDice([6, 6, 6, 5, 5]);

    expect(scoreSixes(dice)).toBe(18);
    expect(scoreFives(dice)).toBe(10);
    expect(scoreFullHouse(dice)).toBe(25);
    expect(scoreThreeOfAKind(dice)).toBe(28);
    expect(scoreChance(dice)).toBe(28);
  });

  test('worst possible roll [1,1,1,1,2]', () => {
    const dice = createDice([1, 1, 1, 1, 2]);

    expect(scoreOnes(dice)).toBe(4);
    expect(scoreThreeOfAKind(dice)).toBe(6);
    expect(scoreFourOfAKind(dice)).toBe(6);
    expect(scoreChance(dice)).toBe(6);
    expect(scoreYahtzee(dice)).toBe(0);
    expect(scoreFullHouse(dice)).toBe(0);
  });
});
