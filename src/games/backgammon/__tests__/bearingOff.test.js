/**
 * Backgammon Bearing Off Tests
 *
 * Week 2, Wednesday: Test bearing off rules
 *
 * Bearing off rules (complex!):
 * 1. Must have all checkers in home board first
 * 2. Exact die value bears off from that point
 * 3. Higher die can bear off furthest checker when exact point empty
 * 4. Can't use higher die if checkers behind (further from bearing off)
 */

import {
  canBearOff,
  getLegalBearOffMoves
} from '../moveValidation';

import {
  allCheckersInHome,
  getHomeRange,
  getFurthestChecker
} from '../gameLogic';

import {
  createEmptyState,
  placeChecker,
  placeOnBar,
  setDice,
  createBearingOffState
} from './test-helpers';

// ============================================
// HOME BOARD RANGE
// ============================================

describe('Home Board Range', () => {
  test('white home board is points 1-6 (indices 0-5)', () => {
    const range = getHomeRange('white');

    expect(range.start).toBe(0);
    expect(range.end).toBe(5);
  });

  test('black home board is points 19-24 (indices 18-23)', () => {
    const range = getHomeRange('black');

    expect(range.start).toBe(18);
    expect(range.end).toBe(23);
  });
});

// ============================================
// ALL CHECKERS IN HOME
// ============================================

describe('All Checkers In Home Board', () => {
  test('returns true when all checkers in home', () => {
    const state = createBearingOffState('white');

    expect(allCheckersInHome(state, 'white')).toBe(true);
  });

  test('returns false when checkers outside home', () => {
    const state = createEmptyState();
    placeChecker(state, 2, 'white', 2);  // Point 3 (in home)
    placeChecker(state, 10, 'white', 1); // Point 11 (OUTSIDE home)

    expect(allCheckersInHome(state, 'white')).toBe(false);
  });

  test('returns false when checkers on bar', () => {
    const state = createBearingOffState('white');
    placeOnBar(state, 'white', 1);  // 1 checker on bar

    expect(allCheckersInHome(state, 'white')).toBe(false);
  });

  test('white - checkers in points 1-6 only', () => {
    const state = createEmptyState();
    // Only place checkers in white home (indices 0-5)
    placeChecker(state, 0, 'white', 2);
    placeChecker(state, 3, 'white', 2);
    placeChecker(state, 5, 'white', 2);

    expect(allCheckersInHome(state, 'white')).toBe(true);
  });

  test('white - even 1 checker outside home = false', () => {
    const state = createEmptyState();
    placeChecker(state, 0, 'white', 5);  // In home
    placeChecker(state, 6, 'white', 1);  // Point 7 (OUTSIDE)

    expect(allCheckersInHome(state, 'white')).toBe(false);
  });

  test('black - checkers in points 19-24 only', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    // Only place checkers in black home (indices 18-23)
    placeChecker(state, 18, 'black', 2);
    placeChecker(state, 21, 'black', 2);
    placeChecker(state, 23, 'black', 2);

    expect(allCheckersInHome(state, 'black')).toBe(true);
  });

  test('black - even 1 checker outside home = false', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 20, 'black', 5);  // In home
    placeChecker(state, 17, 'black', 1);  // Point 18 (OUTSIDE)

    expect(allCheckersInHome(state, 'black')).toBe(false);
  });

  test('empty board returns true (no checkers = all in home)', () => {
    const state = createEmptyState();

    expect(allCheckersInHome(state, 'white')).toBe(true);
  });
});

// ============================================
// CAN BEAR OFF
// ============================================

