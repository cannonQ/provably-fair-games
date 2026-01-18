/**
 * Backgammon Bar Entry Tests
 *
 * Week 2, Tuesday: Test bar entry rules
 *
 * Tests:
 * - Must enter from bar before other moves
 * - Bar entry point calculation (white vs black)
 * - Can't enter if opponent blocks entry point
 * - Uses correct die value
 * - Multiple checkers on bar
 */

import {
  mustEnterFromBar,
  getLegalBarEntries,
  canMoveFrom
} from '../moveValidation';

import {
  getBarEntryPoint,
  hasCheckersOnBar,
  canEnterFromBar
} from '../gameLogic';

import {
  createEmptyState,
  placeChecker,
  placeOnBar,
  setDice
} from './test-helpers';

// ============================================
// BAR ENTRY POINT CALCULATION
// ============================================

describe('Bar Entry Point Calculation', () => {
  describe('White Bar Entry', () => {
    test('die 1 enters at point 24 (index 23)', () => {
      expect(getBarEntryPoint(1, 'white')).toBe(23);
    });

    test('die 2 enters at point 23 (index 22)', () => {
      expect(getBarEntryPoint(2, 'white')).toBe(22);
    });

    test('die 3 enters at point 22 (index 21)', () => {
      expect(getBarEntryPoint(3, 'white')).toBe(21);
    });

    test('die 4 enters at point 21 (index 20)', () => {
      expect(getBarEntryPoint(4, 'white')).toBe(20);
    });

    test('die 5 enters at point 20 (index 19)', () => {
      expect(getBarEntryPoint(5, 'white')).toBe(19);
    });

    test('die 6 enters at point 19 (index 18)', () => {
      expect(getBarEntryPoint(6, 'white')).toBe(18);
    });
  });

  describe('Black Bar Entry', () => {
    test('die 1 enters at point 1 (index 0)', () => {
      expect(getBarEntryPoint(1, 'black')).toBe(0);
    });

    test('die 2 enters at point 2 (index 1)', () => {
      expect(getBarEntryPoint(2, 'black')).toBe(1);
    });

    test('die 3 enters at point 3 (index 2)', () => {
      expect(getBarEntryPoint(3, 'black')).toBe(2);
    });

    test('die 4 enters at point 4 (index 3)', () => {
      expect(getBarEntryPoint(4, 'black')).toBe(3);
    });

    test('die 5 enters at point 5 (index 4)', () => {
      expect(getBarEntryPoint(5, 'black')).toBe(4);
    });

    test('die 6 enters at point 6 (index 5)', () => {
      expect(getBarEntryPoint(6, 'black')).toBe(5);
    });
  });

  test('entry points are in opponent home board', () => {
    // White enters in black's home (points 19-24)
    for (let die = 1; die <= 6; die++) {
      const whiteEntry = getBarEntryPoint(die, 'white');
      expect(whiteEntry).toBeGreaterThanOrEqual(18);
      expect(whiteEntry).toBeLessThanOrEqual(23);
    }

    // Black enters in white's home (points 1-6)
    for (let die = 1; die <= 6; die++) {
      const blackEntry = getBarEntryPoint(die, 'black');
      expect(blackEntry).toBeGreaterThanOrEqual(0);
      expect(blackEntry).toBeLessThanOrEqual(5);
    }
  });
});

// ============================================
// HAS CHECKERS ON BAR
// ============================================

describe('Has Checkers On Bar', () => {
  test('returns true when player has checkers on bar', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);

    expect(hasCheckersOnBar(state, 'white')).toBe(true);
  });

  test('returns false when player has no checkers on bar', () => {
    const state = createEmptyState();

    expect(hasCheckersOnBar(state, 'white')).toBe(false);
  });

  test('handles multiple checkers on bar', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 3);

    expect(hasCheckersOnBar(state, 'white')).toBe(true);
  });

  test('different players can have checkers on bar independently', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);

    expect(hasCheckersOnBar(state, 'white')).toBe(true);
    expect(hasCheckersOnBar(state, 'black')).toBe(false);
  });
});

// ============================================
// MUST ENTER FROM BAR
// ============================================

describe('Must Enter From Bar (Priority)', () => {
  test('must enter when player has checker on bar', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);

    expect(mustEnterFromBar(state, 'white')).toBe(true);
  });

  test('no entry required when no checkers on bar', () => {
    const state = createEmptyState();

    expect(mustEnterFromBar(state, 'white')).toBe(false);
  });

  test('cannot move board checkers when on bar', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'white', 1);  // White has checker on board
    placeOnBar(state, 'white', 1);         // AND on bar

    // Cannot move from board
    expect(canMoveFrom(state, 10, 'white')).toBe(false);
    // Must enter from bar
    expect(mustEnterFromBar(state, 'white')).toBe(true);
  });

  test('can move board checkers after entering from bar', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'white', 1);
    // No checkers on bar

    expect(canMoveFrom(state, 10, 'white')).toBe(true);
    expect(mustEnterFromBar(state, 'white')).toBe(false);
  });
});

// ============================================
// CAN ENTER FROM BAR
// ============================================

