/**
 * Dice Consumption Tests for Backgammon
 *
 * REGRESSION TEST for dice reuse bug
 *
 * This test file should be added as:
 * src/games/backgammon/__tests__/diceConsumption.test.js
 *
 * Tests that dice are properly marked as used after moves,
 * specifically for bar entry which had a critical bug.
 */

import { gameReducer, ActionTypes } from '../gameState';
import {
  createEmptyState,
  placeChecker,
  placeOnBar,
  setDice
} from './test-helpers';

describe('Dice Consumption - Bar Entry', () => {
  describe('White Player Bar Entry', () => {
    test('die 1: marked as used after entering at point 24', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      setDice(state, [6, 1]);

      // Enter from bar with die 1 (to point 24, index 23)
      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 23 }
      });

      // Die 1 (index 1) should be marked as used
      expect(stateAfter.diceUsed[1]).toBe(true);
      expect(stateAfter.diceUsed[0]).toBe(false);

      // Only die 6 should remain available
      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([6]);
    });

    test('die 2: marked as used after entering at point 23', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      setDice(state, [5, 2]);

      // Enter from bar with die 2 (to point 23, index 22)
      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 22 }
      });

      expect(stateAfter.diceUsed[1]).toBe(true);
      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([5]);
    });

    test('die 3: marked as used after entering at point 22', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      setDice(state, [6, 3]);

      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 21 }
      });

      expect(stateAfter.diceUsed[1]).toBe(true);
      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([6]);
    });

    test('die 4: marked as used after entering at point 21', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      setDice(state, [6, 4]);

      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 20 }
      });

      expect(stateAfter.diceUsed[1]).toBe(true);
      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([6]);
    });

    test('die 5: marked as used after entering at point 20', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      setDice(state, [6, 5]);

      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 19 }
      });

      expect(stateAfter.diceUsed[1]).toBe(true);
      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([6]);
    });

    test('die 6: marked as used after entering at point 19', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      setDice(state, [6, 3]);

      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 18 }
      });

      expect(stateAfter.diceUsed[0]).toBe(true);
      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([3]);
    });
  });

  describe('Black Player Bar Entry', () => {
    test('die 1: marked as used after entering at point 1', () => {
      const state = createEmptyState();
      state.currentPlayer = 'black';
      placeOnBar(state, 'black', 1);
      setDice(state, [3, 1]);

      // Enter from bar with die 1 (to point 1, index 0)
      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 0 }
      });

      expect(stateAfter.diceUsed[1]).toBe(true);
      expect(stateAfter.diceUsed[0]).toBe(false);

      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([3]);
    });

    test('die 2: marked as used after entering at point 2', () => {
      const state = createEmptyState();
      state.currentPlayer = 'black';
      placeOnBar(state, 'black', 1);
      setDice(state, [5, 2]);

      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 1 }
      });

      expect(stateAfter.diceUsed[1]).toBe(true);
      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([5]);
    });

    test('die 3: marked as used after entering at point 3', () => {
      const state = createEmptyState();
      state.currentPlayer = 'black';
      placeOnBar(state, 'black', 1);
      setDice(state, [6, 3]);

      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 2 }
      });

      expect(stateAfter.diceUsed[1]).toBe(true);
      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([6]);
    });

    test('die 6: marked as used after entering at point 6', () => {
      const state = createEmptyState();
      state.currentPlayer = 'black';
      placeOnBar(state, 'black', 1);
      setDice(state, [6, 2]);

      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 5 }
      });

      expect(stateAfter.diceUsed[0]).toBe(true);
      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([2]);
    });
  });

  describe('Dice Reuse Prevention', () => {
    test('white cannot reuse die after bar entry', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      placeChecker(state, 10, 'white', 2); // Checker at point 11
      setDice(state, [3, 1]);

      // Enter from bar with die 1
      const state2 = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 23 }
      });

      // Now should have only 1 die left (die 3), not both
      const remaining = state2.dice.filter((d, i) => !state2.diceUsed[i]);
      expect(remaining).toHaveLength(1);
      expect(remaining).toEqual([3]);

      // Exactly one die should be marked as used
      const usedCount = state2.diceUsed.filter(used => used).length;
      expect(usedCount).toBe(1);
    });

    test('black cannot reuse die after bar entry', () => {
      const state = createEmptyState();
      state.currentPlayer = 'black';
      placeOnBar(state, 'black', 1);
      placeChecker(state, 10, 'black', 2);
      setDice(state, [4, 2]);

      // Enter from bar with die 2
      const state2 = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 1 }
      });

      // Should have only die 4 left
      const remaining = state2.dice.filter((d, i) => !state2.diceUsed[i]);
      expect(remaining).toHaveLength(1);
      expect(remaining).toEqual([4]);

      const usedCount = state2.diceUsed.filter(used => used).length;
      expect(usedCount).toBe(1);
    });

    test('doubles: die is consumed after each bar entry', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 2);
      setDice(state, [3, 3, 3, 3]); // Doubles

      // First entry
      const state2 = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 21 }
      });

      // Should have 3 dice left
      let remaining = state2.dice.filter((d, i) => !state2.diceUsed[i]);
      expect(remaining).toHaveLength(3);

      // Second entry
      const state3 = gameReducer(state2, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 21 }
      });

      // Should have 2 dice left
      remaining = state3.dice.filter((d, i) => !state3.diceUsed[i]);
      expect(remaining).toHaveLength(2);
    });

    test('regression: white die 1 cannot be reused (original bug report)', () => {
      // This is the EXACT scenario from the bug report:
      // "When coming off the bar with a 1, you can reuse the 1"
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      setDice(state, [6, 1]);

      // Enter with die 1
      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 23 }  // Point 24
      });

      // CRITICAL: Die 1 MUST be marked as used
      expect(stateAfter.diceUsed[1]).toBe(true);

      // CRITICAL: Die 1 must NOT be available for reuse
      const available = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(available).not.toContain(1);
      expect(available).toEqual([6]);
    });
  });

  describe('Edge Cases', () => {
    test('all dice consumed after moves', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      placeChecker(state, 15, 'white', 1);
      setDice(state, [3, 6]);

      // Use die 3 for bar entry
      const state2 = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 21 }
      });

      // Use die 6 for regular move
      const state3 = gameReducer(state2, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 15, to: 9 }
      });

      // All dice should be used
      expect(state3.diceUsed).toEqual([true, true]);
      const remaining = state3.dice.filter((d, i) => !state3.diceUsed[i]);
      expect(remaining).toHaveLength(0);
    });

    test('correct die is marked when dice have same value', () => {
      const state = createEmptyState();
      placeOnBar(state, 'white', 1);
      setDice(state, [3, 3]); // Same value (not doubles)

      const stateAfter = gameReducer(state, {
        type: ActionTypes.MOVE_CHECKER,
        payload: { from: 'bar', to: 21 }
      });

      // Should mark the first matching die (index 0)
      expect(stateAfter.diceUsed[0]).toBe(true);
      expect(stateAfter.diceUsed[1]).toBe(false);

      const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
      expect(remaining).toEqual([3]);
    });
  });
});

