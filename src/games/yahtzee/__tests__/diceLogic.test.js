/**
 * Tests for Yahtzee Dice Logic
 * @module diceLogic.test
 */

import {
  generateSeedFromSource,
  calculateDieValue,
  rollDice,
  toggleHold,
  resetDice,
  canRoll,
  createInitialDice,
  clearAllHolds,
  getDiceValues,
  countHeldDice
} from '../diceLogic';

// ============================================
// TEST HELPERS
// ============================================

function createMockRollSource() {
  return {
    blockHash: 'abc123',
    txHash: 'def456',
    timestamp: 1234567890,
    txIndex: 0
  };
}

function createTestDice(values = [1, 2, 3, 4, 5], holds = [false, false, false, false, false]) {
  return values.map((value, index) => ({
    id: index,
    value: value,
    isHeld: holds[index]
  }));
}

// ============================================
// SEED GENERATION
// ============================================

describe('generateSeedFromSource', () => {
  test('generates deterministic seed from blockchain data', () => {
    const source = createMockRollSource();
    const seed1 = generateSeedFromSource(source, 'game1', 1, 1);
    const seed2 = generateSeedFromSource(source, 'game1', 1, 1);
    expect(seed1).toBe(seed2);
    expect(typeof seed1).toBe('string');
    expect(seed1.length).toBe(64); // SHA256 = 64 hex chars
  });

  test('different game IDs produce different seeds', () => {
    const source = createMockRollSource();
    const seed1 = generateSeedFromSource(source, 'game1', 1, 1);
    const seed2 = generateSeedFromSource(source, 'game2', 1, 1);
    expect(seed1).not.toBe(seed2);
  });

  test('different turn numbers produce different seeds', () => {
    const source = createMockRollSource();
    const seed1 = generateSeedFromSource(source, 'game1', 1, 1);
    const seed2 = generateSeedFromSource(source, 'game1', 2, 1);
    expect(seed1).not.toBe(seed2);
  });

  test('different roll numbers produce different seeds', () => {
    const source = createMockRollSource();
    const seed1 = generateSeedFromSource(source, 'game1', 1, 1);
    const seed2 = generateSeedFromSource(source, 'game1', 1, 2);
    expect(seed1).not.toBe(seed2);
  });

  test('different blockchain data produces different seeds', () => {
    const source1 = { ...createMockRollSource(), blockHash: 'aaa' };
    const source2 = { ...createMockRollSource(), blockHash: 'bbb' };
    const seed1 = generateSeedFromSource(source1, 'game1', 1, 1);
    const seed2 = generateSeedFromSource(source2, 'game1', 1, 1);
    expect(seed1).not.toBe(seed2);
  });
});

// ============================================
// DIE VALUE CALCULATION
// ============================================

describe('calculateDieValue', () => {
  test('returns value between 1 and 6', () => {
    const seed = 'abc123';
    for (let i = 0; i < 5; i++) {
      const value = calculateDieValue(seed, i);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
    }
  });

  test('same seed and index produce same value', () => {
    const seed = 'abc123';
    const value1 = calculateDieValue(seed, 0);
    const value2 = calculateDieValue(seed, 0);
    expect(value1).toBe(value2);
  });

  test('different die indices produce different values', () => {
    const seed = 'abc123';
    const values = [];
    for (let i = 0; i < 5; i++) {
      values.push(calculateDieValue(seed, i));
    }
    // Not all values should be the same (statistically unlikely)
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBeGreaterThan(1);
  });

  test('different seeds produce different distributions', () => {
    const value1 = calculateDieValue('seed1', 0);
    const value2 = calculateDieValue('seed2', 0);
    const value3 = calculateDieValue('seed3', 0);
    // At least one should be different
    expect(value1 === value2 && value2 === value3).toBe(false);
  });
});

// ============================================
// DICE ROLLING
// ============================================

