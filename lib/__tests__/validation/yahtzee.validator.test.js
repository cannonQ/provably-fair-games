/**
 * Tests for Yahtzee History Validator
 */

import {
  validateYahtzeeGame,
  validateRollSequence,
  validateCategoryScore,
  calculateMaxPossibleScore
} from '../../validation/games/yahtzee/historyValidator.js';

import { createEmptyScorecard } from '../../validation/games/yahtzee/scoringLogic.js';

// ============================================
// TEST HELPERS
// ============================================

function createMockRoll(turn, rollNumber, diceValues) {
  return {
    turn,
    rollNumber,
    dice: diceValues.map((value, index) => ({
      id: index,
      value,
      isHeld: false
    }))
  };
}

function createCompleteScorecard() {
  return {
    ones: 3,
    twos: 6,
    threes: 9,
    fours: 12,
    fives: 15,
    sixes: 18,      // Upper sum = 63, bonus = 35, total = 98
    threeOfAKind: 20,
    fourOfAKind: 0,
    fullHouse: 25,
    smallStraight: 30,
    largeStraight: 0,
    yahtzee: 50,
    chance: 25,
    yahtzeeBonusCount: 0  // Lower = 150, Grand total = 248
  };
}

// ============================================
// GAME VALIDATION TESTS
// ============================================

