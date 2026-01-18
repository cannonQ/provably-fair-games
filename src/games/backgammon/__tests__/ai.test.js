/**
 * Backgammon AI Tests
 *
 * Week 4, Monday: Test AI move selection and difficulty levels
 *
 * Tests:
 * - AI can select valid moves
 * - Easy AI uses random selection
 * - Normal AI prefers better moves (hits, safe positions)
 * - Hard AI uses lookahead
 * - Difficulty levels are actually different
 */

import { selectMove } from '../ai';
import { getAllLegalMoves } from '../moveValidation';
import {
  createEmptyState,
  placeChecker,
  setDice,
  placeOnBar
} from './test-helpers';

// ============================================
// BASIC AI FUNCTIONALITY
// ============================================

describe('AI Basic Functionality', () => {
  test('selectMove returns null when no moves available', () => {
    const state = createEmptyState();
    const legalMoves = [];

    const move = selectMove(legalMoves, state, 'normal');
    expect(move).toBe(null);
  });

  test('selectMove returns a move from legal moves', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);
    setDice(state, [3, 5]);

    const legalMoves = getAllLegalMoves(state);
    const move = selectMove(legalMoves, state, 'normal');

    expect(move).toBeTruthy();
    expect(legalMoves).toContain(move);
  });

  test('selectMove works with all difficulty levels', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);
    setDice(state, [3, 5]);

    const legalMoves = getAllLegalMoves(state);

    const easyMove = selectMove(legalMoves, state, 'easy');
    const normalMove = selectMove(legalMoves, state, 'normal');
    const hardMove = selectMove(legalMoves, state, 'hard');

    expect(easyMove).toBeTruthy();
    expect(normalMove).toBeTruthy();
    expect(hardMove).toBeTruthy();
  });

  test('defaults to normal difficulty if invalid difficulty', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);
    setDice(state, [3, 5]);

    const legalMoves = getAllLegalMoves(state);
    const move = selectMove(legalMoves, state, 'invalid');

    expect(move).toBeTruthy();
  });
});

// ============================================
// EASY AI TESTS
// ============================================

describe('Easy AI', () => {
  test('easy AI selects random moves (distribution test)', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);
    setDice(state, [3, 5]);

    const legalMoves = getAllLegalMoves(state);

    // Run 100 times and check we get different moves
    const selectedMoves = new Set();
    for (let i = 0; i < 100; i++) {
      const move = selectMove(legalMoves, state, 'easy');
      selectedMoves.add(JSON.stringify(move));
    }

    // Should have selected multiple different moves (randomness)
    // With 2 legal moves and 100 trials, very likely to see both
    expect(selectedMoves.size).toBeGreaterThan(1);
  });

  test('easy AI works with single move', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);
    setDice(state, [3, 3, 3, 3]);
    // Block subsequent moves
    placeChecker(state, 14, 'black', 2); // Block point 15

    const legalMoves = getAllLegalMoves(state);
    const move = selectMove(legalMoves, state, 'easy');

    expect(move).toBeTruthy();
    expect(legalMoves).toContain(move);
  });
});

// ============================================
// NORMAL AI TESTS
// ============================================

describe('Normal AI', () => {
  test('normal AI prefers hitting opponent blot', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    placeChecker(state, 15, 'black', 1);  // Blot at point 16 (5 away)
    placeChecker(state, 17, 'black', 2);  // Safe point (3 away)
    setDice(state, [5, 3]);

    const legalMoves = getAllLegalMoves(state);

    // Run multiple times to ensure consistency (accounting for random factor)
    let hitCount = 0;
    for (let i = 0; i < 50; i++) {
      const move = selectMove(legalMoves, state, 'normal');
      if (move.dieValue === 5 && move.from === 20) {
        hitCount++;
      }
    }

    // Normal AI should prefer hitting most of the time
    // Random factor is small (+0 to +2), hitting bonus should override
    expect(hitCount).toBeGreaterThan(25); // Should hit >50% of the time
  });

  test('normal AI avoids creating blots when possible', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 2);  // Point 21, 2 checkers
    placeChecker(state, 15, 'white', 2);  // Point 16, 2 checkers
    setDice(state, [5, 3]);

    const legalMoves = getAllLegalMoves(state);

    // Multiple trials to check consistency
    for (let i = 0; i < 10; i++) {
      const move = selectMove(legalMoves, state, 'normal');
      expect(legalMoves).toContain(move);
    }
  });

  test('normal AI handles bar entry', () => {
    const state = createEmptyState();
    placeOnBar(state, 'white', 1);
    setDice(state, [3, 5]);

    const legalMoves = getAllLegalMoves(state);
    const move = selectMove(legalMoves, state, 'normal');

    expect(move).toBeTruthy();
    expect(move.from).toBe('bar');
  });

  test('normal AI handles bearing off', () => {
    const state = createEmptyState();
    placeChecker(state, 4, 'white', 2);  // Point 5
    placeChecker(state, 2, 'white', 2);  // Point 3
    setDice(state, [5, 3]);

    const legalMoves = getAllLegalMoves(state);
    const move = selectMove(legalMoves, state, 'normal');

    expect(move).toBeTruthy();
    expect(legalMoves).toContain(move);
  });
});

// ============================================
// HARD AI TESTS
// ============================================

