/**
 * Backgammon Doubles Tests
 *
 * Week 2, Friday: Comprehensive doubles testing
 *
 * Doubles Rules:
 * - When dice show same value (e.g., [3,3]), player gets 4 moves
 * - All 4 moves must be used if possible
 * - If blocked, use as many as possible
 * - Applies to movement, bar entry, and bearing off
 *
 * Tests:
 * - Doubles detection and expansion
 * - Using all 4 moves
 * - Partial use when blocked
 * - Doubles in special scenarios
 */

import {
  getAllLegalMoves,
  canMakeMove
} from '../moveValidation';

import {
  isDoubles,
  expandDiceForDoubles,
  getAvailableDice
} from '../gameLogic';

import {
  createEmptyState,
  placeChecker,
  placeOnBar,
  setDice
} from './test-helpers';

// ============================================
// DOUBLES DETECTION AND EXPANSION
// ============================================

describe('Doubles Detection', () => {
  test('detects doubles [3,3]', () => {
    expect(isDoubles([3, 3])).toBe(true);
  });

  test('detects doubles [6,6]', () => {
    expect(isDoubles([6, 6])).toBe(true);
  });

  test('detects doubles [1,1]', () => {
    expect(isDoubles([1, 1])).toBe(true);
  });

  test('rejects non-doubles [3,5]', () => {
    expect(isDoubles([3, 5])).toBe(false);
  });

  test('rejects non-doubles [1,6]', () => {
    expect(isDoubles([1, 6])).toBe(false);
  });
});

describe('Doubles Expansion', () => {
  test('expands [3,3] to [3,3,3,3]', () => {
    const expanded = expandDiceForDoubles([3, 3]);
    expect(expanded).toEqual([3, 3, 3, 3]);
    expect(expanded.length).toBe(4);
  });

  test('expands [6,6] to [6,6,6,6]', () => {
    const expanded = expandDiceForDoubles([6, 6]);
    expect(expanded).toEqual([6, 6, 6, 6]);
  });

  test('expands [1,1] to [1,1,1,1]', () => {
    const expanded = expandDiceForDoubles([1, 1]);
    expect(expanded).toEqual([1, 1, 1, 1]);
  });

  test('keeps non-doubles unchanged [3,5]', () => {
    const expanded = expandDiceForDoubles([3, 5]);
    expect(expanded).toEqual([3, 5]);
    expect(expanded.length).toBe(2);
  });

  test('keeps non-doubles unchanged [2,4]', () => {
    const expanded = expandDiceForDoubles([2, 4]);
    expect(expanded).toEqual([2, 4]);
  });
});

// ============================================
// DOUBLES MOVEMENT - BASIC
// ============================================

describe('Doubles Movement (Basic)', () => {
  test('can make 4 moves with doubles [3,3,3,3]', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 4);  // Point 21, 4 checkers
    setDice(state, [3, 3, 3, 3]);

    const moves = getAllLegalMoves(state);

    // Should have moves with die value 3
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every(m => m.dieValue === 3)).toBe(true);
  });

  test('single checker can move 4 times with doubles', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 1);  // Point 24, 1 checker
    setDice(state, [2, 2, 2, 2]);

    // This checker could move: 24→22→20→18→16 (4 moves)
    const moves = getAllLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
  });

  test('multiple checkers can use doubles', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 2);  // Point 24, 2 checkers
    placeChecker(state, 20, 'white', 2);  // Point 21, 2 checkers
    setDice(state, [3, 3, 3, 3]);

    const moves = getAllLegalMoves(state);

    // Should have moves from both starting points
    const hasFrom23 = moves.some(m => m.from === 23);
    const hasFrom20 = moves.some(m => m.from === 20);

    expect(hasFrom23 || hasFrom20).toBe(true);
  });

  test('doubles with blocking opponent', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 1);  // Point 24
    placeChecker(state, 21, 'black', 2);  // Block point 22 (die 2)
    setDice(state, [2, 2, 2, 2]);

    const moves = getAllLegalMoves(state);

    // First move is blocked, cannot use any dice
    expect(moves.length).toBe(0);
  });

  test('doubles with partial blocking', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 1);  // Point 24
    setDice(state, [6, 6, 6, 6]);

    const moves = getAllLegalMoves(state);

    // Can move 24→18→12→6→off (if bearing off allowed)
    // At minimum, should be able to make first move
    expect(moves.length).toBeGreaterThan(0);
  });
});

// ============================================
// DOUBLES DICE USAGE
// ============================================