describe('rollDice', () => {
  test('rolls all unheld dice', () => {
    const dice = createTestDice([1, 1, 1, 1, 1], [false, false, false, false, false]);
    const source = createMockRollSource();
    const result = rollDice(dice, source, 'game1', 1, 1);

    expect(result.dice).toHaveLength(5);
    expect(result.seed).toBeDefined();
    expect(result.rollSource).toBe(source);
  });

  test('preserves held dice values', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [false, true, false, true, false]);
    const source = createMockRollSource();
    const result = rollDice(dice, source, 'game1', 1, 1);

    expect(result.dice[1].value).toBe(2); // Held
    expect(result.dice[3].value).toBe(4); // Held
  });

  test('preserves held status', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [false, true, false, true, false]);
    const source = createMockRollSource();
    const result = rollDice(dice, source, 'game1', 1, 1);

    expect(result.dice[1].isHeld).toBe(true);
    expect(result.dice[3].isHeld).toBe(true);
    expect(result.dice[0].isHeld).toBe(false);
  });

  test('different turns produce different rolls', () => {
    const dice = createTestDice();
    const source = createMockRollSource();
    const result1 = rollDice(dice, source, 'game1', 1, 1);
    const result2 = rollDice(dice, source, 'game1', 2, 1);

    expect(result1.seed).not.toBe(result2.seed);
  });

  test('returns seed and source in result', () => {
    const dice = createTestDice();
    const source = createMockRollSource();
    const result = rollDice(dice, source, 'game1', 1, 1);

    expect(result.seed).toBeDefined();
    expect(result.rollSource).toEqual(source);
  });
});

// ============================================
// DICE HOLDING
// ============================================

describe('toggleHold', () => {
  test('toggles hold from false to true', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [false, false, false, false, false]);
    const result = toggleHold(dice, 2);

    expect(result[2].isHeld).toBe(true);
    expect(result[0].isHeld).toBe(false);
    expect(result[1].isHeld).toBe(false);
  });

  test('toggles hold from true to false', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [false, true, false, false, false]);
    const result = toggleHold(dice, 1);

    expect(result[1].isHeld).toBe(false);
  });

  test('does not mutate original dice', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [false, false, false, false, false]);
    const result = toggleHold(dice, 2);

    expect(dice[2].isHeld).toBe(false);
    expect(result[2].isHeld).toBe(true);
  });

  test('handles invalid index (negative)', () => {
    const dice = createTestDice();
    const result = toggleHold(dice, -1);

    expect(result).toEqual(dice);
  });

  test('handles invalid index (too large)', () => {
    const dice = createTestDice();
    const result = toggleHold(dice, 5);

    expect(result).toEqual(dice);
  });

  test('toggles multiple dice independently', () => {
    const dice = createTestDice();
    let result = toggleHold(dice, 0);
    result = toggleHold(result, 2);
    result = toggleHold(result, 4);

    expect(result[0].isHeld).toBe(true);
    expect(result[1].isHeld).toBe(false);
    expect(result[2].isHeld).toBe(true);
    expect(result[3].isHeld).toBe(false);
    expect(result[4].isHeld).toBe(true);
  });
});

// ============================================
// DICE RESET
// ============================================

describe('resetDice', () => {
  test('creates 5 dice', () => {
    const dice = resetDice();
    expect(dice).toHaveLength(5);
  });

  test('all dice have value 1', () => {
    const dice = resetDice();
    dice.forEach(die => {
      expect(die.value).toBe(1);
    });
  });

  test('all dice are not held', () => {
    const dice = resetDice();
    dice.forEach(die => {
      expect(die.isHeld).toBe(false);
    });
  });

  test('each die has unique id', () => {
    const dice = resetDice();
    const ids = dice.map(d => d.id);
    expect(ids).toEqual([0, 1, 2, 3, 4]);
  });
});

// ============================================
// ROLL AVAILABILITY
// ============================================

describe('canRoll', () => {
  test('can roll with 3 rolls remaining', () => {
    expect(canRoll(3)).toBe(true);
  });

  test('can roll with 2 rolls remaining', () => {
    expect(canRoll(2)).toBe(true);
  });

  test('can roll with 1 roll remaining', () => {
    expect(canRoll(1)).toBe(true);
  });

  test('cannot roll with 0 rolls remaining', () => {
    expect(canRoll(0)).toBe(false);
  });

  test('cannot roll with negative rolls', () => {
    expect(canRoll(-1)).toBe(false);
  });
});

// ============================================
// INITIAL DICE CREATION
// ============================================

describe('createInitialDice', () => {
  test('creates 5 dice', () => {
    const dice = createInitialDice();
    expect(dice).toHaveLength(5);
  });

  test('matches resetDice output', () => {
    const dice1 = createInitialDice();
    const dice2 = resetDice();
    expect(dice1).toEqual(dice2);
  });
});

// ============================================
// CLEAR HOLDS
// ============================================