describe('Can Enter From Bar', () => {
  test('can enter when entry point is empty', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);

    // Die 3 → point 22 (index 21), which is empty
    expect(canEnterFromBar(state, 'white', 3)).toBe(true);
  });

  test('can enter when entry point has own checkers', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    placeChecker(state, 21, 'white', 2);  // Point 22 has white checkers

    // Can always land on own checkers
    expect(canEnterFromBar(state, 'white', 3)).toBe(true);
  });

  test('can enter and hit opponent blot', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    placeChecker(state, 21, 'black', 1);  // Black blot at entry point

    // Can enter and hit the blot
    expect(canEnterFromBar(state, 'white', 3)).toBe(true);
  });

  test('cannot enter when entry point blocked by opponent', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    placeChecker(state, 21, 'black', 2);  // Black blocks point 22

    // Cannot enter - blocked
    expect(canEnterFromBar(state, 'white', 3)).toBe(false);
  });

  test('black can enter when white does not block', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeOnBar(state, 'black', 1);

    // Die 4 → point 4 (index 3), empty
    expect(canEnterFromBar(state, 'black', 4)).toBe(true);
  });

  test('black cannot enter when white blocks', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeOnBar(state, 'black', 1);
    placeChecker(state, 3, 'white', 2);  // White blocks point 4

    expect(canEnterFromBar(state, 'black', 4)).toBe(false);
  });
});

// ============================================
// GET LEGAL BAR ENTRIES
// ============================================

describe('Get Legal Bar Entries', () => {
  test('returns bar entry moves for available dice', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    setDice(state, [3, 5]);

    const entries = getLegalBarEntries(state, 'white');

    // Should have 2 possible entries (die 3 and die 5)
    expect(entries.length).toBe(2);
    expect(entries.some(m => m.dieValue === 3)).toBe(true);
    expect(entries.some(m => m.dieValue === 5)).toBe(true);
  });

  test('all bar entry moves have from: "bar"', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    setDice(state, [2, 4]);

    const entries = getLegalBarEntries(state, 'white');

    expect(entries.every(m => m.from === 'bar')).toBe(true);
  });

  test('excludes blocked entry points', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    placeChecker(state, 21, 'black', 2);  // Block point 22 (die 3)
    setDice(state, [3, 5]);

    const entries = getLegalBarEntries(state, 'white');

    // Die 3 is blocked, only die 5 should work
    expect(entries.length).toBe(1);
    expect(entries[0].dieValue).toBe(5);
  });

  test('marks hitting moves correctly', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    placeChecker(state, 21, 'black', 1);  // Black blot at point 22
    setDice(state, [3, 5]);

    const entries = getLegalBarEntries(state, 'white');

    const hitMove = entries.find(m => m.dieValue === 3);
    expect(hitMove).toBeDefined();
    expect(hitMove.hits).toBe(true);
  });

  test('returns empty array when all entry points blocked', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    // Block all possible entry points for dice [2, 4]
    placeChecker(state, 22, 'black', 2);  // Block point 23 (die 2)
    placeChecker(state, 20, 'black', 2);  // Block point 21 (die 4)
    setDice(state, [2, 4]);

    const entries = getLegalBarEntries(state, 'white');

    expect(entries).toHaveLength(0);
  });

  test('returns empty array when no checkers on bar', () => {
    const state = createEmptyState();
    setDice(state, [3, 5]);

    const entries = getLegalBarEntries(state, 'white');

    expect(entries).toHaveLength(0);
  });

  test('handles doubles (4 possible entries with same value)', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 2);  // 2 checkers on bar
    setDice(state, [3, 3, 3, 3]);    // Doubles

    const entries = getLegalBarEntries(state, 'white');

    // All entries use die 3, but should only return unique moves
    // (de-duplication logic)
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(m => m.dieValue === 3)).toBe(true);
  });

  test('black bar entries work correctly', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeOnBar(state, 'black', 1);
    setDice(state, [2, 5]);

    const entries = getLegalBarEntries(state, 'black');

    expect(entries.length).toBe(2);
    expect(entries.some(m => m.to === 1)).toBe(true);  // Die 2 → point 2 (index 1)
    expect(entries.some(m => m.to === 4)).toBe(true);  // Die 5 → point 5 (index 4)
  });
});

// ============================================
// MULTIPLE CHECKERS ON BAR
// ============================================

describe('Multiple Checkers On Bar', () => {
  test('must enter all checkers before moving others', () => {
    const state = createEmptyState();
    placeChecker(state, 10, 'white', 1);  // Checker on board
    placeOnBar(state, 'white', 2);         // 2 on bar

    expect(mustEnterFromBar(state, 'white')).toBe(true);
    expect(canMoveFrom(state, 10, 'white')).toBe(false);
  });

  test('can get entries for multiple checkers', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 3);
    setDice(state, [4, 6]);

    const entries = getLegalBarEntries(state, 'white');

    // Can enter with either die
    expect(entries.length).toBeGreaterThan(0);
  });

  test('entry is still required if even one checker on bar', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);  // Just 1 checker

    expect(mustEnterFromBar(state, 'white')).toBe(true);
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('Bar Entry Edge Cases', () => {
  test('handles dice values 1-6 correctly', () => {
    for (let die = 1; die <= 6; die++) {
      const whiteEntry = getBarEntryPoint(die, 'white');
      const blackEntry = getBarEntryPoint(die, 'black');

      expect(whiteEntry).toBeGreaterThanOrEqual(0);
      expect(whiteEntry).toBeLessThan(24);
      expect(blackEntry).toBeGreaterThanOrEqual(0);
      expect(blackEntry).toBeLessThan(24);
    }
  });

  test('bar entries are deterministic', () => {
    // Same input should always give same output
    expect(getBarEntryPoint(3, 'white')).toBe(21);
    expect(getBarEntryPoint(3, 'white')).toBe(21);
    expect(getBarEntryPoint(3, 'black')).toBe(2);
    expect(getBarEntryPoint(3, 'black')).toBe(2);
  });

  test('white and black entry points are different', () => {
    for (let die = 1; die <= 6; die++) {
      const whiteEntry = getBarEntryPoint(die, 'white');
      const blackEntry = getBarEntryPoint(die, 'black');

      // Should be in opposite home boards
      expect(whiteEntry).not.toBe(blackEntry);
    }
  });
});