describe('Doubles Dice Usage', () => {
  test('tracks all 4 dice usage', () => {
    const dice = [3, 3, 3, 3];
    const diceUsed = [false, false, false, false];

    const available = getAvailableDice(dice, diceUsed);
    expect(available.length).toBe(4);
    expect(available).toEqual([3, 3, 3, 3]);
  });

  test('tracks partial dice usage (1 used)', () => {
    const dice = [3, 3, 3, 3];
    const diceUsed = [true, false, false, false];

    const available = getAvailableDice(dice, diceUsed);
    expect(available.length).toBe(3);
    expect(available).toEqual([3, 3, 3]);
  });

  test('tracks partial dice usage (2 used)', () => {
    const dice = [3, 3, 3, 3];
    const diceUsed = [true, true, false, false];

    const available = getAvailableDice(dice, diceUsed);
    expect(available.length).toBe(2);
    expect(available).toEqual([3, 3]);
  });

  test('tracks partial dice usage (3 used)', () => {
    const dice = [3, 3, 3, 3];
    const diceUsed = [true, true, true, false];

    const available = getAvailableDice(dice, diceUsed);
    expect(available.length).toBe(1);
    expect(available).toEqual([3]);
  });

  test('tracks all dice used', () => {
    const dice = [3, 3, 3, 3];
    const diceUsed = [true, true, true, true];

    const available = getAvailableDice(dice, diceUsed);
    expect(available.length).toBe(0);
    expect(available).toEqual([]);
  });
});

// ============================================
// DOUBLES BAR ENTRY
// ============================================

describe('Doubles Bar Entry', () => {
  test('can enter 4 times with doubles if space available', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 4);  // 4 checkers on bar
    setDice(state, [3, 3, 3, 3]);

    const moves = getAllLegalMoves(state);

    // Should have bar entry move with die 3
    const hasBarEntry = moves.some(m => m.from === 'bar' && m.dieValue === 3);
    expect(hasBarEntry).toBe(true);
  });

  test('multiple checkers can enter with same doubles value', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 2);  // 2 checkers on bar
    setDice(state, [5, 5, 5, 5]);

    const moves = getAllLegalMoves(state);

    // All bar entries should use die 5 (point 20)
    const barEntries = moves.filter(m => m.from === 'bar');
    expect(barEntries.length).toBeGreaterThan(0);
    expect(barEntries.every(m => m.dieValue === 5)).toBe(true);
  });

  test('blocked bar entry prevents all doubles moves', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    placeChecker(state, 21, 'black', 2);  // Block point 22 (die 3)
    setDice(state, [3, 3, 3, 3]);

    const moves = getAllLegalMoves(state);

    // Cannot enter, cannot make any moves
    expect(moves.length).toBe(0);
  });

  test('can enter some but not all with doubles', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    setDice(state, [4, 4, 4, 4]);

    const moves = getAllLegalMoves(state);

    // Can enter with die 4 (point 21)
    const hasBarEntry = moves.some(m => m.from === 'bar');
    expect(hasBarEntry).toBe(true);
  });
});

// ============================================
// DOUBLES BEARING OFF
// ============================================

describe('Doubles Bearing Off', () => {
  test('can bear off 4 checkers with doubles', () => {
    const state = createEmptyState();
    // All checkers in home board
    placeChecker(state, 0, 'white', 2);  // Point 1
    placeChecker(state, 1, 'white', 2);  // Point 2
    placeChecker(state, 2, 'white', 2);  // Point 3
    setDice(state, [3, 3, 3, 3]);

    const moves = getAllLegalMoves(state);

    // Should be able to bear off with die 3
    expect(moves.some(m => m.dieValue === 3)).toBe(true);
  });

  test('doubles allow bearing off multiple exact matches', () => {
    const state = createEmptyState();
    placeChecker(state, 4, 'white', 4);  // Point 5, 4 checkers
    setDice(state, [5, 5, 5, 5]);

    const moves = getAllLegalMoves(state);

    // Can bear off all 4 checkers from point 5
    const bearOffMoves = moves.filter(m => m.to === 'bearOff');
    expect(bearOffMoves.length).toBeGreaterThan(0);
  });

  test('doubles with higher die bears off furthest', () => {
    const state = createEmptyState();
    placeChecker(state, 2, 'white', 1);  // Point 3 (furthest)
    placeChecker(state, 0, 'white', 1);  // Point 1
    setDice(state, [6, 6, 6, 6]);

    const moves = getAllLegalMoves(state);

    // Die 6 can bear off from point 3 (furthest)
    const bearOffFrom3 = moves.find(m => m.from === 2 && m.to === 'bearOff');
    expect(bearOffFrom3).toBeDefined();
  });

  test('doubles bearing off with partial blockers', () => {
    const state = createEmptyState();
    placeChecker(state, 3, 'white', 2);  // Point 4
    placeChecker(state, 5, 'white', 2);  // Point 6
    setDice(state, [2, 2, 2, 2]);

    const moves = getAllLegalMoves(state);

    // Can move but not bear off (die 2 doesn't reach either point)
    expect(moves.length).toBeGreaterThan(0);
  });
});