describe('clearAllHolds', () => {
  test('clears all holds', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [true, true, true, true, true]);
    const result = clearAllHolds(dice);

    result.forEach(die => {
      expect(die.isHeld).toBe(false);
    });
  });

  test('preserves values', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [true, true, true, true, true]);
    const result = clearAllHolds(dice);

    expect(result.map(d => d.value)).toEqual([1, 2, 3, 4, 5]);
  });

  test('does not mutate original dice', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [true, true, true, true, true]);
    const result = clearAllHolds(dice);

    expect(dice[0].isHeld).toBe(true);
    expect(result[0].isHeld).toBe(false);
  });

  test('handles already cleared holds', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [false, false, false, false, false]);
    const result = clearAllHolds(dice);

    result.forEach(die => {
      expect(die.isHeld).toBe(false);
    });
  });

  test('clears partial holds', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [true, false, true, false, true]);
    const result = clearAllHolds(dice);

    result.forEach(die => {
      expect(die.isHeld).toBe(false);
    });
  });
});

// ============================================
// GET DICE VALUES
// ============================================

describe('getDiceValues', () => {
  test('returns array of values', () => {
    const dice = createTestDice([1, 2, 3, 4, 5]);
    const values = getDiceValues(dice);

    expect(values).toEqual([1, 2, 3, 4, 5]);
  });

  test('returns all same values', () => {
    const dice = createTestDice([6, 6, 6, 6, 6]);
    const values = getDiceValues(dice);

    expect(values).toEqual([6, 6, 6, 6, 6]);
  });

  test('works with mixed values', () => {
    const dice = createTestDice([1, 3, 5, 2, 4]);
    const values = getDiceValues(dice);

    expect(values).toEqual([1, 3, 5, 2, 4]);
  });

  test('ignores hold status', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [true, true, true, true, true]);
    const values = getDiceValues(dice);

    expect(values).toEqual([1, 2, 3, 4, 5]);
  });
});

// ============================================
// COUNT HELD DICE
// ============================================

describe('countHeldDice', () => {
  test('counts 0 held dice', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [false, false, false, false, false]);
    expect(countHeldDice(dice)).toBe(0);
  });

  test('counts all 5 held dice', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [true, true, true, true, true]);
    expect(countHeldDice(dice)).toBe(5);
  });

  test('counts partial held dice', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [true, false, true, false, false]);
    expect(countHeldDice(dice)).toBe(2);
  });

  test('counts 3 held dice', () => {
    const dice = createTestDice([1, 2, 3, 4, 5], [true, true, false, false, true]);
    expect(countHeldDice(dice)).toBe(3);
  });
});

// ============================================
// INTEGRATION - FULL TURN FLOW
// ============================================

describe('Integration: Full Turn Flow', () => {
  test('complete turn with 3 rolls', () => {
    const source = createMockRollSource();

    // Roll 1
    let dice = createInitialDice();
    let result = rollDice(dice, source, 'game1', 1, 1);
    expect(canRoll(3)).toBe(true);

    // Hold some dice
    dice = toggleHold(result.dice, 0);
    dice = toggleHold(dice, 2);
    expect(countHeldDice(dice)).toBe(2);

    // Roll 2 (held dice preserved)
    result = rollDice(dice, source, 'game1', 1, 2);
    expect(canRoll(2)).toBe(true);
    expect(result.dice[0].isHeld).toBe(true);
    expect(result.dice[2].isHeld).toBe(true);

    // Roll 3
    result = rollDice(result.dice, source, 'game1', 1, 3);
    expect(canRoll(1)).toBe(true);
    expect(canRoll(0)).toBe(false);

    // Clear holds for next turn
    dice = clearAllHolds(result.dice);
    expect(countHeldDice(dice)).toBe(0);
  });

  test('hold all dice after first roll', () => {
    const source = createMockRollSource();

    let dice = resetDice();
    let result = rollDice(dice, source, 'game1', 1, 1);

    // Hold all 5
    result.dice.forEach((_, idx) => {
      dice = toggleHold(result.dice, idx);
      result = { ...result, dice };
    });

    expect(countHeldDice(result.dice)).toBe(5);

    // Roll again - all values should be preserved
    const values1 = getDiceValues(result.dice);
    result = rollDice(result.dice, source, 'game1', 1, 2);
    const values2 = getDiceValues(result.dice);

    expect(values1).toEqual(values2);
  });
});