describe('Can Bear Off Requirement', () => {
  test('can bear off when all checkers in home', () => {
    const state = createBearingOffState('white');

    expect(canBearOff(state, 'white')).toBe(true);
  });

  test('cannot bear off when checkers outside home', () => {
    const state = createEmptyState();
    placeChecker(state, 2, 'white', 2);
    placeChecker(state, 15, 'white', 1);  // Outside home

    expect(canBearOff(state, 'white')).toBe(false);
  });

  test('cannot bear off when checker on bar', () => {
    const state = createBearingOffState('white');
    placeOnBar(state, 'white', 1);

    expect(canBearOff(state, 'white')).toBe(false);
  });

  test('black can bear off when all in home', () => {
    const state = createBearingOffState('black');

    expect(canBearOff(state, 'black')).toBe(true);
  });

  test('black cannot bear off with checkers outside', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 20, 'black', 2);  // In home
    placeChecker(state, 10, 'black', 1);  // Outside home

    expect(canBearOff(state, 'black')).toBe(false);
  });
});

// ============================================
// FURTHEST CHECKER
// ============================================

describe('Furthest Checker From Bearing Off', () => {
  test('white - furthest checker is highest index in home', () => {
    const state = createEmptyState();
    placeChecker(state, 1, 'white', 1);  // Point 2
    placeChecker(state, 4, 'white', 1);  // Point 5

    // Point 5 (index 4) is furthest from bearing off for white
    expect(getFurthestChecker(state, 'white')).toBe(4);
  });

  test('black - furthest checker is lowest index in home', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 19, 'black', 1);  // Point 20
    placeChecker(state, 22, 'black', 1);  // Point 23

    // Point 20 (index 19) is furthest from bearing off for black
    expect(getFurthestChecker(state, 'black')).toBe(19);
  });

  test('white - single checker location', () => {
    const state = createEmptyState();
    placeChecker(state, 3, 'white', 1);  // Only checker at point 4

    expect(getFurthestChecker(state, 'white')).toBe(3);
  });

  test('returns null when no checkers on board', () => {
    const state = createEmptyState();

    expect(getFurthestChecker(state, 'white')).toBeNull();
  });
});

// ============================================
// EXACT BEARING OFF
// ============================================

describe('Exact Die Value Bearing Off', () => {
  test('white - die 1 bears off from point 1 (index 0)', () => {
    const state = createEmptyState();
    placeChecker(state, 0, 'white', 1);  // Point 1
    setDice(state, [1, 3]);

    const moves = getLegalBearOffMoves(state, 'white');

    const bearOffMove = moves.find(m => m.dieValue === 1);
    expect(bearOffMove).toBeDefined();
    expect(bearOffMove.from).toBe(0);
    expect(bearOffMove.to).toBe('bearOff');
  });

  test('white - die 6 bears off from point 6 (index 5)', () => {
    const state = createBearingOffState('white');
    setDice(state, [6, 2]);

    const moves = getLegalBearOffMoves(state, 'white');

    const bearOffMove = moves.find(m => m.dieValue === 6);
    expect(bearOffMove).toBeDefined();
    expect(bearOffMove.from).toBe(5);
  });

  test('black - die 1 bears off from point 24 (index 23)', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 23, 'black', 1);  // Point 24
    setDice(state, [1, 4]);

    const moves = getLegalBearOffMoves(state, 'black');

    const bearOffMove = moves.find(m => m.dieValue === 1);
    expect(bearOffMove).toBeDefined();
    expect(bearOffMove.from).toBe(23);
    expect(bearOffMove.to).toBe('bearOff');
  });

  test('black - die 6 bears off from point 19 (index 18)', () => {
    const state = createBearingOffState('black');
    setDice(state, [6, 3]);

    const moves = getLegalBearOffMoves(state, 'black');

    const bearOffMove = moves.find(m => m.dieValue === 6);
    expect(bearOffMove).toBeDefined();
    expect(bearOffMove.from).toBe(18);
  });

  test('can bear off multiple checkers from same point', () => {
    const state = createEmptyState();
    placeChecker(state, 0, 'white', 3);  // 3 checkers at point 1
    setDice(state, [1, 1, 1, 1]);  // Doubles

    const moves = getLegalBearOffMoves(state, 'white');

    // All moves should be from point 1 with die 1
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every(m => m.from === 0 && m.dieValue === 1)).toBe(true);
  });
});

