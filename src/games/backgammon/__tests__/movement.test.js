/**
 * Backgammon Movement Tests
 *
 * Week 2, Monday: Test movement rules
 *
 * Tests:
 * - Movement direction (white 24→1, black 1→24)
 * - Blocking (can't land on 2+ opponent checkers)
 * - Hitting blots (single opponent checker)
 * - Regular movement validation
 */

import {
  canMoveFrom,
  canMoveTo,
  getMovesFromPoint
} from '../moveValidation';

import {
  isPointBlocked,
  isBlot,
  calculateDestination
} from '../gameLogic';

import {
  createEmptyState,
  placeChecker,
  placeOnBar,
  setDice,
  createMoveScenario,
  createBlockedScenario,
  createBlotScenario
} from './test-helpers';

// ============================================
// MOVEMENT DIRECTION TESTS
// ============================================

describe('Movement Direction', () => {
  test('white moves in decreasing direction (24→1)', () => {
    // White at point 24 (index 23) with die 3 should move to point 21 (index 20)
    const from = 23;  // Point 24
    const dieValue = 3;
    const player = 'white';

    const destination = calculateDestination(from, dieValue, player);

    expect(destination).toBe(20);  // Point 21 (23 - 3 = 20)
  });

  test('black moves in increasing direction (1→24)', () => {
    // Black at point 1 (index 0) with die 3 should move to point 4 (index 3)
    const from = 0;   // Point 1
    const dieValue = 3;
    const player = 'black';

    const destination = calculateDestination(from, dieValue, player);

    expect(destination).toBe(3);  // Point 4 (0 + 3 = 3)
  });

  test('white with die 6 from point 24 goes to point 18', () => {
    expect(calculateDestination(23, 6, 'white')).toBe(17);  // 23 - 6 = 17
  });

  test('black with die 6 from point 1 goes to point 7', () => {
    expect(calculateDestination(0, 6, 'black')).toBe(6);  // 0 + 6 = 6
  });

  test('white moving toward home board', () => {
    // White at point 13 (index 12) with die 5 → point 8 (index 7)
    expect(calculateDestination(12, 5, 'white')).toBe(7);
  });

  test('black moving toward home board', () => {
    // Black at point 12 (index 11) with die 5 → point 17 (index 16)
    expect(calculateDestination(11, 5, 'black')).toBe(16);
  });
});

// ============================================
// BLOCKING TESTS
// ============================================

describe('Point Blocking Rules', () => {
  test('point with 2+ opponent checkers is blocked', () => {
    const state = createBlockedScenario('white', 15);

    // Point 15 has 2 black checkers - should be blocked for white
    expect(isPointBlocked(state, 15, 'white')).toBe(true);
  });

  test('point with 1 opponent checker is NOT blocked (blot)', () => {
    const state = createBlotScenario('white', 15);

    // Point 15 has only 1 black checker - NOT blocked
    expect(isPointBlocked(state, 15, 'white')).toBe(false);
  });

  test('empty point is NOT blocked', () => {
    const state = createEmptyState();

    expect(isPointBlocked(state, 10, 'white')).toBe(false);
  });

  test('point with own checkers is NOT blocked', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'white', 3);

    // White trying to move to point with own checkers - allowed
    expect(isPointBlocked(state, 10, 'white')).toBe(false);
  });

  test('cannot move to blocked point', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'white', 1);  // White checker at point 10
    placeChecker(state, 7, 'black', 2);   // Black blocking point 7
    setDice(state, [3, 5]);

    // White at point 10 (index 9) - die 3 would go to point 7 (blocked)
    expect(canMoveTo(state, 7, 'white', 3)).toBe(false);
  });

  test('black blocked by white', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 5, 'white', 2);  // White blocking point 6

    expect(isPointBlocked(state, 5, 'black')).toBe(true);
  });

  test('exactly 2 checkers blocks', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'black', 2);  // Exactly 2

    expect(isPointBlocked(state, 10, 'white')).toBe(true);
  });

  test('3+ checkers also blocks', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'black', 5);  // Multiple checkers

    expect(isPointBlocked(state, 10, 'white')).toBe(true);
  });
});

// ============================================
// BLOT TESTS (Hitting)
// ============================================

describe('Blot Detection (Hitting)', () => {
  test('single opponent checker is a blot', () => {
    const state = createBlotScenario('white', 10);

    expect(isBlot(state, 10, 'white')).toBe(true);
  });

  test('2+ opponent checkers is NOT a blot', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'black', 2);

    expect(isBlot(state, 10, 'white')).toBe(false);
  });

  test('empty point is NOT a blot', () => {
    const state = createEmptyState();

    expect(isBlot(state, 10, 'white')).toBe(false);
  });

  test('own checker is NOT a blot', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'white', 1);

    expect(isBlot(state, 10, 'white')).toBe(false);
  });

  test('black blot can be hit by white', () => {
    const state = createBlotScenario('white', 15);

    expect(isBlot(state, 15, 'white')).toBe(true);
  });

  test('white blot can be hit by black', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 10, 'white', 1);

    expect(isBlot(state, 10, 'black')).toBe(true);
  });
});