describe('validateYahtzeeGame', () => {
  test('validates complete valid game', () => {
    const scorecard = createCompleteScorecard();
    const rollHistory = Array.from({ length: 13 }, (_, i) =>
      createMockRoll(i + 1, 1, [1, 2, 3, 4, 5])
    );

    const result = validateYahtzeeGame({
      rollHistory,
      scorecard,
      score: 248
    });

    expect(result.valid).toBe(true);
    expect(result.calculatedScore).toBe(248);
  });

  test('rejects missing roll history', () => {
    const scorecard = createCompleteScorecard();

    const result = validateYahtzeeGame({
      scorecard,
      score: 248
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing or invalid roll history');
  });

  test('rejects missing scorecard', () => {
    const rollHistory = Array.from({ length: 13 }, (_, i) =>
      createMockRoll(i + 1, 1, [1, 2, 3, 4, 5])
    );

    const result = validateYahtzeeGame({
      rollHistory,
      score: 248
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing scorecard');
  });

  test('rejects missing score', () => {
    const scorecard = createCompleteScorecard();
    const rollHistory = Array.from({ length: 13 }, (_, i) =>
      createMockRoll(i + 1, 1, [1, 2, 3, 4, 5])
    );

    const result = validateYahtzeeGame({
      rollHistory,
      scorecard
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing score');
  });

  test('rejects incomplete game', () => {
    const scorecard = createEmptyScorecard();
    scorecard.ones = 3;
    scorecard.twos = 6;
    // Only 2 categories filled, game not complete

    const rollHistory = [
      createMockRoll(1, 1, [1, 1, 1, 2, 3]),
      createMockRoll(2, 1, [2, 2, 2, 3, 4])
    ];

    const result = validateYahtzeeGame({
      rollHistory,
      scorecard,
      score: 9
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not complete');
  });

  test('rejects invalid roll count (too few)', () => {
    const scorecard = createCompleteScorecard();
    const rollHistory = Array.from({ length: 10 }, (_, i) =>
      createMockRoll(i + 1, 1, [1, 2, 3, 4, 5])
    );

    const result = validateYahtzeeGame({
      rollHistory,
      scorecard,
      score: 248
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid roll count: 10');
  });

  test('rejects invalid roll count (too many)', () => {
    const scorecard = createCompleteScorecard();
    const rollHistory = Array.from({ length: 50 }, (_, i) =>
      createMockRoll(i + 1, 1, [1, 2, 3, 4, 5])
    );

    const result = validateYahtzeeGame({
      rollHistory,
      scorecard,
      score: 248
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid roll count: 50');
  });

  test('rejects score mismatch', () => {
    const scorecard = createCompleteScorecard();
    const rollHistory = Array.from({ length: 13 }, (_, i) =>
      createMockRoll(i + 1, 1, [1, 2, 3, 4, 5])
    );

    const result = validateYahtzeeGame({
      rollHistory,
      scorecard,
      score: 300  // Wrong score
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Score mismatch');
    expect(result.calculatedScore).toBe(248);
  });

  test('includes detailed score breakdown', () => {
    const scorecard = createCompleteScorecard();
    const rollHistory = Array.from({ length: 13 }, (_, i) =>
      createMockRoll(i + 1, 1, [1, 2, 3, 4, 5])
    );

    const result = validateYahtzeeGame({
      rollHistory,
      scorecard,
      score: 248
    });

    expect(result.valid).toBe(true);
    expect(result.details.upperTotal).toBe(98);
    expect(result.details.lowerTotal).toBe(150);
    expect(result.details.upperBonus).toBe(35);
    expect(result.details.grandTotal).toBe(248);
  });

  test('validates perfect game (375)', () => {
    const scorecard = {
      ones: 5,
      twos: 10,
      threes: 15,
      fours: 20,
      fives: 25,
      sixes: 30,  // Upper = 105 + 35 bonus = 140
      threeOfAKind: 30,
      fourOfAKind: 30,
      fullHouse: 25,
      smallStraight: 30,
      largeStraight: 40,
      yahtzee: 50,
      chance: 30,
      yahtzeeBonusCount: 0  // Lower = 235, Total = 375
    };

    const rollHistory = Array.from({ length: 13 }, (_, i) =>
      createMockRoll(i + 1, 1, [6, 6, 6, 6, 6])
    );

    const result = validateYahtzeeGame({
      rollHistory,
      scorecard,
      score: 375
    });

    expect(result.valid).toBe(true);
    expect(result.calculatedScore).toBe(375);
  });
});

// ============================================
// ROLL SEQUENCE VALIDATION TESTS
// ============================================

describe('validateRollSequence', () => {
  test('validates correct roll sequence', () => {
    const rollHistory = Array.from({ length: 13 }, (_, i) =>
      createMockRoll(i + 1, 1, [1, 2, 3, 4, 5])
    );

    const result = validateRollSequence(rollHistory);
    expect(result.valid).toBe(true);
  });

  test('validates sequence with multiple rolls per turn', () => {
    const rollHistory = [
      createMockRoll(1, 1, [1, 2, 3, 4, 5]),
      createMockRoll(1, 2, [1, 2, 3, 4, 6]),
      createMockRoll(1, 3, [1, 2, 3, 4, 6]),
      createMockRoll(2, 1, [2, 2, 2, 2, 2]),
      // ... continues for 13 turns
    ];

    // Add remaining turns
    for (let i = 3; i <= 13; i++) {
      rollHistory.push(createMockRoll(i, 1, [1, 2, 3, 4, 5]));
    }

    const result = validateRollSequence(rollHistory);
    expect(result.valid).toBe(true);
  });

  test('rejects roll with invalid die value', () => {
    const rollHistory = [
      createMockRoll(1, 1, [1, 2, 3, 4, 7])  // 7 is invalid
    ];

    // Add remaining turns
    for (let i = 2; i <= 13; i++) {
      rollHistory.push(createMockRoll(i, 1, [1, 2, 3, 4, 5]));
    }

    const result = validateRollSequence(rollHistory);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('invalid value: 7');
  });

  test('rejects roll with wrong number of dice', () => {
    const rollHistory = [
      createMockRoll(1, 1, [1, 2, 3, 4])  // Only 4 dice
    ];

    // Add remaining turns
    for (let i = 2; i <= 13; i++) {
      rollHistory.push(createMockRoll(i, 1, [1, 2, 3, 4, 5]));
    }

    const result = validateRollSequence(rollHistory);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('4 dice (expected 5)');
  });

  test('rejects too many rolls in one turn', () => {
    const rollHistory = [
      createMockRoll(1, 1, [1, 2, 3, 4, 5]),
      createMockRoll(1, 2, [1, 2, 3, 4, 5]),
      createMockRoll(1, 3, [1, 2, 3, 4, 5]),
      createMockRoll(1, 4, [1, 2, 3, 4, 5]),  // 4th roll - invalid
    ];

    // Add remaining turns
    for (let i = 2; i <= 13; i++) {
      rollHistory.push(createMockRoll(i, 1, [1, 2, 3, 4, 5]));
    }

    const result = validateRollSequence(rollHistory);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('4 rolls (expected 1-3)');
  });

  test('rejects wrong number of turns', () => {
    const rollHistory = Array.from({ length: 10 }, (_, i) =>
      createMockRoll(i + 1, 1, [1, 2, 3, 4, 5])
    );

    const result = validateRollSequence(rollHistory);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Expected 13 turns, got 10');
  });
});

// ============================================
// CATEGORY SCORE VALIDATION TESTS
// ============================================

describe('validateCategoryScore', () => {
  test('validates correct ones score', () => {
    const result = validateCategoryScore('ones', [1, 1, 1, 2, 3], 3);
    expect(result.valid).toBe(true);
    expect(result.expectedScore).toBe(3);
  });

  test('validates correct yahtzee score', () => {
    const result = validateCategoryScore('yahtzee', [5, 5, 5, 5, 5], 50);
    expect(result.valid).toBe(true);
    expect(result.expectedScore).toBe(50);
  });

  test('validates correct full house score', () => {
    const result = validateCategoryScore('fullHouse', [3, 3, 3, 5, 5], 25);
    expect(result.valid).toBe(true);
    expect(result.expectedScore).toBe(25);
  });

  test('rejects incorrect score', () => {
    const result = validateCategoryScore('ones', [1, 1, 1, 2, 3], 5);  // Should be 3
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('expected 3, got 5');
    expect(result.expectedScore).toBe(3);
  });

  test('validates zero score when category not achieved', () => {
    const result = validateCategoryScore('yahtzee', [1, 2, 3, 4, 5], 0);
    expect(result.valid).toBe(true);
    expect(result.expectedScore).toBe(0);
  });

  test('works with dice objects', () => {
    const dice = [
      { id: 0, value: 6, isHeld: false },
      { id: 1, value: 6, isHeld: false },
      { id: 2, value: 6, isHeld: false },
      { id: 3, value: 6, isHeld: false },
      { id: 4, value: 6, isHeld: false }
    ];

    const result = validateCategoryScore('sixes', dice, 30);
    expect(result.valid).toBe(true);
    expect(result.expectedScore).toBe(30);
  });
});

// ============================================
// MAX SCORE CALCULATION TESTS
// ============================================

describe('calculateMaxPossibleScore', () => {
  test('calculates max from all yahtzees', () => {
    const rollHistory = Array.from({ length: 13 }, (_, i) =>
      createMockRoll(i + 1, 1, [6, 6, 6, 6, 6])
    );

    const maxScore = calculateMaxPossibleScore(rollHistory);
    expect(maxScore).toBeGreaterThan(0);
    // With all 6s: sixes=30, 3-kind=30, 4-kind=30, yahtzee=50, chance=30, etc.
  });

  test('calculates max from mixed rolls', () => {
    const rollHistory = [
      createMockRoll(1, 1, [1, 2, 3, 4, 5]),  // Large straight
      createMockRoll(2, 1, [2, 3, 4, 5, 6]),  // Large straight
      createMockRoll(3, 1, [6, 6, 6, 6, 6]),  // Yahtzee
      createMockRoll(4, 1, [1, 1, 1, 1, 1]),  // Yahtzee
    ];

    // Add more turns
    for (let i = 5; i <= 13; i++) {
      rollHistory.push(createMockRoll(i, 1, [3, 3, 3, 5, 5]));  // Full house
    }

    const maxScore = calculateMaxPossibleScore(rollHistory);
    expect(maxScore).toBeGreaterThan(0);
  });

  test('handles empty roll history', () => {
    const maxScore = calculateMaxPossibleScore([]);
    expect(maxScore).toBe(0);
  });
});