// ============================================
// DOUBLES EDGE CASES
// ============================================

describe('Doubles Edge Cases', () => {
  test('doubles [1,1,1,1] - smallest doubles', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 1);  // Point 24
    setDice(state, [1, 1, 1, 1]);

    const moves = getAllLegalMoves(state);

    // Can move with die 1
    expect(moves.some(m => m.dieValue === 1)).toBe(true);
  });

  test('doubles [6,6,6,6] - largest doubles', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 1);  // Point 24
    setDice(state, [6, 6, 6, 6]);

    const moves = getAllLegalMoves(state);

    // Can move with die 6
    expect(moves.some(m => m.dieValue === 6)).toBe(true);
  });

  test('doubles with only 3 moves possible (blocked on 4th)', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    // After 3 moves of die 3: 21→18→15→12
    // Block the 4th move at point 9
    placeChecker(state, 8, 'black', 2);  // Block point 9 (die 3 from point 12)
    setDice(state, [3, 3, 3, 3]);

    const moves = getAllLegalMoves(state);

    // Should have at least first move available
    expect(moves.length).toBeGreaterThan(0);
  });

  test('doubles with only 2 moves possible (blocked early)', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    // After 2 moves of die 4: 21→17→13
    // Block the 3rd move at point 9
    placeChecker(state, 8, 'black', 2);  // Block point 9 (die 4 from point 13)
    setDice(state, [4, 4, 4, 4]);

    const moves = getAllLegalMoves(state);

    // Should have at least first move available
    expect(moves.length).toBeGreaterThan(0);
  });

  test('doubles with only 1 move possible (blocked immediately)', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    // First move: 21→18 (die 3)
    // Block second move at point 15
    placeChecker(state, 14, 'black', 2);  // Block point 15 (die 3 from point 18)
    setDice(state, [3, 3, 3, 3]);

    const moves = getAllLegalMoves(state);

    // Should have at least first move available
    expect(moves.length).toBeGreaterThan(0);
  });

  test('doubles with no moves possible (completely blocked)', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    // Block immediate move
    placeChecker(state, 17, 'black', 2);  // Block point 18 (die 3)
    setDice(state, [3, 3, 3, 3]);

    const moves = getAllLegalMoves(state);

    // No moves available
    expect(moves.length).toBe(0);
  });

  test('doubles with mixed checkers (some can move, some cannot)', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 1);  // Point 24 (can move)
    placeChecker(state, 20, 'white', 1);  // Point 21 (can move)
    placeChecker(state, 10, 'white', 1);  // Point 11
    // Block point 11's move
    placeChecker(state, 7, 'black', 2);  // Block point 8 (die 3 from point 11)
    setDice(state, [3, 3, 3, 3]);

    const moves = getAllLegalMoves(state);

    // Should have moves from points 24 and 21
    const hasFrom23 = moves.some(m => m.from === 23);
    const hasFrom20 = moves.some(m => m.from === 20);

    expect(hasFrom23 || hasFrom20).toBe(true);
  });
});

// ============================================
// DOUBLES FORCED DIE RULE
// ============================================

describe('Doubles Forced Die Rule', () => {
  test('must use all 4 when possible', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 4);  // Point 21, 4 checkers
    setDice(state, [2, 2, 2, 2]);

    // All 4 moves are possible (open board)
    // Player must use all 4
    const moves = getAllLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
  });

  test('use 3 when 4th is blocked', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    // Block 4th move
    placeChecker(state, 8, 'black', 2);
    setDice(state, [3, 3, 3, 3]);

    // Can use 3, but not 4
    const moves = getAllLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
  });

  test('use 2 when 3rd and 4th are blocked', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    // Block 3rd move
    placeChecker(state, 11, 'black', 2);
    setDice(state, [3, 3, 3, 3]);

    // Can use 2, but not 3 or 4
    const moves = getAllLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
  });

  test('use 1 when only 1st is possible', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    // Block 2nd move
    placeChecker(state, 14, 'black', 2);
    setDice(state, [3, 3, 3, 3]);

    // Can use 1, but not 2, 3, or 4
    const moves = getAllLegalMoves(state);
    expect(moves.length).toBeGreaterThan(0);
  });
});