describe('Dice Consumption - Regular Moves', () => {
  test('white regular move consumes die', () => {
    const state = createEmptyState();
    placeChecker(state, 15, 'white', 1);
    setDice(state, [5, 3]);

    const stateAfter = gameReducer(state, {
      type: ActionTypes.MOVE_CHECKER,
      payload: { from: 15, to: 10 }  // Move 5 pips
    });

    expect(stateAfter.diceUsed[0]).toBe(true);
    const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
    expect(remaining).toEqual([3]);
  });

  test('black regular move consumes die', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 10, 'black', 1);
    setDice(state, [4, 2]);

    const stateAfter = gameReducer(state, {
      type: ActionTypes.MOVE_CHECKER,
      payload: { from: 10, to: 14 }  // Move 4 pips
    });

    expect(stateAfter.diceUsed[0]).toBe(true);
    const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
    expect(remaining).toEqual([2]);
  });
});

describe('Dice Consumption - Bearing Off', () => {
  test('white bearing off consumes die', () => {
    const state = createEmptyState();
    placeChecker(state, 2, 'white', 1); // Point 3
    setDice(state, [6, 3]);

    const stateAfter = gameReducer(state, {
      type: ActionTypes.MOVE_CHECKER,
      payload: { from: 2, to: 'bearOff' }
    });

    expect(stateAfter.diceUsed[1]).toBe(true);
    const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
    expect(remaining).toEqual([6]);
  });

  test('black bearing off consumes die', () => {
    const state = createEmptyState();
    state.currentPlayer = 'black';
    placeChecker(state, 20, 'black', 1); // Point 21
    setDice(state, [5, 4]);

    const stateAfter = gameReducer(state, {
      type: ActionTypes.MOVE_CHECKER,
      payload: { from: 20, to: 'bearOff' }
    });

    expect(stateAfter.diceUsed[1]).toBe(true);
    const remaining = stateAfter.dice.filter((d, i) => !stateAfter.diceUsed[i]);
    expect(remaining).toEqual([5]);
  });
});