// ============================================
// HIGHER DIE BEARING OFF
// ============================================

describe('Higher Die Bearing Off (No Exact)', () => {
  test('white - die 6 bears off furthest when point 6 empty', () => {
    const state = createEmptyState();
    placeChecker(state, 3, 'white', 1);  // Point 4 (furthest)
    // Point 6 (index 5) has NO checkers
    setDice(state, [6, 2]);

    const moves = getLegalBearOffMoves(state, 'white');

    // Die 6 can bear off from point 4 (furthest checker)
    const bearOffMove = moves.find(m => m.dieValue === 6);
    expect(bearOffMove).toBeDefined();
    expect(bearOffMove.from).toBe(3);  // From point 4
  });

  test('white - cannot use higher die if checkers behind', () => {
    const state = createEmptyState();
    placeChecker(state, 1, 'white', 1);  // Point 2
    placeChecker(state, 4, 'white', 1);  // Point 5 (behind)
    setDice(state, [3, 5]);

    const moves = getLegalBearOffMoves(state, 'white');

    // Die 3 cannot bear off from point 2, because there's a checker at point 5
    // (point 5 is further from bearing off)
    const invalidMove = moves.find(m => m.from === 1 && m.dieValue === 3);
    expect(invalidMove).toBeUndefined();
  });

  test('white - die 5 bears off furthest (no higher checkers)', () => {
    const state = createEmptyState();
    placeChecker(state, 2, 'white', 1);  // Point 3 (furthest)
    placeChecker(state, 0, 'white', 1);  // Point 1 (not furthest)
    setDice(state, [5, 1]);

    const moves = getLegalBearOffMoves(state, 'white');

    // Die 5 can bear off from point 3 (furthest)
    const bearOffMove = moves.find(m => m.dieValue === 5);
    expect(bearOffMove).toBeDefined();
    expect(bearOffMove.from).toBe(2);
  });

  test('black - die 6 bears off furthest when point 19 empty', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 20, 'black', 1);  // Point 21 (furthest)
    // Point 19 (index 18) has NO checkers
    setDice(state, [6, 3]);

    const moves = getLegalBearOffMoves(state, 'black');

    // Die 6 can bear off from point 21 (furthest checker)
    const bearOffMove = moves.find(m => m.dieValue === 6);
    expect(bearOffMove).toBeDefined();
    expect(bearOffMove.from).toBe(20);
  });

  test('can only bear off furthest checker with higher die', () => {
    const state = createEmptyState();
    placeChecker(state, 1, 'white', 1);  // Point 2
    placeChecker(state, 3, 'white', 1);  // Point 4 (furthest)
    setDice(state, [6, 2]);

    const moves = getLegalBearOffMoves(state, 'white');

    // Die 6 should bear off from point 4 (furthest), not point 2
    const bearOffMove = moves.find(m => m.dieValue === 6);
    expect(bearOffMove).toBeDefined();
    expect(bearOffMove.from).toBe(3);  // From furthest (point 4)
  });
});

// ============================================
// GET LEGAL BEAR OFF MOVES
// ============================================

