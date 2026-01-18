/**
 * Backgammon Game Logic Tests
 *
 * Week 1, Monday: First test file to verify Jest is working
 *
 * These tests check basic game logic functions like:
 * - Movement direction (white vs black)
 * - Doubles detection
 * - Dice availability checking
 */

import {
  getDirection,
  isDoubles,
  getAvailableDice,
  expandDiceForDoubles
} from '../gameLogic';

// ============================================
// MOVEMENT DIRECTION TESTS
// ============================================

describe('Movement Direction', () => {
  test('white player moves in decreasing direction (24 → 1)', () => {
    const direction = getDirection('white');
    expect(direction).toBe(-1);
  });

  test('black player moves in increasing direction (1 → 24)', () => {
    const direction = getDirection('black');
    expect(direction).toBe(1);
  });
});

// ============================================
// DOUBLES DETECTION TESTS
// ============================================

describe('Doubles Detection', () => {
  test('detects doubles when both dice are the same', () => {
    expect(isDoubles([3, 3])).toBe(true);
    expect(isDoubles([6, 6])).toBe(true);
    expect(isDoubles([1, 1])).toBe(true);
  });

  test('returns false when dice are different', () => {
    expect(isDoubles([3, 5])).toBe(false);
    expect(isDoubles([1, 6])).toBe(false);
    expect(isDoubles([2, 4])).toBe(false);
  });

  test('returns false for invalid input', () => {
    expect(isDoubles(null)).toBe(false);
    expect(isDoubles(undefined)).toBe(false);
    expect(isDoubles([1])).toBe(false);
    expect(isDoubles([])).toBe(false);
  });
});

// ============================================
// DICE AVAILABILITY TESTS
// ============================================

describe('Available Dice', () => {
  test('returns all dice when none are used', () => {
    const dice = [3, 5];
    const diceUsed = [false, false];
    const available = getAvailableDice(dice, diceUsed);
    expect(available).toEqual([3, 5]);
  });

  test('returns only unused dice', () => {
    const dice = [3, 5];
    const diceUsed = [true, false];
    const available = getAvailableDice(dice, diceUsed);
    expect(available).toEqual([5]);
  });

  test('returns empty array when all dice are used', () => {
    const dice = [3, 5];
    const diceUsed = [true, true];
    const available = getAvailableDice(dice, diceUsed);
    expect(available).toEqual([]);
  });

  test('handles doubles (4 dice)', () => {
    const dice = [4, 4, 4, 4];
    const diceUsed = [true, false, true, false];
    const available = getAvailableDice(dice, diceUsed);
    expect(available).toEqual([4, 4]);
  });

  test('returns empty array for invalid input', () => {
    expect(getAvailableDice(null, null)).toEqual([]);
    expect(getAvailableDice([3, 5], null)).toEqual([]);
    expect(getAvailableDice(null, [false, false])).toEqual([]);
  });
});

// ============================================
// DOUBLES EXPANSION TESTS
// ============================================

describe('Doubles Expansion', () => {
  test('expands doubles to 4 identical dice', () => {
    expect(expandDiceForDoubles([3, 3])).toEqual([3, 3, 3, 3]);
    expect(expandDiceForDoubles([6, 6])).toEqual([6, 6, 6, 6]);
  });

  test('keeps non-doubles as-is', () => {
    expect(expandDiceForDoubles([3, 5])).toEqual([3, 5]);
    expect(expandDiceForDoubles([1, 6])).toEqual([1, 6]);
  });
});