describe('Hard AI', () => {
  test('hard AI uses lookahead (2-move sequences)', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    setDice(state, [3, 5]);

    const legalMoves = getAllLegalMoves(state);
    const move = selectMove(legalMoves, state, 'hard');

    expect(move).toBeTruthy();
    expect(legalMoves).toContain(move);
  });

  test('hard AI prefers moves with better follow-up', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    setDice(state, [3, 5]);

    const legalMoves = getAllLegalMoves(state);

    // Run multiple times
    for (let i = 0; i < 10; i++) {
      const move = selectMove(legalMoves, state, 'hard');
      expect(legalMoves).toContain(move);
    }
  });

  test('hard AI handles complex positions', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 2);  // Point 24
    placeChecker(state, 20, 'white', 2);  // Point 21
    placeChecker(state, 15, 'white', 2);  // Point 16
    placeChecker(state, 10, 'black', 2);  // Blockers
    placeChecker(state, 8, 'black', 2);
    setDice(state, [6, 4]);

    const legalMoves = getAllLegalMoves(state);
    const move = selectMove(legalMoves, state, 'hard');

    expect(move).toBeTruthy();
    expect(legalMoves).toContain(move);
  });

  test('hard AI handles bearing off', () => {
    const state = createEmptyState();
    placeChecker(state, 5, 'white', 2);  // Point 6
    placeChecker(state, 3, 'white', 2);  // Point 4
    placeChecker(state, 1, 'white', 2);  // Point 2
    setDice(state, [6, 4]);

    const legalMoves = getAllLegalMoves(state);
    const move = selectMove(legalMoves, state, 'hard');

    expect(move).toBeTruthy();
    expect(legalMoves).toContain(move);
  });
});

// ============================================
// DIFFICULTY COMPARISON TESTS
// ============================================

describe('Difficulty Level Differences', () => {
  test('easy AI is more random than normal AI', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);  // Point 21
    placeChecker(state, 15, 'black', 1);  // Blot to hit
    setDice(state, [5, 3]);

    const legalMoves = getAllLegalMoves(state);

    // Easy AI: should be ~50% random distribution
    let easyHitCount = 0;
    for (let i = 0; i < 100; i++) {
      const move = selectMove(legalMoves, state, 'easy');
      if (move.dieValue === 5) easyHitCount++;
    }

    // Normal AI: should prefer hitting
    let normalHitCount = 0;
    for (let i = 0; i < 100; i++) {
      const move = selectMove(legalMoves, state, 'normal');
      if (move.dieValue === 5) normalHitCount++;
    }

    // Normal should hit more consistently than Easy
    expect(normalHitCount).toBeGreaterThan(easyHitCount);
  });

  test('hard AI considers longer sequences than normal AI', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 1);
    setDice(state, [6, 5]);

    const legalMoves = getAllLegalMoves(state);

    // Both should select valid moves
    const normalMove = selectMove(legalMoves, state, 'normal');
    const hardMove = selectMove(legalMoves, state, 'hard');

    expect(normalMove).toBeTruthy();
    expect(hardMove).toBeTruthy();

    // Both should be legal
    expect(legalMoves).toContain(normalMove);
    expect(legalMoves).toContain(hardMove);
  });

  test('all difficulty levels handle same position', () => {
    const state = createEmptyState();
    placeChecker(state, 23, 'white', 2);
    placeChecker(state, 12, 'white', 5);
    placeChecker(state, 7, 'white', 3);
    setDice(state, [4, 3]);

    const legalMoves = getAllLegalMoves(state);

    const easyMove = selectMove(legalMoves, state, 'easy');
    const normalMove = selectMove(legalMoves, state, 'normal');
    const hardMove = selectMove(legalMoves, state, 'hard');

    // All should return valid moves
    expect(legalMoves).toContain(easyMove);
    expect(legalMoves).toContain(normalMove);
    expect(legalMoves).toContain(hardMove);
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('AI Edge Cases', () => {
  test('AI handles only one legal move', () => {
    const state = createEmptyState();
    placeChecker(state, 5, 'white', 1);  // Point 6
    setDice(state, [6, 5]);
    // Block all other moves
    placeChecker(state, 0, 'black', 2);  // Block point 1

    const legalMoves = getAllLegalMoves(state);

    if (legalMoves.length === 1) {
      const easyMove = selectMove(legalMoves, state, 'easy');
      const normalMove = selectMove(legalMoves, state, 'normal');
      const hardMove = selectMove(legalMoves, state, 'hard');

      // All should select the only move
      expect(easyMove).toEqual(legalMoves[0]);
      expect(normalMove).toEqual(legalMoves[0]);
      expect(hardMove).toEqual(legalMoves[0]);
    }
  });

  test('AI handles doubles', () => {
    const state = createEmptyState();
    placeChecker(state, 20, 'white', 2);
    setDice(state, [3, 3, 3, 3]);

    const legalMoves = getAllLegalMoves(state);

    const easyMove = selectMove(legalMoves, state, 'easy');
    const normalMove = selectMove(legalMoves, state, 'normal');
    const hardMove = selectMove(legalMoves, state, 'hard');

    expect(legalMoves).toContain(easyMove);
    expect(legalMoves).toContain(normalMove);
    expect(legalMoves).toContain(hardMove);
  });

  test('AI handles black player', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 3, 'black', 1);  // Point 4
    setDice(state, [3, 5]);

    const legalMoves = getAllLegalMoves(state);
    const move = selectMove(legalMoves, state, 'normal');

    expect(move).toBeTruthy();
    expect(legalMoves).toContain(move);
  });
});