describe('Get Legal Bear Off Moves', () => {
  test('returns bearing off moves when eligible', () => {
    const state = createBearingOffState('white');
    setDice(state, [2, 4]);

    const moves = getLegalBearOffMoves(state, 'white');

    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every(m => m.to === 'bearOff')).toBe(true);
  });

  test('returns empty array when not all checkers in home', () => {
    const state = createEmptyState();
    placeChecker(state, 2, 'white', 1);  // In home
    placeChecker(state, 15, 'white', 1); // Outside home
    setDice(state, [3, 5]);

    const moves = getLegalBearOffMoves(state, 'white');

    expect(moves).toHaveLength(0);
  });

  test('returns empty array when checker on bar', () => {
    const state = createBearingOffState('white');
    placeOnBar(state, 'white', 1);
    setDice(state, [3, 5]);

    const moves = getLegalBearOffMoves(state, 'white');

    expect(moves).toHaveLength(0);
  });

  test('all moves have hits: false', () => {
    const state = createBearingOffState('white');
    setDice(state, [1, 6]);

    const moves = getLegalBearOffMoves(state, 'white');

    expect(moves.every(m => m.hits === false)).toBe(true);
  });

  test('handles doubles correctly', () => {
    const state = createBearingOffState('white');
    setDice(state, [3, 3, 3, 3]);

    const moves = getLegalBearOffMoves(state, 'white');

    // Should have moves for bearing off with die 3
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every(m => m.dieValue === 3)).toBe(true);
  });

  test('black bearing off moves work correctly', () => {
    const state = createBearingOffState('black');
    setDice(state, [2, 5]);

    const moves = getLegalBearOffMoves(state, 'black');

    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every(m => m.to === 'bearOff')).toBe(true);
  });
});

// ============================================
// COMPLEX BEARING OFF SCENARIOS
// ============================================

describe('Complex Bearing Off Scenarios', () => {
  test('mix of exact and higher die bearing off', () => {
    const state = createEmptyState();
    placeChecker(state, 1, 'white', 1);  // Point 2
    placeChecker(state, 3, 'white', 1);  // Point 4 (exact for die 4)
    setDice(state, [4, 6]);

    const moves = getLegalBearOffMoves(state, 'white');

    // Die 4 bears off from point 4 (exact)
    const exactMove = moves.find(m => m.dieValue === 4);
    expect(exactMove).toBeDefined();
    expect(exactMove.from).toBe(3);

    // Die 6 bears off from point 4 (furthest, since no point 6)
    const higherMove = moves.find(m => m.dieValue === 6);
    expect(higherMove).toBeDefined();
    expect(higherMove.from).toBe(3);  // Furthest is point 4
  });

  test('cannot bear off when die too small', () => {
    const state = createEmptyState();
    placeChecker(state, 4, 'white', 1);  // Point 5
    setDice(state, [3, 2]);  // Both dice too small

    const moves = getLegalBearOffMoves(state, 'white');

    // Can't bear off - dice don't reach point 5
    // (This would be a regular move, not bearing off)
    const bearOffMoves = moves.filter(m => m.to === 'bearOff');
    expect(bearOffMoves).toHaveLength(0);
  });

  test('bearing off last few checkers', () => {
    const state = createEmptyState();
    placeChecker(state, 0, 'white', 1);  // Point 1
    placeChecker(state, 1, 'white', 1);  // Point 2
    state.bearOff.white = 13;  // 13 already borne off
    setDice(state, [1, 2]);

    const moves = getLegalBearOffMoves(state, 'white');

    expect(moves.length).toBe(2);  // Can bear off both
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('Bearing Off Edge Cases', () => {
  test('all checkers borne off - no moves', () => {
    const state = createEmptyState();
    state.bearOff.white = 15;  // All 15 checkers borne off
    setDice(state, [3, 5]);

    const moves = getLegalBearOffMoves(state, 'white');

    expect(moves).toHaveLength(0);
  });

  test('home board definition is strict', () => {
    const state = createEmptyState();
    placeChecker(state, 6, 'white', 1);  // Point 7 (just outside home)
    setDice(state, [5, 6]);

    expect(canBearOff(state, 'white')).toBe(false);
  });

  test('bearing off requires home board + no bar', () => {
    const state = createEmptyState();
    placeChecker(state, 2, 'white', 5);  // All in home
    placeOnBar(state, 'white', 1);      // But 1 on bar

    expect(canBearOff(state, 'white')).toBe(false);
  });
});