// ============================================
// CAN MOVE FROM TESTS
// ============================================

describe('Can Move From Point', () => {
  test('can move from point with own checker', () => {
    const state = createMoveScenario('white', 15, [3, 5]);

    expect(canMoveFrom(state, 15, 'white')).toBe(true);
  });

  test('cannot move from point with no checkers', () => {
    const state = createEmptyState();

    expect(canMoveFrom(state, 10, 'white')).toBe(false);
  });

  test('cannot move from point with opponent checkers', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'black', 2);

    expect(canMoveFrom(state, 10, 'white')).toBe(false);
  });

  test('cannot move from board when checker on bar', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'white', 1);
    placeOnBar(state, 'white', 1);  // White has checker on bar

    // Must enter from bar first
    expect(canMoveFrom(state, 10, 'white')).toBe(false);
  });

  test('can move when no checkers on bar', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'white', 2);

    expect(canMoveFrom(state, 10, 'white')).toBe(true);
  });

  test('black can move from their checkers', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 5, 'black', 1);

    expect(canMoveFrom(state, 5, 'black')).toBe(true);
  });
});

// ============================================
// GET MOVES FROM POINT TESTS
// ============================================

describe('Get Moves From Point', () => {
  test('returns available moves with current dice', () => {
    const state = createEmptyState();
    placeChecker(state, 15, 'white', 1);  // White at point 16
    setDice(state, [3, 5]);

    const moves = getMovesFromPoint(state, 15, 'white');

    // Should have 2 moves: one with die 3, one with die 5
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.some(m => m.dieValue === 3)).toBe(true);
    expect(moves.some(m => m.dieValue === 5)).toBe(true);
  });

  test('excludes moves to blocked points', () => {
    const state = createEmptyState();
    placeChecker(state, 15, 'white', 1);  // White at point 16
    placeChecker(state, 12, 'black', 2);  // Block point 13
    setDice(state, [3, 5]);

    const moves = getMovesFromPoint(state, 15, 'white');

    // Die 3 would go to point 13 (blocked) - should not be in moves
    const blockedMove = moves.find(m => m.to === 12);
    expect(blockedMove).toBeUndefined();
  });

  test('includes hitting moves for blots', () => {
    const state = createEmptyState();
    placeChecker(state, 15, 'white', 1);  // White at point 16
    placeChecker(state, 12, 'black', 1);  // Black blot at point 13
    setDice(state, [3, 5]);

    const moves = getMovesFromPoint(state, 15, 'white');

    // Die 3 goes to point 13 (blot) - should show hits: true
    const hitMove = moves.find(m => m.to === 12);
    expect(hitMove).toBeDefined();
    expect(hitMove.hits).toBe(true);
  });

  test('returns empty array when no moves available', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 1);  // White at point 24
    // Block all possible destinations
    placeChecker(state, 17, 'black', 2);  // Block point 18 (die 6)
    placeChecker(state, 18, 'black', 2);  // Block point 19 (die 5)
    placeChecker(state, 19, 'black', 2);  // Block point 20 (die 4)
    placeChecker(state, 20, 'black', 2);  // Block point 21 (die 3)
    placeChecker(state, 21, 'black', 2);  // Block point 22 (die 2)
    placeChecker(state, 22, 'black', 2);  // Block point 23 (die 1)
    setDice(state, [1, 2, 3, 4, 5, 6]);  // All dice available

    const moves = getMovesFromPoint(state, 23, 'white');

    expect(moves).toHaveLength(0);
  });

  test('handles doubles (same die value multiple times)', () => {
    const state = createEmptyState();
    placeChecker(state, 15, 'white', 1);
    setDice(state, [3, 3, 3, 3]);  // Doubles

    const moves = getMovesFromPoint(state, 15, 'white');

    // All moves use die value 3, but should only list unique destinations
    const uniqueDestinations = new Set(moves.map(m => m.to));
    expect(uniqueDestinations.size).toBeGreaterThan(0);
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('Movement Edge Cases', () => {
  test('handles out of bounds destinations gracefully', () => {
    const state = createMoveScenario('white', 2, [6, 6]);

    // Die 6 from point 3 goes to point -3 (bearing off territory)
    // Should be handled by bearing off logic, not crash
    expect(() => {
      getMovesFromPoint(state, 2, 'white');
    }).not.toThrow();
  });

  test('handles invalid point indices', () => {
    const state = createEmptyState();

    expect(canMoveFrom(state, -1, 'white')).toBe(false);
    expect(canMoveFrom(state, 24, 'white')).toBe(false);
    expect(canMoveFrom(state, 999, 'white')).toBe(false);
  });

  test('handles missing checkers in point', () => {
    const state = createEmptyState();
    // Point exists but has no checkers - should return false, not crash
    expect(canMoveFrom(state, 10, 'white')).toBe(false);
  });
});
